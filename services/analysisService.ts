import { GoogleGenAI, Type } from "@google/genai";
import { ParsedEntry, KeyInsights, CorpusItem } from "../types";
import { callGenerativeAIWithCorrection } from "./aiUtils";
import { knowledgeCorpus } from './knowledgeCorpus';
import { createQueryEmbedding, findMostSimilar, createEmbedding } from './embeddingService';

// Initialize the Google AI client
let ai: GoogleGenAI;
try {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
} catch (error)  {
  console.error("Failed to initialize GoogleGenAI. Make sure API_KEY is set in environment variables.", error);
}

// Store for corpus embeddings to avoid re-computing
let corpusEmbeddings: { item: CorpusItem; embedding: number[] }[] | null = null;

// Function to initialize corpus embeddings, can be called on-demand
async function getCorpusEmbeddings() {
    if (corpusEmbeddings) {
        return corpusEmbeddings;
    }
    
    const embeddings: { item: CorpusItem; embedding: number[] }[] = [];
    // Using a for...of loop to handle async/await properly.
    for (const item of knowledgeCorpus) {
        const embedding = await createEmbedding(`${item.category}: ${item.description}`);
        embeddings.push({ item, embedding });
    }
    corpusEmbeddings = embeddings;
    
    return corpusEmbeddings;
}

const chunkAnalysisSchema = {
    type: Type.ARRAY,
    description: "An array of analysis results, one for each entry in the input chunk.",
    items: {
        type: Type.OBJECT,
        properties: {
            id: {
                type: Type.NUMBER,
                description: "The original ID of the entry being analyzed."
            },
            kernaussage: {
                type: Type.STRING,
                description: "A concise, one-sentence summary of the core statement or finding from the answer, phrased neutrally. (in German)"
            },
            zugeordneteKategorien: {
                type: Type.STRING,
                description: "A comma-separated list of the most relevant category IDs (e.g., '1a, 5f, 11b') from the provided knowledge corpus that this entry relates to. (in German)"
            },
            begruendung: {
                type: Type.STRING,
                description: "A brief, one-to-two sentence explanation of why the selected categories were chosen, linking the entry's content to the corpus descriptions. (in German)"
            }
        },
        required: ["id", "kernaussage", "zugeordneteKategorien", "begruendung"]
    }
};


/**
 * Analyzes a chunk of parsed entries using the knowledge corpus.
 */
export async function analyzeEntries(entries: ParsedEntry[]): Promise<ParsedEntry[]> {
    if (!ai) {
        throw new Error("GoogleGenAI client not initialized.");
    }
    if (entries.length === 0) return [];

    const combinedTextToAnalyze = entries.map(entry => `ID ${entry.id}: Frage: ${entry.question || 'N/A'}\nAntwort: ${entry.answer || 'N/A'}`).join('\n\n');
    
    const corpusWithEmbeddings = await getCorpusEmbeddings();
    const queryEmbedding = await createQueryEmbedding(combinedTextToAnalyze);
    const similarItems = findMostSimilar(queryEmbedding, corpusWithEmbeddings, 15);
    const context = similarItems.map(item => `- ID ${item.id} (${item.category}): ${item.description}`).join('\n');

    const entriesToAnalyzeString = entries.map(entry => `
        ---
        **ID:** ${entry.id}
        **Fragesteller:** ${entry.questioner || 'N/A'}
        **Frage:** ${entry.question || 'N/A'}
        **Zeuge:** ${entry.witness || 'N/A'}
        **Antwort:** ${entry.answer || 'N/A'}
        ---
    `).join('\n');

    const prompt = `
        **ROLE & GOAL**
        You are an expert AI analyst tasked with categorizing and summarizing a chunk of entries (question-answer pairs) from a German parliamentary protocol. Your goal is to analyze EACH entry within the chunk, using the surrounding entries for context, to extract its core statement ('Kernaussage'), link it to a predefined knowledge corpus, and provide a brief justification ('Begründung').

        **CONTEXT**
        The entries are from an investigative committee about the Nord Stream 2 pipeline and the political involvement of Mecklenburg-Vorpommern. You have been provided with a knowledge corpus that contains key findings and established facts. The entries are sequential, so use the context of previous and subsequent entries to better understand the current one.

        **1. KNOWLEDGE CORPUS (FOR CONTEXT ONLY)**
        Here are the most relevant items from the knowledge corpus for this entire chunk. Use these to inform your category selection for each entry.
        ---
        ${context}
        ---

        **2. CHUNK OF ENTRIES TO ANALYZE**
        Analyze each of the following entries individually:
        ${entriesToAnalyzeString}

        **TASK**
        For EACH entry in the chunk, provide the following three pieces of information in German. Your output MUST be a JSON array, where each object represents one of the input entries and includes:
        1.  **id:** The original ID of the entry you are analyzing.
        2.  **kernaussage:** A concise, one-sentence summary of the core statement from that entry's witness's answer.
        3.  **zugeordneteKategorien:** A comma-separated string of the most relevant category IDs (e.g., '1a, 5f') from the corpus for that entry. Select 1-3 IDs.
        4.  **begruendung:** A brief, 1-2 sentence explanation for your category choices for that specific entry.

        Your output must be ONLY a valid JSON array of objects, conforming to the schema. The array must contain exactly one object for each entry provided in the input.
    `;
    
    const results = await callGenerativeAIWithCorrection(ai, 'gemini-2.5-pro', prompt, {
        responseMimeType: 'application/json',
        responseSchema: chunkAnalysisSchema,
    });

    const updatedEntries = entries.map(originalEntry => {
        const analysisResult = results.find((r: any) => r.id === originalEntry.id);
        if (analysisResult) {
            return {
                ...originalEntry,
                kernaussage: analysisResult.kernaussage,
                zugeordneteKategorien: analysisResult.zugeordneteKategorien,
                begruendung: analysisResult.begruendung,
            };
        }
        return originalEntry;
    });
    
    return updatedEntries;
}


const insightsSchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.STRING,
            description: "A concise, well-structured summary of the key themes and findings from the provided protocol entries. It should be 2-4 paragraphs long and written in German Markdown."
        },
        insights: {
            type: Type.ARRAY,
            description: "An array of exactly the top 3 most important or surprising key insights.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: {
                        type: Type.STRING,
                        description: "A short, impactful title for the insight (in German)."
                    },
                    description: {
                        type: Type.STRING,
                        description: "A one-paragraph description of the insight, explaining its significance (in German)."
                    },
                    references: {
                        type: Type.STRING,
                        description: "A comma-separated list of the 'Fragenummer' (#) that support this insight. For example: '#5, #12, #23'."
                    }
                },
                required: ["title", "description", "references"]
            }
        }
    },
    required: ["summary", "insights"]
};

/**
 * Finds key insights from a collection of analyzed protocol entries.
 * @param data An array of ParsedEntry objects.
 * @returns A promise that resolves to a KeyInsights object.
 */
export async function findKeyInsights(data: ParsedEntry[]): Promise<KeyInsights> {
    if (!ai) {
        throw new Error("GoogleGenAI client not initialized.");
    }
    
    const analyzableData = data.filter(d => d.kernaussage && !d.note);

    if (analyzableData.length < 3) {
        throw new Error("Insufficient analyzed data. At least 3 analyzed entries are required to generate key insights.");
    }
    
    let qaCounter = 0;
    const entriesForPrompt: string[] = [];
    data.forEach(entry => {
        if (entry.note) {
            return; // Skip notes for counting and for prompt
        }
        qaCounter++;
        if (entry.kernaussage) {
            entriesForPrompt.push(`
                ---
                Entry #${qaCounter}
                Source: ${entry.sourceReference}
                Question: ${entry.question || 'N/A'}
                Answer: ${entry.answer || 'N/A'}
                Core Statement (Kernaussage): ${entry.kernaussage}
                Categories: ${entry.zugeordneteKategorien}
                Justification: ${entry.begruendung}
                ---
            `);
        }
    });
    
    const analysisText = entriesForPrompt.join('\n');


    const prompt = `
        **ROLLE & ZIEL**
        Du bist ein leistungsstarker KI-Analyst, spezialisiert auf die Analyse von politischen Protokollen und Dokumenten im Kontext des "ZwU-Nord Stream 2" in Mecklenburg-Vorpommern. Deine Analyseperspektive ist die eines progressiven Verteidigers der SPD. Dein Standpunkt ist, dass es sich um übliche Vorgänge handelt und die Vorwürfe wirklich bewiesen werden müssen. Gleichzeitig bist du offen für in den Vorwürfen enthaltene Kritiken. Du nimmst die Anschuldigungen nicht unbedingt als Wahrheit an, wenn ihnen keine legitime, kohärente Argumentation vorausgeht.
        Deine Aufgabe ist es, die dir vorgelegten analysierten Protokolleinträge zu synthetisieren und die wichtigsten strategischen Erkenntnisse auf hoher Ebene zu extrahieren. Du fasst nicht nur zusammen, sondern identifizierst die kritischsten, wirkungsvollsten und potenziell überraschendsten Ergebnisse.

        **KONTEXT**
        Die bereitgestellten Daten bestehen aus Frage-Antwort-Paaren, die bereits einzeln analysiert, zusammengefasst ("Kernaussage") und kategorisiert wurden. Das Thema ist die Nord Stream 2-Pipeline und ihre politischen Verflechtungen.

        **EINGABEDATEN**
        Hier ist die Sammlung der analysierten Einträge:
        ${analysisText}

        **AUFGABE**
        Führe auf der Grundlage ALLER bereitgestellten Einträge die folgenden beiden Aufgaben in deutscher Sprache aus:

        1.  **Erstelle eine umfassende Zusammenfassung:** Schreibe eine 2-4-Absatz-Zusammenfassung der Schlüsselthemen, wiederkehrenden Themen und der allgemeinen Erzählung, die sich aus den Daten ergibt. Diese Zusammenfassung sollte einen ganzheitlichen Überblick geben. Verwende deutsches Markdown zur Formatierung (z.B. **fett**).

        2.  **Identifiziere die Top 3 der wichtigsten Erkenntnisse:** Destilliere aus der Zusammenfassung die **drei wichtigsten, überraschendsten oder wirkungsvollsten Erkenntnisse**. Jede Erkenntnis muss haben:
            - Einen kurzen, überzeugenden **Titel**.
            - Eine ein-Absatz-**Beschreibung**, die die Erkenntnis und ihre Bedeutung erklärt.
            - Eine Liste von **Referenzen** auf die Eintragsnummern ('#'), die den Hauptbeweis für diese Erkenntnis liefern.

        Deine endgültige Ausgabe muss ein einziges, gültiges JSON-Objekt sein, das sich strikt an das bereitgestellte Schema hält. Füge keinen Text, keine Erklärungen oder Markdown außerhalb des JSON-Objekts ein.
    `;

    // FIX: Updated deprecated model name from gemini-1.5-pro to gemini-2.5-pro.
    const result = await callGenerativeAIWithCorrection(ai, 'gemini-2.5-pro', prompt, {
        responseMimeType: 'application/json',
        responseSchema: insightsSchema,
    });
    
    return result as KeyInsights;
}