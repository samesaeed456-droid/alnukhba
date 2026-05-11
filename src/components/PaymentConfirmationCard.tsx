import React, { useState } from "react";
import { 
  ShieldCheck, 
  CheckCircle, 
  Plus, 
  TrendingUp, 
  Hash, 
  Camera,
  X,
  Info,
  Lightbulb
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FloatingInput } from "./FloatingInput";

interface PaymentConfirmationCardProps {
  paymentAmount: string;
  paymentReference: string;
  paymentProof?: string;
  fieldErrors: string[];
  onAmountChange: (value: string) => void;
  onReferenceChange: (value: string) => void;
  onProofChange: (value: string | undefined) => void;
  onShowToast: (message: string, type: "success" | "error" | "info") => void;
  primaryColor?: string;
}

export function PaymentConfirmationCard({
  paymentAmount,
  paymentReference,
  paymentProof,
  fieldErrors,
  onAmountChange,
  onReferenceChange,
  onProofChange,
  onShowToast,
  primaryColor = "#ea580c"
}: PaymentConfirmationCardProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploading(true);
        setUploadProgress(10);
        const { uploadToCloudinary } = await import("../lib/cloudinary");
        
        // Simulating progress since simple cloudinary upload is usually fast
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 300);

        onShowToast("جاري رفع الإشعار...", "info");
        const secureUrl = await uploadToCloudinary(file);
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        setTimeout(() => {
          onProofChange(secureUrl);
          setIsUploading(false);
          setUploadProgress(0);
          onShowToast("تم رفع الإشعار بنجاح", "success");
        }, 500);

      } catch (err: any) {
        setIsUploading(false);
        setUploadProgress(0);
        onShowToast(err.message || "فشل رفع الإشعار", "error");
      }
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden mt-6">
      <div className="p-4 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
              style={{ backgroundColor: `${primaryColor}10` }}
            >
              <ShieldCheck className="w-5 h-5" style={{ color: primaryColor }} />
            </div>
            <div>
              <h3 className="text-base font-black text-carbon leading-tight">توثيق الدفع</h3>
              <p className="text-[9px] font-black text-titanium/30 uppercase tracking-widest">Secure Validation</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-100">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-titanium/50">النظام نشط</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Amount Field */}
          <div className="space-y-1.5 group/field">
            <div className="flex items-center gap-2 px-1">
              <TrendingUp className="w-3.5 h-3.5 text-solar" />
              <span className="text-[10px] font-black text-carbon">المبلغ المحول</span>
            </div>
            <div className="relative">
              <FloatingInput
                label="المبلغ"
                type="tel"
                name="paymentAmount"
                inputMode="numeric"
                value={paymentAmount}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^\d.]/g, "");
                  onAmountChange(val);
                }}
                className={`text-left font-mono text-xl font-black h-14 transition-all duration-300 rounded-2xl ${
                  fieldErrors.includes("paymentAmount") 
                    ? "border-red-500 ring-4 ring-red-500/10" 
                    : "border-slate-100 bg-slate-50/50 focus:bg-white focus:border-solar"
                }`}
                dir="ltr"
                endElement={paymentAmount ? <div className="text-[10px] font-black text-titanium/40 mr-4">YER</div> : null}
              />
            </div>
          </div>

          {/* Reference Field */}
          <div className="space-y-1.5 group/field">
            <div className="flex items-center gap-2 px-1">
              <Hash className="w-3.5 h-3.5 text-solar" />
              <span className="text-[10px] font-black text-carbon">رقم المرجع</span>
            </div>
            <div className="relative">
              <FloatingInput
                label="رقم الإشعار"
                type="tel"
                name="paymentReference"
                inputMode="numeric"
                value={paymentReference}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  onReferenceChange(val);
                }}
                className={`text-left font-mono text-xl font-black h-14 transition-all duration-300 rounded-2xl ${
                  fieldErrors.includes("paymentReference") 
                    ? "border-red-500 ring-4 ring-red-500/10" 
                    : "border-slate-100 bg-slate-50/50 focus:bg-white focus:border-solar"
                }`}
                dir="ltr"
                endElement={paymentReference ? <CheckCircle className="w-5 h-5 text-emerald-500 mr-2" /> : null}
              />
            </div>
          </div>
        </div>

        {/* Proof Upload Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Camera className="w-3.5 h-3.5 text-titanium/30" />
              <span className="text-[10px] font-black text-titanium/60">صورة إشعار التحويل</span>
            </div>
            {paymentProof && (
              <button 
                onClick={() => onProofChange(undefined)}
                className="text-[9px] font-black text-red-500 hover:underline"
              >
                إستبدال الصورة
              </button>
            )}
          </div>
          
          <div className="relative">
            <AnimatePresence mode="wait">
              {isUploading ? (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="w-full h-32 rounded-2xl bg-slate-50 border-2 border-dashed border-solar/20 flex flex-col items-center justify-center gap-3 px-8"
                >
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-solar"
                      animate={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black text-carbon">جاري الرفع... {uploadProgress}%</span>
                </motion.div>
              ) : paymentProof ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                  className="relative w-full h-32 rounded-2xl overflow-hidden border border-slate-100 group/preview shadow-inner bg-slate-50"
                >
                  <img src={paymentProof} alt="Receipt" className="w-full h-full object-contain p-2" />
                  <div className="absolute inset-0 bg-carbon/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                    <div className="bg-white/90 backdrop-blur scale-90 px-4 py-2 rounded-xl text-[10px] font-black text-carbon flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      تم التوثيق
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 border-2 border-dashed border-slate-100 rounded-2xl hover:bg-slate-100 hover:border-solar/30 transition-all cursor-pointer group/cam">
                    <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} className="hidden" />
                    <Camera className="w-5 h-5 text-solar mb-1" />
                    <span className="text-[10px] font-black text-carbon">كاميرا</span>
                  </label>
                  <label className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-50 border-2 border-dashed border-slate-100 rounded-2xl hover:bg-slate-100 hover:border-solar/30 transition-all cursor-pointer group/gal">
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    <Plus className="w-5 h-5 text-titanium/20 mb-1" />
                    <span className="text-[10px] font-black text-carbon">استوديو</span>
                  </label>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Info */}
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100/50">
          <Info className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-[9px] font-bold text-emerald-800 leading-relaxed">
            يرجى تصوير سند العملية بوضوح وتأكد من أن الرقم المرجعي والمبلغ مطابقان تماماً لما أدخلته لتفادي تأخير مراجعة الطلب.
          </p>
        </div>
      </div>
    </div>
  );
}

