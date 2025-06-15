const http = require('http');

console.log('🔍 Quick Login System Check\n');

// Check if backend is running
const checkBackend = () => {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/',
      method: 'GET',
      timeout: 2000
    };

    const req = http.request(options, (res) => {
      console.log(`✅ Backend is running on port 5000 (status: ${res.statusCode})`);
      resolve(true);
    });

    req.on('error', (error) => {
      console.log('❌ Backend is NOT running on port 5000!');
      console.log('   Run: cd backend && node server.js');
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      console.log('❌ Backend timeout - not responding on port 5000');
      resolve(false);
    });

    req.end();
  });
};

// Test login endpoint
const testLoginEndpoint = async () => {
  return new Promise((resolve) => {
    const postData = JSON.stringify({
      email: 'newuser@example.com',
      password: 'demo123'
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`\nLogin endpoint test (status: ${res.statusCode}):`);
        
        if (res.statusCode === 200) {
          console.log('✅ Login SUCCESSFUL!');
          try {
            const parsed = JSON.parse(data);
            console.log('   Token received:', parsed.token ? 'Yes' : 'No');
          } catch (e) {}
        } else if (res.statusCode === 401) {
          console.log('❌ Login FAILED - Invalid credentials');
          console.log('   Response:', data);
        } else if (res.statusCode === 404) {
          console.log('❌ Login endpoint not found - Check routes');
        } else {
          console.log('❌ Unexpected status:', res.statusCode);
          console.log('   Response:', data);
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.log('\n❌ Cannot reach login endpoint');
      console.log('   Error:', error.message);
      resolve();
    });

    req.write(postData);
    req.end();
  });
};

// Run checks
(async () => {
  const backendRunning = await checkBackend();
  
  if (backendRunning) {
    await testLoginEndpoint();
  }
  
  console.log('\n📋 Login credentials should be:');
  console.log('   Email: newuser@example.com');
  console.log('   Password: demo123 (all lowercase)');
  
  console.log('\n💡 If login fails, run these in order:');
  console.log('   1. CHECK-LOGIN-ISSUES.bat');
  console.log('   2. EMERGENCY-LOGIN-FIX.bat');
  console.log('   3. Make sure both servers are running');
})();