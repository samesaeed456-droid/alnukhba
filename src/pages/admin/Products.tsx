import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Plus, Search, Edit, Trash2, X, Upload, 
  Image as ImageIcon, Filter, ChevronDown, Download, 
  CheckCircle2, AlertCircle, Package, DollarSign, 
  TrendingUp, BarChart3, ArrowUpDown,
  LayoutGrid, List, Eye, Copy, ExternalLink,
  Settings, ShieldCheck, Globe, Tag, TrendingDown, Layout, Star,
  Zap, ArrowUpRight, Layers, History,
  Save, RefreshCw, Check
} from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { toast } from 'sonner';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import ConfirmationModal from '../../components/ConfirmationModal';
import { FloatingInput } from '../../components/FloatingInput';

const PREDEFINED_COLORS = [
  { name: 'أسود', value: '#000000' },
  { name: 'أبيض', value: '#FFFFFF' },
  { name: 'فضي', value: '#C0C0C0' },
  { name: 'رمادي', value: '#808080' },
  { name: 'أحمر', value: '#EF4444' },
  { name: 'أزرق', value: '#3B82F6' },
  { name: 'كحلي', value: '#1E3A8A' },
  { name: 'أخضر', value: '#10B981' },
  { name: 'أصفر', value: '#EAB308' },
  { name: 'ذهبي', value: '#D4AF37' },
  { name: 'برتقالي', value: '#F97316' },
  { name: 'وردي', value: '#EC4899' },
  { name: 'بنفسجي', value: '#8B5CF6' },
  { name: 'بني', value: '#78350F' },
];

export default function Products() {
  const { 
    products, deleteProduct, addProduct, updateProduct, formatPrice,
    inventoryLogs, bulkUpdateStock, categories 
  } = useStore();

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setIsModalOpen(true);
      setEditingProduct(null);
      setFormData({
        name: '',
        brand: '',
        category: '',
        price: 0,
        originalPrice: 0,
        description: '',
        image: '',
        images: [],
        inStock: true,
        costPrice: 0,
        minStock: 5,
        metaTitle: '',
        metaDescription: '',
        rating: 5.0,
        reviews: 0,
        colors: [],
        sizes: [],
        specs: {},
        sku: '',
        status: 'active'
      });
      // Clear the param so it doesn't reopen on refresh
      searchParams.delete('add');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const renderPrice = (price: number, className?: string) => {
    const formatted = formatPrice(price);
    const lastSpaceIndex = formatted.lastIndexOf(' ');
    if (lastSpaceIndex === -1) return <span className={className}>{formatted}</span>;
    
    const value = formatted.substring(0, lastSpaceIndex);
    const symbol = formatted.substring(lastSpaceIndex + 1);
    
    return (
      <span className={className}>
        {value}
        <span className="text-[0.4em] font-bold mr-1 text-slate-400 uppercase tracking-normal">{symbol}</span>
      </span>
    );
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('الكل');
  const [stockFilter, setStockFilter] = useState('الكل');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stockCount' | 'rating'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [stockEdits, setStockEdits] = useState<Record<string, number>>({});
  const [isSavingStock, setIsSavingStock] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    brand: '',
    category: '',
    price: 0,
    originalPrice: 0,
    description: '',
    image: '',
    images: [],
    inStock: true,
    costPrice: 0,
    minStock: 5,
    metaTitle: '',
    metaDescription: '',
    rating: 5.0,
    reviews: 0,
    colors: [],
    sizes: [],
    specs: {},
    sku: '',
    status: 'active'
  });

  // Stats Calculations
  const stats = useMemo(() => {
    const total = products.length;
    const lowStock = products.filter(p => p.inStock && (p.stockCount || 0) <= (p.minStock || 5)).length;
    const outOfStock = products.filter(p => (p.stockCount || 0) === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * (p.stockCount || 0)), 0);
    return { total, lowStock, outOfStock, totalValue };
  }, [products]);

  const filterCategories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['الكل', ...Array.from(cats)];
  }, [products]);

  const handleStockChange = (productId: string, value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setStockEdits(prev => ({ ...prev, [productId]: numValue }));
    }
  };

  const handleSaveStock = async () => {
    const updates = Object.entries(stockEdits).map(([id, stock]) => ({
      productId: id,
      newStock: stock
    }));

    if (updates.length === 0) return;

    setIsSavingStock(true);
    bulkUpdateStock(updates, 'تحديث سريع من لوحة التحكم');
    setStockEdits({});
    setIsSavingStock(false);
  };

  const hasStockChanges = Object.keys(stockEdits).length > 0;

  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        const matchesSearch = (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (product.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (product.brand || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = categoryFilter === 'الكل' || product.category === categoryFilter;
        const matchesStock = stockFilter === 'الكل' || 
                           (stockFilter === 'متوفر' && product.inStock) ||
                           (stockFilter === 'منخفض' && product.inStock && (product.stockCount || 0) <= (product.minStock || 5)) ||
                           (stockFilter === 'نفذت' && !product.inStock);
        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') comparison = a.name.localeCompare(b.name);
        if (sortBy === 'price') comparison = a.price - b.price;
        if (sortBy === 'stockCount') comparison = (a.stockCount || 0) - (b.stockCount || 0);
        if (sortBy === 'rating') comparison = a.rating - b.rating;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [products, searchTerm, categoryFilter, stockFilter, sortBy, sortOrder]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const toggleSelectProduct = (id: string) => {
    setSelectedProducts(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData(product);
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        brand: '',
        category: '',
        price: 0,
        originalPrice: 0,
        description: '',
        image: '',
        images: [],
        inStock: true,
        costPrice: 0,
        minStock: 5,
        metaTitle: '',
        metaDescription: '',
        rating: 5.0,
        reviews: 0,
        colors: [],
        sizes: [],
        specs: {},
        sku: '',
        status: 'active'
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-generate SKU if not provided
    let finalFormData = { ...formData };
    if (!finalFormData.sku) {
      const categoryPrefix = finalFormData.category ? finalFormData.category.substring(0, 3).toUpperCase() : 'PRD';
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      finalFormData.sku = `${categoryPrefix}-${randomNum}`;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, finalFormData);
    } else {
      addProduct(finalFormData as Omit<Product, 'id'>);
    }
    handleCloseModal();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        toast.info("جاري رفع الصورة للخادم...");
        const { uploadToCloudinary } = await import('../../lib/cloudinary');
        const secureUrl = await uploadToCloudinary(file);
        setFormData(prev => ({ ...prev, image: secureUrl }));
        toast.success("تم الرفع بنجاح");
      } catch (error: any) {
        console.error("Image upload failed:", error);
        toast.error(error.message || "فشل في رفع الصورة");
      }
    }
  };

  const handleGalleryChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      try {
        toast.info(`جاري رفع ${files.length} صور للخادم...`);
        const { uploadToCloudinary } = await import('../../lib/cloudinary');
        const secureUrls = await Promise.all(files.map(file => uploadToCloudinary(file)));
        setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...secureUrls] }));
        toast.success("تم تجهيز الصور بنجاح");
      } catch (error: any) {
        console.error("Gallery images upload failed:", error);
        toast.error(error.message || "فشل في رفع بعض الصور");
      }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full pb-32 bg-bg-general min-h-screen relative font-sans pt-4 sm:pt-8" 
      dir="rtl"
    >
      {/* Page Title Section */}
      <div className="px-2 sm:px-8 lg:px-12 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-solar/10 flex items-center justify-center text-solar border border-solar/20 shadow-sm">
            <Package className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-carbon tracking-tight">إدارة المنتجات والمخزون</h1>
            <p className="text-xs font-bold text-slate-400 mt-1">تحكم شامل في منتجاتك، أسعارك، وحركة مخزونك بذكاء</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-carbon text-white px-7 py-3 rounded-2xl font-bold hover:bg-carbon/90 transition-all shadow-xl shadow-carbon/20 active:scale-95 border border-white/10"
          >
            <Plus className="w-5 h-5 text-solar" />
            <span className="text-xs uppercase tracking-widest">إضافة منتج</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="px-2 sm:px-8 lg:px-12 mb-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => {
              setStockFilter('الكل');
              setCategoryFilter('الكل');
              setSearchTerm('');
            }}
            className="bg-white p-4 sm:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center sm:items-start text-center sm:text-right group hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 cursor-pointer"
          >
            <div className="flex justify-between items-start w-full mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <Package className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="bg-slate-50 text-slate-500 px-2 py-1 rounded-full text-[8px] sm:text-[10px] font-black tracking-wider flex items-center gap-1">
                <span>الكل</span>
              </div>
            </div>
            <div className="w-full">
              <span className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-widest block mb-1">إجمالي المنتجات</span>
              <div className="flex items-baseline justify-center sm:justify-start gap-1">
                <span className="text-xl sm:text-2xl font-black text-slate-900">{stats.total}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => setStockFilter('منخفض')}
            className="bg-white p-4 sm:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center sm:items-start text-center sm:text-right group hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-500 cursor-pointer"
          >
            <div className="flex justify-between items-start w-full mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="bg-orange-50 text-orange-600 px-2 py-1 rounded-full text-[8px] sm:text-[10px] font-black tracking-wider flex items-center gap-1">
                <span>تنبيه</span>
              </div>
            </div>
            <div className="w-full">
              <span className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-widest block mb-1">مخزون منخفض</span>
              <div className="flex items-baseline justify-center sm:justify-start gap-1">
                <span className="text-xl sm:text-2xl font-black text-slate-900">{stats.lowStock}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => setStockFilter('نفذت')}
            className="bg-white p-4 sm:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center sm:items-start text-center sm:text-right group hover:shadow-xl hover:shadow-red-500/10 transition-all duration-500 cursor-pointer"
          >
            <div className="flex justify-between items-start w-full mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="bg-red-50 text-red-600 px-2 py-1 rounded-full text-[8px] sm:text-[10px] font-black tracking-wider flex items-center gap-1">
                <span>نفذت</span>
              </div>
            </div>
            <div className="w-full">
              <span className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-widest block mb-1">غير متوفرة</span>
              <div className="flex items-baseline justify-center sm:justify-start gap-1">
                <span className="text-xl sm:text-2xl font-black text-slate-900">{stats.outOfStock}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-4 sm:p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center sm:items-start text-center sm:text-right group hover:shadow-xl hover:shadow-green-500/10 transition-all duration-500"
          >
            <div className="flex justify-between items-start w-full mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="bg-green-50 text-green-600 px-2 py-1 rounded-full text-[8px] sm:text-[10px] font-black tracking-wider flex items-center gap-1">
                <span>القيمة</span>
              </div>
            </div>
            <div className="w-full">
              <span className="text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-widest block mb-1">إجمالي المخزون</span>
              <div className="flex items-baseline justify-center sm:justify-start gap-1">
                <span className="text-xl sm:text-2xl font-black text-slate-900">{formatPrice(stats.totalValue)}</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Content Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
            {/* Filters & Search - Refined */}
            <div className="px-2 sm:px-8 lg:px-12 mb-6 sm:mb-8">
              <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[32px] border border-bg-hover shadow-sm space-y-4 sm:space-y-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-focus-within:text-solar transition-all duration-300" />
                    <input
                      type="text"
                      placeholder="البحث بالاسم، الفئة، أو العلامة التجارية..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 sm:pl-12 pr-4 sm:pr-6 py-3 sm:py-4 rounded-xl sm:rounded-[20px] bg-bg-general border border-transparent focus:bg-white focus:ring-[6px] focus:ring-solar/5 focus:border-solar/30 outline-none transition-all duration-300 font-bold text-carbon placeholder:text-slate-300 text-xs sm:text-sm"
                    />
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    {/* Save Changes Button (Visible when stock edits exist) */}
                    <AnimatePresence>
                      {hasStockChanges && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.8, x: 20 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.8, x: 20 }}
                          onClick={handleSaveStock}
                          disabled={isSavingStock}
                          className="flex items-center gap-2 bg-carbon text-white px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest shadow-xl shadow-carbon/20 hover:scale-105 active:scale-95 transition-all"
                        >
                          {isSavingStock ? <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" /> : <Save className="w-3 h-3 sm:w-4 sm:h-4 text-solar" />}
                          <span>حفظ ({Object.keys(stockEdits).length})</span>
                        </motion.button>
                      )}
                    </AnimatePresence>

                    <div className="flex items-center gap-1 sm:gap-2 bg-bg-general p-1 sm:p-1.5 rounded-xl sm:rounded-2xl border border-bg-hover">
                      <button 
                        onClick={() => setViewMode('table')}
                        className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-solar' : 'text-slate-500 hover:text-carbon'}`}
                      >
                        <List className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-solar' : 'text-slate-500 hover:text-carbon'}`}
                      >
                        <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>

                    <div className="relative group flex-1 sm:flex-none">
                      <Filter className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-slate-500 pointer-events-none" />
                      <select 
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full sm:w-auto pl-8 sm:pl-10 pr-4 sm:pr-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-bg-general border border-transparent hover:border-bg-hover font-bold text-carbon outline-none focus:ring-4 focus:ring-solar/10 appearance-none transition-all cursor-pointer min-w-[100px] sm:min-w-[140px] text-[10px] sm:text-xs"
                      >
                        {filterCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-slate-500 pointer-events-none" />
                    </div>

                    <div className="relative group flex-1 sm:flex-none">
                      <ShieldCheck className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-slate-500 pointer-events-none" />
                      <select 
                        value={stockFilter}
                        onChange={(e) => setStockFilter(e.target.value)}
                        className="w-full sm:w-auto pl-8 sm:pl-10 pr-4 sm:pr-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-bg-general border border-transparent hover:border-bg-hover font-bold text-carbon outline-none focus:ring-4 focus:ring-solar/10 appearance-none transition-all cursor-pointer min-w-[100px] sm:min-w-[140px] text-[10px] sm:text-xs"
                      >
                        <option value="الكل">جميع الحالات</option>
                        <option value="متوفر">متوفر</option>
                        <option value="منخفض">مخزون منخفض</option>
                        <option value="نفذت">نفذت الكمية</option>
                      </select>
                      <ChevronDown className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Products List */}
            <div className="px-2 sm:px-8 lg:px-12">
              {viewMode === 'table' ? (
                <div className="bg-white rounded-2xl sm:rounded-[32px] border border-bg-hover shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    {/* Desktop Table */}
                    <table className="w-full text-right hidden md:table">
                      <thead>
                      <tr className="bg-bg-general/50 text-slate-500 text-[10px] uppercase tracking-[0.25em] border-b border-bg-hover">
                        <th className="p-8 w-12">
                          <input 
                            type="checkbox" 
                            checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                            onChange={toggleSelectAll}
                            className="w-5 h-5 rounded-lg border-slate-300 text-solar focus:ring-solar/20 transition-all cursor-pointer bg-white"
                          />
                        </th>
                        <th className="p-8 font-black cursor-pointer hover:text-carbon transition-colors" onClick={() => toggleSort('name')}>
                          <div className="flex items-center gap-2">
                            المنتج
                            <ArrowUpDown className="w-3 h-3 text-solar" />
                          </div>
                        </th>
                        <th className="p-8 font-black">الفئة</th>
                        <th className="p-8 font-black cursor-pointer hover:text-carbon transition-colors" onClick={() => toggleSort('price')}>
                          <div className="flex items-center gap-2">
                            السعر
                            <ArrowUpDown className="w-3 h-3 text-solar" />
                          </div>
                        </th>
                        <th className="p-8 font-black cursor-pointer hover:text-carbon transition-colors" onClick={() => toggleSort('stockCount')}>
                          <div className="flex items-center gap-2">
                            المخزون
                            <ArrowUpDown className="w-3 h-3 text-solar" />
                          </div>
                        </th>
                        <th className="p-8 font-black">تحديث سريع</th>
                        <th className="p-8 font-black text-center">الإجراءات</th>
                      </tr>
                      </thead>
                      <tbody className="divide-y divide-bg-hover">
                        <AnimatePresence mode="popLayout">
                          {filteredProducts.map((product) => (
                            <motion.tr 
                              layout
                              key={product.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className={`group hover:bg-bg-general/50 transition-all ${selectedProducts.includes(product.id) ? 'bg-solar/5' : ''}`}
                            >
                              <td className="p-6">
                                <input 
                                  type="checkbox" 
                                  checked={selectedProducts.includes(product.id)}
                                  onChange={() => toggleSelectProduct(product.id)}
                                  className="w-5 h-5 rounded-lg border-slate-300 text-solar focus:ring-solar transition-all cursor-pointer"
                                />
                              </td>
                              <td className="p-6">
                                <div className="flex items-center gap-4">
                                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden border border-bg-hover group-hover:scale-105 transition-transform shadow-sm">
                                    <img src={product.image || undefined} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                  </div>
                                  <div>
                                    <p className="font-black text-carbon line-clamp-1 text-sm">{product.name}</p>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{product.brand}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-6">
                                <span className="inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black bg-bg-general text-slate-500 uppercase tracking-widest">
                                  {product.category}
                                </span>
                              </td>
                              <td className="p-6">
                                <div className="flex flex-col">
                                  {renderPrice(product.price, "font-black text-carbon text-base")}
                                  {product.originalPrice && (
                                    <span className="text-[10px] text-slate-400 line-through font-bold">{formatPrice(product.originalPrice)}</span>
                                  )}
                                </div>
                              </td>
                              <td className="p-6">
                                <div className="flex flex-col gap-2 min-w-[120px]">
                                  <div className="flex items-center justify-between">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                                      (product.stockCount || 0) > (product.minStock || 5) ? 'text-emerald-500' : 
                                      (product.stockCount || 0) > 0 ? 'text-amber-500' : 'text-red-500'
                                    }`}>
                                      {product.inStock ? `${product.stockCount} قطعة` : 'نفذت الكمية'}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-bold">
                                      {Math.min(100, ((product.stockCount || 0) / 100) * 100).toFixed(0)}%
                                    </span>
                                  </div>
                                  <div className="h-1.5 w-full bg-bg-general rounded-full overflow-hidden">
                                    <motion.div 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${Math.min(100, ((product.stockCount || 0) / 100) * 100)}%` }}
                                      className={`h-full rounded-full ${
                                        (product.stockCount || 0) > (product.minStock || 5) ? 'bg-emerald-500' : 
                                        (product.stockCount || 0) > 0 ? 'bg-amber-500' : 'bg-red-500'
                                      }`}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="p-6">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    value={stockEdits[product.id] ?? product.stockCount ?? 0}
                                    onChange={(e) => handleStockChange(product.id, e.target.value)}
                                    className={`w-20 px-3 py-2 rounded-xl border-2 font-mono text-center font-black focus:outline-none transition-all text-xs ${
                                      stockEdits[product.id] !== undefined
                                        ? 'border-solar bg-solar/5 text-carbon shadow-inner'
                                        : 'border-bg-hover bg-bg-general text-slate-500'
                                    }`}
                                  />
                                  {stockEdits[product.id] !== undefined && (
                                    <button 
                                      onClick={() => {
                                        const newEdits = { ...stockEdits };
                                        delete newEdits[product.id];
                                        setStockEdits(newEdits);
                                      }}
                                      className="p-1 text-red-400 hover:text-red-600 transition-colors"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="p-6">
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => handleOpenModal(product)}
                                    className="p-2.5 text-solar hover:bg-solar/10 rounded-xl transition-all"
                                    title="تعديل"
                                  >
                                    <Edit className="w-5 h-5" />
                                  </button>
                                  <button 
                                    className="p-2.5 text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                                    title="عرض في المتجر"
                                  >
                                    <ExternalLink className="w-5 h-5" />
                                  </button>
                                  <button 
                                    onClick={() => setItemToDelete(product.id)}
                                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    title="حذف"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>

                    {/* Mobile List View (Table Mode) */}
                    <div className="md:hidden divide-y divide-bg-hover">
                      {filteredProducts.map((product) => (
                        <div key={product.id} className="p-4 flex flex-col gap-4">
                          <div className="flex items-center gap-4">
                            <input 
                              type="checkbox" 
                              checked={selectedProducts.includes(product.id)}
                              onChange={() => toggleSelectProduct(product.id)}
                              className="w-5 h-5 rounded-lg border-slate-300 text-solar"
                            />
                            <img src={product.image || undefined} alt={product.name} className="w-12 h-12 rounded-xl object-cover border border-bg-hover" referrerPolicy="no-referrer" />
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-carbon text-sm truncate">{product.name}</p>
                              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{product.brand}</p>
                            </div>
                            <div className="flex flex-col items-end">
                              {renderPrice(product.price, "font-black text-carbon text-sm")}
                              <span className="text-[9px] text-slate-400 font-bold">{product.category}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between gap-4 bg-bg-general/50 p-3 rounded-xl">
                            <div className="flex-1">
                              <div className="flex justify-between mb-1">
                                <span className={`text-[9px] font-black uppercase tracking-widest ${
                                  (product.stockCount || 0) > (product.minStock || 5) ? 'text-emerald-500' : 
                                  (product.stockCount || 0) > 0 ? 'text-amber-500' : 'text-red-500'
                                }`}>
                                  المخزون: {product.stockCount}
                                </span>
                              </div>
                              <div className="h-1 w-full bg-bg-general rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${
                                    (product.stockCount || 0) > (product.minStock || 5) ? 'bg-emerald-500' : 
                                    (product.stockCount || 0) > 0 ? 'bg-amber-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(100, ((product.stockCount || 0) / 100) * 100)}%` }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                value={stockEdits[product.id] ?? product.stockCount ?? 0}
                                onChange={(e) => handleStockChange(product.id, e.target.value)}
                                className={`w-14 px-2 py-1.5 rounded-lg border text-center font-mono text-[10px] font-black focus:outline-none transition-all ${
                                  stockEdits[product.id] !== undefined
                                    ? 'border-solar bg-solar/10 text-carbon'
                                    : 'border-bg-hover bg-white text-slate-500'
                                }`}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleOpenModal(product)}
                              className="flex-1 py-2 bg-solar/10 text-solar rounded-xl text-[10px] font-black uppercase tracking-widest"
                            >
                              تعديل
                            </button>
                            <button 
                              onClick={() => setItemToDelete(product.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-8">
                  <AnimatePresence mode="popLayout">
                    {filteredProducts.map((product) => (
                      <motion.div
                        layout
                        key={product.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-white rounded-2xl sm:rounded-[40px] border border-bg-hover shadow-sm overflow-hidden group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 flex flex-col"
                      >
                        <div className="relative aspect-[4/5] overflow-hidden">
                          <img src={product.image || undefined} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-gradient-to-t from-carbon/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                          
                          <div className="absolute top-3 sm:top-5 right-3 sm:right-5 flex flex-col gap-2 sm:gap-3 transition-all duration-500 opacity-0 group-hover:opacity-100 translate-x-10 group-hover:translate-x-0">
                            <button 
                              onClick={() => handleOpenModal(product)}
                              className="p-2 sm:p-3 bg-white text-solar rounded-xl sm:rounded-2xl shadow-xl hover:bg-solar hover:text-white transition-all active:scale-90"
                            >
                              <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                            <button 
                              onClick={() => setItemToDelete(product.id)}
                              className="p-2 sm:p-3 bg-white text-red-500 rounded-xl sm:rounded-2xl shadow-xl hover:bg-red-500 hover:text-white transition-all active:scale-90"
                            >
                              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                          </div>

                          {!product.inStock && (
                            <div className="absolute inset-0 bg-carbon/40 backdrop-blur-[4px] flex items-center justify-center">
                              <span className="bg-white px-3 sm:px-6 py-1 sm:py-2 rounded-full text-[8px] sm:text-[10px] font-black text-red-600 shadow-2xl uppercase tracking-widest">نفذت</span>
                            </div>
                          )}

                          <div className="absolute bottom-3 sm:bottom-5 left-3 sm:left-5 right-3 sm:right-5 flex flex-col gap-2 sm:gap-3 translate-y-10 group-hover:translate-y-0 transition-transform duration-500">
                            <div className="bg-white/90 backdrop-blur-md p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-xl border border-white/20">
                              <div className="flex items-center justify-between mb-1 sm:mb-2">
                                <span className={`text-[7px] sm:text-[9px] font-black uppercase tracking-widest ${
                                  (product.stockCount || 0) > (product.minStock || 5) ? 'text-emerald-500' : 
                                  (product.stockCount || 0) > 0 ? 'text-amber-500' : 'text-red-500'
                                }`}>
                                  {product.inStock ? `المخزون: ${product.stockCount}` : 'نفذت'}
                                </span>
                                <div className="flex items-center gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    value={stockEdits[product.id] ?? product.stockCount ?? 0}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => handleStockChange(product.id, e.target.value)}
                                    className={`w-10 sm:w-16 px-1 py-0.5 sm:px-2 sm:py-1 rounded-lg border text-center font-mono text-[8px] sm:text-[10px] font-black focus:outline-none transition-all ${
                                      stockEdits[product.id] !== undefined
                                        ? 'border-solar bg-solar/10 text-carbon'
                                        : 'border-transparent bg-bg-general text-slate-500'
                                    }`}
                                  />
                                </div>
                              </div>
                              <div className="h-1 w-full bg-bg-general rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-1000 ${
                                    (product.stockCount || 0) > (product.minStock || 5) ? 'bg-emerald-500' : 
                                    (product.stockCount || 0) > 0 ? 'bg-amber-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(100, ((product.stockCount || 0) / 100) * 100)}%` }}
                                />
                              </div>
                            </div>
                            <button className="w-full py-2 sm:py-3 bg-solar text-white rounded-xl sm:rounded-2xl font-black text-[8px] sm:text-[10px] uppercase tracking-widest shadow-gold active:scale-95 transition-all">
                              التفاصيل
                            </button>
                          </div>
                        </div>
                        <div className="p-3 sm:p-6 flex-1 flex flex-col">
                          <div className="flex items-center justify-between mb-2 sm:mb-3">
                            <span className="text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400">{product.category}</span>
                            <div className="flex items-center gap-1 text-amber-400 bg-amber-50 px-1.5 py-0.5 rounded-lg">
                              <Star className="w-2 h-2 sm:w-3 sm:h-3 fill-current" />
                              <span className="text-[9px] sm:text-[11px] font-black text-carbon">{product.rating}</span>
                            </div>
                          </div>
                          <h3 className="font-black text-carbon text-xs sm:text-lg line-clamp-1 group-hover:text-solar transition-colors duration-300">{product.name}</h3>
                          <div className="mt-auto pt-3 sm:pt-4 flex items-center justify-between">
                            <div className="flex flex-col">
                              {renderPrice(product.price, "text-sm sm:text-xl font-black text-carbon")}
                              {product.originalPrice && (
                                <span className="text-[8px] sm:text-[10px] text-slate-400 line-through font-bold">{formatPrice(product.originalPrice)}</span>
                              )}
                            </div>
                            <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-bg-general flex items-center justify-center text-slate-400 group-hover:bg-solar/10 group-hover:text-solar transition-all">
                              <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="px-4 sm:px-8 lg:px-12">
          <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[40px] border-2 border-dashed border-bg-hover">
            <div className="w-24 h-24 bg-bg-general rounded-full flex items-center justify-center mb-6 shadow-inner">
              <Package className="w-10 h-10 text-slate-200" />
            </div>
            <h3 className="text-2xl font-black text-carbon">لا توجد منتجات</h3>
            <p className="text-slate-400 mt-2 font-bold text-xs uppercase tracking-widest">جرب تغيير معايير البحث أو إضافة منتج جديد لمتجرك</p>
            <button 
              onClick={() => handleOpenModal()}
              className="mt-8 px-8 py-3.5 bg-carbon text-white rounded-2xl font-black shadow-xl shadow-carbon/20 hover:bg-carbon/90 transition-all active:scale-95 text-xs uppercase tracking-widest border border-white/10"
            >
              إضافة منتج جديد
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0 bg-carbon/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2rem] shadow-2xl w-full max-w-lg lg:max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-solar shadow-sm border border-slate-100">
                    {editingProduct ? <Edit className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  </div>
                  <h2 className="text-lg font-black text-carbon tracking-tight">
                    {editingProduct ? 'تعديل المنتج' : 'إضافة منتج جديد'}
                  </h2>
                </div>
                <button 
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-slate-200 rounded-xl transition-all text-slate-400 hover:text-carbon"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left Column: Images */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="flex flex-col items-center gap-4">
                      <label className="flex flex-col items-center justify-center w-full aspect-square max-w-[280px] border-2 border-slate-200 border-dashed rounded-3xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all relative overflow-hidden group shadow-sm">
                        {formData.image ? (
                          <>
                            <img src={formData.image || undefined} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-carbon/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Upload className="w-6 h-6 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">صورة المنتج الرئيسية</span>
                          </div>
                        )}
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>

                      <div className="w-full">
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3">معرض الصور</label>
                        <div className="grid grid-cols-3 gap-2">
                          {formData.images?.map((img, idx) => (
                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                              <img src={img || undefined} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                              <button 
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, images: prev.images?.filter((_, i) => i !== idx) }))}
                                className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          <label className="flex flex-col items-center justify-center aspect-square border-2 border-slate-200 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all text-slate-400">
                            <Plus className="w-5 h-5" />
                            <input type="file" className="hidden" accept="image/*" multiple onChange={handleGalleryChange} />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Details */}
                  <div className="lg:col-span-8 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <FloatingInput 
                          id="productName"
                          label="اسم المنتج"
                          type="text" 
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          bgClass="bg-slate-50"
                          placeholder="مثال: آيفون 15 برو"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">الفئة</label>
                        <div className="relative">
                          <select 
                            required
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-solar/20 focus:border-solar outline-none transition-all font-bold text-carbon text-sm appearance-none pr-10"
                          >
                            <option value="">اختر الفئة...</option>
                            {categories.filter(c => c.isActive).map(cat => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">حالة المنتج</label>
                        <div className="relative">
                          <select 
                            value={formData.status || 'active'}
                            onChange={(e) => setFormData({...formData, status: e.target.value as 'active' | 'draft'})}
                            className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-solar/20 focus:border-solar outline-none transition-all font-bold text-carbon text-sm appearance-none pr-10"
                          >
                            <option value="active">نشط (مرئي)</option>
                            <option value="draft">مسودة (مخفي)</option>
                          </select>
                          <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <FloatingInput 
                          id="productPrice"
                          label="السعر (ر.س)"
                          type="number" 
                          required
                          min="0"
                          value={formData.price || ''}
                          onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                          bgClass="bg-slate-50"
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <FloatingInput 
                          id="productOriginalPrice"
                          label="السعر قبل الخصم"
                          type="number" 
                          min="0"
                          value={formData.originalPrice || ''}
                          onChange={(e) => setFormData({...formData, originalPrice: Number(e.target.value)})}
                          bgClass="bg-slate-50"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <FloatingInput 
                          id="productStock"
                          label="الكمية المتوفرة"
                          type="number" 
                          min="0"
                          value={formData.stockCount || ''}
                          onChange={(e) => setFormData({...formData, stockCount: Number(e.target.value), inStock: Number(e.target.value) > 0})}
                          bgClass="bg-slate-50"
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <FloatingInput 
                          id="productMinStock"
                          label="الحد الأدنى للتنبيه"
                          type="number" 
                          min="0"
                          value={formData.minStock || ''}
                          onChange={(e) => setFormData({...formData, minStock: Number(e.target.value)})}
                          bgClass="bg-slate-50"
                          placeholder="5"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">الألوان المتوفرة</label>
                        
                        {/* Display Selected Colors */}
                        <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
                          {formData.colors?.map((color, index) => {
                            const knownColor = PREDEFINED_COLORS.find(c => c.name === color || c.value === color);
                            return (
                              <div key={index} className="flex items-center gap-1.5 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full text-xs font-bold text-carbon">
                                {knownColor && (
                                  <span className="w-2.5 h-2.5 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: knownColor.value }} />
                                )}
                                {!knownColor && typeof color === 'string' && color.startsWith('#') && (
                                  <span className="w-2.5 h-2.5 rounded-full border border-slate-300 shadow-sm" style={{ backgroundColor: color }} />
                                )}
                                <span>{knownColor ? knownColor.name : color}</span>
                                <button 
                                  type="button"
                                  onClick={() => setFormData({...formData, colors: formData.colors?.filter((_, i) => i !== index)})}
                                  className="text-slate-400 hover:text-red-500 transition-colors ml-1"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            );
                          })}
                          {(!formData.colors || formData.colors.length === 0) && (
                            <span className="text-xs text-slate-400 font-medium py-1">لم يتم اختيار ألوان</span>
                          )}
                        </div>
                        
                        {/* Color Picker Palette */}
                        <div className="flex flex-wrap gap-2 mb-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                          {PREDEFINED_COLORS.map((c) => {
                            const isSelected = formData.colors?.includes(c.name);
                            return (
                              <button
                                key={c.value}
                                type="button"
                                title={c.name}
                                onClick={() => {
                                  if (!isSelected) {
                                    setFormData({...formData, colors: [...(formData.colors || []), c.name]});
                                  } else {
                                    setFormData({...formData, colors: formData.colors?.filter(color => color !== c.name)});
                                  }
                                }}
                                className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${isSelected ? 'border-solar scale-110 shadow-md' : 'border-transparent shadow-sm hover:scale-110'}`}
                                style={{ backgroundColor: c.value }}
                              >
                                {isSelected && (
                                  <Check className={`w-3.5 h-3.5 ${c.value === '#FFFFFF' || c.value === '#EAB308' || c.value === '#C0C0C0' ? 'text-black' : 'text-white'}`} />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Custom Color Input */}
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            id="customColorInput"
                            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-solar/20 focus:border-solar outline-none transition-all font-bold text-carbon text-sm"
                            placeholder="إضافة لون مخصص"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = e.currentTarget.value.trim();
                                if (val && !formData.colors?.includes(val)) {
                                  setFormData({...formData, colors: [...(formData.colors || []), val]});
                                  e.currentTarget.value = '';
                                }
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const input = document.getElementById('customColorInput') as HTMLInputElement;
                              const val = input.value.trim();
                              if (val && !formData.colors?.includes(val)) {
                                setFormData({...formData, colors: [...(formData.colors || []), val]});
                                input.value = '';
                              }
                            }}
                            className="bg-carbon text-white px-4 py-2.5 rounded-xl hover:bg-carbon/90 transition-colors flex items-center justify-center shadow-md shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">الأحجام / المقاسات</label>
                        
                        {/* Display existing sizes as tags */}
                        <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
                          {formData.sizes?.map((size, index) => (
                            <span key={index} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-carbon text-sm font-bold border border-slate-200">
                              {size}
                              <button
                                type="button"
                                onClick={() => {
                                  const newSizes = formData.sizes?.filter((_, i) => i !== index);
                                  setFormData({ ...formData, sizes: newSizes });
                                }}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          ))}
                          {(!formData.sizes || formData.sizes.length === 0) && (
                            <span className="text-xs text-slate-400 font-medium py-1">لم يتم إضافة مقاسات</span>
                          )}
                        </div>

                        {/* Input for new size */}
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            id="customSizeInput"
                            className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-solar/20 focus:border-solar outline-none transition-all font-bold text-carbon text-sm"
                            placeholder="إضافة مقاس (مثال: XL)"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                document.getElementById('add-size-btn')?.click();
                              }
                            }}
                          />
                          <button
                            id="add-size-btn"
                            type="button"
                            onClick={() => {
                              const input = document.getElementById('customSizeInput') as HTMLInputElement;
                              const val = input.value.trim();
                              if (val && !formData.sizes?.includes(val)) {
                                setFormData({...formData, sizes: [...(formData.sizes || []), val]});
                                input.value = '';
                              }
                            }}
                            className="bg-carbon text-white px-4 py-2.5 rounded-xl hover:bg-carbon/90 transition-colors flex items-center justify-center shadow-md shrink-0"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">المواصفات التقنية</label>
                      <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        {Object.entries(formData.specs || {}).length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                            {Object.entries(formData.specs || {}).map(([key, value]) => (
                              <div key={key} className="flex items-center justify-between bg-white p-2 px-3 rounded-lg border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="font-bold text-carbon">{key}:</span>
                                  <span className="text-slate-600">{value}</span>
                                </div>
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    const newSpecs = { ...formData.specs };
                                    delete newSpecs[key];
                                    setFormData({ ...formData, specs: newSpecs });
                                  }} 
                                  className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex flex-col md:flex-row gap-2">
                          <input 
                            id="new-spec-key" 
                            type="text"
                            placeholder="اسم المواصفة" 
                            className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-solar/20 focus:border-solar outline-none transition-all text-sm"
                          />
                          <input 
                            id="new-spec-value" 
                            type="text"
                            placeholder="القيمة" 
                            className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 focus:ring-2 focus:ring-solar/20 focus:border-solar outline-none transition-all text-sm"
                          />
                          <button 
                            id="add-spec-btn"
                            type="button" 
                            onClick={() => {
                              const keyInput = document.getElementById('new-spec-key') as HTMLInputElement;
                              const valInput = document.getElementById('new-spec-value') as HTMLInputElement;
                              if (keyInput?.value && valInput?.value) {
                                setFormData({
                                  ...formData,
                                  specs: { ...(formData.specs || {}), [keyInput.value]: valInput.value }
                                });
                                keyInput.value = '';
                                valInput.value = '';
                                keyInput.focus();
                              }
                            }} 
                            className="bg-carbon text-white px-4 py-2 rounded-lg hover:bg-carbon/90 transition-colors text-sm font-bold flex items-center justify-center gap-1 w-full md:w-auto shrink-0"
                          >
                            <Plus className="w-4 h-4" /> إضافة
                          </button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">الوصف (اختياري)</label>
                      <textarea 
                        rows={3}
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-solar/20 focus:border-solar outline-none transition-all font-bold text-carbon text-sm resize-none"
                        placeholder="وصف مختصر للمنتج..."
                      />
                    </div>
                  </div>
                </div>
              </form>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 rounded-xl font-black text-slate-500 hover:bg-slate-200 transition-all text-xs uppercase tracking-widest"
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleSubmit}
                  className="px-8 py-3 rounded-xl font-black bg-carbon text-white hover:bg-carbon/90 transition-all shadow-lg shadow-carbon/20 active:scale-95 text-xs uppercase tracking-widest flex items-center gap-2"
                >
                  {editingProduct ? 'حفظ' : 'إضافة'}
                  <CheckCircle2 className="w-4 h-4 text-solar" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={async () => {
          if (itemToDelete) {
            deleteProduct(itemToDelete);
            setItemToDelete(null);
          }
        }}
        title="حذف المنتج"
        message="هل أنت متأكد من رغبتك في حذف هذا المنتج نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        cancelText="تراجع"
        type="danger"
      />

      <ConfirmationModal
        isOpen={isBulkDeleteModalOpen}
        onClose={() => setIsBulkDeleteModalOpen(false)}
        onConfirm={async () => {
          selectedProducts.forEach(id => deleteProduct(id));
          setSelectedProducts([]);
          setIsBulkDeleteModalOpen(false);
        }}
        title="حذف المنتجات المختارة"
        message={`هل أنت متأكد من حذف ${selectedProducts.length} منتجات؟ سيتم حذف جميع البيانات المتعلقة بها نهائياً.`}
        confirmText="حذف الكل"
        cancelText="تراجع"
        type="danger"
      />

      {/* Floating Batch Actions */}
      <AnimatePresence>
        {selectedProducts.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[96%] max-w-4xl"
          >
            <div className="bg-carbon/90 backdrop-blur-xl border border-white/10 rounded-[28px] p-3 sm:p-4 shadow-2xl flex items-center justify-between gap-3 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-6 pr-2 sm:pr-4 border-l border-white/10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-solar flex items-center justify-center text-white font-black shadow-gold shrink-0">
                  {selectedProducts.length}
                </div>
                <div className="hidden xs:block">
                  <p className="text-white font-black text-[10px] sm:text-sm">مختارة</p>
                  <p className="text-slate-400 text-[8px] sm:text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">إجراءات جماعية</p>
                </div>
              </div>

              <div className="flex items-center gap-1 sm:gap-3 flex-1 justify-center">
                <button className="p-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all group">
                  <Tag className="w-4 h-4 text-solar group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest ml-2">خصم</span>
                </button>
                <button className="p-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all group">
                  <Layers className="w-4 h-4 text-solar group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest ml-2">فئة</span>
                </button>
                <button className="p-2 sm:px-6 sm:py-3 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all group">
                  <Zap className="w-4 h-4 text-solar group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest ml-2">حالة</span>
                </button>
              </div>

              <div className="flex items-center gap-1 sm:gap-3 pl-2 sm:pl-4">
                <button 
                  onClick={() => setIsBulkDeleteModalOpen(true)}
                  className="p-3 sm:p-4 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl sm:rounded-2xl transition-all group"
                  title="حذف الكل"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                </button>
                <button 
                  onClick={() => setSelectedProducts([])}
                  className="p-3 sm:p-4 bg-white/5 hover:bg-white/10 text-white rounded-xl sm:rounded-2xl transition-all"
                  title="إلغاء التحديد"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
