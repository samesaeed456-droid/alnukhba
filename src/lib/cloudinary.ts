const compressImageLocally = (file: File, maxWidth = 1000): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/webp', 0.8));
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => reject(new Error('فشل معالجة الصورة'));
    };
    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
  });
};

export const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.error("Cloudinary config missing.");
    throw new Error('إعدادات Cloudinary غير متوفرة. يرجى إضافتها في ملف البيئة الخاص بك.');
  }

  // 1. الضغط الذكي المحلي قبل الرفع (يجعل الرفع صاروخياً)
  const compressedBase64 = await compressImageLocally(file);

  // 2. الرفع المباشر للخادم السحابي
  const formData = new FormData();
  formData.append('file', compressedBase64);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    console.error("Cloudinary upload failed", err);
    throw new Error(err.error?.message || 'فشل رفع الصورة إلى الخادم');
  }

  const data = await response.json();
  return data.secure_url;
};
