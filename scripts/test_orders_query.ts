import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function testOrdersQuery() {
  try {
    const q = query(collection(db, "orders"), orderBy("date", "desc"), limit(100));
    console.log("Executing Admin orders query...");
    await getDocs(q);
    console.log("Admin orders query successful.");
  } catch (err) {
    console.error("Admin query failed:", err);
  }

  try {
    const q2 = query(
      collection(db, "orders"),
      where("userId", "==", "some_uid"),
      orderBy("date", "desc"),
      limit(50)
    );
    console.log("Executing User orders query...");
    await getDocs(q2);
    console.log("User orders query successful.");
  } catch (err) {
    console.error("User query failed:", err);
  }
  process.exit();
}
testOrdersQuery().catch(console.error);
