import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Menu, Home, Search, Percent, Heart, User, Package, MapPin, Settings, LogOut, Truck, ShieldCheck, Headphones, Globe, ChevronLeft, Zap, Wallet, Grid, ShoppingCart, Info, FileText, RefreshCcw, HelpCircle, AlertTriangle, Calculator } from 'lucide-react';
import { useStore, useStoreState, useStoreActions, useStoreUI } from '../context/StoreContext';
import ConfirmationModal from './ConfirmationModal';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

import Logo from './Logo';

export default React.memo(function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { user } = useStoreState();
  const { logout, formatPrice } = useStoreActions();
  const { setIsCartOpen, setIsMobileSearchOpen } = useStoreUI();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  const shoppingItems = [
    { icon: Percent, label: 'العروض اليومية', path: '/deals', badge: 'جديد' },
    { icon: Heart, label: 'المفضلة', path: '/wishlist' },
  ];

  const accountItems = user ? [
    { icon: Package, label: 'طلباتي', path: '/profile', state: { view: 'orders' } }
  ] : [
    { icon: Truck, label: 'تتبع طلبك', path: '/track-order' }
  ];

  const supportItems = [
    { icon: Info, label: 'من نحن', path: '/about' },
    { icon: Headphones, label: 'اتصل بنا', path: '/contact' },
    { icon: HelpCircle, label: 'الأسئلة الشائعة', path: '/faq' },
  ];

  const renderMenuItem = (item: any) => {
    const isActive = window.location.pathname === item.path && (!item.state || window.location.search.includes(item.state.view));
    
    return (
      <div key={item.label}>
        <Link
          to={item.path}
          state={item.state}
          onClick={onClose}
          className={`flex items-center justify-between py-2 px-2.5 rounded-xl transition-all group relative overflow-hidden ${isActive ? 'bg-solar/5' : 'hover:bg-slate-50'}`}
        >
          {isActive && (
            <motion.div 
              layoutId="mobileMenuIndicator"
              className="absolute right-0 top-0 bottom-0 w-1 bg-solar rounded-l-full"
            />
          )}
          <div className="flex items-center gap-3">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors shadow-sm border ${isActive ? 'bg-gold-gradient border-transparent shadow-gold' : 'bg-slate-50 border-slate-100 group-hover:border-solar/30 group-hover:bg-white'}`}>
              <item.icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-slate-500 group-hover:text-solar'}`} strokeWidth={1.5} />
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium transition-colors ${isActive ? 'text-solar font-bold' : 'text-slate-700 group-hover:text-slate-900'}`}>{item.label}</span>
              {item.badge && (
                <span className="bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md shadow-sm">
                  {item.badge}
                </span>
              )}
            </div>
          </div>
          <ChevronLeft className={`w-4 h-4 transition-colors ${isActive ? 'text-solar' : 'text-slate-300 group-hover:text-solar'}`} strokeWidth={1.5} />
        </Link>
      </div>
    );
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-carbon z-50 backdrop-blur-sm"
            onClick={onClose}
          />
        )}
        {isOpen && (
          <motion.div
            key="menu"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.25 }}
            className="fixed top-0 right-0 h-full w-[80%] max-w-[320px] bg-white z-50 shadow-2xl flex flex-col rounded-l-2xl overflow-hidden"
          >
            {/* Header / User Profile */}
            <div className="bg-gradient-to-br from-slate-900 to-black p-3 pt-4 pb-3 text-white relative overflow-hidden border-b border-slate-800">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-solar via-transparent to-transparent"></div>
              <div className="flex items-center justify-between relative z-10 mb-3">
                <Link to="/" onClick={onClose} className="block">
                  <Logo variant="orange" className="h-8" />
                </Link>
                <button onClick={onClose} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white relative flex items-center justify-center backdrop-blur-sm">
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
              
              {user ? (
                <div className="flex flex-col gap-2.5 relative z-10">
                  <Link to="/profile" onClick={onClose} className="flex items-center gap-2.5 group">
                    <div className="w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700 overflow-hidden shadow-inner group-hover:border-solar/50 transition-colors">
                      {user.avatar ? (
                        <img src={user.avatar || undefined} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 mb-0.5 leading-none">مرحباً بك</p>
                      <p className="font-bold text-sm leading-tight text-white group-hover:text-solar transition-colors">{user.name}</p>
                    </div>
                    <ChevronLeft className="w-4 h-4 text-slate-500 mr-auto group-hover:text-solar transition-colors" strokeWidth={1.5} />
                  </Link>
                  
                  {/* Current Balance Card (Mini Bank Card Look) */}
                  <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl p-2.5 flex items-center justify-between shadow-lg relative overflow-hidden">
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-solar/10 rounded-full blur-xl"></div>
                    <div className="flex items-center gap-2.5 relative z-10">
                      <div className="w-7 h-7 bg-solar/20 rounded-lg flex items-center justify-center border border-solar/30">
                        <Wallet className="w-3.5 h-3.5 text-solar" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-400 mb-0.5 leading-none">الرصيد المتاح</p>
                        <p className="font-black text-sm text-white leading-tight tracking-wide">{formatPrice(user.walletBalance || 0)}</p>
                      </div>
                    </div>
                    <Link 
                      to="/profile" 
                      state={{ view: 'wallet' }}
                      onClick={onClose} 
                      className="relative z-10 text-[10px] font-bold text-black bg-gold-gradient px-3 py-1.5 rounded-lg hover:shadow-gold transition-all"
                    >
                      إيداع
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="relative z-10 flex items-center justify-between bg-white/5 p-2.5 rounded-xl border border-white/10 backdrop-blur-sm">
                  <p className="text-[10px] text-slate-300 max-w-[120px] leading-relaxed">سجل دخولك لتجربة تسوق متكاملة</p>
                  <Link
                    to="/auth"
                    onClick={onClose}
                    className="inline-flex items-center gap-1.5 bg-gold-gradient text-black px-3 py-1.5 rounded-lg font-bold transition-all shadow-gold text-[10px]"
                  >
                    <User className="w-3 h-3" strokeWidth={1.5} /> دخول
                  </Link>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-3 hide-scrollbar">
              <div className="mb-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-2">التسوق</h3>
                <div className="space-y-0.5">
                  {shoppingItems.map(renderMenuItem)}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-2">حسابي</h3>
                <div className="space-y-0.5">
                  {accountItems.map(renderMenuItem)}
                </div>
              </div>

              <div className="mb-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-2">تواصل معنا</h3>
                <div className="space-y-0.5">
                  {supportItems.map(renderMenuItem)}
                </div>
              </div>
            </div>

            {user && (
              <div className="p-2 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={() => setShowLogoutConfirm(true)}
                  className="w-full py-2 flex items-center justify-center gap-1.5 text-red-500 bg-white border border-red-100 hover:bg-red-50 rounded-lg font-bold transition-colors shadow-sm text-xs"
                >
                  <LogOut className="w-3.5 h-3.5" /> تسجيل الخروج
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={() => {
          logout();
          onClose();
          setShowLogoutConfirm(false);
        }}
        title="تسجيل الخروج"
        message="هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟"
        confirmText="خروج"
        cancelText="إلغاء"
        type="danger"
      />
    </>
  );
});
