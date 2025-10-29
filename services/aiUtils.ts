import { GoogleGenAI } from '@google/genai';

const MAX_RETRIES = 4;
const INITIAL_DELAY_MS = 2000;

export async function callGenerativeAI(
    ai: GoogleGenAI,
    model: string,
    prompt: string,
    config: any
): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await ai.models.generateContent({ model, contents: prompt, config });
            const responseText = response.text.trim();
            if (!responseText) {
                throw new Error("Received an empty response from the AI model.");
            }
            return responseText;
        } catch (error: any) {
            lastError = error;
            const errorMessage = error.message || '';
            const isRetryable = errorMessage.includes('503') || errorMessage.toLowerCase().includes('overloaded');

            if (isRetryable && attempt < MAX_RETRIES) {
                const delay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 1000);
                console.warn(`AI model error (Attempt ${attempt}/${MAX_RETRIES}). Retrying in ${Math.round(delay/1000)}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error(`AI call failed after ${attempt} attempt(s).`, error);
                if(isRetryable) {
                    throw new Error("The AI model is currently overloaded. Please try again in a few moments.");
                }
                throw new Error(`Failed to get a valid response from the AI model: ${error.message}`);
            }
        }
    }
    throw lastError || new Error("An unknown error occurred after multiple retries.");
}


async function fixJson(ai: GoogleGenAI, invalidJson: string, schema: any): Promise<any> {
  // FIX: Updated the prompt to handle both JSON objects and arrays, not just arrays.
  const fixPrompt = `
    The following text is supposed to be a valid JSON object or array conforming to a specific schema, but it contains syntax errors. This is likely due to unescaped double quotes inside string values or premature termination.

    Your task is to meticulously correct any and all syntax errors to make the JSON valid.
    - Ensure ALL double quotes (") inside a JSON string value are properly escaped with a backslash (e.g., "content": "He said \\"Hello\\"").
    - Ensure all brackets ([]) and braces ({}) are correctly paired and closed.
    - If the JSON appears truncated, do your best to complete it cleanly based on the schema.
    
    Return ONLY the raw, corrected JSON that conforms to the schema. Do not add any explanatory text, markdown, or anything else outside of the JSON itself.

    BROKEN JSON:
    ---
    ${invalidJson}
    ---
  `;

  try {
    const response = await ai.models.generateContent({
      // FIX: Updated deprecated model name to 'gemini-2.5-pro'.
      model: 'gemini-2.5-pro',
      contents: fixPrompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
      }
    });

    const fixedText = response.text.trim();
    const cleanedFixedJson = fixedText.replace(/^```json\s*|```\s*$/g, '');
    return JSON.parse(cleanedFixedJson);

  } catch (error) {
    console.error("Failed to fix JSON with AI:", error);
    throw new Error("The AI model produced invalid JSON, and the automatic correction attempt also failed.");
  }
}

// FIX: Updated function to be generic for any JSON response (object or array), not just arrays.
export async function callGenerativeAIWithCorrection(
    ai: GoogleGenAI,
    model: string,
    prompt: string,
    config: any
): Promise<any> {
    const responseText = await callGenerativeAI(ai, model, prompt, config);
    
    try {
        const cleanedJsonString = responseText.replace(/^```json\s*|```\s*$/g, '');
        return JSON.parse(cleanedJsonString);
    } catch (jsonParseError) {
        console.warn(`Initial JSON parsing failed. Attempting to fix...`, { responseText });
        const cleanedJsonString = responseText.replace(/^```json\s*|```\s*$/g, '');
        const fixedJson = await fixJson(ai, cleanedJsonString, config.responseSchema);
        console.log("JSON successfully fixed and parsed.");
        return fixedJson;
    }
}