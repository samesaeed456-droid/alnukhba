import React from 'react';
import { useStore } from '../context/StoreContext';

interface PriceDisplayProps {
  price: number;
  className?: string;
  numberClassName?: string;
  currencyClassName?: string;
}

export default function PriceDisplay({ 
  price, 
  className = "flex items-center gap-1", 
  numberClassName = "text-slate-900", 
  currencyClassName = "text-slate-900/70" 
}: PriceDisplayProps) {
  const { formatPrice } = useStore();
  const formatted = formatPrice(price);
  
  // Split by space to separate number and currency
  const parts = formatted.split(' ');
  const number = parts[0];
  const currency = parts.slice(1).join(' ');

  return (
    <span className={className}>
      <span className={numberClassName}>{number}</span>
      <span className={currencyClassName}>{currency}</span>
    </span>
  );
}
