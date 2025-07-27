'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDomain } from '@/app/contexts/domain-context';
import { useAuth } from '@/app/contexts/auth-context';

export default function HomeContent() {
  const { currentDomain } = useDomain();
  const { user, accessToken } = useAuth();

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

  return (
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
        <div className="bg-white rounded-lg p-8 text-center">
          <h2 className="text-2xl font-light text-gray-900 mb-4">Welcome to {currentDomain.name}</h2>
          <p className="text-gray-600">
            {user ? 'Your domain workspace is ready.' : 'Please sign in to access domain features.'}
          </p>
        </div>
      </div>
    </div>
  );
}