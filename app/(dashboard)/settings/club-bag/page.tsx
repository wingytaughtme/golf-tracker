'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CLUB_TYPE_COLORS } from '@/lib/calculations/club-distances';

interface ClubData {
  id: string;
  name: string;
  club_type: string;
  brand: string | null;
  model: string | null;
  loft: number | null;
  display_order: number;
  stats: { avg: number; min: number; max: number; count: number; last_recorded: string | null } | null;
  distance_count: number;
}

type Tab = 'clubs' | 'distances' | 'chart';

export default function ClubBagPage() {
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [clubs, setClubs] = useState<ClubData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('clubs');
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Add club form
  const [newClubName, setNewClubName] = useState('');
  const [newClubType, setNewClubType] = useState('iron');

  // Distance entry
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null);
  const [distanceValue, setDistanceValue] = useState('');
  const [batchDistances, setBatchDistances] = useState<Record<string, string>>({});

  useEffect(() => {
    async function load() {
      try {
        const playersRes = await fetch('/api/players');
        if (!playersRes.ok) throw new Error('Failed to fetch player');
        const playersData = await playersRes.json();
        const pid = playersData.own_player?.id;
        if (!pid) throw new Error('No player profile found');
        setPlayerId(pid);

        const clubsRes = await fetch(`/api/players/${pid}/clubs`);
        if (!clubsRes.ok) throw new Error('Failed to fetch clubs');
        const clubsData = await clubsRes.json();
        setClubs(clubsData.clubs || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const refreshClubs = async () => {
    if (!playerId) return;
    const res = await fetch(`/api/players/${playerId}/clubs`);
    if (res.ok) {
      const data = await res.json();
      setClubs(data.clubs || []);
    }
  };

  const showMessage = (msg: string) => {
    setSaveMessage(msg);
    setTimeout(() => setSaveMessage(null), 2000);
  };

  const handleMoveClub = async (clubId: string, direction: 'up' | 'down') => {
    const idx = clubs.findIndex(c => c.id === clubId);
    if (direction === 'up' && idx <= 0) return;
    if (direction === 'down' && idx >= clubs.length - 1) return;

    const newClubs = [...clubs];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newClubs[idx], newClubs[swapIdx]] = [newClubs[swapIdx], newClubs[idx]];

    const reorder = newClubs.map((c, i) => ({ club_id: c.id, display_order: i }));
    setClubs(newClubs.map((c, i) => ({ ...c, display_order: i })));

    await fetch(`/api/players/${playerId}/clubs/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reorder),
    });
  };

  const handleAddClub = async () => {
    if (!newClubName.trim() || !playerId) return;
    const res = await fetch(`/api/players/${playerId}/clubs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newClubName, club_type: newClubType }),
    });
    if (res.ok) {
      setNewClubName('');
      await refreshClubs();
      showMessage('Club added');
    } else {
      const data = await res.json();
      setError(data.error);
    }
  };

  const handleDeleteClub = async (clubId: string) => {
    if (!playerId) return;
    await fetch(`/api/players/${playerId}/clubs/${clubId}`, { method: 'DELETE' });
    await refreshClubs();
    showMessage('Club removed');
  };

  const handleAddDistance = async (clubId: string, distance: string) => {
    if (!playerId || !distance) return;
    const res = await fetch(`/api/players/${playerId}/clubs/${clubId}/distances`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ distance: parseInt(distance), source: 'manual' }),
    });
    if (res.ok) {
      await refreshClubs();
      showMessage('Distance saved');
      return true;
    }
    return false;
  };

  const handleQuickDistance = async () => {
    if (!selectedClubId || !distanceValue) return;
    const ok = await handleAddDistance(selectedClubId, distanceValue);
    if (ok) {
      setDistanceValue('');
    }
  };

  const handleBatchSave = async () => {
    for (const [clubId, dist] of Object.entries(batchDistances)) {
      if (dist) await handleAddDistance(clubId, dist);
    }
    setBatchDistances({});
    showMessage('Distances saved');
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-serif font-bold text-charcoal">Club Bag</h1>
        <div className="card p-6 animate-pulse"><div className="h-64 bg-cream-400 rounded" /></div>
      </div>
    );
  }

  const chartData = clubs
    .filter(c => c.stats && c.club_type !== 'putter')
    .map(c => ({
      name: c.name,
      avg: c.stats!.avg,
      club_type: c.club_type,
    }))
    .sort((a, b) => b.avg - a.avg);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/settings" className="inline-flex items-center gap-1 text-sm text-muted hover:text-charcoal mb-2">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Settings
          </Link>
          <h1 className="text-2xl font-serif font-bold text-charcoal">Club Bag</h1>
          <p className="text-muted text-sm mt-1">{clubs.length}/14 clubs</p>
        </div>
      </div>

      {error && (
        <div className="bg-status-error border border-status-error-text/30 rounded-lg p-4">
          <p className="text-status-error-text text-sm">{error}</p>
        </div>
      )}

      {saveMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 text-sm text-green-700">
          {saveMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-cream-300 rounded-lg p-1">
        {([['clubs', 'My Clubs'], ['distances', 'Enter Distances'], ['chart', 'Distance Chart']] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              activeTab === key ? 'bg-card text-charcoal shadow-sm' : 'text-muted hover:text-charcoal'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* My Clubs Tab */}
      {activeTab === 'clubs' && (
        <div className="space-y-3">
          {clubs.map((club, idx) => (
            <div key={club.id} className="card p-4 flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <button onClick={() => handleMoveClub(club.id, 'up')} disabled={idx === 0}
                  className="text-muted hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button onClick={() => handleMoveClub(club.id, 'down')} disabled={idx === clubs.length - 1}
                  className="text-muted hover:text-charcoal disabled:opacity-30 disabled:cursor-not-allowed">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              <div className="h-8 w-2 rounded-full" style={{ backgroundColor: CLUB_TYPE_COLORS[club.club_type] || '#6b7280' }} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-charcoal">{club.name}</p>
                <p className="text-xs text-muted">
                  {club.club_type}{club.brand ? ` - ${club.brand}` : ''}{club.model ? ` ${club.model}` : ''}
                </p>
              </div>
              {club.stats && (
                <div className="text-right">
                  <p className="font-bold text-charcoal">{club.stats.avg} yds</p>
                  <p className="text-xs text-muted">{club.stats.count} entries</p>
                </div>
              )}
              <button onClick={() => handleDeleteClub(club.id)}
                className="text-muted hover:text-score-triple transition-colors p-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}

          {clubs.length < 14 && (
            <div className="card p-4">
              <h3 className="text-sm font-medium text-charcoal mb-3">Add Club</h3>
              <div className="flex gap-2">
                <input
                  value={newClubName}
                  onChange={e => setNewClubName(e.target.value)}
                  placeholder="Club name"
                  className="input flex-1"
                />
                <select value={newClubType} onChange={e => setNewClubType(e.target.value)}
                  className="input w-28">
                  <option value="driver">Driver</option>
                  <option value="wood">Wood</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="iron">Iron</option>
                  <option value="wedge">Wedge</option>
                  <option value="putter">Putter</option>
                </select>
                <button onClick={handleAddClub} className="btn-primary">Add</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enter Distances Tab */}
      {activeTab === 'distances' && (
        <div className="space-y-6">
          {/* Quick Entry */}
          <div className="card p-4">
            <h3 className="text-sm font-medium text-charcoal mb-3">Quick Entry</h3>
            <div className="flex gap-2">
              <select value={selectedClubId || ''} onChange={e => setSelectedClubId(e.target.value || null)}
                className="input flex-1">
                <option value="">Select club...</option>
                {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <div className="relative w-24">
                <input
                  type="number"
                  value={distanceValue}
                  onChange={e => setDistanceValue(e.target.value)}
                  placeholder="Yards"
                  className="input pr-8"
                  onKeyDown={e => e.key === 'Enter' && handleQuickDistance()}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs">yds</span>
              </div>
              <button onClick={handleQuickDistance} disabled={!selectedClubId || !distanceValue}
                className="btn-primary disabled:opacity-50">Save</button>
            </div>
          </div>

          {/* Batch Entry */}
          <div className="card p-4">
            <h3 className="text-sm font-medium text-charcoal mb-3">Batch Entry</h3>
            <div className="space-y-2">
              {clubs.filter(c => c.club_type !== 'putter').map(club => (
                <div key={club.id} className="flex items-center gap-3">
                  <span className="text-sm text-charcoal w-32 truncate">{club.name}</span>
                  <span className="text-xs text-muted w-16 text-right">
                    {club.stats ? `avg ${club.stats.avg}` : '---'}
                  </span>
                  <input
                    type="number"
                    value={batchDistances[club.id] || ''}
                    onChange={e => setBatchDistances(prev => ({ ...prev, [club.id]: e.target.value }))}
                    placeholder="Yards"
                    className="input w-24 text-sm"
                  />
                </div>
              ))}
            </div>
            <button onClick={handleBatchSave}
              disabled={!Object.values(batchDistances).some(v => v)}
              className="btn-primary mt-4 disabled:opacity-50">
              Save All
            </button>
          </div>
        </div>
      )}

      {/* Distance Chart Tab */}
      {activeTab === 'chart' && (
        <div className="card p-6">
          <h3 className="text-sm font-medium text-charcoal mb-4">Average Distance by Club</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={chartData.length * 40 + 40}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 80, right: 20 }}>
                <XAxis type="number" domain={[0, 'auto']} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={75} />
                <Tooltip formatter={(value) => [`${value} yds`, 'Avg Distance']} />
                <Bar dataKey="avg" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={CLUB_TYPE_COLORS[entry.club_type] || '#6b7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted">No distance data yet</p>
              <p className="text-muted/70 text-sm mt-1">Enter distances for your clubs to see the chart</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
