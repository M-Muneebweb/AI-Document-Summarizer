import { ChatMessage } from '../types';

const BASE_URL = "https://openrouter.ai/api/v1";

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    const response = await fetch(`${BASE_URL}/auth/key`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
      },
    });
    
    // Some endpoints might allow auth check, but OpenRouter usually returns 200 on valid key info
    // Alternatively, we can try a dry run request.
    if (response.status === 200) {
        const data = await response.json();
        return !!data?.data; // Check if data exists
    }
    return false;
  } catch (error) {
    console.error("Validation failed:", error);
    return false;
  }
};

export const streamCompletion = async (
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  pdfContext: string | null,
  onChunk: (chunk: string) => void
): Promise<void> => {
  
  let systemPrompt = "You are a helpful and intelligent AI assistant.";
  
  if (pdfContext) {
    systemPrompt += `
    \n\nCONTEXT FROM UPLOADED PDF:
    ${pdfContext.slice(0, 30000)} 
    
    INSTRUCTIONS:
    1. Answer the user's question based STRICTLY on the context provided above.
    2. If the answer is not found in the context, you MUST state: "I cannot find the answer to this question in the uploaded PDF document."
    3. Do not make up facts not present in the text.
    `;
  }

  const apiMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role, content: m.content }))
  ];

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': window.location.origin, // Required by OpenRouter
        'X-Title': 'DocuMind AI',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: apiMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.error?.message || `API Error: ${response.status}`);
    }

    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");
      
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6);
          if (dataStr === "[DONE]") return;
          
          try {
            const data = JSON.parse(dataStr);
            const content = data.choices[0]?.delta?.content || "";
            if (content) onChunk(content);
          } catch (e) {
            // Ignore parse errors for partial chunks
          }
        }
      }
    }

  } catch (error: any) {
    console.error("LLM Error:", error);
    throw error;
  }
};
