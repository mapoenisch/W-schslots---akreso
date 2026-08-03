const http = require('http');
const data = JSON.stringify({ lastName: 'admin', password: 'admin' });
const req = http.request({ hostname: 'localhost', port: 3000, path: '/api/login', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': data.length } }, (res) => {
  let body = '';
  res.on('data', (c) => body += c);
  res.on('end', () => {
    const { token } = JSON.parse(body);
    http.get({ hostname: 'localhost', port: 3000, path: '/api/slots?date=2026-08-05', headers: { 'Authorization': `Bearer ${token}` } }, (res2) => {
      let body2 = '';
      res2.on('data', (c) => body2 += c);
      res2.on('end', () => console.log('Slots:', body2));
    });
  });
});
req.write(data);
req.end();
