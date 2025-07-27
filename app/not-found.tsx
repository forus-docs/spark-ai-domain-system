'use client';

export const dynamic = 'force-dynamic';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-light text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Page not found</p>
        <Link
          href="/domains"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Browse domains
        </Link>
      </div>
    </div>
  );
}