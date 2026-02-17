'use client';

import { ReactNode } from 'react';
import SessionProvider from './session-provider';
import { ToastProvider } from '@/components/ui/toast';

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </SessionProvider>
  );
}
