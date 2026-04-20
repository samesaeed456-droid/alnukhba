import React, { useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronLeft, Clock, CheckCircle2, Truck, MapPin, ArrowRight, ExternalLink, X, ChevronRight, ShoppingBag, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../context/StoreContext';
import PriceDisplay from '../components/PriceDisplay';

export default function Orders() {
  const { orders, formatPrice, user } = useStore();

  const userOrders = useMemo(() => {
    // If admin, we have all orders in 'orders', so we must filter by user ID.
    // If normal user, the context already filtered them by uid via Firestore query.
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
      className="max-w-7xl mx-auto px-4 py-6 sm:py-8 mb-20"
    >
      <div className="flex items-center justify-between mb-6">
        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <Link to="/profile" className="p-2 bg-white rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors shadow-sm">
            <ChevronRight className="w-5 h-5 text-carbon" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-carbon">طلباتي</h1>
            <p className="text-xs text-titanium/60 mt-0.5">سجل مشترياتك وتتبع الطلبات</p>
          </div>
        </motion.div>
      </div>

      {userOrders.length === 0 ? (
        <motion.div 
          variants={itemVariants}
          className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-slate-100 shadow-sm"
        >
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <ShoppingBag className="w-8 h-8 text-slate-300" />
          </div>
          <h2 className="text-lg font-bold text-carbon mb-2">لا توجد طلبات بعد</h2>
          <p className="text-sm text-titanium/60 mb-6">ابدأ التسوق الآن وأضف منتجاتك المفضلة للسلة</p>
          <Link to="/" className="inline-flex items-center gap-2 bg-carbon hover:bg-carbon/90 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors shadow-sm">
            تصفح المنتجات
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userOrders.map((order) => (
            <motion.div 
              key={order.id}
              variants={itemVariants}
              className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm flex flex-col"
            >
              {/* Order Header */}
              <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm shrink-0">
                    <Package className="w-5 h-5 text-carbon" />
                  </div>
                  <div>
                    <div className="font-bold text-carbon text-sm">طلب #{order.id}</div>
                    <div className="text-xs text-titanium/60 mt-0.5">{new Date((order.date as any)?.seconds ? (order.date as any).seconds * 1000 : order.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span>{getStatusText(order.status)}</span>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="p-4 flex-1">
                <div className="flex -space-x-2 space-x-reverse mb-3">
                  {order.items?.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="w-10 h-10 rounded-lg border-2 border-white bg-slate-50 overflow-hidden relative z-10 shadow-sm">
                      <img src={item.product?.image || undefined} alt={item.product?.name || 'محذوف'} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {(order.items?.length || 0) > 4 && (
                    <div className="w-10 h-10 rounded-lg border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 relative z-0 shadow-sm">
                      +{(order.items?.length || 0) - 4}
                    </div>
                  )}
                </div>
                <div className="text-xs text-titanium/80 line-clamp-1">
                  {order.items?.map(i => i.product?.name || 'منتج محذوف غير متوفر').join('، ')}
                </div>
              </div>

              {/* Order Footer */}
              <div className="p-4 border-t border-slate-50 bg-slate-50/30 flex items-center justify-between mt-auto">
                <div>
                  <div className="text-[10px] font-bold text-titanium/60 mb-0.5">الإجمالي</div>
                  <PriceDisplay 
                    price={order.total} 
                    numberClassName="text-sm font-black text-carbon"
                    currencyClassName="text-[10px] text-titanium font-bold"
                  />
                </div>
                
                <Link 
                  to={`/track-order?id=${order.id}`}
                  className="flex items-center gap-1.5 bg-white text-carbon px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
                >
                  التفاصيل والتتبع
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
