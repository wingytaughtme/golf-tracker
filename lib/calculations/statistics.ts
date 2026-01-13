/**
 * Player Statistics Calculations
 *
 * Functions for calculating comprehensive player statistics from round data.
 */

import { prisma } from '@/lib/prisma';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PlayerOverallStats {
  totalRounds: number;
  completedRounds: number;
  averageGrossScore: number | null;
  bestRound: {
    grossScore: number;
    courseName: string;
    datePlayed: Date;
    roundId: string;
  } | null;
  worstRound: {
    grossScore: number;
    courseName: string;
    datePlayed: Date;
    roundId: string;
  } | null;
  currentHandicap: number | null;
  averageScoreVsPar: number | null;
  totalHolesPlayed: number;
}

export interface ScoringByPar {
  par: number;
  holesPlayed: number;
  totalStrokes: number;
  average: number;
  averageVsPar: number;
}

export interface ScoringDistribution {
  eagles: number;
  birdies: number;
  pars: number;
  bogeys: number;
  doubleBogeys: number;
  triplePlus: number;
  total: number;
  percentages: {
    eagles: number;
    birdies: number;
    pars: number;
    bogeys: number;
    doubleBogeys: number;
    triplePlus: number;
  };
}

export interface PlayerScoringStats {
  scoringByPar: ScoringByPar[];
  distribution: ScoringDistribution;
}

export interface PlayerDetailedStats {
  fairways: {
    hit: number;
    total: number;
    percentage: number | null;
  } | null;
  greensInRegulation: {
    hit: number;
    total: number;
    percentage: number | null;
  } | null;
  putting: {
    totalPutts: number;
    roundsWithPuttData: number;
    averagePuttsPerRound: number | null;
    averagePuttsPerHole: number | null;
  } | null;
  scrambling: {
    successful: number;
    attempts: number;
    percentage: number | null;
  } | null;
  penalties: {
    total: number;
    averagePerRound: number | null;
  };
  sandShots: {
    total: number;
    averagePerRound: number | null;
  };
}

export interface TrendDataPoint {
  date: Date;
  value: number;
  roundId: string;
  courseName: string;
}

export interface PlayerTrends {
  handicap: TrendDataPoint[];
  scoringAverage: TrendDataPoint[];
  scoreToPar: TrendDataPoint[];
}

export interface CourseStats {
  courseId: string;
  courseName: string;
  city: string;
  state: string;
  timesPlayed: number;
  bestScore: number | null;
  worstScore: number | null;
  averageScore: number | null;
  averageVsPar: number | null;
  lastPlayed: Date | null;
  rounds: Array<{
    roundId: string;
    datePlayed: Date;
    grossScore: number;
    teeSetName: string;
  }>;
}

export interface PlayerCourseStats {
  totalCourses: number;
  courseStats: CourseStats[];
}

// ============================================================================
// OVERALL STATS
// ============================================================================

/**
 * Get overall statistics for a player
 */
export async function getPlayerOverallStats(playerId: string): Promise<PlayerOverallStats> {
  // Get all round players for this player with completed rounds
  const roundPlayers = await prisma.roundPlayer.findMany({
    where: {
      player_id: playerId,
      round: {
        status: 'completed',
      },
      gross_score: {
        not: null,
      },
    },
    include: {
      round: {
        include: {
          course: true,
          tee_set: {
            include: {
              holes: true,
            },
          },
        },
      },
      scores: {
        where: {
          strokes: {
            not: null,
          },
        },
      },
    },
    orderBy: {
      round: {
        date_played: 'desc',
      },
    },
  });

  // Get total rounds (including in-progress)
  const totalRounds = await prisma.roundPlayer.count({
    where: {
      player_id: playerId,
    },
  });

  const completedRounds = roundPlayers.length;

  if (completedRounds === 0) {
    return {
      totalRounds,
      completedRounds: 0,
      averageGrossScore: null,
      bestRound: null,
      worstRound: null,
      currentHandicap: null,
      averageScoreVsPar: null,
      totalHolesPlayed: 0,
    };
  }

  // Calculate average gross score
  const grossScores = roundPlayers.map((rp) => rp.gross_score!);
  const averageGrossScore = Math.round(
    (grossScores.reduce((a, b) => a + b, 0) / grossScores.length) * 10
  ) / 10;

  // Find best and worst rounds
  let bestRound: PlayerOverallStats['bestRound'] = null;
  let worstRound: PlayerOverallStats['worstRound'] = null;
  let bestScore = Infinity;
  let worstScore = -Infinity;

  for (const rp of roundPlayers) {
    const score = rp.gross_score!;
    if (score < bestScore) {
      bestScore = score;
      bestRound = {
        grossScore: score,
        courseName: rp.round.course.name,
        datePlayed: rp.round.date_played,
        roundId: rp.round_id,
      };
    }
    if (score > worstScore) {
      worstScore = score;
      worstRound = {
        grossScore: score,
        courseName: rp.round.course.name,
        datePlayed: rp.round.date_played,
        roundId: rp.round_id,
      };
    }
  }

  // Calculate average score vs par
  let totalPar = 0;
  let totalGross = 0;
  let totalHolesPlayed = 0;

  for (const rp of roundPlayers) {
    const roundPar = rp.round.tee_set.holes.reduce((sum, h) => sum + h.par, 0);
    const holesWithScores = rp.scores.length;

    // Adjust par if not all holes played (9-hole rounds)
    const adjustedPar = holesWithScores < 18
      ? rp.scores.reduce((sum, s) => {
          const hole = rp.round.tee_set.holes.find((h) => h.id === s.hole_id);
          return sum + (hole?.par || 0);
        }, 0)
      : roundPar;

    totalPar += adjustedPar;
    totalGross += rp.gross_score!;
    totalHolesPlayed += holesWithScores;
  }

  const averageScoreVsPar = Math.round(
    ((totalGross - totalPar) / completedRounds) * 10
  ) / 10;

  // Get current handicap
  const latestHandicap = await prisma.handicapHistory.findFirst({
    where: {
      player_id: playerId,
    },
    orderBy: {
      effective_date: 'desc',
    },
  });

  const currentHandicap = latestHandicap
    ? Number(latestHandicap.handicap_index)
    : null;

  return {
    totalRounds,
    completedRounds,
    averageGrossScore,
    bestRound,
    worstRound,
    currentHandicap,
    averageScoreVsPar,
    totalHolesPlayed,
  };
}

// ============================================================================
// SCORING STATS
// ============================================================================

/**
 * Get scoring statistics for a player (by par type and distribution)
 */
export async function getPlayerScoringStats(playerId: string): Promise<PlayerScoringStats> {
  // Get all scores for completed rounds
  const scores = await prisma.score.findMany({
    where: {
      round_player: {
        player_id: playerId,
        round: {
          status: 'completed',
        },
      },
      strokes: {
        not: null,
      },
    },
    include: {
      hole: true,
    },
  });

  // Initialize scoring by par
  const parStats: Map<number, { holesPlayed: number; totalStrokes: number }> = new Map();

  // Initialize distribution
  const distribution: ScoringDistribution = {
    eagles: 0,
    birdies: 0,
    pars: 0,
    bogeys: 0,
    doubleBogeys: 0,
    triplePlus: 0,
    total: 0,
    percentages: {
      eagles: 0,
      birdies: 0,
      pars: 0,
      bogeys: 0,
      doubleBogeys: 0,
      triplePlus: 0,
    },
  };

  for (const score of scores) {
    const strokes = score.strokes!;
    const par = score.hole.par;
    const diff = strokes - par;

    // Update par stats
    if (!parStats.has(par)) {
      parStats.set(par, { holesPlayed: 0, totalStrokes: 0 });
    }
    const stats = parStats.get(par)!;
    stats.holesPlayed++;
    stats.totalStrokes += strokes;

    // Update distribution
    distribution.total++;
    if (diff <= -2) {
      distribution.eagles++;
    } else if (diff === -1) {
      distribution.birdies++;
    } else if (diff === 0) {
      distribution.pars++;
    } else if (diff === 1) {
      distribution.bogeys++;
    } else if (diff === 2) {
      distribution.doubleBogeys++;
    } else {
      distribution.triplePlus++;
    }
  }

  // Calculate percentages
  if (distribution.total > 0) {
    distribution.percentages = {
      eagles: Math.round((distribution.eagles / distribution.total) * 1000) / 10,
      birdies: Math.round((distribution.birdies / distribution.total) * 1000) / 10,
      pars: Math.round((distribution.pars / distribution.total) * 1000) / 10,
      bogeys: Math.round((distribution.bogeys / distribution.total) * 1000) / 10,
      doubleBogeys: Math.round((distribution.doubleBogeys / distribution.total) * 1000) / 10,
      triplePlus: Math.round((distribution.triplePlus / distribution.total) * 1000) / 10,
    };
  }

  // Build scoring by par array
  const scoringByPar: ScoringByPar[] = [];
  Array.from(parStats.entries()).forEach(([par, stats]) => {
    const average = Math.round((stats.totalStrokes / stats.holesPlayed) * 100) / 100;
    scoringByPar.push({
      par,
      holesPlayed: stats.holesPlayed,
      totalStrokes: stats.totalStrokes,
      average,
      averageVsPar: Math.round((average - par) * 100) / 100,
    });
  });

  // Sort by par
  scoringByPar.sort((a, b) => a.par - b.par);

  return {
    scoringByPar,
    distribution,
  };
}

// ============================================================================
// DETAILED STATS
// ============================================================================

/**
 * Get detailed statistics for a player (fairways, GIR, putting, scrambling)
 */
export async function getPlayerDetailedStats(playerId: string): Promise<PlayerDetailedStats> {
  // Get all scores with detailed tracking for completed rounds
  const scores = await prisma.score.findMany({
    where: {
      round_player: {
        player_id: playerId,
        round: {
          status: 'completed',
        },
      },
      strokes: {
        not: null,
      },
    },
    include: {
      hole: true,
      round_player: {
        include: {
          round: true,
        },
      },
    },
  });

  // Get unique round IDs for averaging
  const roundIds = new Set(scores.map((s) => s.round_player.round_id));
  const completedRounds = roundIds.size;

  // Fairways (exclude par 3s)
  const fairwayScores = scores.filter(
    (s) => s.hole.par > 3 && s.fairway_hit !== null
  );
  const fairwaysHit = fairwayScores.filter((s) => s.fairway_hit === true).length;
  const fairwaysTracked = fairwayScores.length;

  // Greens in regulation
  const girScores = scores.filter((s) => s.green_in_regulation !== null);
  const girsHit = girScores.filter((s) => s.green_in_regulation === true).length;
  const girsTracked = girScores.length;

  // Putting
  const puttScores = scores.filter((s) => s.putts !== null);
  const totalPutts = puttScores.reduce((sum, s) => sum + (s.putts || 0), 0);
  const roundsWithPuttData = new Set(
    puttScores.map((s) => s.round_player.round_id)
  ).size;
  const holesWithPuttData = puttScores.length;

  // Scrambling (made par or better when missing GIR)
  const missedGirScores = scores.filter(
    (s) => s.green_in_regulation === false && s.strokes !== null
  );
  const scrambleAttempts = missedGirScores.length;
  const scrambleSuccesses = missedGirScores.filter(
    (s) => (s.strokes || 0) <= s.hole.par
  ).length;

  // Penalties
  const totalPenalties = scores.reduce((sum, s) => sum + s.penalties, 0);

  // Sand shots
  const totalSandShots = scores.reduce((sum, s) => sum + s.sand_shots, 0);

  return {
    fairways: fairwaysTracked > 0
      ? {
          hit: fairwaysHit,
          total: fairwaysTracked,
          percentage: Math.round((fairwaysHit / fairwaysTracked) * 1000) / 10,
        }
      : null,
    greensInRegulation: girsTracked > 0
      ? {
          hit: girsHit,
          total: girsTracked,
          percentage: Math.round((girsHit / girsTracked) * 1000) / 10,
        }
      : null,
    putting: holesWithPuttData > 0
      ? {
          totalPutts,
          roundsWithPuttData,
          averagePuttsPerRound: roundsWithPuttData > 0
            ? Math.round((totalPutts / roundsWithPuttData) * 10) / 10
            : null,
          averagePuttsPerHole: Math.round((totalPutts / holesWithPuttData) * 100) / 100,
        }
      : null,
    scrambling: scrambleAttempts > 0
      ? {
          successful: scrambleSuccesses,
          attempts: scrambleAttempts,
          percentage: Math.round((scrambleSuccesses / scrambleAttempts) * 1000) / 10,
        }
      : null,
    penalties: {
      total: totalPenalties,
      averagePerRound: completedRounds > 0
        ? Math.round((totalPenalties / completedRounds) * 10) / 10
        : null,
    },
    sandShots: {
      total: totalSandShots,
      averagePerRound: completedRounds > 0
        ? Math.round((totalSandShots / completedRounds) * 10) / 10
        : null,
    },
  };
}

// ============================================================================
// TRENDS
// ============================================================================

/**
 * Get trend data for a player over their last N rounds
 */
export async function getPlayerTrends(
  playerId: string,
  limit: number = 20
): Promise<PlayerTrends> {
  // Get recent completed rounds with scores
  const roundPlayers = await prisma.roundPlayer.findMany({
    where: {
      player_id: playerId,
      round: {
        status: 'completed',
      },
      gross_score: {
        not: null,
      },
    },
    include: {
      round: {
        include: {
          course: true,
          tee_set: {
            include: {
              holes: true,
            },
          },
        },
      },
      scores: {
        where: {
          strokes: {
            not: null,
          },
        },
        include: {
          hole: true,
        },
      },
    },
    orderBy: {
      round: {
        date_played: 'desc',
      },
    },
    take: limit,
  });

  // Get handicap history for these rounds
  const handicapHistory = await prisma.handicapHistory.findMany({
    where: {
      player_id: playerId,
      calculation_details: {
        path: ['source'],
        equals: 'round',
      },
    },
    orderBy: {
      effective_date: 'desc',
    },
    take: limit,
  });

  // Build handicap trend data - use round date_played, not effective_date
  const handicapTrend: TrendDataPoint[] = [];
  for (const history of handicapHistory) {
    const details = history.calculation_details as {
      round_id?: string;
      handicap_index?: number;
    } | null;

    if (details?.round_id) {
      const rp = roundPlayers.find((r) => r.round_id === details.round_id);
      if (rp) {
        handicapTrend.push({
          // Use the round's date_played, not the handicap history effective_date
          date: rp.round.date_played,
          value: Number(history.handicap_index),
          roundId: details.round_id,
          courseName: rp.round.course.name,
        });
      }
    }
  }

  // Build scoring average and score to par trend data
  const scoringTrend: TrendDataPoint[] = [];
  const scoreToParTrend: TrendDataPoint[] = [];

  for (const rp of roundPlayers) {
    const grossScore = rp.gross_score!;

    // Calculate par for holes played
    const holesPlayedIds = new Set(rp.scores.map((s) => s.hole_id));
    const parForHolesPlayed = rp.round.tee_set.holes
      .filter((h) => holesPlayedIds.has(h.id))
      .reduce((sum, h) => sum + h.par, 0);

    scoringTrend.push({
      date: rp.round.date_played,
      value: grossScore,
      roundId: rp.round_id,
      courseName: rp.round.course.name,
    });

    scoreToParTrend.push({
      date: rp.round.date_played,
      value: grossScore - parForHolesPlayed,
      roundId: rp.round_id,
      courseName: rp.round.course.name,
    });
  }

  // Sort all trends by date in chronological order for charts
  // (Can't rely on DB order since we're using date_played, not effective_date)
  const sortByDate = (a: TrendDataPoint, b: TrendDataPoint) =>
    new Date(a.date).getTime() - new Date(b.date).getTime();

  return {
    handicap: handicapTrend.sort(sortByDate),
    scoringAverage: scoringTrend.sort(sortByDate),
    scoreToPar: scoreToParTrend.sort(sortByDate),
  };
}

// ============================================================================
// COURSE STATS
// ============================================================================

/**
 * Get course-specific statistics for a player
 */
export async function getPlayerCourseStats(
  playerId: string,
  courseId?: string
): Promise<PlayerCourseStats> {
  // Build where clause
  const whereClause: {
    player_id: string;
    round: {
      status: 'completed';
      course_id?: string;
    };
    gross_score: { not: null };
  } = {
    player_id: playerId,
    round: {
      status: 'completed',
    },
    gross_score: {
      not: null,
    },
  };

  if (courseId) {
    whereClause.round.course_id = courseId;
  }

  // Get round players with course data
  const roundPlayers = await prisma.roundPlayer.findMany({
    where: whereClause,
    include: {
      round: {
        include: {
          course: true,
          tee_set: {
            include: {
              holes: true,
            },
          },
        },
      },
      scores: {
        where: {
          strokes: {
            not: null,
          },
        },
        include: {
          hole: true,
        },
      },
    },
    orderBy: {
      round: {
        date_played: 'desc',
      },
    },
  });

  // Group by course
  const courseMap = new Map<string, {
    course: { id: string; name: string; city: string; state: string };
    rounds: Array<{
      roundId: string;
      datePlayed: Date;
      grossScore: number;
      teeSetName: string;
      par: number;
    }>;
  }>();

  for (const rp of roundPlayers) {
    const course = rp.round.course;

    if (!courseMap.has(course.id)) {
      courseMap.set(course.id, {
        course: {
          id: course.id,
          name: course.name,
          city: course.city,
          state: course.state,
        },
        rounds: [],
      });
    }

    // Calculate par for holes played
    const holesPlayedIds = new Set(rp.scores.map((s) => s.hole_id));
    const parForHolesPlayed = rp.round.tee_set.holes
      .filter((h) => holesPlayedIds.has(h.id))
      .reduce((sum, h) => sum + h.par, 0);

    courseMap.get(course.id)!.rounds.push({
      roundId: rp.round_id,
      datePlayed: rp.round.date_played,
      grossScore: rp.gross_score!,
      teeSetName: rp.round.tee_set.name,
      par: parForHolesPlayed,
    });
  }

  // Build course stats array
  const courseStats: CourseStats[] = [];

  Array.from(courseMap.values()).forEach((data) => {
    const scores = data.rounds.map((r) => r.grossScore);
    const pars = data.rounds.map((r) => r.par);
    const totalScore = scores.reduce((a: number, b: number) => a + b, 0);
    const totalPar = pars.reduce((a: number, b: number) => a + b, 0);

    courseStats.push({
      courseId: data.course.id,
      courseName: data.course.name,
      city: data.course.city,
      state: data.course.state,
      timesPlayed: data.rounds.length,
      bestScore: Math.min(...scores),
      worstScore: Math.max(...scores),
      averageScore: Math.round((totalScore / scores.length) * 10) / 10,
      averageVsPar: Math.round(((totalScore - totalPar) / data.rounds.length) * 10) / 10,
      lastPlayed: data.rounds[0]?.datePlayed || null,
      rounds: data.rounds.map((r) => ({
        roundId: r.roundId,
        datePlayed: r.datePlayed,
        grossScore: r.grossScore,
        teeSetName: r.teeSetName,
      })),
    });
  });

  // Sort by times played (most played first)
  courseStats.sort((a, b) => b.timesPlayed - a.timesPlayed);

  return {
    totalCourses: courseStats.length,
    courseStats,
  };
}

// ============================================================================
// COMBINED STATS (for API)
// ============================================================================

export interface AllPlayerStats {
  overall: PlayerOverallStats;
  scoring: PlayerScoringStats;
  detailed: PlayerDetailedStats;
  trends: PlayerTrends;
  courses: PlayerCourseStats;
}

/**
 * Get all statistics for a player in one call
 */
export async function getAllPlayerStats(
  playerId: string,
  options: {
    trendLimit?: number;
    courseId?: string;
  } = {}
): Promise<AllPlayerStats> {
  const [overall, scoring, detailed, trends, courses] = await Promise.all([
    getPlayerOverallStats(playerId),
    getPlayerScoringStats(playerId),
    getPlayerDetailedStats(playerId),
    getPlayerTrends(playerId, options.trendLimit || 20),
    getPlayerCourseStats(playerId, options.courseId),
  ]);

  return {
    overall,
    scoring,
    detailed,
    trends,
    courses,
  };
}
