import React, { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Bell, Check, ArrowRight, ShoppingBag, Tag, Package, 
  CheckCircle2, ChevronLeft, Trash2, Clock, Inbox, 
  Filter, MoreHorizontal, Settings, Archive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../context/StoreContext';
import ConfirmationModal from '../components/ConfirmationModal';

type NotificationType = 'all' | 'sale' | 'stock' | 'order' | 'system';

export default function Notifications() {
  const { 
    notifications, markNotificationAsRead, showToast, 
    setNotifications, products, notificationSettings, 
    updateNotificationSettings, clearAllNotifications, deleteNotification
  } = useStore();
  const navigate = useNavigate();
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NotificationType>('all');

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications;
    return notifications.filter(n => n.type === activeTab);
  }, [notifications, activeTab]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);

  const getProductImage = useCallback((productId?: string) => {
    if (!productId) return null;
    return products.find(p => p.id === productId)?.image;
  }, [products]);

  const getIcon = useCallback((type: 'sale' | 'stock' | 'order' | 'system') => {
    switch (type) {
      case 'sale': return <Tag className="w-5 h-5" />;
      case 'stock': return <Package className="w-5 h-5" />;
      case 'order': return <ShoppingBag className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  }, []);

  const clearAll = useCallback(() => {
    if (notifications.length === 0) return;
    clearAllNotifications();
    showToast('تم مسح جميع الإشعارات');
    setIsClearAllModalOpen(false);
  }, [notifications.length, clearAllNotifications, showToast]);

  const markAllAsRead = useCallback(() => {
    notifications.forEach((n: any) => {
      if (!n.isRead) markNotificationAsRead(n.id);
    });
    showToast('تم تحديد الكل كمقروء');
  }, [notifications, markNotificationAsRead, showToast]);

  const handleOpenClearAllModal = useCallback(() => setIsClearAllModalOpen(true), []);
  const handleCloseClearAllModal = useCallback(() => setIsClearAllModalOpen(false), []);
  const handleOpenSettingsModal = useCallback(() => setIsSettingsModalOpen(true), []);
  const handleCloseSettingsModal = useCallback(() => setIsSettingsModalOpen(false), []);
  const handleSetNotificationToDelete = useCallback((id: string) => setNotificationToDelete(id), []);
  const handleCloseDeleteModal = useCallback(() => setNotificationToDelete(null), []);
  const handleConfirmDelete = useCallback(async () => {
    if (notificationToDelete) {
      deleteNotification(notificationToDelete);
      showToast('تم حذف الإشعار');
      setNotificationToDelete(null);
    }
  }, [notificationToDelete, deleteNotification, showToast]);

  const handleUpdateSetting = useCallback((id: string) => {
    updateNotificationSettings({ [id]: !notificationSettings[id as keyof typeof notificationSettings] });
  }, [notificationSettings, updateNotificationSettings]);

  return (
    <div className="min-h-screen bg-slate-50/30 pb-20 sm:pb-10">
      {/* Professional Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 sm:h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">الإشعارات</h1>
                <p className="text-[10px] sm:text-xs text-slate-400 font-medium">
                  {unreadCount > 0 ? `لديك ${unreadCount} تنبيهات جديدة` : 'أنت مطلع على كل جديد'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {notifications.length > 0 && (
                <button 
                  onClick={handleOpenClearAllModal}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all active:scale-95"
                  title="مسح الكل"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
              <button 
                onClick={handleOpenSettingsModal}
                className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs - Modern Pill Style - Hidden on Desktop Sidebar */}
          <div className="lg:hidden flex items-center gap-2 py-3 overflow-x-auto no-scrollbar">
            {(['all', 'order', 'sale', 'stock', 'system'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                  activeTab === tab 
                    ? 'bg-solar text-white shadow-lg shadow-solar/20 scale-105' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {tab === 'all' ? 'الكل' : tab === 'order' ? 'الطلبات' : tab === 'sale' ? 'العروض' : tab === 'stock' ? 'المخزون' : 'النظام'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Sidebar Navigation */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden lg:block lg:col-span-1 space-y-2"
          >
            <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm sticky top-28">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-4">الأقسام</h3>
              <div className="space-y-1">
                {(['all', 'order', 'sale', 'stock', 'system'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                      activeTab === tab 
                        ? 'bg-solar text-white shadow-lg shadow-solar/20' 
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === tab ? 'bg-white/20' : 'bg-slate-100 text-slate-400'}`}>
                        {tab === 'all' ? <Inbox className="w-4 h-4" /> : getIcon(tab as any)}
                      </div>
                      {tab === 'all' ? 'الكل' : tab === 'order' ? 'الطلبات' : tab === 'sale' ? 'العروض' : tab === 'stock' ? 'المخزون' : 'النظام'}
                    </div>
                    {tab === 'all' && unreadCount > 0 && (
                      <span className={`px-2 py-0.5 rounded-lg text-[10px] ${activeTab === tab ? 'bg-white text-solar' : 'bg-solar text-white'}`}>
                        {unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 space-y-1">
                <button 
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  تحديد الكل كمقروء
                </button>
                <button 
                  onClick={handleOpenClearAllModal}
                  disabled={notifications.length === 0}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold text-rose-500 hover:bg-rose-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-rose-400">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  مسح جميع الإشعارات
                </button>
              </div>
            </div>
          </motion.div>

          {/* Notifications List Content */}
          <div className="lg:col-span-3">
            {notifications.length > 0 && (
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-solar rounded-full"></div>
                  <h2 className="text-sm font-black text-slate-800 uppercase tracking-wide">
                    {activeTab === 'all' ? 'أحدث التنبيهات' : `إشعارات ${activeTab === 'order' ? 'الطلبات' : activeTab === 'sale' ? 'العروض' : 'المخزون'}`}
                  </h2>
                </div>
                {unreadCount > 0 && (
                  <button 
                    onClick={markAllAsRead}
                    className="lg:hidden px-4 py-1.5 rounded-full bg-carbon/5 text-xs font-bold text-carbon hover:bg-carbon/10 transition-colors"
                  >
                    تحديد الكل كمقروء
                  </button>
                )}
              </div>
            )}

            {filteredNotifications.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm"
              >
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center border border-slate-100">
                    <Inbox className="w-10 h-10 text-slate-200" />
                  </div>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-solar/10 rounded-full flex items-center justify-center"
                  >
                    <div className="w-3 h-3 bg-solar rounded-full"></div>
                  </motion.div>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">لا توجد إشعارات</h3>
                <p className="text-sm text-slate-400 max-w-[280px] leading-relaxed font-medium">
                  {activeTab === 'all' 
                    ? 'صندوق الوارد الخاص بك فارغ حالياً. سنقوم بإخطارك عند وجود أي تحديثات جديدة تهمك.'
                    : `لا توجد إشعارات في قسم ${activeTab === 'order' ? 'الطلبات' : activeTab === 'sale' ? 'العروض' : 'المخزون'} حالياً.`}
                </p>
                {activeTab !== 'all' && (
                  <button 
                    onClick={() => setActiveTab('all')}
                    className="mt-8 px-8 py-3 rounded-2xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
                  >
                    عرض كل الإشعارات
                  </button>
                )}
              </motion.div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                  {filteredNotifications.map((notification: any) => (
                    <motion.div 
                      key={notification.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`group relative overflow-hidden bg-white rounded-3xl border transition-all duration-300 ${
                        notification.isRead 
                          ? 'border-slate-100/80 opacity-80' 
                          : 'border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
                      }`}
                    >
                      <div className="p-5 sm:p-6 flex gap-5">
                        {/* Icon/Image with Status Indicator */}
                        <div className="relative shrink-0">
                          <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-105 ${
                            notification.productId 
                              ? 'bg-slate-50 border-slate-100' 
                              : notification.type === 'sale' 
                                ? 'bg-rose-50 text-rose-600 border-rose-100'
                                : notification.type === 'order'
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                  : 'bg-blue-50 text-blue-600 border-blue-100'
                          }`}>
                            {notification.productId ? (
                              <img 
                                src={getProductImage(notification.productId)} 
                                alt="" 
                                className="w-full h-full object-cover rounded-xl" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              getIcon(notification.type)
                            )}
                          </div>
                          {!notification.isRead && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-solar rounded-full border-4 border-white shadow-sm"></div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <h4 className={`text-sm sm:text-base font-black leading-tight truncate ${notification.isRead ? 'text-slate-500' : 'text-slate-900'}`}>
                              {notification.title}
                            </h4>
                            <div className="shrink-0 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-1 rounded-lg">
                              <Clock className="w-3 h-3" />
                              {new Date((notification.date as any)?.seconds ? (notification.date as any).seconds * 1000 : notification.date).toLocaleTimeString('ar-u-nu-latn', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          
                          <p className={`text-xs sm:text-sm leading-relaxed mb-4 line-clamp-2 font-medium ${notification.isRead ? 'text-slate-400' : 'text-slate-600'}`}>
                            {notification.message}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {notification.productId && (
                                <Link 
                                  to={`/product/${notification.productId}`}
                                  onClick={() => markNotificationAsRead(notification.id)}
                                  className="px-4 py-2 rounded-xl bg-carbon text-white text-[10px] font-bold hover:bg-carbon/90 transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-carbon/20"
                                >
                                  عرض المنتج
                                  <ArrowRight className="w-3 h-3" />
                                </Link>
                              )}
                              {!notification.isRead && (
                                <button 
                                  onClick={() => markNotificationAsRead(notification.id)}
                                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-bold hover:bg-slate-200 transition-all active:scale-95 flex items-center gap-2"
                                >
                                  <Check className="w-3 h-3" />
                                  تحديد كمقروء
                                </button>
                              )}
                            </div>

                            <button 
                              onClick={() => handleSetNotificationToDelete(notification.id)}
                              className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all sm:opacity-0 group-hover:opacity-100 active:scale-95"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isClearAllModalOpen}
        onClose={handleCloseClearAllModal}
        onConfirm={clearAll}
        title="مسح جميع الإشعارات"
        message="هل أنت متأكد من رغبتك في مسح جميع الإشعارات؟ لا يمكن التراجع عن هذه العملية."
        confirmText="مسح الكل"
        cancelText="تراجع"
        type="danger"
      />

      <ConfirmationModal
        isOpen={!!notificationToDelete}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="حذف الإشعار"
        message="هل أنت متأكد من رغبتك في حذف هذا الإشعار؟"
        confirmText="حذف"
        cancelText="تراجع"
        type="danger"
      />

      {/* Professional Settings Modal */}
      <AnimatePresence>
        {isSettingsModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseSettingsModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100"
            >
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 border border-slate-100">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">إعدادات الإشعارات</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">تخصيص التنبيهات</p>
                    </div>
                  </div>
                  <button 
                    onClick={handleCloseSettingsModal}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 rotate-90" />
                  </button>
                </div>

                <div className="space-y-6">
                  {[
                    { id: 'order', label: 'تحديثات الطلبات', desc: 'حالة الطلب، الشحن، والتوصيل', icon: <ShoppingBag className="w-4 h-4" /> },
                    { id: 'sale', label: 'العروض والتخفيضات', desc: 'تنبيهات بخصومات حصرية وعروض لفترة محدودة', icon: <Tag className="w-4 h-4" /> },
                    { id: 'stock', label: 'تنبيهات المخزون', desc: 'إشعار عند توفر المنتجات التي تتابعها', icon: <Package className="w-4 h-4" /> },
                    { id: 'promotions', label: 'أخبار المتجر', desc: 'تحديثات عامة، ميزات جديدة، وأخبار النخبة', icon: <Bell className="w-4 h-4" /> }
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-solar/10 group-hover:text-solar transition-colors">
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800">{item.label}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleUpdateSetting(item.id)}
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 ${
                          notificationSettings[item.id as keyof typeof notificationSettings] ? 'bg-solar shadow-lg shadow-solar/20' : 'bg-slate-200'
                        }`}
                      >
                        <motion.div
                          animate={{ x: notificationSettings[item.id as keyof typeof notificationSettings] ? 24 : 4 }}
                          className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm"
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleCloseSettingsModal}
                  className="w-full mt-10 bg-slate-900 text-white h-14 rounded-2xl font-black text-sm hover:bg-slate-800 transition-all active:scale-[0.98] shadow-xl shadow-slate-900/10"
                >
                  حفظ الإعدادات
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
