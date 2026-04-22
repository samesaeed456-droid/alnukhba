import React, { useState } from 'react';
import { ShoppingCart, Plus, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { useStoreActions } from '../context/StoreContext';
import { FastLink } from './FastLink';
import { FastImage } from './FastImage';

interface KitProductItemProps {
  product: Product;
}

export default function KitProductItem({ product }: KitProductItemProps) {
  const { addToCart, formatPrice } = useStoreActions();
  const [isAdded, setIsAdded] = useState(false);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white rounded-3xl border border-slate-100 p-4 sm:p-5 flex items-center gap-4 sm:gap-6 shadow-sm hover:shadow-xl hover:shadow-solar/5 transition-all group"
    >
      <FastLink 
        to={`/product/${product.id}`}
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0"
      >
        <FastImage 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
      </FastLink>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <FastLink 
            to={`/product/${product.id}`}
            className="text-xs sm:text-sm font-bold text-carbon hover:text-solar transition-colors line-clamp-2"
          >
            {product.name}
          </FastLink>
        </div>
        
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-black text-solar/60 bg-solar/5 px-2 py-0.5 rounded-md uppercase tracking-wider">
            {product.category}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-sm sm:text-base font-black text-carbon">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <span className="text-[10px] text-slate-400 line-through">{formatPrice(product.originalPrice)}</span>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={product.inStock === false}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-black transition-all ${
              product.inStock === false
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : isAdded
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-solar/10 text-solar hover:bg-solar hover:text-black shadow-sm'
            }`}
          >
            {isAdded ? (
              <><Check className="w-3.5 h-3.5" /> تم الإضافة</>
            ) : product.inStock === false ? (
              'نفد'
            ) : (
              <><Plus className="w-3.5 h-3.5" /> عرض سريع</>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
