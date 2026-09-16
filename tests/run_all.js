const { runAuthTests } = require('./auth.test');
const { runTodoTests } = require('./todos.test');
const { runIsolationTests } = require('./isolation.test');
const { runCategoriesAndTagsTests } = require('./categories_tags.test');

async function main() {
  console.log('====================================================');
  console.log('🧪 TASKFLOW PRO - AUTOMATED TEST SUITE');
  console.log('====================================================\n');

  const startTime = Date.now();
  let failed = false;

  try {
    await runAuthTests();
    await runTodoTests();
    await runIsolationTests();
    await runCategoriesAndTagsTests();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log('====================================================');
    console.log(`🎉 ALL TEST SUITES PASSED SUCCESSFULLY in ${duration}s!`);
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST RUN FAILED:\n', error);
    process.exit(1);
  }
}

main();
