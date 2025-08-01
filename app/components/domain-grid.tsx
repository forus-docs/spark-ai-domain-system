'use client';

import { useState } from 'react';
import { useDomain } from '@/app/contexts/domain-context';
import { DomainCard } from '@/app/components/domain-card';
import { DomainJoinModal } from '@/app/components/domain-join-modal';
import { CreateDomainCard } from '@/app/components/create-domain-card';
import { CreateDomainModal } from '@/app/components/create-domain-modal';
import type { Domain } from '@/app/types/domain.types';

export function DomainGrid() {
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { joinedDomains, domains } = useDomain();

  const handleDomainClick = (domain: Domain) => {
    setSelectedDomain(domain);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDomain(null);
  };

  const handleCreateDomainClick = () => {
    setIsCreateModalOpen(true);
  };

  return (
    <>
      <div className="grid gap-3 grid-cols-1">
        {domains.map((domain) => {
          const isJoined = joinedDomains.some(m => m.id === domain.id);
          
          return (
            <DomainCard
              key={domain.id}
              domain={domain}
              isJoined={isJoined}
              onClick={() => handleDomainClick(domain)}
            />
          );
        })}
        
        {/* Add Create Domain Card at the end */}
        <CreateDomainCard onClick={handleCreateDomainClick} />
      </div>

      {selectedDomain && (
        <DomainJoinModal
          domain={selectedDomain}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
      
      <CreateDomainModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </>
  );
}