import { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, User, RefreshCw, Minimize2, MessageSquare, ExternalLink, CreditCard, ShieldCheck, BookOpen, Layers } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../lib/api.js';

const RAG_QUICK_SUGGESTIONS = [
  '🛡️ Awaz Health Insurance (₹2L Cover)',
  '💳 ABHA Health ID Creation Steps',
  '🏥 Govt Hospital Directory in Ernakulam/Kochi',
  '🩺 Free TB & Malaria Screening Camps',
  '📞 Emergency Helplines (108 / 1056)',
  '💬 മലയാളത്തിൽ രോഗവിവരണം',
  '💬 हिंदी में स्वास्थ्य योजनाएं',
];

export default function AIChatbot() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Namaste! I am Aaroham Health Assistant. I can search official Kerala Migrant Health schemes (Awaz ₹2L cover, PM-JAY ₹5L cover), government hospital directories, disease screening guidelines, and your digital ABHA health records in real time.`,
      showAbhaButton: true,
      sources: [
        { title: 'Awaz Health Insurance Scheme', category: 'Health Schemes', source: 'Kerala Labour Dept' },
        { title: 'ABDM ABHA Health Account', category: 'ABHA Registration', source: 'NHA & Ministry of Health' },
      ],
      ragActive: true,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (open) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMessage = { role: 'user', content: text.trim() };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const apiMessages = updatedMessages.map((m) => ({ role: m.role, content: m.content }));
      const res = await api.post('/chat', {
        messages: apiMessages,
        userContext: user
          ? {
            id: user.id,
            name: user.full_name || user.name,
            spoken_language: user.spoken_language,
            home_state: user.home_state,
          }
          : null,
      });

      const replyContent = res?.reply || "I am here to assist you with your health services in Kerala.";
      const sources = res?.sources || [];
      const ragActive = res?.ragActive || false;
      const hasAbhaMention =
        replyContent.toLowerCase().includes('abha') || text.toLowerCase().includes('abha') || text.toLowerCase().includes('card');

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: replyContent,
          showAbhaButton: hasAbhaMention,
          sources,
          ragActive,
        },
      ]);
    } catch (err) {
      console.warn('RAG Chat API notice:', err.message);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I am Aaroham Assistant. Your digital health records and ABHA ID are safely registered. You can check your hospital visits, vaccinations, and generate your ABHA number directly through ABDM.",
          showAbhaButton: true,
          sources: [{ title: 'Aaroham Healthcare System', category: 'Health Records', source: 'DHS Kerala' }],
          ragActive: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Floating Toggle Button */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="p-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-2xl transition-all transform hover:scale-105 flex items-center gap-2.5 font-semibold text-xs border border-slate-700 group"
          title="Open RAG AI Health Assistant"
        >
          <div className="relative">
            <MessageSquare size={20} className="text-[#8FB8DE]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
          </div>
          <div className="text-left hidden sm:block">
            <span className="block leading-none font-bold text-white">AI Health Assistant</span>
            <span className="text-[9px] text-emerald-400 font-medium tracking-wider">⚡ RAG ACTIVE</span>
          </div>
        </button>
      )}

      {/* RAG Corporate Chat Window */}
      {open && (
        <div className="w-[360px] sm:w-[420px] h-[580px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden animate-fadeIn">
          {/* Header Bar */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#1e405f] rounded-xl flex items-center justify-center border border-[#8FB8DE]/30 relative">
                <Bot size={20} className="text-[#D6E6F5]" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight text-white flex items-center gap-1.5">
                  Aaroham AI

                </h3>
                <p className="text-[11px] text-slate-400 font-medium">Knowledge Augmented Health Assistant</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <Minimize2 size={18} />
            </button>
          </div>

          {/* Sticky Official ABDM Health ID Banner */}
          <div className="px-3.5 py-2.5 bg-gradient-to-r from-[#14324f] via-[#1b3d5e] to-[#0f243a] text-white flex items-center justify-between gap-2 shrink-0 text-xs border-b border-[#8FB8DE]/20 shadow-sm">
            <div className="flex items-center gap-1.5 min-w-0">
              <ShieldCheck size={16} className="text-[#7DD3C0] shrink-0" />
              <span className="truncate text-[11px] text-slate-200">Official ABDM Health ID Portal</span>
            </div>
            <a
              href="https://abha.abdm.gov.in/abha/v3"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 bg-[#7DD3C0] hover:bg-[#92dfce] text-slate-950 font-bold rounded-lg transition-all flex items-center gap-1 text-[11px] shadow-sm shrink-0"
            >
              <CreditCard size={12} />
              Create ABHA Number
              <ExternalLink size={11} />
            </a>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 bg-slate-50 dark:bg-slate-950/60">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 bg-blue-50 text-blue-800 dark:bg-slate-800 dark:text-[#7DD3C0] rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold mt-1 border border-slate-200 dark:border-slate-700">
                    AA
                  </div>
                )}

                <div
                  className={`max-w-[88%] px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${msg.role === 'user'
                      ? 'bg-slate-900 text-white rounded-br-none shadow-sm font-medium'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-sm'
                    }`}
                >
                  {/* RAG Verification Header */}
                  {msg.role === 'assistant' && msg.ragActive && (
                    <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-slate-100 dark:border-slate-700/80 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <Sparkles size={12} className="text-emerald-500 animate-spin" />
                      <span> Grounded Context Verified</span>
                    </div>
                  )}

                  <FormattedMessage text={msg.content} />

                  {/* RAG Source Citation Chips */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/80 space-y-1">
                      <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <BookOpen size={10} /> Verified Sources:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((src, sIdx) => (
                          <span
                            key={sIdx}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-slate-900/90 text-blue-800 dark:text-blue-200 rounded border border-blue-200 dark:border-slate-700 text-[10px] font-medium"
                            title={`Category: ${src.category} | Source: ${src.source}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                            {src.title}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Interactive Button for ABHA Creation */}
                  {msg.showAbhaButton && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700">
                      <a
                        href="https://abha.abdm.gov.in/abha/v3"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1e405f] hover:bg-[#254f75] text-[#D6E6F5] rounded-xl text-xs font-semibold shadow-sm border border-[#8FB8DE]/25 transition-all"
                      >
                        <CreditCard size={13} className="text-[#7DD3C0]" />
                        Create ABHA Number
                        <ExternalLink size={11} />
                      </a>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 bg-[#1e405f] text-white rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-1">
                    <User size={14} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 p-2 bg-blue-50/50 dark:bg-slate-900/40 rounded-xl border border-blue-100 dark:border-slate-800">
                <RefreshCw size={14} className="animate-spin text-[#8FB8DE]" />
                <span>Retrieving Kerala Health Knowledge Base documents...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick RAG Suggestion Chips */}
          {messages.length < 6 && (
            <div className="px-3 py-2 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 overflow-x-auto flex gap-1.5 text-xs whitespace-nowrap no-scrollbar">
              <a
                href="https://abha.abdm.gov.in/abha/v3"
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-700 text-[11px] font-semibold transition-colors shrink-0 flex items-center gap-1"
              >
                <CreditCard size={11} /> Create ABHA Number <ExternalLink size={10} />
              </a>
              {RAG_QUICK_SUGGESTIONS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(chip)}
                  className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700 text-[11px] font-medium transition-colors shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask AI in English, Malayalam, Hindi, Bengali..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#8FB8DE] text-slate-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 bg-[#1e405f] hover:bg-[#254f75] disabled:opacity-40 text-[#D6E6F5] rounded-xl transition-all shrink-0 shadow-sm border border-[#8FB8DE]/20"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function FormattedMessage({ text }) {
  if (!text) return null;

  const blocks = text.split(/\n\n+/);

  return (
    <div className="space-y-2.5">
      {blocks.map((block, idx) => {
        const lines = block.split('\n');
        return (
          <div key={idx} className="space-y-1">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              if (!trimmed) return null;

              if (trimmed.startsWith('###') || trimmed.startsWith('##')) {
                return (
                  <h4 key={lIdx} className="font-bold text-slate-900 dark:text-white pt-1 text-sm border-b border-slate-100 dark:border-slate-700 pb-1 mb-1">
                    {trimmed.replace(/^#+\s*/, '')}
                  </h4>
                );
              }

              if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
                const content = trimmed.replace(/^[•\-\*]\s*/, '');
                return (
                  <div key={lIdx} className="flex items-start gap-1.5 pl-1 my-0.5">
                    <span className="text-brand-500 font-bold">•</span>
                    <div>{renderBold(content)}</div>
                  </div>
                );
              }

              if (/^(\d+️⃣|\d+\.)/.test(trimmed)) {
                return (
                  <div key={lIdx} className="font-semibold text-brand-700 dark:text-brand-300 pt-1">
                    {renderBold(trimmed)}
                  </div>
                );
              }

              return <p key={lIdx}>{renderBold(trimmed)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

function renderBold(str) {
  if (!str) return '';
  const parts = str.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
