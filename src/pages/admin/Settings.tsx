import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { FloatingInput } from '../../components/FloatingInput';
import ConfirmationModal from '../../components/ConfirmationModal';
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
  MessageCircle,
  MapPin,
  CreditCard,
  Plus,
  Trash2,
  Check,
  X,
  ChevronDown,
  Search
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { toast } from 'sonner';

// Reusable Section Header Component
const SectionHeader = ({ icon: Icon, title, description, colorClass, bgClass }: { icon: any, title: string, description: string, colorClass: string, bgClass: string }) => (
  <div className="flex items-center gap-3 md:gap-4 pb-4 md:pb-6 border-b border-slate-50">
    <div className={`w-10 h-10 md:w-12 md:h-12 ${bgClass} rounded-xl md:rounded-2xl flex items-center justify-center ${colorClass}`}>
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
  const [activeSection, setActiveSection] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(settings);

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(formData);
      logActivity('تحديث الإعدادات', 'تم تحديث إعدادات النظام العامة');
      toast.success('تم حفظ الإعدادات بنجاح', {
        description: 'تم تحديث كافة التغييرات في النظام.',
        icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
      });
    } catch (error) {
      toast.error('حدث خطأ أثناء الحفظ');
    } finally {
      setIsSaving(false);
    }
  };

  const sections = [
    { id: 'general', label: 'الإعدادات العامة', shortLabel: 'عام', icon: Globe, description: 'معلومات المتجر الأساسية والهوية' },
    { id: 'contact', label: 'بيانات التواصل', shortLabel: 'تواصل', icon: Mail, description: 'البريد، الهاتف، والعناوين' },
    { id: 'notifications', label: 'التنبيهات', shortLabel: 'تنبيهات', icon: Bell, description: 'إدارة الإشعارات والرسائل' },
    { id: 'seo', label: 'إعدادات SEO', shortLabel: 'SEO', icon: Search, description: 'تحسين ظهور المتجر في محركات البحث' },
    { id: 'payment', label: 'طرق الدفع', shortLabel: 'الدفع', icon: CreditCard, description: 'إدارة وسائل الدفع المتاحة' },
  ];

  return (
    <div className="space-y-4 md:space-y-8 relative flex flex-col min-h-[calc(100vh-2rem)]">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-carbon tracking-tight">إعدادات النظام</h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">تخصيص تجربة المتجر وإدارة المعايير التشغيلية</p>
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
                  ? 'text-solar' 
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-colors ${
                activeSection === section.id ? 'bg-solar/10 text-solar' : 'bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-slate-600'
              }`}>
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
                <span className="hidden sm:inline">توجد تعديلات غير محفوظة</span>
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
                hasChanges ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 cursor-not-allowed'
              }`}
            >
              تراجع
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              className={`flex items-center gap-2 px-4 md:px-6 py-2 rounded-xl font-bold text-xs md:text-sm transition-all ${
                !hasChanges
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : isSaving 
                    ? 'bg-solar/70 text-white cursor-not-allowed' 
                    : 'bg-solar text-white hover:bg-solar/90 shadow-lg shadow-solar/20 active:scale-95'
              }`}
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}</span>
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
              {activeSection === 'general' && (
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
                        onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                        bgClass="bg-slate-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <FloatingInput
                        id="storeLogo"
                        label="شعار المتجر (URL)"
                        type="url"
                        value={formData.storeLogo || ''}
                        onChange={(e) => setFormData({ ...formData, storeLogo: e.target.value })}
                        bgClass="bg-slate-50"
                        icon={<ImageIcon className="w-5 h-5" />}
                        iconPosition="start"
                        dir="ltr"
                      />
                      {formData.storeLogo && (
                        <div className="mt-2 w-16 h-16 bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center">
                          <img src={formData.storeLogo || undefined} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <FloatingInput
                      id="announcementText"
                      label="نص الإعلان في أعلى الموقع (الهيدر)"
                      type="text"
                      value={formData.announcementText || ''}
                      onChange={(e) => setFormData({ ...formData, announcementText: e.target.value })}
                      bgClass="bg-slate-50"
                    />
                    <p className="text-xs text-slate-500 mt-1 px-2">مثال: توصيل مجاني وسريع — للطلبات فوق 50 ألف ريال</p>
                  </div>

                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-4">
                    <AlertCircle className="w-6 h-6 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-amber-900">ملاحظة هامة</p>
                      <p className="text-xs text-amber-700 mt-0.5">تغيير اسم المتجر سيؤثر على كافة رسائل البريد الإلكتروني التلقائية والفواتير الصادرة للعملاء.</p>
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
                          <p className="text-xs text-white/60 mt-0.5">إغلاق المتجر مؤقتاً لإجراء تحديثات</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={formData.isMaintenanceMode}
                          onChange={(e) => setFormData({ ...formData, isMaintenanceMode: e.target.checked })}
                        />
                        <div className="w-14 h-7 bg-white/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-solar"></div>
                      </label>
                    </div>

                    <AnimatePresence>
                      {formData.isMaintenanceMode && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-6 space-y-2"
                        >
                          <FloatingInput
                            id="maintenanceMessage"
                            label="رسالة الصيانة للعملاء"
                            isTextArea
                            value={formData.maintenanceMessage || ''}
                            onChange={(e) => setFormData({ ...formData, maintenanceMessage: e.target.value })}
                            bgClass="bg-slate-50"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {activeSection === 'contact' && (
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
                            onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                            bgClass="bg-white"
                            icon={<Smartphone className="w-5 h-5 text-blue-500" />}
                            iconPosition="start"
                            dir="ltr"
                          />
                          <FloatingInput
                            id="contactPhone2"
                            label="رقم الهاتف الإضافي"
                            type="tel"
                            value={formData.contactPhone2 || ''}
                            onChange={(e) => setFormData({ ...formData, contactPhone2: e.target.value })}
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
                              value={formData.contactEmail || ''}
                              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
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
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
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
                            value={formData.socialMedia?.whatsapp || ''}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              socialMedia: { ...formData.socialMedia, whatsapp: e.target.value } 
                            })}
                            bgClass="bg-slate-50/50"
                            icon={<MessageCircle className="w-5 h-5 text-green-500" />}
                            iconPosition="start"
                            dir="ltr"
                          />
                          <FloatingInput
                            id="instagram"
                            label="انستغرام"
                            type="url"
                            value={formData.socialMedia?.instagram || ''}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              socialMedia: { ...formData.socialMedia, instagram: e.target.value } 
                            })}
                            bgClass="bg-slate-50/50"
                            icon={<Instagram className="w-5 h-5 text-pink-600" />}
                            iconPosition="start"
                            dir="ltr"
                          />
                          <FloatingInput
                            id="twitter"
                            label="تويتر / X"
                            type="url"
                            value={formData.socialMedia?.twitter || ''}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              socialMedia: { ...formData.socialMedia, twitter: e.target.value } 
                            })}
                            bgClass="bg-slate-50/50"
                            icon={<Twitter className="w-5 h-5 text-sky-500" />}
                            iconPosition="start"
                            dir="ltr"
                          />
                          <FloatingInput
                            id="facebook"
                            label="فيسبوك"
                            type="url"
                            value={formData.socialMedia?.facebook || ''}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              socialMedia: { ...formData.socialMedia, facebook: e.target.value } 
                            })}
                            bgClass="bg-slate-50/50"
                            icon={<Facebook className="w-5 h-5 text-blue-600" />}
                            iconPosition="start"
                            dir="ltr"
                          />
                        </div>

                        <div className="mt-8 p-4 bg-solar/5 rounded-2xl border border-solar/10">
                          <p className="text-[10px] font-bold text-solar uppercase tracking-widest mb-1">نصيحة احترافية</p>
                          <p className="text-xs text-slate-600 leading-relaxed">تأكد من وضع الروابط الكاملة (URL) لضمان توجيه العملاء بشكل صحيح لحساباتك.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'notifications' && (
                <div className="p-4 md:p-8 space-y-6 md:space-y-8">
                  <SectionHeader 
                    icon={Bell} 
                    title="إشعارات النظام التلقائية" 
                    description="إدارة الرسائل النصية والبريد الإلكتروني للعملاء"
                    bgClass="bg-solar/10"
                    colorClass="text-solar"
                  />

                  <div className="p-4 md:p-6 bg-slate-50 rounded-2xl md:rounded-3xl space-y-4 md:space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-solar shadow-sm">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-carbon">تفعيل التنبيهات التلقائية</p>
                          <p className="text-xs text-slate-500 mt-0.5">إرسال إشعارات للعملاء عند تغيير حالة الطلب</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={formData.autoNotifications?.enabled}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            autoNotifications: { 
                              ...(formData.autoNotifications || { sms: true, email: true, onStatusChange: ['shipped'] }), 
                              enabled: e.target.checked 
                            } 
                          })}
                        />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-solar"></div>
                      </label>
                    </div>

                    <AnimatePresence>
                      {formData.autoNotifications?.enabled && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="pt-6 border-t border-slate-200 space-y-6"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100">
                              <div className="flex items-center gap-3">
                                <Smartphone className="w-4 h-4 text-slate-400" />
                                <span className="text-sm font-bold">رسائل SMS</span>
                              </div>
                              <input 
                                type="checkbox" 
                                className="w-5 h-5 rounded-lg border-slate-300 text-solar focus:ring-solar"
                                checked={formData.autoNotifications?.sms}
                                onChange={(e) => setFormData({ 
                                  ...formData, 
                                  autoNotifications: { 
                                    ...formData.autoNotifications!, 
                                    sms: e.target.checked 
                                  } 
                                })}
                              />
                            </div>
                          </div>

                          <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700">إرسال تنبيه عند الحالات التالية:</label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {[
                                { id: 'pending', label: 'قيد الانتظار (طلب جديد)' },
                                { id: 'processing', label: 'قيد التجهيز' },
                                { id: 'shipped', label: 'تم الشحن' },
                                { id: 'delivered', label: 'تم التوصيل' },
                                { id: 'cancelled', label: 'ملغي' }
                              ].map((status) => (
                                <label key={status.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-solar/30 transition-all">
                                  <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-slate-300 text-solar focus:ring-solar"
                                    checked={formData.autoNotifications?.onStatusChange.includes(status.id as any)}
                                    onChange={(e) => {
                                      const current = formData.autoNotifications?.onStatusChange || [];
                                      const next = e.target.checked 
                                        ? [...current, status.id as any]
                                        : current.filter(s => s !== status.id);
                                      setFormData({
                                        ...formData,
                                        autoNotifications: {
                                          ...formData.autoNotifications!,
                                          onStatusChange: next
                                        }
                                      });
                                    }}
                                  />
                                  <span className="text-xs font-bold">{status.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-4">
                    <Info className="w-6 h-6 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-blue-900">نظام الإشعارات الذكي</p>
                      <p className="text-xs text-blue-700 mt-0.5">يتم إرسال الرسائل تلقائياً بناءً على القوالب المحددة مسبقاً لكل حالة طلب لضمان بقاء العميل على اطلاع دائم.</p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'seo' && (
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
                            value={formData.seo?.metaTitle || ''}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              seo: { ...(formData.seo || {}), metaTitle: e.target.value } 
                            })}
                            bgClass="bg-white"
                          />
                          <FloatingInput
                            id="metaDescription"
                            label="وصف المتجر (Meta Description)"
                            isTextArea
                            value={formData.seo?.metaDescription || ''}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              seo: { ...(formData.seo || {}), metaDescription: e.target.value } 
                            })}
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
                          <FloatingInput
                            id="favicon"
                            label="رابط الأيقونة (Favicon URL)"
                            type="url"
                            value={formData.seo?.favicon || ''}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              seo: { ...(formData.seo || {}), favicon: e.target.value } 
                            })}
                            bgClass="bg-white"
                            dir="ltr"
                          />
                          {formData.seo?.favicon && (
                            <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100">
                              <div className="w-10 h-10 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center">
                                <img src={formData.seo.favicon || undefined} alt="Favicon" className="w-full h-full object-contain" />
                              </div>
                              <p className="text-xs text-slate-500 font-medium">معاينة الأيقونة التي ستظهر في تبويب المتصفح</p>
                            </div>
                          )}
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
                          <FloatingInput
                            id="ogImage"
                            label="رابط صورة المشاركة (OG Image URL)"
                            type="url"
                            value={formData.seo?.ogImage || ''}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              seo: { ...(formData.seo || {}), ogImage: e.target.value } 
                            })}
                            bgClass="bg-white"
                            dir="ltr"
                          />
                          
                          <div className="space-y-3">
                            <p className="text-xs font-bold text-slate-500 px-1">معاينة شكل الرابط عند مشاركته:</p>
                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                              <div className="aspect-[1.91/1] bg-slate-100 flex items-center justify-center overflow-hidden">
                                {formData.seo?.ogImage ? (
                                  <img src={formData.seo.ogImage || undefined} alt="OG Preview" className="w-full h-full object-cover" />
                                ) : (
                                  <ImageIcon className="w-12 h-12 text-slate-300" />
                                )}
                              </div>
                              <div className="p-4 space-y-1 border-t border-slate-100">
                                <p className="text-xs text-slate-400 font-medium truncate">{window.location.hostname}</p>
                                <p className="text-sm font-bold text-carbon truncate">{formData.seo?.metaTitle || formData.storeName}</p>
                                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                                  {formData.seo?.metaDescription || 'وصف المتجر سيظهر هنا عند مشاركة الرابط في منصات التواصل الاجتماعي...'}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                            <div className="flex gap-3">
                              <Info className="w-5 h-5 text-amber-600 shrink-0" />
                              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                                المقاس الموصى به لصورة المشاركة هو <span className="font-bold">1200x630</span> بكسل لضمان أفضل ظهور على فيسبوك وتويتر وواتساب.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'payment' && (
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
                          name: 'وسيلة دفع جديدة',
                          type: 'wallet' as const,
                          isActive: false,
                          requiresProof: true,
                          accountNumber: '',
                          accountName: '',
                          instructions: '',
                          logo: ''
                        };
                        setFormData({
                          ...formData,
                          paymentMethods: [...(formData.paymentMethods || []), newMethod]
                        });
                        toast.info('تمت إضافة وسيلة دفع جديدة', {
                          description: 'يرجى إكمال البيانات وحفظ التغييرات.'
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
                          onClick={() => setExpandedPaymentId(expandedPaymentId === method.id ? null : method.id)}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden shrink-0">
                              {method.logo ? (
                                <img src={method.logo || undefined} alt={method.name} className="w-full h-full object-cover" />
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
                                    const newMethods = [...(formData.paymentMethods || [])];
                                    newMethods[index] = { ...method, name: e.target.value };
                                    setFormData({ ...formData, paymentMethods: newMethods });
                                  }}
                                  className="text-lg font-bold text-carbon bg-transparent border-none p-0 focus:ring-0 w-full"
                                  placeholder="اسم وسيلة الدفع"
                                />
                                <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${expandedPaymentId === method.id ? 'rotate-180' : ''}`} />
                              </div>
                              <select
                                value={method.type}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const newMethods = [...(formData.paymentMethods || [])];
                                  newMethods[index] = { ...method, type: e.target.value as any };
                                  setFormData({ ...formData, paymentMethods: newMethods });
                                }}
                                className="text-xs text-slate-500 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                              >
                                <option value="bank">حساب بنكي</option>
                                <option value="wallet">محفظة إلكترونية</option>
                                <option value="other">أخرى</option>
                              </select>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <div className="flex flex-col items-end">
                              <span className={`text-xs font-black px-3 py-1 rounded-full ${method.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                {method.isActive ? 'نشط' : 'متوقف'}
                              </span>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={method.isActive}
                                onChange={(e) => {
                                  const newMethods = [...(formData.paymentMethods || [])];
                                  newMethods[index] = { ...method, isActive: e.target.checked };
                                  setFormData({ ...formData, paymentMethods: newMethods });
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
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-6 md:mt-8 pt-6 md:pt-8 border-t border-slate-50">
                                <FloatingInput
                                  id={`logo-${method.id}`}
                                  label="رابط الشعار (URL)"
                                  value={method.logo || ''}
                                  onChange={(e) => {
                                    const newMethods = [...(formData.paymentMethods || [])];
                                    newMethods[index] = { ...method, logo: e.target.value };
                                    setFormData({ ...formData, paymentMethods: newMethods });
                                  }}
                                  bgClass="bg-slate-50"
                                  dir="ltr"
                                />
                                <FloatingInput
                                  id={`acc-${method.id}`}
                                  label={method.type === 'bank' ? 'رقم الحساب' : 'رقم المحفظة'}
                                  value={method.accountNumber || ''}
                                  onChange={(e) => {
                                    const newMethods = [...(formData.paymentMethods || [])];
                                    newMethods[index] = { ...method, accountNumber: e.target.value };
                                    setFormData({ ...formData, paymentMethods: newMethods });
                                  }}
                                  bgClass="bg-slate-50"
                                />
                                <FloatingInput
                                  id={`name-${method.id}`}
                                  label="اسم الحساب / المالك"
                                  value={method.accountName || ''}
                                  onChange={(e) => {
                                    const newMethods = [...(formData.paymentMethods || [])];
                                    newMethods[index] = { ...method, accountName: e.target.value };
                                    setFormData({ ...formData, paymentMethods: newMethods });
                                  }}
                                  bgClass="bg-slate-50"
                                />
                                <div className="md:col-span-2">
                                  <FloatingInput
                                    id={`inst-${method.id}`}
                                    label="تعليمات الدفع للعميل"
                                    isTextArea
                                    value={method.instructions || ''}
                                    onChange={(e) => {
                                      const newMethods = [...(formData.paymentMethods || [])];
                                      newMethods[index] = { ...method, instructions: e.target.value };
                                      setFormData({ ...formData, paymentMethods: newMethods });
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
                                      const newMethods = [...(formData.paymentMethods || [])];
                                      newMethods[index] = { ...method, requiresProof: e.target.checked };
                                      setFormData({ ...formData, paymentMethods: newMethods });
                                    }}
                                    className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                  />
                                  <label htmlFor={`proof-${method.id}`} className="text-sm font-bold text-slate-700">إلزام العميل بإرفاق صورة الإشعار</label>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}

                    {(!formData.paymentMethods || formData.paymentMethods.length === 0) && (
                      <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                        <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold">لا توجد وسائل دفع مضافة حالياً</p>
                        <button
                          onClick={() => {
                            const newMethod = {
                              id: Math.random().toString(36).substr(2, 9),
                              name: 'وسيلة دفع جديدة',
                              type: 'wallet' as const,
                              isActive: false,
                              requiresProof: true,
                              accountNumber: '',
                              accountName: '',
                              instructions: '',
                              logo: ''
                            };
                            setFormData({
                              ...formData,
                              paymentMethods: [newMethod]
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
            const newMethods = formData.paymentMethods?.filter(m => m.id !== paymentToDelete);
            setFormData({ ...formData, paymentMethods: newMethods });
            setPaymentToDelete(null);
            toast.success('تم حذف وسيلة الدفع بنجاح');
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
