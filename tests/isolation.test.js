const assert = require('node:assert');
const app = require('../src/app');
const { makeRequest } = require('./auth.test');

async function runIsolationTests() {
  console.log('--- Running Multi-User Data Isolation Test Suite ---');
  
  // 1. Register User A
  const userAEmail = `user_a_${Date.now()}@example.com`;
  const regARes = await makeRequest(app, 'POST', '/api/auth/register', {
    body: { name: 'User A', email: userAEmail, password: 'Password123!', confirmPassword: 'Password123!' }
  });
  const tokenA = regARes.body.token;
  const headersA = { Authorization: `Bearer ${tokenA}` };

  // 2. Register User B
  const userBEmail = `user_b_${Date.now()}@example.com`;
  const regBRes = await makeRequest(app, 'POST', '/api/auth/register', {
    body: { name: 'User B', email: userBEmail, password: 'Password123!', confirmPassword: 'Password123!' }
  });
  const tokenB = regBRes.body.token;
  const headersB = { Authorization: `Bearer ${tokenB}` };

  // 3. User A creates Category, Tag, and Todo
  const catARes = await makeRequest(app, 'POST', '/api/categories', {
    headers: headersA,
    body: { name: 'User A Secret Category', color: '#ff0000' }
  });
  const catAId = catARes.body.category.id;

  const tagARes = await makeRequest(app, 'POST', '/api/tags', {
    headers: headersA,
    body: { name: 'secret-a' }
  });
  const tagAId = tagARes.body.tag.id;

  const todoARes = await makeRequest(app, 'POST', '/api/todos', {
    headers: headersA,
    body: {
      title: 'Confidential Strategy Task from User A',
      description: 'Top secret data belonging only to User A.',
      priority: 'high',
      categoryId: catAId,
      tagIds: [tagAId]
    }
  });
  const todoAId = todoARes.body.todo.id;

  // 4. User B attempts to READ User A's todo list
  const listBRes = await makeRequest(app, 'GET', '/api/todos', { headers: headersB });
  assert.strictEqual(listBRes.status, 200);
  const foundAInB = listBRes.body.todos.some(t => t.id === todoAId);
  assert.strictEqual(foundAInB, false, 'User B list must not contain User A todo');
  console.log('✔ User B cannot see User A todos in list');

  // 5. User B attempts to GET User A's todo by ID directly
  const directGetRes = await makeRequest(app, 'GET', `/api/todos/${todoAId}`, { headers: headersB });
  assert.strictEqual(directGetRes.status, 404, 'User B direct get of User A todo must return 404');
  console.log('✔ User B direct GET of User A todo rejected with 404');

  // 6. User B attempts to UPDATE User A's todo
  const updateAttemptRes = await makeRequest(app, 'PUT', `/api/todos/${todoAId}`, {
    headers: headersB,
    body: {
      title: 'Hacked by User B!',
      priority: 'low'
    }
  });
  assert.strictEqual(updateAttemptRes.status, 404, 'User B update of User A todo must return 404');
  console.log('✔ User B UPDATE of User A todo rejected with 404');

  // 7. User B attempts to TOGGLE User A's todo
  const toggleAttemptRes = await makeRequest(app, 'PATCH', `/api/todos/${todoAId}/toggle`, { headers: headersB });
  assert.strictEqual(toggleAttemptRes.status, 404, 'User B toggle of User A todo must return 404');
  console.log('✔ User B TOGGLE of User A todo rejected with 404');

  // 8. User B attempts to DELETE User A's todo
  const deleteAttemptRes = await makeRequest(app, 'DELETE', `/api/todos/${todoAId}`, { headers: headersB });
  assert.strictEqual(deleteAttemptRes.status, 404, 'User B delete of User A todo must return 404');
  console.log('✔ User B DELETE of User A todo rejected with 404');

  // 9. User B attempts to DELETE User A's Category and Tag
  const deleteCatAttempt = await makeRequest(app, 'DELETE', `/api/categories/${catAId}`, { headers: headersB });
  assert.strictEqual(deleteCatAttempt.status, 404, 'User B delete of User A category must return 404');

  const deleteTagAttempt = await makeRequest(app, 'DELETE', `/api/tags/${tagAId}`, { headers: headersB });
  assert.strictEqual(deleteTagAttempt.status, 404, 'User B delete of User A tag must return 404');
  console.log('✔ User B cannot delete User A category or tag');

  // 10. Verify User A's todo is intact and uncorrupted
  const verifyARes = await makeRequest(app, 'GET', `/api/todos/${todoAId}`, { headers: headersA });
  assert.strictEqual(verifyARes.status, 200);
  assert.strictEqual(verifyARes.body.todo.title, 'Confidential Strategy Task from User A');
  console.log('✔ User A todo remains intact and unmodified');

  console.log('✅ ALL USER DATA ISOLATION TESTS PASSED!\n');
}

module.exports = { runIsolationTests };

if (require.main === module) {
  runIsolationTests().catch(err => {
    console.error('❌ Isolation Test Failed:', err);
    process.exit(1);
  });
}
