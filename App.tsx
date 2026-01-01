import React, { useState } from 'react';
import { Welcome } from './components/Welcome';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { AppState, ChatMessage } from './types';
import { OPENROUTER_MODELS } from './constants';
import { streamCompletion } from './services/llmService';
import { Menu, X } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    apiKey: '',
    isKeyValid: false,
    selectedModel: OPENROUTER_MODELS[0].id,
    pdfContent: null,
    fileName: null,
    chatHistory: [],
    isLoading: false,
    error: null,
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleKeySuccess = (key: string) => {
    setState(prev => ({ ...prev, apiKey: key, isKeyValid: true }));
  };

  const handleModelChange = (modelId: string) => {
    setState(prev => ({ ...prev, selectedModel: modelId }));
  };

  const handleFileLoaded = (text: string, name: string) => {
    setState(prev => ({ 
        ...prev, 
        pdfContent: text, 
        fileName: name,
        chatHistory: [...prev.chatHistory, {
            role: 'system',
            content: `I have memorized the document "${name}". Ask me anything about it.`,
            id: Date.now().toString(),
            timestamp: Date.now()
        }]
    }));
    // Close sidebar on mobile after upload
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleClearFile = () => {
      setState(prev => ({ ...prev, pdfContent: null, fileName: null }));
  };

  const handleSendMessage = async (text: string) => {
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: text,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };

    const newHistory = [...state.chatHistory, newUserMessage];
    setState(prev => ({ 
        ...prev, 
        chatHistory: newHistory,
        isLoading: true 
    }));

    // Create a placeholder for assistant message
    const assistantMsgId = (Date.now() + 1).toString();
    let assistantContent = "";
    
    // Optimistic update for UI
    setState(prev => ({
        ...prev,
        chatHistory: [...newHistory, {
            role: 'assistant',
            content: '',
            id: assistantMsgId,
            timestamp: Date.now()
        }]
    }));

    try {
        await streamCompletion(
            state.apiKey,
            state.selectedModel,
            newHistory.filter(m => m.role !== 'system'), // Don't send internal system messages
            state.pdfContent,
            (chunk) => {
                assistantContent += chunk;
                setState(prev => ({
                    ...prev,
                    chatHistory: prev.chatHistory.map(msg => 
                        msg.id === assistantMsgId 
                        ? { ...msg, content: assistantContent }
                        : msg
                    )
                }));
            }
        );
    } catch (error) {
        setState(prev => ({
            ...prev,
            chatHistory: prev.chatHistory.map(msg => 
                msg.id === assistantMsgId 
                ? { ...msg, content: "Sorry, I encountered an error communicating with the API." }
                : msg
            )
        }));
    } finally {
        setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  if (!state.isKeyValid) {
    return <Welcome onSuccess={handleKeySuccess} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      
      {/* Mobile Sidebar Toggle */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden absolute top-4 left-4 z-50 p-2 bg-white rounded-md shadow text-slate-600"
      >
        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar - Hidden on mobile unless toggled */}
      <div className={`
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar 
            selectedModel={state.selectedModel}
            onModelChange={handleModelChange}
            onFileLoaded={handleFileLoaded}
            fileName={state.fileName}
            onClearFile={handleClearFile}
        />
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col w-full h-full">
        <ChatArea 
            messages={state.chatHistory}
            onSendMessage={handleSendMessage}
            isLoading={state.isLoading}
        />
      </div>
    </div>
  );
};

export default App;
