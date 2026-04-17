import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Search, User, Smartphone, Grid, ChevronDown, Percent, Bell, Truck, Monitor, Headphones, Phone, Menu, Watch, BatteryCharging, Moon, Clock, Plug, Sun, Battery, Coffee, X, Heart, ArrowLeftRight, Cctv, Banknote, Wallet, ShieldCheck, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore, useStoreState, useStoreActions, useStoreUI } from '../../context/StoreContext';
import { Product } from '../../types';
import { FastLink } from '../FastLink';
import Logo from '../Logo';
import PriceDisplay from '../PriceDisplay';
import { FloatingInput } from '../FloatingInput';
import { prefetch } from '../../App';

interface HeaderProps {
  scrolled: boolean;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (isOpen: boolean) => void;
}

export default function Header({ 
  scrolled, 
  isMobileMenuOpen, 
  setIsMobileMenuOpen, 
}: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isCheckout = location.pathname === '/checkout';
  const isAuth = location.pathname === '/auth' || location.pathname === '/signup';
  
  const { 
    user, 
    notifications, 
    cart, 
    wishlist, 
    products
  } = useStoreState();

  const { settings } = useStore();

  const { formatPrice } = useStoreActions();

  const {
    setIsCartOpen,
    setIsWishlistOpen,
    setIsNotificationsOpen,
    isMobileSearchOpen,
    setIsMobileSearchOpen,
    isSearchInputFocused,
    setIsSearchInputFocused,
  } = useStoreUI();
  
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);
  const [cartShake, setCartShake] = useState(false);
  const prevCartCount = useRef(0);
  
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollThreshold = 10; // Minimum scroll distance to trigger hide/show
  
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  
  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  const [activeAnnouncement, setActiveAnnouncement] = useState(0);
  const announcements = [
    { icon: Truck, text: settings.announcementText || 'توصيل مجاني وسريع — للطلبات فوق 50 ألف ريال' },
    { icon: Headphones, text: 'دعم فني 24/7 — نخدمك في أي وقت' },
    { icon: ShieldCheck, text: 'دفع آمن 100% — خيارات مرنة وسهلة' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAnnouncement((prev) => (prev + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [announcements.length]);

  const formatCompactPrice = (price: number) => {
    if (price >= 1000000) {
      const val = price / 1000000;
      return (val % 1 === 0 ? val : val.toFixed(1)) + ' مليون';
    }
    if (price >= 1000) {
      const val = price / 1000;
      return (val % 1 === 0 ? val : val.toFixed(1)) + ' ألف';
    }
    return price.toString() + ' ريال';
  };
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const wishlistCount = wishlist.length;

  useEffect(() => {
    if (cartCount > prevCartCount.current) {
      setCartShake(true);
      setTimeout(() => setCartShake(false), 400);
    }
    prevCartCount.current = cartCount;
  }, [cartCount]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Always show at the very top
      if (currentScrollY < 50) {
        setIsVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Check if we've scrolled enough to trigger a change
      if (Math.abs(currentScrollY - lastScrollY.current) < scrollThreshold) {
        return;
      }

      if (currentScrollY > lastScrollY.current) {
        // Scrolling down
        setIsVisible(false);
        setIsSearchInputFocused(false);
        setIsMobileSearchOpen(false);
      } else {
        // Scrolling up
        setIsVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchInputFocused(false);
      }
      
      const toggleBtn = document.getElementById('mobile-search-toggle');
      const isClickOnToggle = toggleBtn && toggleBtn.contains(event.target as Node);
      
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(event.target as Node) && !isClickOnToggle) {
        setIsMobileSearchOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchInputFocused(false);
        setIsMobileSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const searchResults = searchQuery.trim() === '' 
    ? [] 
    : products.filter(p => (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (p.category || '').toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 4);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setIsSearchInputFocused(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      {/* Minimal Top Announcement Bar */}
      {!isCheckout && !isAuth && (
        <div className="bg-gold-gradient text-carbon text-[10px] sm:text-[11px] uppercase tracking-wider sm:tracking-widest py-1.5 sm:py-2 border-b border-black/10 overflow-hidden">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 flex items-center justify-center sm:justify-between font-bold">
            
            {/* Mobile Carousel */}
            <div className="sm:hidden relative h-4 w-full flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeAnnouncement}
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -15, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                  className="absolute flex items-center gap-1.5"
                >
                  {React.createElement(announcements[activeAnnouncement].icon, { className: "w-3 h-3 text-carbon" })}
                  <span>{announcements[activeAnnouncement].text}</span>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Desktop Static List */}
            <div className="hidden sm:flex items-center gap-4 sm:gap-8 whitespace-nowrap overflow-x-auto hide-scrollbar">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Truck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-carbon" />
                <span>{settings.announcementText || 'توصيل مجاني وسريع — للطلبات فوق 50 ألف ريال'}</span>
              </div>
              <span className="hidden sm:block w-1 h-1 bg-black/20 rounded-full"></span>
              <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
                <Headphones className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-carbon" />
                <span>دعم فني 24/7 — نخدمك في أي وقت</span>
              </div>
              <span className="hidden sm:block w-1 h-1 bg-black/20 rounded-full"></span>
              <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-carbon" />
                <span>دفع آمن 100% — خيارات مرنة وسهلة</span>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-6">
              <div className="flex items-center gap-2 border-l border-black/10 pl-6">
                <Phone className="w-3 h-3 text-carbon/50" />
                <a href="tel:+967771234567" className="hover:text-black transition-colors font-bold" dir="ltr">+967 77 123 4567</a>
              </div>
              <FastLink to="/track-order" prefetchPage="TrackOrder" className="hover:text-black transition-colors">تتبع الطلب</FastLink>
              <FastLink to="/faq" prefetchPage="FAQ" className="hover:text-black transition-colors">المساعدة</FastLink>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <motion.header 
        initial={{ y: 0 }}
        animate={{ 
          y: isVisible ? 0 : -160,
          transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
        }}
        className={`sticky top-0 z-40 transition-all duration-500 w-full bg-carbon-pattern ${
          scrolled 
            ? 'shadow-2xl shadow-black/40 border-b border-white/10 rounded-b-[20px] sm:rounded-b-[24px]' 
            : 'border-b border-white/5'
        }`}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-4 md:gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-4">
            {!isCheckout && (
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="md:hidden p-2 text-solar hover:bg-white/10 rounded-xl transition-all relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center"
              >
                <AnimatePresence mode="wait">
                  {isMobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute"
                    >
                      <X className="w-6 h-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="absolute"
                    >
                      <Menu className="w-6 h-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            )}
            <FastLink to="/" className="shrink-0">
              <Logo variant="orange" className="h-10 sm:h-14" />
            </FastLink>
          </div>

          {/* Desktop Navigation Links */}
          {!isCheckout && (
            <div className="hidden lg:flex items-center gap-8 flex-1 justify-center">
              <Link to="/search" className="flex items-center gap-2.5 text-white font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors">
                <Grid className="w-4 h-4 text-white/70" />
                جميع الأقسام
              </Link>
              <nav className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-white/50">
                {['الرئيسية', 'عروض اليوم', 'وصل حديثاً', 'شاشات', 'طاقة شمسية'].map((item, idx) => (
                  <FastLink 
                    key={item}
                    to={idx === 0 ? "/" : idx === 1 ? "/deals" : idx === 2 ? "/search" : idx === 3 ? "/category/شاشات" : "/category/طاقة شمسية"} 
                    prefetchPage={idx === 1 ? 'Deals' : idx === 2 ? 'Search' : (idx === 3 || idx === 4) ? 'Category' : undefined}
                    className={`transition-all hover:text-white relative py-1 group ${idx === 1 ? 'text-white' : ''}`}
                  >
                    {item}
                    <span className={`absolute bottom-0 right-0 w-0 h-0.5 bg-solar transition-all duration-300 group-hover:w-full ${idx === 1 ? 'w-full' : ''}`}></span>
                  </FastLink>
                ))}
              </nav>
            </div>
          )}

          {/* Search Bar (Desktop) - Expandable */}
          {!isCheckout && (
            <div className="hidden md:flex items-center justify-end flex-1 max-w-xl relative" ref={searchRef}>
              <AnimatePresence mode="wait">
                {!isSearchInputFocused ? (
                  <motion.button
                    key="search-icon"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setIsSearchInputFocused(true)}
                    className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white/70 flex items-center justify-center transition-all border border-white/10"
                    title="بحث"
                  >
                    <Search className="w-5 h-5" />
                  </motion.button>
                ) : (
                  <motion.div
                    key="search-input"
                    initial={{ width: 48, opacity: 0 }}
                    animate={{ width: '100%', opacity: 1 }}
                    exit={{ width: 48, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="w-full relative"
                  >
                    <form onSubmit={handleSearchSubmit} className="w-full relative group">
                      <FloatingInput 
                        id="headerSearch"
                        label="ما الذي تبحث عنه اليوم؟"
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setIsSearchInputFocused(false);
                            e.currentTarget.blur();
                          }
                        }}
                        icon={<Search className="w-5 h-5 text-slate-400" />}
                        iconPosition="start"
                        bgClass="bg-white"
                        className="text-carbon placeholder-slate-400"
                        autoFocus
                      />
                      
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-sm">
                        <AnimatePresence>
                          {searchQuery && (
                            <motion.button 
                              key="clear-search"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              type="button"
                              onClick={() => setSearchQuery('')}
                              className="p-1.5 text-slate-400 hover:text-carbon hover:bg-slate-100 rounded-lg transition-all"
                              title="مسح البحث"
                            >
                              <X className="w-3.5 h-3.5" />
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>
                    </form>

                    {/* Live Search Results Dropdown */}
                    <AnimatePresence>
                      {searchQuery.trim() !== '' && (
                        <motion.div 
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[24px] shadow-2xl border border-solar/30 overflow-hidden z-50"
                        >
                          {searchResults.length > 0 ? (
                            <div className="py-2">
                              <div className="px-5 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-bg-hover">أفضل النتائج</div>
                              {searchResults.map(product => (
                                <Link 
                                  key={product.id}
                                  to={`/product/${product.id}`}
                                  onClick={() => { setIsSearchInputFocused(false); setSearchQuery(''); }}
                                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-bg-hover transition-colors group"
                                >
                                  <div className="w-12 h-12 bg-bg-general rounded-xl overflow-hidden shrink-0">
                                    <img src={product.image || undefined} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-bold text-carbon truncate group-hover:text-solar transition-colors">{product.name}</h4>
                                    <p className="text-[11px] text-slate-500 font-medium">{product.category}</p>
                                  </div>
                                  <div className="text-sm font-black text-carbon">
                                    {formatPrice(product.price)}
                                  </div>
                                </Link>
                              ))}
                              <Link 
                                to={`/search?q=${encodeURIComponent(searchQuery)}`}
                                onClick={() => { setIsSearchInputFocused(false); setSearchQuery(''); }}
                                className="block w-full py-4 bg-bg-hover text-center text-xs font-black text-carbon hover:bg-carbon hover:text-white transition-colors"
                              >
                                عرض جميع النتائج لـ "{searchQuery}"
                              </Link>
                            </div>
                          ) : (
                            <div className="p-10 text-center">
                              <div className="w-16 h-16 bg-bg-hover rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="w-6 h-6 text-slate-600" />
                              </div>
                              <p className="text-sm font-bold text-carbon">لا توجد نتائج مطابقة</p>
                              <p className="text-xs text-slate-500 mt-1">جرب كلمات بحث أخرى</p>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            {/* Desktop Quick Actions */}
            {!isCheckout && (
              <div className="hidden md:flex items-center gap-1 border-l border-white/10 pl-3 ml-1">

                <div className="flex items-center gap-3 pr-1">
                  {user && (
                    <div className="hidden xl:flex flex-col items-end mr-1">
                      <FastLink to="/profile" className="text-[10px] text-white/40 font-bold uppercase tracking-wider hover:text-white transition-colors">المحفظة</FastLink>
                      <div className="flex items-center gap-1.5">
                        <FastLink to="/profile">
                          <PriceDisplay 
                            price={user.walletBalance || 0} 
                            numberClassName="text-xs font-black text-white"
                            currencyClassName="text-[10px] text-emerald-400 font-bold"
                          />
                        </FastLink>
                        <FastLink 
                          to="/profile" 
                          state={{ view: 'wallet' }}
                          className="w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center hover:bg-emerald-500/40 transition-colors"
                          title="إيداع رصيد"
                        >
                          <Plus className="w-3 h-3 text-emerald-400" />
                        </FastLink>
                      </div>
                    </div>
                  )}
                  <FastLink to={user ? "/profile" : "/auth"} prefetchPage={user ? 'Profile' : 'Auth'} className="relative p-1 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all group" title="حسابي">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 flex items-center justify-center bg-white/5 group-hover:scale-110 transition-transform">
                      {user?.photoURL ? (
                        <img src={user.photoURL || undefined} alt={user.displayName} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                  </FastLink>
                </div>
              </div>
            )}

            {/* Mobile Search Toggle */}
            {!isCheckout && (
              <button 
                id="mobile-search-toggle"
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                className="md:hidden p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all w-9 h-9 flex items-center justify-center"
                title="البحث"
              >
                <Search className="w-5 h-5" />
              </button>
            )}

            {/* Notifications */}
            {!isCheckout && (
              <button 
                onClick={() => setIsNotificationsOpen(true)}
                className="relative p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all" 
                title="الإشعارات"
              >
                <Bell className="w-5 h-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-solar text-white text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-carbon shadow-lg shadow-solar/20">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
            )}

            {/* Cart (Desktop) */}
            {!isCheckout && (
              <button 
                onClick={() => setIsCartOpen(true)}
                className={`hidden md:flex relative p-2.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all ${cartShake ? 'animate-shake' : ''}`} 
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-solar text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-carbon">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Wishlist */}
            {!isCheckout && (
              <button 
                onClick={() => setIsWishlistOpen(true)}
                className="relative p-2.5 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                title="المفضلة"
              >
                <Heart className="w-5 h-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-white text-carbon text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-bg-card">
                    {wishlistCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Search Bar Overlay */}
        <AnimatePresence>
          {isMobileSearchOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden bg-bg-general border-t border-white/5 overflow-hidden"
              ref={mobileSearchRef}
            >
              <div className="px-4 py-3">
                <form onSubmit={handleSearchSubmit} className="relative group">
                  <input 
                    autoFocus
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchInputFocused(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsSearchInputFocused(false);
                        setIsMobileSearchOpen(false);
                        e.currentTarget.blur();
                      }
                    }}
                    placeholder="ابحث عن منتج..." 
                    className="w-full bg-white/10 text-white placeholder-white/40 px-5 py-3 pr-11 rounded-xl focus:outline-none focus:ring-2 focus:ring-solar/50 border border-white/10 text-sm font-medium"
                  />
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-white transition-colors" />
                  
                  {searchQuery && (
                    <button 
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-1.5 text-white/40 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </form>

                {/* Mobile Search Results */}
                {searchQuery.trim() !== '' && (
                  <div className="mt-2 bg-white rounded-xl overflow-hidden shadow-2xl border border-bg-hover">
                    {searchResults.length > 0 ? (
                      <div className="py-1">
                        {searchResults.map(product => (
                          <Link 
                            key={product.id}
                            to={`/product/${product.id}`}
                            onClick={() => { setIsMobileSearchOpen(false); setSearchQuery(''); }}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-bg-hover border-b border-bg-hover last:border-0"
                          >
                            <div className="w-10 h-10 bg-bg-general rounded-lg overflow-hidden shrink-0">
                              <img src={product.image || undefined} alt={product.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-carbon truncate">{product.name}</h4>
                              <p className="text-[10px] text-slate-500">{formatPrice(product.price)}</p>
                            </div>
                          </Link>
                        ))}
                        <Link 
                          to={`/search?q=${encodeURIComponent(searchQuery)}`}
                          onClick={() => { setIsMobileSearchOpen(false); setSearchQuery(''); }}
                          className="block w-full py-2.5 bg-bg-hover text-center text-[10px] font-black text-carbon"
                        >
                          عرض جميع النتائج لـ "{searchQuery}"
                        </Link>
                      </div>
                    ) : (
                      <div className="p-6 text-center">
                        <p className="text-xs font-bold text-carbon">لا توجد نتائج</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
