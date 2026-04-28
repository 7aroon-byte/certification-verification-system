const http = require('http');

const postData = JSON.stringify({
  email: 'abdullbbj340@gmail.com',
  password: 'Student123!'
});

console.log('Testing student login...');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/student/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  console.log('Status:', res.statusCode);
  
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Response:', data.substring(0, 150));
    process.exit(0);
  });
});

req.on('error', err => {
  console.log('Error:', err.message);
  process.exit(1);
});

req.write(postData);
req.end();
