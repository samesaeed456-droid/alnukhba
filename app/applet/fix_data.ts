import fs from 'fs';

let content = fs.readFileSync('src/data.ts', 'utf8');
content = content.replace(/id:\s*(\d+)\s*,/g, "id: '$1',");
fs.writeFileSync('src/data.ts', content);

let pc = fs.readFileSync('src/components/ProductCard.tsx', 'utf8');
pc = pc.replace(/product\.id \+ 1/g, "Number(product.id) + 1");
pc = pc.replace(/product\.id \+ 2/g, "Number(product.id) + 2");
pc = pc.replace(/product\.id \+ 3/g, "Number(product.id) + 3");
fs.writeFileSync('src/components/ProductCard.tsx', pc);

let nd = fs.readFileSync('src/components/layout/NotificationsDrawer.tsx', 'utf8');
nd = nd.replace(/product\.id === notification\.data\.productId/g, "product.id === String(notification.data.productId)");
nd = nd.replace(/subscribeToProduct\(product\.id/g, "subscribeToProduct(String(product.id)");
fs.writeFileSync('src/components/layout/NotificationsDrawer.tsx', nd);

let wd = fs.readFileSync('src/components/layout/WishlistDrawer.tsx', 'utf8');
wd = wd.replace(/setRemovingId\(product\.id\)/g, "setRemovingId(String(product.id))");
wd = wd.replace(/removingId === product\.id/g, "removingId === String(product.id)");
wd = wd.replace(/const \[removingId, setRemovingId\] = useState<number \| null>\(null\);/g, "const [removingId, setRemovingId] = useState<string | null>(null);");
fs.writeFileSync('src/components/layout/WishlistDrawer.tsx', wd);

let notif = fs.readFileSync('src/pages/Notifications.tsx', 'utf8');
notif = notif.replace(/product\.id === notification\.data\.productId/g, "product.id === String(notification.data.productId)");
fs.writeFileSync('src/pages/Notifications.tsx', notif);

let pd = fs.readFileSync('src/pages/ProductDetail.tsx', 'utf8');
pd = pd.replace(/p\.id === parseInt\(id \|\| '0'\)/g, "p.id === id");
pd = pd.replace(/p\.id === Number\(id\)/g, "p.id === id");
pd = pd.replace(/product\.id \+ 1/g, "Number(product.id) + 1");
fs.writeFileSync('src/pages/ProductDetail.tsx', pd);

let analytics = fs.readFileSync('src/pages/admin/Analytics.tsx', 'utf8');
analytics = analytics.replace(/p\.id === item\.productId/g, "p.id === String(item.productId)");
fs.writeFileSync('src/pages/admin/Analytics.tsx', analytics);

let rs = fs.readFileSync('src/services/recommendationService.ts', 'utf8');
rs = rs.replace(/!viewedIds\.has\(p\.id\)/g, "!viewedIds.has(String(p.id))");
rs = rs.replace(/viewedIds\.add\(product\.id\)/g, "viewedIds.add(String(product.id))");
fs.writeFileSync('src/services/recommendationService.ts', rs);

console.log("Done");
