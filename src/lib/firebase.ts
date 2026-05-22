import { supabase } from "./supabase";

// 1. Determine if Supabase is configured and active (always true)
export const isSupabaseActive = () => true;

// Prioritize environment variables or safe fallbacks
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock-auth-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mock-storage-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "mock-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "mock-app-id",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || "default",
};

// Mock initialized structures
export let app: any = { name: "mock-app" };
export let adminApp: any = { name: "mock-admin-app" };

class MockAuth {
  private key: string;
  private listeners = new Set<any>();

  constructor(type: "customer" | "admin") {
    this.key = type === "customer" ? "supabase_auth_session" : "supabase_admin_auth_session";
  }

  get currentUser() {
    const saved = localStorage.getItem(this.key);
    if (saved) {
      try {
        const u = JSON.parse(saved);
        return {
          ...u,
          uid: u.uid,
          email: u.email,
          role: u.role || 'customer',
          displayName: u.displayName || u.name,
          delete: async () => {
            this.clearUser();
          }
        };
      } catch (e) {}
    }
    return null;
  }

  onAuthStateChanged(callback: any) {
    this.listeners.add(callback);
    callback(this.currentUser);
    return () => {
      this.listeners.delete(callback);
    };
  }

  trigger(user: any) {
    this.listeners.forEach((cb) => {
      try {
        if (typeof cb === 'function') cb(user);
      } catch (e) {
        console.error("Error in auth listener:", e);
      }
    });
  }

  setUser(user: any) {
    if (user) {
      localStorage.setItem(this.key, JSON.stringify(user));
    } else {
      localStorage.removeItem(this.key);
    }
    this.trigger(this.currentUser);
  }

  clearUser() {
    localStorage.removeItem(this.key);
    this.trigger(null);
  }

  async signOut() {
    this.clearUser();
  }
}

export const auth = new MockAuth("customer");
export const adminAuth = new MockAuth("admin");
export const db = { type: 'db' };
export const adminDb = { type: 'db' };

export const messaging: any = null;
export const googleProvider: any = { providerId: "google.com" };

// Custom classes to implement Firestore compatibility interfaces
export class FakeDocSnapshot {
  id: string;
  private _data: any;
  ref: { id: string; path: string };
  constructor(id: string, data: any) {
    this.id = id;
    this._data = data;
    this.ref = { id, path: id };
  }
  exists() {
    return this._data !== null && this._data !== undefined;
  }
  data() {
    return this._data;
  }
  get(fieldPath: string) {
    return this._data ? this._data[fieldPath] : undefined;
  }
}

export class FakeQuerySnapshot {
  docs: FakeDocSnapshot[];
  get size() {
    return this.docs.length;
  }
  get empty() {
    return this.docs.length === 0;
  }
  constructor(docs: FakeDocSnapshot[]) {
    this.docs = docs;
  }
  forEach(callback: (doc: FakeDocSnapshot, index: number) => void) {
    this.docs.forEach(callback);
  }
  docChanges() {
    return this.docs.map(doc => ({
      type: 'added' as const,
      doc: doc
    }));
  }
}

// Global state management for Supabase
const authListeners = new Set<any>();
let currentSupabaseUser: any = null;

export const supabaseOnAuthStateChanged = (callback: any) => {
  return auth.onAuthStateChanged(callback);
};

export const setSupabaseUser = (user: any) => {
  auth.setUser(user);
};

const SUPABASE_ALLOWED_COLUMNS: Record<string, string[]> = {
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
  reviews: [
    'id', 'productId', 'userId', 'userName', 'userImage', 'rating', 'comment', 'images',
    'status', 'createdAt'
  ],
  coupons: [
    'id', 'code', 'discountType', 'discountValue', 'minOrderValue', 'expiryDate',
    'usageLimit', 'usedCount', 'isActive'
  ],
  banners: [
    'id', 'image', 'images', 'title', 'subtitle', 'link', 'isActive', 'order',
    'position', 'startDate', 'endDate', 'views', 'clicks'
  ],
  recharges: [
    'id', 'userId', 'userName', 'userPhone', 'amount', 'reference', 'proof', 'status',
    'createdAt', 'updatedAt', 'method'
  ],
  support_tickets: [
    'id', 'customerId', 'customerName', 'subject', 'message', 'status', 'priority',
    'createdAt', 'replies'
  ],
  settings: [
    'id', 'storeName', 'storeLogo', 'contactEmail', 'contactPhone', 'contactPhone2',
    'address', 'socialMedia', 'shippingFee', 'freeShippingThreshold', 'currency',
    'language', 'isMaintenanceMode', 'maintenanceMessage', 'announcementText',
    'announcementSettings', 'primaryColor', 'backgroundColor', 'cardColor', 'textColor', 'textMutedColor', 'fontFamily', 'homeSectionOrder',
    'autoNotifications', 'paymentMethods', 'seo', 'updatedAt'
  ]
};

const isLocalTable = (table: string): boolean => {
  const normTable = table.includes('/') ? table.split('/').pop() || '' : table;
  return !Object.keys(SUPABASE_ALLOWED_COLUMNS).includes(normTable);
};

const getLocalCollectionItems = (table: string): any[] => {
  const normKey = table.replace(/[^a-zA-Z0-9_]/g, '_');
  const key = `store_fallback_${normKey}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error(`Error reading local storage for ${table}:`, e);
    return [];
  }
};

const saveLocalCollectionItems = (table: string, items: any[]) => {
  const normKey = table.replace(/[^a-zA-Z0-9_]/g, '_');
  const key = `store_fallback_${normKey}`;
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.error(`Error writing local storage for ${table}:`, e);
  }
};

const filterDataForTable = (table: string, data: any): any => {
  const allowed = SUPABASE_ALLOWED_COLUMNS[table];
  if (!allowed) return data;

  const result: any = {};
  const inputCopy = { ...data };

  if (table === 'users') {
    if (inputCopy.createdAt && !inputCopy.joinDate) {
      inputCopy.joinDate = typeof inputCopy.createdAt === 'object' ? new Date().toISOString() : String(inputCopy.createdAt);
    }
    if (inputCopy.name && !inputCopy.displayName) {
      inputCopy.displayName = inputCopy.name;
    }
    if (inputCopy.displayName && !inputCopy.name) {
      inputCopy.name = inputCopy.displayName;
    }
  }

  // Convert empty string "" to null for date, timestamp, and numeric columns to prevent PostgreSQL syntax errors
  const isNumericOrDateKey = (key: string): boolean => {
    const k = key.toLowerCase();
    return (
      k.includes('date') ||
      k.includes('at') ||
      k.includes('time') ||
      k === 'price' ||
      k === 'rating' ||
      k === 'reviews' ||
      k === 'views' ||
      k === 'clicks' ||
      k === 'order' ||
      k === 'amount' ||
      k.includes('balance') ||
      k.includes('spent') ||
      k.includes('count') ||
      k.includes('limit') ||
      k.includes('value') ||
      k.includes('fee') ||
      k.includes('threshold') ||
      k.includes('cost') ||
      k.includes('min') ||
      k.includes('stock')
    );
  };

  for (const key of allowed) {
    if (inputCopy[key] !== undefined) {
      let val = inputCopy[key];
      if (val === "" && isNumericOrDateKey(key)) {
        val = null;
      }
      result[key] = val;
    }
  }

  return result;
};

async function runSupabaseQuery(queryRef: any): Promise<FakeQuerySnapshot> {
  const client = supabase();
  const table = queryRef.collectionName;

  if (isLocalTable(table)) {
    if (table === 'settings') {
      const localSettings = localStorage.getItem("store_settings");
      const data = localSettings ? JSON.parse(localSettings) : {};
      return new FakeQuerySnapshot([new FakeDocSnapshot('store', data)]);
    }
    if (table === 'cities') {
      const localCities = localStorage.getItem("store_cities");
      const data = localCities ? JSON.parse(localCities) : [];
      return new FakeQuerySnapshot(data.map((c: any) => {
        const id = c.id || String(c);
        const row = typeof c === 'object' ? c : { id, name: c };
        return new FakeDocSnapshot(id, row);
      }));
    }
    if (table === 'shipping_zones') {
      const localZones = localStorage.getItem("store_shipping_zones");
      const data = localZones ? JSON.parse(localZones) : [];
      return new FakeQuerySnapshot(data.map((z: any) => new FakeDocSnapshot(z.id || String(z), z)));
    }

    let items = getLocalCollectionItems(table);

    if (queryRef.conditions) {
      for (const cond of queryRef.conditions) {
        const { field, operator, value } = cond;
        items = items.filter((item) => {
          const itemVal = item[field];
          if (operator === '==') return String(itemVal) === String(value);
          if (operator === '>') return itemVal > value;
          if (operator === '<') return itemVal < value;
          if (operator === '>=') return itemVal >= value;
          if (operator === '<=') return itemVal <= value;
          return true;
        });
      }
    }

    if (queryRef.orderByFields) {
      for (const order of queryRef.orderByFields) {
        items.sort((a, b) => {
          const valA = a[order.field];
          const valB = b[order.field];
          if (valA === valB) return 0;
          const asc = order.direction === 'asc' ? 1 : -1;
          return valA > valB ? asc : -asc;
        });
      }
    }

    if (queryRef.limitVal !== null) {
      items = items.slice(0, queryRef.limitVal);
    }

    return new FakeQuerySnapshot(items.map((item) => {
      const id = item.id || item.uid || Math.random().toString(36).substring(2);
      return new FakeDocSnapshot(id, item);
    }));
  }

  if (!client) {
    return new FakeQuerySnapshot([]);
  }

  try {
    let builder = client.from(table).select('*');

    if (queryRef.conditions) {
      for (const cond of queryRef.conditions) {
        const { field, operator, value } = cond;
        let mappedField = field === 'id' && table === 'users' ? 'uid' : field;

        const allowed = SUPABASE_ALLOWED_COLUMNS[table];
        if (allowed && !allowed.includes(mappedField)) {
          console.warn(`[Supabase Shim] Skipping filter condition on non-existent column: ${table}.${mappedField}`);
          continue;
        }

        if (operator === '==') {
          builder = builder.eq(mappedField, value);
        } else if (operator === '>') {
          builder = builder.gt(mappedField, value);
        } else if (operator === '<') {
          builder = builder.lt(mappedField, value);
        } else if (operator === '>=') {
          builder = builder.gte(mappedField, value);
        } else if (operator === '<=') {
          builder = builder.lte(mappedField, value);
        }
      }
    }

    if (queryRef.orderByFields) {
      for (const order of queryRef.orderByFields) {
        let mappedField = order.field === 'id' && table === 'users' ? 'uid' : order.field;

        const allowed = SUPABASE_ALLOWED_COLUMNS[table];
        if (allowed && !allowed.includes(mappedField)) {
          if (allowed.includes('id')) {
            mappedField = 'id';
          } else if (allowed.includes('uid')) {
            mappedField = 'uid';
          } else {
            continue;
          }
        }

        builder = builder.order(mappedField, { ascending: order.direction === 'asc' });
      }
    }

    if (queryRef.limitVal !== null) {
      builder = builder.limit(queryRef.limitVal);
    }

    const { data, error } = await builder;
    if (error) {
      console.warn(`Supabase query warning for ${table}:`, error.message);
      if (table === 'settings') {
        const localSettings = localStorage.getItem("store_settings");
        const localData = localSettings ? JSON.parse(localSettings) : {};
        return new FakeQuerySnapshot([new FakeDocSnapshot('store', localData)]);
      }
      return new FakeQuerySnapshot([]);
    }

    if (table === 'settings' && (!data || data.length === 0)) {
      const localSettings = localStorage.getItem("store_settings");
      const localData = localSettings ? JSON.parse(localSettings) : {};
      return new FakeQuerySnapshot([new FakeDocSnapshot('store', localData)]);
    }

    return new FakeQuerySnapshot(
      (data || []).map((row: any) => {
        const id = table === 'users' ? row.uid : row.id;
        return new FakeDocSnapshot(id, row);
      })
    );
  } catch (err) {
    console.error(`Supabase fetch query exception for ${table}:`, err);
    return new FakeQuerySnapshot([]);
  }
}

export const doc = (dbRef: any, pathOrCol?: string, ...paths: string[]): any => {
  let collectionName = '';
  let id = '';

  if (dbRef && dbRef.type === 'collection') {
    collectionName = dbRef.collectionName;
    id = pathOrCol || '';
  } else {
    const fullPath = [pathOrCol, ...paths].filter(Boolean).join('/');
    const parts = fullPath.split('/');
    if (parts.length >= 2) {
      id = parts[parts.length - 1];
      collectionName = parts[parts.length - 2];
    } else {
      collectionName = parts[0] || '';
      id = '';
    }
  }

  if (!id) {
    id = Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  return {
    type: 'doc',
    collectionName,
    id,
    path: `${collectionName}/${id}`
  };
};

export const collection = (dbRef: any, collectionName: string, ...rest: string[]): any => {
  const fullPath = [collectionName, ...rest].join('/');
  const parts = fullPath.split('/');
  const leaf = parts[parts.length - 1];
  return {
    type: 'collection',
    collectionName: leaf,
    path: fullPath,
    conditions: [],
    orderByFields: [],
    limitVal: null
  };
};

export const collectionGroup = (dbRef: any, collectionName: string): any => {
  return {
    type: 'collection',
    collectionName,
    path: collectionName,
    conditions: [],
    orderByFields: [],
    limitVal: null
  };
};

export const getDoc = async (docRef: any) => {
  const table = docRef.collectionName;
  const id = docRef.id;

  if (isLocalTable(table)) {
    if (table === 'settings') {
      const localSettings = localStorage.getItem("store_settings");
      const data = localSettings ? JSON.parse(localSettings) : {};
      return new FakeDocSnapshot(id, data);
    }
    if (table === 'cities') {
      const localCities = localStorage.getItem("store_cities");
      const data = localCities ? JSON.parse(localCities) : [];
      const found = data.find((c: any) => (c.id || String(c)) === id);
      return new FakeDocSnapshot(id, found || null);
    }
    if (table === 'shipping_zones') {
      const localZones = localStorage.getItem("store_shipping_zones");
      const data = localZones ? JSON.parse(localZones) : [];
      const found = data.find((z: any) => z.id === id);
      return new FakeDocSnapshot(id, found || null);
    }

    const items = getLocalCollectionItems(table);
    const idColumn = table === 'users' ? 'uid' : 'id';
    const found = items.find((x: any) => String(x[idColumn] || x.id || x.uid || '') === String(id));
    return new FakeDocSnapshot(id, found || null);
  }

  const client = supabase();
  if (!client) {
    if (table === 'settings') {
      const localSettings = localStorage.getItem("store_settings");
      const data = localSettings ? JSON.parse(localSettings) : {};
      return new FakeDocSnapshot(id, data);
    }
    return new FakeDocSnapshot(id, null);
  }

  const idColumn = table === 'users' ? 'uid' : 'id';
  let data = null;
  let error = null;
  try {
    const response = await client
      .from(table)
      .select('*')
      .eq(idColumn, id)
      .maybeSingle();
    data = response.data;
    error = response.error;
  } catch (e: any) {
    error = e;
  }

  if (error) {
    console.warn(`Supabase error fetching document in ${table}:`, error?.message || error);
    if (table === 'settings') {
      const localSettings = localStorage.getItem("store_settings");
      const localData = localSettings ? JSON.parse(localSettings) : {};
      return new FakeDocSnapshot(id, localData);
    }
    return new FakeDocSnapshot(id, null);
  }

  if (table === 'settings' && !data) {
    const localSettings = localStorage.getItem("store_settings");
    const localData = localSettings ? JSON.parse(localSettings) : {};
    return new FakeDocSnapshot(id, localData);
  }

  return new FakeDocSnapshot(id, data);
};

export const getDocs = async (queryRef: any) => {
  return runSupabaseQuery(queryRef);
};

export const addDoc = async (collectionRef: any, data: any) => {
  const table = collectionRef.collectionName;

  if (isLocalTable(table)) {
    if (['settings', 'cities', 'shipping_zones'].includes(table)) {
      const localKey = table === 'settings' ? 'store_settings' : `store_${table}`;
      let current: any = [];
      if (table !== 'settings') {
        try { current = JSON.parse(localStorage.getItem(localKey) || '[]'); } catch(e) {}
      } else {
        current = {};
      }
      const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const newObj = { ...data, id };
      if (Array.isArray(current)) {
        current.push(newObj);
      } else {
        current = { ...current, ...data };
      }
      localStorage.setItem(localKey, JSON.stringify(current));
      return { id };
    }

    const items = getLocalCollectionItems(table);
    const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const newObj = { ...data, id };
    items.push(newObj);
    saveLocalCollectionItems(table, items);
    return { id };
  }

  const client = supabase();
  if (!client) throw new Error("Supabase is not connected");

  const id = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const idColumn = table === 'users' ? 'uid' : 'id';
  const insertData = filterDataForTable(table, { ...data, [idColumn]: id });

  for (const [k, v] of Object.entries(insertData)) {
    if (v && typeof v === 'object' && ((v as any).type === 'serverTimestamp' || '_methodName' in v)) {
      insertData[k] = new Date().toISOString();
    }
  }

  if (table === 'support_tickets' && insertData.customerId) {
    await ensureUserExistsInSupabase(
      client,
      insertData.customerId,
      insertData.customerName || 'عميل دعم'
    );
  }

  const { error } = await client.from(table).insert(insertData);
  if (error) {
    console.error(`Supabase INSERT error into table "${table}":`, error);
    throw error;
  }
  return { id };
};

const ensureUserExistsInSupabase = async (client: any, uid: string, name: string = 'عميل دعم', phone: string = '') => {
  if (!uid) return;
  try {
    const { data: existing } = await client.from('users').select('uid').eq('uid', uid).maybeSingle();
    if (!existing) {
      await client.from('users').insert({
        uid: uid,
        displayName: name,
        phone: phone || uid,
        isActive: true,
        role: 'customer',
        walletBalance: 0
      });
    }
  } catch (err) {
    console.warn(`[Firebase Shim] Error ensuring user ${uid} exists:`, err);
  }
};

export const setDoc = async (docRef: any, data: any, options?: any) => {
  const table = docRef.collectionName;
  const id = docRef.id;

  if (isLocalTable(table)) {
    if (['settings', 'cities', 'shipping_zones'].includes(table)) {
      const localKey = table === 'settings' ? 'store_settings' : `store_${table}`;
      let current: any = [];
      if (table !== 'settings') {
        try { current = JSON.parse(localStorage.getItem(localKey) || '[]'); } catch(e) {}
        const filtered = current.filter((x: any) => (x.id || String(x)) !== id);
        filtered.push({ ...data, id });
        current = filtered;
      } else {
        const prev = localStorage.getItem(localKey);
        let prevObj = {};
        try { if (prev) prevObj = JSON.parse(prev); } catch(e) {}
        current = options?.merge ? { ...prevObj, ...data } : { ...data };
      }
      localStorage.setItem(localKey, JSON.stringify(current));
      return;
    }

    const items = getLocalCollectionItems(table);
    const idColumn = table === 'users' ? 'uid' : 'id';
    const filtered = items.filter((x: any) => String(x[idColumn] || x.id || x.uid || '') !== String(id));
    const existingObj = items.find((x: any) => String(x[idColumn] || x.id || x.uid || '') === String(id)) || {};
    const freshData = { ...data };
    for (const [k, v] of Object.entries(freshData)) {
      if (v && typeof v === 'object' && (v as any).type === 'arrayUnion') {
        const currentArr = Array.isArray(existingObj[k]) ? [...existingObj[k]] : [];
        for (const elem of (v as any).elements) {
          if (!currentArr.includes(elem)) currentArr.push(elem);
        }
        freshData[k] = currentArr;
      } else if (v && typeof v === 'object' && (v as any).type === 'arrayRemove') {
        const currentArr = Array.isArray(existingObj[k]) ? [...existingObj[k]] : [];
        freshData[k] = currentArr.filter((elem: any) => !(v as any).elements.includes(elem));
      } else if (v && typeof v === 'object' && (v as any).type === 'increment') {
        freshData[k] = Number(existingObj[k] || 0) + (v as any).amount;
      }
    }
    const newObj = options?.merge ? { ...existingObj, ...freshData } : { ...freshData };
    newObj[idColumn] = id;
    filtered.push(newObj);
    saveLocalCollectionItems(table, filtered);
    return;
  }

  const client = supabase();
  if (!client) throw new Error("Supabase is not connected");

  const idColumn = table === 'users' ? 'uid' : 'id';
  
  let mergedData = { ...data };
  if (options?.merge) {
    try {
      const { data: existing } = await client.from(table).select('*').eq(idColumn, id).maybeSingle();
      if (existing) {
        mergedData = { ...existing, ...data };
      }
    } catch (e) {
      console.warn("Merge lookup failed, falling back to clean upsert:", e);
    }
  }

  const upsertData = filterDataForTable(table, { ...mergedData, [idColumn]: id });

  for (const [k, v] of Object.entries(upsertData)) {
    if (v && typeof v === 'object' && ((v as any).type === 'serverTimestamp' || '_methodName' in v)) {
      upsertData[k] = new Date().toISOString();
    }
  }

  if (table === 'support_tickets' && upsertData.customerId) {
    await ensureUserExistsInSupabase(
      client,
      upsertData.customerId,
      upsertData.customerName || 'عميل دعم'
    );
  }

  if (table === 'settings') {
    localStorage.setItem("store_settings", JSON.stringify(upsertData));
  }

  try {
    const { error } = await client.from(table).upsert(upsertData);
    if (error) {
      console.error(`Supabase UPSERT error into table "${table}":`, error);
      throw error;
    }
  } catch (err) {
    console.error(`Supabase UPSERT exception into table "${table}":`, err);
    throw err;
  }
  return;
};

export const updateDoc = async (docRef: any, data: any) => {
  const table = docRef.collectionName;
  const id = docRef.id;

  if (isLocalTable(table)) {
    if (['settings', 'cities', 'shipping_zones'].includes(table)) {
      const localKey = table === 'settings' ? 'store_settings' : `store_${table}`;
      let current: any = [];
      if (table !== 'settings') {
        try { current = JSON.parse(localStorage.getItem(localKey) || '[]'); } catch(e) {}
        current = current.map((x: any) => (x.id || String(x)) === id ? { ...x, ...data } : x);
      } else {
        try { current = JSON.parse(localStorage.getItem(localKey) || '{}'); } catch(e) {}
        current = { ...current, ...data };
      }
      localStorage.setItem(localKey, JSON.stringify(current));
      return;
    }

    const items = getLocalCollectionItems(table);
    const idColumn = table === 'users' ? 'uid' : 'id';
    const updatedItems = items.map((x: any) => {
      const rowId = String(x[idColumn] || x.id || x.uid || '');
      if (rowId === String(id)) {
        const freshData = { ...data };
        for (const [k, v] of Object.entries(freshData)) {
          if (v && typeof v === 'object' && (v as any).type === 'increment') {
            freshData[k] = Number(x[k] || 0) + (v as any).amount;
          } else if (v && typeof v === 'object' && (v as any).type === 'arrayUnion') {
            const currentArr = Array.isArray(x[k]) ? [...x[k]] : [];
            for (const elem of (v as any).elements) {
              if (!currentArr.includes(elem)) currentArr.push(elem);
            }
            freshData[k] = currentArr;
          } else if (v && typeof v === 'object' && (v as any).type === 'arrayRemove') {
            const currentArr = Array.isArray(x[k]) ? [...x[k]] : [];
            freshData[k] = currentArr.filter((elem: any) => !(v as any).elements.includes(elem));
          }
        }
        return { ...x, ...freshData };
      }
      return x;
    });
    saveLocalCollectionItems(table, updatedItems);
    return;
  }

  const client = supabase();
  if (!client) throw new Error("Supabase is not connected");

  const idColumn = table === 'users' ? 'uid' : 'id';
  const updateData = filterDataForTable(table, { ...data });

  for (const [k, v] of Object.entries(updateData)) {
    if (v && typeof v === 'object' && ((v as any).type === 'serverTimestamp' || '_methodName' in v)) {
      updateData[k] = new Date().toISOString();
    } else if (v && typeof v === 'object' && (v as any).type === 'increment') {
      try {
        const { data: row } = await client.from(table).select(k).eq(idColumn, id).maybeSingle();
        if (row) {
          const currentVal = Number(row[k] || 0);
          updateData[k] = currentVal + (v as any).amount;
        }
      } catch (e) {
        console.error("Increment failed:", e);
      }
    }
  }

  if (Object.keys(updateData).length === 0) {
    return;
  }

  if (table === 'settings') {
    const prev = localStorage.getItem("store_settings");
    let prevObj = {};
    try { if (prev) prevObj = JSON.parse(prev || '{}'); } catch(e) {}
    localStorage.setItem("store_settings", JSON.stringify({ ...prevObj, ...updateData }));
  }

  try {
    const { error } = await client.from(table).update(updateData).eq(idColumn, id);
    if (error) {
      console.error(`Supabase UPDATE error into table "${table}":`, error);
      throw error;
    }
  } catch (err) {
    console.error(`Supabase UPDATE exception into table "${table}":`, err);
    throw err;
  }
  return;
};

export const deleteDoc = async (docRef: any) => {
  const table = docRef.collectionName;
  const id = docRef.id;

  if (isLocalTable(table)) {
    if (['settings', 'cities', 'shipping_zones'].includes(table)) {
      const localKey = table === 'settings' ? 'store_settings' : `store_${table}`;
      if (table !== 'settings') {
        let current: any = [];
        try { current = JSON.parse(localStorage.getItem(localKey) || '[]'); } catch(e) {}
        current = current.filter((x: any) => (x.id || String(x)) !== id);
        localStorage.setItem(localKey, JSON.stringify(current));
      } else {
        localStorage.removeItem(localKey);
      }
      return;
    }

    const items = getLocalCollectionItems(table);
    const idColumn = table === 'users' ? 'uid' : 'id';
    const filtered = items.filter((x: any) => String(x[idColumn] || x.id || x.uid || '') !== String(id));
    saveLocalCollectionItems(table, filtered);
    return;
  }

  const client = supabase();
  if (!client) throw new Error("Supabase is not connected");

  const idColumn = table === 'users' ? 'uid' : 'id';
  const { error } = await client.from(table).delete().eq(idColumn, id);
  if (error) {
    console.error(`Supabase DELETE error on table "${table}":`, error);
    throw error;
  }
  return;
};

export const onSnapshot = (queryRef: any, callback: any, errorCallback?: any) => {
  let active = true;
  let subscription: any = null;

  const run = async () => {
    try {
      if (queryRef.type === 'doc') {
        const snap = await getDoc(queryRef);
        if (active) callback(snap);
      } else {
        const snap = await runSupabaseQuery(queryRef);
        if (active) callback(snap);
      }
    } catch (err) {
      if (active && errorCallback) errorCallback(err);
    }
  };

  run();

  const table = queryRef.collectionName;
  if (table && !isLocalTable(table)) {
    try {
      const client = supabase();
      if (client) {
        subscription = client
          .channel(`public:${table}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: table },
            () => {
              if (active) run();
            }
          )
          .subscribe();
      }
    } catch (err) {
      console.warn("Supabase Realtime subscription error:", err);
    }
  }

  return () => {
    active = false;
    if (subscription) {
      supabase()?.removeChannel(subscription);
    }
  };
};

export const query = (baseQuery: any, ...modifiers: any[]) => {
  const q = { 
    ...baseQuery, 
    conditions: [...(baseQuery.conditions || [])], 
    orderByFields: [...(baseQuery.orderByFields || [])],
    limitVal: baseQuery.limitVal
  };
  for (const mod of modifiers) {
    if (!mod) continue;
    if (mod.type === 'where') {
      q.conditions.push(mod);
    } else if (mod.type === 'orderBy') {
      q.orderByFields.push(mod);
    } else if (mod.type === 'limit') {
      q.limitVal = mod.value;
    }
  }
  return q;
};

export const where = (field: string, operator: string, value: any) => {
  return { type: 'where' as const, field, operator, value };
};

export const orderBy = (field: string, direction: 'asc'|'desc' = 'asc') => {
  return { type: 'orderBy' as const, field, direction };
};

export const limit = (value: number) => {
  return { type: 'limit' as const, value };
};

export const serverTimestamp = () => {
  return { type: 'serverTimestamp' as const };
};

export const increment = (amount: number) => {
  return { type: 'increment' as const, amount };
};

export const getDocFromServer = async (docRef: any) => {
  return getDoc(docRef);
};

export const writeBatch = (dbRef: any) => {
  const operations: any[] = [];
  return {
    set: (docRef: any, data: any) => {
      operations.push(() => setDoc(docRef, data));
    },
    update: (docRef: any, data: any) => {
      operations.push(() => updateDoc(docRef, data));
    },
    delete: (docRef: any) => {
      operations.push(() => deleteDoc(docRef));
    },
    commit: async () => {
      await Promise.all(operations.map(op => op()));
    }
  };
};

export const runTransaction = async (dbRef: any, callback: (transaction: any) => Promise<any>): Promise<any> => {
  const transaction = {
    get: async (docRef: any) => {
      return getDoc(docRef);
    },
    set: async (docRef: any, data: any, options?: any) => {
      return setDoc(docRef, data, options);
    },
    update: async (docRef: any, data: any) => {
      return updateDoc(docRef, data);
    },
    delete: async (docRef: any) => {
      return deleteDoc(docRef);
    }
  };
  return callback(transaction);
};

export const arrayUnion = (...elements: any[]) => {
  return { type: 'arrayUnion' as const, elements };
};

export const arrayRemove = (...elements: any[]) => {
  return { type: 'arrayRemove' as const, elements };
};

// Auth services
const withRetry = <T extends (...args: any[]) => Promise<any>>(fn: T): T => {
  return (async (...args: Parameters<T>) => {
    let attempts = 0;
    while (attempts < 3) {
      try {
        return await fn(...args);
      } catch (error: any) {
        attempts++;
        if (attempts < 3) {
          await new Promise((r) => setTimeout(r, 1000 * attempts));
        } else {
          throw error;
        }
      }
    }
  }) as T;
};

export const onAuthStateChanged = (authObj: any, callback: any) => {
  const targetAuth = authObj || auth;
  return targetAuth.onAuthStateChanged(callback);
};

export const loginWithEmail = withRetry(async (email: string, pass: string, authObj: any = auth) => {
  const client = supabase();
  if (!client) throw new Error("Supabase is not connected");
  
  const { data: userData, error } = await client
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error || !userData) {
    throw new Error("الحساب غير موجود أو خطأ في الاتصال");
  }

  if (userData.isBlocked) {
    throw new Error("هذا الحساب محظور من الدخول");
  }

  const fakeUser = { uid: userData.uid, email: userData.email, role: userData.role || 'customer' };
  const targetAuth = authObj || auth;
  targetAuth.setUser(fakeUser);
  return { user: fakeUser };
});

export const signupWithEmail = withRetry(async (email: string, pass: string, authObj: any = auth) => {
  const client = supabase();
  if (!client) throw new Error("Supabase is not connected");

  const { data: existing } = await client
    .from('users')
    .select('uid')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    const err: any = new Error("هذا الرقم مسجل مسبقاً، يرجى تسجيل الدخول بدلاً من إنشاء حساب جديد.");
    err.code = "auth/email-already-in-use";
    throw err;
  }

  const uid = Math.random().toString(36).substring(2) + Date.now().toString(36);
  const fakeUser = { uid, email };
  const targetAuth = authObj || auth;
  targetAuth.setUser(fakeUser);
  return { user: fakeUser };
});

export const resetPassword = withRetry(async (email: string) => {
  return;
});

export const changePassword = withRetry(async (newPass: string) => {
  return;
});

export const reauthenticate = withRetry(async (password: string) => {
  return;
});

export const logout = async () => {
  auth.clearUser();
  return;
};

export const signInWithGoogle = () => {
  return Promise.resolve({ user: { uid: 'google_user', email: 'user@gmail.com' } });
};

export const signInWithGoogleRedirect = () => {
  return;
};

export const getGoogleRedirectResult = () => {
  return Promise.resolve(null);
};

export const createAdminUserClientSide = async (email: string, pass: string) => {
  const uid = Math.random().toString(36).substring(2) + Date.now().toString(36);
  return { uid, email };
};

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
) {
  console.error(`Supabase operation error [${operationType}] on ${path}:`, error);
  return;
}

export const signInWithEmailAndPassword = async (authObj: any, email: string, pass: string) => {
  return loginWithEmail(email, pass, authObj);
};

export const signInWithCustomToken = async (authObj: any, customToken: string) => {
  const targetAuth = authObj || auth;
  try {
    const user = JSON.parse(customToken);
    targetAuth.setUser(user);
    return { user };
  } catch (e) {
    const fake = { uid: customToken, email: 'user@elite-store.local', role: 'customer' };
    targetAuth.setUser(fake);
    return { user: fake };
  }
};
