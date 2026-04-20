fetch('http://localhost:3001/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test User', email: `testuser_${Date.now()}@fcn.dk`, department: 'IT', password: 'dummy' })
}).then(res => res.json()).then(data => console.dir(data, {depth: null})).catch(console.error);
