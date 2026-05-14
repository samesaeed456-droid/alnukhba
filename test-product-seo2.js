import axios from 'axios';
import fs from 'fs';

async function test() {
  const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
  const projectId = firebaseConfig.projectId;
  const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";
  const apiKey = firebaseConfig.apiKey;
  const firestoreApiBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;
  
  try {
    const res = await axios.get(`${firestoreApiBase}/products?pageSize=1&key=${apiKey}`);
    const docName = res.data.documents?.[0]?.name;
    const id = docName?.split('/').pop();
    
    if (id) {
       console.log('Fetching app SEO for product', id);
       const appRes = await axios.get(`http://localhost:3000/product/${id}`);
       console.log("TITLE:", appRes.data.match(/<meta property="og:title"[^>]+>/)?.[0]);
       console.log("DESC:", appRes.data.match(/<meta property="og:description"[^>]+>/)?.[0]);
       console.log("IMG:", appRes.data.match(/<meta property="og:image"[^>]+>/)?.[0]);
    }
  } catch (e) {
    console.error(e);
  }
}
test();
