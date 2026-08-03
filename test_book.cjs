const http = require('http');
const data = JSON.stringify({ lastName: 'admin', password: 'admin' });
const req = http.request({ hostname: 'localhost', port: 3000, path: '/api/login', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': data.length } }, (res) => {
  let body = '';
  res.on('data', (c) => body += c);
  res.on('end', () => {
    const { token } = JSON.parse(body);
    const bookData = JSON.stringify({ startTime: '2026-08-06T13:00:00.000Z', machineId: 2, withDryer: true });
    const req2 = http.request({ hostname: 'localhost', port: 3000, path: '/api/bookings', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': bookData.length, 'Authorization': `Bearer ${token}` } }, (res2) => {
      let body2 = '';
      res2.on('data', (c) => body2 += c);
      res2.on('end', () => console.log('Booking Result:', body2));
    });
    req2.write(bookData);
    req2.end();
  });
});
req.write(data);
req.end();
