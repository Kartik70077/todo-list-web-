const assert = require('node:assert');
const app = require('../src/app');
const { makeRequest } = require('./auth.test');

async function runTodoTests() {
  console.log('--- Running Todo CRUD & Filters Test Suite ---');
  const testEmail = `todotest_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  // Register user
  const regRes = await makeRequest(app, 'POST', '/api/auth/register', {
    body: { name: 'Todo User', email: testEmail, password: testPassword, confirmPassword: testPassword }
  });
  const token = regRes.body.token;
  const headers = { Authorization: `Bearer ${token}` };

  // 1. Create a Tag and a Category first
  const catRes = await makeRequest(app, 'POST', '/api/categories', {
    headers,
    body: { name: 'Projects', color: '#6366f1' }
  });
  assert.strictEqual(catRes.status, 201);
  const categoryId = catRes.body.category.id;

  const tagRes = await makeRequest(app, 'POST', '/api/tags', {
    headers,
    body: { name: 'backend' }
  });
  assert.strictEqual(tagRes.status, 201);
  const tagId = tagRes.body.tag.id;

  // 2. Create Todo
  const todayStr = new Date().toISOString().split('T')[0];
  const createRes = await makeRequest(app, 'POST', '/api/todos', {
    headers,
    body: {
      title: 'Build secure authentication system',
      description: 'Implement JWT and scrypt password hashing.',
      priority: 'high',
      status: 'pending',
      dueDate: todayStr,
      categoryId,
      tagIds: [tagId]
    }
  });

  assert.strictEqual(createRes.status, 201);
  assert.strictEqual(createRes.body.success, true);
  assert.strictEqual(createRes.body.todo.title, 'Build secure authentication system');
  assert.strictEqual(createRes.body.todo.priority, 'high');
  assert.strictEqual(createRes.body.todo.tags.length, 1);
  assert.strictEqual(createRes.body.todo.tags[0].name, 'backend');
  const todoId = createRes.body.todo.id;
  console.log('✔ Todo created with category and tags');

  // 3. Get Todo by ID
  const getRes = await makeRequest(app, 'GET', `/api/todos/${todoId}`, { headers });
  assert.strictEqual(getRes.status, 200);
  assert.strictEqual(getRes.body.todo.id, todoId);
  console.log('✔ Get todo by ID works');

  // 4. Update Todo
  const updateRes = await makeRequest(app, 'PUT', `/api/todos/${todoId}`, {
    headers,
    body: {
      title: 'Build secure authentication system (Updated)',
      description: 'Updated description for unit tests.',
      priority: 'medium',
      status: 'in_progress',
      dueDate: todayStr,
      categoryId,
      tagIds: [tagId]
    }
  });
  assert.strictEqual(updateRes.status, 200);
  assert.strictEqual(updateRes.body.todo.title, 'Build secure authentication system (Updated)');
  assert.strictEqual(updateRes.body.todo.priority, 'medium');
  assert.strictEqual(updateRes.body.todo.status, 'in_progress');
  console.log('✔ Update todo works');

  // 5. Toggle Complete
  const toggleRes = await makeRequest(app, 'PATCH', `/api/todos/${todoId}/toggle`, { headers });
  assert.strictEqual(toggleRes.status, 200);
  assert.strictEqual(toggleRes.body.todo.status, 'completed');
  assert.ok(toggleRes.body.todo.completed_at, 'completed_at timestamp should be set');
  console.log('✔ Complete todo works');

  // Toggle back to active
  const restoreRes = await makeRequest(app, 'PATCH', `/api/todos/${todoId}/toggle`, { headers });
  assert.strictEqual(restoreRes.status, 200);
  assert.strictEqual(restoreRes.body.todo.status, 'pending');
  assert.strictEqual(restoreRes.body.todo.completed_at, null);
  console.log('✔ Restore todo works');

  // 6. Test Filtering & Search
  // Create another todo
  await makeRequest(app, 'POST', '/api/todos', {
    headers,
    body: {
      title: 'Design sleek dashboard layout',
      priority: 'low',
      status: 'completed',
      dueDate: '2099-12-31'
    }
  });

  // Filter by status=completed
  const completedFilterRes = await makeRequest(app, 'GET', '/api/todos?status=completed', { headers });
  assert.strictEqual(completedFilterRes.status, 200);
  assert.strictEqual(completedFilterRes.body.count, 1);
  assert.strictEqual(completedFilterRes.body.todos[0].title, 'Design sleek dashboard layout');
  console.log('✔ Filter by status works');

  // Search by title
  const searchRes = await makeRequest(app, 'GET', '/api/todos?search=authentication', { headers });
  assert.strictEqual(searchRes.status, 200);
  assert.strictEqual(searchRes.body.count, 1);
  assert.strictEqual(searchRes.body.todos[0].id, todoId);
  console.log('✔ Search by keyword works');

  // 7. Delete Todo
  const deleteRes = await makeRequest(app, 'DELETE', `/api/todos/${todoId}`, { headers });
  assert.strictEqual(deleteRes.status, 200);

  const getDeletedRes = await makeRequest(app, 'GET', `/api/todos/${todoId}`, { headers });
  assert.strictEqual(getDeletedRes.status, 404);
  console.log('✔ Delete todo works');

  console.log('✅ ALL TODO CRUD & FILTER TESTS PASSED!\n');
}

module.exports = { runTodoTests };

if (require.main === module) {
  runTodoTests().catch(err => {
    console.error('❌ Todo Test Failed:', err);
    process.exit(1);
  });
}
