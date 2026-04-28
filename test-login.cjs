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
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS:`, res.headers);
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('BODY:', data);
    try {
      const parsed = JSON.parse(data);
      console.log('PARSED:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Could not parse JSON');
    }
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.write(postData);
req.end();
