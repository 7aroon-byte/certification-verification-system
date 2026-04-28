const http = require('http');

const postData = JSON.stringify({
  email: 's7afiu7aroon@gmail.com',
  password: 'Admin123!'
});

console.log('Making request to http://localhost:5000/api/admin/login');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  },
  timeout: 5000
};

const req = http.request(options, (res) => {
  let data = '';
  console.log(`Response Status: ${res.statusCode}`);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
    process.exit(0);
  });
});

req.on('timeout', () => {
  console.error('Request timed out');
  process.exit(1);
});

req.on('error', (err) => {
  console.error('Request error:', err.message);
  console.error('Error code:', err.code);
  process.exit(1);
});

req.write(postData);
req.end();

setTimeout(() => {
  console.error('No response after 6 seconds');
  process.exit(1);
}, 6000);
