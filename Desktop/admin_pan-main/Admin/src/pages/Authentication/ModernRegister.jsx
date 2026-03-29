import React, { useState, useEffect } from 'react';
import { useKindeAuth } from '@kinde-oss/kinde-auth-react';
import { motion } from 'framer-motion';
import { UserPlus, Sparkles, Zap, Shield, Clock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

const ModernRegister = () => {
  const { register } = useKindeAuth();
  const [email, setEmail] = useState('');

  useEffect(() => {
    document.title = "Kayıt Ol | MevzuatAI";
  }, []);

  const features = [
    {
      icon: Sparkles,
      title: "Ücretsiz ve Sınırsız",
      description: "Tüm özelliklere sınırsız erişim",
      color: "emerald"
    },
    {
      icon: Zap,
      title: "Yapay Zeka Destekli",
      description: "Gelişmiş AI analiz motoru",
      color: "blue"
    },
    {
      icon: Shield,
      title: "Güvenli ve Korumalı",
      description: "End-to-end şifreleme",
      color: "purple"
    },
    {
      icon: Clock,
      title: "7/24 Erişim",
      description: "İstediğiniz zaman kullanın",
      color: "orange"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Grid Pattern */}
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

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-6xl flex gap-8 items-center">
        {/* Left Side - Info */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="hidden lg:flex flex-1 flex-col"
        >
          <div className="mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-6 shadow-lg shadow-emerald-500/50"
            >
              <Zap className="w-8 h-8 text-white" strokeWidth={2.5} />
            </motion.div>

            <h1 className="text-5xl font-bold text-white mb-4 leading-tight">
              Karmaşıklığı<br />
              <span 
                style={{ 
                  background: 'linear-gradient(to right, #10b981, #06b6d4)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Sadeleştirin
              </span>
            </h1>
            
            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
              İSG mevzuatı, risk değerlendirme ve uyumluluk süreçlerinizi yapay zeka ile kolaylaştırın.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/10 transition-all"
              >
                <div 
                  className={`w-10 h-10 rounded-xl bg-${feature.color}-500/20 flex items-center justify-center mb-3`}
                >
                  <feature.icon className={`w-5 h-5 text-${feature.color}-400`} />
                </div>
                <h3 className="text-white font-semibold text-sm mb-1">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-xs">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right Side - Register Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 max-w-md w-full"
        >
          <div className="text-center mb-8 lg:hidden">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl mb-6 shadow-2xl shadow-emerald-500/50"
            >
              <UserPlus className="w-10 h-10 text-white" strokeWidth={2.5} />
            </motion.div>
            
            <h1 className="text-4xl font-bold text-white mb-2">
              Hesap Oluştur
            </h1>
            <p className="text-slate-300">
              Hemen başlayın, ücretsiz
            </p>
          </div>

          {/* Register Card */}
          <div 
            className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20"
            style={{
              boxShadow: '0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
            }}
          >
            <div className="hidden lg:block mb-6">
              <h2 className="text-2xl font-bold text-white mb-2">
                Hesap Oluştur
              </h2>
              <p className="text-slate-300 text-sm">
                Birkaç saniyede başlayın
              </p>
            </div>

            <div className="space-y-6">
              {/* Quick Register Button */}
              <button
                onClick={() => register()}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg shadow-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/70 transition-all duration-300 hover:scale-[1.02]"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Hızlı Kayıt - Google ile
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-600/50"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-4 py-1 bg-slate-800/70 text-slate-400 rounded-full backdrop-blur-sm">
                    veya email ile
                  </span>
                </div>
              </div>

              {/* Email Register */}
              <button
                onClick={() => register()}
                className="w-full group relative overflow-hidden bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl font-semibold border border-white/20 hover:border-white/30 transition-all duration-300"
              >
                <span className="flex items-center justify-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email ile Kayıt Ol
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>

              {/* Benefits */}
              <div className="space-y-3 bg-slate-800/30 rounded-2xl p-5 backdrop-blur-sm border border-slate-700/50">
                <p className="text-white font-semibold text-sm mb-3">
                  Kayıt olduğunuzda:
                </p>
                {[
                  "Sınırsız mevzuat sorgusu",
                  "Gelişmiş AI analiz araçları",
                  "Risk değerlendirme şablonları",
                  "Anlık güncellemeler"
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm text-slate-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-sm text-slate-400">
                  Zaten hesabınız var mı?{' '}
                  <a
                    href="/login"
                    className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors underline-offset-4 hover:underline"
                  >
                    Giriş Yapın
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* Terms */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-center"
          >
            <p className="text-xs text-slate-400">
              Kayıt olarak{' '}
              <a href="#" className="text-emerald-400 hover:text-emerald-300 transition-colors underline-offset-4 hover:underline">
                Kullanım Şartları
              </a>{' '}
              ve{' '}
              <a href="#" className="text-emerald-400 hover:text-emerald-300 transition-colors underline-offset-4 hover:underline">
                Gizlilik Politikası
              </a>
              'nı kabul etmiş olursunuz
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
    </div>
  );
};

export default ModernRegister;
