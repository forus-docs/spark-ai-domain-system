import mongoose from 'mongoose';
import Domain from '../app/models/Domain';
import { config } from 'dotenv';

config();

async function createBPMDomain() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/netbuild');

    console.log('Connected to MongoDB');

    // Check if BPM domain already exists
    const existingDomain = await Domain.findOne({ slug: 'bpm' });
    if (existingDomain) {
      console.log('BPM domain already exists');
      process.exit(0);
    }

    // Create BPM domain
    const bpmDomain = new Domain({
      domainId: 'business-process-management',
      name: 'Business Process Management',
      slug: 'bpm',
      tagline: 'Workflow Automation & Process Excellence',
      description: 'Experience the power of Camunda workflow automation. Design, execute, and monitor business processes with enterprise-grade BPM tools.',
      icon: '🔄',
      color: '#FF6900', // Camunda orange
      gradient: 'from-orange-500 to-orange-600',
      cta: 'Start automating your workflows',
      joinDetails: {
        minInvestment: '0 USD',
        benefit: 'Free access to workflow tools',
      },
      memberCount: 0,
      availableRoles: [
        {
          id: 'visitor',
          name: 'Visitor',
          description: 'Explore BPM capabilities',
          monthlyFee: 0,
          benefits: [
            'View workflow demonstrations',
            'Learn about process automation',
            'Access Camunda documentation',
            'Try basic features',
          ],
        },
        {
          id: 'process_designer',
          name: 'Process Designer',
          description: 'Design and model business processes',
          monthlyFee: 50,
          benefits: [
            'Create BPMN 2.0 process models',
            'Design decision tables (DMN)',
            'Test process flows',
            'Export process documentation',
          ],
        },
        {
          id: 'process_operator',
          name: 'Process Operator',
          description: 'Execute and monitor processes',
          monthlyFee: 30,
          benefits: [
            'Start process instances',
            'Complete user tasks',
            'Monitor process performance',
            'View process analytics',
          ],
        },
        {
          id: 'admin',
          name: 'Administrator',
          description: 'Full BPM platform administration',
          monthlyFee: 100,
          benefits: [
            'Deploy process definitions',
            'Manage users and permissions',
            'Configure system settings',
            'Access all features',
          ],
        },
      ],
      features: [
        'BPMN 2.0 Process Modeling',
        'DMN Decision Tables',
        'User Task Management',
        'Process Monitoring',
        'REST API Access',
        'Workflow Analytics',
      ],
      processes: [],
      navigation: [
        { id: 'domains', name: 'Domains', href: '/domains', icon: '🌐' },
        { id: 'processes', name: 'Processes', href: '/processes', icon: '📋' },
        { id: 'tasks', name: 'Tasks', href: '/tasks', icon: '✅' },
        { id: 'tasklist', name: 'Tasklist', href: '/tasklist', icon: '📋' },
        { id: 'cockpit', name: 'Cockpit', href: '/cockpit', icon: '🚁' },
        { id: 'admin', name: 'Admin', href: '/admin', icon: '⚙️' },
        { id: 'dashboards', name: 'Dashboards', href: '/dashboards', icon: '📊' },
        { id: 'teams', name: 'Teams', href: '/teams', icon: '👥' },
      ],
      region: 'Global',
      active: true,
    });

    await bpmDomain.save();
    console.log('BPM domain created successfully');
    console.log('Domain ID:', bpmDomain._id);
    console.log('Domain slug:', bpmDomain.slug);

  } catch (error) {
    console.error('Error creating BPM domain:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run the script
createBPMDomain();