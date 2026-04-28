const http = require('http');

const postData = JSON.stringify({
  email: 's7afiu7aroon@gmail.com',
  password: 'Admin123!'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Origin': 'http://localhost:5173'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  console.log(`STATUS: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('RESPONSE:', data);
  });
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
});

console.log('Sending login request...');
req.write(postData);
req.end();
