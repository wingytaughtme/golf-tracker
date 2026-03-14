'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function JoinLeagueEntryPage() {
  const router = useRouter();
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed) {
      router.push(`/leagues/join/${trimmed}`);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <Link
          href="/leagues"
          className="inline-flex items-center gap-1 text-sm text-muted hover:text-charcoal transition-colors mb-4"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Leagues
        </Link>
        <h1 className="text-2xl font-serif font-bold text-charcoal">Join a League</h1>
        <p className="text-muted mt-1">Enter the invite code shared by your league commissioner</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <div>
          <label htmlFor="code" className="label">Invite Code</label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g., ABC12345"
            className="input uppercase tracking-wider text-center text-lg"
            maxLength={8}
            autoFocus
          />
          <p className="text-xs text-muted mt-1">
            The invite code is usually 8 characters. Ask your commissioner for the code or link.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!code.trim()}
            className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </button>
          <Link href="/leagues" className="btn-outline">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
