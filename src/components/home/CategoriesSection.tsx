import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Grid, Monitor, Cpu, Headphones, Plug, Battery, Sun, Wifi, Settings, Wrench, Cctv, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';



interface CategoriesSectionProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoriesSection = React.memo(({ activeCategory, onCategoryChange }: CategoriesSectionProps) => {
  const { categories } = useStore();
  const displayCategories = [{ name: 'الكل', image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&h=200&fit=crop', id: 'all' }, ...categories.filter(c => c.isActive && c.id !== 'all')];
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(true);

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScroll(Math.ceil(Math.abs(scrollLeft)) + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="px-2 sm:px-6 lg:px-8 mb-4 sm:mb-6">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-black text-carbon flex items-center gap-2 sm:gap-3">
          <Grid className="w-5 h-5 sm:w-7 sm:h-7 text-solar" />
          تصفح حسب الفئة
        </h2>
      </div>
      <div className="relative -mx-2 px-2 group/scroll">
        <div 
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex overflow-x-auto gap-4 sm:gap-6 hide-scrollbar pb-4 pt-2 cursor-grab active:cursor-grabbing"
        >
          {displayCategories.map((c, i) => (
            <motion.button 
              key={i} 
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCategoryChange(c.name)}
              className={`flex flex-col items-center gap-2 sm:gap-3 min-w-[70px] sm:min-w-[100px] transition-all group relative shrink-0`}
            >
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 overflow-hidden ${
                activeCategory === c.name 
                ? `ring-4 ring-solar shadow-lg shadow-solar/30` 
                : `bg-slate-100 border border-slate-200/50`
              }`}>
                <img 
                  src={c.image || undefined} 
                  alt={c.name} 
                  className={`w-full h-full object-cover transition-all duration-500 ${
                    activeCategory === c.name ? 'scale-110 brightness-110' : 'opacity-90 group-hover:opacity-100 group-hover:scale-110'
                  }`}
                  referrerPolicy="no-referrer"
                />
                {activeCategory === c.name && (
                  <div className="absolute inset-0 bg-gold-gradient/20" />
                )}
              </div>
              <span className={`text-[10px] sm:text-sm font-bold transition-colors ${activeCategory === c.name ? 'text-solar' : 'text-slate-500 group-hover:text-carbon'}`}>
                {c.name}
              </span>
            </motion.button>
          ))}
        </div>
        
        <AnimatePresence>
          {canScroll && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-0 left-2 bottom-6 flex items-center justify-center pointer-events-none z-10"
            >
              <motion.div
                animate={{ x: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="text-slate-400 dark:text-slate-500 drop-shadow-md"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

export default CategoriesSection;
