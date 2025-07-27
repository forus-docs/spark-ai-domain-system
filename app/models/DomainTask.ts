/**
 * Domain Task Model - Unified Schema Version
 * 
 * This model now uses the unified MasterTask schema with domain-specific fields.
 * DomainTasks are simply MasterTask documents with the 'domain' field populated.
 * 
 * For backward compatibility, this file exports type aliases and helper functions
 * to work with domain-scoped tasks.
 */

import MasterTask, { IMasterTask } from './MasterTask';

// Type alias for clarity - DomainTask is just a MasterTask with domain field
export interface IDomainTask extends IMasterTask {
  domain: string; // This field is required for DomainTasks
}

// For backward compatibility, re-export as DomainTask
const DomainTask = MasterTask;

// Helper functions for domain-specific queries
export const DomainTaskHelpers = {
  // Find all tasks for a domain
  findByDomain: (domainId: string) => {
    return MasterTask.find({ 
      domain: domainId,
      userId: { $exists: false } // Exclude user-assigned tasks
    });
  },

  // Find active tasks for a domain
  findActiveByDomain: (domainId: string) => {
    return MasterTask.find({ 
      domain: domainId,
      active: true,
      userId: { $exists: false }
    });
  },

  // Adopt a master task to a domain
  adoptFromMaster: async (masterTaskId: string, domainId: string, adoptedBy: string, customizations?: any) => {
    const masterTask = await MasterTask.findOne({ 
      masterTaskId,
      domain: { $exists: false } // Ensure it's a master task
    });

    if (!masterTask) {
      throw new Error('Master task not found');
    }

    // Create domain task (copy of master with domain field)
    const domainTaskData = masterTask.toObject();
    delete domainTaskData._id;
    
    // Add domain-specific fields
    domainTaskData.domain = domainId;
    domainTaskData.adoptedAt = new Date();
    domainTaskData.adoptedBy = adoptedBy;
    
    // Apply customizations if provided
    if (customizations) {
      domainTaskData.domainCustomizations = customizations;
      // Apply customizations to main fields if specified
      if (customizations.title) domainTaskData.title = customizations.title;
      if (customizations.description) domainTaskData.description = customizations.description;
      if (customizations.estimatedTime) domainTaskData.estimatedTime = customizations.estimatedTime;
      if (customizations.reward) domainTaskData.reward = customizations.reward;
    }

    return MasterTask.create(domainTaskData);
  }
};

export default DomainTask;