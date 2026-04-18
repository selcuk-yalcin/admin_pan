import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, Mail, ArrowRight, CheckCircle2, ArrowLeft, Shield } from 'lucide-react';

const ModernForgetPassword = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    document.title = "Şifremi Unuttum | MevzuatAI";
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simüle et - Kinde'nin şifre sıfırlama sayfasına yönlendir
    setTimeout(() => {
      setIsSubmitted(true);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
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

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mb-6 shadow-2xl shadow-indigo-500/50"
          >
            <KeyRound className="w-10 h-10 text-white" strokeWidth={2.5} />
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl font-bold text-white mb-3"
          >
            Şifremi Unuttum
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-slate-300 text-lg"
          >
            {isSubmitted 
              ? "Email adresinizi kontrol edin" 
              : "Hesabınıza tekrar erişin"
            }
          </motion.p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20"
          style={{
            boxShadow: '0 20px 60px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)'
          }}
        >
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Info Box */}
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 backdrop-blur-sm">
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-200">
                      Email adresinize şifre sıfırlama bağlantısı göndereceğiz. Bağlantı 1 saat geçerlidir.
                    </p>
                  </div>
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email Adresi
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@email.com"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/70 transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                      />
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      Sıfırlama Bağlantısı Gönder
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>

              {/* Back to Login */}
              <div className="text-center">
                <a
                  href="/login"
                  className="text-slate-300 hover:text-white text-sm transition-colors inline-flex items-center gap-2 group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="border-b border-transparent group-hover:border-white">
                    Giriş sayfasına dön
                  </span>
                </a>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Success Message */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/50">
                  <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.5} />
                </div>

                <h3 className="text-2xl font-bold text-white mb-3">
                  Email Gönderildi!
                </h3>

                <p className="text-slate-300 mb-6 leading-relaxed">
                  <strong className="text-white">{email}</strong> adresine şifre sıfırlama bağlantısı gönderdik. 
                  Lütfen email kutunuzu kontrol edin.
                </p>

                <div className="bg-slate-800/30 rounded-2xl p-5 backdrop-blur-sm border border-slate-700/50 w-full">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 text-sm text-slate-200">
                      <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-indigo-400 font-bold">1</span>
                      </div>
                      <span>Email kutunuzu açın</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm text-slate-200">
                      <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-indigo-400 font-bold">2</span>
                      </div>
                      <span>Şifre sıfırlama bağlantısına tıklayın</span>
                    </div>
                    <div className="flex items-start gap-3 text-sm text-slate-200">
                      <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-indigo-400 font-bold">3</span>
                      </div>
                      <span>Yeni şifrenizi oluşturun</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="w-full bg-white/5 hover:bg-white/10 text-white py-3 rounded-2xl font-semibold border border-white/20 hover:border-white/30 transition-all"
                >
                  Tekrar Gönder
                </button>

                <a
                  href="/login"
                  className="block w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-2xl font-semibold text-center shadow-lg shadow-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/70 transition-all hover:scale-[1.02]"
                >
                  Giriş Sayfasına Dön
                </a>
              </div>
            </div>
          )}
        </motion.div>

        {/* Help Text */}
        {!isSubmitted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-center"
          >
            <p className="text-sm text-slate-400">
              Email alamadınız mı?{' '}
              <button 
                onClick={() => alert('Spam klasörünü kontrol edin veya support@mevzuatai.com adresine yazın')}
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors underline-offset-4 hover:underline"
              >
                Yardım alın
              </button>
            </p>
          </motion.div>
        )}

        {/* Decorative Elements */}
        <div className="absolute -z-10 top-0 right-0 w-72 h-72 bg-indigo-500/30 rounded-full filter blur-3xl opacity-20"></div>
        <div className="absolute -z-10 bottom-0 left-0 w-72 h-72 bg-purple-500/30 rounded-full filter blur-3xl opacity-20"></div>
      </motion.div>

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

export default ModernForgetPassword;
