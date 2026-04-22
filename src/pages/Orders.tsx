import React, { useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronLeft, Clock, CheckCircle2, Truck, MapPin, ArrowRight, ExternalLink, X, ChevronRight, ShoppingBag, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import PriceDisplay from '../components/PriceDisplay';

export default function Orders() {
  const { orders, user } = useStore();

  const userOrders = useMemo(() => {
    if (user?.role === 'admin') {
      return orders.filter(o => o.userId === user.uid);
    }
    return orders;
  }, [orders, user]);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'processing': return <Clock className="w-4 h-4" />;
      case 'shipped': return <Truck className="w-4 h-4" />;
      case 'delivered': return <CheckCircle2 className="w-4 h-4" />;
      case 'cancelled': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  }, []);

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'processing': return 'قيد التجهيز';
      case 'shipped': return 'تم الشحن';
      case 'delivered': return 'تم التوصيل';
      case 'cancelled': return 'ملغي';
      default: return 'قيد الانتظار';
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'processing': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'shipped': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'delivered': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12 mb-20"
    >
      <div className="flex items-center justify-between mb-8">
        <motion.div variants={itemVariants} className="flex items-center gap-4">
          <Link to="/profile" className="w-10 h-10 flex items-center justify-center bg-white rounded-xl border border-slate-100 hover:bg-slate-50 transition-all shadow-sm group">
            <ChevronRight className="w-5 h-5 text-carbon group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-carbon tracking-tight">طلباتي</h1>
            <p className="text-xs sm:text-sm text-slate-400 font-bold mt-0.5">سجل مشترياتك وتتبع طلباتك خطوة بخطوة</p>
          </div>
        </motion.div>
      </div>

      {userOrders.length === 0 ? (
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-[2rem] p-10 sm:p-20 text-center border border-slate-100 shadow-xl"
        >
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-inner">
            <ShoppingBag className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-xl font-black text-carbon mb-2">لا توجد طلبات بعد</h2>
          <p className="text-sm text-slate-400 font-bold mb-8 max-w-xs mx-auto">ابدأ التسوق الآن واكتشف أحدث المنتجات والعروض الحصرية التي نقدمها لك.</p>
          <Link to="/" className="inline-flex items-center gap-3 bg-carbon hover:bg-black text-white px-8 py-3.5 rounded-xl text-sm font-black transition-all shadow-lg shadow-carbon/20">
            اذهب للتسوق
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {userOrders.map((order) => (
            <motion.div 
              key={order.id}
              variants={itemVariants}
              className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-xl flex flex-col group hover:border-carbon/20 transition-all"
            >
              <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center shadow-sm shrink-0 group-hover:scale-110 transition-transform">
                    <Package className="w-6 h-6 text-carbon" />
                  </div>
                  <div>
                    <div className="font-black text-carbon text-sm sm:text-base tracking-tight">طلب #{order.id}</div>
                    <div className="text-[10px] sm:text-xs text-slate-400 font-bold mt-1 uppercase" dir="ltr">{new Date((order.date as any)?.seconds ? (order.date as any).seconds * 1000 : order.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-black border uppercase shadow-sm ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span>{getStatusText(order.status)}</span>
                </div>
              </div>

              <div className="p-5 flex-1">
                <div className="flex -space-x-3 space-x-reverse mb-4">
                  {order.items?.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="w-12 h-12 rounded-xl border-2 border-white bg-white overflow-hidden relative z-[5] shadow-lg">
                      <img src={item.product?.image || undefined} alt={item.product?.name || 'محذوف'} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {(order.items?.length || 0) > 5 && (
                    <div className="w-12 h-12 rounded-xl border-2 border-white bg-slate-50 flex items-center justify-center text-xs font-black text-slate-500 relative z-0 shadow-lg">
                      +{(order.items?.length || 0) - 5}
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-500 font-bold line-clamp-1 leading-relaxed">
                  {order.items?.map(i => i.product?.name || 'منتج محذوف').join('، ')}
                </div>
              </div>

              <div className="p-5 border-t border-slate-50 bg-slate-50/50 flex items-center justify-between mt-auto">
                <div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">الإجمالي الكلي</div>
                  <PriceDisplay 
                    price={order.total} 
                    numberClassName="text-base sm:text-lg font-black text-carbon"
                    currencyClassName="text-xs text-solar font-bold"
                  />
                </div>
                
                <Link 
                  to={`/track-order?id=${order.id}`}
                  className="flex items-center gap-2 bg-white text-carbon hover:bg-carbon hover:text-white px-5 py-2.5 rounded-xl text-xs font-black border border-slate-200 transition-all shadow-md active:scale-95"
                >
                  التتبع والتفاصيل
                  <ChevronLeft className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
