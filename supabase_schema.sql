-- SQL Script to create all necessary tables for Supabase Migration

-- 1. Users Table
CREATE TABLE public.users (
  uid TEXT PRIMARY KEY,
  "displayName" TEXT,
  "photoURL" TEXT,
  role TEXT,
  name TEXT,
  phone TEXT,
  email TEXT,
  "countryCode" TEXT,
  address TEXT,
  "walletBalance" NUMERIC DEFAULT 0,
  "totalSpent" NUMERIC DEFAULT 0,
  "orderCount" INTEGER DEFAULT 0,
  "lastOrderDate" TIMESTAMP WITH TIME ZONE,
  "joinDate" TIMESTAMP WITH TIME ZONE,
  "isBlocked" BOOLEAN DEFAULT false,
  "isActive" BOOLEAN DEFAULT true,
  "isAdmin" BOOLEAN DEFAULT false,
  "adminRole" TEXT,
  "adminName" TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  tags TEXT[]
);

-- 2. Products Table
CREATE TABLE public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  "originalPrice" NUMERIC,
  rating NUMERIC DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  image TEXT,
  images TEXT[],
  category TEXT,
  "isNew" BOOLEAN DEFAULT false,
  brand TEXT,
  description TEXT,
  specs JSONB,
  colors TEXT[],
  sizes TEXT[],
  "inStock" BOOLEAN DEFAULT true,
  "stockCount" INTEGER DEFAULT 0,
  "costPrice" NUMERIC,
  "minStock" INTEGER DEFAULT 0,
  "metaTitle" TEXT,
  "metaDescription" TEXT,
  sku TEXT,
  status TEXT DEFAULT 'active'
);

-- 3. Reviews Table
CREATE TABLE public.reviews (
  id TEXT PRIMARY KEY,
  "productId" TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  "userId" TEXT REFERENCES public.users(uid) ON DELETE SET NULL,
  "userName" TEXT,
  "userImage" TEXT,
  rating INTEGER,
  comment TEXT,
  images TEXT[],
  status TEXT DEFAULT 'pending',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Orders Table
CREATE TABLE public.orders (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES public.users(uid) ON DELETE SET NULL,
  "customerName" TEXT,
  "customerPhone" TEXT,
  "customerImage" TEXT,
  "shippingAddress" TEXT,
  city TEXT,
  district TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  items JSONB NOT NULL,
  subtotal NUMERIC NOT NULL,
  "shippingFee" NUMERIC NOT NULL,
  "discountAmount" NUMERIC DEFAULT 0,
  "couponCode" TEXT,
  total NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  "paymentMethod" TEXT,
  "paymentReference" TEXT,
  "paymentProof" TEXT,
  "paymentAmount" TEXT,
  "shippingMethod" TEXT,
  "deliveryInstructions" TEXT,
  currency TEXT
);

-- 5. Categories Table
CREATE TABLE public.categories (
  id TEXT PRIMARY KEY,
  name TEXT,
  image TEXT,
  icon TEXT,
  description TEXT,
  "isActive" BOOLEAN DEFAULT true
);

-- 6. Coupons Table
CREATE TABLE public.coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  "discountType" TEXT,
  "discountValue" NUMERIC,
  "minOrderValue" NUMERIC,
  "expiryDate" TIMESTAMP WITH TIME ZONE,
  "usageLimit" INTEGER,
  "usedCount" INTEGER DEFAULT 0,
  "isActive" BOOLEAN DEFAULT true
);

-- 7. Banners Table
CREATE TABLE public.banners (
  id TEXT PRIMARY KEY,
  image TEXT NOT NULL,
  images TEXT[],
  title TEXT,
  subtitle TEXT,
  link TEXT,
  "isActive" BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  position TEXT,
  "startDate" TIMESTAMP WITH TIME ZONE,
  "endDate" TIMESTAMP WITH TIME ZONE,
  views INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0
);

-- 8. Wallet Recharges
CREATE TABLE public.recharges (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES public.users(uid) ON DELETE CASCADE,
  "userName" TEXT,
  "userPhone" TEXT,
  amount NUMERIC NOT NULL,
  reference TEXT,
  proof TEXT,
  status TEXT DEFAULT 'pending',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE,
  method TEXT
);

-- 9. Support Tickets
CREATE TABLE public.support_tickets (
  id TEXT PRIMARY KEY,
  "customerId" TEXT REFERENCES public.users(uid) ON DELETE CASCADE,
  "customerName" TEXT,
  subject TEXT,
  message TEXT,
  status TEXT DEFAULT 'open',
  priority TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  replies JSONB DEFAULT '[]'::jsonb
);

-- 10. Passkeys Table (WebAuthn)
CREATE TABLE public.passkeys (
  id TEXT PRIMARY KEY,
  "credentialPublicKey" TEXT NOT NULL,
  "credentialID" TEXT NOT NULL,
  counter INTEGER DEFAULT 0,
  uid TEXT REFERENCES public.users(uid) ON DELETE CASCADE,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "lastUsedAt" TIMESTAMP WITH TIME ZONE
);

-- Enable Row Level Security (RLS) for all tables initially to public for easy migration
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recharges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.passkeys ENABLE ROW LEVEL SECURITY;

-- Create basic policies (Allowing all for now so the migration script doesn't fail; PLEASE SECURE LATER)
CREATE POLICY "Allow all on users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow all on products" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow all on reviews" ON public.reviews FOR ALL USING (true);
CREATE POLICY "Allow all on orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Allow all on categories" ON public.categories FOR ALL USING (true);
CREATE POLICY "Allow all on coupons" ON public.coupons FOR ALL USING (true);
CREATE POLICY "Allow all on banners" ON public.banners FOR ALL USING (true);
CREATE POLICY "Allow all on recharges" ON public.recharges FOR ALL USING (true);
CREATE POLICY "Allow all on support_tickets" ON public.support_tickets FOR ALL USING (true);
CREATE POLICY "Allow all on passkeys" ON public.passkeys FOR ALL USING (true);
