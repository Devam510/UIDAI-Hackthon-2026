import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import client from '../../api/client';
import { ENDPOINTS } from '../../api/endpoints';
import { useStateContext } from '../../context/StateContext';
import { useChatContext } from '../../context/ChatContext';
import { useLocation } from 'react-router-dom';

interface ChatMessage {
    id: string;
    sender: 'user' | 'bot';
    text: string;
}

const ChatWidget: React.FC = () => {
    const { isOpen, toggleChat, closeChat, pendingMessage, clearPendingMessage } = useChatContext();
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', sender: 'bot', text: 'Hello! I am your UIDAI Assistant. Ask me anything about the trends or specific charts.' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const { selectedState } = useStateContext();
    const location = useLocation();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) scrollToBottom();
    }, [messages, isOpen]);

    // Handle pending messages from context
    useEffect(() => {
        if (pendingMessage && isOpen) {
            handleSend(pendingMessage);
            clearPendingMessage();
        }
    }, [pendingMessage, isOpen]);

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return;

        const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Convert chat history to API format
            const history = messages.map(msg => ({
                role: msg.sender === 'user' ? 'user' : 'assistant',
                content: msg.text
            }));

            const response = await client.post(ENDPOINTS.CHAT, {
                message: text,
                history: history
            });

            const botMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'bot',
                text: response.data.response || "I'm sorry, I couldn't process that request."
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (error) {
            const errorMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'bot',
                text: "Sorry, the AI service is currently unavailable. Please try again later."
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const predefinedQuestions = [
        "Explain this page",
        "Explain risk score",
        "What should UIDAI do?",
        "Explain biometric instability"
    ];

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
            {isOpen && (
                <div className="bg-dark-card border border-slate-700 shadow-2xl rounded-2xl w-80 sm:w-96 mb-4 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-200" style={{ height: '500px' }}>
                    {/* Header */}
                    <div className="bg-primary-600 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Bot className="text-white" size={20} />
                            <h3 className="font-semibold text-white">AI Assistant</h3>
                        </div>
                        <button onClick={closeChat} className="text-white/80 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/50">
                        {messages.map((msg) => (
                            <div key={msg.id} className={clsx("flex gap-2", msg.sender === 'user' ? "flex-row-reverse" : "flex-row")}>
                                <div className={clsx(
                                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                                    msg.sender === 'user' ? "bg-slate-700" : "bg-primary-600"
                                )}>
                                    {msg.sender === 'user' ? <User size={14} className="text-slate-300" /> : <Bot size={14} className="text-white" />}
                                </div>
                                <div className={clsx(
                                    "max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed",
                                    msg.sender === 'user'
                                        ? "bg-slate-700 text-white rounded-tr-none"
                                        : "bg-slate-800 border border-slate-700 text-slate-200 rounded-tl-none"
                                )}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                                    <Bot size={14} className="text-white" />
                                </div>
                                <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                                    <Loader2 size={16} className="animate-spin text-primary-400" />
                                    <span className="text-xs text-slate-400">Thinking...</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Actions */}
                    <div className="p-2 bg-slate-800/50 border-t border-slate-700 overflow-x-auto flex gap-2 no-scrollbar">
                        {predefinedQuestions.map((q) => (
                            <button
                                key={q}
                                onClick={() => handleSend(q)}
                                disabled={loading}
                                className="whitespace-nowrap px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-full text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-50"
                            >
                                {q}
                            </button>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-dark-card border-t border-slate-700">
                        <div className="relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask a question..."
                                disabled={loading}
                                className="w-full bg-slate-900 border border-slate-700 text-white rounded-full pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || loading}
                                className="absolute right-1.5 top-1.5 p-1.5 bg-primary-600 text-white rounded-full hover:bg-primary-500 disabled:opacity-0 disabled:pointer-events-none transition-all"
                            >
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={toggleChat}
                className={clsx(
                    "h-14 w-14 rounded-full shadow-lg shadow-primary-900/40 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95",
                    isOpen ? "bg-slate-700 text-white rotate-90" : "bg-primary-600 text-white"
                )}
            >
                {isOpen ? <X size={24} /> : <MessageCircle size={28} />}
            </button>
        </div>
    );
};

export default ChatWidget;
