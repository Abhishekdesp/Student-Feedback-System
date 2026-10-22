import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  X,
  RotateCcw,
  Minus,
  MessageSquare,
  ChevronDown,
  User,
  Loader2,
  HelpCircle,
} from 'lucide-react';
import { api } from '../lib/axios';
import { useAuthContext } from '../context/AuthContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  '📊 Summarize my overall ratings',
  '📚 What subjects am I teaching?',
  '⚠️ What is my lowest-rated question?',
  '💬 Summarize constructive student feedback',
  '💡 3 tips to improve student engagement',
];

export const TeacherChatbot: React.FC = () => {
  const { user } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: `👋 **Hello Professor ${user?.name || user?.username || ''}!**\n\nI am your **AI Feedback Copilot** powered by **LangChain** and **Google Gemini**.\n\nI have direct access to your courses, student evaluations, question ratings, and comments. Ask me anything, or tap a quick prompt below!`,
      timestamp: new Date(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Strictly restrict to teacher (or admin testing teacher views)
  if (!user || (user.role !== 'teacher' && user.role !== 'admin')) {
    return null;
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [messages, isOpen, isMinimized]);

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Build history for LangChain context
      const historyPayload = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          sender: m.sender,
          text: m.text,
        }));

      const res = await api.post('/teacher/chat', {
        message: textToSend,
        history: historyPayload,
      });

      if (res.data?.success && res.data?.reply) {
        const botMsg: ChatMessage = {
          id: `bot_${Date.now()}`,
          sender: 'bot',
          text: res.data.reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error(res.data?.message || 'Empty response');
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'bot',
        text: `⚠️ **Error:** ${err.response?.data?.message || err.message || 'Failed to connect to the LangChain Copilot'}. Please verify the server connection.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: `👋 **Chat reset.** How can I assist you with your feedback analytics today, Professor?`,
        timestamp: new Date(),
      },
    ]);
  };

  // Helper to format text with Markdown bold and bullet points
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return (
      <div className="space-y-1 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1.5" />;
          }

          // Bullet list items
          const isBullet = line.trim().startsWith('* ') || line.trim().startsWith('- ');
          const isNumber = /^\d+\.\s/.test(line.trim());
          const cleanLine = isBullet ? line.trim().substring(2) : isNumber ? line.trim().replace(/^\d+\.\s/, '') : line;

          // Parse **bold** parts
          const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
          const parsedContent = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
            }
            return part;
          });

          if (isBullet) {
            return (
              <div key={idx} className="flex items-start space-x-2 pl-2">
                <span className="text-blue-500 font-bold select-none">•</span>
                <span>{parsedContent}</span>
              </div>
            );
          }

          if (isNumber) {
            const numMatch = line.trim().match(/^(\d+)\.\s/);
            const numStr = numMatch ? numMatch[1] : '';
            return (
              <div key={idx} className="flex items-start space-x-2 pl-2">
                <span className="font-semibold text-blue-600 select-none min-w-[1.2rem]">{numStr}.</span>
                <span>{parsedContent}</span>
              </div>
            );
          }

          return <p key={idx}>{parsedContent}</p>;
        })}
      </div>
    );
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center">
          <button
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="group relative flex items-center space-x-3 px-5 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white font-medium rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200"
            title="Open Teaching Copilot (LangChain AI)"
          >
            <div className="relative">
              <Bot className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-white rounded-full"></span>
            </div>
            <span className="text-sm tracking-wide font-semibold">Faculty AI Copilot</span>
            <span className="text-[10px] px-1.5 py-0.5 bg-white/20 rounded uppercase tracking-wider font-bold">
              LangChain
            </span>
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-50 w-[95vw] sm:w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-300 ${
            isMinimized ? 'h-16' : 'h-[580px] max-h-[85vh]'
          }`}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white px-4 py-3 flex items-center justify-between select-none">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-sm font-bold text-white">Faculty Copilot</h3>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                    TESTING
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block"></span>
                  <span>LangChain • Gemini 3.5</span>
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={handleClearChat}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition"
                title="Clear conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                {isMinimized ? <ChevronDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          {!isMinimized && (
            <>
              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/60">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start space-x-2.5 ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.sender === 'bot' && (
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-sm mt-0.5">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl shadow-sm text-slate-800 ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-xs'
                          : 'bg-white border border-slate-200/80 rounded-tl-xs'
                      }`}
                    >
                      {msg.sender === 'user' ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      ) : (
                        renderFormattedText(msg.text)
                      )}
                      <span
                        className={`text-[9px] mt-1 block select-none ${
                          msg.sender === 'user' ? 'text-blue-100 text-right' : 'text-slate-400'
                        }`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {msg.sender === 'user' && (
                      <div className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-sm mt-0.5">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading State */}
                {loading && (
                  <div className="flex items-start space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-sm mt-0.5">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div className="bg-white border border-slate-200/80 px-4 py-3 rounded-2xl rounded-tl-xs shadow-sm flex items-center space-x-2 text-slate-500 text-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>LangChain agent querying feedback data...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Bar */}
              {messages.length <= 3 && !loading && (
                <div className="px-3 py-2 bg-white border-t border-slate-100 overflow-x-auto scrollbar-none flex space-x-1.5">
                  {QUICK_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(prompt)}
                      className="text-xs bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 text-slate-700 px-2.5 py-1.5 rounded-full whitespace-nowrap transition cursor-pointer select-none"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Footer */}
              <div className="p-3 bg-white border-t border-slate-200">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center space-x-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about ratings, comments, subjects..."
                    disabled={loading}
                    className="flex-1 text-sm bg-slate-100 hover:bg-slate-50 focus:bg-white text-slate-900 border border-slate-200 focus:border-blue-500 rounded-xl px-3.5 py-2.5 focus:outline-none transition disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || loading}
                    className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl shadow-sm transition disabled:cursor-not-allowed flex-shrink-0"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
                <p className="text-[10px] text-center text-slate-400 mt-1.5 select-none">
                  Student anonymity is strictly enforced • Teacher Testing Portal
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};
