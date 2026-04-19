import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface FastImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string;
  lowRes?: string;
  containerClassName?: string;
  priority?: boolean;
}

/**
 * A high-performance image component that handles lazy loading,
 * low-res placeholders, and smooth transitions.
 */
export const FastImage: React.FC<FastImageProps> = ({ 
  src, 
  alt, 
  fallback = 'https://picsum.photos/seed/placeholder/800/600',
  lowRes,
  className,
  containerClassName = '',
  priority = false,
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!src) return;
    
    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setError(true);
  }, [src]);

  const displaySrc = error ? fallback : src;

  // Filter out props that might conflict with motion
  const { onDrag, onDragStart, onDragEnd, ...safeProps } = props as any;

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {/* Low-res placeholder */}
      {lowRes && !isLoaded && (
        <img 
          src={lowRes || undefined} 
          alt={alt} 
          className={`w-full h-full object-cover blur-lg scale-110 ${className}`}
          referrerPolicy="no-referrer-when-downgrade"
        />
      )}

      {/* Main image */}
      <AnimatePresence>
        <motion.img
          key={displaySrc}
          src={displaySrc || undefined}
          alt={alt}
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`w-full h-full object-cover ${className}`}
          referrerPolicy="no-referrer-when-downgrade"
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          {...safeProps}
        />
      </AnimatePresence>

      {/* Loading skeleton if not loaded */}
      {!isLoaded && !lowRes && (
        <div className="absolute inset-0 bg-slate-100 animate-pulse" />
      )}
    </div>
  );
};
