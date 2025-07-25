const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb://localhost:27017/spark-ai';

async function investigateDataFlow() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB\n');
    
    const db = client.db();
    
    console.log('=== INVESTIGATION REPORT: Data Flow Analysis ===\n');
    
    // 1. Check MasterTasks
    console.log('1. MASTER TASKS:');
    const masterTasks = await db.collection('masterTasks').find({}).toArray();
    console.log(`   Total: ${masterTasks.length}`);
    
    if (masterTasks.length > 0) {
      const sampleMaster = masterTasks[0];
      console.log(`   Sample: "${sampleMaster.name}"`);
      console.log(`   - processId: ${sampleMaster.processId}`);
      console.log(`   - Has full SOP data: ${!!sampleMaster.standardOperatingProcedure}`);
      console.log(`   - Has checklist: ${!!sampleMaster.checklist}`);
      console.log(`   - executionModel: ${sampleMaster.executionModel}`);
    }
    
    // 2. Check DomainTasks
    console.log('\n2. DOMAIN TASKS:');
    const domainTasks = await db.collection('domainTasks').find({}).toArray();
    console.log(`   Total: ${domainTasks.length}`);
    
    if (domainTasks.length > 0) {
      const sampleDomain = domainTasks[0];
      console.log(`   Sample: "${sampleDomain.title}"`);
      console.log(`   - masterTaskId reference: ${sampleDomain.masterTaskId}`);
      console.log(`   - Has originalMasterTaskId: ${!!sampleDomain.originalMasterTaskId}`);
      console.log(`   - Has full task data: ${!!sampleDomain.description}`);
      console.log(`   - Has domainCustomizations: ${!!sampleDomain.domainCustomizations}`);
      
      // Check if domainTask contains full masterTask data
      console.log(`   - Has SOP data: ${!!sampleDomain.standardOperatingProcedure}`);
      console.log(`   - Has checklist: ${!!sampleDomain.checklist}`);
      console.log(`   - Has executionModel: ${!!sampleDomain.executionModel}`);
    }
    
    // 3. Check UserTasks
    console.log('\n3. USER TASKS:');
    const userTasks = await db.collection('userTasks').find({}).toArray();
    console.log(`   Total: ${userTasks.length}`);
    
    if (userTasks.length > 0) {
      const sampleUser = userTasks[0];
      console.log(`   Sample UserTask:`);
      console.log(`   - domainTaskId reference: ${sampleUser.domainTaskId}`);
      console.log(`   - masterTaskId reference: ${sampleUser.masterTaskId}`);
      console.log(`   - Has taskSnapshot: ${!!sampleUser.taskSnapshot}`);
      
      if (sampleUser.taskSnapshot) {
        console.log(`   - Snapshot contains:`);
        console.log(`     • title: ${!!sampleUser.taskSnapshot.title}`);
        console.log(`     • description: ${!!sampleUser.taskSnapshot.description}`);
        console.log(`     • ctaAction: ${!!sampleUser.taskSnapshot.ctaAction}`);
      }
    }
    
    // 4. Analysis
    console.log('\n=== ANALYSIS ===\n');
    
    console.log('CURRENT IMPLEMENTATION:');
    console.log('- DomainTask only stores reference to MasterTask (masterTaskId)');
    console.log('- DomainTask does NOT contain full MasterTask data (SOP, checklist, etc.)');
    console.log('- UserTask contains snapshot of DomainTask display fields only');
    console.log('- UserTask does NOT contain execution data from MasterTask');
    
    console.log('\nPROBLEMS IDENTIFIED:');
    console.log('1. When creating TaskExecution, system fetches MasterTask dynamically');
    console.log('2. If MasterTask changes, ongoing executions would be affected');
    console.log('3. Domain cannot review/approve MasterTask changes before they affect users');
    console.log('4. No audit trail of what version of MasterTask was used');
    
    console.log('\nQMS REQUIREMENTS VIOLATED:');
    console.log('- ❌ Changes to procedures must be approved by domains');
    console.log('- ❌ Running tasks cannot change mid-execution');
    console.log('- ❌ Full audit trail of exact procedures used');
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

investigateDataFlow();