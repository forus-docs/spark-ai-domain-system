import TaskExecution from '@/app/models/TaskExecution';
import ExecutionMessage from '@/app/models/ExecutionMessage';
import DomainTask from '@/app/models/DomainTask';
import { v4 as uuidv4 } from 'uuid';
import { Types } from 'mongoose';

export interface WorkstreamMember {
  userId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
}

export interface CreateWorkstreamData {
  domainId: string;
  name: string;
  description?: string;
  createdBy: string;
  members?: string[]; // User IDs to add as members
}

export class WorkstreamService {
  /**
   * Create a workstream using TaskExecution model
   */
  static async createWorkstream(data: CreateWorkstreamData) {
    const executionId = uuidv4();
    
    // Find the basic workstream domain task
    console.log('Looking for workstream task with:', {
      domain: data.domainId,
      taskType: 'workstream_basic',
      domainIdType: typeof data.domainId,
      domainIdValue: data.domainId
    });
    
    // Domain is stored as string in DomainTask collection
    const domainIdString = data.domainId.toString();
    
    const workstreamDomainTask = await DomainTask.findOne({
      domain: domainIdString,
      taskType: 'workstream_basic'
    });

    if (!workstreamDomainTask) {
      console.error('Workstream task not found for domain:', data.domainId);
      
      // Additional debug info
      const taskCount = await DomainTask.countDocuments({ domain: domainIdString });
      const workstreamCount = await DomainTask.countDocuments({ taskType: 'workstream_basic' });
      
      // Find all workstream tasks to see what domains they're in
      const allWorkstreamTasks = await DomainTask.find({ taskType: 'workstream_basic' }).select('domain name');
      console.error('All workstream tasks in DB:', allWorkstreamTasks.map(t => ({
        domain: t.domain,
        name: t.name,
        _id: t._id
      })));
      
      console.error('Debug info:', {
        domainId: data.domainId,
        domainIdString: domainIdString,
        totalTasksInDomain: taskCount,
        totalWorkstreamTasks: workstreamCount,
        searchCriteria: {
          domain: domainIdString,
          taskType: 'workstream_basic'
        }
      });
      
      throw new Error(`Basic workstream task not found for domain ${data.domainId}. Total tasks in domain: ${taskCount}, Total workstream tasks: ${workstreamCount}`);
    }
    
    // Create members array with creator as admin
    const members: WorkstreamMember[] = [
      {
        userId: data.createdBy,
        role: 'admin',
        joinedAt: new Date()
      }
    ];

    // Add additional members if provided
    if (data.members) {
      for (const memberId of data.members) {
        if (memberId !== data.createdBy) {
          members.push({
            userId: memberId,
            role: 'member',
            joinedAt: new Date()
          });
        }
      }
    }

    // Convert domainTask to plain object for QMS compliance
    const domainTaskObj = workstreamDomainTask.toObject();
    
    // Override/add workstream-specific fields
    domainTaskObj.title = data.name;
    domainTaskObj.description = data.description || domainTaskObj.description || '';
    domainTaskObj.members = members;
    domainTaskObj.createdBy = data.createdBy;
    domainTaskObj.lastActivityAt = new Date();
    // Ensure taskType is preserved as 'workstream_basic' from the DomainTask
    
    // Create workstream as a special TaskExecution
    const workstream = new TaskExecution({
      executionId,
      userId: new Types.ObjectId(data.createdBy),
      domainId: new Types.ObjectId(data.domainId),
      domainTaskId: workstreamDomainTask._id,
      
      // Store complete task snapshot (QMS compliant)
      taskSnapshot: domainTaskObj,
      
      status: 'in_progress', // Workstreams are always active
      assignedAt: new Date(),
      startedAt: new Date(),
      messages: []
    });

    await workstream.save();

    // Create initial system message
    const welcomeMessage = new ExecutionMessage({
      messageId: uuidv4(),
      executionId: executionId,
      role: 'system',
      content: `Welcome to ${data.name}! This workstream was created for team collaboration.`,
      text: `Welcome to ${data.name}! This workstream was created for team collaboration.`,
      userId: data.createdBy,
      isCreatedByUser: false
    });

    await welcomeMessage.save();
    
    workstream.messages.push(welcomeMessage._id);
    await workstream.save();

    return workstream;
  }

  /**
   * Get workstreams for a user in a domain
   */
  static async getUserWorkstreams(userId: string, domainId: string) {
    const workstreams = await TaskExecution.find({
      domainId: new Types.ObjectId(domainId),
      'taskSnapshot.taskType': 'workstream_basic',
      'taskSnapshot.members.userId': userId,
      status: 'in_progress'
    }).sort({ 'taskSnapshot.lastActivityAt': -1 });

    return workstreams;
  }

  /**
   * Add a member to a workstream
   */
  static async addMember(executionId: string, userId: string, role: 'admin' | 'member' = 'member') {
    const workstream = await TaskExecution.findOne({ executionId });
    
    if (!workstream || workstream.taskSnapshot.taskType !== 'workstream_basic') {
      throw new Error('Workstream not found');
    }

    // Check if member already exists
    const existingMember = workstream.taskSnapshot.members.find(
      (m: WorkstreamMember) => m.userId === userId
    );

    if (!existingMember) {
      workstream.taskSnapshot.members.push({
        userId,
        role,
        joinedAt: new Date()
      });

      await workstream.save();

      // Create a system message for the new member
      const joinMessage = new ExecutionMessage({
        messageId: uuidv4(),
        executionId: executionId,
        role: 'system',
        content: `User joined the workstream`,
        text: `User joined the workstream`,
        userId: userId,
        isCreatedByUser: false
      });

      await joinMessage.save();
      
      workstream.messages.push(joinMessage._id);
      await workstream.save();
    }

    return workstream;
  }

  /**
   * Check if user is member of workstream
   */
  static async isMember(executionId: string, userId: string): Promise<boolean> {
    const workstream = await TaskExecution.findOne({
      executionId,
      'taskSnapshot.taskType': 'workstream_basic',
      'taskSnapshot.members.userId': userId
    });

    return !!workstream;
  }

  /**
   * Get workstream messages (reuse existing ExecutionMessage queries)
   */
  static async getMessages(executionId: string, limit: number = 50, before?: string) {
    const query: any = { 
      executionId,
      role: { $ne: 'tool' } // Exclude tool messages for workstreams
    };

    if (before) {
      const beforeMessage = await ExecutionMessage.findOne({ messageId: before });
      if (beforeMessage) {
        query.createdAt = { $lt: beforeMessage.createdAt };
      }
    }

    const messages = await ExecutionMessage
      .find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    // Reverse to get chronological order
    return messages.reverse();
  }
}