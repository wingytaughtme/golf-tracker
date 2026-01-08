import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import SessionProvider from '@/components/providers/session-provider';

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  // Redirect to dashboard if already logged in
  if (session) {
    redirect('/');
  }

  return (
    <SessionProvider>
      <div className="min-h-screen flex flex-col bg-golf-background">
        {/* Header with just logo */}
        <header className="bg-primary py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center space-x-2">
              <svg
                className="h-8 w-8 text-accent"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span className="font-display text-xl font-bold tracking-tight text-white">
                GolfTracker
              </span>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center p-4">
          {children}
        </main>

        {/* Simple footer */}
        <footer className="py-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} GolfTracker. All rights reserved.
        </footer>
      </div>
    </SessionProvider>
  );
}
