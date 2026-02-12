const { syncDatabase } = require('./models');

const run = async () => {
  try {
    // Run safe schema update without dropping tables
    await syncDatabase(false, true);
    console.log('✅ Database updated (alter:true)');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to update database:', err);
    process.exit(1);
  }
};

run();
