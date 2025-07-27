/**
 * Unified Task Model
 * 
 * This provides type-safe access to the unified task schema
 * for different contexts (Master, Domain, User).
 */

import MasterTask from './MasterTask';

// Type aliases for clarity
export const Task = MasterTask;

// Query helpers for different contexts
export const TaskQueries = {
  // Get all master tasks (no domain or user fields)
  getMasterTasks: () => {
    return MasterTask.find({
      domain: { $exists: false },
      userId: { $exists: false }
    });
  },

  // Get domain tasks for a specific domain
  getDomainTasks: (domainId: string) => {
    return MasterTask.find({
      domain: domainId,
      userId: { $exists: false }
    });
  },

  // Get user tasks for a specific user
  getUserTasks: (userId: string) => {
    return MasterTask.find({
      userId: userId
    });
  },

  // Get user tasks assigned to a user
  getTasksAssignedTo: (userId: string) => {
    return MasterTask.find({
      assignedTo: userId
    });
  },

  // Get user tasks assigned by a user
  getTasksAssignedBy: (userId: string) => {
    return MasterTask.find({
      assignedBy: userId
    });
  },

  // Copy master task to domain (domain adoption)
  adoptToDomain: async (masterTaskId: string, domainId: string, adoptedBy: string) => {
    const masterTask = await MasterTask.findOne({ 
      masterTaskId, 
      domain: { $exists: false } 
    });
    
    if (!masterTask) {
      throw new Error('Master task not found');
    }

    // Create a copy with domain fields
    const domainTask = masterTask.toObject();
    delete domainTask._id; // Remove _id so MongoDB creates a new one
    
    // Add domain-specific fields
    domainTask.domain = domainId;
    domainTask.adoptedAt = new Date();
    domainTask.adoptedBy = adoptedBy;
    
    // Create new document
    return MasterTask.create(domainTask);
  },

  // Copy domain task to user (task assignment)
  assignToUser: async (domainTaskId: string, userId: string, assignedBy: string) => {
    const domainTask = await MasterTask.findById(domainTaskId);
    
    if (!domainTask || !domainTask.domain) {
      throw new Error('Domain task not found');
    }

    // Create a copy with user fields
    const userTask = domainTask.toObject();
    delete userTask._id; // Remove _id so MongoDB creates a new one
    
    // Add user-specific fields
    userTask.userId = userId;
    userTask.domainTaskId = domainTaskId;
    userTask.assignedTo = userId;
    userTask.assignedBy = assignedBy;
    userTask.timestampAssigned = new Date();
    userTask.isCompleted = false;
    userTask.isHidden = false;
    userTask.viewCount = 0;
    userTask.progress = {
      currentStep: 0,
      totalSteps: 1,
      percentComplete: 0
    };
    
    // Create new document
    return MasterTask.create(userTask);
  }
};

export default Task;