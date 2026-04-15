import React from 'react';
import { Grid, Search } from 'lucide-react';
import { motion } from 'motion/react';
import ProductCard from '../ProductCard';
import { Skeleton, ProductCardSkeleton } from '../Skeleton';

interface CategoryFilteredSectionProps {
  categoryName: string;
  products: any[];
  isLoading: boolean;
  onReset: () => void;
}

const CategoryFilteredSection = React.memo(({ 
  categoryName, 
  products, 
  isLoading, 
  onReset 
}: CategoryFilteredSectionProps) => {
  if (isLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="px-2 sm:px-6 lg:px-8 mb-10"
      >
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-6">
          {[...Array(8)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </motion.div>
    );
  }

  if (products.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 px-4 text-center"
      >
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <Search className="w-10 h-10 text-slate-400" />
        </div>
        <h3 className="text-xl font-black text-carbon mb-2">لا توجد منتجات حالياً</h3>
        <p className="text-slate-500 max-w-md">
          عذراً، لا توجد منتجات متوفرة في قسم "{categoryName}" في الوقت الحالي. يرجى التحقق مرة أخرى لاحقاً.
        </p>
        <button 
          onClick={onReset}
          className="mt-8 bg-carbon text-white px-8 py-3 rounded-xl font-bold hover:bg-carbon/90 transition-all"
        >
          العودة للكل
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-2 sm:px-6 lg:px-8 mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg sm:text-xl font-black text-carbon flex items-center gap-2 sm:gap-3">
          <Grid className="w-6 h-6 sm:w-9 sm:h-9 text-solar" />
          منتجات {categoryName}
        </h2>
        <span className="text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
          {products.length} منتج
        </span>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-6">
        {products.map(product => (
          <ProductCard key={product.id} product={product} className="h-full" wide />
        ))}
      </div>
    </motion.div>
  );
});

export default CategoryFilteredSection;
