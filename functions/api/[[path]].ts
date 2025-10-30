// functions/api/[[path]].ts

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com';

/**
 * A proxy function that securely forwards requests from the frontend to the 
 * Google Generative AI API, injecting the secret API key on the server-side.
 * This uses Cloudflare Pages Functions' routing to catch all requests to /api/.
 */
// FIX: Replaced missing 'PagesFunction' type with an inline type for the context object to resolve the "Cannot find name 'PagesFunction'" error.
export const onRequest = async (context: {
  request: Request;
  env: { GEMINI_API_KEY: string };
  params: { path: string[] };
}) => {
  const { request, env, params } = context;
  
  // The path from the incoming request, e.g., /v1beta/models/gemini-pro:generateContent
  const apiPath = params.path.join('/');
  
  // The query string from the incoming request
  const url = new URL(request.url);
  const queryString = url.search;

  // Construct the full target URL for the Google API
  const targetUrl = `${GEMINI_API_URL}/${apiPath}${queryString}`;

  // Get the secret API key from the secure environment variables
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured on the server.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create a new request to forward, copying the original method, headers, and body
  const forwardedRequest = new Request(targetUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body,
    redirect: 'follow',
  });

  // Remove headers that can cause issues when proxying
  forwardedRequest.headers.delete('Host');
  
  // Add the Google API key header required for authentication
  forwardedRequest.headers.set('x-goog-api-key', apiKey);
  
  try {
    // Make the request to the actual Google API
    const response = await fetch(forwardedRequest);
    
    // Return the response from the Google API directly back to the client
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error('Error forwarding request to Google API:', error);
    return new Response(JSON.stringify({ error: 'Failed to connect to the AI service through the proxy.' }), {
      status: 502, // Bad Gateway
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
