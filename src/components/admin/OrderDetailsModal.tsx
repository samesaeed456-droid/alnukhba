import React from 'react';
import { X, Package, Truck, CreditCard, User, MapPin, Phone, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { Order } from '../../types';
import { useStore } from '../../context/StoreContext';

interface OrderDetailsModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
}

export default function OrderDetailsModal({ order, isOpen, onClose }: OrderDetailsModalProps) {
  const { formatPrice, updateOrderStatus } = useStore();

  if (!isOpen) return null;

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'delivered': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'cancelled': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'pending': return <Clock className="w-5 h-5 text-amber-500" />;
      default: return <Package className="w-5 h-5 text-blue-500" />;
    }
  };

  const statusMap: Record<Order['status'], string> = {
    pending: 'قيد الانتظار',
    processing: 'قيد التنفيذ',
    shipped: 'تم الشحن',
    delivered: 'تم التوصيل',
    cancelled: 'ملغي'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl my-8">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-3xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-solar/10 flex items-center justify-center text-solar">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-carbon">تفاصيل الطلب #{order.id}</h2>
              <p className="text-sm text-gray-500">بتاريخ {new Date(order.date).toLocaleString('ar-u-nu-latn')}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Items & Summary */}
          <div className="lg:col-span-2 space-y-8">
            {/* Items List */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-carbon flex items-center gap-2">
                <Package className="w-5 h-5 text-solar" />
                المنتجات ({order.items.length})
              </h3>
              <div className="border border-gray-100 rounded-2xl overflow-hidden">
                <table className="w-full text-right">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3 font-bold">المنتج</th>
                      <th className="px-4 py-3 font-bold text-center">الكمية</th>
                      <th className="px-4 py-3 font-bold text-left">السعر</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {order.items?.map((item, idx) => (
                      <tr key={idx} className="text-sm">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <img 
                              src={item.product?.image || undefined} 
                              alt={item.product?.name || 'محذوف'}
                              className="w-12 h-12 rounded-lg object-cover border border-gray-100"
                            />
                            <div>
                              <p className="font-bold text-carbon line-clamp-1">{item.product?.name || 'منتج محذوف'}</p>
                              <p className="text-xs text-gray-500">{item.product?.brand || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center font-bold text-gray-600">
                          {item.quantity}
                        </td>
                        <td className="px-4 py-4 text-left font-bold text-solar">
                          {formatPrice((item.product?.price || 0) * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-gray-50 rounded-2xl p-6 space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>المجموع الفرعي</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>رسوم التوصيل</span>
                <span>{formatPrice(order.shippingFee)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-red-600 font-medium">
                  <span>الخصم</span>
                  <span>-{formatPrice(order.discountAmount)}</span>
                </div>
              )}
              <div className="pt-3 border-t border-gray-200 flex justify-between items-center">
                <span className="text-lg font-bold text-carbon">الإجمالي</span>
                <span className="text-2xl font-black text-solar">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Customer & Status */}
          <div className="space-y-8">
            {/* Order Status */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="font-bold text-carbon mb-2">حالة الطلب</h3>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                {getStatusIcon(order.status)}
                <span className="font-bold text-carbon">{statusMap[order.status]}</span>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">تغيير الحالة</label>
                <select 
                  value={order.status}
                  onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-solar outline-none text-sm font-bold"
                >
                  {Object.entries(statusMap).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="font-bold text-carbon mb-2">معلومات العميل</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">الاسم</p>
                    <p className="text-sm font-bold text-carbon">{order.customerName || order.userId}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600 shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">رقم الهاتف</p>
                    <p className="text-sm font-bold text-carbon" dir="ltr">{order.customerPhone || order.userId}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">عنوان التوصيل</p>
                    <p className="text-sm font-bold text-carbon leading-relaxed">
                      {order.shippingAddress || 'لم يتم تحديد عنوان'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="font-bold text-carbon mb-2">معلومات الدفع</h3>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">طريقة الدفع</p>
                  <p className="text-sm font-bold text-carbon">
                    {order.paymentMethod === 'wallet' ? 'المحفظة الإلكترونية' : 
                     order.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : 'بطاقة ائتمان'}
                  </p>
                </div>
              </div>
              {order.paymentReference && (
                <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <p className="text-[10px] text-gray-400 uppercase font-bold">مرجع العملية</p>
                  <p className="text-xs font-mono text-gray-600 break-all">{order.paymentReference}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 rounded-b-3xl">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors"
          >
            إغلاق
          </button>
          <button 
            className="px-6 py-2.5 rounded-xl font-bold bg-carbon text-white hover:bg-carbon/90 transition-colors flex items-center gap-2"
            onClick={() => window.print()}
          >
            <Truck className="w-5 h-5" />
            <span>طباعة الفاتورة</span>
          </button>
        </div>
      </div>
    </div>
  );
}

import { ShoppingCart } from 'lucide-react';
