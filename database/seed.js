const { getDb, execute, queryOne } = require('./db');
const { hashPassword, generateId } = require('../src/utils/security');

function seedDatabase() {
  console.log('🌱 Seeding database...');
  const db = getDb();

  const demoEmail = 'demo@taskflow.dev';
  const demoPassword = 'DemoPassword123!';

  // Clean existing demo user if exists
  const existingUser = queryOne('SELECT id FROM users WHERE email = ?', [demoEmail]);
  if (existingUser) {
    execute('DELETE FROM users WHERE id = ?', [existingUser.id]);
    console.log('Cleared existing demo user data.');
  }

  const userId = generateId('usr');
  const passwordHash = hashPassword(demoPassword);
  const now = Date.now();

  // Create demo user
  execute(
    'INSERT INTO users (id, name, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, 'Alex Morgan', demoEmail, passwordHash, now, now]
  );
  console.log(`✅ Demo User Created: ${demoEmail} / ${demoPassword}`);

  // Categories
  const categories = [
    { id: generateId('cat'), name: 'Work', color: '#0284c7' },
    { id: generateId('cat'), name: 'Personal', color: '#16a34a' },
    { id: generateId('cat'), name: 'Study', color: '#7c3aed' },
    { id: generateId('cat'), name: 'Health', color: '#db2777' },
    { id: generateId('cat'), name: 'Shopping', color: '#ea580c' }
  ];

  categories.forEach(cat => {
    execute(
      'INSERT INTO categories (id, user_id, name, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [cat.id, userId, cat.name, cat.color, now, now]
    );
  });
  console.log(`✅ Created ${categories.length} categories.`);

  // Tags
  const tags = [
    { id: generateId('tag'), name: 'urgent' },
    { id: generateId('tag'), name: 'client' },
    { id: generateId('tag'), name: 'project' },
    { id: generateId('tag'), name: 'bug' },
    { id: generateId('tag'), name: 'routine' }
  ];

  tags.forEach(tag => {
    execute(
      'INSERT INTO tags (id, user_id, name, created_at) VALUES (?, ?, ?, ?)',
      [tag.id, userId, tag.name, now]
    );
  });
  console.log(`✅ Created ${tags.length} tags.`);

  // Date helpers
  const today = new Date();
  const formatYMD = (d) => d.toISOString().split('T')[0];

  const yesterdayStr = formatYMD(new Date(today.getTime() - 86400000));
  const todayStr = formatYMD(today);
  const tomorrowStr = formatYMD(new Date(today.getTime() + 86400000));
  const nextWeekStr = formatYMD(new Date(today.getTime() + 7 * 86400000));

  const sampleTodos = [
    {
      title: 'Review Q3 Engineering Roadmap and budget proposal',
      description: 'Prepare executive summary slides and review team resource allocation.',
      status: 'pending',
      priority: 'high',
      dueDate: todayStr,
      categoryId: categories[0].id, // Work
      tagIds: [tags[0].id, tags[2].id], // urgent, project
      completedAt: null
    },
    {
      title: 'Fix responsive navigation layout on mobile viewports',
      description: 'Ensure dropdown menu and sidebar collapse smoothly on iOS Safari and Android Chrome.',
      status: 'in_progress',
      priority: 'high',
      dueDate: todayStr,
      categoryId: categories[0].id, // Work
      tagIds: [tags[0].id, tags[3].id], // urgent, bug
      completedAt: null
    },
    {
      title: 'Submit quarterly health insurance claims',
      description: 'Upload pharmacy receipts and claim forms to insurance portal.',
      status: 'pending',
      priority: 'medium',
      dueDate: yesterdayStr, // Overdue
      categoryId: categories[3].id, // Health
      tagIds: [tags[4].id], // routine
      completedAt: null
    },
    {
      title: 'Complete Chapter 4 of System Design Architecture book',
      description: 'Focus on distributed consensus, Paxos, Raft, and consistent hashing.',
      status: 'in_progress',
      priority: 'medium',
      dueDate: tomorrowStr,
      categoryId: categories[2].id, // Study
      tagIds: [tags[2].id], // project
      completedAt: null
    },
    {
      title: 'Buy groceries: organic oats, almond milk, espresso beans',
      description: 'Stop by the local farmers market on Saturday morning.',
      status: 'pending',
      priority: 'low',
      dueDate: nextWeekStr,
      categoryId: categories[4].id, // Shopping
      tagIds: [tags[4].id], // routine
      completedAt: null
    },
    {
      title: 'Setup automated CI/CD pipeline and database backups',
      description: 'Configured GitHub Actions workflow with integration tests and SQLite WAL backup.',
      status: 'completed',
      priority: 'high',
      dueDate: yesterdayStr,
      categoryId: categories[0].id, // Work
      tagIds: [tags[2].id], // project
      completedAt: now - 3600000
    },
    {
      title: 'Morning 5km jog in the park',
      description: 'Cardio session and hydration tracking.',
      status: 'completed',
      priority: 'medium',
      dueDate: todayStr,
      categoryId: categories[3].id, // Health
      tagIds: [tags[4].id], // routine
      completedAt: now - 18000000
    }
  ];

  sampleTodos.forEach(todo => {
    const todoId = generateId('tdo');
    execute(
      `INSERT INTO todos (id, user_id, category_id, title, description, status, priority, due_date, completed_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        todoId,
        userId,
        todo.categoryId,
        todo.title,
        todo.description,
        todo.status,
        todo.priority,
        todo.dueDate,
        todo.completedAt,
        now,
        now
      ]
    );

    todo.tagIds.forEach(tagId => {
      execute('INSERT INTO todo_tags (todo_id, tag_id) VALUES (?, ?)', [todoId, tagId]);
    });
  });

  console.log(`✅ Seeded ${sampleTodos.length} realistic tasks.`);
  console.log('🎉 Database seeding complete!');
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
