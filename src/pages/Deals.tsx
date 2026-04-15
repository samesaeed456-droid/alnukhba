import React, { useMemo, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import { Tag, Zap, Flame, ShoppingCart, Heart, Percent, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../context/StoreContext';

// Specialized Deal Card with FOMO elements
const DealCard = React.memo(({ product, index }: { product: any, index: number, key?: React.Key }) => {
  const { addToCart, toggleWishlist, wishlist, formatPrice } = useStore();
  const [isAdded, setIsAdded] = useState(false);
  const isWishlisted = useMemo(() => wishlist.some(item => item.id === product.id), [wishlist, product.id]);
  
  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  }, [product, addToCart]);

  const handleToggleWishlist = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    toggleWishlist(product);
  }, [product, toggleWishlist]);

  // Simulate "claimed" percentage based on product ID for consistent rendering
  const claimedPercentage = useMemo(() => {
    const idStr = String(product.id || '');
    const hash = idStr.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    return 65 + (hash % 30); // Random between 65% and 95%
  }, [product.id]);

  const discountPercentage = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col h-full relative"
    >
      {/* Discount Badge */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 bg-white/95 backdrop-blur-md text-rose-600 border border-rose-100 px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full font-black text-[10px] sm:text-sm flex items-center gap-1 shadow-lg">
        <Percent className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        {discountPercentage}% خصم
      </div>

      {/* Wishlist Button */}
      <button 
        onClick={handleToggleWishlist}
        className={`absolute top-2 left-2 sm:top-4 sm:left-4 z-10 p-1.5 sm:p-2.5 rounded-full backdrop-blur-md border transition-all duration-300 shadow-sm hover:scale-110 ${
          isWishlisted 
            ? 'bg-red-500/20 border-red-500/30 text-red-500' 
            : 'bg-white/90 border-white/20 text-slate-400 hover:bg-red-500/20 hover:text-red-500 hover:border-red-500/30'
        }`}
      >
        <Heart className={`w-4 h-4 sm:w-5 sm:h-5 drop-shadow-sm ${isWishlisted ? 'fill-current' : ''}`} />
      </button>

      {/* Image */}
      <Link to={`/product/${product.id}`} className="relative overflow-hidden bg-slate-50 block h-[180px] sm:h-[280px] w-full">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        {/* Flash Sale Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-carbon/80 to-transparent p-2 sm:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex items-center gap-1 sm:gap-2 text-white text-[10px] sm:text-sm font-bold">
            <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-rose-400 fill-rose-400" />
            عرض خاطف
          </div>
        </div>
      </Link>

      {/* Content */}
      <div className="p-2 sm:p-5 flex flex-col flex-grow">
        <Link to={`/product/${product.id}`} className="flex-grow">
          <h3 className="font-bold text-carbon text-xs sm:text-lg mb-1 sm:mb-2 line-clamp-2 group-hover:text-solar transition-colors">
            {product.name}
          </h3>
          
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <span className="text-sm sm:text-xl font-black text-carbon">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <div className="relative inline-flex items-center justify-center">
                <span className="text-[10px] sm:text-sm text-slate-400 font-medium px-1">
                  {formatPrice(product.originalPrice)}
                </span>
                <span className="absolute w-[110%] h-[1.5px] bg-rose-500/80 -rotate-3 rounded-full"></span>
              </div>
            )}
          </div>
        </Link>

        {/* Progress Bar (FOMO) */}
        <div className="mt-auto pt-2 sm:pt-4 border-t border-slate-100">
          <div className="flex justify-between text-[9px] sm:text-xs font-bold mb-1.5 sm:mb-2">
            <span className="text-slate-500">تم بيع {claimedPercentage}%</span>
            <span className="text-rose-600 flex items-center gap-0.5 sm:gap-1">
              <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-rose-600" />
              ينفد قريباً
            </span>
          </div>
          <div className="h-1 sm:h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: `${claimedPercentage}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-rose-500 to-red-500 rounded-full"
            />
          </div>

          <button 
            onClick={handleAddToCart}
            className={`w-full mt-2 sm:mt-4 py-2 sm:py-3 rounded-lg sm:rounded-xl text-xs sm:text-base font-bold transition-all flex items-center justify-center gap-2 sm:gap-3 active:scale-95 ${
              isAdded 
                ? 'bg-emerald-500 text-white' 
                : 'bg-solar hover:opacity-90 text-white'
            }`}
          >
            {isAdded ? (
              <>
                <Check className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                تمت الإضافة
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                أضف للسلة
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
});

export default function Deals() {
  const { products } = useStore();
  const dealProducts = useMemo(() => {
    return products.filter(p => p.originalPrice && p.originalPrice > p.price);
  }, [products]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Premium Hero Section */}
      <div className="relative bg-carbon overflow-hidden">
        {/* Abstract Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-rose-500/10 blur-[120px]" />
          <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-red-500/10 blur-[120px]" />
          <div className="absolute top-[20%] left-[20%] w-[20%] h-[20%] rounded-full bg-solar/5 blur-[80px]" />
          {/* Dot Pattern Background */}
          <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle, white 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />
        </div>

        <div className="max-w-[1600px] mx-auto px-2 sm:px-6 py-8 sm:py-20 relative z-10">
          <div className="flex flex-col items-center justify-center text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl"
            >
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 sm:mb-6 leading-relaxed">
                تخفيضات <br />
                <span className="inline-block px-1 py-2 text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-red-500">
                  لا تقبل المنافسة
                </span>
              </h1>
              <p className="text-sm sm:text-xl text-white/70 mb-6 sm:mb-8 mx-auto">
                اكتشف أقوى العروض والخصومات على آلاف المنتجات. الكميات محدودة، تسوق الآن قبل نفاد المخزون!
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-2 sm:px-6 pt-12 pb-6">
        {/* Deals Grid */}
        <AnimatePresence mode="popLayout">
          {dealProducts.length > 0 ? (
            <motion.div 
              layout
              className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-8"
            >
              {dealProducts.map((product, index) => (
                <DealCard key={product.id} product={product} index={index} />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Tag className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-black text-carbon mb-2">لا توجد عروض حالياً</h3>
              <p className="text-slate-500">عذراً، لا توجد عروض متاحة في هذا القسم في الوقت الحالي.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
