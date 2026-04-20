import React, { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Bell, Check, ArrowRight, ShoppingBag, Tag, Package, 
  CheckCircle2, Trash2, Clock, Inbox, 
  Settings, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../../context/StoreContext';
import ConfirmationModal from '../ConfirmationModal';

type NotificationType = 'all' | 'sale' | 'stock' | 'order' | 'system';

export default function NotificationsDrawer() {
  const { 
    notifications, markNotificationAsRead, showToast, 
    setNotifications, products, notificationSettings, 
    updateNotificationSettings, isNotificationsOpen, setIsNotificationsOpen,
    deleteNotification, clearAllNotifications,
    formatPrice
  } = useStore();

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

  const handleUpdateSetting = useCallback((id: string) => {
    updateNotificationSettings({ [id]: !notificationSettings[id as keyof typeof notificationSettings] });
  }, [notificationSettings, updateNotificationSettings]);

  const handleConfirmDelete = useCallback(async () => {
    if (notificationToDelete) {
      deleteNotification(notificationToDelete);
      showToast('تم حذف الإشعار');
      setNotificationToDelete(null);
    }
  }, [notificationToDelete, deleteNotification, showToast]);

  return (
    <>
      <AnimatePresence>
        {isNotificationsOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotificationsOpen(false)}
              className="fixed inset-0 bg-slate-900 z-50 backdrop-blur-sm"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-[85%] sm:w-[400px] bg-white z-50 shadow-2xl flex flex-col rounded-r-2xl overflow-hidden"
            >
              <div className="p-4 sm:p-6 flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 sm:mb-8 shrink-0">
                  <h2 className="text-lg sm:text-xl font-black text-carbon flex items-center gap-2">
                    <Bell className="w-6 h-6 sm:w-7 sm:h-7 text-solar" />
                    الإشعارات
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold min-w-[20px] h-[20px] flex items-center justify-center rounded-full px-1">
                        {unreadCount}
                      </span>
                    )}
                  </h2>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setIsSettingsModalOpen(true)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-600 border border-slate-200"
                      title="الإعدادات"
                    >
                      <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                    <button 
                      onClick={() => setIsNotificationsOpen(false)}
                      className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-600 border border-slate-200"
                    >
                      <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 hide-scrollbar shrink-0">
                  {(['all', 'order', 'sale', 'stock', 'system'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all whitespace-nowrap ${
                        activeTab === tab 
                          ? 'bg-solar text-white shadow-lg shadow-solar/20' 
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {tab === 'all' ? 'الكل' : tab === 'order' ? 'الطلبات' : tab === 'sale' ? 'العروض' : tab === 'stock' ? 'المخزون' : 'النظام'}
                    </button>
                  ))}
                </div>

                {/* Notifications List */}
                <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3 sm:space-y-4 hide-scrollbar">
                {filteredNotifications.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-4">
                      <Inbox className="w-8 h-8 text-slate-200" />
                    </div>
                    <h3 className="text-base font-black text-slate-900 mb-2">لا توجد إشعارات</h3>
                    <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">
                      {activeTab === 'all' 
                        ? 'صندوق الوارد الخاص بك فارغ حالياً.'
                        : `لا توجد إشعارات في قسم ${activeTab === 'order' ? 'الطلبات' : activeTab === 'sale' ? 'العروض' : 'المخزون'} حالياً.`}
                    </p>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {filteredNotifications.map((notification) => (
                      <motion.div 
                        key={notification.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`group relative p-4 rounded-2xl border transition-all duration-300 ${
                          notification.isRead 
                            ? 'bg-slate-50/50 border-slate-100 opacity-70' 
                            : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
                        }`}
                      >
                        <div className="flex gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                            notification.productId 
                              ? 'bg-slate-100' 
                              : notification.type === 'sale' 
                                ? 'bg-rose-50 text-rose-600'
                                : notification.type === 'order'
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : 'bg-blue-50 text-blue-600'
                          }`}>
                            {notification.productId ? (
                              <img 
                                src={getProductImage(notification.productId) || undefined} 
                                alt="" 
                                className="w-full h-full object-cover rounded-lg" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              getIcon(notification.type)
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className={`text-xs font-black truncate ${notification.isRead ? 'text-slate-500' : 'text-slate-900'}`}>
                                {notification.title}
                              </h4>
                              <span className="text-[9px] font-bold text-slate-400 whitespace-nowrap">
                                {new Date(notification.date).toLocaleTimeString('ar-u-nu-latn', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className={`text-[11px] leading-relaxed mb-3 line-clamp-2 ${notification.isRead ? 'text-slate-400' : 'text-slate-600'}`}>
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {notification.productId && (
                                  <Link 
                                    to={`/product/${notification.productId}`}
                                    onClick={() => {
                                      markNotificationAsRead(notification.id);
                                      setIsNotificationsOpen(false);
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-carbon text-white text-[9px] font-bold flex items-center gap-1.5"
                                  >
                                    عرض المنتج
                                    <ArrowRight className="w-2.5 h-2.5" />
                                  </Link>
                                )}
                                {!notification.isRead && (
                                  <button 
                                    onClick={() => markNotificationAsRead(notification.id)}
                                    className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[9px] font-bold flex items-center gap-1.5"
                                  >
                                    <Check className="w-2.5 h-2.5" />
                                    مقروء
                                  </button>
                                )}
                              </div>
                              <button 
                                onClick={() => setNotificationToDelete(notification.id)}
                                className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

                {/* Footer Actions */}
                {notifications.length > 0 && (
                  <div className="mt-auto pt-6 border-t border-slate-100 grid grid-cols-2 gap-3 shrink-0">
                    <button 
                      onClick={markAllAsRead}
                      disabled={unreadCount === 0}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-all disabled:opacity-50 border border-slate-200"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      تحديد الكل
                    </button>
                    <button 
                      onClick={() => setIsClearAllModalOpen(true)}
                      className="flex items-center justify-center gap-2 py-3 rounded-xl bg-rose-50 text-rose-500 text-xs font-bold hover:bg-rose-100 transition-all border border-rose-100"
                    >
                      <Trash2 className="w-4 h-4" />
                      مسح الكل
                    </button>
                    <Link 
                      to="/notifications"
                      onClick={() => setIsNotificationsOpen(false)}
                      className="col-span-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-50 text-slate-900 text-xs font-bold hover:bg-slate-100 transition-all border border-slate-200"
                    >
                      عرض كل الإشعارات
                      <ArrowRight className="w-4 h-4 rotate-180" />
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modals */}
      <ConfirmationModal
        isOpen={isClearAllModalOpen}
        onClose={() => setIsClearAllModalOpen(false)}
        onConfirm={clearAll}
        title="مسح جميع الإشعارات"
        message="هل أنت متأكد من رغبتك في مسح جميع الإشعارات؟"
        confirmText="مسح الكل"
        cancelText="تراجع"
        type="danger"
      />

      <ConfirmationModal
        isOpen={!!notificationToDelete}
        onClose={() => setNotificationToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="حذف الإشعار"
        message="هل أنت متأكد من رغبتك في حذف هذا الإشعار؟"
        confirmText="حذف"
        cancelText="تراجع"
        type="danger"
      />

      {/* Settings Modal */}
      <AnimatePresence>
        {isSettingsModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsModalOpen(false)}
              className="absolute inset-0 bg-carbon/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-black text-slate-900">إعدادات الإشعارات</h3>
                  <button onClick={() => setIsSettingsModalOpen(false)} className="text-slate-400"><X className="w-5 h-5" /></button>
                </div>

                <div className="space-y-4">
                  {[
                    { id: 'order', label: 'تحديثات الطلبات', icon: <ShoppingBag className="w-4 h-4" /> },
                    { id: 'sale', label: 'العروض والتخفيضات', icon: <Tag className="w-4 h-4" /> },
                    { id: 'stock', label: 'تنبيهات المخزون', icon: <Package className="w-4 h-4" /> },
                    { id: 'promotions', label: 'أخبار المتجر', icon: <Bell className="w-4 h-4" /> }
                  ].map((item) => (
                    <div key={item.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                          {item.icon}
                        </div>
                        <span className="text-xs font-bold text-slate-800">{item.label}</span>
                      </div>
                      <button
                        onClick={() => handleUpdateSetting(item.id)}
                        className={`relative w-10 h-5 rounded-full transition-all ${
                          notificationSettings[item.id as keyof typeof notificationSettings] ? 'bg-solar' : 'bg-slate-200'
                        }`}
                      >
                        <motion.div
                          animate={{ x: notificationSettings[item.id as keyof typeof notificationSettings] ? 22 : 2 }}
                          className="absolute top-1 left-0 w-3 h-3 bg-white rounded-full"
                        />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="w-full mt-8 bg-carbon text-white h-12 rounded-xl font-black text-xs"
                >
                  حفظ الإعدادات
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
