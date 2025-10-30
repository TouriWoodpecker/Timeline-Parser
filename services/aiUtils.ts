const MAX_RETRIES = 4;
const INITIAL_DELAY_MS = 2000;

export async function callGenerativeAI(
    model: string,
    prompt: string,
    config: any
): Promise<string> {
    let lastError: Error | null = null;
    const url = `/api/v1beta/models/${model}:generateContent`;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const requestBody = {
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: config,
            };
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                 const errorBody = await response.json().catch(() => ({ message: response.statusText }));
                 const errorMessage = errorBody.error?.message || response.statusText;
                 throw new Error(`API Error: ${response.status} - ${errorMessage}`);
            }
            
            const responseData = await response.json();

            // Extract text from the response based on the Gemini API structure
            const responseText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

            if (responseText === undefined) {
                console.error("Invalid AI response structure:", responseData);
                throw new Error("Received an invalid or empty response from the AI model.");
            }
            
            return responseText.trim();

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


async function fixJson(invalidJson: string, schema: any): Promise<any> {
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

  const url = `/api/v1beta/models/gemini-2.5-pro:generateContent`;
  const requestBody = {
    contents: [{ parts: [{ text: fixPrompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  };

  try {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
        throw new Error(`AI fixer failed with status: ${response.status}`);
    }

    const responseData = await response.json();
    const fixedText = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!fixedText) throw new Error("Fixer AI returned no text.");
    
    const cleanedFixedJson = fixedText.replace(/^```json\s*|```\s*$/g, '');
    return JSON.parse(cleanedFixedJson);

  } catch (error) {
    console.error("Failed to fix JSON with AI:", error);
    throw new Error("The AI model produced invalid JSON, and the automatic correction attempt also failed.");
  }
}


export async function callGenerativeAIWithCorrection(
    model: string,
    prompt: string,
    config: any
): Promise<any> {
    const responseText = await callGenerativeAI(model, prompt, config);
    
    try {
        const cleanedJsonString = responseText.replace(/^```json\s*|```\s*$/g, '');
        return JSON.parse(cleanedJsonString);
    } catch (jsonParseError) {
        console.warn(`Initial JSON parsing failed. Attempting to fix...`, { responseText });
        const cleanedJsonString = responseText.replace(/^```json\s*|```\s*$/g, '');
        const fixedJson = await fixJson(cleanedJsonString, config.responseSchema);
        console.log("JSON successfully fixed and parsed.");
        return fixedJson;
    }
}