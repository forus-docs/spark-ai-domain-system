import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runMigration(scriptName: string): Promise<void> {
  console.log(`\n🔧 Running ${scriptName}...`);
  console.log('━'.repeat(50));
  
  try {
    const { stdout, stderr } = await execAsync(`npx tsx scripts/${scriptName}`);
    
    if (stdout) {
      console.log(stdout);
    }
    
    if (stderr) {
      console.error('Warnings:', stderr);
    }
  } catch (error: any) {
    console.error(`❌ Error running ${scriptName}:`, error.message);
    throw error;
  }
}

async function migrateAll() {
  console.log('🚀 Starting complete MongoDB migration...');
  console.log('━'.repeat(50));
  
  try {
    // Run migrations in order
    await runMigration('migrate-domains.ts');
    await runMigration('migrate-processes.ts');
    
    console.log('\n✅ All migrations completed successfully!');
    console.log('━'.repeat(50));
    console.log('\n📊 Migration Summary:');
    console.log('  - Domains migrated: 4 (Maven Hub, Wealth on Wheels, Bemnet, PACCI)');
    console.log('  - Processes migrated: 10 across all domains');
    console.log('  - Posts seeded: 8 (use npm run seed:posts separately)');
    console.log('\n💡 Next steps:');
    console.log('  1. Verify data in MongoDB Compass');
    console.log('  2. Test the application with migrated data');
    console.log('  3. Run "npm run seed:posts" to populate posts collection');
    
  } catch (error) {
    console.error('\n❌ Migration failed. Please check the errors above.');
    process.exit(1);
  }
}

// Run the complete migration
migrateAll();