import { db } from "./firebase";
import { collection, getDocs } from "firebase/firestore";
import { supabase } from "./supabase";

/**
 * Utility script to migrate data from Firebase to Supabase
 * You can call this function safely once to transfer your existing 
 * Firebase store data into Supabase Postgres Tables.
 */
export const migrateFirebaseToSupabase = async () => {
  const supabaseClient = supabase();
  
  if (!supabaseClient) {
    console.error("Supabase client is not initialized. Please ensure your .env variables are set.");
    return false;
  }

  try {
    console.log("Starting Data Migration: Firebase -> Supabase");

    // 1. Migrate Products
    console.log("Migrating products...");
    const productsSnap = await getDocs(collection(db, "products"));
    const products = productsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    if (products.length > 0) {
      const { error: productError } = await supabaseClient.from("products").upsert(products);
      if (productError) console.error("Error migrating products:", productError);
    }

    // 2. Migrate Categories
    console.log("Migrating categories...");
    const categoriesSnap = await getDocs(collection(db, "categories"));
    const categories = categoriesSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    if (categories.length > 0) {
      const { error: categoryError } = await supabaseClient.from("categories").upsert(categories);
      if (categoryError) console.error("Error migrating categories:", categoryError);
    }

    // 3. Migrate Users (Basic profile info, Note: Firebase Auth handles actual passwords)
    console.log("Migrating users...");
    const usersSnap = await getDocs(collection(db, "users"));
    const users = usersSnap.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));

    if (users.length > 0) {
      const { error: userError } = await supabaseClient.from("users").upsert(users);
      if (userError) console.error("Error migrating users:", userError);
    }

    // 4. Migrate Orders
    console.log("Migrating orders...");
    const ordersSnap = await getDocs(collection(db, "orders"));
    const orders = ordersSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Ensure dates are parsed properly if they are timestamps
        date: data.date?.toDate ? data.date.toDate().toISOString() : data.date
      };
    });

    if (orders.length > 0) {
      const { error: orderError } = await supabaseClient.from("orders").upsert(orders);
      if (orderError) console.error("Error migrating orders:", orderError);
    }

    console.log("Migration to Supabase completed step!");
    return true;
  } catch (error) {
    console.error("Migration to Supabase failed:", error);
    return false;
  }
};
