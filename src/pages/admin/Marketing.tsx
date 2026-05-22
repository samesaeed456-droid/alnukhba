import React, { useState } from "react";
import {
  Image,
  Plus,
  Trash2,
  Layout,
  Save,
  X,
  Edit2,
  Eye,
  MousePointerClick,
} from "lucide-react";
import { useStore } from "../../context/StoreContext";
import { motion, AnimatePresence } from "motion/react";
import { Banner } from "../../types";
import { FloatingInput } from "../../components/FloatingInput";
import ConfirmationModal from "../../components/ConfirmationModal";
import { showLuxuryToast } from "@/lib/luxuryToast";
import { deleteImagesFromCloudinary } from "@/lib/cloudinary";

export default function Marketing() {
  const {
    banners,
    addBanner,
    updateBanner,
    deleteBanner,
    syncOnDemand,
  } = useStore();

  React.useEffect(() => {
    syncOnDemand("banners");
  }, [syncOnDemand]);

  // Banner State
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerForm, setBannerForm] = useState<Omit<Banner, "id">>({
    image: "",
    images: [],
    title: "",
    subtitle: "",
    link: "",
    isActive: true,
    order: banners.length + 1,
    views: 0,
    clicks: 0,
    startDate: "",
    endDate: "",
    position: "hero",
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const handleBannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBanner) {
      // Cleanup removed images from Cloudinary
      const oldImages = [editingBanner.image, ...(editingBanner.images || [])].filter(Boolean) as string[];
      const newImages = [bannerForm.image, ...(bannerForm.images || [])].filter(Boolean) as string[];
      const removedImages = oldImages.filter(img => !newImages.includes(img));

      if (removedImages.length > 0) {
        deleteImagesFromCloudinary(removedImages);
      }
      updateBanner(editingBanner.id, bannerForm);
    } else {
      addBanner(bannerForm);
    }
    setIsBannerModalOpen(false);
    setEditingBanner(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      try {
        showLuxuryToast("info", {
          title: "جاري الرفع",
          description: `جاري رفع ${files.length} صور إلى الخادم السحابي...`,
        });
        const { uploadToCloudinary } = await import("../../lib/cloudinary");
        const secureUrls = await Promise.all(
          files.map((file) => uploadToCloudinary(file)),
        );

        setBannerForm((prev) => {
          const updatedImages = [...(prev.images || []), ...secureUrls];
          return {
            ...prev,
            images: updatedImages,
            image: prev.image || updatedImages[0],
          };
        });
        showLuxuryToast("success", {
          title: "تم الرفع بنجاح!",
          description: "تمت إضافة الصور الجديدة إلى مكتبة البنرات",
        });
      } catch (error: any) {
        console.error("Marketing images upload failed:", error);
        showLuxuryToast("error", {
          title: "فشل الرفع",
          description: error.message || "فشل في رفع بعض الصور",
        });
      }
    }
  };

  const removeImage = (index: number) => {
    setBannerForm((prev) => {
      const newImages = [...(prev.images || [])];
      newImages.splice(index, 1);
      return {
        ...prev,
        images: newImages,
        image: newImages.length > 0 ? newImages[0] : "",
      };
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-carbon tracking-tight mb-2">
            التسويق والبنرات
          </h1>
          <p className="text-gray-500 font-medium font-sans">
            أدر حملاتك التسويقية والبنرات المعروضة في واجهة المتجر بفعالية.
          </p>
        </div>
      </div>

      {/* Banners Area */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-carbon">
              البنرات الإعلانية
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              تحكم في البنرات المعروضة في الصفحة الرئيسية للمتجر.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingBanner(null);
              setBannerForm({
                image: "",
                images: [],
                title: "",
                subtitle: "",
                link: "",
                isActive: true,
                order: banners.length + 1,
                views: 0,
                clicks: 0,
                startDate: "",
                endDate: "",
                position: "hero",
              });
              setIsBannerModalOpen(true);
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-carbon text-white px-6 py-3 rounded-xl font-bold hover:bg-carbon/90 transition-all shadow-lg shadow-carbon/20"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة بنر جديد</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners
            .sort((a, b) => a.order - b.order)
            .map((banner) => (
              <motion.div
                key={banner.id}
                layout
                className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all group flex flex-col"
              >
                <div className="relative aspect-[21/9] sm:aspect-video bg-gray-100 overflow-hidden">
                  {banner.image ? (
                    <img
                      src={banner.image || undefined}
                      alt={banner.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      بدون صورة
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2 z-10">
                    <button
                      onClick={() => {
                        setEditingBanner(banner);
                        setBannerForm(banner);
                        setIsBannerModalOpen(true);
                      }}
                      className="p-2 bg-white/90 backdrop-blur-md rounded-xl text-carbon hover:bg-white shadow-sm transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        const imagesToDelete: string[] = [];
                        if (banner.image) imagesToDelete.push(banner.image);
                        if (banner.images) imagesToDelete.push(...banner.images);

                        setConfirmModal({
                          isOpen: true,
                          title: "حذف البنر",
                          message: `هل أنت متأكد من حذف البنر "${banner.title || "بدون اسم"}"؟`,
                          onConfirm: () => {
                            if (imagesToDelete.length > 0) {
                              deleteImagesFromCloudinary(imagesToDelete);
                            }
                            deleteBanner(banner.id);
                          },
                        });
                      }}
                      className="p-2 bg-red-50/90 backdrop-blur-md rounded-xl text-red-600 hover:bg-red-500 hover:text-white shadow-sm transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2">
                    <div
                      className={`text-xs px-3 py-1.5 rounded-lg font-black backdrop-blur-md ${banner.isActive ? "bg-emerald-500/90 text-white" : "bg-gray-500/90 text-white"}`}
                    >
                      {banner.isActive ? "نشط" : "معطل"}
                    </div>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-black text-lg text-carbon line-clamp-1">
                      {banner.title || "بنر بدون اسم"}
                    </h3>
                    <div className="flex items-center gap-1 text-xs font-bold text-gray-400">
                      <Layout className="w-3 h-3" />
                      <span>الترتيب: {banner.order}</span>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-1">
                    {banner.subtitle || "لا يوجد وصف إضافي"}
                  </p>

                  <div className="mt-auto pt-4 border-t border-gray-50 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Eye className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-bold">
                          المشاهدات
                        </p>
                        <p className="font-black text-carbon">
                          {banner.views?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <MousePointerClick className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-bold">
                          النقرات
                        </p>
                        <p className="font-black text-carbon">
                          {banner.clicks?.toLocaleString() || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Banner Modal */}
      <AnimatePresence>
        {isBannerModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBannerModalOpen(false)}
              className="absolute inset-0 bg-carbon/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-5 sm:p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                <h3 className="text-xl font-black text-carbon">
                  {editingBanner ? "تعديل البنر" : "إضافة بنر جديد"}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto p-5 sm:p-6">
                <form
                  id="banner-form"
                  onSubmit={handleBannerSubmit}
                  className="space-y-6"
                >
                  {/* Image Upload & Preview */}
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                      صور البنر
                    </label>

                    {/* Uploaded Images Grid */}
                    {(bannerForm.images && bannerForm.images.length > 0) ||
                    bannerForm.image ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                        {/* If we have images array, map it. Otherwise fallback to single image */}
                        {(bannerForm.images?.length
                          ? bannerForm.images
                          : [bannerForm.image]
                        ).map((img, idx) => (
                          <div
                            key={idx}
                            className="relative aspect-[21/9] rounded-xl overflow-hidden border border-gray-200 group"
                          >
                            <img
                              src={img || undefined}
                              alt={`Preview ${idx}`}
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            {idx === 0 && (
                              <span className="absolute bottom-2 left-2 text-[10px] font-black bg-carbon text-white px-2 py-0.5 rounded-md">
                                الصورة الرئيسية
                              </span>
                            )}
                          </div>
                        ))}

                        {/* Add more images button */}
                        <label
                          htmlFor="banner-image-upload-more"
                          className="relative aspect-[21/9] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <input
                            type="file"
                            id="banner-image-upload-more"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                          <Plus className="w-6 h-6 text-gray-400 mb-1" />
                          <span className="text-xs font-bold text-gray-500">
                            إضافة صورة
                          </span>
                        </label>
                      </div>
                    ) : (
                      <label
                        htmlFor="banner-image-upload"
                        className="relative aspect-[21/9] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center group cursor-pointer hover:bg-gray-100 transition-colors"
                      >
                        <input
                          type="file"
                          id="banner-image-upload"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                        <div className="text-center text-gray-400">
                          <Image className="w-10 h-10 mx-auto mb-2 opacity-50 group-hover:scale-110 transition-transform" />
                          <p className="font-bold text-sm">
                            اضغط لرفع صور البنر
                          </p>
                          <p className="text-xs mt-1">
                            يمكنك تحديد أكثر من صورة
                          </p>
                        </div>
                      </label>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <FloatingInput
                        id="bannerTitle"
                        label="اسم البنر (للإشارة الداخلية)"
                        type="text"
                        value={bannerForm.title}
                        onChange={(e) =>
                          setBannerForm({
                            ...bannerForm,
                            title: e.target.value,
                          })
                        }
                        bgClass="bg-bg-general"
                        placeholder="مثلاً: عرض رمضان"
                      />
                    </div>
                    <div>
                      <FloatingInput
                        id="bannerSubtitle"
                        label="وصف إضافي (اختياري)"
                        type="text"
                        value={bannerForm.subtitle}
                        onChange={(e) =>
                          setBannerForm({
                            ...bannerForm,
                            subtitle: e.target.value,
                          })
                        }
                        bgClass="bg-bg-general"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <FloatingInput
                        id="bannerLink"
                        label="رابط التوجيه (اختياري)"
                        type="text"
                        value={bannerForm.link}
                        onChange={(e) =>
                          setBannerForm({ ...bannerForm, link: e.target.value })
                        }
                        bgClass="bg-bg-general"
                        placeholder="/category/electronics"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                        مكان العرض (الموضع)
                      </label>
                      <select
                        value={bannerForm.position || "hero"}
                        onChange={(e) =>
                          setBannerForm({
                            ...bannerForm,
                            position: e.target.value as any,
                          })
                        }
                        className="w-full px-4 py-3 bg-bg-general border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-carbon/20 focus:border-carbon font-bold text-carbon transition-all"
                      >
                        <option value="hero">البنر الرئيسي (Hero)</option>
                        <option value="middle">
                          البنرات الوسطى (بعد العروض)
                        </option>
                        <option value="bottom">
                          البنرات السفلية (قبل البطاريات)
                        </option>
                        <option value="screens">بنرات قسم الشاشات</option>
                        <option value="electronics">
                          بنرات قسم الإلكترونيات
                        </option>
                        <option value="solar">بنرات قسم الطاقة الشمسية</option>
                        <option value="accessories">
                          بنرات قسم الإكسسوارات
                        </option>
                        <option value="batteries">بنرات قسم البطاريات</option>
                      </select>
                    </div>
                    <div>
                      <FloatingInput
                        id="bannerOrder"
                        label="الترتيب"
                        type="number"
                        required
                        value={bannerForm.order}
                        onChange={(e) =>
                          setBannerForm({
                            ...bannerForm,
                            order: parseInt(e.target.value) || 0,
                          })
                        }
                        bgClass="bg-bg-general"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 p-5 bg-gray-50 rounded-2xl border border-gray-100">
                    <div>
                      <FloatingInput
                        id="bannerStartDate"
                        label="تاريخ البدء (اختياري)"
                        type="datetime-local"
                        value={bannerForm.startDate}
                        onChange={(e) =>
                          setBannerForm({
                            ...bannerForm,
                            startDate: e.target.value,
                          })
                        }
                        bgClass="bg-white"
                      />
                    </div>
                    <div>
                      <FloatingInput
                        id="bannerEndDate"
                        label="تاريخ الانتهاء (اختياري)"
                        type="datetime-local"
                        value={bannerForm.endDate}
                        onChange={(e) =>
                          setBannerForm({
                            ...bannerForm,
                            endDate: e.target.value,
                          })
                        }
                        bgClass="bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-emerald-50/50 px-5 py-4 rounded-xl border border-emerald-100">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={bannerForm.isActive}
                      onChange={(e) =>
                        setBannerForm({
                          ...bannerForm,
                          isActive: e.target.checked,
                        })
                      }
                      className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                    />
                    <label
                      htmlFor="isActive"
                      className="text-sm font-black text-carbon cursor-pointer"
                    >
                      تفعيل البنر وعرضه للعملاء
                    </label>
                  </div>
                </form>
              </div>
              <div className="p-5 sm:p-6 border-t border-gray-100 bg-gray-50/50">
                <button
                  type="submit"
                  form="banner-form"
                  disabled={!bannerForm.image}
                  className="w-full bg-carbon text-white py-4 rounded-xl font-black hover:bg-carbon/90 transition-all shadow-lg shadow-carbon/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-5 h-5" />
                  <span>{editingBanner ? "حفظ التعديلات" : "إضافة البنر"}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type="danger"
        confirmText="حذف البنر"
      />
    </div>
  );
}
