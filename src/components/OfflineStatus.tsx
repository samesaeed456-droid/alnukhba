import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

const OfflineStatus: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[10000] bg-red-600 text-white py-2 px-4 flex items-center justify-center gap-3 shadow-lg"
        >
          <WifiOff className="w-5 h-5 animate-pulse" />
          <span className="text-sm font-medium">أنت لست متصلاً بالإنترنت. سيتم التحديث فور عودة الاتصال.</span>
          <button 
            onClick={() => window.location.reload()}
            className="ml-2 p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {showReconnected && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[10000] bg-emerald-600 text-white py-2 px-4 flex items-center justify-center gap-3 shadow-lg"
        >
          <Wifi className="w-5 h-5" />
          <span className="text-sm font-medium">تمت استعادة الاتصال بنجاح.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineStatus;
