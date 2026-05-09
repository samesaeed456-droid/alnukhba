import React, { useState, useMemo, useCallback, Suspense } from "react";
import { Star, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useStoreState, useStoreActions } from "../context/StoreContext";
import {
  ProductCardSkeleton,
  BannerSkeleton,
  SectionHeaderSkeleton,
} from "../components/Skeleton";

// Home Components
import Hero from "../components/home/Hero";
import CategoriesSection from "../components/home/CategoriesSection";
const FeaturedDeal = React.lazy(() => import("../components/home/FeaturedDeal"));
const HomeProductGrid = React.lazy(() => import("../components/home/HomeProductGrid"));
const CategoryFilteredSection = React.lazy(() => import("../components/home/CategoryFilteredSection"));
const PremiumFeatures = React.lazy(() => import("../components/home/PremiumFeatures"));
const ProductSlider = React.lazy(() => import("../components/ProductSlider"));
const RecommendedProducts = React.lazy(() => import("../components/RecommendedProducts"));
const ImageSlider = React.lazy(() => import("../components/ImageSlider"));

const HomeFallback = () => <div className="h-[200px] animate-pulse bg-white/5 rounded-2xl mb-8" />;

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [isCategoryLoading] = useState(false);

  const { products, banners, isLoading } = useStoreState();
  const { formatPrice, syncOnDemand } = useStoreActions();

  React.useEffect(() => {
    syncOnDemand("banners");
  }, [syncOnDemand]);

  const handleCategoryChange = useCallback(
    (categoryName: string) => {
      if (activeCategory === categoryName) return;
      setActiveCategory(categoryName);
    },
    [activeCategory],
  );

  const filteredProducts = useMemo(() => {
    if (activeCategory === "الكل") return products;
    return products.filter((p) => p.category === activeCategory);
  }, [activeCategory, products]);

  const featuredProducts = useMemo(
    () => products.filter((p) => p.rating >= 4.8).slice(0, 8),
    [products],
  );
  const screens = useMemo(
    () => products.filter((p) => p.category === "شاشات"),
    [products],
  );
  const electronics = useMemo(
    () => products.filter((p) => p.category === "إلكترونيات"),
    [products],
  );
  const networks = useMemo(
    () => products.filter((p) => p.category === "شبكات"),
    [products],
  );
  const cameras = useMemo(
    () => products.filter((p) => p.category === "كاميرات مراقبة"),
    [products],
  );
  const maintenance = useMemo(
    () => products.filter((p) => p.category === "صيانة"),
    [products],
  );
  const spareParts = useMemo(
    () => products.filter((p) => p.category === "قطع غيار"),
    [products],
  );
  const electrical = useMemo(
    () => products.filter((p) => p.category === "كهربائيات"),
    [products],
  );
  const batteries = useMemo(
    () => products.filter((p) => p.category === "بطاريات"),
    [products],
  );
  const solarEnergy = useMemo(
    () => products.filter((p) => p.category === "طاقة شمسية"),
    [products],
  );
  const deals = useMemo(
    () => products.filter((p) => p.originalPrice).slice(0, 8),
    [products],
  );
  const newArrivals = useMemo(
    () => products.filter((p) => p.isNew).slice(0, 8),
    [products],
  );

  const getBannersByPosition = useCallback(
    (position: string, defaultBanners: { image: string; link: string }[]) => {
      const filtered = banners
        .filter((b) => b.isActive && b.position === position)
        .sort((a, b) => a.order - b.order);

      if (filtered.length === 0) return defaultBanners;

      // Flatten banners that have multiple images
      const flattened: { image: string; link: string }[] = [];
      filtered.forEach((banner) => {
        if (banner.images && banner.images.length > 0) {
          banner.images.forEach((img) => {
            flattened.push({ image: img, link: banner.link || "/search" });
          });
        } else {
          flattened.push({
            image: banner.image,
            link: banner.link || "/search",
          });
        }
      });
      return flattened;
    },
    [banners],
  );

  const midBanners = useMemo(
    () =>
      getBannersByPosition("middle", [
        {
          image:
            "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1600",
          link: "/category/إلكترونيات",
        },
        {
          image:
            "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=1600",
          link: "/category/إلكترونيات",
        },
      ]),
    [getBannersByPosition],
  );

  const bottomBanners = useMemo(
    () =>
      getBannersByPosition("bottom", [
        {
          image:
            "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&q=80&w=1600",
          link: "/category/بطاريات",
        },
        {
          image:
            "https://images.unsplash.com/photo-1509391366360-fe55f9981221?auto=format&fit=crop&q=80&w=1600",
          link: "/category/طاقة شمسية",
        },
      ]),
    [getBannersByPosition],
  );

  const screensBanners = useMemo(
    () =>
      getBannersByPosition("screens", [
        {
          image:
            "https://images.unsplash.com/photo-1593784991095-a205069470b6?auto=format&fit=crop&q=80&w=1600",
          link: "/category/شاشات",
        },
      ]),
    [getBannersByPosition],
  );

  const electronicsBanners = useMemo(
    () =>
      getBannersByPosition("electronics", [
        {
          image:
            "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&q=80&w=1600",
          link: "/category/إلكترونيات",
        },
      ]),
    [getBannersByPosition],
  );

  const solarBanners = useMemo(
    () =>
      getBannersByPosition("solar", [
        {
          image:
            "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&q=80&w=1600",
          link: "/category/طاقة شمسية",
        },
      ]),
    [getBannersByPosition],
  );

  const sparePartsBanners = useMemo(
    () =>
      getBannersByPosition("spare_parts", [
        {
          image:
            "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=1600",
          link: "/category/قطع غيار",
        },
      ]),
    [getBannersByPosition],
  );

  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
        },
      },
    }),
    [],
  );

  const handleResetCategory = useCallback(() => {
    setActiveCategory("الكل");
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
        {isLoading ? (
          <div className="px-2 sm:px-4 flex flex-col gap-8 animate-fade-in">
            <div className="flex flex-col gap-6">
              <SectionHeaderSkeleton />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
                {[...Array(10)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            </div>

            <BannerSkeleton />

            <div className="flex flex-col gap-6">
              <SectionHeaderSkeleton />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-6">
                {[...Array(5)].map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        ) : activeCategory !== "الكل" ? (
          <Suspense fallback={<HomeFallback />}>
            <CategoryFilteredSection
              categoryName={activeCategory}
              products={filteredProducts}
              isLoading={isCategoryLoading}
              onReset={handleResetCategory}
            />
          </Suspense>
        ) : (
          <Suspense fallback={<HomeFallback />}>
            {/* Featured Deal Section */}
            <FeaturedDeal deals={deals} formatPrice={formatPrice} />

            <ImageSlider
              slides={midBanners}
              height="200px"
              mobileHeight="110px"
            />

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

            <ImageSlider
              slides={screensBanners}
              height="180px"
              mobileHeight="120px"
            />

            {/* Category Sliders */}
            <ProductSlider
              title="شاشات"
              subtitle="أفضل الشاشات الذكية لتجربة مشاهدة مذهلة"
              products={screens}
              viewAllLink="/category/شاشات"
            />

            <ImageSlider
              slides={electronicsBanners}
              height="180px"
              mobileHeight="120px"
            />

            <ProductSlider
              title="إلكترونيات"
              subtitle="أحدث الأجهزة والإلكترونيات الذكية"
              products={electronics}
              viewAllLink="/category/إلكترونيات"
            />

            <ImageSlider
              slides={solarBanners}
              height="180px"
              mobileHeight="120px"
            />

            <ProductSlider
              title="طاقة شمسية"
              subtitle="حلول الطاقة النظيفة والمستدامة"
              products={solarEnergy}
              viewAllLink="/category/طاقة شمسية"
            />

            <ImageSlider
              slides={sparePartsBanners}
              height="180px"
              mobileHeight="120px"
            />

            <ProductSlider
              title="كاميرات مراقبة"
              subtitle="أحدث تقنيات المراقبة والأمان لمنزلك وعملك"
              products={cameras}
              viewAllLink="/category/كاميرات مراقبة"
            />

            <ProductSlider
              title="شبكات"
              subtitle="حلول الشبكات والإنترنت فائقة السرعة"
              products={networks}
              viewAllLink="/category/شبكات"
            />

            <ImageSlider
              slides={bottomBanners}
              height="180px"
              mobileHeight="120px"
            />

            <ProductSlider
              title="بطاريات"
              subtitle="طاقة تدوم طويلاً لجميع احتياجاتك"
              products={batteries}
              viewAllLink="/category/بطاريات"
            />
            
            <ProductSlider
              title="كهربائيات"
              subtitle="مستلزمات وأدوات كهربائية عالية الجودة"
              products={electrical}
              viewAllLink="/category/كهربائيات"
            />
          </Suspense>
        )}
      </div>

      {/* Premium Features Section */}
      <Suspense fallback={<div className="h-[100px] bg-white/5 rounded-2xl mx-4 mb-8" />}>
        <PremiumFeatures />
      </Suspense>
    </div>
  );
}
