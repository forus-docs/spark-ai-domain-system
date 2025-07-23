'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDomain } from '@/app/contexts/domain-context';
import { useAuth } from '@/app/contexts/auth-context';
import { ProcessCard } from '@/app/components/process-card';
import { ChatInterface } from '@/app/components/chat-interface';
import { ChatInterfaceV2 } from '@/app/components/chat-interface-v2';

export default function HomeContent() {
  const { currentDomain } = useDomain();
  const { user, accessToken } = useAuth();
  const [selectedProcess, setSelectedProcess] = useState<any>(null);

  const handleProcessClick = (process: any) => {
    setSelectedProcess(process);
  };

  const handleCloseChat = () => {
    setSelectedProcess(null);
  };

  if (!currentDomain) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-light text-gray-900 mb-4">
            Welcome to Spark AI
          </h1>
          <p className="text-gray-600 mb-8">
            Select a domain to get started with AI-powered business processes.
          </p>
          <Link
            href="/domains"
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Browse Domains
            <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  // Get domain-specific mock processes
  const domainProcesses = currentDomain.id === 'maven-hub' ? [
    { 
      id: '1', 
      name: 'Investor Profile Creation', 
      executionModel: 'form' as const, 
      description: 'Complete your investor profile to receive personalized opportunities',
      currentStage: 'assisted' as const,
      aiAgentAttached: true,
      aiAgentRole: 'Pre-fills fields based on LinkedIn profile'
    },
    { 
      id: '2', 
      name: 'Investment Analysis', 
      executionModel: 'knowledge' as const,
      description: 'Research and analyze potential investment opportunities',
      currentStage: 'manual' as const,
      aiAgentAttached: true,
      aiAgentRole: 'Learning patterns from analyst decisions'
    },
    { 
      id: '3', 
      name: 'Due Diligence Review', 
      executionModel: 'sop' as const,
      description: 'Standardized process for evaluating investment opportunities',
      currentStage: 'supervised' as const,
      aiAgentAttached: true,
      aiAgentRole: 'Ensures consistent evaluation standards'
    },
  ] : currentDomain.id === 'wealth-on-wheels' ? [
    { 
      id: '1', 
      name: 'Driver Onboarding', 
      executionModel: 'form' as const,
      description: 'Register new drivers and collect required documentation',
      currentStage: 'assisted' as const,
      aiAgentAttached: true,
      aiAgentRole: 'Validates documents and suggests improvements'
    },
    { 
      id: '2', 
      name: 'Route Optimization', 
      executionModel: 'bpmn' as const,
      description: 'Optimize vehicle routes based on demand and traffic',
      currentStage: 'automated' as const,
      aiAgentAttached: false
    },
    { 
      id: '3', 
      name: 'Safety Training', 
      executionModel: 'training' as const,
      description: 'Safety and efficiency training program for drivers',
      currentStage: 'manual' as const,
      aiAgentAttached: true,
      aiAgentRole: 'Personalizes curriculum based on driver performance'
    },
  ] : [];

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Domain Banner */}
        <div className={`bg-gradient-to-r ${currentDomain.gradient} p-8 text-white`}>
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-2">
              <span className="text-4xl">{currentDomain.icon}</span>
              <h1 className="text-3xl font-light">{currentDomain.name}</h1>
            </div>
            <p className="text-white/90 max-w-2xl">{currentDomain.description}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-8">

          {/* Processes Section */}
          <div>
            <h2 className="text-2xl font-light text-gray-900 mb-6">
              {user ? 'Available Processes' : 'Domain Processes'}
            </h2>
            
            {domainProcesses.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {domainProcesses.map(process => (
                  <ProcessCard
                    key={process.id}
                    process={process}
                    onClick={() => handleProcessClick(process)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg p-8 text-center">
                <p className="text-gray-600">
                  No processes available for this domain yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      {selectedProcess && (
        user && accessToken ? (
          <ChatInterfaceV2
            processName={selectedProcess.name}
            processId={selectedProcess.id}
            executionModel={selectedProcess.executionModel}
            onClose={handleCloseChat}
            accessToken={accessToken}
          />
        ) : (
          <ChatInterface
            processName={selectedProcess.name}
            executionModel={selectedProcess.executionModel}
            onClose={handleCloseChat}
          />
        )
      )}
    </>
  );
}