import React, { useState, useEffect, useRef } from "react";
import {
  Flame,
  Users,
  ShoppingCart,
  ChevronRight,
  ChevronLeft,
  Truck,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FastLink } from "../FastLink";
import { FastImage } from "../FastImage";
import ProductCard from "../ProductCard";

const CountdownTimer = React.memo(
  ({ variant = "default" }: { variant?: "default" | "premium" }) => {
    const [timeLeft, setTimeLeft] = useState({
      hours: 12,
      minutes: 45,
      seconds: 30,
    });

    useEffect(() => {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
          if (prev.minutes > 0)
            return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
          if (prev.hours > 0)
            return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
          return prev;
        });
      }, 1000);
      return () => clearInterval(timer);
    }, []);

    if (variant === "premium") {
      return (
        <div className="flex items-center gap-2 sm:gap-3 font-mono" dir="ltr">
          <div className="flex flex-col items-center">
            <span className="bg-carbon text-white w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl font-black shadow-lg border border-white/10">
              {timeLeft.hours.toString().padStart(2, "0")}
            </span>
            <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
              ساعة
            </span>
          </div>
          <span className="text-solar font-black text-xl mb-5">:</span>
          <div className="flex flex-col items-center">
            <span className="bg-carbon text-white w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl font-black shadow-lg border border-white/10">
              {timeLeft.minutes.toString().padStart(2, "0")}
            </span>
            <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
              دقيقة
            </span>
          </div>
          <span className="text-solar font-black text-xl mb-5">:</span>
          <div className="flex flex-col items-center">
            <span className="bg-solar text-black w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg sm:text-xl font-black shadow-lg shadow-solar/20 border border-white/10">
              {timeLeft.seconds.toString().padStart(2, "0")}
            </span>
            <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-wider">
              ثانية
            </span>
          </div>
        </div>
      );
    }

    return (
      <div
        className="flex items-center gap-1.5 font-mono font-bold text-sm sm:text-base"
        dir="ltr"
      >
        <span className="bg-carbon text-white px-2.5 py-1 rounded-lg min-w-[36px] text-center">
          {timeLeft.hours.toString().padStart(2, "0")}
        </span>
        <span className="text-slate-500">:</span>
        <span className="bg-carbon text-white px-2.5 py-1 rounded-lg min-w-[36px] text-center">
          {timeLeft.minutes.toString().padStart(2, "0")}
        </span>
        <span className="text-slate-500">:</span>
        <span className="bg-solar text-black px-2.5 py-1 rounded-lg min-w-[36px] text-center">
          {timeLeft.seconds.toString().padStart(2, "0")}
        </span>
      </div>
    );
  },
);

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
      // Card width (155) + gap (12) = 167
      const index = Math.round(Math.abs(scrollLeft) / 167);
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
          <div className="hidden sm:flex items-center gap-2 mr-2">
             <CountdownTimer />
          </div>
        </h2>
        <FastLink
          to="/deals"
          prefetchPage="Search"
          className="text-sm sm:text-base font-bold text-carbon hover:underline flex items-center gap-1 group"
        >
          عرض الكل
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:-translate-x-1 transition-transform" />
        </FastLink>
      </div>

      <div className="sm:hidden mb-4">
         <CountdownTimer />
      </div>

      <div className="relative group/scroll">
        <div
          ref={dealsScrollRef}
          onScroll={handleDealsScroll}
          className="flex overflow-x-auto pb-4 gap-3 no-scrollbar snap-x snap-mandatory px-1"
        >
          {deals.map((product) => (
            <div
              key={product.id}
              className="min-w-[155px] w-[155px] sm:min-w-[220px] sm:w-[220px] snap-start"
            >
              <ProductCard
                product={product}
                className="h-full border-solar/20 hover:border-solar/40 shadow-sm hover:shadow-lg transition-all"
                priority={true}
                wide
              />
            </div>
          ))}
          <div className="min-w-[40px]" />
        </div>
        
        {/* Visual cue for scrolling on mobile */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-full bg-gradient-to-l from-bg-general to-transparent pointer-events-none sm:hidden" />
      </div>
    </div>
  );
});

export default FeaturedDeal;
