import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Header from '@/components/layout/header';
import MobileNav from '@/components/layout/nav';
import Footer from '@/components/layout/footer';
import SessionProvider from '@/components/providers/session-provider';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <SessionProvider>
      <div className="min-h-screen flex flex-col bg-golf-background">
        <Header />
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-6">
          {children}
        </main>
        <Footer />
        <MobileNav />
      </div>
    </SessionProvider>
  );
}
