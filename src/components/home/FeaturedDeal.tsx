import React, { useState, useEffect, useRef } from 'react';
import { Flame, Users, ShoppingCart, ChevronRight, ChevronLeft, Truck, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FastLink } from '../FastLink';
import { FastImage } from '../FastImage';
import ProductCard from '../ProductCard';

const CountdownTimer = React.memo(({ variant = 'default' }: { variant?: 'default' | 'premium' }) => {
  const [timeLeft, setTimeLeft] = useState({ hours: 12, minutes: 45, seconds: 30 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (variant === 'premium') {
    return (
      <div className="flex items-center gap-2 sm:gap-3 font-mono" dir="ltr">
        <div className="flex flex-col items-center">
          <span className="bg-carbon text-white w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl font-black shadow-lg border border-white/10">
            {timeLeft.hours.toString().padStart(2, '0')}
          </span>
          <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">ساعة</span>
        </div>
        <span className="text-solar font-black text-xl mb-5">:</span>
        <div className="flex flex-col items-center">
          <span className="bg-carbon text-white w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl font-black shadow-lg border border-white/10">
            {timeLeft.minutes.toString().padStart(2, '0')}
          </span>
          <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">دقيقة</span>
        </div>
        <span className="text-solar font-black text-xl mb-5">:</span>
        <div className="flex flex-col items-center">
          <span className="bg-solar text-black w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl font-black shadow-lg shadow-solar/20 border border-white/10">
            {timeLeft.seconds.toString().padStart(2, '0')}
          </span>
          <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">ثانية</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 font-mono font-bold text-sm sm:text-base" dir="ltr">
      <span className="bg-carbon text-white px-2.5 py-1 rounded-lg min-w-[36px] text-center">{timeLeft.hours.toString().padStart(2, '0')}</span>
      <span className="text-slate-500">:</span>
      <span className="bg-carbon text-white px-2.5 py-1 rounded-lg min-w-[36px] text-center">{timeLeft.minutes.toString().padStart(2, '0')}</span>
      <span className="text-slate-500">:</span>
      <span className="bg-solar text-black px-2.5 py-1 rounded-lg min-w-[36px] text-center">{timeLeft.seconds.toString().padStart(2, '0')}</span>
    </div>
  );
});

interface FeaturedDealProps {
  deals: any[];
  formatPrice: (price: number) => string;
}

const FeaturedDeal = React.memo(({ deals, formatPrice }: FeaturedDealProps) => {
  const dealsScrollRef = useRef<HTMLDivElement>(null);
  const [activeDealDot, setActiveDealDot] = useState(0);

  const handleDealsScroll = () => {
    if (dealsScrollRef.current) {
      const { scrollLeft } = dealsScrollRef.current;
      const index = Math.round(Math.abs(scrollLeft) / 157);
      setActiveDealDot(index);
    }
  };

  if (!deals || deals.length === 0) return null;

  return (
    <div className="px-2 sm:px-6 lg:px-8 mb-4 sm:mb-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-black text-carbon flex items-center gap-2 sm:gap-3">
          <Flame className="w-6 h-6 sm:w-8 sm:h-8 text-solar animate-pulse" />
          أقوى العروض
        </h2>
        <FastLink to="/deals" prefetchPage="Search" className="text-sm sm:text-base font-bold text-carbon hover:underline flex items-center gap-1 group">
          عرض الكل
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:-translate-x-1 transition-transform" />
        </FastLink>
      </div>
      
      {/* Mobile Layout */}
      <div className="flex flex-col gap-4 lg:hidden">
        <motion.div whileHover={{ scale: 1.01 }} className="relative bg-bg-card border border-solar/30 rounded-[32px] overflow-hidden shadow-2xl group">
          <FastLink to={`/product/${deals[0].id}`} className="block">
            <div className="relative h-[280px] bg-bg-general overflow-hidden">
              <FastImage src={deals[0].image || undefined} alt={deals[0].name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                <motion.span animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }} className="bg-gold-gradient text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg flex items-center gap-1">
                  <Flame className="w-3 h-3 animate-pulse" />
                  عرض بطل
                </motion.span>
              </div>
              <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-md text-carbon px-2 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1 border border-slate-200 shadow-sm">
                <Users className="w-3 h-3 text-solar" />
                اشترى منه 12 شخصاً اليوم
              </div>
              <div className="absolute bottom-3 left-3 right-3 p-3 bg-white/5 backdrop-blur-md flex justify-between items-center rounded-2xl border border-white/10 shadow-xl">
                <div className="flex flex-col">
                  <span className="text-[8px] text-white/90 font-black uppercase tracking-wider">ينتهي العرض خلال:</span>
                  <div className="scale-95 origin-right">
                    <CountdownTimer />
                  </div>
                </div>
                <div className="bg-solar text-black px-3 py-1.5 rounded-xl font-black text-xs shadow-lg animate-bounce">
                  خصم {Math.round(((deals[0].originalPrice! - deals[0].price) / deals[0].originalPrice!) * 100)}%
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-black text-carbon text-lg mb-2 line-clamp-1">{deals[0].name}</h3>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] font-bold text-slate-500">تم بيع 85% من الكمية</span>
                  <span className="text-[10px] font-black text-solar">بقي 3 قطع فقط!</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: '85%' }} transition={{ duration: 1.5, delay: 0.5 }} className="h-full bg-solar rounded-full shadow-[0_0_10px_rgba(242,125,38,0.5)]" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <span className="font-black text-2xl text-slate-900">
                    {formatPrice(deals[0].price).split(' ')[0]}
                    <span className="text-sm font-bold text-solar mr-1">{formatPrice(deals[0].price).split(' ').slice(1).join(' ')}</span>
                  </span>
                  {deals[0].originalPrice && <span className="text-sm text-slate-400 line-through font-medium">{formatPrice(deals[0].originalPrice)}</span>}
                </div>
                <div className="bg-gold-gradient p-3 rounded-2xl shadow-gold text-black">
                  <ShoppingCart className="w-6 h-6" />
                </div>
              </div>
            </div>
          </FastLink>
        </motion.div>

        <div className="relative group/scroll">
          <AnimatePresence>
            {activeDealDot === 0 && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-bg-general to-transparent pointer-events-none z-10 lg:hidden flex items-center justify-end pr-4">
                <motion.div animate={{ x: [0, -10, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="bg-solar/90 backdrop-blur-md text-black p-2 rounded-full shadow-lg border border-white/20">
                  <ChevronRight className="w-5 h-5" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={dealsScrollRef} onScroll={handleDealsScroll} className="flex overflow-x-auto pb-6 gap-3 no-scrollbar snap-x snap-mandatory px-1">
            {deals.slice(1).map((product) => (
              <div key={product.id} className="min-w-[145px] w-[145px] snap-start">
                <ProductCard product={product} className="h-full" priority={true} />
              </div>
            ))}
            <div className="min-w-[40px]" />
          </div>
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-100/50 backdrop-blur-sm px-2 py-1 rounded-full border border-slate-200/50">
            {deals.slice(1).map((_, idx) => (
              <motion.div key={idx} animate={{ width: activeDealDot === idx ? 12 : 4, backgroundColor: activeDealDot === idx ? '#E5C76B' : '#94A3B8' }} transition={{ type: "spring", stiffness: 300, damping: 30 }} className="h-1 rounded-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block mb-8">
        <div className="bg-bg-card rounded-[24px] flex flex-col lg:flex-row overflow-hidden shadow-xl border border-solar/20 hover:shadow-solar/10 hover:border-solar/40 transition-all duration-500 group">
          <div className="w-full lg:w-1/2 p-6 lg:p-8 flex flex-col justify-center relative z-10 order-2 lg:order-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-gold-shimmer px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 border border-solar/20 shadow-gold">
                <Flame className="w-3.5 h-3.5 animate-pulse" />
                عرض حصري
              </span>
              <div className="flex items-center gap-2 text-carbon font-bold text-xs">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-solar opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-solar"></span>
                </div>
                <Users className="w-3.5 h-3.5 text-solar ml-0.5" />
                <span>12 يشاهدون الآن</span>
              </div>
            </div>
            <h3 className="text-2xl lg:text-3xl font-black text-carbon leading-tight mb-3">{deals[0].name}</h3>
            <p className="text-slate-500 mb-6 line-clamp-2 text-sm lg:text-base leading-relaxed max-w-xl">{deals[0].description}</p>
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">ينتهي خلال:</span>
                <CountdownTimer />
              </div>
              <div className="hidden lg:block w-px h-8 bg-slate-200" />
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-state-success-bg text-state-success px-2.5 py-1.5 rounded-lg text-xs font-bold">
                  <Truck className="w-3.5 h-3.5" />
                  توصيل مجاني
                </div>
                <div className="flex items-center gap-1.5 bg-state-info-bg text-state-info px-2.5 py-1.5 rounded-lg text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  ضمان سنتين
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-auto pt-5 border-t border-slate-100">
              <div className="flex items-baseline gap-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl lg:text-4xl font-black text-slate-900">{formatPrice(deals[0].price).split(' ')[0]}</span>
                  <span className="text-base lg:text-lg font-bold text-slate-900/70">{formatPrice(deals[0].price).split(' ').slice(1).join(' ')}</span>
                </div>
                {deals[0].originalPrice && <span className="text-lg lg:text-xl text-slate-400 font-medium line-through decoration-solar/30">{formatPrice(deals[0].originalPrice)}</span>}
              </div>
              <FastLink to={`/product/${deals[0].id}`} prefetchPage="ProductDetail" className="inline-flex items-center justify-center gap-2 bg-gold-gradient hover:bg-gold-shimmer text-black px-6 py-3 rounded-xl text-sm lg:text-base font-black transition-all shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5">
                <ShoppingCart className="w-5 h-5" />
                إضافة للسلة
              </FastLink>
            </div>
          </div>
          <div className="w-full lg:w-1/2 bg-bg-general flex justify-center items-center relative order-1 lg:order-2 overflow-hidden min-h-[250px] lg:min-h-[320px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,193,7,0.05)_0%,transparent_70%)]" />
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }} className="relative z-10 w-full h-full flex items-center justify-center p-6 lg:p-8">
              <FastImage src={deals[0].image || undefined} alt={deals[0].name} priority={true} className="w-full h-full object-contain drop-shadow-xl max-h-[280px]" />
              {deals[0].originalPrice && (
                <div className="absolute top-4 right-4 bg-bg-card text-white px-3 py-2 rounded-xl font-black shadow-lg border border-bg-hover flex flex-col items-center transform rotate-3">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">خصم</span>
                  <span className="text-sm lg:text-lg text-solar leading-none mt-0.5">{Math.round(((deals[0].originalPrice - deals[0].price) / deals[0].originalPrice) * 100)}%</span>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default FeaturedDeal;
