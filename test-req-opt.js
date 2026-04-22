fetch('http://localhost:3000/api/webauthn/register/generate', {
  method: 'OPTIONS',
  headers: { 'Content-Type': 'application/json' }
}).then(async r => {
  console.log("Status:", r.status);
  console.log("Body:", await r.text());
}).catch(console.error);
