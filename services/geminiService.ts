import { GoogleGenAI, Type } from '@google/genai';
import type { ProtocolEntry } from '../types';

if (!process.env.API_KEY) {
  // In a real application, you'd want to handle this more gracefully.
  // For this context, we'll throw an error if the API key is missing.
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { 
        type: Type.NUMBER,
        description: 'A unique sequential number for the entry, starting from 1.'
      },
      speaker: {
        type: Type.STRING,
        description: 'The full name and title of the person speaking (e.g., "Vors. Sebastian Ehlers", "Dr. Till Backhaus"). For procedural notes without a speaker, use "Protokoll".'
      },
      role: {
        type: Type.STRING,
        description: 'The role of the speaker. Possible values: "Vorsitzender", "Zeuge", "Abgeordneter", "Rechtsbeistand", "Protokoll".'
      },
      type: {
        type: Type.STRING,
        description: 'The type of entry. Possible values: "Frage", "Antwort", "Verfahrenshinweis".'
      },
      content: {
        type: Type.STRING,
        description: 'The full, verbatim text of what was said or the description of the event.'
      },
      sourceReference: {
        type: Type.STRING,
        description: 'The source reference for the entry, formatted as WPXX/YY where XX is the protocol number found at the start of the document (e.g., from "WP_80/6") and YY is the page number from the OCR marker (e.g., from "==Start of OCR for page 6=="). For example, "WP80/06". Page numbers should be zero-padded to two digits.'
      },
    },
    required: ['id', 'speaker', 'role', 'type', 'content', 'sourceReference'],
  },
};

const buildPrompt = (text: string) => {
  return `
You are an expert assistant specialized in parsing German parliamentary investigation protocols. Your task is to analyze the provided text and extract every conversational turn and procedural note into a structured JSON format conforming to the provided schema.

The text may contain page delimiters like "==Start of OCR for page X==" and "==End of OCR for page X==". Use these to understand the document flow but do not include them in the output content.

Follow these rules precisely:
1.  **CRITICAL JSON VALIDITY:** The output MUST be a perfectly valid JSON array. The most common error is failing to escape double quotes within the 'content' string. ALL double quotes (") inside a string value MUST be escaped with a backslash (\\"). For example, if a speaker says "Das ist wichtig", the JSON content field must be: "content": "Er sagte: \\"Das ist wichtig.\\"". This is absolutely critical for the application to work. Do not terminate the JSON prematurely.
2.  **Identify Entries:** Each entry is a block of text starting with a speaker's name (e.g., "Vors. Sebastian Ehlers:", "Dr. Till Backhaus:", "Abg. Hannes Damm:") or a procedural note in parentheses (e.g., "(Sitzungsunterbrechung von ...)")
3.  **Speaker:** Extract the full speaker's name including their title or prefix (e.g., "Vors. Sebastian Ehlers", "Abg. Thomas Krüger"). For procedural or parenthetical notes (e.g., '(Heiterkeit)'), use the speaker name "Protokoll".
4.  **Role:** Determine the role based on the speaker's prefix or context.
    - "Vors.": "Vorsitzender" (Chairperson)
    - "Abg.": "Abgeordneter" (Member of Parliament)
    - A witness being questioned (like Dr. Till Backhaus): "Zeuge" (Witness)
    - "RA": "Rechtsbeistand" (Legal Counsel)
    - If the speaker is "Protokoll": "Protokoll" (Procedural)
5.  **Type:** This is a critical rule. The 'type' MUST be determined by the 'role':
    - If 'role' is "Vorsitzender" or "Abgeordneter", 'type' MUST be "Frage".
    - If 'role' is "Zeuge" or "Rechtsbeistand", 'type' MUST be "Antwort".
    - If 'role' is "Protokoll", the 'type' MUST be "Verfahrenshinweis".
    - The 'type' "Aussage" must NOT be used. All direct speech must be forced into the "Frage"/"Antwort" structure based on the speaker's role.
6.  **Content:** Extract the verbatim text of the speech or note, without the speaker's name prefix and colon.
7.  **ID:** Assign a sequential ID to each entry, starting from 1.
8.  **Source Reference ("Fundstelle"):** Identify the main protocol number from the beginning of the document (e.g., "WP_80/6" indicates protocol 80). For each entry, find which page it's on using the "==Start of OCR for page X==" markers. Combine these to create a source reference string in the format "WPXX/YY", where XX is the protocol number and YY is the zero-padded two-digit page number. For example, if the protocol is 80 and the entry is on page 6, the sourceReference should be "WP80/06". Every entry must have a sourceReference.

Analyze the following protocol text and generate the JSON array.
---
${text}
---
`;
};

// Helper function to attempt to fix broken JSON using another AI call
async function fixJson(invalidJson: string, schema: any): Promise<any> {
  const fixPrompt = `
    The following text is supposed to be a valid JSON array of objects conforming to a specific schema, but it contains syntax errors. This is likely due to unescaped double quotes inside string values or premature termination.

    Your task is to meticulously correct any and all syntax errors to make the JSON valid.
    - Ensure ALL double quotes (") inside a JSON string value are properly escaped with a backslash (e.g., "content": "He said \\"Hello\\"").
    - Ensure all brackets ([]) and braces ({}) are correctly paired and closed.
    - If the JSON appears truncated, do your best to complete the final object or close the array cleanly.
    
    Return ONLY the raw, corrected JSON array that conforms to the schema. Do not add any explanatory text, markdown, or anything else outside of the JSON itself.

    BROKEN JSON:
    ---
    ${invalidJson}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: fixPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      }
    });

    const fixedText = response.text.trim();
    const cleanedFixedJson = fixedText.replace(/^```json\s*|```\s*$/g, '');
    return JSON.parse(cleanedFixedJson); // Parse the fixed JSON

  } catch (error) {
    console.error("Failed to fix JSON with AI:", error);
    throw new Error("The AI model produced invalid JSON, and the automatic correction attempt also failed.");
  }
}

export async function parseProtocol(text: string): Promise<ProtocolEntry[]> {
  const prompt = buildPrompt(text);
  let responseText = '';

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });
    
    responseText = response.text.trim();
    
    const cleanedJsonString = responseText.replace(/^```json\s*|```\s*$/g, '');
    
    const parsedJson = JSON.parse(cleanedJsonString);
    
    if (!Array.isArray(parsedJson)) {
        throw new Error("AI response was not a JSON array.");
    }

    return parsedJson as ProtocolEntry[];
  } catch (error) {
    console.error("Initial JSON parsing failed:", error);
    
    if (!responseText) {
        console.error("Error calling Gemini API - no response text received:", error);
        throw new Error("Failed to get a response from the AI model.");
    }

    console.log("Attempting to fix JSON with a second AI call...");
    try {
        const cleanedJsonString = responseText.replace(/^```json\s*|```\s*$/g, '');
        const fixedJson = await fixJson(cleanedJsonString, responseSchema);

        if (!Array.isArray(fixedJson)) {
            throw new Error("AI response (after fix) was not a JSON array.");
        }
        console.log("JSON successfully fixed and parsed.");
        return fixedJson as ProtocolEntry[];
    } catch (fixError) {
        console.error("JSON fixing failed:", fixError);
        throw new Error("Failed to get a valid response from the AI model, even after attempting an automatic correction.");
    }
  }
}