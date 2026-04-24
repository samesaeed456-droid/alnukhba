(async () => {
  const syncRes = await fetch('http://localhost:3000/api/admin/update-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'samesaeed456@gmail.com', newPassword: 'password123' })
  });
  console.log(syncRes.status);
  const text = await syncRes.text();
  console.log('Result:', text);
})();
