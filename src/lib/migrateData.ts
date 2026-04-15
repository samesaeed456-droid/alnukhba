import { db } from './firebase';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';
import { products as defaultProducts } from '../data';

export const migrateLocalDataToFirebase = async () => {
  try {
    console.log('Starting migration to Firebase...');

    // 1. Migrate Settings
    const localSettings = localStorage.getItem('store_settings');
    if (localSettings) {
      await setDoc(doc(db, 'settings', 'store'), JSON.parse(localSettings));
    } else {
      // Generic default settings
      await setDoc(doc(db, 'settings', 'store'), {
        storeName: 'متجري',
        currency: 'YER_OLD',
        shippingFee: 0,
        freeShippingThreshold: 0,
        taxRate: 0,
        contactEmail: '',
        contactPhone: '',
        address: '',
        socialMedia: {
          facebook: '',
          twitter: '',
          instagram: ''
        },
        theme: {
          primaryColor: '#000000',
          secondaryColor: '#ffffff',
          fontFamily: 'Inter'
        },
        seo: {
          title: 'متجري',
          description: '',
          keywords: ''
        },
        autoNotifications: {
          enabled: true,
          sms: true,
          email: true,
          onStatusChange: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
        },
        paymentMethods: [
          { id: 'wallet', name: 'المحفظة الإلكترونية', type: 'wallet', isActive: true, requiresProof: false }
        ]
      });
    }

    // 2. Migrate Products
    const localProducts = localStorage.getItem('store_products');
    const productsToMigrate = localProducts ? JSON.parse(localProducts) : defaultProducts;
    
    for (const product of productsToMigrate) {
      await setDoc(doc(db, 'products', String(product.id)), product);
    }

    // 3. Migrate Categories
    const localCategories = localStorage.getItem('store_categories');
    if (localCategories) {
      const categories = JSON.parse(localCategories);
      for (const cat of categories) {
        await setDoc(doc(db, 'categories', String(cat.id)), cat);
      }
    }

    // 4. Migrate Coupons
    const localCoupons = localStorage.getItem('store_coupons');
    if (localCoupons) {
      const coupons = JSON.parse(localCoupons);
      for (const coupon of coupons) {
        await setDoc(doc(db, 'coupons', String(coupon.id)), coupon);
      }
    }

    // 5. Migrate Tickets
    const localTickets = localStorage.getItem('store_tickets');
    if (localTickets) {
      const tickets = JSON.parse(localTickets);
      for (const ticket of tickets) {
        await setDoc(doc(db, 'support_tickets', String(ticket.id)), ticket);
      }
    }

    // 6. Migrate Blog Posts
    const localPosts = localStorage.getItem('store_blog');
    if (localPosts) {
      const posts = JSON.parse(localPosts);
      for (const post of posts) {
        await setDoc(doc(db, 'blog_posts', String(post.id)), post);
      }
    }

    // 7. Migrate Pages
    const localPages = localStorage.getItem('store_pages');
    if (localPages) {
      const pages = JSON.parse(localPages);
      for (const page of pages) {
        await setDoc(doc(db, 'static_pages', String(page.id)), page);
      }
    }

    // 8. Migrate Shipping Zones
    const localZones = localStorage.getItem('store_shipping_zones');
    if (localZones) {
      const zones = JSON.parse(localZones);
      for (const zone of zones) {
        await setDoc(doc(db, 'shipping_zones', String(zone.id)), zone);
      }
    }

    // 9. Migrate Banners
    const localBanners = localStorage.getItem('store_banners');
    if (localBanners) {
      const banners = JSON.parse(localBanners);
      for (const banner of banners) {
        await setDoc(doc(db, 'banners', String(banner.id)), banner);
      }
    }

    console.log('Migration completed successfully!');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
};
