'use client';

import { useState } from 'react';
import { useAuth } from '@/app/contexts/auth-context';
import { cn } from '@/app/lib/utils';
import { Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { login, error } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(formData.email, formData.password);
    } catch (err) {
      // Error is handled in auth context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-3">
      <div className="w-full space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-12 h-12 bg-green-500 rounded-md flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="mt-4 text-2xl font-light text-gray-900">
            Welcome back
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Sign in to your Spark account.{' '}
            <Link
              href="/register"
              className="font-medium text-green-600 hover:text-green-500"
            >
              New to Spark?
            </Link>
          </p>
        </div>

        {/* Form */}
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 text-sm"
                placeholder="Email address"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                "group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white transition-colors",
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/forgot-password"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Forgot your password?
            </Link>
          </div>
        </form>

        {/* Quick access note */}
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-xs text-blue-800">
            <strong>Quick Access:</strong> Use your registered email and password to access your domains and continue your work.
          </p>
        </div>
      </div>
    </div>
  );
}