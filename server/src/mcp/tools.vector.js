import { ChromaClient } from "chromadb";

const chromaClient = new ChromaClient({
  path: process.env.CHROMA_URL || "http://127.0.0.1:8000",
});

const collectionName = process.env.MCP_COLLECTION || "financial_docs";

/**
 * Ensure that the collection exists and return a handle to it.
 */
async function getOrCreateCollection() {
  const existingCollections = await chromaClient.listCollections();
  const existing = existingCollections.find(
    (collection) => collection.name === collectionName
  );

  if (!existing) {
    await chromaClient.createCollection({ name: collectionName });
  }
  return chromaClient.getCollection({ name: collectionName });
}

/**
 * Upsert (insert or update) documents into Chroma.
 * @param {Object} params
 * @param {Array<{ id: string, text: string, metadata?: object }>} params.documents
 */

export async function vecUpsert({ documents }) {
  if (!Array.isArray(documents) || documents.length === 0) {
    return { count: 0 };
  }

  const collection = await getOrCreateCollection();

  await collection.add({
    ids: documents.map((doc) => doc.id),
    documents: documents.map((doc) => doc.text),
    metadatas: documents.map((doc) => doc.metadata || {}),
  });

  return { count: documents.length };
}

/**
 * Query top-k documents by semantic similarity.
 * @param {Object} params
 * @param {string} params.queryText - The text to search for
 * @param {number} [params.topK=4] - Number of nearest documents to return
 */

export async function vecQuery({ queryText, topK = 4 }) {
  const collection = await getOrCreateCollection();
  const result = await collection.query({
    queryTexts: [queryText],
    nResults: topK,
  });

  return {
    id: result.ids?.[0] || [],
    documents: result.documents?.[0] || [],
    metadatas: result.metadatas?.[0] || [],
    distances: result.distances?.[0] || [],
  };
}
