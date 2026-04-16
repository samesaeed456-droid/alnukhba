import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, X, ShoppingCart, Search, ChevronLeft, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore, useStoreState, useStoreActions, useStoreUI } from '../../context/StoreContext';
import ConfirmationModal from '../ConfirmationModal';

interface WishlistDrawerProps {}

export default React.memo(function WishlistDrawer({}: WishlistDrawerProps) {
  const navigate = useNavigate();
  const { wishlist } = useStoreState();
  const { toggleWishlist, addToCart, formatPrice } = useStoreActions();
  const { isWishlistOpen, setIsWishlistOpen } = useStoreUI();
  
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const handleAddToCart = useCallback((product: any) => {
    addToCart(product, 1);
  }, [addToCart]);

  return (
    <>
      <AnimatePresence>
        {isWishlistOpen && (
          <motion.div 
            key="overlay"
            initial={{opacity: 0}} 
            animate={{opacity: 0.6}} 
            exit={{opacity: 0}} 
            className="fixed inset-0 bg-slate-900 z-50 backdrop-blur-sm" 
            onClick={() => setIsWishlistOpen(false)} 
          />
        )}
        {isWishlistOpen && (
          <motion.div 
            key="drawer"
            initial={{x: '-100%'}} 
            animate={{x: 0}} 
            exit={{x: '-100%'}} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-full w-[85%] sm:w-[400px] bg-white z-50 shadow-2xl flex flex-col rounded-r-2xl overflow-hidden border-r border-slate-200"
          >
              <div className="p-4 sm:p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <h2 className="text-lg sm:text-xl font-black text-carbon flex items-center gap-2">
                    <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-solar fill-solar" />
                    المفضلة
                  </h2>
                  <button onClick={() => setIsWishlistOpen(false)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors text-slate-600 border border-slate-200">
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3 sm:space-y-4 hide-scrollbar">
                  {wishlist.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                        className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-50 rounded-full flex items-center justify-center mb-6 sm:mb-8 relative border border-slate-100"
                      >
                        <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-slate-200" />
                        <motion.div 
                          animate={{ y: [0, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                          className="absolute -top-2 -right-2 bg-solar/10 text-solar p-2 rounded-full border border-solar/20"
                        >
                          <Search className="w-4 h-4" />
                        </motion.div>
                      </motion.div>
                      <h3 className="text-lg sm:text-xl font-black text-carbon mb-2">قائمتك فارغة</h3>
                      <p className="text-sm sm:text-base text-center max-w-[250px] text-slate-500 mb-8">
                        لم تقم بإضافة أي منتجات إلى مفضلتك بعد. تصفح المنتجات وأضف ما يعجبك!
                      </p>
                      <button 
                        onClick={() => {
                          setIsWishlistOpen(false);
                          navigate('/search');
                        }} 
                        className="bg-solar hover:bg-solar/90 text-white px-8 py-3 sm:px-10 sm:py-4 rounded-xl text-sm sm:text-base font-bold transition-all shadow-lg shadow-solar/20 hover:-translate-y-1 flex items-center gap-2"
                      >
                        تصفح المنتجات
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    wishlist.map(product => (
                      <motion.div 
                        layout 
                        key={product.id} 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        exit={{ opacity: 0, scale: 0.9 }} 
                        className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-2xl border border-slate-200 group hover:border-solar/20 transition-colors relative"
                      >
                        <div 
                          className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-xl overflow-hidden flex-shrink-0 cursor-pointer border border-slate-100"
                          onClick={() => {
                            setIsWishlistOpen(false);
                            navigate(`/product/${product.id}`);
                          }}
                        >
                          <img src={product.image || undefined} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        
                        <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-1">
                          <div>
                            <h3 
                              className="font-bold text-carbon text-sm sm:text-base truncate cursor-pointer hover:text-solar transition-colors"
                              onClick={() => {
                                setIsWishlistOpen(false);
                                navigate(`/product/${product.id}`);
                              }}
                            >
                              {product.name}
                            </h3>
                            <p className="text-solar font-black text-sm sm:text-base mt-1">
                              {formatPrice(product.price)}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between mt-3">
                            <button 
                              onClick={() => handleAddToCart(product)}
                              className="flex items-center gap-1.5 bg-solar hover:bg-solar/90 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              أضف للسلة
                            </button>
                            
                            <button 
                              onClick={() => setItemToDelete(product.id)}
                              className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {wishlist.length > 0 && (
                  <div className="pt-4 sm:pt-6 mt-4 sm:mt-6 border-t border-slate-100">
                    <button 
                      onClick={() => {
                        setIsWishlistOpen(false);
                        navigate('/wishlist');
                      }} 
                      className="w-full bg-slate-50 hover:bg-slate-100 text-carbon py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 border border-slate-200"
                    >
                      عرض صفحة المفضلة
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={async () => {
          if (itemToDelete) {
            toggleWishlist(wishlist.find(p => p.id === itemToDelete)!);
            setItemToDelete(null);
          }
        }}
        title="إزالة من المفضلة"
        message="هل أنت متأكد من إزالة هذا المنتج من المفضلة؟"
        confirmText="إزالة"
        cancelText="إلغاء"
        type="danger"
      />
    </>
  );
});
