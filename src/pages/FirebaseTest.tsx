import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle, RefreshCw, Database, Key, Globe } from 'lucide-react';
import { motion } from 'motion/react';
import { db, doc, getDocFromServer } from '../lib/firebase';
import firebaseConfigJson from '../../firebase-applet-config.json';

export default function FirebaseTest() {
  const [status, setStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [configInfo, setConfigInfo] = useState<any>({});

  const checkConnection = async () => {
    setStatus('testing');
    setErrorDetails(null);
    
    try {
      // 1. Check if config is loaded
      const envVars = Object.keys(import.meta.env).filter(key => key.startsWith('VITE_FIREBASE_'));
      
      const config = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
        appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
        detectedKeys: envVars
      };
      setConfigInfo(config);

      if (!config.apiKey || config.apiKey.includes('TODO')) {
        throw new Error('Firebase API Key is missing or invalid in Vercel environment variables.');
      }

      // 2. Try to reach Firestore
      await getDocFromServer(doc(db, '_health_check', 'ping'));
      setStatus('success');
    } catch (err: any) {
      console.error('Test Connection Error:', err);
      setStatus('error');
      setErrorDetails(err.message || String(err));
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-right" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-slate-900 border border-white/10 rounded-[2rem] p-8 shadow-2xl"
      >
        <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-6">
          <div className="p-3 bg-blue-500/10 rounded-2xl">
            <Database className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">فحص اتصال Firebase</h1>
            <p className="text-slate-400 text-sm">أداة التحقق من الربط مع Vercel</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Status Card */}
          <div className={`p-6 rounded-2xl border ${
            status === 'testing' ? 'bg-blue-500/5 border-blue-500/20' :
            status === 'success' ? 'bg-green-500/5 border-green-500/20' :
            'bg-red-500/5 border-red-500/20'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-300 font-medium">حالة الاتصال:</span>
              {status === 'testing' && (
                <div className="flex items-center gap-2 text-blue-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جاري الفحص...</span>
                </div>
              )}
              {status === 'success' && (
                <div className="flex items-center gap-2 text-green-400">
                  <ShieldCheck className="w-5 h-5" />
                  <span>متصل بنجاح</span>
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span>فشل الاتصال</span>
                </div>
              )}
            </div>

            {status === 'error' && (
              <div className="mt-4 p-4 bg-red-500/10 rounded-xl text-red-400 text-sm font-mono break-all">
                {errorDetails}
              </div>
            )}
          </div>

          {/* Config Check */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <Key className="w-3 h-3" />
                <span>المفاتيح المكتشفة في Vercel</span>
              </div>
              <div className="text-white font-mono text-[10px] space-y-1">
                {configInfo.detectedKeys?.length > 0 ? (
                  configInfo.detectedKeys.map((k: string) => <div key={k} className="text-green-400">{k}</div>)
                ) : (
                  <div className="text-red-400">لم يتم اكتشاف أي مفاتيح تبدأ بـ VITE_FIREBASE_</div>
                )}
              </div>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/5">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                <Globe className="w-3 h-3" />
                <span>Project ID المستخدم</span>
              </div>
              <div className="text-white font-mono text-xs truncate">
                {configInfo.projectId || '❌ مفقود'}
              </div>
            </div>
          </div>

          <button
            onClick={checkConnection}
            className="w-full py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            إعادة الفحص
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-slate-500 text-xs">
            إذا فشل الفحص، تأكد من إضافة المتغيرات في Vercel ببادئة <code className="text-blue-400">VITE_FIREBASE_</code>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
