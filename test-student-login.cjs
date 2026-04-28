const http = require('http');

const testCases = [
  { email: 'abdullbbj340@gmail.com', password: 'Student123!' },
  { email: 'Safiyyashafiu87@gmail.com', password: 'Student123!' }
];

async function testStudentLogin() {
  for (const testCase of testCases) {
    console.log(`\nTesting: ${testCase.email}`);
    
    const postData = JSON.stringify(testCase);
    
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

    await new Promise((resolve) => {
      const req = http.request(options, (res) => {
        let data = '';
        console.log(`Status: ${res.statusCode}`);
        
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.success) {
              console.log('✓ Login successful!');
              console.log('Token:', parsed.data.token.substring(0, 40) + '...');
            } else {
              console.log('✗ Login failed:', parsed.message);
            }
          } catch (e) {
            console.log('Response:', data.substring(0, 100));
          }
          resolve();
        });
      });

      req.on('error', err => {
        console.log('Error:', err.message);
        resolve();
      });

      req.write(postData);
      req.end();
    });
  }
}

testStudentLogin();
