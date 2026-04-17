import React, { useState } from 'react';
import { Image, Plus, Trash2, Send, Target, History, Layout, Bell, Save, X, Edit2, MoveUp, MoveDown, Mail, MessageSquare, Zap, Eye, MousePointerClick, Calendar, Clock, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { motion, AnimatePresence } from 'motion/react';
import { Banner, MarketingNotification } from '../../types';
import { FloatingInput } from '../../components/FloatingInput';
import ConfirmationModal from '../../components/ConfirmationModal';
import { toast } from 'sonner';

type TabType = 'banners' | 'notifications';

export default function Marketing() {
  const { 
    banners, addBanner, updateBanner, deleteBanner,
    marketingNotifications, sendMarketingNotification,
    customers
  } = useStore();

  const [activeTab, setActiveTab] = useState<TabType>('banners');
  
  // Banner State
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerForm, setBannerForm] = useState<Omit<Banner, 'id'>>({
    image: '', images: [], title: '', subtitle: '', link: '', isActive: true, order: banners.length + 1, views: 0, clicks: 0, startDate: '', endDate: '', position: 'hero'
  });

  // Notification State
  const [notifForm, setNotifForm] = useState({
    title: '', message: '', target: 'all' as MarketingNotification['target'], type: 'push' as MarketingNotification['type'], scheduledFor: ''
  });

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const handleBannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingBanner) {
      updateBanner(editingBanner.id, bannerForm);
    } else {
      addBanner(bannerForm);
    }
    setIsBannerModalOpen(false);
    setEditingBanner(null);
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    sendMarketingNotification(notifForm);
    setNotifForm({ title: '', message: '', target: 'all', type: 'push', scheduledFor: '' });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      try {
        toast.info(`جاري رفع ${files.length} صور إلى الخادم...`);
        const { uploadToCloudinary } = await import('../../lib/cloudinary');
        const secureUrls = await Promise.all(files.map(file => uploadToCloudinary(file)));
        
        setBannerForm(prev => {
          const updatedImages = [...(prev.images || []), ...secureUrls];
          return {
            ...prev,
            images: updatedImages,
            image: prev.image || updatedImages[0]
          };
        });
        toast.success("تم رفع الصور بنجاح");
      } catch (error: any) {
        console.error("Marketing images upload failed:", error);
        toast.error(error.message || "فشل في رفع بعض الصور");
      }
    }
  };

  const removeImage = (index: number) => {
    setBannerForm(prev => {
      const newImages = [...(prev.images || [])];
      newImages.splice(index, 1);
      return {
        ...prev,
        images: newImages,
        image: newImages.length > 0 ? newImages[0] : ''
      };
    });
  };

  const tabs = [
    { id: 'banners', label: 'البنرات', icon: Layout },
    { id: 'notifications', label: 'إشعارات التطبيق', icon: Bell },
  ] as const;

  return (
    <div className="space-y-6 sm:space-y-8 pb-20">
      {/* Header & Tabs */}
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-carbon tracking-tight mb-2">التسويق والحملات</h1>
          <p className="text-gray-500 font-medium">أدر حملاتك التسويقية، البنرات، وتواصل مع عملائك بفعالية.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-100 w-full overflow-x-auto no-scrollbar shadow-sm">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-carbon text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Banners Tab */}
      {activeTab === 'banners' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-[2rem] border border-gray-100 shadow-sm">
            <div>
              <h2 className="text-xl font-black text-carbon">البنرات الإعلانية</h2>
              <p className="text-sm text-gray-500 mt-1">تحكم في البنرات المعروضة في الصفحة الرئيسية للمتجر.</p>
            </div>
            <button
              onClick={() => {
                setEditingBanner(null);
                setBannerForm({ image: '', images: [], title: '', subtitle: '', link: '', isActive: true, order: banners.length + 1, views: 0, clicks: 0, startDate: '', endDate: '', position: 'hero' });
                setIsBannerModalOpen(true);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-carbon text-white px-6 py-3 rounded-xl font-bold hover:bg-carbon/90 transition-all shadow-lg shadow-carbon/20"
            >
              <Plus className="w-5 h-5" />
              <span>إضافة بنر جديد</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {banners.sort((a, b) => a.order - b.order).map((banner) => (
              <motion.div
                key={banner.id}
                layout
                className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-gray-200/50 transition-all group flex flex-col"
              >
                <div className="relative aspect-[21/9] sm:aspect-video bg-gray-100 overflow-hidden">
                  {banner.image ? (
                    <img src={banner.image || undefined} alt={banner.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">بدون صورة</div>
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
                      onClick={() => setConfirmModal({
                        isOpen: true,
                        title: 'حذف البنر',
                        message: `هل أنت متأكد من حذف البنر "${banner.title || 'بدون اسم'}"؟`,
                        onConfirm: () => deleteBanner(banner.id)
                      })}
                      className="p-2 bg-red-50/90 backdrop-blur-md rounded-xl text-red-600 hover:bg-red-500 hover:text-white shadow-sm transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2">
                    <div className={`text-xs px-3 py-1.5 rounded-lg font-black backdrop-blur-md ${banner.isActive ? 'bg-emerald-500/90 text-white' : 'bg-gray-500/90 text-white'}`}>
                      {banner.isActive ? 'نشط' : 'معطل'}
                    </div>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-black text-lg text-carbon line-clamp-1">{banner.title || 'بنر بدون اسم'}</h3>
                    <div className="flex items-center gap-1 text-xs font-bold text-gray-400">
                      <Layout className="w-3 h-3" />
                      <span>الترتيب: {banner.order}</span>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-1">{banner.subtitle || 'لا يوجد وصف إضافي'}</p>
                  
                  <div className="mt-auto pt-4 border-t border-gray-50 grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Eye className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-bold">المشاهدات</p>
                        <p className="font-black text-carbon">{banner.views?.toLocaleString() || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <MousePointerClick className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 font-bold">النقرات</p>
                        <p className="font-black text-carbon">{banner.clicks?.toLocaleString() || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-1">
            <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm sticky top-6">
              <h2 className="text-xl font-black text-carbon mb-6 flex items-center gap-2">
                <Send className="w-5 h-5 text-solar" />
                <span>إرسال حملة جديدة</span>
              </h2>
              <form onSubmit={handleSendNotification} className="space-y-5">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">نوع الحملة</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['push', 'sms'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNotifForm({...notifForm, type})}
                        className={`py-2 rounded-xl text-sm font-bold border transition-all ${notifForm.type === type ? 'bg-carbon text-white border-carbon' : 'bg-white text-gray-500 border-gray-200 hover:border-carbon/30'}`}
                      >
                        {type === 'push' ? 'إشعار' : 'SMS'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">عنوان الحملة</label>
                  <input
                    type="text"
                    required
                    value={notifForm.title}
                    onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
                    className="w-full px-4 py-3 bg-bg-general border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-carbon/20 focus:border-carbon font-bold text-carbon transition-all"
                    placeholder="مثلاً: خصومات نهاية الأسبوع!"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">المحتوى</label>
                  <textarea
                    required
                    rows={4}
                    value={notifForm.message}
                    onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
                    className="w-full px-4 py-3 bg-bg-general border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-carbon/20 focus:border-carbon font-bold text-carbon transition-all resize-none"
                    placeholder="اكتب تفاصيل العرض هنا..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">الفئة المستهدفة</label>
                  <select
                    value={notifForm.target}
                    onChange={(e) => setNotifForm({ ...notifForm, target: e.target.value as any })}
                    className="w-full px-4 py-3 bg-bg-general border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-carbon/20 focus:border-carbon font-bold text-carbon transition-all"
                  >
                    <option value="all">جميع العملاء ({customers.length})</option>
                    <option value="vip">عملاء VIP فقط</option>
                    <option value="new">العملاء الجدد (آخر 30 يوم)</option>
                    <option value="inactive">العملاء الخاملين (لم يشتروا منذ 60 يوم)</option>
                    <option value="abandoned_cart">أصحاب السلال المتروكة</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">وقت الإرسال (اختياري)</label>
                  <input
                    type="datetime-local"
                    value={notifForm.scheduledFor}
                    onChange={(e) => setNotifForm({ ...notifForm, scheduledFor: e.target.value })}
                    className="w-full px-4 py-3 bg-bg-general border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-carbon/20 focus:border-carbon font-bold text-carbon transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-carbon text-white py-3.5 rounded-xl font-black hover:bg-carbon/90 transition-all shadow-lg shadow-carbon/20 flex items-center justify-center gap-2 mt-4"
                >
                  {notifForm.scheduledFor ? <Calendar className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                  <span>{notifForm.scheduledFor ? 'جدولة الحملة' : 'إرسال الآن'}</span>
                </button>
              </form>
            </div>
          </div>

          <div className="xl:col-span-2">
            <div className="bg-white rounded-[2rem] border border-gray-100 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-black text-carbon flex items-center gap-2">
                  <History className="w-5 h-5 text-solar" />
                  <span>سجل الحملات</span>
                </h2>
                <button className="text-sm font-bold text-gray-500 hover:text-carbon flex items-center gap-1">
                  <RefreshCw className="w-4 h-4" /> تحديث
                </button>
              </div>
              
              <div className="space-y-4">
                {marketingNotifications.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
                    <Send className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="font-bold text-gray-500">لا توجد حملات سابقة</p>
                  </div>
                ) : (
                  marketingNotifications.map((notif) => (
                    <div key={notif.id} className="p-5 rounded-[1.5rem] border border-gray-100 bg-white hover:shadow-lg hover:shadow-gray-100 transition-all group">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            notif.type === 'push' ? 'bg-purple-50 text-purple-600' : 
                            notif.type === 'email' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            {notif.type === 'push' ? <Bell className="w-5 h-5" /> : 
                             notif.type === 'email' ? <Mail className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                          </div>
                          <div>
                            <h3 className="font-black text-carbon text-lg">{notif.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                notif.status === 'sent' ? 'bg-emerald-100 text-emerald-700' : 
                                notif.status === 'scheduled' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {notif.status === 'sent' ? 'تم الإرسال' : notif.status === 'scheduled' ? 'مجدول' : 'مسودة'}
                              </span>
                              <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {(() => {
                                  const dateVal = notif.scheduledFor || notif.date;
                                  const rawDate = (dateVal as any)?.seconds ? new Date((dateVal as any).seconds * 1000) : new Date(dateVal);
                                  return rawDate.toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' });
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1.5 text-xs font-bold text-carbon bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                            <Target className="w-3.5 h-3.5 text-gray-400" />
                            {notif.target === 'all' ? 'الجميع' : notif.target === 'vip' ? 'VIP' : notif.target === 'inactive' ? 'خاملين' : notif.target === 'abandoned_cart' ? 'سلال متروكة' : 'جدد'}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-5 font-medium leading-relaxed bg-gray-50/50 p-3 rounded-xl border border-gray-50">{notif.message}</p>
                      
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-50">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">المستلمين</p>
                          <p className="font-black text-carbon text-lg">{notif.sentCount?.toLocaleString() || 0}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">الفتح (Open Rate)</p>
                          <div className="flex items-end gap-2">
                            <p className="font-black text-carbon text-lg">{notif.openedCount?.toLocaleString() || 0}</p>
                            <span className="text-xs font-bold text-emerald-500 mb-1">
                              {notif.sentCount > 0 ? Math.round(((notif.openedCount || 0) / notif.sentCount) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">النقر (CTR)</p>
                          <div className="flex items-end gap-2">
                            <p className="font-black text-carbon text-lg">{notif.clickedCount?.toLocaleString() || 0}</p>
                            <span className="text-xs font-bold text-blue-500 mb-1">
                              {(notif.openedCount || 0) > 0 ? Math.round(((notif.clickedCount || 0) / notif.openedCount) * 100) : 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
                  {editingBanner ? 'تعديل البنر' : 'إضافة بنر جديد'}
                </h3>
                <button type="button" onClick={() => setIsBannerModalOpen(false)} className="p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="overflow-y-auto p-5 sm:p-6">
                <form id="banner-form" onSubmit={handleBannerSubmit} className="space-y-6">
                  
                  {/* Image Upload & Preview */}
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">صور البنر</label>
                    
                    {/* Uploaded Images Grid */}
                    {(bannerForm.images && bannerForm.images.length > 0) || bannerForm.image ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                        {/* If we have images array, map it. Otherwise fallback to single image */}
                        {(bannerForm.images?.length ? bannerForm.images : [bannerForm.image]).map((img, idx) => (
                          <div key={idx} className="relative aspect-[21/9] rounded-xl overflow-hidden border border-gray-200 group">
                            <img src={img || undefined} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => removeImage(idx)}
                                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        {/* Add more images button */}
                        <label htmlFor="banner-image-upload-more" className="relative aspect-[21/9] bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 overflow-hidden flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors">
                          <input
                            type="file"
                            id="banner-image-upload-more"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                          <Plus className="w-6 h-6 text-gray-400 mb-1" />
                          <span className="text-xs font-bold text-gray-500">إضافة صورة</span>
                        </label>
                      </div>
                    ) : (
                      <label htmlFor="banner-image-upload" className="relative aspect-[21/9] bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden flex items-center justify-center group cursor-pointer hover:bg-gray-100 transition-colors">
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
                          <p className="font-bold text-sm">اضغط لرفع صور البنر</p>
                          <p className="text-xs mt-1">يمكنك تحديد أكثر من صورة</p>
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
                        onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
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
                        onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
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
                        onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })}
                        bgClass="bg-bg-general"
                        placeholder="/category/electronics"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">مكان العرض (الموضع)</label>
                      <select
                        value={bannerForm.position || 'hero'}
                        onChange={(e) => setBannerForm({ ...bannerForm, position: e.target.value as any })}
                        className="w-full px-4 py-3 bg-bg-general border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-carbon/20 focus:border-carbon font-bold text-carbon transition-all"
                      >
                        <option value="hero">البنر الرئيسي (Hero)</option>
                        <option value="middle">البنرات الوسطى (بعد العروض)</option>
                        <option value="bottom">البنرات السفلية (قبل البطاريات)</option>
                        <option value="screens">بنرات قسم الشاشات</option>
                        <option value="electronics">بنرات قسم الإلكترونيات</option>
                        <option value="solar">بنرات قسم الطاقة الشمسية</option>
                        <option value="accessories">بنرات قسم الإكسسوارات</option>
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
                        onChange={(e) => setBannerForm({ ...bannerForm, order: parseInt(e.target.value) })}
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
                        onChange={(e) => setBannerForm({ ...bannerForm, startDate: e.target.value })}
                        bgClass="bg-white"
                      />
                    </div>
                    <div>
                      <FloatingInput
                        id="bannerEndDate"
                        label="تاريخ الانتهاء (اختياري)"
                        type="datetime-local"
                        value={bannerForm.endDate}
                        onChange={(e) => setBannerForm({ ...bannerForm, endDate: e.target.value })}
                        bgClass="bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-emerald-50/50 px-5 py-4 rounded-xl border border-emerald-100">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={bannerForm.isActive}
                      onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                      className="w-5 h-5 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                    />
                    <label htmlFor="isActive" className="text-sm font-black text-carbon cursor-pointer">تفعيل البنر وعرضه للعملاء</label>
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
                  <span>{editingBanner ? 'حفظ التعديلات' : 'إضافة البنر'}</span>
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
