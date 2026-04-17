export const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.error("Cloudinary config missing.");
    throw new Error('إعدادات Cloudinary غير متوفرة. يرجى إضافتها في لوحة التحكم.');
  }

  const formData = new FormData();
  formData.append('file', file);
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
