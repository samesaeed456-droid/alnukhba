import { toast } from "sonner";
import React from "react";
import { Check, X, AlertCircle, Info, Package } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastOptions {
  title: string;
  description?: string;
  image?: string;
  actionText?: string;
  onAction?: () => void;
  duration?: number;
}

/**
 * Global cache to deduplicate identical toast notifications appearing in quick succession
 */
let lastToastCache = {
  key: "",
  timestamp: 0,
};

/**
 * Premium Luxury Arabic Toast with Framer Motion
 */
export const showLuxuryToast = (type: ToastType, options: ToastOptions) => {
  const { title, description, image, actionText, onAction, duration = 2000 } = options;

  // Deduplicate rapid identical toasts (within 600ms)
  const toastKey = `${type}-${title}-${description || ""}`;
  const now = Date.now();
  if (toastKey === lastToastCache.key && now - lastToastCache.timestamp < 600) {
    return;
  }
  lastToastCache = { key: toastKey, timestamp: now };

  const getIcon = () => {
    switch (type) {
      case "success": return <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />;
      case "error": return <X className="w-4 h-4 text-red-400 stroke-[3]" />;
      case "warning": return <AlertCircle className="w-4 h-4 text-amber-400 stroke-[3]" />;
      default: return <Info className="w-4 h-4 text-blue-400 stroke-[3]" />;
    }
  };

  const getAccentColor = () => {
    switch (type) {
      case "success": return "border-emerald-500/20";
      case "error": return "border-red-500/20";
      default: return "border-[#c5a880]/20";
    }
  };

  toast.custom((t) => (
    <motion.div 
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      onClick={() => toast.dismiss(t)}
      className={`flex items-center justify-between w-[92vw] max-w-sm bg-slate-900/95 text-white p-2.5 rounded-2xl shadow-2xl border ${getAccentColor()} backdrop-blur-xl cursor-pointer hover:bg-slate-900 active:scale-[0.98] transition-all duration-150`}
      dir="rtl"
    >
      <div className="flex items-center gap-3 min-w-0">
        {image ? (
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/5 bg-white/5 flex-shrink-0 relative">
            <img src={image} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/10"></div>
          </div>
        ) : (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-white/5 ${
            type === 'success' ? 'bg-emerald-500/10' : type === 'error' ? 'bg-red-500/10' : 'bg-[#c5a880]/10'
          }`}>
            {getIcon()}
          </div>
        )}
        
        <div className="min-w-0">
          <p className={`text-[11px] font-black flex items-center gap-1 ${
            type === 'success' ? 'text-emerald-400' : type === 'error' ? 'text-red-400' : 'text-[#c5a880]'
          }`}>
            {type === 'success' && !image && <Check className="w-3 h-3 stroke-[3]" />}
            {title}
          </p>
          {description && (
            <p className="text-[10px] text-slate-300 truncate max-w-[150px] mt-0.5 leading-tight font-medium">
              {description}
            </p>
          )}
        </div>
      </div>

      {actionText && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onAction?.();
            toast.dismiss(t);
          }}
          className="text-[10px] font-black bg-[#c5a880] text-slate-950 px-4 py-2 rounded-xl hover:brightness-110 transition-all active:scale-90 shadow-lg shadow-[#c5a880]/20 flex-shrink-0 mr-2"
        >
          {actionText}
        </button>
      )}
    </motion.div>
  ), { duration, position: 'top-center' });
};

/**
 * Beautiful Order Shipped Notification
 */
export const showOrderShippedToast = (title: string, description: string, onAction?: () => void) => {
  toast.custom((t) => (
    <motion.div 
      initial={{ opacity: 0, y: -50, rotateX: -45 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={() => toast.dismiss(t)}
      className="flex items-center gap-4 w-[90vw] max-w-sm bg-gradient-to-br from-amber-500 to-amber-700 text-white p-4 rounded-3xl shadow-[0_20px_50px_rgba(217,119,6,0.5)] border border-amber-400 backdrop-blur-xl cursor-pointer"
      dir="rtl"
    >
      <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
        <Package className="w-7 h-7 text-white" />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-bold text-white">{title}</h4>
        <p className="text-xs text-amber-100 truncate mt-1">{description}</p>
      </div>

      <button 
        onClick={(e) => {
          e.stopPropagation();
          onAction?.();
          toast.dismiss(t);
        }}
        className="bg-white text-amber-800 text-xs font-bold px-4 py-2 rounded-full hover:bg-amber-50 transition-colors shrink-0"
      >
        تفاصيل
      </button>
    </motion.div>
  ), { duration: 5000, position: 'top-center' });
};
