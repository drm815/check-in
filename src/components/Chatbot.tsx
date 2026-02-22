"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Bot, User, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
    id: number;
    text: string;
    isBot: boolean;
}

interface ChatbotData {
    keyword: string;
    response: string;
    category?: string;
}

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [keywords, setKeywords] = useState<ChatbotData[]>([]);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial greeting
    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                { id: 1, text: "안녕하세요! 궁금한 학교 생활 꿀팁을 물어보세요.\n궁금한 단어를 입력하면 알려드릴게요! 😊", isBot: true }
            ]);
            fetchKeywords();
        }
    }, [isOpen]);

    const fetchKeywords = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/chatbot");
            if (res.ok) {
                const data = await res.json();
                setKeywords(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg = input.trim();
        const newMsgId = messages.length + 1;

        // 1. Add User Message
        setMessages(prev => [...prev, { id: newMsgId, text: userMsg, isBot: false }]);
        setInput("");

        // 2. Bot Response Logic (Keyword Matching)
        setTimeout(() => {
            const matched = keywords.find(k =>
                userMsg.includes(k.keyword) || k.keyword.includes(userMsg)
            );

            let botResponse = "죄송해요, 아직 모르는 내용이에요. 😅\n선생님께 업데이트를 요청해 볼게요!";
            if (matched) {
                botResponse = matched.response;
            } else if (userMsg.includes("안녕")) {
                botResponse = "안녕하세요! 오늘도 좋은 하루 보내세요. 👋";
            }

            setMessages(prev => [...prev, { id: newMsgId + 1, text: botResponse, isBot: true }]);
        }, 500);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // Keyword Chip Click
    const handleChipClick = (keyword: string) => {
        setInput(keyword);
        // Optional: auto send?
        // handleSend();
    };

    return (
        <>
            {/* FAB Button */}
            {!isOpen && (
                <motion.button
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full shadow-xl flex items-center justify-center text-white z-50 hover:shadow-2xl transition-all"
                >
                    <MessageCircle size={28} fill="currentColor" className="text-white" />
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
                    </span>
                </motion.button>
            )}

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed bottom-6 right-6 w-[90vw] md:w-[380px] h-[600px] max-h-[85vh] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-slate-100 font-sans"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-16 relative overflow-hidden shrink-0">
                            <div className="absolute -right-4 -top-2 p-4 opacity-20">
                                <Bot size={80} />
                            </div>

                            <button
                                onClick={() => setIsOpen(false)}
                                className="absolute top-1/2 -translate-y-1/2 right-4 p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-20"
                            >
                                <X size={18} className="text-white" />
                            </button>

                            <div className="absolute top-1/2 -translate-y-1/2 left-6 flex items-center gap-3 z-10">
                                <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm border border-white/10">
                                    <Sparkles size={16} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="font-black text-base text-white tracking-tight">스쿨 챗봇</h3>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto px-6 py-4 bg-slate-50 flex flex-col gap-4">
                            {messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex items-end gap-2 ${msg.isBot ? "self-start" : "self-end flex-row-reverse"}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.isBot ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-500"
                                        }`}>
                                        {msg.isBot ? <Bot size={16} /> : <User size={16} />}
                                    </div>
                                    <div className={`max-w-[75%] p-3.5 rounded-2xl text-sm leading-relaxed font-medium shadow-sm whitespace-pre-wrap ${msg.isBot
                                        ? "bg-white text-slate-700 rounded-bl-none border border-slate-100"
                                        : "bg-indigo-600 text-white rounded-br-none"
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}

                            {/* Suggested Keywords Chip */}
                            {messages.length === 1 && keywords.length > 0 && (
                                <div className="flex flex-col gap-2 mt-2">
                                    <p className="text-xs text-slate-400 font-bold">추천 키워드</p>
                                    <div className="flex flex-wrap gap-2">
                                        {keywords.slice(0, 6).map((k, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleChipClick(k.keyword)}
                                                className="px-3 py-1.5 bg-white border border-indigo-100 text-indigo-600 text-xs font-bold rounded-full hover:bg-indigo-50 transition-colors shadow-sm"
                                            >
                                                # {k.keyword}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-2 m-4 mb-6 bg-white rounded-3xl shadow-lg border border-slate-100 flex items-center gap-2 shrink-0 z-20">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="궁금한 내용을 입력하세요."
                                className="flex-1 h-12 bg-transparent pl-8 text-sm font-bold text-slate-700 placeholder:text-slate-400 focus:outline-none transition-all"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim()}
                                className="h-10 w-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
