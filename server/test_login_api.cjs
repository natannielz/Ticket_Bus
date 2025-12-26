const http = require('http');

console.log("Testing Login API....");

const data = JSON.stringify({
  email: 'user@example.com',
  password: 'password'
});

const options = {
  hostname: 'localhost',
  port: 3005,
  path: '/api/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chuck => body += chuck);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', body);
  });
});

req.on('error', (e) => {
  console.error('Problem with request:', e.message);
});

req.write(data);
req.end();
