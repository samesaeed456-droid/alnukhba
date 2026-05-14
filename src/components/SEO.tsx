import React from "react";
import { Helmet } from "react-helmet-async";

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
  description = "متجر النخبة للإلكترونيات - الرؤية الجديدة للطاقة الشمسية والإلكترونيات الذكية في اليمن. جودة عالية وأسعار منافسة.",
  canonical = "https://alnukhba.store",
  ogType = "website",
  ogImage = "https://alnukhba.store/favicon.svg",
  schema,
  noindex = false,
}) => {
  const fullTitle = title 
    ? `${title} | متجر النخبة للإلكترونيات` 
    : "متجر النخبة للإلكترونيات ومنظومات الطاقة الشمسية";

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
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content="متجر النخبة" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

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
