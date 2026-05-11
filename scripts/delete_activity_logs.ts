import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function deleteActivityLogs() {
  const colRef = collection(db, 'activity_logs');
  console.log("Fetching activity logs...");
  const snapshot = await getDocs(colRef);
  
  if (snapshot.empty) {
    console.log("No activity logs found.");
    process.exit(0);
  }
  
  console.log(`Found ${snapshot.size} activity logs. Deleting...`);
  
  let deleted = 0;
  for (const docSnapshot of snapshot.docs) {
    await deleteDoc(doc(db, 'activity_logs', docSnapshot.id));
    deleted++;
    if (deleted % 10 === 0) {
      console.log(`Deleted ${deleted}/${snapshot.size}...`);
    }
  }
  
  console.log("Activity logs deleted successfully.");
  process.exit(0);
}

deleteActivityLogs().catch(console.error);
