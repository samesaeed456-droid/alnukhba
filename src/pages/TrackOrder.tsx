import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Package, Search, Truck, CheckCircle2, Clock, MapPin, ArrowRight, AlertCircle, Zap, CreditCard, Receipt, ShoppingBag, ChevronDown, ChevronUp, Box, Store, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { Order } from '../types';
import { FloatingInput } from '../components/FloatingInput';

export default function TrackOrder() {
  const [searchParams] = useSearchParams();
  const { orders, formatPrice, user, trackOrderById } = useStore();
  
  const [orderId, setOrderId] = useState(searchParams.get('id') || '');
  const [isTracking, setIsTracking] = useState(false);
  const [orderStatus, setOrderStatus] = useState<null | 'not_found' | 'tracking'>(null);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [showItems, setShowItems] = useState(false);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id) {
      performTracking(id);
    }
  }, [searchParams]);

  const performTracking = useCallback(async (trackId: string) => {
    if (!trackId.trim()) return;

    setIsTracking(true);
    setOrderStatus(null);
    setTrackedOrder(null);

    try {
      const foundOrder = await trackOrderById(trackId);
      
      // Artificial delay for professional feel (as requested in original code)
      await new Promise(resolve => setTimeout(resolve, 1200));

      setIsTracking(false);
      if (foundOrder) {
        setTrackedOrder(foundOrder);
        setOrderStatus('tracking');
      } else {
        setOrderStatus('not_found');
      }
    } catch (error) {
      console.error('Tracking failed:', error);
      setIsTracking(false);
      setOrderStatus('not_found');
    }
  }, [trackOrderById]);

  const handleTrack = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    performTracking(orderId);
  }, [orderId, performTracking]);

  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case 'pending': return 'قيد المراجعة';
      case 'processing': return 'قيد التجهيز';
      case 'shipped': return 'جاري التوصيل';
      case 'delivered': return 'تم التوصيل';
      case 'cancelled': return 'ملغي';
      default: return 'قيد المراجعة';
    }
  }, []);

  const getShippingMethodText = useCallback((method?: string) => {
    if (method === 'pickup') return 'استلام من الفرع';
    return 'توصيل الى العنوان';
  }, []);

  const getSteps = useCallback((order: Order) => {
    const rawDate = (order.date as any)?.seconds ? new Date((order.date as any).seconds * 1000) : new Date(order.date);
    const orderDate = rawDate.toLocaleDateString('ar-u-nu-latn', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    if (order.status === 'cancelled') {
      return [
        { id: 1, title: 'تم استلام الطلب', date: orderDate, icon: CheckCircle2, status: 'completed' },
        { id: 2, title: 'تم إلغاء الطلب', date: orderDate, icon: AlertCircle, status: 'cancelled' },
      ];
    }

    return [
      { id: 1, title: 'تم استلام الطلب', date: orderDate, icon: Receipt, status: 'completed' },
      { 
        id: 2, 
        title: 'قيد التجهيز', 
        date: order.status !== 'pending' ? orderDate : 'في انتظار التأكيد', 
        icon: Box, 
        status: order.status === 'pending' ? 'pending' : (order.status === 'processing' ? 'current' : 'completed') 
      },
      { 
        id: 3, 
        title: order.shippingMethod === 'pickup' ? 'جاهز للاستلام' : 'جاري التوصيل', 
        date: ['shipped', 'delivered'].includes(order.status) ? orderDate : 'قريباً', 
        icon: Truck, 
        status: ['pending', 'processing'].includes(order.status) ? 'pending' : (order.status === 'shipped' ? 'current' : 'completed') 
      },
      { 
        id: 4, 
        title: order.shippingMethod === 'pickup' ? 'تم الاستلام' : 'تم التوصيل', 
        date: order.status === 'delivered' ? orderDate : 'قريباً', 
        icon: MapPin, 
        status: order.status === 'delivered' ? 'completed' : 'pending' 
      },
    ];
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-bg-general py-8 sm:py-12 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-bg-section to-bg-general -z-10" />
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-carbon/5 rounded-full blur-3xl -z-10" />
      <div className="absolute top-[20%] left-[-10%] w-80 h-80 bg-solar/5 rounded-full blur-3xl -z-10" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-4 sm:px-6"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} className="text-center mb-10">
          <Link to="/" className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-2xl mb-6 border border-bg-hover text-carbon hover:bg-bg-hover transition-all shadow-lg">
            <ArrowRight className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl sm:text-4xl font-black text-carbon mb-3 tracking-tight">تتبع مسار طلبك</h1>
          <p className="text-muted text-sm sm:text-base max-w-md mx-auto">
            أدخل رقم الطلب الخاص بك لمعرفة حالته ومتابعة مساره خطوة بخطوة حتى يصل إليك.
          </p>
        </motion.div>

        {/* Search Box */}
        <motion.div variants={itemVariants} className="bg-white rounded-[2rem] p-4 sm:p-6 shadow-xl border border-bg-hover mb-8">
          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <FloatingInput 
                id="orderId"
                label="رقم الطلب (مثال: 9A8B7C)"
                type="text" 
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                required
                icon={<Package className="w-5 h-5" />}
                iconPosition="start"
                bgClass="bg-bg-section"
              />
            </div>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isTracking || !orderId.trim()}
              className="h-14 px-8 bg-carbon hover:bg-black disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg sm:w-auto w-full"
            >
              {isTracking ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                  <Zap className="w-5 h-5" />
                </motion.div>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>تتبع</span>
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        <AnimatePresence mode="wait">
          {orderStatus === 'tracking' && trackedOrder && (
            <motion.div 
              key="tracking-results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Order Info Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { label: 'حالة الطلب', value: getStatusText(trackedOrder.status), icon: Clock, color: 'text-solar', bg: 'bg-solar/10' },
                  { label: 'رقم الطلب', value: `#${trackedOrder.id}`, icon: Package, color: 'text-solar', bg: 'bg-solar/10' },
                  { label: 'طريقة التوصيل', value: getShippingMethodText(trackedOrder.shippingMethod), icon: Truck, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                  { label: 'طريقة الدفع', value: trackedOrder.paymentMethod, icon: CreditCard, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                ].map((info, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-bg-card rounded-2xl p-4 shadow-lg border border-bg-hover flex flex-col items-center text-center gap-2"
                  >
                    <div className={`w-10 h-10 rounded-full ${info.bg} ${info.color} flex items-center justify-center mb-1`}>
                      <info.icon className="w-5 h-5" />
                    </div>
                    <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">{info.label}</div>
                    <div className="text-xs sm:text-sm font-black text-carbon truncate w-full">{info.value}</div>
                  </motion.div>
                ))}
              </div>

              {/* Timeline Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-[2rem] p-6 sm:p-10 shadow-xl border border-bg-hover"
              >
                <h3 className="text-lg font-black text-carbon mb-8 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-solar" />
                  مسار الطلب
                </h3>
                
                <div className="relative pr-6 sm:pr-10">
                  {/* Vertical Line */}
                  <div className="absolute right-[11px] sm:right-[19px] top-2 bottom-2 w-0.5 bg-bg-hover rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: trackedOrder.status === 'delivered' ? '100%' : trackedOrder.status === 'shipped' ? '66%' : trackedOrder.status === 'processing' ? '33%' : '0%' }}
                      transition={{ duration: 1, ease: "easeInOut" }}
                      className="w-full bg-gradient-to-b from-solar to-solar-dark"
                    />
                  </div>

                  <div className="space-y-8 sm:space-y-10">
                    {getSteps(trackedOrder).map((step, idx) => (
                      <motion.div 
                        key={step.id} 
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.15 + 0.4 }}
                        className="relative flex items-start gap-4 sm:gap-6"
                      >
                        {/* Status Node */}
                        <div className="absolute -right-[24px] sm:-right-[32px] top-0">
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: idx * 0.15 + 0.6, type: "spring" }}
                            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-4 border-white flex items-center justify-center z-10 transition-colors shadow-sm ${
                              step.status === 'completed' ? 'bg-emerald-500 text-white' : 
                              step.status === 'current' ? 'bg-solar text-white' : 
                              step.status === 'cancelled' ? 'bg-red-500 text-white' :
                              'bg-bg-hover text-slate-500'
                            }`}
                          >
                            {step.status === 'current' && (
                              <motion.div 
                                className="absolute inset-0 rounded-full border-2 border-solar"
                                animate={{ scale: [1, 1.5], opacity: [1, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                              />
                            )}
                            <step.icon className="w-3 h-3 sm:w-4 sm:h-4" />
                          </motion.div>
                        </div>

                        {/* Step Content */}
                        <div className={`flex-1 pt-0.5 ${step.status === 'pending' ? 'opacity-40' : 'opacity-100'}`}>
                          <h4 className={`font-bold text-sm sm:text-base mb-1 ${
                            step.status === 'cancelled' ? 'text-red-500' :
                            step.status === 'completed' || step.status === 'current' ? 'text-carbon' : 'text-slate-400'
                          }`}>
                            {step.title}
                          </h4>
                          <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {step.date}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Order Items Accordion */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-[2rem] shadow-xl border border-bg-hover overflow-hidden"
              >
                <button 
                  onClick={() => setShowItems(!showItems)}
                  className="w-full flex items-center justify-between p-6 sm:p-8 bg-white hover:bg-bg-hover transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-bg-section rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Receipt className="w-6 h-6 text-solar" />
                    </div>
                    <div className="text-right">
                      <h4 className="font-black text-carbon text-lg">تفاصيل الفاتورة</h4>
                      <p className="text-sm text-slate-400">{trackedOrder.items.length} منتجات • {formatPrice(trackedOrder.total)}</p>
                    </div>
                  </div>
                  <motion.div animate={{ rotate: showItems ? 180 : 0 }}>
                    <ChevronDown className="w-6 h-6 text-slate-400" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {showItems && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-bg-hover bg-white"
                    >
                      <div className="p-6 sm:p-10 space-y-8 bg-white">
                        {/* Header: Logo & Store Info vs Invoice Title */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-bg-hover pb-8">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-carbon rounded-2xl flex items-center justify-center text-white shrink-0">
                              <Store className="w-8 h-8" />
                            </div>
                            <div>
                              <h2 className="text-2xl font-black text-carbon">متجر النخبة</h2>
                              <p className="text-sm text-slate-400 mt-1">تعز - الراهدة جوار ورشة عبد الكافي للألمنيوم</p>
                              <p className="text-sm text-slate-400">info@alnukhba.store</p>
                            </div>
                          </div>
                          <div className="text-right sm:text-left">
                            <h1 className="text-4xl font-black text-carbon mb-2 uppercase tracking-wider">فاتورة</h1>
                            <p className="text-lg font-bold text-slate-400">رقم الفاتورة: #{trackedOrder.id}</p>
                            <p className="text-sm text-slate-400 mt-1">تاريخ الإصدار: {new Date((trackedOrder.date as any)?.seconds ? (trackedOrder.date as any).seconds * 1000 : trackedOrder.date).toLocaleDateString('ar-YE', { year: 'numeric', month: 'numeric', day: 'numeric' })}</p>
                          </div>
                        </div>

                        {/* Customer & Order Meta */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 bg-bg-section p-6 rounded-2xl border border-bg-hover">
                          <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">فاتورة إلى</h3>
                            <p className="text-lg font-bold text-carbon">{trackedOrder.customerName || user?.name || 'عميل المتجر'}</p>
                            <p className="text-sm text-slate-500 mt-1">{trackedOrder.customerPhone || user?.phone || 'رقم الجوال غير محدد'}</p>
                            <p className="text-sm text-slate-500">{trackedOrder.shippingAddress || user?.address || 'اليمن'}</p>
                          </div>
                          <div className="sm:text-left">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">تفاصيل الدفع والتوصيل</h3>
                            <p className="text-sm text-slate-500 mb-1"><span className="font-medium text-carbon">طريقة الدفع:</span> {trackedOrder.paymentMethod}</p>
                            <p className="text-sm text-slate-500 mb-1"><span className="font-medium text-carbon">حالة الطلب:</span> {trackedOrder.status === 'delivered' ? 'مكتمل' : 'قيد المعالجة'}</p>
                            <p className="text-sm text-slate-500 mb-1"><span className="font-medium text-carbon">طريقة التوصيل:</span> {trackedOrder.shippingMethod === 'pickup' ? 'استلام من الفرع' : 'توصيل الى العنوان'}</p>
                            {trackedOrder.deliveryInstructions && (
                              <p className="text-sm text-slate-500 mb-1"><span className="font-medium text-carbon">تعليمات التوصيل:</span> {trackedOrder.deliveryInstructions}</p>
                            )}
                          </div>
                        </div>

                        {/* Items Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-right border-collapse">
                            <thead>
                              <tr className="border-b-2 border-bg-hover">
                                <th className="py-4 px-2 text-sm font-bold text-slate-400 w-1/2">المنتج</th>
                                <th className="py-4 px-2 text-sm font-bold text-slate-400 text-center">الكمية</th>
                                <th className="py-4 px-2 text-sm font-bold text-slate-400 text-center">سعر الوحدة</th>
                                <th className="py-4 px-2 text-sm font-bold text-slate-400 text-left">الإجمالي</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-bg-hover">
                              {trackedOrder.items?.map((item, idx) => (
                                <tr key={idx} className="group hover:bg-bg-section transition-colors">
                                  <td className="py-4 px-2">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 bg-white rounded-lg border border-bg-hover overflow-hidden shrink-0">
                                        <img src={item.product?.image || undefined} alt={item.product?.name || 'محذوف'} className="w-full h-full object-cover" crossOrigin="anonymous" />
                                      </div>
                                      <div>
                                        <p className="font-bold text-carbon text-sm">{item.product?.name || 'منتج محذوف غير متوفر'}</p>
                                        {item.selectedColor && <p className="text-xs text-slate-400 mt-0.5">اللون: {item.selectedColor}</p>}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="py-4 px-2 text-center font-medium text-carbon">{item.quantity}</td>
                                  <td className="py-4 px-2 text-center font-medium text-carbon">{formatPrice(item.product?.price || 0)}</td>
                                  <td className="py-4 px-2 text-left font-bold text-carbon">{formatPrice((item.product?.price || 0) * item.quantity)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Totals */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-8 pt-6 border-t border-bg-hover">
                          <div className="w-full sm:w-1/2">
                            <div className="bg-bg-section p-4 rounded-xl border border-bg-hover">
                              <div className="flex items-center gap-3 mb-2">
                                <ShieldCheck className="w-5 h-5 text-state-success" />
                                <p className="font-bold text-carbon text-sm">معلومات هامة</p>
                              </div>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                يرجى الاحتفاظ بهذه الفاتورة لضمان حقوقك في الاسترجاع أو الاستبدال خلال 14 يوماً من تاريخ الشراء وفقاً لسياسة المتجر.
                              </p>
                            </div>
                          </div>
                          
                          <div className="w-full sm:w-1/2 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-400">المجموع الفرعي:</span>
                              <span className="font-bold text-carbon">{formatPrice(trackedOrder.subtotal || trackedOrder.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0))}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-400">رسوم التوصيل:</span>
                              <span className="font-bold text-carbon">{formatPrice(trackedOrder.shippingFee || (trackedOrder.shippingMethod === 'delivery' ? 7000 : 0))}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-slate-400">الخصم:</span>
                              <span className={`font-bold ${trackedOrder.discountAmount > 0 ? 'text-emerald-500' : 'text-carbon'}`}>
                                {trackedOrder.discountAmount > 0 ? `-${formatPrice(trackedOrder.discountAmount)}` : formatPrice(0)}
                              </span>
                            </div>
                            <div className="h-px w-full bg-bg-hover my-2" />
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-black text-carbon">الإجمالي الكلي:</span>
                              <span className="text-2xl font-black text-solar">{formatPrice(trackedOrder.total)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center pt-8 mt-8 border-t border-bg-hover">
                          <p className="text-sm font-bold text-carbon mb-1">شكراً لتسوقكم معنا!</p>
                          <p className="text-xs text-slate-400">alnukhba.store</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}

          {orderStatus === 'not_found' && (
            <motion.div 
              key="not-found"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] p-8 sm:p-12 text-center shadow-xl border border-bg-hover"
            >
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
                className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <AlertCircle className="w-10 h-10 text-red-500" />
              </motion.div>
              <h3 className="text-2xl font-black text-carbon mb-3">لم نتمكن من العثور على الطلب</h3>
              <p className="text-slate-400 mb-8 max-w-md mx-auto">
                يرجى التأكد من كتابة رقم الطلب بشكل صحيح والمحاولة مرة أخرى. إذا استمرت المشكلة، يرجى التواصل مع خدمة العملاء.
              </p>
              <button 
                onClick={() => {
                  setOrderId('');
                  setOrderStatus(null);
                }}
                className="h-12 px-8 bg-bg-section hover:bg-bg-hover text-carbon font-bold rounded-xl transition-colors"
              >
                إعادة المحاولة
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
