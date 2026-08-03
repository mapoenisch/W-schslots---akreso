const http = require('http');

const data = JSON.stringify({ lastName: 'admin', password: 'admin' });

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    const { token } = JSON.parse(body);
    
    http.get({
      hostname: 'localhost',
      port: 3000,
      path: '/api/exchanges',
      headers: { 'Authorization': `Bearer ${token}` }
    }, (res2) => {
      let body2 = '';
      res2.on('data', (chunk) => body2 += chunk);
      res2.on('end', () => console.log(body2));
    });
  });
});

req.write(data);
req.end();
