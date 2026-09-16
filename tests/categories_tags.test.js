const assert = require('node:assert');
const app = require('../src/app');
const { makeRequest } = require('./auth.test');

async function runCategoriesAndTagsTests() {
  console.log('--- Running Categories, Tags, and Stats Test Suite ---');
  const testEmail = `cat_tag_test_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  const regRes = await makeRequest(app, 'POST', '/api/auth/register', {
    body: { name: 'CatTag User', email: testEmail, password: testPassword, confirmPassword: testPassword }
  });
  const token = regRes.body.token;
  const headers = { Authorization: `Bearer ${token}` };

  // 1. List default categories created upon registration
  const listCatRes = await makeRequest(app, 'GET', '/api/categories', { headers });
  assert.strictEqual(listCatRes.status, 200);
  assert.ok(listCatRes.body.categories.length >= 4, 'Should have default categories');
  console.log('✔ Default categories initialized');

  // 2. Create custom category
  const createCatRes = await makeRequest(app, 'POST', '/api/categories', {
    headers,
    body: { name: 'Freelance', color: '#10b981' }
  });
  assert.strictEqual(createCatRes.status, 201);
  const catId = createCatRes.body.category.id;

  // Duplicate name check
  const dupCatRes = await makeRequest(app, 'POST', '/api/categories', {
    headers,
    body: { name: 'Freelance' }
  });
  assert.strictEqual(dupCatRes.status, 409);
  console.log('✔ Duplicate category prevention works');

  // 3. Update Category
  const updateCatRes = await makeRequest(app, 'PUT', `/api/categories/${catId}`, {
    headers,
    body: { name: 'Freelance & Consulting', color: '#059669' }
  });
  assert.strictEqual(updateCatRes.status, 200);
  assert.strictEqual(updateCatRes.body.category.name, 'Freelance & Consulting');
  console.log('✔ Update category works');

  // 4. Create Tags
  const tag1Res = await makeRequest(app, 'POST', '/api/tags', { headers, body: { name: 'frontend' } });
  assert.strictEqual(tag1Res.status, 201);
  const tag1Id = tag1Res.body.tag.id;

  const tag2Res = await makeRequest(app, 'POST', '/api/tags', { headers, body: { name: 'design' } });
  assert.strictEqual(tag2Res.status, 201);

  // Duplicate tag check
  const dupTagRes = await makeRequest(app, 'POST', '/api/tags', { headers, body: { name: 'frontend' } });
  assert.strictEqual(dupTagRes.status, 409);
  console.log('✔ Tag creation and duplicate prevention work');

  // 5. Create todo under Freelance & Consulting category and calculate stats
  await makeRequest(app, 'POST', '/api/todos', {
    headers,
    body: {
      title: 'Design high-converting landing page',
      priority: 'high',
      status: 'pending',
      dueDate: new Date().toISOString().split('T')[0],
      categoryId: catId,
      tagIds: [tag1Id]
    }
  });

  // Check stats
  const statsRes = await makeRequest(app, 'GET', '/api/stats', { headers });
  assert.strictEqual(statsRes.status, 200);
  assert.strictEqual(statsRes.body.stats.total, 1);
  assert.strictEqual(statsRes.body.stats.pending, 1);
  assert.strictEqual(statsRes.body.stats.due_today, 1);
  assert.strictEqual(statsRes.body.stats.priorities.high, 1);
  console.log('✔ Real-time statistics aggregation works');

  // 6. Delete Tag
  const deleteTagRes = await makeRequest(app, 'DELETE', `/api/tags/${tag1Id}`, { headers });
  assert.strictEqual(deleteTagRes.status, 200);
  console.log('✔ Delete tag works');

  // 7. Delete Category
  const deleteCatRes = await makeRequest(app, 'DELETE', `/api/categories/${catId}`, { headers });
  assert.strictEqual(deleteCatRes.status, 200);
  console.log('✔ Delete category works');

  console.log('✅ ALL CATEGORIES, TAGS, AND STATS TESTS PASSED!\n');
}

module.exports = { runCategoriesAndTagsTests };

if (require.main === module) {
  runCategoriesAndTagsTests().catch(err => {
    console.error('❌ Categories/Tags Test Failed:', err);
    process.exit(1);
  });
}
