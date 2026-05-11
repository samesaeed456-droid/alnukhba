import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function deleteAbandonedCarts() {
  const colRef = collection(db, 'abandonedCarts');
  console.log("Fetching abandoned carts...");
  const snapshot = await getDocs(colRef);
  
  if (snapshot.empty) {
    console.log("No abandoned carts found.");
    process.exit(0);
  }
  
  console.log(`Found ${snapshot.size} abandoned carts. Deleting...`);
  
  let deleted = 0;
  for (const docSnapshot of snapshot.docs) {
    await deleteDoc(doc(db, 'abandonedCarts', docSnapshot.id));
    deleted++;
    if (deleted % 10 === 0) {
      console.log(`Deleted ${deleted}/${snapshot.size}...`);
    }
  }
  
  console.log("Abandoned carts deleted successfully.");
  process.exit(0);
}

deleteAbandonedCarts().catch(console.error);
