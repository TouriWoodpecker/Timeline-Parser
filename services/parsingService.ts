import { ParsedEntry } from "../types";
import { callGenerativeAIWithCorrection } from "./aiUtils";

// Define the schema for the AI's response, which is an array of structured objects.
const parsingSchema = {
  type: 'ARRAY',
  description: "An array of structured protocol entries, each representing a question/answer pair or a procedural note.",
  items: {
    type: 'OBJECT',
    properties: {
      questioner: {
        type: 'STRING',
        description: "The name of the person asking the question (e.g., 'Dr. Heiko Mass'). Null if it's a note or a statement without a preceding question.",
      },
      question: {
        type: 'STRING',
        description: "The full text of the question being asked. Null if it's a note.",
      },
      witness: {
        type: 'STRING',
        description: "The name of the person answering the question (e.g., 'Zeuge Christian Pegel'). Null if it's a note.",
      },
      answer: {
        type: 'STRING',
        description: "The full text of the answer. If a witness makes a statement without a direct question, this field should contain that statement, and the 'question' and 'questioner' fields should be null. Null if it's a note.",
      },
      note: {
        type: 'STRING',
        description: "Procedural notes, interruptions, or comments from the chairperson (e.g., 'Vorsitzender: Herr Abgeordneter, kommen Sie bitte zur Frage.'). Null if it's a Q&A pair.",
      },
    },
  },
};

/**
 * Parses a chunk of text from a protocol page using a generative AI model.
 * @param textChunk The raw text from a single page.
 * @param protocolId The ID of the protocol (e.g., 'WP79').
 * @param pageNumber The page number of the text chunk.
 * @param startId The starting ID for the parsed entries on this page.
 * @returns A promise that resolves to an array of ParsedEntry objects.
 */
export async function parseProtocolChunk(
  textChunk: string,
  protocolId: string,
  pageNumber: number,
  startId: number
): Promise<ParsedEntry[]> {

  const prompt = `
    **ROLE & GOAL**
    You are a specialized AI assistant for parsing German parliamentary committee protocols. Your task is to analyze a raw text chunk from a single page of a protocol and structure it into a sequence of question-and-answer (Q&A) pairs or procedural notes. You must accurately identify speakers, their roles, and pair up questions with their corresponding answers.

    **CONTEXT**
    - The protocol is from a German parliamentary committee, likely an investigative committee ('Untersuchungsausschuss').
    - The text is raw OCR output and may contain errors or formatting artifacts.
    - Speakers are typically identified by their name (e.g., 'Dr. Heiko Mass', 'Christian Pegel') and sometimes their role (e.g., 'Vorsitzender', 'Zeuge').
    - The flow is a dialogue, primarily questions from committee members ('Abgeordneter') to a witness ('Zeuge'). The chairperson ('Vorsitzender') often interjects with procedural notes.

    **INPUT & PROCESSING RULES**
    You will receive a single chunk of text from one page. Follow these rules meticulously:

    1.  **Identify Q&A Pairs:** A standard entry is a question followed by its answer.
        - The 'questioner' is the person asking the question.
        - The 'question' is the text of their question.
        - The 'witness' is the person who replies.
        - The 'answer' is the text of their reply.
        - Combine multi-paragraph questions/answers from the same speaker into a single field.

    2.  **Handle Standalone Statements:** If a witness provides a lengthy statement without a direct preceding question on the *same page*, capture it.
        - Set 'witness' to the speaker's name.
        - Set 'answer' to their full statement.
        - Set 'questioner' and 'question' to \`null\`.

    3.  **Identify Procedural Notes:** Comments from the chairperson ('Vorsitzender'), interruptions, or general procedural text are considered notes.
        - Capture the entire note text in the 'note' field.
        - Set all other fields ('questioner', 'question', 'witness', 'answer') to \`null\`.
        - Example note: "Vorsitzender: Herr Abgeordneter, kommen Sie bitte zur Frage."

    4.  **Speaker Identification:**
        - Extract the full name of the speaker (e.g., 'Dr. Heiko Mass', not just 'Mass').
        - Ignore titles like 'Abgeordneter' or 'Zeuge' in the name fields, but use them to determine who is the questioner and who is the witness.

    5.  **Continuity:** A question might be at the end of the text chunk, with the answer presumably on the next page. Or, an answer might be at the start, continuing from the previous page. Your scope is ONLY the text provided.
        - If a question is at the end without an answer in the chunk, create an entry with the 'questioner' and 'question', but set 'witness' and 'answer' to \`null\`.
        - If an answer is at the beginning without a question in the chunk, create an entry with the 'witness' and 'answer', but set 'questioner' and 'question' to \`null\`.

    6.  **Data Cleaning:** Clean up OCR artifacts like page numbers or random headers/footers within the text content. Do not include them in your output. Remove unnecessary line breaks within a single question or answer to create a coherent text block.

    **INPUT TEXT TO PARSE:**
    ---
    ${textChunk}
    ---

    **OUTPUT FORMAT**
    Your output must be a single, valid JSON array of objects, strictly conforming to the provided schema. Do not include any text, explanations, or markdown formatting outside of the JSON array.
    `;

  try {
    const results = await callGenerativeAIWithCorrection('gemini-2.5-pro', prompt, {
      responseMimeType: 'application/json',
      responseSchema: parsingSchema,
    });

    // Post-process to add IDs and source references
    return results.map((item: any, index: number) => ({
      ...item,
      id: startId + index,
      sourceReference: `${protocolId}, S. ${pageNumber}`,
      questioner: item.questioner || null,
      question: item.question || null,
      witness: item.witness || null,
      answer: item.answer || null,
      note: item.note || null,
    }));
  } catch (error) {
    console.error(`Error parsing chunk for page ${pageNumber}:`, error);
    throw new Error(`Failed to parse page ${pageNumber}: ${error instanceof Error ? error.message : String(error)}`);
  }
}