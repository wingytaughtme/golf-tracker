'use client';

import RoundSetupWizard from '@/components/rounds/round-setup-wizard';
import Link from 'next/link';

export default function NewRoundPage() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/rounds"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-charcoal mb-2"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Rounds
        </Link>
        <h1 className="text-2xl font-serif font-bold text-charcoal">Start New Round</h1>
        <p className="text-muted mt-1">Set up your round in a few simple steps</p>
      </div>

      {/* Wizard */}
      <RoundSetupWizard />
    </div>
  );
}
