/**
 * Script to recalculate handicaps for all completed rounds
 *
 * Run with: npx tsx scripts/recalculate-handicaps.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Handicap calculation functions (copied from lib to avoid import issues)
function calculateScoreDifferential(
  grossScore: number,
  courseRating: number,
  slopeRating: number
): number {
  const differential = (113 / slopeRating) * (grossScore - courseRating);
  return Math.round(differential * 10) / 10;
}

function calculateCourseHandicap(handicapIndex: number, slopeRating: number): number {
  return Math.round(handicapIndex * (slopeRating / 113));
}

function getESCMaxPerHole(courseHandicap: number): number {
  if (courseHandicap <= 9) return 0; // Double bogey calculated per hole
  if (courseHandicap <= 19) return 7;
  if (courseHandicap <= 29) return 8;
  if (courseHandicap <= 39) return 9;
  return 10;
}

function applyEquitableStrokeControl(
  holeScores: Array<{ strokes: number; par: number }>,
  courseHandicap: number | null
): number {
  const effectiveHandicap = courseHandicap ?? 54; // Use max handicap if unknown, not 0!
  const escMax = getESCMaxPerHole(effectiveHandicap);

  let adjustedTotal = 0;
  for (const hole of holeScores) {
    let maxScore: number;
    if (effectiveHandicap <= 9) {
      maxScore = hole.par + 2;
    } else {
      maxScore = escMax;
    }
    adjustedTotal += Math.min(hole.strokes, maxScore);
  }
  return adjustedTotal;
}

function calculateHandicapIndex(differentials: number[]): number | null {
  const count = differentials.length;
  if (count < 3) return null;

  const sorted = [...differentials].sort((a, b) => a - b);
  let usedDifferentials: number[];
  let adjustment = 0;

  if (count === 3) {
    usedDifferentials = sorted.slice(0, 1);
    adjustment = -2.0;
  } else if (count === 4) {
    usedDifferentials = sorted.slice(0, 1);
    adjustment = -1.0;
  } else if (count === 5) {
    usedDifferentials = sorted.slice(0, 1);
  } else if (count === 6) {
    usedDifferentials = sorted.slice(0, 2);
    adjustment = -1.0;
  } else if (count <= 8) {
    usedDifferentials = sorted.slice(0, 2);
  } else if (count <= 11) {
    usedDifferentials = sorted.slice(0, 3);
  } else if (count <= 14) {
    usedDifferentials = sorted.slice(0, 4);
  } else if (count <= 16) {
    usedDifferentials = sorted.slice(0, 5);
  } else if (count <= 18) {
    usedDifferentials = sorted.slice(0, 6);
  } else if (count === 19) {
    usedDifferentials = sorted.slice(0, 7);
  } else {
    usedDifferentials = sorted.slice(0, 8);
  }

  const average = usedDifferentials.reduce((a, b) => a + b, 0) / usedDifferentials.length;
  let handicapIndex = Math.round((average + adjustment) * 10) / 10;
  return Math.min(handicapIndex, 54.0);
}

async function recalculateAllHandicaps() {
  console.log('Starting handicap recalculation...\n');

  // Get all completed rounds ordered by date
  const rounds = await prisma.round.findMany({
    where: { status: 'completed' },
    include: {
      tee_set: {
        include: { holes: true },
      },
      round_players: {
        include: {
          player: true,
          scores: {
            include: { hole: true },
          },
        },
      },
    },
    orderBy: { date_played: 'asc' },
  });

  console.log(`Found ${rounds.length} completed rounds to process\n`);

  // Default starting handicap for all players
  const DEFAULT_STARTING_HANDICAP = 20;

  // Track differentials per player (in chronological order)
  const playerDifferentials: Map<string, { date: Date; differential: number; roundId: string }[]> = new Map();

  // Track starting handicap per player (default 20, or from manual entry)
  const playerStartingHandicap: Map<string, number> = new Map();

  // Delete all existing round-based handicap history (we'll recreate them)
  const deleted = await prisma.handicapHistory.deleteMany({
    where: {
      calculation_details: {
        path: ['source'],
        equals: 'round',
      },
    },
  });
  console.log(`Deleted ${deleted.count} old handicap history entries`);

  // Get any manual handicap entries (these serve as starting points)
  const manualEntries = await prisma.handicapHistory.findMany({
    where: {
      OR: [
        { calculation_details: { path: ['source'], equals: 'manual' } },
        { calculation_details: { equals: null } },
      ],
    },
    orderBy: { effective_date: 'asc' },
  });

  for (const entry of manualEntries) {
    playerStartingHandicap.set(entry.player_id, Number(entry.handicap_index));
  }
  console.log(`Found ${manualEntries.length} manual handicap entries as starting points`);
  console.log(`Using default starting handicap of ${DEFAULT_STARTING_HANDICAP} for players without manual entries\n`);

  // Process each round
  for (const round of rounds) {
    const courseRating = Number(round.tee_set.course_rating);
    const slopeRating = round.tee_set.slope_rating;

    console.log(`Processing round ${round.id} - ${round.date_played.toISOString().split('T')[0]}`);

    for (const roundPlayer of round.round_players) {
      // Get player's handicap at time of round (from differentials so far)
      const existingDiffs = playerDifferentials.get(roundPlayer.player_id) || [];
      const priorDifferentials = existingDiffs
        .filter(d => d.date < round.date_played)
        .map(d => d.differential);

      // Use calculated handicap from prior rounds, or starting handicap, or default
      let priorHandicap = calculateHandicapIndex(priorDifferentials);
      if (priorHandicap === null) {
        // Not enough rounds yet - use starting handicap or default
        priorHandicap = playerStartingHandicap.get(roundPlayer.player_id) ?? DEFAULT_STARTING_HANDICAP;
      }
      const courseHandicap = calculateCourseHandicap(priorHandicap, slopeRating);

      // Calculate scores
      const holeScores = roundPlayer.scores
        .filter(s => s.strokes !== null)
        .map(s => ({
          strokes: s.strokes!,
          par: s.hole.par,
        }));

      if (holeScores.length === 0) {
        console.log(`  - ${roundPlayer.player.name}: No scores recorded, skipping`);
        continue;
      }

      const rawGrossScore = holeScores.reduce((sum, h) => sum + h.strokes, 0);
      const adjustedGrossScore = applyEquitableStrokeControl(holeScores, courseHandicap);
      const scoreDifferential = calculateScoreDifferential(adjustedGrossScore, courseRating, slopeRating);

      // Update round_player gross score
      await prisma.roundPlayer.update({
        where: { id: roundPlayer.id },
        data: { gross_score: rawGrossScore },
      });

      // Add to player's differentials
      if (!playerDifferentials.has(roundPlayer.player_id)) {
        playerDifferentials.set(roundPlayer.player_id, []);
      }
      playerDifferentials.get(roundPlayer.player_id)!.push({
        date: round.date_played,
        differential: scoreDifferential,
        roundId: round.id,
      });

      // Calculate new handicap index with all differentials up to this round
      const allDiffs = playerDifferentials.get(roundPlayer.player_id)!
        .filter(d => d.date <= round.date_played)
        .map(d => d.differential);
      const newHandicapIndex = calculateHandicapIndex(allDiffs);

      // Create handicap history entry
      await prisma.handicapHistory.create({
        data: {
          player_id: roundPlayer.player_id,
          handicap_index: newHandicapIndex ?? scoreDifferential,
          effective_date: round.date_played,
          calculation_details: {
            source: 'round',
            round_id: round.id,
            gross_score: rawGrossScore,
            adjusted_gross_score: adjustedGrossScore,
            course_rating: courseRating,
            slope_rating: slopeRating,
            differential: scoreDifferential,
            course_handicap_used: courseHandicap,
            differentials_used: allDiffs.length,
            handicap_index: newHandicapIndex,
          },
        },
      });

      console.log(`  - ${roundPlayer.player.name}: raw=${rawGrossScore}, adj=${adjustedGrossScore}, diff=${scoreDifferential}, hcp=${newHandicapIndex?.toFixed(1) ?? 'N/A'}`);
    }
  }

  // Print final handicaps
  console.log('\n=== Final Handicaps ===\n');
  for (const [playerId, diffs] of playerDifferentials) {
    const player = await prisma.player.findUnique({ where: { id: playerId } });
    const allDifferentials = diffs.map(d => d.differential);
    const finalHandicap = calculateHandicapIndex(allDifferentials);
    console.log(`${player?.name}: ${finalHandicap?.toFixed(1) ?? 'N/A'} (${diffs.length} rounds)`);
  }

  console.log('\nRecalculation complete!');
}

recalculateAllHandicaps()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
