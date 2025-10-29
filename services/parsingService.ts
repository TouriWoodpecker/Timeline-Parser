import { GoogleGenAI, Type } from "@google/genai";
import { ParsedEntry } from "../types";

// Initialize the Google AI client
let ai: GoogleGenAI;
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set. Womit wollen Sie bezahlen? Mit Luft?");
}
try {
  ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
} catch (error) {
  console.error("Failed to initialize GoogleGenAI.", error);
  throw new Error("Failed to initialize GoogleGenAI.");
}

// The schema the AI MUST adhere to.
const parsingSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        description: "Ein einzelner Eintrag: Entweder ein Q&A-Paar oder eine prozedurale Notiz.",
        properties: {
            sourceReference: {
                type: Type.STRING,
                description: "Die Fundstelle, die aus den Parametern generiert wird (z.B. 'WP80/06').",
            },
            questioner: {
                type: Type.STRING,
                description: "Der Fragesteller (z.B. 'Abg. Müller (SPD)'). Null, wenn Notiz.",
            },
            question: {
                type: Type.STRING,
                description: "Der volle Text der Frage. Null, wenn Notiz.",
            },
            witness: {
                type: Type.STRING,
                description: "Der Antwortende (z.B. 'Zeuge Dr. Schmidt'). Null, wenn Notiz.",
            },
            answer: {
                type: Type.STRING,
                description: "Der volle Text der Antwort. Null, wenn Notiz.",
            },
            note: {
                type: Type.STRING,
                description: "Eine prozedurale Notiz (z.B. '(Beifall bei der CDU)'). Wenn dies gesetzt ist, sind die Q&A-Felder null.",
            },
        },
        required: ["sourceReference"], // AI must at least set the source reference.
    },
};

/**
 * Baut den Prompt für die KI, inklusive der Metadaten.
 */
function buildPrompt(textChunk: string, protocolId: string, pageNumber: number): string {
    // Sorgt für "06" statt "6"
    const paddedPageNumber = String(pageNumber).padStart(2, '0');
    const sourceRef = `${protocolId}/${paddedPageNumber}`;

    return `
    Du bist ein Experte im Parsen von deutschen parlamentarischen Protokollen.
    Deine Aufgabe ist es, den Text in eine Reihe von Einträgen zu zerlegen:
    1.  **Frage-Antwort-Paare**: Ein Eintrag, der eine Frage UND die darauf folgende Antwort enthält.
    2.  **Notizen**: Ein Eintrag für alles andere (Zwischenrufe, Vorsitzenden-Anweisungen, Beifall).

    REGELN:
    -   **Fundstelle (sourceReference):** Verwende für JEDEN Eintrag, den du in diesem Chunk findest, die Fundstelle: "${sourceRef}".
    -   **JSON-Gültigkeit:** Deine Antwort MUSS ein valides JSON-Array sein. ALLES andere wird ignoriert.
    -   **Genauigkeit:** Extrahiere den Text wörtlich.
    -   **Logik:** Wenn ein Sprecher (z.B. "Vorsitzender") eine prozedurale Ansage macht, ist das eine "note". Wenn er eine Frage stellt, ist es ein "questioner".
    -   **WICHTIGSTE REGEL (NEU):** Wenn der Text-Chunk KEINEN relevanten Inhalt enthält (d.h. keine Sprecherzeilen, keine Klammer-Notizen, sondern nur Metadaten, Kopf-/Fußzeilen, Seitenzahlen oder Artefakte), dann und NUR dann gib ein **leeres Array** zurück: \`[]\`. Gib NICHTS anderes zurück, nur \`[]\`.

    BEISPIEL 1 (Q&A):
    Text: "Abg. Müller (SPD): Waren Sie am 15. am Standort? Zeuge Dr. Schmidt: Ja, das war ich."
    JSON-Ausgabe (als Teil des Arrays):
    {
        "sourceReference": "${sourceRef}",
        "questioner": "Abg. Müller (SPD)",
        "question": "Waren Sie am 15. am Standort?",
        "witness": "Zeuge Dr. Schmidt",
        "answer": "Ja, das war ich.",
        "note": null
    }

    BEISPIEL 2 (Notiz):
    Text: "(Beifall bei der SPD-Fraktion)"
    JSON-Ausgabe (als Teil des Arrays):
    {
        "sourceReference": "${sourceRef}",
        "questioner": null,
        "question": null,
        "witness": null,
        "answer": null,
        "note": "(Beifall bei der SPD-Fraktion)"
    }

    BEISPIEL 3 (Vorsitzender als Notiz):
    Text: "Vorsitzender: Ich weise den Zeugen auf die Wahrheitspflicht hin."
    JSON-Ausgabe (als Teil des Arrays):
    {
        "sourceReference": "${sourceRef}",
        "questioner": null,
        "question": null,
        "witness": null,
        "answer": null,
        "note": "Vorsitzender: Ich weise den Zeugen auf die Wahrheitspflicht hin."
    }

    ---
    PARSE JETZT DEN FOLGENDEN TEXT CHUNK (Fundstelle ${sourceRef}):
    ---
    ${textChunk}
    ---
    `;
}
/**
 * Parses a single text chunk belonging to ONE page.
 *
 * @param textChunk The raw text content (e.g., from one page).
 * @param protocolId The ID of the protocol (e.g., "WP80").
 * @param pageNumber The page number (e.g., 6).
 * @param startIndex The ID counter to ensure unique IDs across all chunks.
 * @returns A promise that resolves to an array of parsed entries.
 */
export async function parseProtocolChunk(
    textChunk: string,
    protocolId: string,
    pageNumber: number,
    startIndex: number
): Promise<ParsedEntry[]> {

    if (!textChunk.trim()) {
        console.log("Text chunk is empty, skipping.");
        return [];
    }

    const prompt = buildPrompt(textChunk, protocolId, pageNumber);

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro', // Use Pro. Flash is not suitable for this.
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: parsingSchema,
            },
        });

        const responseText = response.text.trim();
        
        // This shouldn't be necessary thanks to responseMimeType, but we trust no one.
        const cleanedJsonString = responseText.replace(/^```json\s*|```\s*$/g, '');

        // The AI sometimes returns a single object instead of an array with one object.
        const parsedResult = JSON.parse(cleanedJsonString);
        const resultArray = Array.isArray(parsedResult) ? parsedResult : [parsedResult];

        // Map to our final interface and assign continuous IDs.
        return resultArray.map((item: any, index: number) => ({
            id: startIndex + index,
            sourceReference: item.sourceReference || `${protocolId}/${String(pageNumber).padStart(2, '0')}`,
            questioner: item.questioner || null,
            question: item.question || null,
            witness: item.witness || null,
            answer: item.answer || null,
            note: item.note || null,
        }));

    } catch (error) {
        console.error(`--- ERROR ON PARSING (Chunk: ${protocolId}/${pageNumber}) ---`);
        console.error("Error message:", error instanceof Error ? error.message : String(error));
        console.error("--- Text chunk that caused the error (shortened) ---");
        console.error(textChunk.substring(0, 500) + "...");
        console.error("--- END OF ERROR ---");

        // We throw the error instead of trying to "fix" it.
        throw new Error(`Failed to parse protocol chunk ${protocolId}/${pageNumber}: ${error instanceof Error ? error.message : String(error)}`);
    }
}