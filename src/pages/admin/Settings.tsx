import React, { useState } from "react";
import { useStore } from "../../context/StoreContext";
import { FloatingInput } from "../../components/FloatingInput";
import { ImageUploadField } from "../../components/ImageUploadField";
import ConfirmationModal from "../../components/ConfirmationModal";
import {
  Settings as SettingsIcon,
  Save,
  Globe,
  Mail,
  Bell,
  Smartphone,
  Phone,
  Info,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon,
  Languages,
  Clock,
  Instagram,
  Twitter,
  Facebook,
  Music,
  Youtube,
  MessageCircle,
  MapPin,
  CreditCard,
  Plus,
  Trash2,
  Check,
  X,
  ChevronDown,
  Search,
  Megaphone,
  Palette,
} from "lucide-react";
import { motion, AnimatePresence, Variants } from "motion/react";
import { showLuxuryToast } from "@/lib/luxuryToast";
import { toast } from "sonner";

// Reusable Section Header Component
const SectionHeader = ({
  icon: Icon,
  title,
  description,
  colorClass,
  bgClass,
}: {
  icon: any;
  title: string;
  description: string;
  colorClass: string;
  bgClass: string;
}) => (
  <div className="flex items-center gap-3 md:gap-4 pb-4 md:pb-6 border-b border-slate-50">
    <div
      className={`w-10 h-10 md:w-12 md:h-12 ${bgClass} rounded-xl md:rounded-2xl flex items-center justify-center ${colorClass}`}
    >
      <Icon className="w-5 h-5 md:w-6 md:h-6" />
    </div>
    <div>
      <h3 className="text-lg md:text-xl font-bold text-carbon">{title}</h3>
      <p className="text-xs md:text-sm text-slate-500">{description}</p>
    </div>
  </div>
);

const Settings = () => {
  const { settings, updateSettings, logActivity } = useStore();
  const [formData, setFormData] = useState(settings);
  const [activeSection, setActiveSection] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(
    null,
  );
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(settings);

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(formData);
      logActivity("تحديث الإعدادات", "تم تحديث إعدادات النظام العامة");
      showLuxuryToast("success", {
        title: "تم الحفظ بنجاح!",
        description: "تم تحديث كافة إعدادات النظام وتطبيقها عالمياً.",
      });
    } catch (error: any) {
      console.error("Failed to save settings to Supabase/Firebase:", error);
      const errMsg = error?.message || error?.details || "حدث خطأ غير متوقع أثناء محاولة حفظ الإعدادات.";
      showLuxuryToast("error", {
        title: "فشل الحفظ",
        description: errMsg,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    {
      id: "general",
      label: "الإعدادات العامة",
      shortLabel: "عام",
      icon: Globe,
      description: "معلومات المتجر الأساسية والهوية",
    },
    {
      id: "design",
      label: "الألوان والتصميم",
      shortLabel: "تصميم",
      icon: Palette,
      description: "تخصيص الهوية البصرية، الألوان، والقوالب",
    },
    {
      id: "announcements",
      label: "الشريط الإعلاني",
      shortLabel: "إعلانات",
      icon: Megaphone,
      description: "إدارة الإعلانات في أعلى الموقع",
    },
    {
      id: "contact",
      label: "بيانات التواصل",
      shortLabel: "تواصل",
      icon: Mail,
      description: "البريد، الهاتف، والعناوين",
    },
    {
      id: "seo",
      label: "إعدادات SEO",
      shortLabel: "SEO",
      icon: Search,
      description: "تحسين ظهور المتجر في محركات البحث",
    },
    {
      id: "payment",
      label: "طرق الدفع",
      shortLabel: "الدفع",
      icon: CreditCard,
      description: "إدارة وسائل الدفع المتاحة",
    },
  ];

  return (
    <div className="space-y-4 md:space-y-8 relative flex flex-col min-h-[calc(100vh-2rem)]">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-carbon tracking-tight">
            إعدادات النظام
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            تخصيص تجربة المتجر وإدارة المعايير التشغيلية
          </p>
        </div>
      </div>

      {/* Professional Top Navigation Menu & Save Controls */}
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-sm border border-slate-100 p-1.5 md:p-2 flex flex-col gap-2">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between flex-1 w-full gap-0.5 md:gap-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex flex-col md:flex-row items-center justify-center gap-1 md:gap-3 p-1.5 md:px-6 md:py-3.5 rounded-xl md:rounded-2xl transition-all relative group flex-1 ${
                activeSection === section.id
                  ? "text-solar"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <div
                className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-colors ${
                  activeSection === section.id
                    ? "bg-solar/10 text-solar"
                    : "bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-slate-600"
                }`}
              >
                <section.icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <span className="font-bold text-[10px] md:text-sm whitespace-nowrap">
                <span className="md:hidden">{section.shortLabel}</span>
                <span className="hidden md:inline">{section.label}</span>
              </span>

              {activeSection === section.id && (
                <motion.div
                  layoutId="activeSettingsTab"
                  className="absolute bottom-0 left-2 right-2 md:left-6 md:right-6 h-0.5 bg-solar rounded-full"
                />
              )}
            </button>
          ))}
        </div>

        {/* Save Controls Bar */}
        <div className="flex items-center justify-between px-2 py-2 border-t border-slate-100">
          <div className="flex items-center gap-3">
            {hasChanges ? (
              <span className="text-sm font-bold text-amber-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="hidden sm:inline">
                  توجد تعديلات غير محفوظة
                </span>
                <span className="sm:hidden">تعديلات معلقة</span>
              </span>
            ) : (
              <span className="text-sm font-medium text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span className="hidden sm:inline">جميع الإعدادات محفوظة</span>
                <span className="sm:hidden">محفوظ</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setFormData(settings)}
              disabled={!hasChanges || isSaving}
              className={`px-3 md:px-4 py-2 rounded-xl font-semibold text-xs md:text-sm transition-all ${
                hasChanges
                  ? "text-slate-600 hover:bg-slate-100"
                  : "text-slate-300 cursor-not-allowed"
              }`}
            >
              تراجع
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={`flex items-center gap-2 px-4 md:px-6 py-2 rounded-xl font-bold text-xs md:text-sm transition-all ${
                !hasChanges
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                  : isSaving
                    ? "bg-solar/70 text-white cursor-not-allowed"
                    : "bg-solar text-white hover:bg-solar/90 shadow-lg shadow-solar/20 active:scale-95"
              }`}
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full mt-4 md:mt-8">
        {/* Content Area */}
        <div className="w-full">
          <motion.div
            key={activeSection}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            className="bg-white rounded-2xl md:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="space-y-6 md:space-y-8">
              {activeSection === "general" && (
                <div className="p-4 md:p-8 space-y-6 md:space-y-8">
                  <SectionHeader
                    icon={Globe}
                    title="المعلومات الأساسية"
                    description="تحديد هوية المتجر والاسم التجاري"
                    bgClass="bg-solar/10"
                    colorClass="text-solar"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                    <div className="space-y-2">
                      <FloatingInput
                        id="storeName"
                        label="اسم المتجر"
                        type="text"
                        value={formData.storeName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            storeName: e.target.value,
                          })
                        }
                        bgClass="bg-slate-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <ImageUploadField
                        id="storeLogo"
                        label="شعار المتجر"
                        value={formData.storeLogo || ""}
                        onChange={(url) =>
                          setFormData({ ...formData, storeLogo: url })
                        }
                        description="يرجى رفع شعار المتجر الرسمي (يفضل بخلفية شفافة)"
                      />
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-4">
                    <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-amber-900">
                        ملاحظة هامة
                      </p>
                      <p className="text-xs text-amber-700 mt-0.5">
                        تغيير اسم المتجر سيؤثر على كافة رسائل البريد الإلكتروني
                        التلقائية والفواتير الصادرة للعملاء.
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-100">
                    <div className="flex items-center justify-between p-6 bg-slate-900 rounded-3xl text-white">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                          <Clock className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-bold">وضع الصيانة</p>
                          <p className="text-xs text-white/60 mt-0.5">
                            إغلاق المتجر مؤقتاً لإجراء تحديثات
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={formData.isMaintenanceMode}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              isMaintenanceMode: e.target.checked,
                            })
                          }
                        />
                        <div className="w-14 h-7 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-solar"></div>
                      </label>
                    </div>

                    <AnimatePresence>
                      {formData.isMaintenanceMode && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-6 space-y-2"
                        >
                          <FloatingInput
                            id="maintenanceMessage"
                            label="رسالة الصيانة للعملاء"
                            isTextArea
                            value={formData.maintenanceMessage || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                maintenanceMessage: e.target.value,
                              })
                            }
                            bgClass="bg-slate-50"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {activeSection === "announcements" && (
                <div className="px-4 py-6 md:p-10 space-y-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <SectionHeader
                      icon={Megaphone}
                      title="الشريط الإعلاني"
                      description="إدارة شريط الإعلانات في أعلى الموقع"
                      bgClass="bg-purple-50"
                      colorClass="text-purple-600"
                    />
                    <label className="relative inline-flex items-center cursor-pointer bg-white border border-slate-200 px-4 py-2 rounded-xl">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={formData.announcementSettings?.enabled !== false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            announcementSettings: {
                              ...(formData.announcementSettings || { announcements: [], isMarquee: true, backgroundColor: formData.primaryColor || '#000000', textColor: '#FFFFFF', speed: 20 }),
                              enabled: e.target.checked,
                            },
                          })
                        }
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[10px] after:left-[18px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                      <span className="mr-3 text-sm font-bold text-slate-700">
                        تفعيل الشريط
                      </span>
                    </label>
                  </div>

                  <AnimatePresence>
                    {formData.announcementSettings?.enabled !== false && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-8"
                      >
                        {/* Display Settings */}
                        <div className="bg-slate-50 border border-slate-100 p-6 rounded-3xl space-y-6">
                          <h4 className="font-bold text-lg text-slate-800">إعدادات العرض</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <label className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:border-purple-200 transition-colors">
                              <span className="font-bold text-sm text-slate-700">تأثير متحرك (Marquee)</span>
                              <div className="relative inline-flex items-center">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={formData.announcementSettings?.isMarquee}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      announcementSettings: {
                                        ...(formData.announcementSettings || { enabled: true, announcements: [], backgroundColor: '#F8FAFC', textColor: '#0F172A', speed: 15 }),
                                        isMarquee: e.target.checked,
                                      },
                                    })
                                  }
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                              </div>
                            </label>

                            <div className="space-y-2">
                              <label className="block text-sm font-bold text-slate-700 mx-2">لون الخلفية</label>
                              <div className="flex bg-white border border-slate-200 rounded-2xl p-2 items-center gap-2">
                                <input
                                  type="color"
                                  className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0"
                                  value={formData.announcementSettings?.backgroundColor || '#F8FAFC'}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      announcementSettings: {
                                        ...(formData.announcementSettings || { enabled: true, announcements: [], isMarquee: true, textColor: '#0F172A', speed: 15 }),
                                        backgroundColor: e.target.value,
                                      },
                                    })
                                  }
                                />
                                <input 
                                  type="text" 
                                  value={formData.announcementSettings?.backgroundColor || '#F8FAFC'}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      announcementSettings: {
                                        ...(formData.announcementSettings || { enabled: true, announcements: [], isMarquee: true, textColor: '#0F172A', speed: 15 }),
                                        backgroundColor: e.target.value,
                                      },
                                    })
                                  }
                                  className="flex-1 bg-transparent border-0 focus:ring-0 text-sm font-mono text-slate-600"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="block text-sm font-bold text-slate-700 mx-2">لون النص</label>
                              <div className="flex bg-white border border-slate-200 rounded-2xl p-2 items-center gap-2">
                                <input
                                  type="color"
                                  className="w-10 h-10 rounded-xl cursor-pointer border-0 p-0"
                                  value={formData.announcementSettings?.textColor || '#0F172A'}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      announcementSettings: {
                                        ...(formData.announcementSettings || { enabled: true, announcements: [], isMarquee: true, backgroundColor: '#F8FAFC', speed: 15 }),
                                        textColor: e.target.value,
                                      },
                                    })
                                  }
                                />
                                <input 
                                  type="text" 
                                  value={formData.announcementSettings?.textColor || '#0F172A'}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      announcementSettings: {
                                        ...(formData.announcementSettings || { enabled: true, announcements: [], isMarquee: true, backgroundColor: '#F8FAFC', speed: 15 }),
                                        textColor: e.target.value,
                                      },
                                    })
                                  }
                                  className="flex-1 bg-transparent border-0 focus:ring-0 text-sm font-mono text-slate-600"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Announcements List */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-lg text-slate-800">النصوص الإعلانية</h4>
                            <button
                              type="button"
                              onClick={() => {
                                const current = formData.announcementSettings?.announcements || [];
                                setFormData({
                                  ...formData,
                                  announcementSettings: {
                                    ...(formData.announcementSettings || { enabled: true, isMarquee: true, backgroundColor: '#F8FAFC', textColor: '#0F172A', speed: 15 }),
                                    announcements: [...current, { id: Math.random().toString(36).substr(2, 9), text: "", isActive: true }],
                                  },
                                });
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100 transition-colors text-sm font-bold"
                            >
                              <Plus className="w-4 h-4" />
                              إضافة إعلان
                            </button>
                          </div>

                          <div className="space-y-3">
                            {formData.announcementSettings?.announcements?.map((ann, i) => (
                              <div key={ann.id} className="flex gap-3 bg-white border border-slate-200 p-3 rounded-2xl items-start group">
                                <button
                                  onClick={() => {
                                    const curr = [...(formData.announcementSettings?.announcements || [])];
                                    if(curr[i]) curr[i].isActive = !curr[i].isActive;
                                    setFormData({
                                      ...formData,
                                      announcementSettings: { ...formData.announcementSettings!, announcements: curr }
                                    });
                                  }}
                                  className={`mt-2 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${ann.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}
                                  title={ann.isActive ? 'مفعل' : 'معطل'}
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <div className="flex-1 space-y-2">
                                  <input
                                    type="text"
                                    className="w-full bg-slate-50 border-0 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-purple-100"
                                    placeholder="أدخل النص الإعلاني..."
                                    value={ann.text}
                                    onChange={(e) => {
                                      const curr = [...(formData.announcementSettings?.announcements || [])];
                                      curr[i].text = e.target.value;
                                      setFormData({
                                        ...formData,
                                        announcementSettings: { ...formData.announcementSettings!, announcements: curr }
                                      });
                                    }}
                                  />
                                </div>
                                <button
                                  onClick={() => {
                                    const curr = formData.announcementSettings?.announcements?.filter(a => a.id !== ann.id) || [];
                                    setFormData({
                                      ...formData,
                                      announcementSettings: { ...formData.announcementSettings!, announcements: curr }
                                    });
                                  }}
                                  className="mt-2 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            
                            {(!formData.announcementSettings?.announcements || formData.announcementSettings.announcements.length === 0) && (
                              <div className="text-center py-12 bg-slate-50 border border-slate-100 border-dashed rounded-3xl">
                                <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <p className="text-sm text-slate-500 font-medium">لم تقم بإضافة أي نصوص إعلانية بعد</p>
                              </div>
                            )}
                          </div>
                        </div>

                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {activeSection === "contact" && (
                <div className="px-4 py-6 md:p-10 space-y-10">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <SectionHeader
                      icon={Mail}
                      title="بيانات التواصل"
                      description="إدارة قنوات التواصل مع عملائك وعناوين المتجر"
                      bgClass="bg-blue-50"
                      colorClass="text-blue-600"
                    />
                  </div>

                  {/* Contact Channels Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    {/* Primary Contact Info */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-slate-50/50 rounded-3xl p-6 md:p-8 border border-slate-100">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                          قنوات الاتصال المباشر
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <FloatingInput
                            id="contactPhone"
                            label="رقم الهاتف الأساسي"
                            type="tel"
                            value={formData.contactPhone}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                contactPhone: e.target.value,
                              })
                            }
                            bgClass="bg-white"
                            icon={
                              <Smartphone className="w-5 h-5 text-blue-500" />
                            }
                            iconPosition="start"
                            dir="ltr"
                          />
                          <FloatingInput
                            id="contactPhone2"
                            label="رقم الهاتف الإضافي"
                            type="tel"
                            value={formData.contactPhone2 || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                contactPhone2: e.target.value,
                              })
                            }
                            bgClass="bg-white"
                            icon={<Phone className="w-5 h-5 text-slate-400" />}
                            iconPosition="start"
                            dir="ltr"
                          />
                          <div className="md:col-span-2">
                            <FloatingInput
                              id="contactEmail"
                              label="البريد الإلكتروني الرسمي"
                              type="email"
                              value={formData.contactEmail || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  contactEmail: e.target.value,
                                })
                              }
                              bgClass="bg-white"
                              icon={<Mail className="w-5 h-5 text-blue-500" />}
                              iconPosition="start"
                              dir="ltr"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50/50 rounded-3xl p-6 md:p-8 border border-slate-100">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                          الموقع الجغرافي والعنوان
                        </h4>
                        <FloatingInput
                          id="address"
                          label="العنوان التفصيلي للمتجر / المكتب"
                          isTextArea
                          value={formData.address}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              address: e.target.value,
                            })
                          }
                          bgClass="bg-white"
                          icon={<MapPin className="w-5 h-5 text-emerald-500" />}
                          iconPosition="start"
                        />
                      </div>
                    </div>

                    {/* Social Media Sidebar */}
                    <div className="space-y-6">
                      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm h-full">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <div className="w-1.5 h-4 bg-solar rounded-full"></div>
                          حسابات التواصل
                        </h4>

                        <div className="space-y-4">
                          <FloatingInput
                            id="whatsapp"
                            label="واتساب"
                            type="tel"
                            value={formData.socialMedia?.whatsapp || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                socialMedia: {
                                  ...formData.socialMedia,
                                  whatsapp: e.target.value,
                                },
                              })
                            }
                            bgClass="bg-slate-50/50"
                            icon={
                              <MessageCircle className="w-5 h-5 text-green-500" />
                            }
                            iconPosition="start"
                            dir="ltr"
                          />
                          <FloatingInput
                            id="instagram"
                            label="انستغرام"
                            type="url"
                            value={formData.socialMedia?.instagram || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                socialMedia: {
                                  ...formData.socialMedia,
                                  instagram: e.target.value,
                                },
                              })
                            }
                            bgClass="bg-slate-50/50"
                            icon={
                              <Instagram className="w-5 h-5 text-pink-600" />
                            }
                            iconPosition="start"
                            dir="ltr"
                          />
                          <FloatingInput
                            id="twitter"
                            label="تويتر / X"
                            type="url"
                            value={formData.socialMedia?.twitter || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                socialMedia: {
                                  ...formData.socialMedia,
                                  twitter: e.target.value,
                                },
                              })
                            }
                            bgClass="bg-slate-50/50"
                            icon={<Twitter className="w-5 h-5 text-sky-500" />}
                            iconPosition="start"
                            dir="ltr"
                          />
                          <FloatingInput
                            id="facebook"
                            label="فيسبوك"
                            type="url"
                            value={formData.socialMedia?.facebook || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                socialMedia: {
                                  ...formData.socialMedia,
                                  facebook: e.target.value,
                                },
                              })
                            }
                            bgClass="bg-slate-50/50"
                            icon={
                              <Facebook className="w-5 h-5 text-blue-600" />
                            }
                            iconPosition="start"
                            dir="ltr"
                          />
                          <FloatingInput
                            id="tiktok"
                            label="تيك توك"
                            type="url"
                            value={formData.socialMedia?.tiktok || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                socialMedia: {
                                  ...formData.socialMedia,
                                  tiktok: e.target.value,
                                },
                              })
                            }
                            bgClass="bg-slate-50/50"
                            icon={<Music className="w-5 h-5 text-black" />}
                            iconPosition="start"
                            dir="ltr"
                          />
                          <FloatingInput
                            id="youtube"
                            label="يوتيوب"
                            type="url"
                            value={formData.socialMedia?.youtube || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                socialMedia: {
                                  ...formData.socialMedia,
                                  youtube: e.target.value,
                                },
                              })
                            }
                            bgClass="bg-slate-50/50"
                            icon={<Youtube className="w-5 h-5 text-red-600" />}
                            iconPosition="start"
                            dir="ltr"
                          />
                        </div>

                        <div className="mt-8 p-4 bg-solar/5 rounded-2xl border border-solar/10">
                          <p className="text-[10px] font-bold text-solar uppercase tracking-widest mb-1">
                            نصيحة احترافية
                          </p>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            تأكد من وضع الروابط الكاملة (URL) لضمان توجيه
                            العملاء بشكل صحيح لحساباتك.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "seo" && (
                <div className="p-4 md:p-8 space-y-6 md:space-y-8">
                  <SectionHeader
                    icon={Search}
                    title="تحسين محركات البحث (SEO)"
                    description="إدارة ظهور المتجر في جوجل ومنصات التواصل"
                    bgClass="bg-solar/10"
                    colorClass="text-solar"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    <div className="space-y-6">
                      <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <div className="w-1.5 h-4 bg-solar rounded-full"></div>
                          البيانات الوصفية (Meta Data)
                        </h4>
                        <div className="space-y-4">
                          <FloatingInput
                            id="metaTitle"
                            label="عنوان المتجر للمحركات (Meta Title)"
                            value={formData.seo?.metaTitle || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                seo: {
                                  ...(formData.seo || {}),
                                  metaTitle: e.target.value,
                                },
                              })
                            }
                            bgClass="bg-white"
                          />
                          <FloatingInput
                            id="metaDescription"
                            label="وصف المتجر (Meta Description)"
                            isTextArea
                            value={formData.seo?.metaDescription || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                seo: {
                                  ...(formData.seo || {}),
                                  metaDescription: e.target.value,
                                },
                              })
                            }
                            bgClass="bg-white"
                          />
                        </div>
                      </div>

                      <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                          أيقونة المتجر (Favicon)
                        </h4>
                        <div className="space-y-4">
                          <ImageUploadField
                            id="favicon"
                            label="تحميل الأيقونة (Favicon)"
                            value={formData.seo?.favicon || ""}
                            onChange={(url) =>
                              setFormData({
                                ...formData,
                                seo: { ...(formData.seo || {}), favicon: url },
                              })
                            }
                            description="الأيقونة التي تظهر في تبويب المتصفح"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 h-full">
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                          <div className="w-1.5 h-4 bg-emerald-500 rounded-full"></div>
                          معاينة التواصل الاجتماعي (OG Image)
                        </h4>
                        <div className="space-y-6">
                          <ImageUploadField
                            id="ogImage"
                            label="صورة المشاركة (OG Image)"
                            value={formData.seo?.ogImage || ""}
                            onChange={(url) =>
                              setFormData({
                                ...formData,
                                seo: { ...(formData.seo || {}), ogImage: url },
                              })
                            }
                            description="الصورة التي تظهر عند مشاركة رابط الموقع"
                          />

                          <div className="space-y-3">
                            <p className="text-xs font-bold text-slate-500 px-1">
                              معاينة شكل الرابط عند مشاركته:
                            </p>
                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                              <div className="aspect-[1.91/1] bg-slate-100 flex items-center justify-center overflow-hidden">
                                {formData.seo?.ogImage ? (
                                  <img
                                    src={formData.seo.ogImage || undefined}
                                    alt="OG Preview"
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon className="w-12 h-12 text-slate-300" />
                                )}
                              </div>
                              <div className="p-4 space-y-1 border-t border-slate-100">
                                <p className="text-xs text-slate-400 font-medium truncate">
                                  {window.location.hostname}
                                </p>
                                <p className="text-sm font-bold text-carbon truncate">
                                  {formData.seo?.metaTitle ||
                                    formData.storeName}
                                </p>
                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                  {formData.seo?.metaDescription ||
                                    "وصف المتجر سيظهر هنا عند مشاركة الرابط في منصات التواصل الاجتماعي..."}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                            <div className="flex gap-3">
                              <Info className="w-5 h-5 text-amber-600 shrink-0" />
                              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                المقاس الموصى به لصورة المشاركة هو{" "}
                                <span className="font-bold">1200x630</span> بكسل
                                لضمان أفضل ظهور على فيسبوك وتويتر وواتساب.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "design" && (
                <div className="p-4 md:p-8 space-y-6 md:space-y-8">
                  <SectionHeader
                    icon={Palette}
                    title="الهوية البصرية والألوان"
                    description="تخصيص ثيم وألوان المتجر الأساسية لتناسب علامتك التجارية"
                    bgClass="bg-purple-50"
                    colorClass="text-purple-600"
                  />

                  {/* Built-in Premium Presets Grid */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-700">قوالب الألوان الملكية الجاهزة</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { id: "royal", name: "الذهبي الملكي (الكلاسيكي)", hex: "#C5A059", description: "أناقة وفخامة كلاسيكية للمتاجر الراقية والمجوهرات" },
                        { id: "maroon", name: "الملكي الماروني (العنابي)", hex: "#991B1B", description: "جذاب، دافئ ومناسب لمتاجر العطور والساعات الفاخرة" },
                        { id: "emerald", name: "الزمرد النبيل", hex: "#065F46", description: "هادئ وممتاز للقهوة المختصة أو منتجات الصحة والعناية" },
                        { id: "sapphire", name: "الأزرق الكوني (الساطع)", hex: "#1D4ED8", description: "حديث واحترافي، مثالي لمتاجر التقنية والإلكترونيات" },
                        { id: "amethyst", name: "بنفسجي الملوك (الأميثيست)", hex: "#6D28D9", description: "مبتكر وفريد للمتاجر الترفيهية وملحقات الهواتف" },
                        { id: "sunset", name: "البرتقالي الناري (الشمسي)", hex: "#EA580C", description: "حيوي ومثير للحماس ومناسب لمتاجر الألعاب والأحذية" },
                        { id: "carbon", name: "البلاتيني الكربوني (الأسود)", hex: "#1E293B", description: "بسيط، ذكي وكلاسيكي لمختلف أنواع السلع والخدمات" },
                      ].map((preset) => (
                        <div
                          key={preset.id}
                          onClick={() => setFormData({ ...formData, primaryColor: preset.hex })}
                          className={`relative p-5 rounded-3xl border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden group ${
                            formData.primaryColor === preset.hex
                              ? "border-slate-800 shadow-md scale-[1.01]"
                              : "border-slate-100 hover:border-slate-200 hover:bg-slate-50/50"
                          }`}
                        >
                          {/* Colored corner glow */}
                          <div
                            className="absolute -top-10 -left-10 w-24 h-24 rounded-full blur-2xl opacity-25 transition-all group-hover:scale-125"
                            style={{ backgroundColor: preset.hex }}
                          />

                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-5 h-5 rounded-full border border-black/10 shadow-sm shrink-0 flex items-center justify-center text-white"
                                style={{ backgroundColor: preset.hex }}
                              >
                                {formData.primaryColor === preset.hex && (
                                  <Check className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <span className="font-bold text-xs md:text-sm text-slate-800">{preset.name}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                              {preset.description}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] font-mono text-slate-400">
                            <span>لون الثيم</span>
                            <span className="font-bold select-all" style={{ color: preset.hex }}>{preset.hex}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Custom Color Selector Section */}
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100/80 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                        <Palette className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs md:text-sm text-slate-800">أو حدد لوناً مخصصاً بالكامل</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">يمكنك اختيار أي لون يعكس علامتك التجارية الفريدة</p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex-1">
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                          <input
                            type="color"
                            value={formData.primaryColor || "#C5A059"}
                            onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                            className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer scale-150"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <label className="block text-[11px] font-bold text-slate-500">منتقي الألوان الفرعي</label>
                          <input
                            type="text"
                            value={formData.primaryColor || ""}
                            onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                            className="w-full text-xs font-mono font-bold text-slate-700 bg-transparent outline-none border-b border-dashed border-slate-300 focus:border-purple-600 transition-colors uppercase"
                            placeholder="#000000"
                          />
                        </div>
                      </div>

                      <div className="sm:w-1/3 flex flex-col justify-center gap-1.5 p-4 bg-white/60 rounded-2xl border border-slate-200/50">
                        <span className="text-[10px] font-bold text-slate-400">معاينة الحيوية للمتجر</span>
                        <div className="flex items-center gap-2">
                          <button
                            className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all active:scale-95"
                            style={{ backgroundColor: formData.primaryColor || "#C5A059" }}
                          >
                            مثال على زر
                          </button>
                          <span
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: formData.primaryColor || "#C5A059" }}
                          />
                          <span className="text-xs font-bold text-slate-600">نص مميز</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Prototyping Advice */}
                  <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex gap-3">
                    <Info className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-purple-900 leading-relaxed">
                        سهولة التسويق والبيع للمتاجر الأخرى
                      </p>
                      <p className="text-[11px] text-purple-700 mt-1 leading-relaxed">
                        عندما تختار قالب ألوان جديد، سيتم تطبيقه فوراً على كافة صفحات المتجر (من الأزرار، والروابط، وحركات التحميل، وأيقونة الحساب، إلى صفحة الدفع). يتيح لك هذا إعادة تخصيص المتجر بالكامل لعميلك القادم بضغطة زر واحدة فقط!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === "payment" && (
                <div className="p-4 md:p-8 space-y-6 md:space-y-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <SectionHeader
                      icon={CreditCard}
                      title="طرق الدفع"
                      description="إدارة وسائل الدفع المتاحة للعملاء"
                      bgClass="bg-emerald-50"
                      colorClass="text-emerald-600"
                    />
                    <button
                      onClick={() => {
                        const newMethod = {
                          id: Math.random().toString(36).substr(2, 9),
                          name: "وسيلة دفع جديدة",
                          type: "wallet" as const,
                          isActive: false,
                          requiresProof: true,
                          accountNumber: "",
                          accountName: "",
                          instructions: "",
                          logo: "",
                        };
                        setFormData({
                          ...formData,
                          paymentMethods: [
                            ...(formData.paymentMethods || []),
                            newMethod,
                          ],
                        });
                        toast.info("تمت إضافة وسيلة دفع جديدة", {
                          description: "يرجى إكمال البيانات وحفظ التغييرات.",
                        });
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      إضافة وسيلة جديدة
                    </button>
                  </div>

                  <div className="space-y-4 md:space-y-6">
                    {formData.paymentMethods?.map((method, index) => (
                      <motion.div
                        key={method.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-slate-100 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-sm hover:shadow-md transition-all relative group"
                      >
                        <div
                          className="flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer relative"
                          onClick={() =>
                            setExpandedPaymentId(
                              expandedPaymentId === method.id
                                ? null
                                : method.id,
                            )
                          }
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden shrink-0">
                              {method.logo ? (
                                <img
                                  src={method.logo || undefined}
                                  alt={method.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <CreditCard className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={method.name}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) => {
                                    const newMethods = [
                                      ...(formData.paymentMethods || []),
                                    ];
                                    newMethods[index] = {
                                      ...method,
                                      name: e.target.value,
                                    };
                                    setFormData({
                                      ...formData,
                                      paymentMethods: newMethods,
                                    });
                                  }}
                                  className="text-lg font-bold text-carbon bg-transparent border-none p-0 focus:ring-0 w-full"
                                  placeholder="اسم وسيلة الدفع"
                                />
                                <ChevronDown
                                  className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${expandedPaymentId === method.id ? "rotate-180" : ""}`}
                                />
                              </div>
                              <select
                                value={method.type}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const newMethods = [
                                    ...(formData.paymentMethods || []),
                                  ];
                                  newMethods[index] = {
                                    ...method,
                                    type: e.target.value as any,
                                  };
                                  setFormData({
                                    ...formData,
                                    paymentMethods: newMethods,
                                  });
                                }}
                                className="text-xs text-slate-500 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                              >
                                <option value="bank">حساب بنكي</option>
                                <option value="wallet">محفظة إلكترونية</option>
                                <option value="other">أخرى</option>
                              </select>
                            </div>
                          </div>

                          <div
                            className="flex items-center gap-4 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex flex-col items-end">
                              <span
                                className={`text-xs font-black px-3 py-1 rounded-full ${method.isActive ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"}`}
                              >
                                {method.isActive ? "نشط" : "متوقف"}
                              </span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={method.isActive}
                                onChange={(e) => {
                                  const newMethods = [
                                    ...(formData.paymentMethods || []),
                                  ];
                                  newMethods[index] = {
                                    ...method,
                                    isActive: e.target.checked,
                                  };
                                  setFormData({
                                    ...formData,
                                    paymentMethods: newMethods,
                                  });
                                }}
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                          </div>

                          {/* Delete Button Moved Lower */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPaymentToDelete(method.id);
                            }}
                            className="absolute -bottom-2 left-0 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all z-20"
                            title="حذف وسيلة الدفع"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <AnimatePresence>
                          {expandedPaymentId === method.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-8 pt-6 md:pt-8 border-t border-slate-50">
                                <ImageUploadField
                                  id={`logo-${method.id}`}
                                  label="شعار المحفظة / البنك"
                                  value={method.logo || ""}
                                  onChange={(url) => {
                                    const newMethods = [
                                      ...(formData.paymentMethods || []),
                                    ];
                                    newMethods[index] = {
                                      ...method,
                                      logo: url,
                                    };
                                    setFormData({
                                      ...formData,
                                      paymentMethods: newMethods,
                                    });
                                  }}
                                />
                                <FloatingInput
                                  id={`acc-${method.id}`}
                                  label={
                                    method.type === "bank"
                                      ? "رقم الحساب"
                                      : "رقم المحفظة"
                                  }
                                  value={method.accountNumber || ""}
                                  onChange={(e) => {
                                    const newMethods = [
                                      ...(formData.paymentMethods || []),
                                    ];
                                    newMethods[index] = {
                                      ...method,
                                      accountNumber: e.target.value,
                                    };
                                    setFormData({
                                      ...formData,
                                      paymentMethods: newMethods,
                                    });
                                  }}
                                  bgClass="bg-slate-50"
                                />
                                <FloatingInput
                                  id={`name-${method.id}`}
                                  label="اسم الحساب / المالك"
                                  value={method.accountName || ""}
                                  onChange={(e) => {
                                    const newMethods = [
                                      ...(formData.paymentMethods || []),
                                    ];
                                    newMethods[index] = {
                                      ...method,
                                      accountName: e.target.value,
                                    };
                                    setFormData({
                                      ...formData,
                                      paymentMethods: newMethods,
                                    });
                                  }}
                                  bgClass="bg-slate-50"
                                />
                                <div className="md:col-span-2">
                                  <FloatingInput
                                    id={`inst-${method.id}`}
                                    label="تعليمات الدفع للعميل"
                                    isTextArea
                                    value={method.instructions || ""}
                                    onChange={(e) => {
                                      const newMethods = [
                                        ...(formData.paymentMethods || []),
                                      ];
                                      newMethods[index] = {
                                        ...method,
                                        instructions: e.target.value,
                                      };
                                      setFormData({
                                        ...formData,
                                        paymentMethods: newMethods,
                                      });
                                    }}
                                    bgClass="bg-slate-50"
                                  />
                                </div>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    id={`proof-${method.id}`}
                                    checked={method.requiresProof}
                                    onChange={(e) => {
                                      const newMethods = [
                                        ...(formData.paymentMethods || []),
                                      ];
                                      newMethods[index] = {
                                        ...method,
                                        requiresProof: e.target.checked,
                                      };
                                      setFormData({
                                        ...formData,
                                        paymentMethods: newMethods,
                                      });
                                    }}
                                    className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                  />
                                  <label
                                    htmlFor={`proof-${method.id}`}
                                    className="text-sm font-bold text-slate-700"
                                  >
                                    إلزام العميل بإرفاق صورة الإشعار
                                  </label>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}

                    {(!formData.paymentMethods ||
                      formData.paymentMethods.length === 0) && (
                      <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold">
                          لا توجد وسائل دفع مضافة حالياً
                        </p>
                        <button
                          onClick={() => {
                            const newMethod = {
                              id: Math.random().toString(36).substr(2, 9),
                              name: "وسيلة دفع جديدة",
                              type: "wallet" as const,
                              isActive: false,
                              requiresProof: true,
                              accountNumber: "",
                              accountName: "",
                              instructions: "",
                              logo: "",
                            };
                            setFormData({
                              ...formData,
                              paymentMethods: [newMethod],
                            });
                          }}
                          className="mt-4 text-emerald-600 font-bold hover:underline"
                        >
                          أضف أول وسيلة دفع الآن
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!paymentToDelete}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={() => {
          if (paymentToDelete) {
            const newMethods = formData.paymentMethods?.filter(
              (m) => m.id !== paymentToDelete,
            );
            setFormData({ ...formData, paymentMethods: newMethods });
            setPaymentToDelete(null);
            toast.success("تم حذف وسيلة الدفع بنجاح");
          }
        }}
        title="حذف وسيلة الدفع"
        message="هل أنت متأكد من رغبتك في حذف وسيلة الدفع هذه نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        cancelText="تراجع"
        type="danger"
      />
    </div>
  );
};

export default Settings;
