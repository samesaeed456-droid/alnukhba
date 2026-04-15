import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from '../components/Logo';

export default function DevVerify() {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === '1234') {
      setIsSuccess(true);
      setError(false);
      localStorage.setItem('isDev', 'true');
      setTimeout(() => {
        navigate('/admin');
      }, 1500);
    } else {
      setError(true);
      setCode('');
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden" dir="rtl">
      {/* Background Effects */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-slate-900/50 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-8 sm:p-12 border border-white/10 relative z-10"
      >
        <div className="flex justify-center mb-10">
          <Logo variant="light" className="h-12 drop-shadow-lg" />
        </div>

        <div className="relative w-20 h-20 mx-auto mb-8">
          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute inset-0 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30"
              >
                <ShieldCheck className="w-10 h-10 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="lock"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`absolute inset-0 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300 ${
                  error ? 'bg-red-500 shadow-red-500/30' : 'bg-blue-600 shadow-blue-600/30'
                }`}
              >
                <Lock className={`w-10 h-10 text-white ${error ? 'animate-shake' : ''}`} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
          تحقق المطور
        </h1>
        <p className="text-slate-400 mb-8 text-sm">
          يرجى إدخال رمز التحقق الخاص بالمطور للمتابعة
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <input
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="رمز التحقق"
              className={`w-full bg-slate-800/50 border ${
                error ? 'border-red-500 text-red-500' : 'border-white/10 text-white'
              } rounded-2xl py-4 px-6 text-center text-2xl tracking-[1em] focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:tracking-normal placeholder:text-sm placeholder:text-slate-500`}
              maxLength={4}
              autoFocus
            />
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute -bottom-6 left-0 right-0 flex items-center justify-center gap-1 text-red-500 text-xs font-medium"
              >
                <AlertCircle className="w-3 h-3" />
                <span>رمز التحقق غير صحيح</span>
              </motion.div>
            )}
          </div>

          <button
            type="submit"
            disabled={code.length !== 4 || isSuccess}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 group"
          >
            <span>{isSuccess ? 'تم التحقق' : 'تحقق الآن'}</span>
            {!isSuccess && <ArrowRight className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />}
          </button>
        </form>
      </motion.div>

      <p className="mt-8 text-slate-600 text-xs relative z-10">
        &copy; {new Date().getFullYear()} النخبة للإلكترونيات. وصول آمن للمطورين فقط.
      </p>
    </div>
  );
}
