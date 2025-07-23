'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-light text-gray-900 mb-4">Error</h1>
            <p className="text-xl text-gray-600 mb-8">Something went wrong!</p>
            <button
              onClick={() => reset()}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}