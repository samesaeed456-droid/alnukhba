const fs = require('fs');

function fixDataTs() {
  let content = fs.readFileSync('src/data.ts', 'utf8');
  content = content.replace(/id:\s*(\d+)\s*,/g, "id: '$1',");
  fs.writeFileSync('src/data.ts', content);
}

function fixProductCard() {
  let content = fs.readFileSync('src/components/ProductCard.tsx', 'utf8');
  content = content.replace(/product\.id \+ 1/g, "Number(product.id) + 1");
  content = content.replace(/product\.id \+ 2/g, "Number(product.id) + 2");
  content = content.replace(/product\.id \+ 3/g, "Number(product.id) + 3");
  fs.writeFileSync('src/components/ProductCard.tsx', content);
}

function fixNotificationsDrawer() {
  let content = fs.readFileSync('src/components/layout/NotificationsDrawer.tsx', 'utf8');
  content = content.replace(/product\.id === notification\.data\.productId/g, "product.id === String(notification.data.productId)");
  content = content.replace(/subscribeToProduct\(product\.id/g, "subscribeToProduct(String(product.id)");
  fs.writeFileSync('src/components/layout/NotificationsDrawer.tsx', content);
}

function fixWishlistDrawer() {
  let content = fs.readFileSync('src/components/layout/WishlistDrawer.tsx', 'utf8');
  content = content.replace(/setRemovingId\(product\.id\)/g, "setRemovingId(String(product.id))");
  content = content.replace(/removingId === product\.id/g, "removingId === String(product.id)");
  content = content.replace(/const \[removingId, setRemovingId\] = useState<number \| null>\(null\);/g, "const [removingId, setRemovingId] = useState<string | null>(null);");
  fs.writeFileSync('src/components/layout/WishlistDrawer.tsx', content);
}

function fixStoreContext() {
  let content = fs.readFileSync('src/context/StoreContext.tsx', 'utf8');
  content = content.replace(/item\.product\.id === id/g, "item.product.id === String(id)");
  content = content.replace(/p\.id === id/g, "p.id === String(id)");
  content = content.replace(/p\.id === productId/g, "p.id === String(productId)");
  content = content.replace(/updateProduct:\s*\(id:\s*number/g, "updateProduct: (id: string");
  content = content.replace(/deleteProduct:\s*\(id:\s*number/g, "deleteProduct: (id: string");
  content = content.replace(/updateStock:\s*\(productId:\s*number/g, "updateStock: (productId: string");
  content = content.replace(/bulkUpdateStock:\s*\(updates:\s*\{\s*productId:\s*number/g, "bulkUpdateStock: (updates: { productId: string");
  content = content.replace(/subscribeToProduct:\s*\(productId:\s*number/g, "subscribeToProduct: (productId: string");
  fs.writeFileSync('src/context/StoreContext.tsx', content);
}

function fixNotifications() {
  let content = fs.readFileSync('src/pages/Notifications.tsx', 'utf8');
  content = content.replace(/product\.id === notification\.data\.productId/g, "product.id === String(notification.data.productId)");
  fs.writeFileSync('src/pages/Notifications.tsx', content);
}

function fixProductDetail() {
  let content = fs.readFileSync('src/pages/ProductDetail.tsx', 'utf8');
  content = content.replace(/p\.id === parseInt\(id \|\| '0'\)/g, "p.id === id");
  content = content.replace(/p\.id === Number\(id\)/g, "p.id === id");
  content = content.replace(/product\.id \+ 1/g, "Number(product.id) + 1");
  fs.writeFileSync('src/pages/ProductDetail.tsx', content);
}

function fixAnalytics() {
  let content = fs.readFileSync('src/pages/admin/Analytics.tsx', 'utf8');
  content = content.replace(/p\.id === item\.productId/g, "p.id === String(item.productId)");
  fs.writeFileSync('src/pages/admin/Analytics.tsx', content);
}

function fixRecommendationService() {
  let content = fs.readFileSync('src/services/recommendationService.ts', 'utf8');
  content = content.replace(/!viewedIds\.has\(p\.id\)/g, "!viewedIds.has(String(p.id))");
  content = content.replace(/viewedIds\.add\(product\.id\)/g, "viewedIds.add(String(product.id))");
  fs.writeFileSync('src/services/recommendationService.ts', content);
}

fixDataTs();
fixProductCard();
fixNotificationsDrawer();
fixWishlistDrawer();
fixStoreContext();
fixNotifications();
fixProductDetail();
fixAnalytics();
fixRecommendationService();
