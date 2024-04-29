import { Hono } from 'hono'
import { cors } from 'hono/cors';
import { userRouter } from './routes/user';
import { blogRouter } from './routes/blog';

export const app = new Hono<{
  Bindings:{
    DATABASE_URL:string,
    JWT_SECRET:string,
  }
}>();

app.use('/*',cors())

app.route("/api/v1/user",userRouter);
app.route("/api/v1/blog",blogRouter);

export default app

// neondb 

// postgresql://mediumdb_owner:M6YUKGT1IlsH@ep-curly-sun-a5smaciv.us-east-2.aws.neon.tech/mediumdb?sslmode=require



// connection pool

// DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiYzYxZjRlYzUtY2U5Ni00YTFkLWE3YzEtZDBjMTE3NGM0N2E5IiwidGVuYW50X2lkIjoiNjI5Y2Y2ZmYwMGUyYjYwNTY2MjJlM2Y3NTZmM2NlNmJmOWQxODQxNTY2M2IzYzJiNDVjMDI2ZDBjOGU2MjVjMiIsImludGVybmFsX3NlY3JldCI6IjAyZTEyNjIxLTlmOTctNDg3Mi05OGQ2LWFmYTM1Y2NkNjk2NSJ9.UD8HVS5mEW5uD17vpZ0kqULtoX08XNCp_24Sqe0UIWA"