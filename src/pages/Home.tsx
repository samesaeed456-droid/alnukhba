import React, { useState, useMemo, useCallback } from 'react';
import { Star, Zap } from 'lucide-react';
import { motion } from 'motion/react';
import { useStoreState, useStoreActions } from '../context/StoreContext';
import ProductSlider from '../components/ProductSlider';
import RecommendedProducts from '../components/RecommendedProducts';
import ImageSlider from '../components/ImageSlider';

// Home Components
import Hero from '../components/home/Hero';
import CategoriesSection from '../components/home/CategoriesSection';
import FeaturedDeal from '../components/home/FeaturedDeal';
import HomeProductGrid from '../components/home/HomeProductGrid';
import CategoryFilteredSection from '../components/home/CategoryFilteredSection';
import PremiumFeatures from '../components/home/PremiumFeatures';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [isCategoryLoading] = useState(false);
  
  const { products, banners } = useStoreState();
  const { formatPrice } = useStoreActions();

  const handleCategoryChange = useCallback((categoryName: string) => {
    if (activeCategory === categoryName) return;
    setActiveCategory(categoryName);
  }, [activeCategory]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'الكل') return products;
    return products.filter(p => p.category === activeCategory);
  }, [activeCategory, products]);

  const featuredProducts = useMemo(() => products.filter(p => p.rating >= 4.8).slice(0, 8), [products]);
  const screens = useMemo(() => products.filter(p => p.category === 'شاشات'), [products]);
  const electronics = useMemo(() => products.filter(p => p.category === 'إلكترونيات'), [products]);
  const accessories = useMemo(() => products.filter(p => p.category === 'إكسسوارات'), [products]);
  const batteries = useMemo(() => products.filter(p => p.category === 'بطاريات'), [products]);
  const solarEnergy = useMemo(() => products.filter(p => p.category === 'طاقة شمسية'), [products]);
  const deals = useMemo(() => products.filter(p => p.originalPrice).slice(0, 8), [products]);
  const newArrivals = useMemo(() => products.filter(p => p.isNew).slice(0, 8), [products]);

  const getBannersByPosition = useCallback((position: string, defaultBanners: { image: string, link: string }[]) => {
    const filtered = banners
      .filter(b => b.isActive && b.position === position)
      .sort((a, b) => a.order - b.order);
    
    if (filtered.length === 0) return defaultBanners;
    
    // Flatten banners that have multiple images
    const flattened: { image: string, link: string }[] = [];
    filtered.forEach(banner => {
      if (banner.images && banner.images.length > 0) {
        banner.images.forEach(img => {
          flattened.push({ image: img, link: banner.link || '/search' });
        });
      } else {
        flattened.push({ image: banner.image, link: banner.link || '/search' });
      }
    });
    return flattened;
  }, [banners]);

  const midBanners = useMemo(() => getBannersByPosition('middle', [
    { image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1600', link: '/category/إلكترونيات' },
    { image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=1600', link: '/category/إكسسوارات' }
  ]), [getBannersByPosition]);

  const bottomBanners = useMemo(() => getBannersByPosition('bottom', [
    { image: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=1600', link: '/category/بطاريات' },
    { image: 'https://images.unsplash.com/photo-1509391366360-fe55f9981221?auto=format&fit=crop&q=80&w=1600', link: '/category/طاقة شمسية' }
  ]), [getBannersByPosition]);

  const screensBanners = useMemo(() => getBannersByPosition('screens', [
    { image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&q=80&w=1600', link: '/category/شاشات' }
  ]), [getBannersByPosition]);

  const electronicsBanners = useMemo(() => getBannersByPosition('electronics', [
    { image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=1600', link: '/category/إلكترونيات' }
  ]), [getBannersByPosition]);

  const solarBanners = useMemo(() => getBannersByPosition('solar', [
    { image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=1600', link: '/category/طاقة شمسية' }
  ]), [getBannersByPosition]);

  const accessoriesBanners = useMemo(() => getBannersByPosition('accessories', [
    { image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=1600', link: '/category/إكسسوارات' }
  ]), [getBannersByPosition]);

  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }), []);

  const handleResetCategory = useCallback(() => {
    setActiveCategory('الكل');
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Hero Section */}
      <Hero />

      {/* Categories Filter */}
      <CategoriesSection 
        activeCategory={activeCategory} 
        onCategoryChange={handleCategoryChange} 
      />

      {/* Main Product Section */}
      <div className="min-h-[300px]">
        {activeCategory !== 'الكل' ? (
          <CategoryFilteredSection 
            categoryName={activeCategory}
            products={filteredProducts}
            isLoading={isCategoryLoading}
            onReset={handleResetCategory}
          />
        ) : (
          <>
            {/* Featured Deal Section */}
            <FeaturedDeal deals={deals} formatPrice={formatPrice} />

            <ImageSlider slides={midBanners} height="200px" mobileHeight="110px" />

            {/* Featured Products Grid */}
            <HomeProductGrid 
              title="منتجات مميزة"
              icon={Star}
              products={featuredProducts}
              iconColor="text-solar fill-solar"
            />

            {/* Recommendations Section */}
            <div className="px-2 sm:px-6 lg:px-8 mb-8">
              <RecommendedProducts limit={4} />
            </div>

            {/* New Arrivals Grid */}
            <HomeProductGrid 
              title="وصل حديثاً"
              icon={Zap}
              products={newArrivals}
              viewAllLink="/search?isNew=true"
              animateIcon
            />

            <ImageSlider slides={screensBanners} height="180px" mobileHeight="120px" />

            {/* Category Sliders */}
            <ProductSlider 
              title="شاشات" 
              subtitle="أفضل الشاشات الذكية لتجربة مشاهدة مذهلة"
              products={screens} 
              viewAllLink="/category/شاشات"
            />

            <ImageSlider slides={electronicsBanners} height="180px" mobileHeight="120px" />

            <ProductSlider 
              title="إلكترونيات" 
              subtitle="أحدث الأجهزة والإلكترونيات الذكية"
              products={electronics} 
              viewAllLink="/category/إلكترونيات"
            />

            <ImageSlider slides={solarBanners} height="180px" mobileHeight="120px" />

            <ProductSlider 
              title="طاقة شمسية" 
              subtitle="حلول الطاقة النظيفة والمستدامة"
              products={solarEnergy} 
              viewAllLink="/category/طاقة شمسية"
            />

            <ImageSlider slides={accessoriesBanners} height="180px" mobileHeight="120px" />

            <ProductSlider 
              title="إكسسوارات" 
              subtitle="أفضل الإكسسوارات لأجهزتك"
              products={accessories} 
              viewAllLink="/category/إكسسوارات"
            />

            <ImageSlider slides={bottomBanners} height="180px" mobileHeight="120px" />

            <ProductSlider 
              title="بطاريات" 
              subtitle="طاقة تدوم طويلاً لجميع احتياجاتك"
              products={batteries} 
              viewAllLink="/category/بطاريات"
            />
          </>
        )}
      </div>

      {/* Premium Features Section */}
      <PremiumFeatures />
    </div>
  );
}

