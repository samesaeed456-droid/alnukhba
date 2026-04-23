import React, { useState } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { uploadToCloudinary } from '../lib/cloudinary';

interface ImageUploadFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  description?: string;
  className?: string;
}

export const ImageUploadField: React.FC<ImageUploadFieldProps> = ({
  id,
  label,
  value,
  onChange,
  description,
  className = ""
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic local check
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة كبير جداً (الأقصى 5 ميجابايت)");
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      onChange(url);
      toast.success("تم رفع الصورة بنجاح");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "فشل في رفع الصورة");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block text-sm font-bold text-slate-700 mb-1">{label}</label>
      
      <div className="relative group">
        {value ? (
          <div className="relative w-full aspect-video sm:aspect-auto sm:h-32 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden group">
            <img 
              src={value} 
              alt={label} 
              className="w-full h-full object-contain"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <label 
                htmlFor={id}
                className="p-2 bg-white rounded-full text-carbon cursor-pointer hover:scale-110 transition-transform"
              >
                <Upload className="w-5 h-5" />
              </label>
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 bg-red-500 rounded-full text-white hover:scale-110 transition-transform"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <label 
            htmlFor={id}
            className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100/50 transition-all ${isUploading ? 'pointer-events-none' : ''}`}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-solar animate-spin" />
                <span className="text-xs font-bold text-slate-500">جاري الرفع...</span>
              </div>
            ) : (
              <>
                <ImageIcon className="w-8 h-8 text-slate-300 mb-2" />
                <span className="text-xs font-bold text-slate-500">اضغط لرفع صورة</span>
              </>
            )}
            <input 
              id={id}
              type="file" 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </label>
        )}
      </div>
      
      {description && (
        <p className="text-[10px] text-slate-400 font-medium px-1">{description}</p>
      )}
    </div>
  );
};
