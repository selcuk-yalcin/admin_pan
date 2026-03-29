import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader, FileText, AlertCircle, Sparkles, Search, TrendingUp, Clock, Shield, Moon, Sun } from 'lucide-react';
import { askLegislationQuestion, resetLegislationConversation } from "../../services/legislationApi";

const ModernLegislationChatbot = () => {
  document.title = "Mevzuat Asistanı | MevzuatAI";

  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const messagesEndRef = useRef(null);
  const [recentQueries, setRecentQueries] = useState([
    "İş kazası bildirimi süresi",
    "KKD kullanım zorunluluğu",
    "İSG eğitim gereksinimleri"
  ]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = {
      role: 'user',
      content: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    const currentQuery = query;
    setQuery('');

    // Add to recent queries
    setRecentQueries(prev => {
      const filtered = prev.filter(q => q !== currentQuery);
      return [currentQuery, ...filtered].slice(0, 5);
    });

    try {
      const response = await askLegislationQuestion(currentQuery);
      
      const assistantMessage = {
        role: 'assistant',
        content: response.answer || response.message || 'Yanıt alınamadı.',
        sources: response.sources || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err.message || 'Bir hata oluştu');
      const errorMessage = {
        role: 'assistant',
        content: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const bgColor = isDarkMode 
    ? 'bg-gradient-to-br from-black via-slate-950 to-purple-950' 
    : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100';
  
  const textColor = isDarkMode ? 'text-slate-200' : 'text-slate-800';
  const cardBg = isDarkMode ? 'bg-slate-900/50' : 'bg-white';
  const inputBg = isDarkMode ? 'bg-slate-900/50' : 'bg-white';
  const borderColor = isDarkMode ? 'border-slate-800' : 'border-slate-200';

  return (
    <div className={`min-h-screen ${bgColor} transition-colors duration-300`}>
      {/* Sidebar */}
      <motion.div 
        initial={{ x: -300 }}
        animate={{ x: 0 }}
        className={`fixed left-0 top-0 h-full w-64 ${isDarkMode ? 'bg-gradient-to-b from-slate-950 to-slate-900' : 'bg-gradient-to-b from-slate-100 to-white'} ${isDarkMode ? 'text-white' : 'text-slate-800'} p-6 shadow-2xl z-10 border-r ${borderColor}`}
      >
        {/* Logo */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-lg">MevzuatAI</h2>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>ONLINE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mb-8">
          <button 
            className={`w-full text-left px-4 py-3 rounded-xl ${isDarkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-700'} font-medium mb-2`}
          >
            Yapay Zeka Sohbet
          </button>
          <button className={`w-full text-left px-4 py-3 rounded-xl ${isDarkMode ? 'hover:bg-slate-800/50 text-slate-400' : 'hover:bg-slate-200/50 text-slate-600'} transition-all`}>
            Arşiv
          </button>
          <button className={`w-full text-left px-4 py-3 rounded-xl ${isDarkMode ? 'hover:bg-slate-800/50 text-slate-400' : 'hover:bg-slate-200/50 text-slate-600'} transition-all`}>
            Yenilikler
          </button>
        </div>

        {/* Recent Queries */}
        <div className="mb-6">
          <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} mb-3 flex items-center gap-2`}>
            <Clock className="w-4 h-4" />
            Son Aramalar
          </h3>
          <div className="space-y-2">
            {recentQueries.map((q, idx) => (
              <motion.button
                key={idx}
                whileHover={{ scale: 1.02, x: 4 }}
                onClick={() => setQuery(q)}
                className={`w-full text-left text-xs px-3 py-2 ${isDarkMode ? 'bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white' : 'bg-slate-200/50 hover:bg-slate-300/50 text-slate-700 hover:text-slate-900'} rounded-lg transition-all`}
              >
                {q}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Dark/Light Mode Toggle */}
        <div className="mt-auto pt-6 border-t border-slate-700">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl ${isDarkMode ? 'bg-slate-800/50 hover:bg-slate-700/50' : 'bg-slate-200/50 hover:bg-slate-300/50'} transition-all`}
          >
            <span className="text-sm font-medium">Tema</span>
            <div className="flex items-center gap-2">
              {isDarkMode ? (
                <>
                  <Moon className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-slate-400">Dark</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span className="text-xs text-slate-600">Light</span>
                </>
              )}
            </div>
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="ml-64 min-h-screen">
        {/* Hero Section */}
        {messages.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[60vh] px-8"
          >
            {/* Main Heading */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center mb-12"
            >
              <h1 className={`text-6xl font-bold mb-4 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                Merhaba, Bugün Hangi
              </h1>
              <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                Mevzuatı İnceliyoruz?
              </h1>
              <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'} mt-6 text-lg max-w-2xl mx-auto`}>
                Resmi Gazete, İş Sağlığı ve tüm mevzuat sorularınız için buradayım.
                <br />
                Karmaşık maddeleri sizin için anlaşılır hale getiririm.
              </p>
            </motion.div>

            {/* Category Cards */}
            <div className="grid grid-cols-4 gap-4 mb-12 max-w-4xl w-full">
              {[
                { icon: AlertCircle, title: "İSG cezaları listele", desc: "İş Kazaları", gradient: "from-red-500 to-orange-500" },
                { icon: Shield, title: "İş kazası bildirim süresi", desc: "KKD", gradient: "from-blue-500 to-cyan-500" },
                { icon: FileText, title: "Son değişiklikler bul", desc: "Risk Değerlendirme", gradient: "from-green-500 to-emerald-500" },
                { icon: TrendingUp, title: "Denetim süreçleri açıkla", desc: "Ceza Yükümlülükleri", gradient: "from-purple-500 to-pink-500" },
              ].map((category, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  onClick={() => setQuery(category.title)}
                  className={`group relative ${cardBg} rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border ${borderColor} overflow-hidden ${isDarkMode ? 'backdrop-blur-sm' : ''}`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-0 group-hover:opacity-5 transition-opacity`} />
                  <category.icon className={`w-8 h-8 mb-3 bg-gradient-to-br ${category.gradient} bg-clip-text text-transparent`} strokeWidth={1.5} />
                  <h3 className={`font-semibold ${textColor} mb-2 text-sm`}>{category.desc}</h3>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-500 group-hover:text-slate-400' : 'text-slate-500 group-hover:text-slate-600'} transition-colors`}>"{category.title}"</p>
                </motion.button>
              ))}
            </div>

            {/* Search Input */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="w-full max-w-3xl"
            >
              <form onSubmit={handleSubmit} className="relative">
                <div className="relative group">
                  <Search className={`absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} group-focus-within:text-purple-500 transition-colors`} />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Bana herhangi bir yasal maddeyi veya merak ettiğin kuralı sorunuz..."
                    className={`w-full pl-14 pr-14 py-5 ${inputBg} rounded-2xl shadow-xl border-2 ${isDarkMode ? 'border-slate-800 focus:border-purple-500' : 'border-slate-200 focus:border-purple-500'} focus:outline-none ${textColor} ${isDarkMode ? 'placeholder-slate-500' : 'placeholder-slate-400'} transition-all text-lg group-focus-within:shadow-2xl ${isDarkMode ? 'backdrop-blur-sm' : ''}`}
                  />
                  <button
                    type="submit"
                    disabled={!query.trim() || isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl px-6 py-2.5 font-medium transition-all disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    {isLoading ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </form>
              <p className={`text-center text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-500'} mt-4`}>
                Yapay zeka hata yapabilir. Önemli kararlar için resmi belgeleri kontrol edin.
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Messages Area */}
        {messages.length > 0 && (
          <div className="max-w-4xl mx-auto px-8 py-8">
            <div className="space-y-6">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-2xl rounded-2xl p-6 shadow-lg ${
                        message.role === 'user'
                          ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white'
                          : `${cardBg} ${textColor} border ${borderColor} ${isDarkMode ? 'backdrop-blur-sm' : ''}`
                      }`}
                    >
                      <div className="prose prose-sm max-w-none">
                        {message.content.split('\n').map((line, i) => (
                          <p key={i} className={message.role === 'user' ? 'text-white mb-2' : (isDarkMode ? 'text-slate-300 mb-2' : 'text-slate-700 mb-2')}>
                            {line}
                          </p>
                        ))}
                      </div>
                      
                      {message.sources && message.sources.length > 0 && (
                        <div className={`mt-4 pt-4 border-t ${borderColor}`}>
                          <p className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-500'} mb-2 flex items-center gap-2`}>
                            <FileText className="w-4 h-4" />
                            Kaynaklar:
                          </p>
                          <div className="space-y-2">
                            {message.sources.map((source, idx) => (
                              <div key={idx} className={`text-xs ${isDarkMode ? 'bg-slate-800/50' : 'bg-slate-50'} rounded-lg p-3 border ${borderColor}`}>
                                <div className={`font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'} mb-1`}>{source.title}</div>
                                <div className={isDarkMode ? 'text-slate-500' : 'text-slate-500'}>{source.content.substring(0, 150)}...</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {message.role === 'user' && (
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-white font-semibold flex-shrink-0">
                        K
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input at bottom when chatting */}
            <div className={`sticky bottom-0 ${isDarkMode ? 'bg-gradient-to-t from-black via-slate-950 to-transparent' : 'bg-gradient-to-t from-slate-50 via-slate-50 to-transparent'} pt-8 pb-6`}>
              <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
                <div className="relative group">
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Devam et..."
                    className={`w-full pl-6 pr-14 py-4 ${inputBg} rounded-2xl shadow-xl border-2 ${isDarkMode ? 'border-slate-800 focus:border-purple-500' : 'border-slate-200 focus:border-purple-500'} focus:outline-none ${textColor} ${isDarkMode ? 'placeholder-slate-500' : 'placeholder-slate-400'} transition-all ${isDarkMode ? 'backdrop-blur-sm' : ''}`}
                  />
                  <button
                    type="submit"
                    disabled={!query.trim() || isLoading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:from-slate-300 disabled:to-slate-400 text-white rounded-xl px-5 py-2 font-medium transition-all disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    {isLoading ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernLegislationChatbot;
