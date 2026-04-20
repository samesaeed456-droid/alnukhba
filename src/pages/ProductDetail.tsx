import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingCart, Star, ArrowRight, Check, Plus, Minus, Heart, Share2, 
  ShieldCheck, Truck, RefreshCcw, CreditCard, ZoomIn, X, 
  ShieldAlert, Award, Zap, Package, ThumbsUp, Bell, Flame, Users,
  ChevronDown, ChevronUp, Sparkles, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore, useStoreState, useStoreActions, useStoreUI } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import RecommendedProducts from '../components/RecommendedProducts';
import ProductSlider from '../components/ProductSlider';
import ProductGallery from '../components/ProductGallery';
import { FastLink } from '../components/FastLink';
import { FastImage } from '../components/FastImage';
import { copyToClipboard } from '../lib/clipboard';

const PREDEFINED_COLORS = [
  { name: 'أسود', value: '#000000' },
  { name: 'أبيض', value: '#FFFFFF' },
  { name: 'فضي', value: '#C0C0C0' },
  { name: 'رمادي', value: '#808080' },
  { name: 'أحمر', value: '#EF4444' },
  { name: 'أزرق', value: '#3B82F6' },
  { name: 'كحلي', value: '#1E3A8A' },
  { name: 'أخضر', value: '#10B981' },
  { name: 'أصفر', value: '#EAB308' },
  { name: 'ذهبي', value: '#D4AF37' },
  { name: 'وردي', value: '#EC4899' },
  { name: 'بنفسجي', value: '#8B5CF6' },
  { name: 'برتقالي', value: '#F97316' },
  { name: 'بني', value: '#92400E' },
];

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, user, recentlyViewed, subscriptions } = useStoreState();
  const { addToCart, toggleWishlist, isInWishlist, formatPrice, addToRecentlyViewed, subscribeToProduct, setNotifications } = useStoreActions();
  const { showToast } = useStoreUI();
  const product = products.find(p => String(p.id) === String(id));

  useEffect(() => {
    if (product) {
      addToRecentlyViewed(product);
      window.scrollTo(0, 0);
    }
  }, [product, addToRecentlyViewed]);

  const [isNotifying, setIsNotifying] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | undefined>(product?.colors?.[0]);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(product?.sizes?.[0]);
  const [isAdded, setIsAdded] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isSpecsExpanded, setIsSpecsExpanded] = useState(false);

  const isNotified = product ? subscriptions.some(s => s.productId === product.id && s.type === 'back_in_stock') : false;

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (product) {
      if (product.inStock === false) {
        if (isNotified || isNotifying) return;
        
        setIsNotifying(true);
        
        // Simulate API call for subscription
        setTimeout(() => {
          setIsNotifying(false);
          subscribeToProduct(product.id, 'back_in_stock', user?.phone || 'guest');
          showToast('تم تفعيل التنبيه بنجاح! سنعلمك فور توفر المنتج.', 'success');
        }, 800);
        return;
      }
      
      addToCart(product, quantity, selectedColor, selectedSize);
      setIsAdded(true);
      setTimeout(() => {
        setIsAdded(false);
      }, 1500);
    }
  }, [product, isNotified, isNotifying, subscribeToProduct, user?.phone, showToast, setNotifications, addToCart, quantity, selectedColor, selectedSize]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: product?.description,
          url: window.location.href,
        });
      } catch (err) {
        // Fallback to clipboard if sharing fails or is cancelled
        const success = await copyToClipboard(window.location.href);
        if (success) showToast('تم نسخ الرابط!');
      }
    } else {
      const success = await copyToClipboard(window.location.href);
      if (success) showToast('تم نسخ الرابط!');
    }
  }, [product?.name, product?.description, showToast]);

  const allImages = useMemo(() => (product ? [product.image, ...(product.images || [])] : []), [product]);

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-bold text-carbon mb-4">المنتج غير موجود</h2>
        <FastLink to="/" className="text-solar hover:underline flex items-center gap-2">
          <ArrowRight className="w-4 h-4" />
          العودة للرئيسية
        </FastLink>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4 sm:py-8 pb-28 sm:pb-12"
    >
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between mb-6 gap-2 sm:gap-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <button 
            onClick={() => {
              if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                navigate('/', { replace: true });
              }
            }}
            className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-carbon hover:bg-slate-50 active:scale-90 transition-all shadow-sm"
            aria-label="عودة"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="hidden sm:flex items-center gap-2 text-[10px] sm:text-xs font-bold text-titanium/60 overflow-x-auto hide-scrollbar whitespace-nowrap">
            <FastLink to="/" className="hover:text-solar transition-colors">الرئيسية</FastLink>
            <span className="text-titanium/30">/</span>
            <span className="hover:text-solar transition-colors cursor-pointer">{product.category}</span>
            <span className="text-titanium/30">/</span>
            <span className="text-carbon truncate max-w-[150px] sm:max-w-[300px]">{product.name}</span>
          </div>
          <div className="sm:hidden font-black text-carbon text-sm truncate max-w-[180px]">
            {product.name}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={handleShare}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-carbon/40 hover:text-carbon transition-all"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button 
            onClick={() => toggleWishlist(product)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all ${
              isInWishlist(product.id) 
                ? 'bg-red-50 border-red-100 text-red-500' 
                : 'bg-white border-slate-100 text-carbon/40 hover:text-red-500'
            }`}
          >
            <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-white sm:rounded-[40px] shadow-[0_30px_70px_rgba(0,0,0,0.03)] border border-slate-100 overflow-hidden">
        <div className="flex flex-col lg:flex-row">
          {/* Image Gallery */}
          <div className="w-full lg:w-[55%] bg-gradient-to-b from-slate-50 to-slate-100/50 relative overflow-hidden flex flex-col">
            {/* Mobile Gallery */}
            <div className="sm:hidden">
              <ProductGallery 
                images={allImages} 
                onZoom={(idx) => {
                  setActiveImage(idx);
                  setShowLightbox(true);
                }}
              />
            </div>

            {/* Desktop Gallery */}
            <div className="hidden sm:flex flex-col flex-1">
              <div className="relative flex-1 aspect-square flex items-center justify-center p-8 sm:p-16">
                <AnimatePresence mode="wait">
                    <motion.div
                      key={activeImage}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0,
                        scale: isZoomed ? 1.5 : 1,
                        cursor: isZoomed ? 'zoom-out' : 'zoom-in'
                      }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      onClick={() => setIsZoomed(!isZoomed)}
                      className="w-full h-full relative group flex items-center justify-center"
                    >
                      {/* Studio lighting effect */}
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#ffffff_0%,transparent_70%)] opacity-60 pointer-events-none" />
                      
                      <FastImage 
                        src={allImages[activeImage] || undefined} 
                        alt={product.name} 
                        priority={true}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 drop-shadow-[0_30px_60px_rgba(0,0,0,0.15)] relative z-10"
                      />
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowLightbox(true);
                        }}
                        className="absolute bottom-0 right-0 w-12 h-12 rounded-full bg-white/90 backdrop-blur-md shadow-xl flex items-center justify-center text-carbon opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-20"
                      >
                        <ZoomIn className="w-6 h-6" />
                      </button>
                    </motion.div>
                </AnimatePresence>
                
                {/* Floating Status Badges */}
                <div className="absolute top-8 right-8 z-10 flex flex-col gap-3">
                  {product.isNew && (
                    <motion.div 
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="bg-carbon text-white px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl border border-white/10"
                    >
                      وصول جديد
                    </motion.div>
                  )}
                  {product.originalPrice && (
                    <motion.div 
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="bg-rose-500 text-white px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl border border-white/10"
                    >
                      وفر {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                    </motion.div>
                  )}
                </div>
              </div>
              
              {/* Thumbnails - Desktop Premium */}
              <div className="flex gap-4 p-8 pt-0 overflow-x-auto hide-scrollbar justify-center relative z-20">
                {allImages.map((img, idx) => (
                  <motion.button 
                    key={idx}
                    whileHover={{ y: -2 }}
                    onClick={() => setActiveImage(idx)}
                    className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 transition-all p-2 bg-white ${
                      activeImage === idx 
                        ? 'ring-2 ring-carbon shadow-lg scale-105 z-10' 
                        : 'ring-1 ring-slate-200/50 hover:ring-slate-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <FastImage src={img || undefined} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="w-full lg:w-[45%] p-6 sm:p-10 lg:border-r border-slate-100 flex flex-col bg-white">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[9px] font-black uppercase tracking-widest text-solar bg-solar/5 border border-solar/10 px-3 py-1 rounded-full">
                  {product.category}
                </span>
                <div className="flex items-center gap-1 ml-auto bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
                  <Star className="w-3 h-3 fill-rating text-rating" />
                  <span className="font-black text-carbon text-[10px]">{product.rating}</span>
                </div>
              </div>

              <h1 className="text-xl sm:text-2xl font-bold text-carbon mb-3 leading-snug">
                {product.name}
              </h1>
              
              <div className="flex flex-col mb-6">
                <div className="flex items-center gap-3 mb-1">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-4xl font-black text-slate-900">
                      {formatPrice(product.price).split(' ')[0]}
                    </span>
                    <span className="text-lg sm:text-xl font-bold text-slate-900/70">
                      {formatPrice(product.price).split(' ').slice(1).join(' ')}
                    </span>
                  </div>
                  {product.originalPrice && (
                    <div className="flex flex-col gap-1.5">
                      <div className="relative inline-flex items-center justify-center self-start">
                        <span className="text-base sm:text-lg text-slate-400 font-medium px-1">
                          {formatPrice(product.originalPrice)}
                        </span>
                        <span className="absolute w-[110%] h-[2px] bg-rose-500/80 -rotate-3 rounded-full"></span>
                      </div>
                      <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100/50 text-center self-start">
                        خصم {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery & Seller Info removed as requested */}

              {/* Social Proof & Stock Status - Minimalist */}
              <div className="flex flex-col gap-3 mb-8">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    الأكثر مبيعاً
                  </span>
                </div>
                
                {product.inStock !== false ? (
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold">
                    <div className="flex items-center gap-2 text-rose-500">
                      <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                      بقي {product.stockCount || 9} قطع فقط في المخزن
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-bold">
                    <div className="flex items-center gap-2 text-rose-500">
                      <Users className="w-4 h-4" />
                      أكثر من {(product.id.length * 5 % 20) + 10} شخص ينتظرون توفره
                    </div>
                    <div className="flex items-center gap-2 text-orange-500">
                      <Flame className="w-4 h-4 fill-orange-500" />
                      نفدت الكمية بسبب الطلب العالي
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-8">
                <p className={`text-titanium/60 leading-relaxed text-sm font-medium ${!isDescExpanded ? 'line-clamp-2 sm:line-clamp-none' : ''}`}>
                  {product.description}
                </p>
                {product.description && product.description.length > 100 && (
                  <button 
                    onClick={() => setIsDescExpanded(!isDescExpanded)} 
                    className="sm:hidden text-solar text-xs font-bold mt-2 hover:underline"
                  >
                    {isDescExpanded ? 'عرض أقل' : 'قراءة المزيد...'}
                  </button>
                )}
              </div>

            </div>

            {/* Selection Controls */}
            <div className="space-y-6 mb-8">
              {product.colors && product.colors.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-3 bg-solar rounded-full" />
                      <h3 className="text-[10px] font-black text-carbon uppercase tracking-widest">اللون المختار</h3>
                    </div>
                    <span className="text-[11px] font-black text-solar bg-solar/10 px-2 py-0.5 rounded-md">{selectedColor}</span>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {product.colors.map((color, index) => {
                      if (!color || typeof color !== 'string') return null;
                      
                      const knownColor = PREDEFINED_COLORS.find(c => c.name === color || c.value === color);
                      const bgColor = knownColor ? knownColor.value : (color.startsWith('#') ? color : '#E2E8F0');
                      const isLight = ['#FFFFFF', 'WHITE', '#EAB308', '#C0C0C0'].includes(bgColor.toUpperCase());
                      
                      return (
                        <button
                          key={`${color}-${index}`}
                          title={color}
                          onClick={() => setSelectedColor(color)}
                          className={`group relative w-9 h-9 sm:w-11 sm:h-11 rounded-full transition-all duration-300 ${selectedColor === color ? 'ring-offset-2 ring-2 ring-carbon scale-110' : 'hover:scale-110'}`}
                        >
                          <div 
                            className="absolute inset-0 rounded-full border border-black/5 shadow-inner" 
                            style={{ backgroundColor: bgColor }} 
                          />
                          {selectedColor === color && (
                            <motion.div layoutId="colorCheck" className="absolute inset-0 flex items-center justify-center">
                              <Check className={`w-4 h-4 ${isLight ? 'text-carbon' : 'text-white'}`} />
                            </motion.div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {product.sizes && product.sizes.length > 0 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-3 bg-solar rounded-full" />
                      <h3 className="text-[10px] font-black text-carbon uppercase tracking-widest">الأحجام المتوفرة</h3>
                    </div>
                    {selectedSize && (
                      <span className="text-[11px] font-black text-carbon/60">{selectedSize}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {product.sizes.map((size, index) => {
                      if (!size || typeof size !== 'string') return null;
                      return (
                        <button
                          key={`${size}-${index}`}
                          onClick={() => setSelectedSize(size)}
                          className={`min-w-[60px] sm:min-w-[70px] h-10 sm:h-12 rounded-xl border-2 font-black text-xs transition-all duration-300 ${
                            selectedSize === size 
                              ? 'border-carbon bg-carbon text-white shadow-lg scale-105' 
                              : 'border-slate-100 text-titanium/60 hover:border-slate-300 bg-slate-50/30'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Unified Quantity Selector */}
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-3 bg-solar rounded-full" />
                    <h3 className="text-[10px] font-black text-carbon uppercase tracking-widest">الكمية المطلوبة</h3>
                  </div>
                </div>
                <div className="flex items-center bg-slate-50 rounded-2xl p-1.5 border border-slate-100 w-40 h-14 shadow-sm">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-12 h-full flex items-center justify-center text-carbon hover:bg-white rounded-xl transition-all hover:shadow-sm active:scale-95"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="flex-1 text-center font-black text-lg">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(product.stockCount || 99, quantity + 1))}
                    className="w-12 h-full flex items-center justify-center text-carbon hover:bg-white rounded-xl transition-all hover:shadow-sm active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Desktop Total Price & Purchase Actions */}
              <div className="hidden sm:flex flex-col gap-6 pt-6 border-t border-slate-100">
                <div className="flex items-end justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-carbon/40 uppercase tracking-widest mb-1">إجمالي المبلغ</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-slate-900">{formatPrice(product.price * quantity)}</span>
                    </div>
                  </div>
                  {product.inStock !== false ? (
                    <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-wider">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      متوفر في المخزن
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200 uppercase tracking-wider">
                      غير متوفر حالياً
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {product.inStock !== false ? (
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddToCart}
                      className={`w-full h-14 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                        isAdded 
                          ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                          : 'bg-carbon hover:bg-black text-white shadow-carbon/20'
                      }`}
                    >
                      {isAdded ? (
                        <><Check className="w-5 h-5" /> تم الإضافة للسلة</>
                      ) : (
                        <><ShoppingCart className="w-5 h-5" /> أضف إلى السلة</>
                      )}
                    </motion.button>
                  ) : (
                    <motion.button 
                      whileHover={!isNotified && !isNotifying ? { scale: 1.02 } : {}}
                      whileTap={!isNotified && !isNotifying ? { scale: 0.98 } : {}}
                      animate={isNotified ? { scale: [1, 1.05, 0.95, 1.05, 1], transition: { duration: 0.4 } } : {}}
                      onClick={handleAddToCart}
                      className={`w-full h-14 rounded-2xl font-black text-sm flex items-center justify-center gap-2 border transition-all ${
                        isNotified
                          ? 'bg-solar text-black border-solar shadow-lg shadow-solar/20'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                      }`}
                    >
                      {isNotifying ? (
                        <>
                          <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                          جاري التفعيل...
                        </>
                      ) : isNotified ? (
                        <>
                          <Check className="w-5 h-5" /> تم تفعيل التنبيه
                        </>
                      ) : (
                        <>
                          <motion.div
                            animate={{ rotate: [0, -15, 15, -15, 15, 0] }}
                            transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 3 }}
                          >
                            <Bell className="w-5 h-5" />
                          </motion.div>
                          أعلمني عند التوفر
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Key Features List (Horizontal on mobile) */}
              <div className="flex overflow-x-auto hide-scrollbar gap-3 pt-6 border-t border-slate-100 pb-2">
                <div className="flex-shrink-0 flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-black text-carbon/70 uppercase tracking-wider">منتج أصلي 100%</span>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-black text-carbon/70 uppercase tracking-wider">توصيل سريع</span>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-500">
                    <Check className="w-3 h-3" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-black text-carbon/70 uppercase tracking-wider">إرجاع مرن</span>
                </div>
              </div>
            </div>

            {/* Desktop Purchase Actions removed from here as they are moved above */}
          </div>
        </div>
      </div>

      {/* Simple Professional Specifications Table (Accordion on Mobile) */}
      <div className="mt-8 mb-8 max-w-5xl">
        <div className="bg-white sm:rounded-[32px] border-y sm:border border-slate-100 shadow-sm overflow-hidden">
          <button 
            onClick={() => setIsSpecsExpanded(!isSpecsExpanded)}
            className="w-full flex items-center justify-between p-4 sm:p-6 bg-slate-50/50 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-solar rounded-full" />
              <h3 className="text-lg sm:text-xl font-black text-carbon uppercase tracking-tight">المواصفات التقنية</h3>
            </div>
            <div className="sm:hidden">
              {isSpecsExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>
          </button>
          
          <AnimatePresence initial={false}>
            {(isSpecsExpanded || window.innerWidth >= 640) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden sm:!h-auto sm:!opacity-100"
              >
                <div className="divide-y divide-slate-50 border-t border-slate-100">
                  {Object.entries(product.specs || {}).map(([key, value], idx) => (
                    <div key={idx} className="grid grid-cols-2 p-4 sm:p-6 hover:bg-slate-50/50 transition-colors">
                      <span className="text-[10px] font-black text-titanium uppercase tracking-widest flex items-center">{key}</span>
                      <span className="text-sm font-black text-carbon text-left" dir="ltr">{value}</span>
                    </div>
                  ))}
                  {(!product.specs || Object.keys(product.specs).length === 0) && (
                    <div className="p-8 text-center">
                      <p className="text-carbon/40 text-sm font-medium">لا توجد مواصفات تقنية محددة لهذا المنتج حالياً.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Related Products - Using Home Page Slider Style */}
      <div className="mt-16 mb-24 space-y-12">
        {/* Similar Products */}
        {products.filter(p => p.category === product.category && p.id !== product.id).length > 0 && (
          <ProductSlider 
            title="منتجات مشابهة" 
            products={products.filter(p => p.category === product.category && p.id !== product.id)} 
            viewAllLink={`/category/${product.category}`}
          />
        )}

        {/* Recently Viewed */}
        {recentlyViewed.length > 1 && (
          <div className="border-t border-slate-100 pt-12">
            <ProductSlider 
              title="شاهدتها مؤخراً" 
              products={recentlyViewed.filter(p => p.id !== product.id)} 
            />
          </div>
        )}
      </div>

      {/* Lightbox / Full Screen Gallery */}
      <AnimatePresence>
        {showLightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-carbon/95 backdrop-blur-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-6">
              <span className="text-white/40 font-black text-xs uppercase tracking-[0.3em]">
                {activeImage + 1} / {allImages.length}
              </span>
              <button 
                onClick={() => setShowLightbox(false)}
                className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 flex items-center justify-center p-4 sm:p-12 relative">
              <motion.div
                key={activeImage}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                className="relative max-w-full max-h-full rounded-[40px] overflow-hidden shadow-2xl"
              >
                      <img
                        src={allImages[activeImage] || undefined}
                        alt={product.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover bg-white"
                      />
              </motion.div>
              
              {/* Navigation Arrows */}
              <button 
                onClick={() => setActiveImage((activeImage - 1 + allImages.length) % allImages.length)}
                className="absolute left-4 sm:left-8 w-14 h-14 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-white/10 transition-all border border-white/10"
              >
                <ArrowRight className="w-6 h-6 rotate-180" />
              </button>
              <button 
                onClick={() => setActiveImage((activeImage + 1) % allImages.length)}
                className="absolute right-4 sm:right-8 w-14 h-14 rounded-full bg-white/5 text-white flex items-center justify-center hover:bg-white/10 transition-all border border-white/10"
              >
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 flex justify-center gap-4 overflow-x-auto">
              {allImages.map((img, idx) => (
                <button 
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all bg-white/5 ${activeImage === idx ? 'border-solar scale-110' : 'border-transparent opacity-40'}`}
                >
                  <img src={img || undefined} alt="" className="w-full h-full object-cover p-1" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Fixed Bottom Action Bar (Floating & Compact) */}
      <div className="fixed bottom-4 left-4 right-4 z-50 sm:hidden pb-safe pointer-events-none">
        <div className="pointer-events-auto">
          {product.inStock !== false ? (
            <button 
              onClick={handleAddToCart}
              className={`w-full h-[52px] rounded-2xl font-bold text-sm transition-all flex items-center justify-between px-5 shadow-2xl backdrop-blur-md ${
                isAdded 
                  ? 'bg-emerald-500 text-white shadow-emerald-500/30' 
                  : 'bg-carbon/95 text-white shadow-carbon/30 hover:bg-black'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isAdded ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
                <span className="text-[13px]">{isAdded ? 'تمت الإضافة للسلة' : 'أضف إلى السلة'}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-px h-5 bg-white/20" />
                <span className="font-black tracking-wide text-sm">{formatPrice(product.price * quantity)}</span>
              </div>
            </button>
          ) : (
            <motion.button 
              whileTap={!isNotified && !isNotifying ? { scale: 0.95 } : {}}
              animate={isNotified ? { scale: [1, 1.05, 0.95, 1.05, 1], transition: { duration: 0.4 } } : {}}
              onClick={handleAddToCart}
              className={`w-full h-[52px] rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-2xl backdrop-blur-md ${
                isNotified
                  ? 'bg-solar text-black shadow-solar/30'
                  : 'bg-white/95 text-slate-600 border border-slate-200/50'
              }`}
            >
              {isNotifying ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                  جاري التفعيل...
                </>
              ) : isNotified ? (
                <>
                  <Check className="w-5 h-5" /> تم تفعيل التنبيه
                </>
              ) : (
                <>
                  <motion.div
                    animate={{ rotate: [0, -15, 15, -15, 15, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 3 }}
                  >
                    <Bell className="w-5 h-5" />
                  </motion.div>
                  أعلمني عند التوفر
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
