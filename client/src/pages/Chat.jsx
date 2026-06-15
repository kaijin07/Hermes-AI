import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { Send, ArrowLeft, Bot, User, Loader2, Info } from 'lucide-react';
import { useChat } from '../hooks/useChat.js';
import { useAuth } from '../hooks/useAuth.js';
import { useBotConfig } from '../hooks/useBotConfig.js';

function ChatMessageBubble({ msg }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ctx = gsap.context(() => {
      gsap.from(el, { opacity: 0, y: 10, scale: 0.95, duration: 0.2, ease: 'power2.out' });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
        <div
          className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
            msg.sender === 'user'
              ? 'bg-surface border border-border text-muted'
              : 'bg-primary text-white shadow-lg shadow-primary/20'
          }`}
        >
          {msg.sender === 'user' ? <User size={16} /> : <Bot size={16} />}
        </div>
        <div
          className={`p-4 rounded-2xl ${
            msg.sender === 'user'
              ? 'bg-primary text-white rounded-tr-none shadow-lg shadow-primary/10'
              : 'bg-surface border border-border text-text rounded-tl-none'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ctx = gsap.context(() => {
      gsap.from(el, { opacity: 0, duration: 0.2 });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className="flex justify-start">
      <div className="flex gap-3 max-w-[80%]">
        <div className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-primary text-white">
          <Bot size={16} />
        </div>
        <div className="p-4 rounded-2xl bg-surface border border-border rounded-tl-none flex gap-1 items-center">
          <span className="flex space-x-1">
            <span
              className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce"
              style={{ animationDelay: '0ms' }}
            ></span>
            <span
              className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce"
              style={{ animationDelay: '150ms' }}
            ></span>
            <span
              className="w-1.5 h-1.5 bg-muted rounded-full animate-bounce"
              style={{ animationDelay: '300ms' }}
            ></span>
          </span>
        </div>
      </div>
    </div>
  );
}

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const { sendMessage, loading } = useChat();
  const { user } = useAuth();
  const { botConfig, fetchBotConfig } = useBotConfig();
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBotConfig();
  }, [fetchBotConfig]);

  useEffect(() => {
    if (botConfig?.botName && messages.length === 0) {
      setMessages([
        {
          sender: 'bot',
          text: `Hi there! I'm ${botConfig.botName}, your virtual assistant. How can I help you today?`,
        },
      ]);
    }
  }, [botConfig, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { sender: 'user', text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const data = await sendMessage(userMessage.text, user?.name);
      if (data.success) {
        setMessages((prev) => [...prev, data.data]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Sorry, I am having trouble connecting right now.' },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-bg w-full pt-32">
      <div className="w-full max-w-4xl mx-auto flex flex-col h-full glass rounded-t-lg overflow-hidden relative">
        <div className="flex items-center justify-between p-6 border-b border-border bg-surface/80 shrink-0 relative z-[100]">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="p-2 rounded-full hover:bg-border text-muted hover:text-white transition-all cursor-pointer relative z-[9999]"
            >
              <ArrowLeft size={20} className="pointer-events-none" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary">
                <Bot size={24} />
              </div>
              <div>
                <h2 className="font-bold text-white leading-tight">{botConfig?.botName || 'Agent Preview'}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  <p className="text-[10px] text-green-500 font-bold uppercase tracking-wider">Ready to Test</p>
                </div>
              </div>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-bg border border-border rounded-full text-muted text-[10px] font-medium uppercase">
            <Info size={12} />
            <span>Preview Mode</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted space-y-4 opacity-50">
              <Bot size={64} className="animate-pulse" />
              <div className="text-center">
                <p className="text-lg font-medium">Hello, {user?.name}!</p>
                <p className="text-sm">I&apos;m your AI agent. Send a message to start testing.</p>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <ChatMessageBubble key={`${index}-${msg.text?.slice(0, 32)}`} msg={msg} />
            ))
          )}
          {loading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 bg-surface/50 border-t border-border shrink-0">
          <form onSubmit={handleSend} className="flex gap-3 relative max-w-3xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your business..."
              className="input-field pr-14 py-4 rounded-full"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary-hover disabled:opacity-50 transition-all shadow-lg shadow-primary/20 active:scale-95"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
          <p className="text-[10px] text-center text-muted mt-4 uppercase tracking-widest font-medium">
            Powered by Hermes Intelligence
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;
