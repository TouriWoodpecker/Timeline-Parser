import { GoogleGenAI, Type } from "@google/genai";
import { ParsedEntry, CorpusItem } from "../types";
import { callGenerativeAI } from "./aiUtils";
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
                description: "Deine prägnante Zusammenfassung der Kernaussage.",
            },
            zugeordneteKategorien: {
                type: Type.STRING,
                description: "Nummer(n) aus dem Wissenskorpus, z.B. '7(a); 19(b)' ODER 'Irrelevant / Prozedural'.",
            },
            begruendung: {
                type: Type.STRING,
                description: "Deine kurze Begründung, warum der Inhalt zur Kategorie passt ODER warum er prozedural ist.",
            },
        },
        required: ["id", "kernaussage", "zugeordneteKategorien", "begruendung"],
    }
};


export async function analyzeEntries(entries: ParsedEntry[]): Promise<ParsedEntry[]> {
    if (!ai) {
        throw new Error("GoogleGenAI client not initialized. Check API key configuration.");
    }
    if (entries.length === 0) {
        return [];
    }
    
    const combinedTextToAnalyze = entries.map(entry => `ID ${entry.id}: Frage: ${entry.question || 'N/A'}\nAntwort: ${entry.answer || 'N/A'}`).join('\n\n');
    
    const corpusWithEmbeddings = await getCorpusEmbeddings();
    const queryEmbedding = await createQueryEmbedding(combinedTextToAnalyze);
    const similarItems = findMostSimilar(queryEmbedding, corpusWithEmbeddings, 15);
    const context = similarItems.map(item => `- ID ${item.id} (${item.category}): ${item.description}`).join('\n');

    const entriesToAnalyzeString = entries.map(entry => `
        ---
        **ID:** ${entry.id}
        **Frage:** ${entry.question}
        **Antwort:** ${entry.answer}
        ---
    `).join('\n');

    try {
        const prompt = `
1. Rolle und Ziel
Du bist ein KI-Analyst (Gemini Gem), spezialisiert auf die Analyse von politischen Protokollen und Dokumenten im Kontext des "ZwU-Nord Stream 2" in Mecklenburg-Vorpommern. Deine Analyseperspektive ist die eines progressiven Verteidigers der SPD. Dein Standpunkt ist, dass es sich um übliche Vorgänge handelt und die Vorwürfe wirklich bewiesen werden müssen. Gleichzeitig bist du offen für in den Vorwürfen enthatlene Kritiken. Du nimmst die Anschuldigungen nicht unbedingt als Wahrheit an, wenn ihnen keine legitime, kohärente Argumentation vorausgeht.

Deine Aufgabe ist es, einen dir vorgelegten Text (z.B. eine Zeugenaussage, einen Protokollauszug) zu analysieren. Du musst die Kernaussage(n) dieses Textes identifizieren und sie präzise den Kategorien eines festen Wissenskorpus zuordnen.

2. Primärer Wissenskorpus (Dein Kategorien-Katalog)
Dein einziger Referenzrahmen für die Spalte "Zugeordnete Kategorie(n)" sind die folgenden relevanten Auszüge aus dem Wissenskorpus. Nur die Nummern dieser Punkte (z.B. "1a", "7", "11b") dürfen verwendet werden.

[START RELEVANTER WISSENSKORPUS]
${context}
[ENDE RELEVANTER WISSENSKORPUS]

3. Ausführungsregeln
Input: Du erhältst einen Block von mehreren aufeinanderfolgenden Frage-Antwort-Paaren. Nutze den Kontext der umgebenden Einträge, um jeden einzelnen Eintrag besser zu verstehen.
Verarbeitung (Dein "Chain of Thought" für JEDEN EINZELNEN Eintrag):
a. Lies den Eintrag und identifiziere die zentrale(n) Kernaussage(n). Wer (Akteur) tut was (Sachthema)?
b. Vergleiche den semantischen Inhalt (Akteure und Sachthema) dieser Kernaussage mit den Punkten aus dem RELEVANTEN Wissenskorpus.
c. Finde die spezifische(n) Kategorie(n)-Nummer(n), die den Inhalt beschreiben. (z.B. wenn es sich um "Pegel" und "gelöschte E-Mails" geht, finde die entsprechende ID).
Sonderfall "Irrelevant / Prozedural":
- Wenn eine Aussage keine inhaltliche Substanz zu einem Sachthema oder Akteur liefert, oder ausschließlich eine prozedurale Rückfrage (z.B. "Von wann ist das?"), eine Zeitangabe (z.B. "Das war 2021.") oder eine reine Gesprächsfloskel ist, klassifiziere sie als "Irrelevant / Prozedural".
- Sei besonders gründlich bei der Anwendung der Punkte 19, 19 a, 19 b. Wenn es sich nicht um Regierungsvertreter (19 a) handelt oder die Klimastiftung (19 b), oder Fehlende Dokumentation (19), dann fällt generelle Kommunikation nicht unter einen dieser Punkte.
- Wenn eine Aussage auf eine bereits getätigte Aussage im selben Input-Text basiert ohne etwas substantielles hinzuzufügen, verweise auf die bereits getätigte Einordnung von dir. (Beispielsweise: "s. Fr. / Ant. 170")

**Input-Block zur Analyse:**
${entriesToAnalyzeString}

**Output-Format:**
Dein Output muss ausschließlich ein valides JSON-Array sein. Jedes Objekt im Array repräsentiert einen analysierten Eintrag aus dem Input-Block und muss dem Schema entsprechen. Das Array muss exakt einen Eintrag für jeden Input-Eintrag enthalten.
        `;

        const responseText = await callGenerativeAI(ai, 'gemini-2.5-pro', prompt, {
            responseMimeType: 'application/json',
            responseSchema: chunkAnalysisSchema,
        });

        const cleanedJsonString = responseText.replace(/^```json\s*|```\s*$/g, '');
        const analysisResults = JSON.parse(cleanedJsonString);

        const updatedEntries = entries.map(originalEntry => {
            const analysisResult = analysisResults.find((r: any) => r.id === originalEntry.id);
            if (analysisResult) {
                return {
                    ...originalEntry,
                    kernaussage: analysisResult.kernaussage,
                    zugeordneteKategorien: analysisResult.zugeordneteKategorien,
                    begruendung: analysisResult.begruendung,
                };
            }
            return {
                ...originalEntry,
                kernaussage: "Error: No analysis result returned for this ID from the model.",
            };
        });

        return updatedEntries;

    } catch (error) {
        console.error(`Error analyzing chunk starting with ID ${entries[0]?.id}:`, error);
        throw new Error(`Failed to analyze chunk: ${error instanceof Error ? error.message : String(error)}`);
    }
}