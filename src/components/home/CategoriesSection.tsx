import React, { useRef, useEffect, useState } from "react";
import { useStore } from "../../context/StoreContext";
import {
  Grid,
  ChevronLeft,
  Grid2X2,
  Package,
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CategoriesSectionProps {
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategoriesSection = React.memo(
  ({ activeCategory, onCategoryChange }: CategoriesSectionProps) => {
    const { categories } = useStore();
    const displayCategories = [
      { id: "all", name: "الكل", icon: "Grid2X2" },
      ...categories.filter((c) => c.isActive && c.id !== "all"),
    ];
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [canScroll, setCanScroll] = useState(true);

    const checkScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } =
          scrollContainerRef.current;
        setCanScroll(
          Math.ceil(Math.abs(scrollLeft)) + clientWidth < scrollWidth - 10,
        );
      }
    };

    useEffect(() => {
      checkScroll();
      window.addEventListener("resize", checkScroll);
      return () => window.removeEventListener("resize", checkScroll);
    }, []);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-2 sm:px-6 lg:px-8 mb-4 sm:mb-6"
      >
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
            className="flex overflow-x-auto gap-3 sm:gap-4 hide-scrollbar pb-4 pt-2 cursor-grab active:cursor-grabbing"
          >
            {displayCategories.map((c, i) => {
              // Handle icon rendering
              const IconComponent = (LucideIcons as any)[c.icon || "Package"] || Package;

              const isActive = activeCategory === c.name;

              return (
                <motion.button
                  key={c.id || i}
                  whileHover={{ y: -8, scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onCategoryChange(c.name)}
                  className={`flex flex-col items-center gap-2 sm:gap-3 min-w-[65px] sm:min-w-[90px] transition-all group relative shrink-0`}
                >
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 relative z-10 overflow-hidden ${
                      isActive
                        ? `ring-2 ring-solar shadow-lg shadow-solar/20 bg-carbon text-solar`
                        : `bg-white border border-slate-200/60 text-slate-400 group-hover:text-carbon group-hover:bg-slate-50 shadow-sm`
                    }`}
                  >
                    <IconComponent
                      className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-500 ${
                        isActive
                          ? "scale-110"
                          : "group-hover:scale-110"
                      }`}
                    />
                    {isActive && (
                      <motion.div 
                        layoutId="active-bg"
                        className="absolute inset-0 bg-gold-gradient opacity-10"
                      />
                    )}
                  </div>
                  <span
                    className={`text-[10px] sm:text-sm font-bold transition-colors ${isActive ? "text-solar" : "text-slate-500 group-hover:text-carbon"}`}
                  >
                    {c.name}
                  </span>
                </motion.button>
              );
            })}
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
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "easeInOut",
                  }}
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
  },
);

export default CategoriesSection;
