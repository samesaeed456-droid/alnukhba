import React, { useState, useEffect, useMemo } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FastLink } from '../FastLink';
import { FastImage } from '../FastImage';
import { useStore } from '../../context/StoreContext';

export const defaultSlides = [
  {
    id: 'default-0',
    image: "https://images.unsplash.com/photo-1566576721346-d4a3b4eaad5b?auto=format&fit=crop&q=80&w=1600",
    title: "توصيل مجاني لجميع الطلبات",
    subtitle: "استمتع بتوصيل مجاني عند تسوقك بقيمة 150 ريال سعودي أو أكثر.",
    buttonText: "تسوق الآن",
    link: "/search",
    isSpecial: true
  },
  {
    id: 'default-1',
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&q=80&w=1600",
    title: "مستقبل التكنولوجيا بين يديك",
    subtitle: "اكتشف أحدث الأجهزة الذكية بتصاميم عصرية وأداء لا يضاهى.",
    buttonText: "تسوق الآن",
    link: "/search"
  },
  {
    id: 'default-2',
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=1600",
    title: "عروض الموسم",
    subtitle: "خصومات تصل إلى 50% على جميع المنتجات.",
    buttonText: "تسوق الآن",
    link: "/search"
  },
  {
    id: 'default-3',
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=1600",
    title: "أناقة بلا حدود",
    subtitle: "مجموعة جديدة من الساعات الذكية.",
    buttonText: "تسوق الآن",
    link: "/search"
  },
  {
    id: 'default-4',
    image: "https://images.unsplash.com/photo-1491933382434-500287f9b54b?auto=format&fit=crop&q=80&w=1600",
    title: "عالم الألعاب",
    subtitle: "أقوى أجهزة الجيمنج بانتظارك.",
    buttonText: "تسوق الآن",
    link: "/search"
  },
  {
    id: 'default-5',
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=1600",
    title: "صوت نقي",
    subtitle: "أحدث سماعات الرأس اللاسلكية.",
    buttonText: "تسوق الآن",
    link: "/search"
  }
];

const Hero = React.memo(() => {
  const { banners } = useStore();
  const [activeSlide, setActiveSlide] = useState(0);

  const activeBanners = useMemo(() => {
    const filtered = banners.filter(b => b.isActive && (!b.position || b.position === 'hero')).sort((a, b) => a.order - b.order);
    if (filtered.length === 0) return defaultSlides;
    
    // Flatten banners that have multiple images
    const flattened: any[] = [];
    filtered.forEach(banner => {
      if (banner.images && banner.images.length > 0) {
        banner.images.forEach((img, index) => {
          flattened.push({
            ...banner,
            id: `${banner.id}-${index}`,
            image: img
          });
        });
      } else {
        flattened.push(banner);
      }
    });
    
    return flattened;
  }, [banners]);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  const nextSlide = () => setActiveSlide((prev) => (prev + 1) % activeBanners.length);
  const prevSlide = () => setActiveSlide((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);

  const onDragEnd = (_: any, info: any) => {
    const threshold = 50;
    if (info.offset.x > threshold) {
      prevSlide();
    } else if (info.offset.x < -threshold) {
      nextSlide();
    }
  };

  if (activeBanners.length === 0) return null;

  return (
    <div className="relative mx-2 sm:mx-6 lg:mx-8 mt-2 mb-3 sm:mb-4 rounded-xl sm:rounded-[32px] overflow-hidden group shadow-2xl border border-white/5 cursor-grab active:cursor-grabbing">
      <div className="relative w-full h-[120px] sm:h-[180px] lg:h-[180px] bg-bg-general">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={onDragEnd}
            className="absolute inset-0 w-full h-full touch-none"
          >
            <FastLink to={activeBanners[activeSlide].link || '/search'} className="block w-full h-full relative">
              {/* Background Image with Zoom Animation */}
              <motion.div
                key={`img-${activeSlide}`}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 8, ease: "linear" }}
                className="absolute inset-0 w-full h-full"
              >
                <FastImage
                  src={activeBanners[activeSlide].image || undefined}
                  alt={activeBanners[activeSlide].title}
                  priority={true}
                  className="w-full h-full object-cover select-none"
                />
              </motion.div>
              
              {/* Overlays removed as per user request */}
            </FastLink>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slider Controls - More Minimal */}
      {activeBanners.length > 1 && (
        <>
          <div className="absolute inset-y-0 right-0 left-0 flex items-center justify-between px-2 sm:px-4 pointer-events-none">
            <motion.button 
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 193, 7, 0.9)' }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.preventDefault(); prevSlide(); }}
              className="pointer-events-auto w-8 h-8 sm:w-12 sm:h-12 bg-black/20 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:text-black opacity-0 group-hover:opacity-100 transition-all z-20 shadow-lg"
            >
              <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6" />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 193, 7, 0.9)' }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => { e.preventDefault(); nextSlide(); }}
              className="pointer-events-auto w-8 h-8 sm:w-12 sm:h-12 bg-black/20 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:text-black opacity-0 group-hover:opacity-100 transition-all z-20 shadow-lg"
            >
              <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
            </motion.button>
          </div>

          {/* Dots Indicator - Compact Luxury Style */}
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20 bg-black/20 backdrop-blur-lg px-2.5 py-1.5 rounded-full border border-white/5 shadow-lg">
            {activeBanners.map((_, idx) => (
              <motion.button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                initial={false}
                animate={{ 
                  width: activeSlide === idx ? 20 : 5,
                  backgroundColor: activeSlide === idx ? '#E5C76B' : 'rgba(255, 255, 255, 0.25)',
                }}
                whileHover={{ backgroundColor: activeSlide === idx ? '#E5C76B' : 'rgba(255, 255, 255, 0.4)' }}
                transition={{ type: "spring", stiffness: 400, damping: 40 }}
                className="h-1 rounded-full relative overflow-hidden"
              >
                {activeSlide === idx && (
                  <motion.div 
                    layoutId="active-pill-shimmer"
                    className="absolute inset-0 bg-white/10"
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </>
      )}
    </div>
  );
});

export default Hero;
