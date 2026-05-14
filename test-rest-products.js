import axios from 'axios';
import fs from 'fs';

async function test() {
  const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
  const projectId = firebaseConfig.projectId;
  const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";
  const apiKey = firebaseConfig.apiKey;
  const firestoreApiBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;
  
  try {
    const res = await axios.get(`${firestoreApiBase}/products?pageSize=10&key=${apiKey}`);
    const docs = res.data.documents || [];
    if (docs.length > 0) {
      const doc = docs[0];
      const docName = doc.name;
      const id = docName.split('/').pop();
      console.log('ID:', id);
      const fields = doc.fields || {};
      for (const [key, val] of Object.entries(fields)) {
         console.log('Field:', key, JSON.stringify(val).substring(0, 50));
      }
    }
  } catch (e) {
    if (e.response) {
      console.error("HTTP Error", e.response.status, e.response.data);
    } else {
      console.error(e.message);
    }
  }
}
test();
