import React, { useEffect, useState } from "react";
import {
  Cloud,
  Loader2,
  RefreshCw,
  Trash2,
  Eye,
  CheckSquare,
  Square,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/context/StoreContext";

interface CloudinaryImage {
  public_id: string;
  secure_url: string;
  bytes: number;
}

interface UsageStats {
  plan: string;
  storage: {
    usage: number;
    limit: number;
  };
}

export default function CloudPage() {
  const store = useStore();
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [imgRes, usageRes] = await Promise.all([
        fetch("/api/cloudinary/images"),
        fetch("/api/cloudinary/usage"),
      ]);
      if (!imgRes.ok || !usageRes.ok) throw new Error("فشل جلب البيانات");
      const contentType = imgRes.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("السيرفر أرجع استجابة غير صالحة (HTML بدلاً من JSON)");
      }

      const imgData = await imgRes.json();
      const usageData = await usageRes.json();
      setImages(imgData.images);
      setUsage(usageData);
    } catch (error) {
      toast.error("حدث خطأ أثناء جلب البيانات");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const deleteImage = async (id: string) => {
    if (!confirm(`هل أنت متأكد من حذف هذه الصورة؟`)) return;
    setDeleting(true);
    try {
      const response = await fetch("/api/cloudinary/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_ids: [id] }),
      });
      if (!response.ok) throw new Error("فشل الحذف");
      toast.success("تم حذف الصورة");
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      fetchData();
    } catch (error) {
      toast.error("حدث خطأ أثناء الحذف");
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  const bulkDelete = async () => {
    if (!confirm(`هل أنت متأكد من حذف ${selectedIds.length} صورة؟`)) return;
    setDeleting(true);
    try {
      const response = await fetch("/api/cloudinary/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ public_ids: selectedIds }),
      });
      if (!response.ok) throw new Error("فشل الحذف");
      toast.success("تم حذف الصور المختارة");
      setSelectedIds([]);
      fetchData();
    } catch (error) {
      toast.error("حدث خطأ أثناء الحذف");
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  const selectUnusedImages = () => {
    try {
      const everything = JSON.stringify({
        products: store.products,
        categories: store.categories,
        banners: store.banners,
        settings: store.settings,
        marketing: store.marketingNotifications,
        orders: store.orders,
        users: store.customers,
        tickets: store.supportTickets,
        pages: store.staticPages,
        carts: store.abandonedCarts,
      });

      const unusedIds = images
        .filter((img) => {
          const parts = img.public_id.split("/");
          const shortId = parts[parts.length - 1]; // Just the file name part without the folder

          // Exact URL match
          const hasUrl = everything.includes(img.secure_url);

          // ID match (prevent false positives if the ID is just a 1 or 2 letter word, but Cloudinary random strings are 20 chars long)
          const hasId =
            shortId.length > 5
              ? everything.includes(shortId)
              : everything.includes(img.public_id);

          return !hasUrl && !hasId;
        })
        .map((img) => img.public_id);

      setSelectedIds(unusedIds);

      if (unusedIds.length > 0) {
        toast.success(`تم تحديد ${unusedIds.length} صورة غير مستخدمة`);
      } else {
        toast.info("جميع الصور مستخدمة حالياً في التطبيق أو الطلبات");
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء فحص الصور");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-100">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-solar/10 text-solar text-xs font-bold tracking-wider uppercase mb-2">
            <Cloud className="w-3 h-3" />
            إدارة الوسائط
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            مساحة التخزين السحابي
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            شاهد وادر جميع الصور المرفوعة في متجرك بكل سهولة.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={selectUnusedImages}
            disabled={images.length === 0}
            className="flex-1 md:flex-none px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-solar/20 hover:text-solar hover:shadow-sm transition-all disabled:opacity-50"
          >
            <Wand2 className="w-4 h-4" />
            <span>تحديد غير المستخدم</span>
          </button>

          {selectedIds.length > 0 && (
            <button
              onClick={bulkDelete}
              disabled={deleting}
              className="flex-1 md:flex-none px-5 py-2.5 bg-rose-500 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all disabled:bg-slate-400"
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              <span>حذف ({selectedIds.length})</span>
            </button>
          )}

          <button
            onClick={fetchData}
            className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all"
            title="تحديث البيانات"
          >
            <RefreshCw
              className={`w-5 h-5 ${loading ? "animate-spin text-solar" : ""}`}
            />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center gap-4 text-slate-400">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-solar" />
            <Cloud className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-solar/40" />
          </div>
          <p className="font-bold text-sm animate-pulse tracking-wide">
            جاري جلب ملفاتك...
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar / Stats Panel */}
          <div className="lg:col-span-1 space-y-6">
            {usage && (
              <div className="bg-white overflow-hidden rounded-3xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                <div className="p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      خطة الاستخدام
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-wider">
                      {usage.plan}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-end justify-between">
                      <div className="space-y-1">
                        <p className="text-2xl font-black text-slate-900 leading-none">
                          {Math.round(usage.storage.usage / (1024 * 1024))}
                          <span className="text-xs text-slate-400 font-bold mr-1">
                            MB
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">
                          المستخدم حالياً
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-slate-400 mb-[-2px]">
                          {Math.round(usage.storage.limit / (1024 * 1024))}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">
                          الحد الأقصى
                        </p>
                      </div>
                    </div>

                    <div className="relative h-3 bg-slate-50 rounded-full border border-slate-100 p-0.5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-l from-solar to-amber-400 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(255,185,0,0.4)]"
                        style={{
                          width: `${Math.min((usage.storage.usage / usage.storage.limit) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between text-[11px] font-bold text-slate-500">
                    <span>تحسين السحابة</span>
                    <button
                      onClick={selectUnusedImages}
                      className="text-solar hover:underline"
                    >
                      افحص الآن
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="hidden lg:block p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
              <p className="text-xs leading-relaxed text-slate-400 font-medium text-center">
                يتم فحص الصور بناءً على تواجد الـ ID الخاص بها في المنتجات،
                الأقسام، العروض، الطلبات، والملفات الشخصية.
              </p>
            </div>
          </div>

          {/* Images Grid */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                جميع الصور
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  {images.length}
                </span>
              </h3>
            </div>

            {images.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-100 rounded-[2rem] p-20 flex flex-col items-center justify-center gap-4 text-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                  <Cloud className="w-10 h-10 text-slate-200" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-black text-slate-900">
                    لا توجد صور حالياً
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                    السحابة فارغة. الصور المرفوعة عبر إضافة المنتجات ستظهر هنا
                    تلقائياً.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {images.map((img) => (
                  <div
                    key={img.public_id}
                    className={`group relative bg-white rounded-3xl border transition-all duration-300 overflow-hidden hover:shadow-xl hover:-translate-y-1 ${
                      selectedIds.includes(img.public_id)
                        ? "border-solar ring-4 ring-solar/5"
                        : "border-slate-100 shadow-sm"
                    }`}
                  >
                    {/* Actions Overlay Top */}
                    <div className="absolute top-3 left-3 right-3 flex justify-between z-20 pointer-events-none opacity-0 translate-y-[-10px] group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <button
                        onClick={() => toggleSelect(img.public_id)}
                        className={`pointer-events-auto p-2 rounded-xl backdrop-blur-md shadow-lg transition-all ${
                          selectedIds.includes(img.public_id)
                            ? "bg-solar text-white"
                            : "bg-black/40 text-white hover:bg-black/60"
                        }`}
                      >
                        {selectedIds.includes(img.public_id) ? (
                          <CheckSquare className="w-4 h-4 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 shrink-0" />
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteImage(img.public_id);
                        }}
                        className="pointer-events-auto p-2 bg-rose-500/90 backdrop-blur-md text-white rounded-xl hover:bg-rose-600 shadow-lg transition-all"
                        title="حذف نهائي"
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                      </button>
                    </div>

                    {/* Badge For Selected (Visible non-hover) */}
                    {selectedIds.includes(img.public_id) && (
                      <div className="absolute top-3 left-3 z-10 p-2 bg-solar text-white rounded-xl shadow-lg ring-2 ring-white animate-in zoom-in group-hover:opacity-0 transition-opacity">
                        <CheckSquare className="w-4 h-4 shrink-0" />
                      </div>
                    )}

                    {/* Image Thumbnail */}
                    <div className="aspect-[4/5] bg-slate-50 relative overflow-hidden flex items-center justify-center">
                      <img
                        src={img.secure_url}
                        alt={img.public_id}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />

                      {/* View Button Overlay */}
                      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pointer-events-none">
                        <a
                          href={img.secure_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-xl text-[10px] font-black uppercase hover:bg-white/20 transition-all"
                        >
                          <Eye className="w-3 h-3" />
                          عرض كامل بالمتصفح
                        </a>
                      </div>
                    </div>

                    {/* Metadata Footer */}
                    <div className="p-4 border-t border-slate-50 space-y-1.5 bg-white">
                      <p
                        className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate"
                        title={img.public_id}
                      >
                        {img.public_id}
                      </p>
                      <div className="flex items-center justify-between text-[9px] font-black text-slate-300 uppercase">
                        <span>{Math.round(img.bytes / 1024)} KB</span>
                        {selectedIds.includes(img.public_id) && (
                          <span className="text-solar tracking-tighter">
                            مختارة للتعديل
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
