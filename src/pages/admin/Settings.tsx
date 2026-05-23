import React, { useState, useEffect } from "react";
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
  ChevronLeft,
  ChevronRight,
  Search,
  Megaphone,
  Palette,
  Hexagon,
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

  // Sync settings when they are loaded from firebase real-time listeners (if form is pristine)
  useEffect(() => {
    if (JSON.stringify(formData) === JSON.stringify(settings)) {
      setFormData(settings);
    }
  }, [settings]);

  // Load selected font for the interactive live sandbox preview dynamically
  useEffect(() => {
    const font = formData.fontFamily;
    if (font && font !== "Cairo") {
      const fontId = `google-font-preview-${font.toLowerCase().replace(/\s+/g, "-")}`;
      if (!document.getElementById(fontId)) {
        const link = document.createElement("link");
        link.id = fontId;
        link.rel = "stylesheet";
        
        let fontApiName = font;
        if (font === "El Messiri") fontApiName = "El+Messiri";
        else if (font === "Playfair Display") fontApiName = "Playfair+Display";
        else if (font === "Space Grotesk") fontApiName = "Space+Grotesk";
        else if (font === "JetBrains Mono") fontApiName = "JetBrains+Mono";
        
        link.href = `https://fonts.googleapis.com/css2?family=${fontApiName}:wght@300;400;500;600;700;800;900&display=swap`;
        document.head.appendChild(link);
      }
    }
  }, [formData.fontFamily]);

  const colorPresets = [
    {
      id: "royal",
      name: "ذهبي ملكي وأوف وايت",
      primary: "#D4AF37",
      bg: "#FAFAFA",
      card: "#FFFFFF",
      text: "#171717",
      textMuted: "#737373",
      description: "الهوية الكلاسيكية للمتجر. فخامة وأناقة تناسب المجوهرات والسلع الفاخرة.",
      gradient: "from-[#D4AF37]/20 to-transparent"
    },
    {
      id: "dark-gold",
      name: "ليالي عربية (مظلم)",
      primary: "#EAB308",
      bg: "#09090B",
      card: "#18181B",
      text: "#FAFAFA",
      textMuted: "#A1A1AA",
      description: "الغموض والفخامة. مزيج من الأسود النجمي والذهبي اللامع لتجربة تسوق ليلية راقية.",
      gradient: "from-[#EAB308]/10 to-[#09090B]"
    },
    {
      id: "emerald",
      name: "زمردي ووردي نبيل",
      primary: "#059669",
      bg: "#F0FDF4",
      card: "#FFFFFF",
      text: "#064E3B",
      textMuted: "#166534",
      description: "هوية مريحة ومنعشة ممتازة للقهوة المختصة، العناية بالبشرة، والمنتجات العضوية.",
      gradient: "from-[#059669]/15 to-transparent"
    },
    {
      id: "maroon",
      name: "عنابي دافئ",
      primary: "#991B1B",
      bg: "#FEF2F2",
      card: "#FFFFFF",
      text: "#450A0A",
      textMuted: "#7F1D1D",
      description: "جاذبية فريدة بالألوان الترابية والنبيذي الفخم، ممتاز للعطور والموضة.",
      gradient: "from-[#991B1B]/15 to-transparent"
    },
    {
      id: "sapphire",
      name: "أزرق ياقوتي ساطع",
      primary: "#2563EB",
      bg: "#F0F9FF",
      card: "#FFFFFF",
      text: "#0F172A",
      textMuted: "#334155",
      description: "هوية تقنية حيوية ونظيفة تناسب متاجر الهواتف والإلكترونيات الذكية.",
      gradient: "from-[#2563EB]/15 to-transparent"
    },
    {
      id: "sunset-orange",
      name: "أورنج ناري",
      primary: "#EA580C",
      bg: "#FFF7ED",
      card: "#FFFFFF",
      text: "#431407",
      textMuted: "#7C2D12",
      description: "لون مليء بالحماس والسرعة، ممتاز لمتاجر الألعاب والتسليم السريع.",
      gradient: "from-[#EA580C]/15 to-transparent"
    },
    {
      id: "mid-night-blue",
      name: "أزرق منتصف الليل (مظلم)",
      primary: "#38BDF8",
      bg: "#020617",
      card: "#0F172A",
      text: "#F8FAFC",
      textMuted: "#94A3B8",
      description: "تصميم عصري مظلم بنغمات زرقاء سماوية، لتجربة تقنية مريحة للعين.",
      gradient: "from-[#38BDF8]/15 to-[#020617]"
    },
    {
      id: "blush-pink",
      name: "وردي ناعم",
      primary: "#EC4899",
      bg: "#FDF2F8",
      card: "#FFFFFF",
      text: "#831843",
      textMuted: "#9D174D",
      description: "لمسة أنثوية ناعمة ومشرقة، مثالي لمنتجات التجميل، الأزياء النسائية والهدايا.",
      gradient: "from-[#EC4899]/15 to-transparent"
    },
    {
      id: "monochrome-light",
      name: "أبيض وأسود مطلق (فاتح)",
      primary: "#000000",
      bg: "#FAFAFA",
      card: "#FFFFFF",
      text: "#000000",
      textMuted: "#52525B",
      description: "مينيماليزم المطلق. تباين عالٍ جداً وخطوط نظيفة تعطي الأولوية لصور منتجاتك.",
      gradient: "from-black/5 to-transparent"
    },
    {
      id: "monochrome-dark",
      name: "أبيض وأسود مطلق (مظلم)",
      primary: "#FFFFFF",
      bg: "#000000",
      card: "#09090B",
      text: "#FFFFFF",
      textMuted: "#A1A1AA",
      description: "أناقة مظلمة وتباين حاد، يناسب البراندات العصرية والمودرن.",
      gradient: "from-white/10 to-[#000000]"
    },
    {
      id: "lavender",
      name: "لافندر حالم",
      primary: "#8B5CF6",
      bg: "#F5F3FF",
      card: "#FFFFFF",
      text: "#2E1065",
      textMuted: "#4C1D95",
      description: "نغمات بنفسجية فاتحة توفر شعوراً بالهدوء والإبداع، مناسب للمتاجر الفنية والشموع.",
      gradient: "from-[#8B5CF6]/15 to-transparent"
    },
    {
      id: "forest-dark",
      name: "غابة كلاسيكية (مظلم)",
      primary: "#10B981",
      bg: "#064E3B",
      card: "#022C22",
      text: "#ECFDF5",
      textMuted: "#6EE7B7",
      description: "ظلال خضراء عميقة مظلمة مستوحاة من الطبيعة الفاخرة للعلامات التجارية الفريدة.",
      gradient: "from-[#10B981]/20 to-[#064E3B]"
    },
    {
      id: "mocha-latte",
      name: "موكا ولاتيه ترابي",
      primary: "#9A3412",
      bg: "#FEFCE8",
      card: "#FFFFFF",
      text: "#422006",
      textMuted: "#713F12",
      description: "ألوان دافئة وترابية مثل القهوة، تبث إحساساً مريحاً ومناسباً للمخابز والمقاهي.",
      gradient: "from-[#9A3412]/15 to-transparent"
    }
  ];

  const presetsRef = React.useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const handlePresetsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollPosition = container.scrollLeft;
    const cardWidth = container.clientWidth - 32;
    if (cardWidth > 0) {
      const sl = Math.abs(scrollPosition);
      const index = Math.round(sl / cardWidth);
      if (index !== activeSlide && index >= 0 && index < colorPresets.length) {
        setActiveSlide(index);
      }
    }
  };

  const scrollToPresetIndex = (index: number) => {
    if (presetsRef.current) {
      const container = presetsRef.current;
      const children = container.children;
      if (children && children[index]) {
        children[index].scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
        setActiveSlide(index);
      }
    }
  };

  const scrollPresets = (direction: "right" | "left") => {
    const newIndex = direction === "right"
      ? Math.max(activeSlide - 1, 0) // RTL reversed logic for intuitive slider swipe
      : Math.min(activeSlide + 1, colorPresets.length - 1);
    scrollToPresetIndex(newIndex);
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
                <div className="p-4 md:p-8 space-y-8 md:space-y-12">
                  <SectionHeader
                    icon={Palette}
                    title="مستودع الألوان وتصميم الهوية"
                    description="تحكم بكافة تفاصيل ألوان متجرك لتطبيقه لعملائك أو علامتك التجارية بسهولة مطلقة"
                    bgClass="bg-purple-50"
                    colorClass="text-purple-600"
                  />

                  {/* 1. Fully-Fledged Theme Presets */}
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <h3 className="text-sm md:text-base font-bold text-slate-800">1. قوالب الألوان المتكاملة الجاهزة (كبسة زر واحدة)</h3>
                        <p className="text-xs text-slate-400">اختر قالباً شاملاً يقوم بضبط كافة ألوان خلفية الموقع، البطاقات، اللمسات التفاعلية والنصوص تلقائياً لستايل سحري ومبهر كلياً:</p>
                      </div>

                      {/* Display Navigation buttons only on mobile */}
                      <div className="flex md:hidden items-center gap-1.5 self-end">
                        <button
                          type="button"
                          onClick={() => scrollPresets("right")}
                          className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => scrollPresets("left")}
                          className="w-8 h-8 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Responsive Container: Horizontally scrollable on mobile with snap-scrolling, beautiful bento on desktop */}
                    <div className="relative">
                      <div
                        ref={presetsRef}
                        onScroll={handlePresetsScroll}
                        className="flex md:grid md:grid-cols-2 lg:grid-cols-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory gap-4 pb-4 px-1 scrollbar-none scroll-smooth touch-pan-x"
                      >
                        {colorPresets.map((preset, index) => {
                          const isSelected =
                            formData.primaryColor === preset.primary &&
                            formData.backgroundColor === preset.bg &&
                            formData.cardColor === preset.card &&
                            formData.textColor === preset.text;

                          return (
                            <div
                              key={preset.id}
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  primaryColor: preset.primary,
                                  backgroundColor: preset.bg,
                                  cardColor: preset.card,
                                  textColor: preset.text,
                                  textMutedColor: preset.textMuted
                                });
                                setActiveSlide(index);
                              }}
                              className={`relative p-6 rounded-[2rem] border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between overflow-hidden group shrink-0 w-[85%] sm:w-[60%] md:w-auto snap-center min-h-[220px] ${
                                isSelected
                                  ? "border-slate-800 bg-white shadow-xl shadow-slate-200/50 scale-[1.02] z-10"
                                  : "border-slate-200/60 hover:border-slate-400 hover:bg-white hover:shadow-lg hover:shadow-slate-200/20"
                              }`}
                            >
                              {/* Background Gradient Effect */}
                              <div className={`absolute inset-0 bg-gradient-to-br ${preset.gradient || 'from-slate-100 to-transparent'} opacity-30 pointer-events-none group-hover:opacity-50 transition-opacity duration-500`} />
                              
                              <div className="relative space-y-4">
                                {/* Header: Color dots & Name */}
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm border ${isSelected ? 'border-transparent' : 'border-black/5'}`}
                                      style={{ backgroundColor: preset.primary }}
                                    >
                                      {isSelected && <Check className="w-5 h-5 drop-shadow-md" />}
                                    </div>
                                    <div className="flex flex-col gap-0.5">
                                      <span className="font-black text-sm md:text-base text-slate-800 tracking-tight">
                                        {preset.name}
                                      </span>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {(preset.bg === "#FFFFFF" || preset.bg === "#FAFAFA" || preset.bg === "#F0FDF4" || preset.bg === "#FEF2F2" || preset.bg === "#F0F9FF" || preset.bg === "#FFF7ED" || preset.bg === "#FDF2F8" || preset.bg === "#F5F3FF" || preset.bg === "#FEFCE8") ? "فاتح / LIGHT" : "مظلم / DARK"}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Description */}
                                <p className="text-xs text-slate-500 leading-relaxed font-medium min-h-[40px]">
                                  {preset.description}
                                </p>

                                {/* Aesthetic Palette Preview (Circles overlapping) */}
                                <div className="flex items-center pt-2 justify-between">
                                  <div className="flex -space-x-3 space-x-reverse">
                                    <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm z-[4]" style={{ backgroundColor: preset.primary }} title="الأساسي (Primary)" />
                                    <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm z-[3]" style={{ backgroundColor: preset.text }} title="النصوص (Text)" />
                                    <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm z-[2]" style={{ backgroundColor: preset.card }} title="البطاقات (Card)" />
                                    <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm z-[1]" style={{ backgroundColor: preset.bg }} title="الخلفية (Background)" />
                                  </div>
                                  
                                  {/* Preset HEX Footer info purely for visual */}
                                  <div className="font-mono text-[10px] font-bold text-slate-400 tracking-wider">
                                    {preset.primary.toUpperCase()}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Professional slide indicator pills below the slider on mobile devices */}
                      <div className="flex md:hidden items-center justify-center gap-1.5 mt-2">
                        {colorPresets.map((_, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => scrollToPresetIndex(index)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              activeSlide === index ? "w-6 bg-slate-800" : "w-1.5 bg-slate-200"
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 2. Advanced Individual Custom Color Selectors */}
                  <div className="space-y-6">
                    <div className="flex flex-col gap-1">
                      <h3 className="text-sm md:text-base font-bold text-slate-800">2. لوحة التحكم بالألوان بالتفصيل (تخصيص حر)</h3>
                      <p className="text-xs text-slate-400">اضغط على أي منتقي ألوان بالأسفل لتغيير خيارات المتجر الدقيقة أو اكتب رمز اللون الـ HEX يدوياً:</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                      {/* Left Side: Color Pickers controls */}
                      <div className="space-y-5 bg-slate-50/60 p-5 md:p-6 rounded-[2.5rem] border border-slate-100/70">
                        {[
                          {
                            key: "primaryColor",
                            label: "اللون التفاعلي الأساسي (Primary Color)",
                            desc: "يُستخدم كرموز للهوية، الحساب، أيقونات السعر، الأزرار والتفاعل الأساسي.",
                            def: "#C5A059"
                          },
                          {
                            key: "backgroundColor",
                            label: "لون خلفية المتجر الرئيسية (Background Color)",
                            desc: "الخلفية العريضة لجميع صفحات المتجر الممتدة.",
                            def: "#FFFFFF"
                          },
                          {
                            key: "cardColor",
                            label: "لون خلفية بطاقات السلع والعناصر (Card Color)",
                            desc: "لون خلفية أقسام المنتجات، الحقول، وصناديق الحاويات.",
                            def: "#FFFFFF"
                          },
                          {
                            key: "textColor",
                            label: "لون النصوص الرئيسي (Text Color)",
                            desc: "لون عناوين المنتجات وتفاصيل الشراء العميقة العريضة.",
                            def: "#0F172A"
                          },
                          {
                            key: "textMutedColor",
                            label: "لون النصوص الثانوية والمساعدة (Muted Text Color)",
                            desc: "يُستخدم للوصف الفرعي المساعد والخصائص وأسماء الفئات.",
                            def: "#64748B"
                          }
                        ].map((picker) => {
                          const val = (formData as any)[picker.key] || picker.def;
                          return (
                            <div key={picker.key} className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:border-purple-200">
                              <div className="flex-1 space-y-1 pr-1">
                                <label className="block text-xs font-bold text-slate-700">{picker.label}</label>
                                <p className="text-[10px] text-slate-400 leading-normal">{picker.desc}</p>
                              </div>

                              {/* Inputs wrapper */}
                              <div className="flex items-center gap-2.5 bg-slate-50 p-2 rounded-xl border border-slate-100 self-end sm:sm:self-center">
                                {/* Hex input text */}
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) => setFormData({ ...formData, [picker.key]: e.target.value })}
                                  className="w-16 text-center text-xs font-mono font-bold text-slate-700 bg-transparent outline-none uppercase"
                                  placeholder="#000000"
                                />
                                
                                {/* Standard Color circle selector */}
                                <div className="relative w-7 h-7 rounded-full overflow-hidden border border-slate-300 shadow-inner flex items-center justify-center shrink-0">
                                  <input
                                    type="color"
                                    value={val}
                                    onChange={(e) => setFormData({ ...formData, [picker.key]: e.target.value })}
                                    className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer scale-150"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* 3. Typography & Reading Experience */}
                        <div className="pt-5 border-t border-slate-100 space-y-3">
                          <label className="block text-xs font-black text-slate-700">3. نمط ونوع الخط البصري للمتجر (Store Typography)</label>
                          <p className="text-[10px] text-slate-400">اختر الخط الأنسب لهوية وتصميم متجرك:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {[
                              { id: "Cairo", name: "خط جيرو (Cairo)", desc: "عصري وجريء ومقروء جداً" },
                              { id: "Tajawal", name: "خط تجول (Tajawal)", desc: "ناعم وأنيق كلاسيكي للسلع" },
                              { id: "Almarai", name: "المراعي (Almarai)", desc: "بسيط ومريح للعين وهادئ" },
                              { id: "Alexandria", name: "الإسكندرية (Alexandria)", desc: "هندسي ومبتكر ومتميز" },
                              { id: "El Messiri", name: "المسيري (El Messiri)", desc: "فني ومموج فريد وأدبي" },
                              { id: "Space Grotesk", name: "سبايس غروتسك (Eng)", desc: "رياضي تقني عصري إنجليزي" },
                            ].map((f) => {
                              const isFontSelected = (formData.fontFamily || "Cairo") === f.id;
                              return (
                                <button
                                  key={f.id}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, fontFamily: f.id })}
                                  className={`p-3 rounded-2xl border text-right transition-all duration-300 ${
                                    isFontSelected
                                      ? "border-slate-800 bg-white shadow-md scale-[1.01]"
                                      : "border-slate-200 bg-transparent hover:border-slate-300 hover:bg-white/40"
                                  }`}
                                  style={{ fontFamily: `'${f.id}', 'Cairo', sans-serif` }}
                                >
                                  <span className="block text-xs font-bold text-slate-800">{f.name}</span>
                                  <span className="block text-[10px] text-slate-400 mt-0.5">{f.desc}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 4. Rounded Corner Style Selection */}
                        <div className="pt-5 border-t border-slate-100 space-y-3">
                          <label className="block text-xs font-black text-slate-700">4. نمط انحناء الحواف والزوايا (Border Corners)</label>
                          <p className="text-[10px] text-slate-400">يتحكم في زوايا الأزرار وحقول المدخلات والسلع:</p>
                          <div className="flex flex-col sm:flex-row gap-2.5">
                            {[
                              { id: "sharp", name: "زوايا حادة", label: "Sharp / حاد", desc: "كلاسيكي مستقيم" },
                              { id: "soft", name: "انحناء متزن", label: "Soft / ناعم", desc: "تصميم أبل الكلاسيكي" },
                              { id: "curved", name: "دوران ممتد", label: "Curved / دوراني", desc: "عصري وجريء جداً" },
                            ].map((r) => {
                              const isRoundingSelected = (formData.borderRadius || "soft") === r.id;
                              return (
                                <button
                                  key={r.id}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, borderRadius: r.id as any })}
                                  className={`flex-1 p-3 rounded-2xl border text-center transition-all duration-300 ${
                                    isRoundingSelected
                                      ? "border-slate-800 bg-white shadow-md scale-[1.01]"
                                      : "border-slate-200 bg-transparent hover:border-slate-300"
                                  }`}
                                >
                                  <span className="block text-xs font-black text-slate-800">{r.name}</span>
                                  <span className="block text-[10px] text-slate-400 mt-0.5">{r.desc}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Dynamic Interactive Live Shop Preview (Extremely Impressive Sandbox) */}
                      <div className="p-6 rounded-[2.5rem] border-2 border-dashed border-slate-200/80 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex h-2 w-2 relative">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-bold text-slate-600">لوحة محاكاة مباشرة لمتجر المشتري (Live Store Sandbox Preview)</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">تحديث فوري</span>
                        </div>

                        {/* Miniature Shop Simulation Container */}
                        {(() => {
                          const getRadiusVal = (type: "sm" | "md" | "lg" | "xl" | "container") => {
                            const rounding = formData.borderRadius || "soft";
                            if (rounding === "sharp") return "0px";
                            if (rounding === "curved") {
                              switch(type) {
                                case "sm": return "8px";
                                case "md": return "16px";
                                case "lg": return "24px";
                                case "xl": return "32px";
                                case "container": return "40px";
                              }
                            }
                            switch(type) {
                              case "sm": return "4px";
                              case "md": return "8px";
                              case "lg": return "12px";
                              case "xl": return "16px";
                              case "container": return "24px";
                            }
                          };
                          
                          return (
                            <div
                              className="w-full h-fit border shadow-2xl p-6 overflow-hidden transition-all duration-700 relative"
                              style={{
                                backgroundColor: formData.backgroundColor || "#FFFFFF",
                                borderColor: `${formData.textColor || "#0F172A"}15`,
                                fontFamily: `'${formData.fontFamily || "Cairo"}', 'Cairo', sans-serif`,
                                borderRadius: getRadiusVal("container")
                              }}
                            >
                              {/* Top Decorative bar */}
                              <div className="absolute top-0 inset-x-0 h-1.5" style={{ backgroundColor: formData.primaryColor || "#C5A059" }} />
                              
                              {/* 1. Shop Top Header Block (Glassmorphic) */}
                              <div className="flex items-center justify-between pb-4 border-b mb-6 border-dashed" style={{ borderColor: `${formData.textColor || "#0F172A"}20` }}>
                                <div className="flex items-center gap-2.5">
                                  <div style={{ backgroundColor: formData.primaryColor || "#C5A059", boxShadow: `0 4px 12px ${formData.primaryColor || '#C5A059'}40`, borderRadius: getRadiusVal("md") }} className="w-5 h-5 flex items-center justify-center text-white">
                                    <Hexagon className="w-3 h-3 fill-white" />
                                  </div>
                                  <span className="text-xs font-black tracking-tight" style={{ color: formData.textColor || "#0F172A" }}>
                                    {formData.storeName || "متجر الفخامة"}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: formData.textColor || "#0F172A", opacity: 0.1 }} />
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: formData.textColor || "#0F172A", opacity: 0.1 }} />
                                  <div className="w-6 h-6 flex items-center justify-center border text-[10px]" style={{ borderColor: `${formData.textColor || "#0F172A"}20`, color: formData.textColor || "#0F172A", borderRadius: getRadiusVal("md") }}>🛒</div>
                                </div>
                              </div>

                              {/* 2. Mini Banner Block */}
                              <div className="w-full py-5 px-6 mb-6 text-center flex flex-col items-center justify-center gap-2 transition-all relative overflow-hidden"
                                   style={{ backgroundColor: `${formData.primaryColor || "#C5A059"}10`, borderRadius: getRadiusVal("lg") }}>
                                {/* Decorative element bg */}
                                <div className="absolute top-0 right-0 w-24 h-24 rounded-full translate-x-12 -translate-y-12 blur-2xl" style={{ backgroundColor: formData.primaryColor || "#C5A059", opacity: 0.15 }} />
                                
                                <span className="text-[12px] font-black z-10" style={{ color: formData.primaryColor || "#C5A059" }}>خصومات الموسم النبيلة</span>
                                <div className="h-1.5 w-16 rounded-full z-10" style={{ backgroundColor: formData.primaryColor || "#C5A059", opacity: 0.5 }} />
                              </div>

                              {/* 3. Product Display Card Showcase Grid */}
                              <div className="grid grid-cols-2 gap-3">
                                {/* Product Item 1 */}
                                <div
                                  className="p-3.5 border transition-all shadow-sm flex flex-col justify-between"
                                  style={{
                                    backgroundColor: formData.cardColor || "#FFFFFF",
                                    borderColor: `${formData.textColor || "#0F172A"}10`,
                                    borderRadius: getRadiusVal("lg")
                                  }}
                                >
                                  <div>
                                    {/* Product Image placeholder */}
                                    <div className="w-full aspect-square flex items-center justify-center mb-3 relative overflow-hidden" style={{ backgroundColor: `${formData.textColor || "#0F172A"}05`, borderRadius: getRadiusVal("md") }}>
                                      <span className="text-[2rem]">💎</span>
                                      <div className="absolute top-1.5 right-1.5 px-2 py-0.5 text-[8px] font-bold text-white shadow-sm tracking-wider"
                                           style={{ backgroundColor: formData.primaryColor || "#C5A059", borderRadius: getRadiusVal("sm") }}>
                                        رائج
                                      </div>
                                    </div>
                                    {/* Product label & prices */}
                                    <span className="block text-[11px] font-black line-clamp-1" style={{ color: formData.textColor || "#0F172A" }}>عطر العود الخاص</span>
                                    <span className="block text-[9px] mt-1 font-bold" style={{ color: formData.textMutedColor || "#64748B" }}>عطور رجالية</span>
                                  </div>
                                  
                                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-dashed" style={{ borderColor: `${formData.textColor || "#0F172A"}15` }}>
                                    <span className="text-[12px] font-black" style={{ color: formData.primaryColor || "#C5A059" }}>18,500</span>
                                    <div className="w-6 h-6 flex items-center justify-center text-white text-[12px] shadow-sm transform hover:scale-105 transition-transform" style={{ backgroundColor: formData.primaryColor || "#C5A059", borderRadius: getRadiusVal("md") }}>
                                      <Plus className="w-3 h-3" />
                                    </div>
                                  </div>
                                </div>

                                {/* Product Item 2 */}
                                <div
                                  className="p-3.5 border transition-all shadow-sm flex flex-col justify-between"
                                  style={{
                                    backgroundColor: formData.cardColor || "#FFFFFF",
                                    borderColor: `${formData.textColor || "#0F172A"}10`,
                                    borderRadius: getRadiusVal("lg")
                                  }}
                                >
                                  <div>
                                    {/* Product Image placeholder */}
                                    <div className="w-full aspect-square flex items-center justify-center mb-3 relative overflow-hidden" style={{ backgroundColor: `${formData.textColor || "#0F172A"}05`, borderRadius: getRadiusVal("md") }}>
                                      <span className="text-[2rem]">⌚</span>
                                    </div>
                                    {/* Product label & prices */}
                                    <span className="block text-[11px] font-black line-clamp-1" style={{ color: formData.textColor || "#0F172A" }}>ساعة رويال كلاسيك</span>
                                    <span className="block text-[9px] mt-1 font-bold" style={{ color: formData.textMutedColor || "#64748B" }}>اكسسوارات فاخرة</span>
                                  </div>
                                  
                                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-dashed" style={{ borderColor: `${formData.textColor || "#0F172A"}15` }}>
                                    <span className="text-[12px] font-black" style={{ color: formData.primaryColor || "#C5A059" }}>45,200</span>
                                    <div className="w-6 h-6 flex items-center justify-center text-white text-[12px] shadow-sm transform hover:scale-105 transition-transform" style={{ backgroundColor: formData.primaryColor || "#C5A059", borderRadius: getRadiusVal("md") }}>
                                      <Plus className="w-3 h-3" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Interactive tips for developer sale */}
                        <div className="p-4 bg-slate-100/60 rounded-2xl border border-slate-200/50 flex gap-2.5 items-start">
                          <Palette className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                            <strong className="text-slate-700">لماذا هذا مبهر؟</strong> يمكنك الدخول إلى هذا المحاكي واختيار لون مخصص تماماً للعلامة التجارية لعميلك القادم. متجر السلع الفريد هذا مبني ليعكس هذه المتغيرات تلقائياً عبر صفحات الشراء والأرصدة بالكامل، مما يضاعف من قيمة بيعك للبرنامج وسرعة تخصيصه!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Prototyping Advice */}
                  <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex gap-3">
                    <Info className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-purple-900 leading-relaxed">
                        نصيحة لتجهيز المتجر في أي مشروع بيع
                      </p>
                      <p className="text-[11px] text-purple-700 mt-1 leading-relaxed">
                        عندما تبرز للعميل هذه اللوحة وتطبيق الهوية الشامل بنقرة زر، سيرى فوراً مرونة النظام الفائقة. سيتم حفظ خيارات الألوان وتنسيقها على الـ Cloud مباشرة حتى تظل مستقرة عبر جميع هواتف زوار المتجر والواجهات.
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
