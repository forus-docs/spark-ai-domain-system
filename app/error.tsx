'use client';

export const dynamic = 'force-dynamic';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-light text-gray-900 mb-4">500</h1>
        <p className="text-xl text-gray-600 mb-8">Something went wrong!</p>
        <button
          onClick={() => reset()}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Try again
        </button>
      </div>
    </div>
  );
}