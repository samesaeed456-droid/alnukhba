import { db, adminDb, adminAuth, collection, getDocs } from "./firebase";
import { supabase } from "./supabase";

export interface MigrationStep {
  id: string;
  name: string;
  collection: string;
  table: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  count: number;
  error?: string;
}

const ALLOWED_COLUMNS: Record<string, string[]> = {
  categories: ['id', 'name', 'image', 'icon', 'description', 'isActive'],
  products: [
    'id', 'name', 'price', 'originalPrice', 'rating', 'reviews', 'image', 'images',
    'category', 'isNew', 'brand', 'description', 'specs', 'colors', 'sizes',
    'inStock', 'stockCount', 'costPrice', 'minStock', 'metaTitle', 'metaDescription',
    'sku', 'status'
  ],
  users: [
    'uid', 'displayName', 'photoURL', 'role', 'name', 'phone', 'email', 'countryCode',
    'address', 'walletBalance', 'totalSpent', 'orderCount', 'lastOrderDate', 'joinDate',
    'isBlocked', 'isActive', 'isAdmin', 'adminRole', 'adminName', 'preferences', 'tags'
  ],
  orders: [
    'id', 'userId', 'customerName', 'customerPhone', 'customerImage', 'shippingAddress',
    'city', 'district', 'date', 'items', 'subtotal', 'shippingFee', 'discountAmount',
    'couponCode', 'total', 'status', 'paymentMethod', 'paymentReference', 'paymentProof',
    'paymentAmount', 'shippingMethod', 'deliveryInstructions', 'currency'
  ],
  coupons: [
    'id', 'code', 'discountType', 'discountValue', 'minOrderValue', 'expiryDate',
    'usageLimit', 'usedCount', 'isActive'
  ],
  recharges: [
    'id', 'userId', 'userName', 'userPhone', 'amount', 'reference', 'proof', 'status',
    'createdAt', 'updatedAt', 'method'
  ],
  support_tickets: [
    'id', 'customerId', 'customerName', 'subject', 'message', 'status', 'priority',
    'createdAt', 'replies'
  ]
};

/**
 * Advanced script to migrate data from Firebase arrays & documents to Supabase Tables
 * Includes detailed callbacks to report progress per collection.
 */
export const migrateFirebaseToSupabaseWithProgress = async (
  onStepProgress: (steps: MigrationStep[]) => void
) => {
  const supabaseClient = supabase();
  
  if (!supabaseClient) {
    throw new Error("Supabase client is not initialized. Please configure credentials first.");
  }

  // Support dynamic Firestore databases based on the active authentication session
  const activeDb = adminAuth.currentUser ? adminDb : db;

  const steps: MigrationStep[] = [
    { id: 'categories', name: 'الأقسام والأسماء (Categories)', collection: 'categories', table: 'categories', status: 'idle', count: 0 },
    { id: 'products', name: 'المنتجات والمخزون (Products)', collection: 'products', table: 'products', status: 'idle', count: 0 },
    { id: 'users', name: 'حسابات العملاء (Users)', collection: 'users', table: 'users', status: 'idle', count: 0 },
    { id: 'orders', name: 'طلبات الشراء والعمليات (Orders)', collection: 'orders', table: 'orders', status: 'idle', count: 0 },
    { id: 'coupons', name: 'كوبونات الخصم (Coupons)', collection: 'coupons', table: 'coupons', status: 'idle', count: 0 },
    { id: 'recharges', name: 'عمليات شحن المحفظة (Recharges)', collection: 'recharges', table: 'recharges', status: 'idle', count: 0 },
    { id: 'support_tickets', name: 'تذاكر الدعم الفني (Support Tickets)', collection: 'support_tickets', table: 'support_tickets', status: 'idle', count: 0 },
  ];

  // Track uids of migrated users to safeguard foreign keys in dependent tables
  const migratedUserUids = new Set<string>();

  // Pre-load existing user uids from Supabase users table to prevent redundant placeholder insertion
  try {
    const { data: existingUsers, error } = await supabaseClient.from('users').select('uid');
    if (!error && existingUsers) {
      existingUsers.forEach((u: any) => {
        if (u.uid) migratedUserUids.add(u.uid);
      });
      console.log(`[Migration] Loaded ${migratedUserUids.size} existing user uids from Supabase users table.`);
    }
  } catch (err) {
    console.error("[Migration] Failed to load existing users from Supabase:", err);
  }

  // Helper inside the migration context to create skeleton placeholder users
  const ensureUserExists = async (uid: string, displayName: string, phone?: string) => {
    if (!uid || uid === 'guest') return;
    if (migratedUserUids.has(uid)) return;

    try {
      console.log(`[Migration] Creating placeholder user record for referenced UID: ${uid}`);
      const { error } = await supabaseClient.from('users').upsert({
        uid,
        displayName: displayName || 'عميل مسجل',
        name: displayName || 'عميل مسجل',
        phone: phone || '',
        isActive: true,
        role: 'customer'
      }, { onConflict: 'uid' });

      if (!error) {
        migratedUserUids.add(uid);
      } else {
        console.warn(`[Migration] Warning creating placeholder user ${uid}:`, error.message);
      }
    } catch (err) {
      console.warn(`[Migration] Exception creating placeholder user ${uid}:`, err);
    }
  };

  // Trigger initial idle state
  onStepProgress([...steps]);

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    step.status = 'loading';
    onStepProgress([...steps]);

    try {
      console.log(`Starting migration for: ${step.collection}`);
      const querySnap = await getDocs(collection(activeDb, step.collection));
      
      const items = querySnap.docs.map(doc => {
        const data = doc.data();
        const docData: any = { id: doc.id, ...data };
        
        // Map document ID to primary key where schemas vary
        if (step.id === 'users') {
          docData.uid = doc.id;
          migratedUserUids.add(doc.id);
          delete docData.id;
        }

        // Deep-scan for Firestore date formats & translate to standard ISO strings
        for (const [key, val] of Object.entries(docData)) {
          if (val && typeof val === 'object') {
            if ('toDate' in val && typeof (val as any).toDate === 'function') {
              docData[key] = (val as any).toDate().toISOString();
            } else if ('seconds' in val && 'nanoseconds' in val) {
              docData[key] = new Date((val as any).seconds * 1000).toISOString();
            }
          }
        }

        // Apply specific field-mismatch translations
        if (step.id === 'support_tickets') {
          docData.customerId = docData.customerId || docData.userId || docData.customerUid;
        }
        if (step.id === 'users') {
          docData.displayName = docData.displayName || docData.name;
          docData.photoURL = docData.photoURL || docData.photoUrl;
          if (docData.walletBalance === undefined) docData.walletBalance = docData.balance || 0;
          if (docData.isBlocked === undefined) docData.isBlocked = docData.blocked || false;
          if (docData.isActive === undefined) docData.isActive = docData.active !== false;
          if (docData.isAdmin === undefined) docData.isAdmin = docData.admin || false;
        }
        if (step.id === 'products') {
          if (docData.stockCount === undefined) docData.stockCount = docData.stock || 0;
          if (docData.inStock === undefined) docData.inStock = docData.stockCount > 0;
        }
        if (step.id === 'orders') {
          const rawId = docData.userId || docData.userUid;
          docData.userId = rawId && rawId !== 'guest' ? rawId : null;
          if (docData.discountAmount === undefined) docData.discountAmount = docData.discount || docData.discountValue || 0;
        }
        if (step.id === 'coupons') {
          docData.discountType = docData.discountType || docData.type;
          docData.discountValue = docData.discountValue || docData.amount || docData.value || 0;
          docData.minOrderValue = docData.minOrderValue || docData.minOrder || 0;
          docData.expiryDate = docData.expiryDate || docData.expiry || null;
        }

        // Filter keys to keep ONLY those present in the Supabase table's schema
        const allowed = ALLOWED_COLUMNS[step.id];
        if (allowed) {
          const filtered: any = {};
          for (const key of allowed) {
            if (docData[key] !== undefined) {
              filtered[key] = docData[key];
            }
          }
          return filtered;
        }

        return docData;
      });

      if (items.length > 0) {
        // Safe check and insertion of placeholders before doing the bulk upsert to pass foreign key validations
        if (step.id === 'orders') {
          for (const item of items) {
            if (item.userId) {
              await ensureUserExists(item.userId, item.customerName || 'عميل طلب', item.customerPhone || '');
            }
          }
        } else if (step.id === 'recharges') {
          for (const item of items) {
            if (item.userId) {
              await ensureUserExists(item.userId, item.userName || 'عميل شحن', item.userPhone || '');
            }
          }
        } else if (step.id === 'support_tickets') {
          for (const item of items) {
            if (item.customerId) {
              await ensureUserExists(item.customerId, item.customerName || 'عميل تذكرة');
            }
          }
        }

        // Run full Upsert operation to bypass duplicate insert faults
        const { error: upsertError } = await supabaseClient.from(step.table).upsert(items);
        if (upsertError) {
          throw upsertError;
        }
        step.count = items.length;
      }
      
      step.status = 'success';
    } catch (err: any) {
      console.error(`Migration error on table ${step.table}:`, err);
      step.status = 'error';
      step.error = err.message || JSON.stringify(err);
    }

    // Refresh UI after each table completes
    onStepProgress([...steps]);
  }
  
  return steps.every(s => s.status === 'success');
};

/**
 * Kept for backwards compatibility
 */
export const migrateFirebaseToSupabase = async () => {
  try {
    return await migrateFirebaseToSupabaseWithProgress(() => {});
  } catch (e) {
    console.error(e);
    return false;
  }
};
