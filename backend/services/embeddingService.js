export async function createEmbedding(text) {

  try {

    const res = await fetch("https://api.jina.ai/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.JINA_API_KEY}`
      },
      body: JSON.stringify({
        model: "jina-embeddings-v2-base-en",
        input: [text]
      })
    });

    const data = await res.json();

    if (!data.data || !data.data[0]) {
      throw new Error("Invalid embedding response");
    }

    return data.data[0].embedding;

  } catch (err) {

    console.error("Embedding error:", err.message);

    return [];

  }

}