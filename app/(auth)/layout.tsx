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
      <div className="min-h-screen flex flex-col">
        {/* Main content - pages will handle their own backgrounds */}
        <main className="flex-1 flex items-center justify-center">
          {children}
        </main>

        {/* Simple footer */}
        <footer className="absolute bottom-4 left-0 right-0 text-center text-sm text-white/60">
          &copy; {new Date().getFullYear()} Birdie Book. All rights reserved.
        </footer>
      </div>
    </SessionProvider>
  );
}
