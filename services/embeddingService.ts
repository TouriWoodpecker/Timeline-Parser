import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI;
try {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
} catch (error) {
  console.error("Failed to initialize GoogleGenAI for embeddings.", error);
  // We don't throw here to allow the main app to load, but embedding calls will fail.
}

// Function to calculate the dot product of two vectors
function dotProduct(vecA: number[], vecB: number[]): number {
    return vecA.reduce((sum, val, i) => sum + val * (vecB[i] || 0), 0);
}

// Function to calculate the magnitude (L2 norm) of a vector
function magnitude(vec: number[]): number {
    return Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0));
}

// Function to calculate cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
    const dot = dotProduct(vecA, vecB);
    const magA = magnitude(vecA);
    const magB = magnitude(vecB);
    if (magA === 0 || magB === 0) {
        return 0; // Avoid division by zero
    }
    return dot / (magA * magB);
}

/**
 * Creates an embedding for a document in the corpus.
 */
export async function createEmbedding(text: string): Promise<number[]> {
    if (!ai) {
        throw new Error("Embedding client not initialized. Check API key.");
    }
    // FIX: Use string literal for taskType as TaskType enum is not exported.
    // FIX: The parameter for content is `contents`, not `content`.
    // FIX: Moved `taskType` into a `config` object to align with the method signature.
    const response = await ai.models.embedContent({
        model: "text-embedding-004",
        contents: text,
        config: {
            taskType: "RETRIEVAL_DOCUMENT"
        }
    });
    // FIX: The response property is `embeddings` (plural array) not `embedding`.
    return response.embeddings[0].values;
}

/**
 * Creates an embedding for a user query.
 */
export async function createQueryEmbedding(text: string): Promise<number[]> {
     if (!ai) {
        throw new Error("Embedding client not initialized. Check API key.");
    }
    // FIX: Use string literal for taskType as TaskType enum is not exported.
    // FIX: The parameter for content is `contents`, not `content`.
    // FIX: Moved `taskType` into a `config` object to align with the method signature.
    const response = await ai.models.embedContent({
        model: "text-embedding-004",
        contents: text,
        config: {
            taskType: "RETRIEVAL_QUERY"
        }
    });
    // FIX: The response property is `embeddings` (plural array) not `embedding`.
    return response.embeddings[0].values;
}

/**
 * Finds the most similar items from a corpus based on cosine similarity.
 */
export function findMostSimilar<T extends { id: string }>(
    queryEmbedding: number[],
    corpus: { item: T; embedding: number[] }[],
    topK: number
): T[] {
    const similarities = corpus.map((corpusItem, index) => ({
        index: index,
        similarity: cosineSimilarity(queryEmbedding, corpusItem.embedding),
    }));

    similarities.sort((a, b) => b.similarity - a.similarity);

    return similarities
        .slice(0, topK)
        .map(sim => corpus[sim.index].item);
}