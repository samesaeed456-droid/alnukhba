const compressImageLocally = (file: File, maxWidth = 1000): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
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
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Do not fill with white color to preserve transparency
          ctx.drawImage(img, 0, 0, width, height);
          // Use original image type if png to ensure transparency, otherwise webp
          const outputType =
            file.type === "image/png" ? "image/png" : "image/webp";
          resolve(canvas.toDataURL(outputType, 0.8));
        } else {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => reject(new Error("فشل معالجة الصورة"));
    };
    reader.onerror = () => reject(new Error("فشل قراءة الملف"));
  });
};

export const uploadToCloudinary = async (file: File): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    console.error("Cloudinary config missing.");
    throw new Error(
      "إعدادات Cloudinary غير متوفرة. يرجى إضافتها في ملف البيئة الخاص بك.",
    );
  }

  // 1. الضغط الذكي المحلي قبل الرفع (يجعل الرفع صاروخياً)
  const compressedBase64 = await compressImageLocally(file);

  // 2. الرفع المباشر للخادم السحابي
  const formData = new FormData();
  formData.append("file", compressedBase64);
  formData.append("upload_preset", uploadPreset);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    const err = await response.json();
    console.error("Cloudinary upload failed", err);
    throw new Error(err.error?.message || "فشل رفع الصورة إلى الخادم");
  }

  const data = await response.json();
  return data.secure_url;
};

/**
 * Extracts the Public ID from a Cloudinary URL
 */
export const getPublicIdFromUrl = (url: string): string | null => {
  if (!url || !url.includes("res.cloudinary.com")) return null;
  const parts = url.split("/");
  const uploadIndex = parts.indexOf("upload");
  if (uploadIndex === -1) return null;

  // Parts after "upload"
  const remainingParts = parts.slice(uploadIndex + 1);

  // If the first part starts with 'v' followed by digits, it's a version number - skip it
  if (remainingParts[0] && /^v\d+$/.test(remainingParts[0])) {
    remainingParts.shift();
  }

  // Join back and remove extension
  const publicIdWithExt = remainingParts.join("/");
  const lastDotIndex = publicIdWithExt.lastIndexOf(".");

  if (lastDotIndex === -1) return publicIdWithExt;
  return publicIdWithExt.substring(0, lastDotIndex);
};

/**
 * Deletes images from Cloudinary via our backend API
 */
export const deleteImagesFromCloudinary = async (
  urls: string[],
): Promise<boolean> => {
  try {
    const publicIds = urls
      .map(getPublicIdFromUrl)
      .filter((id) => id !== null) as string[];

    if (publicIds.length === 0) return true;

    const response = await fetch("/api/cloudinary/bulk-delete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ public_ids: publicIds }),
    });

    const contentType = response.headers.get("content-type");
    if (!response.ok) {
      const errorText = contentType?.includes("application/json") 
        ? (await response.json()).error 
        : await response.text();
      console.warn("Failed to delete images from Cloudinary server:", errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error calling Cloudinary delete API:", error);
    return false;
  }
};
