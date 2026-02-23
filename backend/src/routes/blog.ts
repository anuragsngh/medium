
import { Hono } from "hono";
import { verify } from "hono/jwt";
import { PrismaClient } from "@prisma/client/edge"
import { withAccelerate } from "@prisma/extension-accelerate";

export const blogRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    JWT_SECRET: string;
    ML_BASE_URL: string;
  };
  Variables: {
    userId: number;
  };
}>();

/* =====================================================
   HEALTH CHECK
===================================================== */
blogRouter.get("/ping", (c) => c.text("pong"));

/* =====================================================
   SEARCH - PUBLIC
===================================================== */
blogRouter.get("/search", async (c) => {
  const query = c.req.query("q") || "";
  if (!query.trim()) return c.json({ blogs: [] });

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const mlRes = await fetch(`${c.env.ML_BASE_URL}/semantic-search`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, top_k: 10 }),
    });

    if (mlRes.ok) {
      const mlData = await mlRes.json() as { results: { blogId: number; score: number }[] };
      const results = mlData.results;

      if (results && results.length > 0) {
        const blogIds = results.map((r) => r.blogId);
        const blogs = await prisma.blog.findMany({
          where: { id: { in: blogIds }, published: true },
          select: {
            id: true,
            title: true,
            content: true,
            author: { select: { name: true } },
          },
        });

        const scoreMap = new Map(results.map((r) => [r.blogId, r.score]));
        blogs.sort(
          (a: { id: number }, b: { id: number }) =>
            (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0)
        );

        return c.json({ blogs, source: "ml" });
      }
    }
  } catch (e) {
    console.log("ML search failed, falling back to DB search:", e);
  }

  const blogs = await prisma.blog.findMany({
    where: {
      published: true,
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      title: true,
      content: true,
      author: { select: { name: true } },
    },
    take: 10,
  });

  return c.json({ blogs, source: "db" });
});

/* =====================================================
   INGEST - INTERNAL
===================================================== */
blogRouter.post("/ingest", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();

  if (!body.title || !body.content) {
    c.status(400);
    return c.json({ error: "title and content required" });
  }

  let systemUser = await prisma.user.findFirst({
    where: { username: "system@blog.com" },
  });

  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        username: "system@blog.com",
        password: "system-internal",
        name: body.author || "System",
      },
    });
    console.log("Created system user with id:", systemUser.id);
  }

  const blog = await prisma.blog.create({
    data: {
      title:     body.title,
      content:   body.content,
      published: body.published ?? true,
      authorId:  systemUser.id,
    },
  });

  return c.json({ id: blog.id });
});

/* =====================================================
   BULK - ALL PUBLISHED BLOGS (PUBLIC)
===================================================== */
blogRouter.get("/bulk", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const blogs = await prisma.blog.findMany({
    where: { published: true },
    select: {
      id: true,
      title: true,
      content: true,
      author: { select: { name: true } },
    },
    orderBy: { id: "desc" },
    take: 20,
  });

  return c.json({ blogs });
});

/* =====================================================
   AUTH MIDDLEWARE
===================================================== */
blogRouter.use("/*", async (c, next) => {
  if (c.req.method === "OPTIONS") return next();

  // Skip auth for public routes
  const path = c.req.path;
  console.log("PATH:", path);
  if (
    path.endsWith("/bulk") ||
    path.endsWith("/search") ||
    path.endsWith("/ingest") ||
    path.endsWith("/ping")
  ) {
    return next();
  }

  const authHeader = c.req.header("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    c.status(401);
    return c.json({ message: "Missing or invalid Authorization header" });
  }

  const token = authHeader.slice(7);

  try {
    const payload = (await verify(token, c.env.JWT_SECRET, "HS256")) as { id: number };
    c.set("userId", payload.id);
    await next();
  } catch {
    c.status(403);
    return c.json({ message: "Invalid or expired token" });
  }
});

/* =====================================================
   CREATE BLOG
===================================================== */
blogRouter.post("/", async (c) => {
  const body = await c.req.json();

  if (!body.title || !body.content) {
    c.status(400);
    return c.json({ message: "Title and content are required" });
  }

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const userId = c.get("userId");

  const blog = await prisma.blog.create({
    data: {
      title:     body.title,
      content:   body.content,
      published: body.published ?? true,
      authorId:  userId,
    },
  });

  return c.json({ id: blog.id });
});

/* =====================================================
   MY BLOGS
===================================================== */
blogRouter.get("/my", async (c) => {
  const userId = c.get("userId");

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const blogs = await prisma.blog.findMany({
    where: { authorId: userId },
    select: {
      id: true,
      title: true,
      content: true,
      published: true,
    },
    orderBy: { id: "desc" },
  });

  return c.json({ blogs });
});

/* =====================================================
   RECOMMEND - ML-BASED (AUTHENTICATED)
===================================================== */
blogRouter.post("/recommend", async (c) => {
  const body = await c.req.json();
  const queries: string[] = body.user_queries || ["technology"];
  const top_k: number = body.top_k || 10;

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  try {
    const mlRes = await fetch(`${c.env.ML_BASE_URL}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_queries: queries, top_k }),
    });

    if (mlRes.ok) {
      const mlData = await mlRes.json() as { results: { blogId: number; score: number }[] };
      const results = mlData.results;

      if (results && results.length > 0) {
        const blogIds = results.map((r) => r.blogId);
        const blogs = await prisma.blog.findMany({
          where: { id: { in: blogIds }, published: true },
          select: {
            id: true,
            title: true,
            content: true,
            author: { select: { name: true } },
          },
        });

        const scoreMap = new Map(results.map((r) => [r.blogId, r.score]));
        blogs.sort(
          (a: { id: number }, b: { id: number }) =>
            (scoreMap.get(b.id) ?? 0) - (scoreMap.get(a.id) ?? 0)
        );

        return c.json({ blogs, source: "ml" });
      }
    }
  } catch (e) {
    console.log("ML recommend failed, falling back:", e);
  }

  const blogs = await prisma.blog.findMany({
    where: { published: true },
    select: {
      id: true,
      title: true,
      content: true,
      author: { select: { name: true } },
    },
    orderBy: { id: "desc" },
    take: top_k,
  });

  return c.json({ blogs, source: "fallback" });
});

/* =====================================================
   GET SINGLE BLOG
===================================================== */
blogRouter.get("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const blog = await prisma.blog.findFirst({
    where: { id },
    select: {
      id: true,
      title: true,
      content: true,
      published: true,
      author: { select: { name: true } },
    },
  });

  if (!blog) {
    c.status(404);
    return c.json({ message: "Blog not found" });
  }

  return c.json({ blog });
});

blogRouter.put("/:id", async (c) => {
  const id = parseInt(c.req.param("id"));
  const userId = c.get("userId");
  const body = await c.req.json();

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const blog = await prisma.blog.updateMany({
    where: { id, authorId: userId },
    data: {
      title:     body.title,
      content:   body.content,
      published: body.published,
    },
  });

  return c.json({ message: "Blog updated", blog });
});