import React from 'react';
import { useStore } from '../context/StoreContext';

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  variant?: 'light' | 'dark' | 'orange';
}

export default function Logo({ className = "h-8", iconOnly = false, variant = 'orange' }: LogoProps) {
  const { settings } = useStore();
  const defaultLogoUrl = "https://19vojde6sh.ucarecd.net/d47b5f87-8c90-4ce5-96a2-523deba728ef/noroot.png";
  const logoUrl = settings?.storeLogo || defaultLogoUrl;

  let filterClass = '';
  if (variant === 'dark') {
    filterClass = 'brightness-0';
  } else if (variant === 'light') {
    filterClass = 'brightness-0 invert';
  }

  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src={logoUrl} 
        alt={settings?.storeName || "Alnokhba Logo"} 
        className={`h-full w-auto object-contain ${filterClass}`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
