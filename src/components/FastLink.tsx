import React from 'react';
import { Link, LinkProps, useNavigate } from 'react-router-dom';
import { prefetch } from '../App';

interface FastLinkProps extends LinkProps {
  prefetchPage?: string;
  instant?: boolean;
}

/**
 * A high-performance Link component that prefetches the target page on hover
 * and can trigger instant navigation.
 */
export const FastLink: React.FC<FastLinkProps> = ({ 
  children, 
  prefetchPage, 
  instant = false,
  onMouseEnter,
  onClick,
  to,
  ...props 
}) => {
  const navigate = useNavigate();

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (prefetchPage) {
      prefetch(prefetchPage);
    }
    if (onMouseEnter) onMouseEnter(e);
  };

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (instant) {
      e.preventDefault();
      navigate(to as string);
    }
    if (onClick) onClick(e);
  };

  return (
    <Link 
      to={to} 
      onMouseEnter={handleMouseEnter} 
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
};
