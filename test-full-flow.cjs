const http = require('http');

async function testFullLoginFlow() {
  // Step 1: Login
  console.log('1. Testing login...');
  const loginData = JSON.stringify({
    email: 's7afiu7aroon@gmail.com',
    password: 'Admin123!'
  });

  const loginOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/admin/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginData)
    }
  };

  return new Promise((resolve) => {
    const req = http.request(loginOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const token = parsed.data?.token;
          console.log('✓ Login successful');
          console.log('  Token:', token.substring(0, 30) + '...');
          
          // Step 2: Test authenticated request
          console.log('\n2. Testing authenticated request to /api/admin/users...');
          const usersOptions = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/admin/users',
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          };

          const usersReq = http.request(usersOptions, (usersRes) => {
            let usersData = '';
            console.log('  Status:', usersRes.statusCode);
            usersRes.on('data', chunk => usersData += chunk);
            usersRes.on('end', () => {
              try {
                const parsed = JSON.parse(usersData);
                console.log('✓ Authenticated request successful');
                console.log('  Response:', JSON.stringify(parsed).substring(0, 100) + '...');
              } catch (e) {
                console.log('✗ Could not parse response');
                console.log('  Response:', usersData.substring(0, 100));
              }
              resolve();
            });
          });

          usersReq.on('error', err => {
            console.log('✗ Authenticated request failed:', err.message);
            resolve();
          });

          usersReq.end();
        } catch (e) {
          console.log('✗ Could not parse login response:', e.message);
          resolve();
        }
      });
    });

    req.on('error', err => {
      console.log('✗ Login failed:', err.message);
      resolve();
    });

    req.write(loginData);
    req.end();
  });
}

testFullLoginFlow();
