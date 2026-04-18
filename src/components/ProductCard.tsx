import React, { useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Star, Check, Tag, Zap, Eye, Plus, Bell, Flame, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { Product, NotificationSubscription } from '../types';
import { useStore, useStoreState, useStoreActions, useStoreUI } from '../context/StoreContext';
import { FastLink } from './FastLink';
import { FastImage } from './FastImage';

interface ProductCardInnerProps {
  product: Product;
  className?: string;
  wide?: boolean;
  onWishlistToggle?: (product: Product) => void;
  priority?: boolean;
  isWishlisted: boolean;
  addToCart: any;
  toggleWishlist: any;
  formatPrice: any;
  user: any;
  subscribeToProduct: any;
  setNotifications: any;
  showToast: any;
  subscriptions: NotificationSubscription[];
}

const ProductCardInner = React.memo(function ProductCardInner({ 
  product: p, 
  className = '', 
  wide = false, 
  onWishlistToggle, 
  priority = false,
  isWishlisted,
  addToCart,
  toggleWishlist,
  formatPrice,
  user,
  subscribeToProduct,
  setNotifications,
  showToast,
  subscriptions
}: ProductCardInnerProps) {
  const navigate = useNavigate();
  const [isAdded, setIsAdded] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  
  const isNotified = useMemo(() => subscriptions.some(s => s.productId === p.id && s.type === 'back_in_stock'), [subscriptions, p.id]);

  const handleWishlistToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onWishlistToggle) {
      onWishlistToggle(p);
    } else {
      toggleWishlist(p);
    }
  }, [onWishlistToggle, p, toggleWishlist]);

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (p.inStock === false) {
      if (isNotified || isNotifying) return;
      
      setIsNotifying(true);
      
      // Simulate API call for subscription
      setTimeout(() => {
        setIsNotifying(false);
        subscribeToProduct(p.id, 'back_in_stock', user?.phone || 'guest');
        showToast('تم تفعيل التنبيه بنجاح!', 'success');
        
        // Simulate notification arriving after 3 seconds
        setTimeout(() => {
          const newNotification = {
            id: Date.now().toString(),
            title: 'خبر سار! المنتج متوفر الآن',
            message: `المنتج ${p.name} عاد للمخزون مجدداً، سارع بالحصول عليه قبل نفاد الكمية.`,
            date: new Date().toISOString(),
            isRead: false,
            productId: p.id,
            type: 'stock' as const
          };
          setNotifications((prev: any) => [newNotification, ...prev]);
          showToast('وصلك إشعار جديد في صفحة الإشعارات!', 'success');
        }, 3000);
      }, 800);
      return;
    }
    
    addToCart(p);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  }, [p, isNotified, isNotifying, subscribeToProduct, user?.phone, showToast, setNotifications, addToCart]);

  return (
    <>
      <div 
        className={`bg-bg-card border border-solar/30 rounded-[24px] sm:rounded-[32px] p-2 sm:p-2.5 transition-all duration-500 flex flex-col group relative shadow-2xl hover:shadow-solar/10 hover:border-solar hover:-translate-y-1 overflow-hidden ${className}`}
      >
        {/* Image Container */}
        <div className={`relative overflow-hidden mb-2 sm:mb-2.5 -mx-2 sm:-mx-2.5 -mt-2 sm:-mt-2.5 rounded-t-[20px] sm:rounded-t-[30px] bg-bg-general ${wide ? 'h-[180px] sm:h-[280px]' : 'aspect-square'}`}>
          {/* Badges - Unified Ultra Premium Glass Style */}
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 flex flex-col gap-1.5 sm:gap-2 pointer-events-none items-end">
            {p.isNew && (
              <div 
                className="bg-carbon/90 backdrop-blur-md text-white px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-black tracking-tight sm:tracking-normal uppercase shadow-lg border border-solar/20 flex items-center gap-1 sm:gap-1.5"
              >
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-black rounded-full" />
                <span className="hidden sm:inline">وصل حديثاً</span>
                <span className="sm:hidden">جديد</span>
              </div>
            )}
            {p.originalPrice && (
              <div className="bg-bg-card/90 backdrop-blur-md text-solar px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-black tracking-tight sm:tracking-normal shadow-lg border border-bg-hover flex items-center gap-1 sm:gap-1.5">
                <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">وفر {Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%</span>
                <span className="sm:hidden">-{Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100)}%</span>
              </div>
            )}
          </div>

          {/* Wishlist Button (Glassmorphism - Smaller & Refined) */}
          <button 
            onClick={handleWishlistToggle}
            className={`absolute top-2 left-2 sm:top-3 sm:left-3 z-10 p-1.5 sm:p-2 rounded-full backdrop-blur-md border transition-all duration-300 shadow-lg hover:scale-110 ${
              isWishlisted 
                ? 'bg-red-500/20 border-red-500/30 text-red-500' 
                : 'bg-black/20 border-white/10 text-white hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/30'
            }`}
            title="إضافة للمفضلة"
          >
            <Heart className={`w-3.5 h-3.5 sm:w-4 sm:h-4 drop-shadow-sm ${isWishlisted ? 'fill-current' : ''}`} />
          </button>

          <FastLink to={`/product/${p.id}`} prefetchPage="ProductDetail" className="w-full h-full block">
            <FastImage 
              src={p.image || undefined} 
              alt={p.name} 
              priority={priority}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" 
            />
            {/* Quick View Overlay - Professional Touch */}
            <div className="absolute inset-0 bg-carbon/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2 backdrop-blur-[2px]">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 bg-carbon/80 backdrop-blur-md rounded-full flex items-center justify-center text-solar shadow-xl hover:bg-solar hover:text-white transition-colors border border-solar/30"
                title="عرض سريع"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigate(`/product/${p.id}`);
                }}
              >
                <Eye className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 bg-carbon/80 backdrop-blur-md rounded-full flex items-center justify-center text-solar shadow-xl hover:bg-solar hover:text-white transition-colors border border-solar/30"
                title="إضافة للسلة"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  addToCart(p);
                }}
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            </div>
          </FastLink>
        </div>
        
        {/* Content */}
        <div className="flex flex-col flex-1 px-1 sm:px-2">
          <FastLink to={`/product/${p.id}`} prefetchPage="ProductDetail" className="flex flex-col flex-1 items-center text-center">
            <h3 className="font-bold text-carbon text-sm sm:text-base mb-1 line-clamp-2 hover:text-solar transition-colors leading-tight min-h-[40px] sm:min-h-[48px]">{p.name}</h3>
            
            {/* Rating */}
            <div className="flex items-center gap-1 mb-1.5">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${star <= (p.rating || 5) ? 'fill-solar text-solar' : 'fill-bg-hover text-bg-hover'}`} 
                  />
                ))}
              </div>
              <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium">({p.reviews || 0})</span>
            </div>

            <div className="flex flex-col items-center mb-0.5 sm:mb-1 mt-auto">
              <div className="flex items-baseline gap-1">
                <span className="font-black text-base sm:text-lg text-slate-900 leading-none">
                  {formatPrice(p.price).split(' ')[0]}
                </span>
                <span className="font-bold text-[10px] sm:text-xs text-solar leading-none">
                  {formatPrice(p.price).split(' ').slice(1).join(' ')}
                </span>
              </div>
              {p.originalPrice && (
                <div className="relative inline-flex items-center justify-center mt-1 sm:mt-1.5">
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium px-1 leading-none line-through">
                    {formatPrice(p.originalPrice)}
                  </span>
                </div>
              )}
            </div>

            {/* Urgency Indicators */}
            {p.inStock !== false ? (
              <div className="flex flex-col items-center gap-1 mb-2 sm:mb-3">
                <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-solar bg-solar/10 px-2 py-0.5 rounded-full border border-solar/20">
                  <Zap className="w-2.5 h-2.5 fill-current" />
                  <span>بقي {(p.id.length * 7 % 8) + 2} قطع فقط</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1 mb-2 sm:mb-3">
                <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                  <Users className="w-2.5 h-2.5 fill-current" />
                  <span>{(p.id.length * 5 % 20) + 10} شخص ينتظرون توفره</span>
                </div>
                <div className="flex items-center gap-1 text-[8px] sm:text-[9px] font-medium text-slate-500">
                  <Flame className="w-2.5 h-2.5 text-orange-500" />
                  <span>نفدت الكمية لارتفاع الطلب</span>
                </div>
              </div>
            )}
          </FastLink>
          
          {/* Action Row - Full Width Add to Cart */}
          <div className="mt-auto pb-1">
            <motion.button 
              whileTap={{ scale: 0.95 }}
              animate={
                isAdded || isNotified 
                  ? { scale: [1, 1.05, 0.95, 1.05, 1], transition: { duration: 0.4 } } 
                  : {}
              }
              onClick={handleAddToCart} 
              className={`w-full py-2 sm:py-2.5 rounded-xl sm:rounded-2xl font-bold text-[11px] sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 transition-all shadow-lg group/btn overflow-hidden relative ${
                p.inStock === false
                  ? isNotified
                    ? 'bg-solar text-black shadow-solar/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  : isAdded 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-gold-gradient hover:shadow-gold shadow-gold/20'
              }`}
              title={p.inStock === false ? (isNotified ? "تم تفعيل التنبيه" : "أعلمني عند التوفر") : "أضف للسلة"}
            >
              <span className="relative z-10 flex items-center gap-1.5 sm:gap-2">
                {p.inStock === false ? (
                  isNotifying ? (
                    <>
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                      <span>جاري التفعيل...</span>
                    </>
                  ) : isNotified ? (
                    <>
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>تم تفعيل التنبيه</span>
                    </>
                  ) : (
                    <>
                      <span>أعلمني عند التوفر</span>
                      <motion.div
                        animate={{ rotate: [0, -15, 15, -15, 15, 0] }}
                        transition={{ repeat: Infinity, duration: 1.5, repeatDelay: 3 }}
                      >
                        <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </motion.div>
                    </>
                  )
                ) : isAdded ? (
                  <>
                    <span>تمت الإضافة</span>
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                ) : (
                  <>
                    <span className="hidden sm:inline">أضف للسلة</span>
                    <span className="sm:hidden">أضف للسلة</span>
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover/btn:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </motion.button>
          </div>
        </div>
      </div>
    </>
  );
});

interface ProductCardProps {
  product: Product;
  className?: string;
  wide?: boolean;
  onWishlistToggle?: (product: Product) => void;
  priority?: boolean;
}

const ProductCard = React.memo(function ProductCard(props: ProductCardProps) {
  const { wishlist, user, subscriptions } = useStoreState();
  const { addToCart, toggleWishlist, isInWishlist, formatPrice, subscribeToProduct, setNotifications } = useStoreActions();
  const { showToast } = useStoreUI();
  const isWishlisted = isInWishlist(props.product.id);

  return (
    <ProductCardInner 
      {...props} 
      isWishlisted={isWishlisted}
      addToCart={addToCart}
      toggleWishlist={toggleWishlist}
      formatPrice={formatPrice}
      user={user}
      subscribeToProduct={subscribeToProduct}
      setNotifications={setNotifications}
      showToast={showToast}
      subscriptions={subscriptions}
    />
  );
});

export default ProductCard;
