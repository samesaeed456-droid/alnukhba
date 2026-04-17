import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search as SearchIcon, Star, ShoppingCart, Heart, SlidersHorizontal, X, Check, Scale, RefreshCcw, Camera, Sparkles, Upload } from 'lucide-react';
import { useStore, useStoreState, useStoreActions } from '../context/StoreContext';
import ProductCard from '../components/ProductCard';
import { ProductCardSkeleton } from '../components/Skeleton';
import { motion } from 'motion/react';
import { FastLink } from '../components/FastLink';
import { FloatingInput } from '../components/FloatingInput';

export default function Search() {
  const location = useLocation();
  const { products } = useStoreState();
  const { addToCart, toggleWishlist, isInWishlist } = useStoreActions();
  
  // Initialize state from URL params
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialCategory = searchParams.get('category') || 'الكل';
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 2000000]);
  const [itemsToShow, setItemsToShow] = useState(12);
  const [isLoading, setIsLoading] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const observerTarget = React.useRef(null);
  const navigate = useNavigate();

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (selectedCategory !== 'الكل') params.set('category', selectedCategory);
    
    const newSearch = params.toString();
    const currentSearch = location.search.startsWith('?') ? location.search.slice(1) : location.search;
    
    if (newSearch !== currentSearch) {
      navigate({ search: newSearch }, { replace: true });
    }
  }, [debouncedQuery, selectedCategory, navigate, location.search]);

  // Debounce query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // Update state when URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('category');
    const q = params.get('q');
    
    if (category) setSelectedCategory(category);
    if (q !== null) {
      setQuery(q);
      setDebouncedQuery(q);
    }
  }, [location.search]);

  const categories = ['الكل', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const searchTerms = debouncedQuery.toLowerCase().trim();
      const matchesQuery = !searchTerms || 
                           (p.name || '').toLowerCase().includes(searchTerms) || 
                           (p.brand || '').toLowerCase().includes(searchTerms) ||
                           (p.category || '').toLowerCase().includes(searchTerms);
      const matchesCategory = selectedCategory === 'الكل' || p.category === selectedCategory;
      const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
      
      return matchesQuery && matchesCategory && matchesPrice;
    });
  }, [debouncedQuery, selectedCategory, priceRange]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, itemsToShow);
  }, [filteredProducts, itemsToShow]);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && itemsToShow < filteredProducts.length) {
          setItemsToShow(prev => prev + 8);
        }
      },
      { threshold: 1.0 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [itemsToShow, filteredProducts.length]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-[1600px] mx-auto px-2 sm:px-6 py-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <motion.h1 
          variants={itemVariants}
          className="text-xl sm:text-2xl font-bold text-carbon"
        >
          {debouncedQuery ? `نتائج البحث عن: "${debouncedQuery}"` : 'البحث'}
        </motion.h1>
        
        <motion.div 
          variants={itemVariants}
          className="w-full md:w-1/2 relative"
        >
          <FloatingInput 
            id="searchQuery"
            label="ابحث عن منتج، علامة تجارية..."
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            icon={<SearchIcon className="w-5 h-5" />}
            iconPosition="start"
            endElement={
              <div className="flex items-center gap-1.5 bg-slate-50/80 p-1.5 rounded-xl border border-slate-100 backdrop-blur-sm ml-2">
                {query && (
                  <>
                    <motion.button 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      onClick={() => setQuery('')}
                      className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all"
                      title="مسح البحث"
                    >
                      <X className="w-4 h-4" />
                    </motion.button>
                    <div className="w-px h-5 bg-slate-200 mx-1"></div>
                  </>
                )}
                <button 
                  onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                  className="lg:hidden flex items-center justify-center gap-1.5 bg-white text-carbon px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-slate-100 transition-colors shadow-sm border border-slate-200"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span className="hidden sm:inline">تصفية</span>
                </button>
              </div>
            }
          />
        </motion.div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <motion.div 
          variants={itemVariants}
          className={`w-full lg:w-1/4 flex flex-col gap-6 ${isFiltersOpen ? 'block' : 'hidden lg:flex'}`}
        >
          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-carbon flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-solar" />
                الفلاتر
              </h2>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedCategory('الكل');
                  setPriceRange([0, 2000000]);
                  setQuery('');
                }}
                className="text-xs font-bold text-solar hover:underline"
              >
                إعادة ضبط
              </motion.button>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <h3 className="text-sm font-bold text-carbon mb-4">الأقسام</h3>
              <div className="space-y-2 max-h-40 overflow-y-auto hide-scrollbar pr-1">
                {categories.map(category => (
                  <motion.label 
                    key={category} 
                    whileHover={{ x: -5 }}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      selectedCategory === category 
                        ? 'bg-gradient-to-r from-carbon to-solar border-transparent text-white' 
                        : 'border-slate-300 group-hover:border-solar/40'
                    }`}>
                      {selectedCategory === category && <Check className="w-3 h-3" />}
                    </div>
                    <span className={`text-sm ${selectedCategory === category ? 'font-bold text-carbon' : 'text-titanium/80 group-hover:text-carbon'}`}>
                      {category}
                    </span>
                    <input 
                      type="radio" 
                      name="category" 
                      className="hidden" 
                      checked={selectedCategory === category}
                      onChange={() => setSelectedCategory(category)}
                    />
                  </motion.label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div className="mb-0">
              <h3 className="text-sm font-bold text-carbon mb-4">السعر (ر.ي)</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-1">
                  <label className="text-xs text-titanium/60 mb-1 block">من</label>
                  <input 
                    type="number" 
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className="w-full h-10 px-3 rounded-lg border border-slate-100 bg-white focus:ring-2 focus:ring-solar focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-titanium/60 mb-1 block">إلى</label>
                  <input 
                    type="number" 
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className="w-full h-10 px-3 rounded-lg border border-slate-100 bg-white focus:ring-2 focus:ring-solar focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>
              </div>
              <input 
                type="range" 
                min="0" 
                max="2000000" 
                step="1000"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="w-full accent-solar"
              />
            </div>
          </div>
        </motion.div>

        {/* Results Grid */}
        <div className="w-full lg:w-3/4">
          <motion.div variants={itemVariants} className="mb-6 flex items-center justify-between">
            <p className="text-titanium/80">
              تم العثور على <span className="font-bold text-carbon">{filteredProducts.length}</span> منتج
            </p>
          </motion.div>

          {isFiltering ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : displayedProducts.length > 0 ? (
            <div 
              className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-8"
            >
              {displayedProducts.map(p => (
                <ProductCard key={p.id} product={p} className="h-full" wide />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 sm:py-24 px-4 text-center bg-white rounded-3xl border border-slate-100">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-full flex items-center justify-center mb-6 sm:mb-8 relative"
              >
                <SearchIcon className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300" />
                <motion.div 
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="absolute -bottom-2 -right-2 bg-red-100 text-red-600 p-2 rounded-full"
                >
                  <X className="w-4 h-4" />
                </motion.div>
              </motion.div>
              <h3 className="text-lg sm:text-xl font-black text-carbon mb-3">لا توجد نتائج مطابقة</h3>
              <p className="text-sm sm:text-base text-titanium/60 max-w-md mx-auto mb-8 leading-relaxed">
                لم نتمكن من العثور على منتجات تطابق بحثك{debouncedQuery ? ` عن "${debouncedQuery}"` : ''}. جرب النصائح التالية لتحسين نتائجك:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12 text-right max-w-3xl w-full px-4">
                <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/80 backdrop-blur-sm hover:border-solar/20 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-solar/10 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-solar" />
                    </div>
                    <h4 className="font-bold text-carbon text-base">نصائح للبحث</h4>
                  </div>
                  <ul className="text-sm text-titanium/70 space-y-3">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-solar mt-1.5 flex-shrink-0" />
                      <span>تأكد من كتابة الكلمات بشكل صحيح</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-solar mt-1.5 flex-shrink-0" />
                      <span>استخدم كلمات بحث أقل أو أكثر عمومية</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-solar mt-1.5 flex-shrink-0" />
                      <span>جرب البحث باسم الماركة أو الفئة</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/80 backdrop-blur-sm hover:border-carbon/20 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-carbon/10 flex items-center justify-center">
                      <ShoppingCart className="w-4 h-4 text-carbon" />
                    </div>
                    <h4 className="font-bold text-carbon text-base">تصفح الأقسام الشائعة</h4>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {['إلكترونيات', 'إكسسوارات', 'شاشات', 'كاميرات مراقبة', 'كهربائيات', 'طاقة شمسية'].map(cat => (
                      <button 
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setQuery('');
                        }}
                        className="text-xs font-bold bg-white border border-slate-200/60 px-3 py-2.5 rounded-xl hover:border-solar hover:text-solar hover:shadow-md transition-all text-center truncate"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setQuery('');
                    setSelectedCategory('الكل');
                    setPriceRange([0, 2000000]);
                  }}
                  className="bg-gradient-to-r from-carbon to-solar hover:opacity-90 text-white px-8 py-3 sm:px-10 sm:py-4 rounded-xl text-sm sm:text-base font-bold transition-all shadow-lg shadow-solar/30 hover:shadow-solar/50 flex items-center justify-center gap-2"
                >
                  إعادة ضبط البحث
                  <RefreshCcw className="w-5 h-5" />
                </motion.button>
                
                <FastLink 
                  to="/"
                  className="bg-white border border-slate-200 text-carbon px-8 py-3 sm:px-10 sm:py-4 rounded-xl text-sm sm:text-base font-bold transition-all hover:bg-slate-50 flex items-center justify-center gap-2"
                >
                  العودة للرئيسية
                </FastLink>
              </div>
            </div>
          )}
          
          <div ref={observerTarget} className="mt-6">
            {isLoading && (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}


