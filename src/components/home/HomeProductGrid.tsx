import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { FastLink } from '../FastLink';
import ProductCard from '../ProductCard';

interface HomeProductGridProps {
  title: string;
  icon: React.ElementType;
  products: any[];
  viewAllLink?: string;
  viewAllText?: string;
  iconColor?: string;
  animateIcon?: boolean;
}

const HomeProductGrid = React.memo(({ 
  title, 
  icon: Icon, 
  products, 
  viewAllLink, 
  viewAllText = "عرض الكل",
  iconColor = "text-solar",
  animateIcon = false
}: HomeProductGridProps) => {
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="px-2 sm:px-6 lg:px-8 mb-8">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg sm:text-xl font-black text-carbon flex items-center gap-2 sm:gap-3">
          <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${iconColor} ${animateIcon ? 'animate-pulse' : ''}`} />
          {title}
        </h2>
        {viewAllLink && (
          <FastLink to={viewAllLink} prefetchPage="Search" className="text-sm sm:text-base font-bold text-carbon hover:underline flex items-center gap-1 group">
            {viewAllText}
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 transform group-hover:-translate-x-1 transition-transform" />
          </FastLink>
        )}
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-6">
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} className="h-full" wide priority={index < 4} />
        ))}
      </div>
    </div>
  );
});

export default HomeProductGrid;
