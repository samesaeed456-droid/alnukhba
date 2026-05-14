import axios from 'axios';
async function test() {
  try {
    const res = await axios.get('http://localhost:3000/product/dummy');
    console.log("TITLE:", res.data.match(/<meta property="og:title"[^>]+>/)?.[0]);
    console.log("DESC:", res.data.match(/<meta property="og:description"[^>]+>/)?.[0]);
    console.log("IMG:", res.data.match(/<meta property="og:image"[^>]+>/)?.[0]);
  } catch (e) {
    console.error(e.message);
  }
}
test();
