import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, Star, ArrowRight, X } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import { motion, AnimatePresence } from 'motion/react';
import ConfirmationModal from '../components/ConfirmationModal';
import { Product } from '../types';

export default function Wishlist() {
  const { wishlist, toggleWishlist, addToCart } = useStore();
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  const handleWishlistToggle = useCallback((product: Product) => setProductToDelete(product), []);
  const handleCloseDeleteModal = useCallback(() => setProductToDelete(null), []);
  const handleConfirmDelete = useCallback(async () => {
    if (productToDelete) {
      toggleWishlist(productToDelete);
      setProductToDelete(null);
    }
  }, [productToDelete, toggleWishlist]);

  const handleOpenClearAllModal = useCallback(() => setIsClearAllModalOpen(true), []);
  const handleCloseClearAllModal = useCallback(() => setIsClearAllModalOpen(false), []);
  const handleConfirmClearAll = useCallback(async () => {
    wishlist.forEach(p => toggleWishlist(p));
    setIsClearAllModalOpen(false);
  }, [wishlist, toggleWishlist]);

  if (wishlist.length === 0) {
    return (
      <motion.div className="max-w-[1600px] mx-auto px-2 sm:px-6 py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-24 h-24 sm:w-32 sm:h-32 bg-red-50 rounded-full flex items-center justify-center mb-6 sm:mb-8 relative"
        >
          <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-red-400" />
          <motion.div 
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className="absolute -top-2 -right-2 bg-white text-red-500 p-2 rounded-full shadow-sm"
          >
            <Star className="w-4 h-4 fill-current" />
          </motion.div>
        </motion.div>
        <h2 className="text-xl sm:text-2xl font-black text-carbon mb-3">قائمة المفضلة فارغة</h2>
        <p className="text-sm sm:text-base text-titanium/60 mb-8 text-center max-w-md leading-relaxed">
          لم تقم بإضافة أي منتجات إلى قائمة المفضلة الخاصة بك حتى الآن. تصفح المنتجات وإضافة ما يعجبك!
        </p>
        <Link 
          to="/" 
          className="bg-gradient-to-r from-carbon to-solar hover:opacity-90 text-white px-8 py-3 sm:px-10 sm:py-4 rounded-xl text-sm sm:text-base font-bold transition-all shadow-lg shadow-solar/20 hover:shadow-solar/40 hover:-translate-y-1 flex items-center gap-2"
        >
          تصفح المنتجات
          <ArrowRight className="w-5 h-5" />
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-2 sm:px-6 py-8">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <h1 className="text-xl sm:text-2xl font-bold text-carbon flex items-center gap-3">
          <Heart className="w-8 h-8 text-red-500 fill-red-500" />
          المفضلة
        </h1>
        <div className="flex items-center gap-4">
          <motion.span 
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="bg-slate-50 text-titanium/80 font-bold px-4 py-2 rounded-full text-sm hidden sm:block"
          >
            {wishlist.length} منتجات
          </motion.span>
          <button 
            onClick={handleOpenClearAllModal}
            className="flex items-center gap-2 text-red-500 hover:text-red-600 font-bold text-sm transition-colors px-3 py-2 rounded-xl hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            مسح الكل
          </button>
        </div>
      </motion.div>

      <div 
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2 sm:gap-6"
      >
        {wishlist.map(p => (
          <div key={p.id}>
            <ProductCard 
              product={p} 
              className="h-full" 
              wide
              onWishlistToggle={handleWishlistToggle}
            />
          </div>
        ))}
      </div>

      <ConfirmationModal
        isOpen={!!productToDelete}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="إزالة من المفضلة"
        message={`هل أنت متأكد من رغبتك في إزالة "${productToDelete?.name}" من قائمة المفضلة؟`}
        confirmText="إزالة"
        cancelText="تراجع"
      />

      <ConfirmationModal
        isOpen={isClearAllModalOpen}
        onClose={handleCloseClearAllModal}
        onConfirm={handleConfirmClearAll}
        title="مسح المفضلة"
        message="هل أنت متأكد من رغبتك في مسح جميع المنتجات من المفضلة؟"
        confirmText="مسح الكل"
        cancelText="تراجع"
        type="danger"
      />
    </div>
  );
}
