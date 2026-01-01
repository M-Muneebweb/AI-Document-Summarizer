import React, { useRef } from 'react';
import { Upload, FileText, Check, Bot, Trash2 } from 'lucide-react';
import { OPENROUTER_MODELS } from '../constants';
import { extractTextFromPdf } from '../services/pdfService';

interface SidebarProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  onFileLoaded: (text: string, name: string) => void;
  fileName: string | null;
  onClearFile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  selectedModel, 
  onModelChange, 
  onFileLoaded, 
  fileName,
  onClearFile
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert("Please upload a PDF file.");
        return;
      }
      try {
        const text = await extractTextFromPdf(file);
        if (!text.trim()) {
            alert("Could not extract text from this PDF. It might be an image-only PDF.");
            return;
        }
        onFileLoaded(text, file.name);
      } catch (err) {
        console.error(err);
        alert("Error reading PDF.");
      }
    }
  };

  return (
    <div className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Bot className="text-indigo-600" />
            DocuMind AI
        </h2>
        <p className="text-xs text-slate-500 mt-1">Advanced RAG Assistant</p>
      </div>

      <div className="p-6 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
        {/* Model Section */}
        <section>
          <label className="block text-sm font-semibold text-slate-700 mb-3">Select Model</label>
          <div className="relative">
            <select
              value={selectedModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="w-full appearance-none bg-slate-50 border border-slate-300 text-slate-700 py-3 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-indigo-500"
            >
              {OPENROUTER_MODELS.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-700">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Free tier models provided by OpenRouter.
          </p>
        </section>

        {/* Upload Section */}
        <section>
          <div className="flex items-center justify-between mb-3">
             <label className="text-sm font-semibold text-slate-700">Knowledge Base</label>
             {fileName && (
                <button onClick={onClearFile} className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1">
                    <Trash2 size={12} /> Clear
                </button>
             )}
          </div>
          
          {!fileName ? (
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition-all group"
            >
                <div className="p-3 bg-indigo-50 text-indigo-500 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <Upload size={24} />
                </div>
                <p className="text-sm font-medium text-slate-700">Click to upload PDF</p>
                <p className="text-xs text-slate-400 mt-1">AI will memorize the content</p>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="application/pdf"
                    onChange={handleFileUpload}
                />
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded text-green-600">
                    <FileText size={20} />
                </div>
                <div className="overflow-hidden">
                    <p className="text-sm font-medium text-slate-800 truncate" title={fileName}>{fileName}</p>
                    <div className="flex items-center gap-1 text-xs text-green-700 mt-0.5">
                        <Check size={12} />
                        <span>Memorized</span>
                    </div>
                </div>
            </div>
          )}
        </section>
      </div>

      <div className="p-4 border-t border-slate-200 bg-slate-50">
        <div className="text-xs text-center text-slate-400">
            Powered by React & OpenRouter
        </div>
      </div>
    </div>
  );
};
