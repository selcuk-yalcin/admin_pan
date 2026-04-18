import React, { useState, useEffect } from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Zap, Shield, Clock } from 'lucide-react';

const ModernKindeLogin = () => {
  const { login, register } = useKindeAuth();
  const [isLogin, setIsLogin] = useState(true);

  // Sayfa başlığını ayarla
  useEffect(() => {
    document.title = "Giriş Yap | MevzuatAI";
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-3xl mb-6 shadow-2xl shadow-purple-500/50"
          >
            <Zap className="w-10 h-10 text-white" strokeWidth={2.5} />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-5xl font-bold text-white mb-3"
            style={{ 
              background: 'linear-gradient(to right, #fff, #e0e7ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}
          >
            MevzuatAI
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-300 text-lg"
          >
            Karmaşıklığı sadeleştirmeye devam edin
          </motion.p>
        </div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20"
          style={{
            boxShadow: '0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}
        >
          {/* Tabs */}
          <div className="flex gap-2 p-1.5 bg-slate-800/50 rounded-2xl mb-8 backdrop-blur-sm">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3.5 rounded-xl font-semibold transition-all duration-300 ${
                isLogin
                  ? 'bg-white text-slate-900 shadow-lg shadow-white/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Giriş Yap
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3.5 rounded-xl font-semibold transition-all duration-300 ${
                !isLogin
                  ? 'bg-white text-slate-900 shadow-lg shadow-white/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Kayıt Ol
            </button>
          </div>

          {/* Content */}
          <motion.div
            key={isLogin ? 'login' : 'register'}
            initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {isLogin ? (
              <div className="space-y-6">
                <button
                  onClick={() => login()}
                  className="w-full group relative overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/70 transition-all duration-300 hover:scale-[1.02]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Kinde ile Giriş Yap
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-600/50"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 py-1 bg-slate-800/70 text-slate-400 rounded-full text-xs font-medium backdrop-blur-sm">
                      Güvenli ve hızlı giriş
                    </span>
                  </div>
                </div>

                <div className="bg-slate-800/30 rounded-2xl p-4 backdrop-blur-sm border border-slate-700/50">
                  <p className="text-center text-sm text-slate-300">
                    <Shield className="w-4 h-4 inline mr-2 text-green-400" />
                    Email/şifre veya Google ile giriş yapabilirsiniz
                  </p>
                </div>

                {/* Forgot Password Link */}
                <div className="text-center">
                  <a
                    href="/forgot-password"
                    className="text-slate-400 hover:text-white text-sm transition-colors inline-flex items-center gap-1 group"
                  >
                    <span className="border-b border-transparent group-hover:border-slate-400">
                      Şifrenizi mi unuttunuz?
                    </span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <button
                  onClick={() => register()}
                  className="w-full group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg shadow-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/70 transition-all duration-300 hover:scale-[1.02]"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Hemen Kayıt Ol
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </button>

                <div className="space-y-3 bg-slate-800/30 rounded-2xl p-5 backdrop-blur-sm border border-slate-700/50">
                  <div className="flex items-center gap-3 text-sm text-slate-200">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span>Ücretsiz ve sınırsız kullanım</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-200">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Zap className="w-4 h-4 text-blue-400" />
                    </div>
                    <span>Gelişmiş yapay zeka analizi</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-200">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-purple-400" />
                    </div>
                    <span>Anlık mevzuat güncellemeleri</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-slate-400">
            Giriş yaparak{' '}
            <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors underline-offset-4 hover:underline">
              Kullanım Şartları
            </a>{' '}
            ve{' '}
            <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors underline-offset-4 hover:underline">
              Gizlilik Politikası
            </a>
            'nı kabul etmiş olursunuz
          </p>
        </motion.div>

        {/* Decorative Elements */}
        <div className="absolute -z-10 top-0 right-0 w-72 h-72 bg-purple-500/30 rounded-full filter blur-3xl opacity-20"></div>
        <div className="absolute -z-10 bottom-0 left-0 w-72 h-72 bg-blue-500/30 rounded-full filter blur-3xl opacity-20"></div>
      </motion.div>

      {/* Custom CSS Animations */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5);
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.5);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 92, 246, 0.7);
        }
      `}</style>
    </div>
  );
};

export default ModernKindeLogin;
