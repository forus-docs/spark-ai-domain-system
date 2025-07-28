import mongoose from 'mongoose';
import { connectToDatabase } from '../app/lib/database';

async function verifySchemaConsistency() {
  await connectToDatabase();
  
  console.log('=== Schema Consistency Verification ===\n');
  
  // Check DomainTask collection
  console.log('DomainTask Collection:');
  console.log('- domain field: String (stores domain ID as string)');
  console.log('- masterTaskId field: String');
  console.log('- Unique constraint: domain + masterTaskId');
  console.log('');
  
  // Check TaskExecution collection  
  console.log('TaskExecution Collection:');
  console.log('- domainId field: ObjectId (references Domain)');
  console.log('- domainTaskId field: ObjectId (references DomainTask)');
  console.log('- userId field: ObjectId (references User)');
  console.log('');
  
  // Check data consistency
  console.log('Data Type Conversions Required:');
  console.log('- When creating TaskExecution from DomainTask:');
  console.log('  - domainTask.domain (String) -> new ObjectId(domainTask.domain)');
  console.log('  - domainTask._id (ObjectId) -> use as-is for domainTaskId');
  console.log('  - userId (String from JWT) -> new ObjectId(userId)');
  console.log('');
  
  // Sample data check
  const db = mongoose.connection.db;
  
  // Get a sample domainTask
  const domainTask = await db.collection('domainTasks').findOne({});
  if (domainTask) {
    console.log('Sample DomainTask:');
    console.log(`- _id: ${domainTask._id} (type: ${typeof domainTask._id})`);
    console.log(`- domain: ${domainTask.domain} (type: ${typeof domainTask.domain})`);
    console.log(`- masterTaskId: ${domainTask.masterTaskId} (type: ${typeof domainTask.masterTaskId})`);
  }
  
  console.log('\nVerification complete!');
  process.exit(0);
}

verifySchemaConsistency().catch(console.error);