'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface HoleScore {
  holeNumber: number;
  strokes: number;
  par: number;
  diff: number;
}

interface PlayerResult {
  playerId: string;
  playerName: string;
  grossScore: number;
  netScore: number | null;
  scoreToPar: number;
  handicapDifferential: number;
  playingHandicap: number | null;
  frontNine: {
    score: number;
    par: number;
    toPar: number;
  };
  backNine: {
    score: number;
    par: number;
    toPar: number;
  };
  stats: {
    birdiesOrBetter: number;
    pars: number;
    bogeys: number;
    doublePlus: number;
  };
  bestHoles: HoleScore[];
  worstHoles: HoleScore[];
}

interface RoundSummary {
  round: {
    id: string;
    status: string;
    completed_at: string;
    course: {
      name: string;
      city: string;
      state: string;
    };
    teeSet: {
      name: string;
      courseRating: number;
      slopeRating: number;
    };
    totalPar: number;
    datePlayed: string;
  };
  players: PlayerResult[];
}

export default function RoundSummaryPage() {
  const params = useParams();
  const id = params.id as string;
  const [summary, setSummary] = useState<RoundSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSummary() {
      try {
        // First check if round is completed
        const roundResponse = await fetch(`/api/rounds/${id}`);
        if (!roundResponse.ok) {
          throw new Error('Round not found');
        }
        const roundData = await roundResponse.json();

        if (roundData.status !== 'completed') {
          // Redirect to round page if not completed
          window.location.href = `/rounds/${id}`;
          return;
        }

        // Build summary from round data
        const holes = roundData.holes || roundData.tee_set?.holes || [];
        const totalPar = holes.reduce((sum: number, h: { par: number }) => sum + h.par, 0);

        const players: PlayerResult[] = roundData.round_players.map((rp: {
          player_id: string;
          player: { id: string; name: string };
          gross_score: number | null;
          net_score: number | null;
          playing_handicap: number | null;
          scores: Array<{
            strokes: number | null;
            hole: { hole_number: number; par: number };
          }>;
        }) => {
          const grossScore = rp.gross_score || 0;
          const scoreToPar = grossScore - totalPar;

          // Calculate front/back nine
          const frontScores = rp.scores.filter((s) => s.hole.hole_number <= 9);
          const backScores = rp.scores.filter((s) => s.hole.hole_number > 9);

          const frontNineScore = frontScores.reduce((sum, s) => sum + (s.strokes || 0), 0);
          const backNineScore = backScores.reduce((sum, s) => sum + (s.strokes || 0), 0);

          const frontNinePar = holes.filter((h: { hole_number: number }) => h.hole_number <= 9)
            .reduce((sum: number, h: { par: number }) => sum + h.par, 0);
          const backNinePar = holes.filter((h: { hole_number: number }) => h.hole_number > 9)
            .reduce((sum: number, h: { par: number }) => sum + h.par, 0);

          // Calculate hole-by-hole stats
          const holesWithDiff = rp.scores.map((s) => ({
            holeNumber: s.hole.hole_number,
            strokes: s.strokes || 0,
            par: s.hole.par,
            diff: (s.strokes || 0) - s.hole.par,
          }));

          const sortedByDiff = [...holesWithDiff].sort((a, b) => a.diff - b.diff);
          const bestHoles = sortedByDiff.slice(0, 3);
          const worstHoles = sortedByDiff.slice(-3).reverse();

          // Stats
          const birdiesOrBetter = holesWithDiff.filter((h) => h.diff <= -1).length;
          const pars = holesWithDiff.filter((h) => h.diff === 0).length;
          const bogeys = holesWithDiff.filter((h) => h.diff === 1).length;
          const doublePlus = holesWithDiff.filter((h) => h.diff >= 2).length;

          // Handicap differential
          const courseRating = Number(roundData.tee_set.course_rating);
          const slopeRating = roundData.tee_set.slope_rating;
          const handicapDifferential = Math.round(((grossScore - courseRating) * 113 / slopeRating) * 10) / 10;

          return {
            playerId: rp.player_id || rp.player.id,
            playerName: rp.player.name,
            grossScore,
            netScore: rp.net_score,
            scoreToPar,
            handicapDifferential,
            playingHandicap: rp.playing_handicap,
            frontNine: {
              score: frontNineScore,
              par: frontNinePar,
              toPar: frontNineScore - frontNinePar,
            },
            backNine: {
              score: backNineScore,
              par: backNinePar,
              toPar: backNineScore - backNinePar,
            },
            stats: {
              birdiesOrBetter,
              pars,
              bogeys,
              doublePlus,
            },
            bestHoles,
            worstHoles,
          };
        });

        setSummary({
          round: {
            id: roundData.id,
            status: roundData.status,
            completed_at: roundData.completed_at,
            course: roundData.course,
            teeSet: {
              name: roundData.tee_set.name,
              courseRating: Number(roundData.tee_set.course_rating),
              slopeRating: roundData.tee_set.slope_rating,
            },
            totalPar,
            datePlayed: roundData.date_played,
          },
          players,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load summary');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSummary();
  }, [id]);

  const formatScoreToPar = (score: number) => {
    if (score === 0) return 'E';
    return score > 0 ? `+${score}` : score.toString();
  };

  const getScoreColor = (score: number) => {
    if (score < 0) return 'text-green-600';
    if (score > 0) return 'text-red-600';
    return 'text-gray-900';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-64 mb-2" />
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
          <div className="h-64 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="space-y-6">
        <Link
          href="/rounds"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Rounds
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700">{error || 'Summary not available'}</p>
        </div>
      </div>
    );
  }

  // Sort players by gross score
  const sortedPlayers = [...summary.players].sort((a, b) => a.grossScore - b.grossScore);
  const winner = sortedPlayers[0];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-display font-bold text-golf-text">Round Complete!</h1>
        <p className="text-gray-600 mt-1">{summary.round.course.name}</p>
        <p className="text-sm text-gray-500">
          {summary.round.course.city}, {summary.round.course.state}
        </p>
        <p className="text-sm text-gray-500 mt-1">{formatDate(summary.round.datePlayed)}</p>
      </div>

      {/* Winner Banner (if multiple players) */}
      {summary.players.length > 1 && (
        <div className="bg-gradient-to-r from-amber-400 to-amber-500 rounded-xl p-6 text-center shadow-lg">
          <p className="text-amber-900 text-sm font-medium uppercase tracking-wide">Winner</p>
          <p className="text-2xl font-bold text-white mt-1">{winner.playerName}</p>
          <p className="text-amber-100 text-lg mt-1">
            {winner.grossScore} ({formatScoreToPar(winner.scoreToPar)})
          </p>
        </div>
      )}

      {/* Player Results */}
      <div className="space-y-4">
        {sortedPlayers.map((player, index) => (
          <div
            key={player.playerId}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
          >
            {/* Player Header */}
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {summary.players.length > 1 && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-amber-400 text-amber-900' :
                      index === 1 ? 'bg-gray-300 text-gray-700' :
                      index === 2 ? 'bg-amber-700 text-amber-100' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                  )}
                  <div>
                    <Link
                      href={`/players/${player.playerId}`}
                      className="font-semibold text-golf-text hover:text-primary"
                    >
                      {player.playerName}
                    </Link>
                    {player.playingHandicap !== null && (
                      <p className="text-xs text-gray-500">
                        Playing Handicap: {Number(player.playingHandicap).toFixed(1)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-golf-text">{player.grossScore}</p>
                  <p className={`text-lg font-semibold ${getScoreColor(player.scoreToPar)}`}>
                    {formatScoreToPar(player.scoreToPar)}
                  </p>
                </div>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {/* Front 9 */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase">Front 9</p>
                  <p className="text-xl font-bold">{player.frontNine.score}</p>
                  <p className={`text-sm ${getScoreColor(player.frontNine.toPar)}`}>
                    {formatScoreToPar(player.frontNine.toPar)}
                  </p>
                </div>

                {/* Back 9 */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase">Back 9</p>
                  <p className="text-xl font-bold">{player.backNine.score}</p>
                  <p className={`text-sm ${getScoreColor(player.backNine.toPar)}`}>
                    {formatScoreToPar(player.backNine.toPar)}
                  </p>
                </div>

                {/* Net Score */}
                {player.netScore !== null && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 uppercase">Net Score</p>
                    <p className="text-xl font-bold">{player.netScore}</p>
                  </div>
                )}

                {/* Handicap Diff */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase">HCP Diff</p>
                  <p className="text-xl font-bold">{player.handicapDifferential.toFixed(1)}</p>
                </div>
              </div>

              {/* Scoring Stats */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Scoring Distribution</h4>
                <div className="flex gap-2">
                  {player.stats.birdiesOrBetter > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 rounded-full">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm font-medium text-green-700">
                        {player.stats.birdiesOrBetter} Birdie{player.stats.birdiesOrBetter !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {player.stats.pars > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-full">
                      <div className="w-3 h-3 rounded-full bg-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {player.stats.pars} Par{player.stats.pars !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {player.stats.bogeys > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-full">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <span className="text-sm font-medium text-red-700">
                        {player.stats.bogeys} Bogey{player.stats.bogeys !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                  {player.stats.doublePlus > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 rounded-full">
                      <div className="w-3 h-3 rounded-full bg-red-600" />
                      <span className="text-sm font-medium text-red-800">
                        {player.stats.doublePlus} Double+
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Best & Worst Holes */}
              <div className="grid grid-cols-2 gap-4">
                {/* Best Holes */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Best Holes</h4>
                  <div className="space-y-1">
                    {player.bestHoles.map((hole) => (
                      <div key={hole.holeNumber} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Hole {hole.holeNumber}</span>
                        <span className={`font-medium ${getScoreColor(hole.diff)}`}>
                          {hole.strokes} ({hole.diff <= 0 ? hole.diff : `+${hole.diff}`})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Worst Holes */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Toughest Holes</h4>
                  <div className="space-y-1">
                    {player.worstHoles.map((hole) => (
                      <div key={hole.holeNumber} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Hole {hole.holeNumber}</span>
                        <span className={`font-medium ${getScoreColor(hole.diff)}`}>
                          {hole.strokes} ({hole.diff <= 0 ? hole.diff : `+${hole.diff}`})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Course Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Course Details</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Tees</p>
            <p className="font-medium">{summary.round.teeSet.name}</p>
          </div>
          <div>
            <p className="text-gray-500">Course Rating</p>
            <p className="font-medium">{summary.round.teeSet.courseRating.toFixed(1)}</p>
          </div>
          <div>
            <p className="text-gray-500">Slope</p>
            <p className="font-medium">{summary.round.teeSet.slopeRating}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href={`/rounds/${id}`}
          className="flex-1 px-6 py-3 text-center text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          View Scorecard
        </Link>
        <Link
          href="/dashboard"
          className="flex-1 px-6 py-3 text-center text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-600 transition-colors"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
