import React, { useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Tag,
  CheckCircle2,
  Lock,
  Clock,
} from "lucide-react";
import { useStore } from "../context/StoreContext";
import { motion, AnimatePresence } from "motion/react";
import ConfirmationModal from "../components/ConfirmationModal";
import PriceDisplay from "../components/PriceDisplay";
import { FloatingInput } from "../components/FloatingInput";

export default function Cart() {
  const {
    cart,
    updateCartQuantity,
    removeFromCart,
    showToast,
    discount,
    applyDiscountCode,
    removeDiscount,
    formatPrice,
    user,
    settings,
    shippingZones,
    cities,
  } = useStore();
  const navigate = useNavigate();
  const [discountCodeInput, setDiscountCodeInput] = useState("");
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>(cities[0]?.name || "صنعاء");

  const getItemPrice = useCallback((item: any) => {
    if (item.selectedSize && item.product.sizePrices && item.product.sizePrices[item.selectedSize]) {
      return item.product.sizePrices[item.selectedSize];
    }
    return item.product.price;
  }, []);

  const getItemOriginalPrice = useCallback((item: any) => {
    if (item.selectedSize && item.product.sizeOriginalPrices && item.product.sizeOriginalPrices[item.selectedSize]) {
      return item.product.sizeOriginalPrices[item.selectedSize];
    }
    return item.product.originalPrice;
  }, []);

  const subtotal = useMemo(
    () =>
      cart.reduce((sum, item) => sum + getItemPrice(item) * item.quantity, 0),
    [cart, getItemPrice],
  );

  const shipping = useMemo(() => {
    if (subtotal === 0) return 0;

    const cityData = selectedCity ? cities.find((c) => c.name === selectedCity) : null;
    if (cityData?.shippingRate !== undefined && cityData.shippingRate > 0) {
        return cityData.shippingRate;
    }

    const zone = selectedCity
      ? shippingZones.find((z) => z.isActive && z.cities.includes(selectedCity))
      : null;
    if (zone) {
      if (zone.freeThreshold && subtotal >= zone.freeThreshold) return 0;
      return zone.rate;
    }

    if (
      settings.freeShippingThreshold &&
      subtotal >= settings.freeShippingThreshold
    )
      return 0;
    return settings.shippingFee;
  }, [subtotal, selectedCity, shippingZones, settings, cities]);

  const allCities = useMemo(() => {
    const cityNames = cities.map(c => c.name);
    const zoneCities = shippingZones.flatMap((z) => z.cities);
    return Array.from(new Set([...cityNames, ...zoneCities])).sort();
  }, [shippingZones, cities]);

  const discountAmount = useMemo(() => {
    if (!discount.code) return 0;
    if (discount.type === "percentage") {
      return subtotal * (discount.amount / 100);
    }
    return Math.min(discount.amount, subtotal);
  }, [discount, subtotal]);

  const total = useMemo(
    () => subtotal + shipping - discountAmount,
    [subtotal, shipping, discountAmount],
  );

  const handleApplyDiscount = useCallback(() => {
    if (!discountCodeInput) return;
    applyDiscountCode(discountCodeInput);
  }, [discountCodeInput, applyDiscountCode]);

  const handleRemoveDiscount = useCallback(() => {
    removeDiscount();
    setDiscountCodeInput("");
  }, [removeDiscount]);

  const handleUpdateQuantity = useCallback(
    (id: string, delta: number) => {
      updateCartQuantity(id, delta);
    },
    [updateCartQuantity],
  );

  const handleRemoveItem = useCallback((id: string) => {
    setItemToDelete(id);
  }, []);

  const handleCheckout = useCallback(() => {
    if (user) {
      navigate("/checkout");
    } else {
      showToast("يرجى تسجيل الدخول أولاً لإتمام عملية الشراء", "error");
      navigate("/auth?redirect=/checkout");
    }
  }, [user, navigate, showToast]);

  const handleToggleCouponInput = useCallback(() => {
    setShowCouponInput((prev) => !prev);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (itemToDelete) {
      removeFromCart(itemToDelete);
      setItemToDelete(null);
    }
  }, [itemToDelete, removeFromCart]);

  const handleCloseDeleteModal = useCallback(() => {
    setItemToDelete(null);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (cart.length === 0) {
    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-[1600px] mx-auto px-4 sm:px-6 py-12 flex flex-col items-center justify-center min-h-[60vh]"
      >
        <motion.div
          variants={itemVariants}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6"
        >
          <ShoppingBag className="w-12 h-12 text-titanium/40" />
        </motion.div>
        <motion.h2
          variants={itemVariants}
          className="text-xl font-bold text-carbon mb-2"
        >
          سلة التسوق فارغة
        </motion.h2>
        <motion.p
          variants={itemVariants}
          className="text-titanium/60 mb-8 text-center max-w-md"
        >
          يبدو أنك لم تقم بإضافة أي منتجات إلى سلة التسوق الخاصة بك حتى الآن.
        </motion.p>
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            to="/"
            className="bg-carbon hover:bg-carbon/90 text-white px-8 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-carbon/20"
          >
            تسوق الآن
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-4 py-6"
    >
      <motion.h1
        variants={itemVariants}
        className="text-2xl font-black text-carbon mb-6"
      >
        سلة التسوق
      </motion.h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Cart Items */}
        <div className="w-full lg:w-2/3 flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {cart.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex gap-4 group"
              >
                <Link
                  to={`/product/${item.product?.id || ""}`}
                  className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-50 rounded-lg overflow-hidden shrink-0"
                >
                  <img
                    src={item.product?.image || undefined}
                    alt={item.product?.name || "محذوف"}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </Link>

                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Link
                        to={`/product/${item.product?.id || ""}`}
                        className="font-bold text-sm text-carbon hover:text-solar transition-colors line-clamp-2"
                      >
                        {item.product?.name || "منتج غير متوفر حالياً"}
                      </Link>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.selectedColor && (
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500">
                        <span className="text-slate-400">اللون:</span>
                        <div
                          className="w-3 h-3 rounded-full border border-slate-100"
                          style={{ backgroundColor: item.selectedColor }}
                        />
                      </div>
                    )}
                    {item.selectedSize && (
                      <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500">
                        <span className="text-slate-400">المقاس:</span>
                        <span className="font-bold text-slate-900">{item.selectedSize}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex flex-col">
                      <div className="font-black text-base sm:text-lg">
                        <PriceDisplay
                          price={getItemPrice(item)}
                          numberClassName="text-slate-900"
                          currencyClassName="text-slate-900/70"
                        />
                      </div>
                      {getItemOriginalPrice(item) && (
                        <div className="text-[10px] text-slate-400 font-medium line-through">
                          {formatPrice(getItemOriginalPrice(item))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center bg-slate-50 rounded-lg p-0.5 border border-slate-100">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-solar hover:bg-white rounded transition-all"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-bold text-xs text-carbon">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-solar hover:bg-white rounded transition-all"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-1/3">
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 sticky top-24"
          >
            <h2 className="text-lg font-bold text-carbon mb-6">ملخص الطلب</h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-titanium/60">
                  المجموع الفرعي ({cart.length} منتجات)
                </span>
                <span className="font-black">
                  <PriceDisplay
                    price={subtotal}
                    numberClassName="text-slate-900"
                    currencyClassName="text-slate-900/70"
                  />
                </span>
              </div>

              <div className="pt-4 border-t border-slate-50">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-titanium/60">
                      تقدير الشحن إلى:
                    </span>
                    <span className="text-[10px] text-solar font-bold">
                      التوصيل: {shipping === 0 ? "مجاني" : formatPrice(shipping)}
                    </span>
                  </div>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full text-xs font-bold text-carbon bg-slate-50 p-3 rounded-lg outline-none cursor-pointer border border-slate-100"
                  >
                    {allCities.map((city) => {
                      const cityData = cities.find((c) => c.name === city);
                      return (
                        <option key={city} value={city}>
                          {city} {cityData?.shippingRate ? `- ${formatPrice(cityData.shippingRate)}` : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-titanium/60">تكلفة التوصيل</span>
                  <span className="font-black">
                    {shipping === 0 ? (
                      <span className="text-emerald-600">مجاني</span>
                    ) : (
                      <PriceDisplay
                        price={shipping}
                        numberClassName="text-slate-900"
                        currencyClassName="text-slate-900/70"
                      />
                    )}
                  </span>
                </div>
              </div>

              <AnimatePresence>
                {discount.code && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex justify-between text-sm text-emerald-600"
                  >
                    <span>الخصم ({discount.code})</span>
                    <span className="font-bold flex items-center gap-1">
                      -{" "}
                      <PriceDisplay
                        price={discountAmount}
                        numberClassName="text-emerald-600"
                        currencyClassName="text-emerald-600/70"
                      />
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Discount Code */}
            <div className="mb-6">
              <button
                onClick={handleToggleCouponInput}
                className="text-sm font-bold text-carbon/60 hover:text-solar mb-3 flex items-center gap-2 transition-colors"
              >
                <Tag className="w-4 h-4" />
                هل لديك كود خصم؟
              </button>

              <AnimatePresence>
                {showCouponInput && !discount.code && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-1">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="text"
                            value={discountCodeInput}
                            onChange={(e) =>
                              setDiscountCodeInput(e.target.value)
                            }
                            placeholder="أدخل الكود هنا"
                            disabled={!!discount.code}
                            className="w-full h-11 pl-4 pr-4 rounded-lg border border-slate-100 bg-white focus:ring-2 focus:ring-solar/50 focus:border-transparent outline-none transition-all text-sm disabled:opacity-50"
                          />
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleApplyDiscount}
                          disabled={!discountCodeInput || !!discount.code}
                          className="bg-carbon hover:bg-carbon/90 text-white px-4 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                          تطبيق
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {discount.code && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-3 flex items-center justify-between text-xs font-bold bg-emerald-50 p-3 rounded-xl border border-emerald-100"
                  >
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                      تم تطبيق الخصم ({discount.code})
                    </div>
                    <button
                      onClick={handleRemoveDiscount}
                      className="text-red-500 hover:text-red-600 transition-colors"
                    >
                      إزالة
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="border-t border-slate-100 pt-4 mb-6">
              <div className="flex justify-between items-end">
                <span className="font-bold text-carbon">الإجمالي</span>
                <div className="text-right">
                  <motion.div
                    key={total}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="font-black text-xl inline-block"
                  >
                    <PriceDisplay
                      price={total}
                      numberClassName="text-slate-900"
                      currencyClassName="text-slate-900/70"
                    />
                  </motion.div>
                </div>
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <button
                onClick={handleCheckout}
                className="w-full bg-carbon hover:bg-carbon/90 text-white h-12 rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-carbon/20"
              >
                {!user && <Lock className="w-4 h-4" />}
                متابعة الدفع
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!itemToDelete}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        title="حذف المنتج"
        message="هل أنت متأكد من رغبتك في حذف هذا المنتج من سلة المشتريات؟"
        confirmText="حذف"
        cancelText="تراجع"
      />
    </motion.div>
  );
}
