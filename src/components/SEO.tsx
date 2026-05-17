import React from "react";
import { Helmet } from "react-helmet-async";
import { useStore } from "../context/StoreContext";

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogType?: "website" | "product";
  ogImage?: string;
  schema?: any;
  noindex?: boolean;
}

const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  ogType = "website",
  ogImage,
  schema,
  noindex = false,
}) => {
  const { settings } = useStore();
  
  // Use settings defaults if props are not provided
  const rawOgImage = ogImage || settings.seo?.ogImage || settings.storeLogo || "/favicon.svg";
  const finalOgImage = rawOgImage.startsWith('http') ? rawOgImage : `${window.location.origin}${rawOgImage.startsWith('/') ? '' : '/'}${rawOgImage}`;
  
  const finalDescription = description || settings.seo?.metaDescription || "متجر النخبة للإلكترونيات - الرؤية الجديدة للطاقة الشمسية والإلكترونيات الذكية في اليمن. جودة عالية وأسعار منافسة.";
  const finalCanonical = canonical || window.location.origin + window.location.pathname;
  
  const fullTitle = title 
    ? `${title} | ${settings.seo?.metaTitle || settings.storeName || "متجر النخبة"}` 
    : (settings.seo?.metaTitle || "متجر النخبة للإلكترونيات ومنظومات الطاقة الشمسية");

  // Default Organization Schema
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "متجر النخبة للإلكترونيات",
    "url": "https://alnukhba.store",
    "logo": "https://alnukhba.store/favicon.svg",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+967-XXXXXXXXX",
      "contactType": "customer service",
      "areaServed": "YE",
      "availableLanguage": "Arabic"
    },
    "sameAs": [
      "https://facebook.com/alnukhba",
      "https://twitter.com/alnukhba",
      "https://instagram.com/alnukhba"
    ]
  };

  const webSiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "متجر النخبة",
    "url": "https://alnukhba.store",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://alnukhba.store/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <Helmet>
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Basic Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <title>{fullTitle}</title>
      <meta name="description" content={finalDescription} />
      <link rel="canonical" href={finalCanonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalOgImage} />
      <meta property="og:url" content={finalCanonical} />
      <meta property="og:site_name" content={settings.storeName || "متجر النخبة"} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalOgImage} />

      {/* Schema.org JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify(orgSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(webSiteSchema)}
      </script>
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
