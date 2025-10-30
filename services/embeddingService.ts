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
 * Creates an embedding for a document in the corpus via the secure proxy.
 */
export async function createEmbedding(text: string): Promise<number[]> {
    const url = '/api/v1/models/text-embedding-004:embedContent';
    const requestBody = {
        model: "models/text-embedding-004", // Required by REST API
        content: { parts: [{ text }] },
        task_type: "RETRIEVAL_DOCUMENT"
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Embedding failed: ${response.status} - ${errorBody.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    return data.embedding.values;
}

/**
 * Creates an embedding for a user query via the secure proxy.
 */
export async function createQueryEmbedding(text: string): Promise<number[]> {
    const url = '/api/v1/models/text-embedding-004:embedContent';
    const requestBody = {
        model: "models/text-embedding-004", // Required by REST API
        content: { parts: [{ text }] },
        task_type: "RETRIEVAL_QUERY"
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(`Embedding failed: ${response.status} - ${errorBody.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    return data.embedding.values;
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