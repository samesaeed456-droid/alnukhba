import React, { useMemo, useState, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { motion } from 'motion/react';
import { ChevronRight, SlidersHorizontal, Check, Search, Camera, X, Sparkles, Upload } from 'lucide-react';
import { useStore, useStoreState, useStoreActions } from '../context/StoreContext';
import { FastLink } from '../components/FastLink';

export default function Category() {
  const { categoryName } = useParams<{ categoryName: string }>();
  const { products } = useStoreState();
  const { formatPrice } = useStoreActions();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialBrand = searchParams.get('brand') || 'الكل';
  
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const brand = params.get('brand');
    if (brand) setSelectedBrand(brand);
    else setSelectedBrand('الكل');
  }, [location.search]);

  const categoryProducts = useMemo(() => {
    return products.filter(p => p.category === categoryName);
  }, [categoryName, products]);

  const brands = useMemo(() => ['الكل', ...Array.from(new Set(categoryProducts.map(p => p.brand)))], [categoryProducts]);

  const filteredProducts = useMemo(() => {
    return categoryProducts.filter(p => {
      const matchesBrand = selectedBrand === 'الكل' || p.brand === selectedBrand;
      const matchesSearch = !searchQuery.trim() || 
                            (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (p.brand || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesBrand && matchesSearch;
    });
  }, [categoryProducts, selectedBrand, searchQuery]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleToggleFilters = useCallback(() => {
    setIsFiltersOpen(prev => !prev);
  }, []);

  const handleResetFilters = useCallback(() => {
    setSelectedBrand('الكل');
  }, []);

  const handleBrandChange = useCallback((brand: string) => {
    setSelectedBrand(brand);
  }, []);

  if (!categoryName) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 pt-24 pb-6">
      <div className="max-w-[1600px] mx-auto px-2 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-8">
          <FastLink to="/" className="hover:text-solar transition-colors">الرئيسية</FastLink>
          <ChevronRight className="w-4 h-4" />
          <span className="text-carbon font-bold">{categoryName}</span>
        </nav>

        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-2xl font-black text-carbon mb-2">{categoryName}</h1>
            <p className="text-slate-500 mb-6">
              اكتشف أحدث المنتجات في قسم {categoryName} ({filteredProducts.length} منتج)
            </p>

            {/* Category Search Bar */}
            <div className="relative max-w-2xl">
              <div className="relative group">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={handleSearchChange}
                  placeholder={`ابحث في قسم ${categoryName}...`}
                  className="w-full bg-white text-carbon placeholder-slate-400 py-4 pr-12 pl-28 sm:pl-32 rounded-2xl focus:outline-none focus:ring-2 focus:ring-solar/30 border border-slate-200 transition-all text-sm font-bold shadow-sm"
                />
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-solar transition-colors" />
                
                <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-slate-50/80 p-1.5 rounded-xl border border-slate-100 backdrop-blur-sm">
                  {searchQuery && (
                    <>
                      <button 
                        onClick={handleClearSearch}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white rounded-lg transition-all"
                        title="مسح البحث"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="w-px h-5 bg-slate-200 mx-1"></div>
                    </>
                  )}
                  <button 
                    onClick={handleToggleFilters}
                    className="lg:hidden flex items-center justify-center gap-1.5 bg-white text-carbon px-3 py-1.5 rounded-lg font-bold text-xs hover:bg-slate-100 transition-colors shadow-sm border border-slate-200"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span className="hidden sm:inline">تصفية</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <motion.div 
            className={`w-full lg:w-1/4 flex flex-col gap-6 ${isFiltersOpen ? 'block' : 'hidden lg:flex'}`}
          >
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-carbon flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5 text-solar" />
                  الفلاتر
                </h2>
                <button 
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-solar hover:underline"
                >
                  إعادة ضبط
                </button>
              </div>

              {/* Brands */}
              {brands.length > 2 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-carbon mb-4">العلامة التجارية</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto hide-scrollbar pr-1">
                    {brands.map(brand => (
                      <label 
                        key={brand} 
                        className="flex items-center gap-3 cursor-pointer group"
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          selectedBrand === brand 
                            ? 'bg-gradient-to-r from-carbon to-solar border-transparent text-white' 
                            : 'border-slate-300 group-hover:border-solar/40'
                        }`}>
                          {selectedBrand === brand && <Check className="w-3 h-3" />}
                        </div>
                        <span className={`text-sm ${selectedBrand === brand ? 'font-bold text-carbon' : 'text-titanium/80 group-hover:text-carbon'}`}>
                          {brand}
                        </span>
                        <input 
                          type="radio" 
                          name="brand" 
                          className="hidden" 
                          checked={selectedBrand === brand}
                          onChange={() => handleBrandChange(brand)}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Products Grid */}
          <div className="w-full lg:w-3/4">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} wide />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                <h2 className="text-xl font-bold text-carbon mb-2">لا توجد منتجات</h2>
                <p className="text-slate-500">عذراً، لا توجد منتجات تطابق بحثك في هذا القسم.</p>
                <button 
                  onClick={handleResetFilters}
                  className="inline-block mt-6 bg-solar text-white px-6 py-2 rounded-xl font-bold hover:bg-solar/90 transition-colors"
                >
                  عرض جميع منتجات القسم
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
