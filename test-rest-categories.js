import axios from 'axios';
import fs from 'fs';
async function test() {
  const firebaseConfig = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
  const projectId = firebaseConfig.projectId;
  const databaseId = firebaseConfig.firestoreDatabaseId || "(default)";
  const apiKey = firebaseConfig.apiKey;
  const firestoreApiBase = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;
  try {
    const res = await axios.get(`${firestoreApiBase}/categories?pageSize=3&key=${apiKey}`);
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    if (e.response) { console.error("HTTP Error", e.response.status, JSON.stringify(e.response.data)); }
    else { console.error(e.message); }
  }
}
test();
