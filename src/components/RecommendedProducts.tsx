import React, { useEffect, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import ProductCard from './ProductCard';
import { Sparkles, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { FastImage } from './FastImage';

interface RecommendedProductsProps {
  currentProduct?: Product;
  title?: string;
  limit?: number;
  compact?: boolean;
}

export default React.memo(function RecommendedProducts({ 
  currentProduct, 
  title = "منتجات مقترحة لك", 
  limit = 4,
  compact = false
}: RecommendedProductsProps) {
  const { getRecommendations, getRuleBasedRecommendations, addToCart, formatPrice } = useStore();
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get rule-based recommendations immediately for instant display
    const fastRecs = getRuleBasedRecommendations(currentProduct);
    if (fastRecs.length > 0) {
      setRecommendations(fastRecs.slice(0, limit));
      setLoading(false);
    }

    // 2. Fetch AI recommendations in the background if possible
    const fetchAIRecommendations = async () => {
      try {
        const recs = await getRecommendations(currentProduct);
        if (recs.length > 0) {
          setRecommendations(recs.slice(0, limit));
        }
      } catch (error) {
        // Fallback already shown
      } finally {
        setLoading(false);
      }
    };

    fetchAIRecommendations();
  }, [currentProduct, getRecommendations, getRuleBasedRecommendations, limit]);

  if (!loading && recommendations.length === 0) return null;

  if (compact) {
    return (
      <div className="py-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-solar" />
          <h3 className="text-sm font-black text-carbon">{title}</h3>
        </div>
        <div className="space-y-3">
          {loading ? (
            [...Array(limit)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-50 rounded-xl animate-pulse" />
            ))
          ) : (
            recommendations.map((product) => (
              <div key={product.id} className="flex gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                <FastImage src={product.image || undefined} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-carbon truncate">{product.name}</h4>
                  <p className="text-[10px] text-solar font-black mt-1">{formatPrice(product.price)}</p>
                </div>
                <button 
                  onClick={() => addToCart(product)}
                  className="self-center p-1.5 bg-white rounded-lg shadow-sm text-carbon hover:text-solar transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="py-4">
      {title && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-solar/10 rounded-xl flex items-center justify-center text-solar">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-carbon tracking-tight">{title}</h2>
              <p className="text-sm text-slate-500 font-medium">بناءً على اهتماماتك وتصفحك</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-6">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-6">
          {recommendations.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <ProductCard product={product} className="h-full" wide />
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}
);
