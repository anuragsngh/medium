
interface MLResult {
  blogId: number;
  score: number;
}

interface MLResponse {
  results: MLResult[];
}

export async function searchBlogsByEmbedding(query: string, mlBaseUrl?: string) {
  if (!query.trim()) return [];

  const ML_URL = mlBaseUrl || "http://127.0.0.1:8000";

  try {
    const res = await fetch(`${ML_URL}/semantic-search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        top_k: 10,
      }),
    });

    if (!res.ok) {
      console.error("ML service error:", res.status);
      return [];
    }

    const data = (await res.json()) as MLResponse;
    return data.results;
  } catch (err) {
    console.error("ML fetch failed:", err);
    return [];
  }
}