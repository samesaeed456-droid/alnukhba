fetch('http://localhost:3000/api/webauthn/register/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ uid: "test", email: "test@test.com" })
}).then(async r => {
  console.log("Status:", r.status);
  console.log("Body:", await r.text());
}).catch(console.error);
