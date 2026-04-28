const https = require('http');

async function test() {
  // Step 1: Login
  const loginData = JSON.stringify({
    email: 's7afiu7aroon@gmail.com',
    password: 'Admin123!'
  });

  return new Promise((resolve) => {
    const loginReq = https.request('http://localhost:5000/api/admin/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': loginData.length
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const loginRes = JSON.parse(data);
          const token = loginRes.token;
          console.log('✓ Login successful');

          // Step 2: Issue certificate
          const certData = JSON.stringify({
            studentId: 16,
            enrollmentNumber: '010A',
            walletAddress: '0xe3247996795a1e40cec985e471144848caacebc2',
            startDate: '2026-02-06',
            finishDate: '2026-02-21',
            examType: 'SSCE',
            positionHeld: '-',
            conduct: 'Excellent'
          });

          const certReq = https.request('http://localhost:5000/api/admin/certificates', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
              'Content-Length': certData.length
            }
          }, (res2) => {
            let data2 = '';
            res2.on('data', (chunk) => { data2 += chunk; });
            res2.on('end', () => {
              console.log('Certificate Response Status:', res2.statusCode);
              try {
                const certRes = JSON.parse(data2);
                if (certRes.success) {
                  console.log('✓✓✓ Certificate issued successfully with blockchain!');
                  console.log('Blockchain TX Hash:', certRes.data.blockchainTxHash);
                } else {
                  console.log('✗ Certificate issuance failed:', certRes.message);
                }
              } catch (e) {
                console.log('Response:', data2);
              }
              resolve();
            });
          });

          certReq.write(certData);
          certReq.end();
        } catch (e) {
          console.log('Login failed:', data);
          resolve();
        }
      });
    });

    loginReq.write(loginData);
    loginReq.end();
  });
}

test().catch(console.error);
