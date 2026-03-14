'use client';

import { useState } from 'react';

interface InviteLinkProps {
  inviteCode: string;
  leagueId: string;
  isCommissioner: boolean;
}

export default function InviteLink({ inviteCode, leagueId, isCommissioner }: InviteLinkProps) {
  const [code, setCode] = useState(inviteCode);
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const fullUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/leagues/join/${code}`
    : `/leagues/join/${code}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = fullUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRegenerate = async () => {
    if (!confirm('This will invalidate the current invite link. Are you sure?')) return;

    setIsRegenerating(true);
    try {
      const response = await fetch(`/api/leagues/${leagueId}/invite`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to regenerate invite code');
      }

      const data = await response.json();
      setCode(data.invite_code);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to regenerate invite code');
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={fullUrl}
            readOnly
            className="input pr-20 text-sm text-muted bg-cream-300"
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={handleCopy}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-secondary hover:bg-primary/90 transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {isCommissioner && (
        <button
          onClick={handleRegenerate}
          disabled={isRegenerating}
          className="text-sm text-muted hover:text-charcoal transition-colors disabled:opacity-50"
        >
          {isRegenerating ? 'Regenerating...' : 'Regenerate invite link'}
        </button>
      )}
    </div>
  );
}
