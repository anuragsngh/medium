
import { Appbar } from "../components/Appbar";
import { BlogCard } from "../components/BlogCard";
import { BlogSkeleton } from "../components/BlogSkeleton";
import { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../config";

interface Blog {
  id: string | number;
  title: string;
  content: string;
  author?: {
    name?: string;
  };
}

export const Blogs = () => {
  const [loading, setLoading] = useState(true);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "recommended">("all");

  const token = localStorage.getItem("token");

  // Fetch all published blogs
  async function fetchAllBlogs() {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/v1/blog/bulk`);
      setBlogs(res.data.blogs || []);
    } catch (err) {
      console.error("❌ /blog/bulk failed", err);
      // fallback to /my if /bulk not available
      fetchMyBlogs();
    } finally {
      setLoading(false);
    }
  }

  // Fetch my blogs
  async function fetchMyBlogs() {
    try {
      setLoading(true);
      const res = await axios.get(`${BACKEND_URL}/api/v1/blog/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBlogs(res.data.blogs || []);
    } catch (err) {
      console.error("❌ /blog/my failed", err);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }

  // Fetch recommended blogs
  async function fetchRecommended() {
    try {
      setLoading(true);
      // Use recent search history stored in localStorage as user queries
      const history = JSON.parse(localStorage.getItem("searchHistory") || "[]");
      const queries = history.length > 0 ? history : ["technology", "programming"];

      const res = await axios.post(
        `${BACKEND_URL}/api/v1/blog/recommend`,
        { user_queries: queries, top_k: 10 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBlogs(res.data.blogs || []);
    } catch (err) {
      console.error("❌ /recommend failed, falling back to all blogs", err);
      fetchAllBlogs();
    } finally {
      setLoading(false);
    }
  }

  // Search blogs
  async function searchBlogs(q: string) {
    if (!q.trim()) {
      activeTab === "recommended" ? fetchRecommended() : fetchAllBlogs();
      return;
    }
    try {
      setLoading(true);

      // Save to search history for recommendations
      const history = JSON.parse(localStorage.getItem("searchHistory") || "[]");
      const updated = [q, ...history.filter((h: string) => h !== q)].slice(0, 5);
      localStorage.setItem("searchHistory", JSON.stringify(updated));

      const res = await axios.get(
        `${BACKEND_URL}/api/v1/blog/search?q=${encodeURIComponent(q)}`
      );
      setBlogs(res.data.blogs || []);
    } catch (err) {
      console.error("❌ search failed", err);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAllBlogs();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) searchBlogs(searchQuery);
      else activeTab === "recommended" ? fetchRecommended() : fetchAllBlogs();
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Appbar onSearch={(v) => setSearchQuery(v)} />

      {/* Tabs */}
      <div className="flex justify-center gap-6 mt-6 border-b pb-2">
        <button
          onClick={() => { setActiveTab("all"); fetchAllBlogs(); }}
          className={`text-sm font-medium pb-1 ${
            activeTab === "all"
              ? "border-b-2 border-black text-black"
              : "text-gray-400"
          }`}
        >
          All Blogs
        </button>
        <button
          onClick={() => { setActiveTab("recommended"); fetchRecommended(); }}
          className={`text-sm font-medium pb-1 ${
            activeTab === "recommended"
              ? "border-b-2 border-black text-black"
              : "text-gray-400"
          }`}
        >
          Recommended
        </button>
      </div>

      {/* Content */}
      <div className="flex justify-center mt-6 px-4">
        <div className="w-full max-w-2xl">
          {loading ? (
            <>
              <BlogSkeleton />
              <BlogSkeleton />
              <BlogSkeleton />
            </>
          ) : blogs.length === 0 ? (
            <p className="text-gray-400 text-center mt-20">No blogs found</p>
          ) : (
            blogs.map((blog) => (
              <BlogCard
                key={blog.id}
                id={blog.id}
                title={blog.title}
                content={blog.content}
                authorName={blog.author?.name || "Anonymous"}
                publishedDate="Recently"
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};