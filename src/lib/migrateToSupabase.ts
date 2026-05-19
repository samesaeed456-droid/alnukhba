import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";
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

  const steps: MigrationStep[] = [
    { id: 'categories', name: 'الأقسام والأسماء (Categories)', collection: 'categories', table: 'categories', status: 'idle', count: 0 },
    { id: 'products', name: 'المنتجات والمخزون (Products)', collection: 'products', table: 'products', status: 'idle', count: 0 },
    { id: 'users', name: 'حسابات العملاء (Users)', collection: 'users', table: 'users', status: 'idle', count: 0 },
    { id: 'orders', name: 'طلبات الشراء والعمليات (Orders)', collection: 'orders', table: 'orders', status: 'idle', count: 0 },
    { id: 'coupons', name: 'كوبونات الخصم (Coupons)', collection: 'coupons', table: 'coupons', status: 'idle', count: 0 },
    { id: 'recharges', name: 'عمليات شحن المحفظة (Recharges)', collection: 'recharges', table: 'recharges', status: 'idle', count: 0 },
    { id: 'support_tickets', name: 'تذاكر الدعم الفني (Support Tickets)', collection: 'support_tickets', table: 'support_tickets', status: 'idle', count: 0 },
  ];

  // Trigger initial idle state
  onStepProgress([...steps]);

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    step.status = 'loading';
    onStepProgress([...steps]);

    try {
      console.log(`Starting migration for: ${step.collection}`);
      const querySnap = await getDocs(collection(db, step.collection));
      
      const items = querySnap.docs.map(doc => {
        const data = doc.data();
        const docData: any = { id: doc.id, ...data };
        
        // Map document ID to primary key where schemas vary
        if (step.id === 'users') {
          docData.uid = doc.id;
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
        return docData;
      });

      if (items.length > 0) {
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
