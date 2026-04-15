import React from 'react';
import { useStore } from '../context/StoreContext';
import ProductCard from './ProductCard';
import { motion } from 'motion/react';

export default React.memo(function RecentlyViewed() {
  const { recentlyViewed, addToCart, toggleWishlist, isInWishlist } = useStore();

  if (recentlyViewed.length === 0) return null;

  return (
    <section className="py-12 bg-cool-gray">
      <div className="max-w-7xl mx-auto px-2 sm:px-6">
        <h2 className="text-xl font-black text-carbon mb-8">شوهد مؤخراً</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-6">
          {recentlyViewed.map((product) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              wide
              onWishlistToggle={() => toggleWishlist(product)}
            />
          ))}
        </div>
      </div>
    </section>
  );
});
