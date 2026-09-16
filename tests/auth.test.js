const assert = require('node:assert');
const app = require('../src/app');

// Helper to make mock requests to express app
async function makeRequest(app, method, url, options = {}) {
  const { body, headers = {} } = options;
  const http = require('node:http');

  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, () => {
      const port = server.address().port;
      const requestOptions = {
        hostname: '127.0.0.1',
        port,
        path: url,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      const req = http.request(requestOptions, (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          server.close();
          let data = null;
          try {
            data = JSON.parse(rawData);
          } catch (e) {
            data = rawData;
          }
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        });
      });

      req.on('error', (err) => {
        server.close();
        reject(err);
      });

      if (body) {
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }
      req.end();
    });
  });
}

async function runAuthTests() {
  console.log('--- Running Authentication Test Suite ---');
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123!';

  // 1. Successful Registration
  const regRes = await makeRequest(app, 'POST', '/api/auth/register', {
    body: {
      name: 'Test Runner',
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword
    }
  });

  assert.strictEqual(regRes.status, 201, 'Registration should return 201 Created');
  assert.strictEqual(regRes.body.success, true, 'Registration success should be true');
  assert.ok(regRes.body.token, 'Registration should return JWT token');
  assert.strictEqual(regRes.body.user.email, testEmail);
  console.log('✔ Registration successful');

  const authToken = regRes.body.token;

  // 2. Duplicate Email Registration
  const dupRes = await makeRequest(app, 'POST', '/api/auth/register', {
    body: {
      name: 'Duplicate User',
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword
    }
  });

  assert.strictEqual(dupRes.status, 409, 'Duplicate email should return 409 Conflict');
  assert.strictEqual(dupRes.body.success, false);
  console.log('✔ Duplicate email prevented');

  // 3. Password Validation Errors
  const shortPassRes = await makeRequest(app, 'POST', '/api/auth/register', {
    body: {
      name: 'Short Pass',
      email: `short_${Date.now()}@example.com`,
      password: '123',
      confirmPassword: '123'
    }
  });
  assert.strictEqual(shortPassRes.status, 400, 'Short password should return 400');

  const mismatchPassRes = await makeRequest(app, 'POST', '/api/auth/register', {
    body: {
      name: 'Mismatch Pass',
      email: `mismatch_${Date.now()}@example.com`,
      password: 'Password123!',
      confirmPassword: 'DifferentPassword123!'
    }
  });
  assert.strictEqual(mismatchPassRes.status, 400, 'Password mismatch should return 400');
  console.log('✔ Password strength and mismatch validations work');

  // 4. Successful Login
  const loginRes = await makeRequest(app, 'POST', '/api/auth/login', {
    body: {
      email: testEmail,
      password: testPassword
    }
  });
  assert.strictEqual(loginRes.status, 200, 'Login should return 200');
  assert.ok(loginRes.body.token, 'Login should return token');
  console.log('✔ Login successful');

  // 5. Invalid Password Login
  const invalidLoginRes = await makeRequest(app, 'POST', '/api/auth/login', {
    body: {
      email: testEmail,
      password: 'WrongPassword999!'
    }
  });
  assert.strictEqual(invalidLoginRes.status, 401, 'Invalid password should return 401');
  console.log('✔ Invalid credentials rejected');

  // 6. Access Protected Route /api/auth/me
  const meRes = await makeRequest(app, 'GET', '/api/auth/me', {
    headers: { Authorization: `Bearer ${authToken}` }
  });
  assert.strictEqual(meRes.status, 200);
  assert.strictEqual(meRes.body.user.email, testEmail);
  console.log('✔ Protected route access with JWT works');

  // 7. Access Protected Route without token
  const unauthRes = await makeRequest(app, 'GET', '/api/auth/me');
  assert.strictEqual(unauthRes.status, 401);
  console.log('✔ Unauthenticated request properly rejected');

  // 8. Forgot Password & Reset Password Flow
  const forgotRes = await makeRequest(app, 'POST', '/api/auth/forgot-password', {
    body: { email: testEmail }
  });
  assert.strictEqual(forgotRes.status, 200);
  assert.ok(forgotRes.body.devResetToken, 'Dev reset token should be returned');
  const resetToken = forgotRes.body.devResetToken;

  const newPassword = 'BrandNewPassword456!';
  const resetRes = await makeRequest(app, 'POST', '/api/auth/reset-password', {
    body: {
      token: resetToken,
      newPassword,
      confirmPassword: newPassword
    }
  });
  assert.strictEqual(resetRes.status, 200);
  assert.strictEqual(resetRes.body.success, true);

  // Verify login with new password
  const newLoginRes = await makeRequest(app, 'POST', '/api/auth/login', {
    body: {
      email: testEmail,
      password: newPassword
    }
  });
  assert.strictEqual(newLoginRes.status, 200);
  console.log('✔ Forgot & Reset password flow verified');

  console.log('✅ ALL AUTHENTICATION TESTS PASSED!\n');
}

module.exports = { runAuthTests, makeRequest };

if (require.main === module) {
  runAuthTests().catch(err => {
    console.error('❌ Auth Test Failed:', err);
    process.exit(1);
  });
}
