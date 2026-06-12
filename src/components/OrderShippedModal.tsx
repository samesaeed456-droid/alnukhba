import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import confetti from "canvas-confetti";

interface OrderShippedModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
}

export default function OrderShippedModal({ isOpen, onClose, title, description }: OrderShippedModalProps) {
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        duration: 2000,
      });
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-[20px] p-6 shadow-2xl w-full max-w-sm flex flex-col items-center text-center" dir="rtl">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
              <p className="text-gray-600 mb-6">{description}</p>
              
              <button
                onClick={onClose}
                className="w-full py-3 rounded-full text-white font-bold bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 transition-all duration-200 transform hover:scale-105"
              >
                تخطي
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
