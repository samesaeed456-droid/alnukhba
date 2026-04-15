import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X, Loader2, Trash2, Info, AlertCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  type = 'danger',
  isLoading: externalLoading = false
}: ConfirmationModalProps) {
  const [internalLoading, setInternalLoading] = React.useState(false);
  const isLoading = externalLoading || internalLoading;

  const handleConfirm = async () => {
    if (isLoading) return;
    
    const result = onConfirm();
    if (result instanceof Promise) {
      setInternalLoading(true);
      try {
        await result;
        onClose();
      } catch (error) {
        console.error('Confirmation error:', error);
      } finally {
        setInternalLoading(false);
      }
    } else {
      onClose();
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'danger': return <Trash2 className="w-8 h-8" />;
      case 'warning': return <AlertTriangle className="w-8 h-8" />;
      case 'success': return <AlertCircle className="w-8 h-8" />;
      case 'info': return <Info className="w-8 h-8" />;
      default: return <Info className="w-8 h-8" />;
    }
  };

  const getTypeStyles = () => {
    switch (type) {
      case 'danger': return {
        iconBg: 'bg-red-50 text-red-500',
        confirmBtn: 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
      };
      case 'warning': return {
        iconBg: 'bg-amber-50 text-amber-500',
        confirmBtn: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
      };
      case 'success': return {
        iconBg: 'bg-green-50 text-green-500',
        confirmBtn: 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/20'
      };
      case 'info': return {
        iconBg: 'bg-blue-50 text-blue-500',
        confirmBtn: 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20'
      };
      default: return {
        iconBg: 'bg-solar/10 text-solar',
        confirmBtn: 'bg-solar hover:bg-solar-dark text-white shadow-solar/20'
      };
    }
  };

  const styles = getTypeStyles();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : onClose}
            className="absolute inset-0 bg-carbon/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center border border-gray-100"
          >
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 transition-all ${styles.iconBg}`}>
              {getIcon()}
            </div>
            
            <h3 className="text-2xl font-black text-carbon mb-3 tracking-tight">{title}</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed font-medium">
              {message}
            </p>
            
            <div className="flex gap-3">
              <button
                disabled={isLoading}
                onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl border border-gray-100 font-bold text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all active:scale-95 disabled:opacity-50"
              >
                {cancelText}
              </button>
              <button
                disabled={isLoading}
                onClick={handleConfirm}
                className={`flex-[1.5] py-3.5 rounded-2xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 ${styles.confirmBtn}`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
