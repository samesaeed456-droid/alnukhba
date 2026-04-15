// src/lib/finance.ts

// نستخدم العملة الأساسية YER_OLD كمرجع لكل الحسابات
export const BASE_CURRENCY_CODE = 'YER_OLD';
export const BASE_CURRENCY_SYMBOL = 'ر.ق';

// دالة تقريب موحدة (تقريب للأقرب عدد صحيح أو لعدد محدد من الخانات العشرية)
export const roundMoney = (amount: number, decimals: number = 0): number => {
  const factor = Math.pow(10, decimals);
  return Math.round((amount + Number.EPSILON) * factor) / factor;
};

// دالة لتنسيق المبالغ للعرض
export const formatMoney = (amount: number, locale: string = 'ar-u-nu-latn'): string => {
  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  
  return `${formattedNumber} ${BASE_CURRENCY_SYMBOL}`;
};

// دوال مساعدة لتوحيد العمليات المالية
export const calculateDiscount = (price: number, discountPercentage: number): number => {
  return price - (price * (discountPercentage / 100));
};
