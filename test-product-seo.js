import axios from 'axios';
import fs from 'fs';

async function test() {
  const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
  const projectId = firebaseConfig.projectId;
  const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";
  const firestoreApiBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;
  
  try {
    const res = await axios.get(`${firestoreApiBase}/products?pageSize=1`);
    const doc = res.data.documents?.[0];
    if (doc) {
      const docName = doc.name; // projects/../databases/../documents/products/123
      const id = docName.split('/').pop();
      console.log('Found product ID:', id);
      
      const appRes = await axios.get(`http://localhost:3000/product/${id}`);
      console.log("Product SEO:");
      console.log(appRes.data.match(/<meta property="og:title"[^>]+>/)?.[0]);
      console.log(appRes.data.match(/<meta property="og:description"[^>]+>/)?.[0]);
      console.log(appRes.data.match(/<meta property="og:image"[^>]+>/)?.[0]);
    } else {
      console.log('No product found');
    }
  } catch (e) {
    console.error(e.message);
  }
}
test();
