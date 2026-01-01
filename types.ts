export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id: string;
  timestamp: number;
}

export interface ModelOption {
  name: string;
  id: string;
}

export interface AppState {
  apiKey: string;
  isKeyValid: boolean;
  selectedModel: string;
  pdfContent: string | null;
  fileName: string | null;
  chatHistory: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}
