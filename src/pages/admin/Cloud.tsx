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
  Database,
  Server,
  Key,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  Settings as SettingsIcon,
  Play,
  Check,
  X,
  AlertTriangle
} from "lucide-react";
import { showLuxuryToast } from "@/lib/luxuryToast";
import { useStore } from "@/context/StoreContext";
import { toast } from "sonner";
import { checkSupabaseConnection } from "@/lib/supabase";
import { migrateFirebaseToSupabaseWithProgress, MigrationStep } from "@/lib/migrateToSupabase";
import confetti from "canvas-confetti";

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
  const [activeTab, setActiveTab] = useState<'media' | 'supabase'>('media');

  // Cloudinary state
  const [images, setImages] = useState<CloudinaryImage[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);

  // Supabase connection state
  const [tempUrl, setTempUrl] = useState(localStorage.getItem('temp_supabase_url') || '');
  const [tempKey, setTempKey] = useState(localStorage.getItem('temp_supabase_key') || '');
  const [checkingConnection, setCheckingConnection] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [connectionDetailsChecked, setConnectionDetailsChecked] = useState(false);

  // Supabase migration state
  const [migrationSteps, setMigrationSteps] = useState<MigrationStep[]>([]);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationFinished, setMigrationFinished] = useState(false);

  const fetchCloudinaryData = async () => {
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
      showLuxuryToast("error", {
        title: "خطأ في الاتصال",
        description: "حدث خطأ أثناء جلب البيانات من السحابة",
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const testSupabaseConnection = async () => {
    setCheckingConnection(true);
    try {
      const connected = await checkSupabaseConnection();
      setIsConnected(connected);
      setConnectionDetailsChecked(true);
      if (connected) {
        showLuxuryToast("success", {
          title: "Supabase متصل بنجاح!",
          description: "تم التحقق والاتصال بنجاح بقاعدة بيانات Supabase الخاصة بك.",
        });
      } else {
        showLuxuryToast("error", {
          title: "فشل في الاتصال",
          description: "يرجى التحقق من صحة الرابط ومفتاح أمان Supabase المدخلين.",
        });
      }
    } catch (err) {
      setIsConnected(false);
      setConnectionDetailsChecked(true);
      console.error(err);
    } finally {
      setCheckingConnection(false);
    }
  };

  const saveTempCredentials = () => {
    if (tempUrl.trim()) {
      localStorage.setItem('temp_supabase_url', tempUrl.trim());
    } else {
      localStorage.removeItem('temp_supabase_url');
    }

    if (tempKey.trim()) {
      localStorage.setItem('temp_supabase_key', tempKey.trim());
    } else {
      localStorage.removeItem('temp_supabase_key');
    }

    showLuxuryToast("success", {
      title: "تم حفظ الإعدادات مؤقتاً",
      description: "تم حفظ البيانات محلياً في جهازك للتسجيل السريع والاتصال.",
    });

    // Test connection with new inputs
    setTimeout(() => {
      testSupabaseConnection();
    }, 200);
  };

  const clearTempCredentials = () => {
    localStorage.removeItem('temp_supabase_url');
    localStorage.removeItem('temp_supabase_key');
    setTempUrl('');
    setTempKey('');
    setIsConnected(null);
    setConnectionDetailsChecked(false);
    showLuxuryToast("info", {
      title: "تم مسح البيانات المؤقتة",
      description: "تم مسح الرابط ومفتاح الأمان من متصفحك الحالي بنجاح.",
    });
  };

  const runDatabaseMigration = async () => {
    if (isMigrating) return;
    setIsMigrating(true);
    setMigrationFinished(false);
    
    const migrationToast = toast.loading("جاري بدء وتصدير البيانات إلى Supabase... يرجى عدم إغلاق نافذة المتجر.");
    
    try {
      const success = await migrateFirebaseToSupabaseWithProgress((steps) => {
        setMigrationSteps(steps);
      });

      toast.dismiss(migrationToast);
      setMigrationFinished(true);

      if (success) {
        // Run celebratory confetti!
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
        showLuxuryToast("success", {
          title: "تهانينا! اكتملت المزامنة بنجاح 🎉",
          description: "تم ترحيل وتحديث كامل منتجاتك وعملائك وأقسامك وطلباتك إلى قاعدة بيانات Supabase!",
        });
      } else {
        showLuxuryToast("error", {
          title: "اكتملت المزامنة مع وجود بعض الأخطاء",
          description: "يرجى مراجعة تفاصيل جدول الأخطاء أدناه ومحاولة إعادة تصدير الجداول الفاشلة.",
        });
      }
    } catch (err: any) {
      toast.dismiss(migrationToast);
      console.error(err);
      showLuxuryToast("error", {
        title: "فشلت المزامنة",
        description: err.message || "حدث خطأ غير متوقع أثناء معالجة البيانات وتصديرها.",
      });
    } finally {
      setIsMigrating(false);
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
      showLuxuryToast("success", {
        title: "تم الحذف",
        description: "تم حذف الصورة نهائياً من السحابة",
      });
      setSelectedIds((prev) => prev.filter((i) => i !== id));
      fetchCloudinaryData();
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
      showLuxuryToast("success", {
        title: "تم الحذف بنجاح",
        description: `تم حذف ${selectedIds.length} صورة من السحابة`,
      });
      setSelectedIds([]);
      fetchCloudinaryData();
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
        showLuxuryToast("success", {
          title: "اكتشاف ذكي",
          description: `تم تحديد ${unusedIds.length} صورة غير مستخدمة للنظام`,
        });
      } else {
        showLuxuryToast("info", {
          title: "سحابة نظيفة",
          description: "جميع الصور مستخدمة حالياً في التطبيق أو الطلبات",
        });
      }
    } catch (err) {
      showLuxuryToast("error", {
        title: "خطأ في الفحص",
        description: "حدث خطأ أثناء فحص تواجد الصور في النظام",
      });
    }
  };

  useEffect(() => {
    fetchCloudinaryData();
    testSupabaseConnection();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4 border-b border-slate-100">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-solar/10 text-solar text-xs font-bold tracking-wider uppercase mb-2">
            <Cloud className="w-3 h-3" />
            السحابة وقالب البيانات
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            مساحة الخدمات السحابية وقاعدة البيانات
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            تتبع مساحة رفع الصور، أو افحص حالة اتصال قاعدة بيانات Supabase وانقل بيانات متجرك بالكامل بكبسة زر.
          </p>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 pb-0.5 gap-6">
        <button
          onClick={() => setActiveTab('media')}
          className={`pb-3 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all relative ${
            activeTab === 'media'
              ? "border-solar text-solar font-black"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Cloud className="w-4.5 h-4.5" />
          ألبوم الوسائط (Cloudinary)
        </button>
        <button
          onClick={() => setActiveTab('supabase')}
          className={`pb-3 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all relative ${
            activeTab === 'supabase'
              ? "border-solar text-solar font-black"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <Database className="w-4.5 h-4.5" />
          ربط ومزامنة قاعدة بيانات Supabase
          {isConnected && (
            <span className="absolute top-1 -left-2 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>
      </div>

      {activeTab === 'media' && (
        <>
          <div className="flex justify-end gap-3 -mb-4">
            <button
              onClick={selectUnusedImages}
              disabled={images.length === 0 || loading}
              className="px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-solar/20 hover:text-solar hover:shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Wand2 className="w-4 h-4" />
              <span>تحديد الوسائط غير المستخدمة</span>
            </button>

            {selectedIds.length > 0 && (
              <button
                onClick={bulkDelete}
                disabled={deleting}
                className="px-5 py-2.5 bg-rose-500 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-rose-600 shadow-lg shadow-rose-200 transition-all disabled:bg-slate-400 cursor-pointer"
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
              onClick={fetchCloudinaryData}
              disabled={loading}
              className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-2xl transition-all cursor-pointer border border-slate-100 bg-white"
              title="تحديث البيانات"
            >
              <RefreshCw
                className={`w-5 h-5 ${loading ? "animate-spin text-solar" : ""}`}
              />
            </button>
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

                <div className="p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
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
                            className={`pointer-events-auto p-2 rounded-xl backdrop-blur-md shadow-lg transition-all cursor-pointer ${
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
                            className="pointer-events-auto p-2 bg-rose-500/90 backdrop-blur-md text-white rounded-xl hover:bg-rose-600 shadow-lg transition-all cursor-pointer"
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
                              className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-xl text-[10px] font-black uppercase hover:bg-white/20 transition-all text-center"
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
                          <div className="flex items-center justify-between text-[9px] font-black text-slate-300">
                            <span>{Math.round(img.bytes / 1024)} KB</span>
                            {selectedIds.includes(img.public_id) && (
                              <span className="text-solar tracking-tighter">
                                مختارة
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
        </>
      )}

      {activeTab === 'supabase' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Status and Credentials Block */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                  isConnected ? "bg-emerald-50 text-emerald-600" : isConnected === false ? "bg-rose-50 text-rose-600" : "bg-slate-50 text-slate-400"
                }`}>
                  {checkingConnection ? (
                    <Loader2 className="w-6 h-6 animate-spin text-solar" />
                  ) : isConnected ? (
                    <ShieldCheck className="w-6 h-6" />
                  ) : (
                    <Server className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <h3 className="font-black text-slate-900">حالة الإتصال بـ Supabase</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {checkingConnection ? (
                      <span className="text-xs font-bold text-slate-400 animate-pulse">جاري التحقق...</span>
                    ) : isConnected ? (
                      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        متصل بنجاح
                      </span>
                    ) : isConnected === false ? (
                      <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">غير متصل</span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">يرجى فحص الاتصال</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Guide explaining AI Studio vs Vercel environment variables */}
              <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 space-y-2 text-stone-700">
                <p className="text-xs font-bold text-amber-700 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 truncate" />
                  لماذا تظهر لي رسالة نقص متغيرات البيئة؟
                </p>
                <p className="text-[11px] leading-relaxed font-medium">
                  المتغيرات التي أدخلتها في <strong>Vercel</strong> مخصصة لموقعك المنشور هناك فقط ولا تنتقل تلقائياً لبيئة تطوير <strong>AI Studio</strong> المعزولة (Sandbox).
                </p>
                <p className="text-[11px] leading-relaxed">
                  <strong>الحل:</strong> يمكنك لصق رابط وقيمة مفتاح Supabase الخاص بك في الحقول أدناه، وسيحفظهم المتصفح محلياً لتمكين الفحص وتصدير البيانات فوراً!
                </p>
              </div>

              {/* Dynamic Credential inputs */}
              <div className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block flex items-center gap-1">
                    <Server className="w-3.5 h-3.5 text-slate-400" />
                    رابط Supabase URL
                  </label>
                  <input
                    type="url"
                    value={tempUrl}
                    onChange={(e) => setTempUrl(e.target.value)}
                    placeholder="https://yourproject.supabase.co"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-solar/20 focus:bg-white transition-all text-left"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 block flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    مفتاح Supabase Anon Key (الأمان العام)
                  </label>
                  <input
                    type="password"
                    value={tempKey}
                    onChange={(e) => setTempKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-solar/20 focus:bg-white transition-all text-left"
                    dir="ltr"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={saveTempCredentials}
                    disabled={!tempUrl.trim() || !tempKey.trim() || checkingConnection}
                    className="flex-1 py-2.5 bg-solar text-white rounded-xl text-xs font-black hover:bg-amber-500 transition-all flex items-center justify-center gap-1 disabled:opacity-40 cursor-pointer shadow-sm"
                  >
                    {checkingConnection ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Check className="w-3.5 h-3.5" />
                    )}
                    <span>حفظ وفحص الاتصال</span>
                  </button>

                  {(tempUrl || tempKey) && (
                    <button
                      onClick={clearTempCredentials}
                      className="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-100 rounded-xl border border-rose-100 transition-all cursor-pointer"
                      title="مسح الحقول"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* General Tip */}
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-2">
              <h4 className="text-xs font-black text-slate-700">📌 تلميحات أمان Supabase</h4>
              <p className="text-[11px] leading-relaxed text-slate-400 font-medium">
                تمكّن السياسات الافتراضية (RLS) في السكريبت الذي قمت بتنفيذه إمكانية القراءة والكتابة العامة المؤقتة بهدف الترحيل السليم. يرجى تأمين جداول الطلبات والبطاقات الشخصية بعد انتهاء ترحيل البيانات بالكامل.
              </p>
            </div>
          </div>

          {/* Migration Panel Block */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-50">
                <div className="space-y-0.5">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Database className="w-5 h-5 text-solar" />
                    تصدير ومزامنة البيانات بالكامل
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    انقل كامل جداول المتجر المخزنة حالياً في Firebase بشكل حيّ ومباشر إلى Supabase.
                  </p>
                </div>

                <button
                  onClick={runDatabaseMigration}
                  disabled={!isConnected || isMigrating}
                  className="px-6 py-3 bg-emerald-500 text-white rounded-2xl text-sm font-black flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all disabled:opacity-40 shadow-lg shadow-emerald-100 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isMigrating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري المزامنة...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-current" />
                      <span>بدء المزامنة والتصدير</span>
                    </>
                  )}
                </button>
              </div>

              {!isConnected ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-150 rounded-2xl p-10 text-center flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm">البوابة مقفلة مؤقتاً</h4>
                    <p className="text-xs text-slate-400 max-w-sm leading-relaxed mx-auto">
                      يرجى ربط قاعدة بياناتك بنجاح أولاً عبر اللوحة الجانبية لتنشيط أداة ترحيل وتصدير البيانات.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {migrationSteps.length === 0 ? (
                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-2">
                      <p className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        جاهز للمزامنة!
                      </p>
                      <p className="text-xs text-emerald-600 leading-relaxed font-semibold">
                        الشبكة متصلة وجداول Supabase جاهزة لاستيعاب البيانات. انقر فوق زر "بدء المزامنة والتصدير" في الأعلى للبدء بنقل البيانات بشكل آمن وتلقائي.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">مراحل وخطوات التصدير الفعلي:</h4>
                      
                      <div className="border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-50">
                        {migrationSteps.map((step) => (
                          <div key={step.id} className="p-4 bg-white flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                step.status === 'success' ? 'bg-emerald-50 text-emerald-600' :
                                step.status === 'error' ? 'bg-rose-50 text-rose-600' :
                                step.status === 'loading' ? 'bg-blue-50 text-blue-600' :
                                'bg-slate-50 text-slate-400'
                              }`}>
                                {step.status === 'success' ? <Check className="w-4 h-4 stroke-[3px]" /> :
                                 step.status === 'error' ? <X className="w-4 h-4 stroke-[3px]" /> :
                                 step.status === 'loading' ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> :
                                 <Database className="w-4 h-4" />}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{step.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono">Firebase: {step.collection} ➔ Supabase: {step.table}</p>
                              </div>
                            </div>

                            <div className="text-left shrink-0">
                              {step.status === 'success' ? (
                                <span className="inline-flex items-center text-xs font-black text-emerald-600">
                                  تم بنجاح ({step.count} صف)
                                </span>
                              ) : step.status === 'error' ? (
                                <span className="inline-flex items-center text-xs font-black text-rose-500" title={step.error}>
                                  خطأ في النقل
                                </span>
                              ) : step.status === 'loading' ? (
                                <span className="inline-flex items-center text-xs font-bold text-blue-500 animate-pulse">
                                  جاري التصدير...
                                </span>
                              ) : (
                                <span className="text-xs text-slate-300 font-bold">بانتظار البدء</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {migrationFinished && (
                        <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-3xl space-y-1.5 mt-4">
                          <h4 className="font-extrabold text-emerald-900 text-sm flex items-center gap-2">
                            🎉 تمت المزامنة بنجاح!
                          </h4>
                          <p className="text-xs leading-relaxed text-emerald-700">
                            تم تصدير وتجميع كافة صفوف قواعد البيانات الأساسية والفرعية إلى جداول Postgres على Supabase بنجاح تام وبشكل مباشر! جميع خدمات المتجر تعمل الآن كالمتوقع.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
