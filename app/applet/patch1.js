const fs = require('fs');

// 1. App.tsx modification
const appCode = fs.readFileSync('src/App.tsx', 'utf8');
const newAppCode = appCode
  .replace("import Products from './pages/admin/Products';", "import Products from './pages/admin/Products';\nimport AdminCategories from './pages/admin/Categories';")
  .replace('<Route path="products" element={<Products />} />', '<Route path="products" element={<Products />} />\n              <Route path="categories" element={<AdminCategories />} />');
fs.writeFileSync('src/App.tsx', newAppCode);

// 2. AdminLayout.tsx modification
const adminLayout = fs.readFileSync('src/pages/admin/AdminLayout.tsx', 'utf8');
const newAdminLayout = adminLayout.replace(
  "{ name: 'المنتجات والمخزون', path: '/admin/products', icon: Package, permission: 'manage_products' },",
  "{ name: 'المنتجات والمخزون', path: '/admin/products', icon: Package, permission: 'manage_products' },\n          { name: 'الفئات', path: '/admin/categories', icon: Package, permission: 'manage_products' },"
);
fs.writeFileSync('src/pages/admin/AdminLayout.tsx', newAdminLayout);

// 3. CategoriesSection.tsx modification
let categoriesSection = fs.readFileSync('src/components/home/CategoriesSection.tsx', 'utf8');
categoriesSection = categoriesSection.replace(
  "import React, { useRef, useEffect, useState } from 'react';", 
  "import React, { useRef, useEffect, useState } from 'react';\nimport { useStore } from '../../context/StoreContext';"
);
categoriesSection = categoriesSection.replace(/export const categories = \[[^]*?\];/m, ""); // remove the hardcoded array
categoriesSection = categoriesSection.replace(
  "const CategoriesSection = React.memo(({ activeCategory, onCategoryChange }: CategoriesSectionProps) => {",
  "const CategoriesSection = React.memo(({ activeCategory, onCategoryChange }: CategoriesSectionProps) => {\n  const { categories } = useStore();\n  const displayCategories = [{ name: 'الكل', image: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=200&h=200&fit=crop', id: 'all' }, ...categories.filter(c => c.isActive && c.id !== 'all')];"
);
categoriesSection = categoriesSection.replace(/\{categories\.map\(\(c, i\)/g, "{displayCategories.map((c, i)");

fs.writeFileSync('src/components/home/CategoriesSection.tsx', categoriesSection);

// 4. Products.tsx / Data.tsx fixes (optional, but good)

console.log("Done");
