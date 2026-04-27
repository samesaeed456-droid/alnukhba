import http from 'http';

http.get('http://localhost:3000/api/cloudinary/images', (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(`BODY: ${data.substring(0, 100)}`));
}).on('error', err => console.log(err));
