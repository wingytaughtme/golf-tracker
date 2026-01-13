/**
 * World Handicap System (WHS) Calculations
 *
 * Implementation of the official WHS formulas for calculating
 * handicap differentials, indices, and playing handicaps.
 */

/**
 * Calculate Score Differential
 *
 * The Score Differential measures the performance of a round in relation
 * to the relative difficulty of the course played.
 *
 * Formula: (113 / Slope Rating) × (Adjusted Gross Score - Course Rating)
 *
 * @param grossScore - The adjusted gross score for the round
 * @param courseRating - The Course Rating (difficulty for scratch golfer)
 * @param slopeRating - The Slope Rating (relative difficulty for bogey vs scratch)
 * @returns Score differential rounded to 1 decimal place
 */
export function calculateScoreDifferential(
  grossScore: number,
  courseRating: number,
  slopeRating: number
): number {
  const differential = (113 / slopeRating) * (grossScore - courseRating);
  return Math.round(differential * 10) / 10;
}

/**
 * Calculate Score Differential for 9-hole rounds
 *
 * For 9-hole rounds, use half the 18-hole Course Rating and the 9-hole Slope Rating.
 * The differential is then doubled to create an 18-hole equivalent.
 *
 * @param nineHoleScore - The adjusted gross score for 9 holes
 * @param eighteenHoleCourseRating - The 18-hole Course Rating
 * @param eighteenHoleSlopeRating - The 18-hole Slope Rating
 * @returns Score differential rounded to 1 decimal place (18-hole equivalent)
 */
export function calculateNineHoleDifferential(
  nineHoleScore: number,
  eighteenHoleCourseRating: number,
  eighteenHoleSlopeRating: number
): number {
  // Use half the course rating for 9 holes
  const nineHoleCourseRating = eighteenHoleCourseRating / 2;
  // Calculate 9-hole differential
  const nineHoleDifferential = (113 / eighteenHoleSlopeRating) * (nineHoleScore - nineHoleCourseRating);
  // Double it to get 18-hole equivalent
  return Math.round(nineHoleDifferential * 2 * 10) / 10;
}

/**
 * Get Equitable Stroke Control (ESC) maximum score per hole
 *
 * ESC limits the maximum score a player can post on any hole based on
 * their Course Handicap. This prevents one bad hole from overly
 * affecting the handicap calculation.
 *
 * @param courseHandicap - The player's Course Handicap
 * @returns Maximum strokes allowed per hole
 */
export function getESCMaxPerHole(courseHandicap: number): number {
  if (courseHandicap <= 9) {
    return 0; // Double bogey is the max (par + 2), calculated per hole
  } else if (courseHandicap <= 19) {
    return 7;
  } else if (courseHandicap <= 29) {
    return 8;
  } else if (courseHandicap <= 39) {
    return 9;
  } else {
    return 10;
  }
}

/**
 * Apply Equitable Stroke Control to a round
 *
 * Adjusts the gross score by capping each hole's score according to
 * ESC rules based on the player's Course Handicap.
 *
 * For handicaps 9 or less: max is double bogey (par + 2) per hole
 * For handicaps 10-19: max is 7 per hole
 * For handicaps 20-29: max is 8 per hole
 * For handicaps 30-39: max is 9 per hole
 * For handicaps 40+: max is 10 per hole
 *
 * @param holeScores - Array of { strokes, par } for each hole
 * @param courseHandicap - The player's Course Handicap (can be null for new players)
 * @returns Adjusted gross score after applying ESC
 */
export function applyEquitableStrokeControl(
  holeScores: Array<{ strokes: number; par: number }>,
  courseHandicap: number | null
): number {
  // For players without a handicap, use max of double bogey (same as 9 or less)
  const effectiveHandicap = courseHandicap ?? 0;
  const escMax = getESCMaxPerHole(effectiveHandicap);

  let adjustedTotal = 0;

  for (const hole of holeScores) {
    let maxScore: number;

    if (effectiveHandicap <= 9) {
      // Double bogey maximum
      maxScore = hole.par + 2;
    } else {
      // Fixed maximum based on handicap range
      maxScore = escMax;
    }

    // Apply the lower of actual strokes or ESC max
    adjustedTotal += Math.min(hole.strokes, maxScore);
  }

  return adjustedTotal;
}

/**
 * Calculate Handicap Index from score differentials
 *
 * The Handicap Index is calculated using a specific number of the lowest
 * differentials from the player's scoring record, with adjustments applied
 * based on the number of rounds available.
 *
 * @param differentials - Array of score differentials (most recent 20 max)
 * @returns Handicap Index rounded to 1 decimal, or null if insufficient data
 */
export function calculateHandicapIndex(differentials: number[]): number | null {
  const count = differentials.length;

  // Need at least 3 rounds to calculate a handicap
  if (count < 3) {
    return null;
  }

  // Sort differentials ascending (lowest first)
  const sorted = [...differentials].sort((a, b) => a - b);

  let usedDifferentials: number[];
  let adjustment = 0;

  if (count === 3) {
    // Use lowest, subtract 2.0
    usedDifferentials = sorted.slice(0, 1);
    adjustment = -2.0;
  } else if (count === 4) {
    // Use lowest, subtract 1.0
    usedDifferentials = sorted.slice(0, 1);
    adjustment = -1.0;
  } else if (count === 5) {
    // Use lowest, no adjustment
    usedDifferentials = sorted.slice(0, 1);
    adjustment = 0;
  } else if (count === 6) {
    // Average of 2 lowest, subtract 1.0
    usedDifferentials = sorted.slice(0, 2);
    adjustment = -1.0;
  } else if (count >= 7 && count <= 8) {
    // Average of 2 lowest, no adjustment
    usedDifferentials = sorted.slice(0, 2);
    adjustment = 0;
  } else if (count >= 9 && count <= 11) {
    // Average of 3 lowest
    usedDifferentials = sorted.slice(0, 3);
    adjustment = 0;
  } else if (count >= 12 && count <= 14) {
    // Average of 4 lowest
    usedDifferentials = sorted.slice(0, 4);
    adjustment = 0;
  } else if (count >= 15 && count <= 16) {
    // Average of 5 lowest
    usedDifferentials = sorted.slice(0, 5);
    adjustment = 0;
  } else if (count >= 17 && count <= 18) {
    // Average of 6 lowest
    usedDifferentials = sorted.slice(0, 6);
    adjustment = 0;
  } else if (count === 19) {
    // Average of 7 lowest
    usedDifferentials = sorted.slice(0, 7);
    adjustment = 0;
  } else {
    // 20+ rounds: use 8 lowest of the most recent 20
    const recent20 = sorted.slice(0, 20);
    const sortedRecent = [...recent20].sort((a, b) => a - b);
    usedDifferentials = sortedRecent.slice(0, 8);
    adjustment = 0;
  }

  // Calculate average of used differentials
  const sum = usedDifferentials.reduce((acc, val) => acc + val, 0);
  const average = sum / usedDifferentials.length;

  // Apply adjustment and round to 1 decimal
  let handicapIndex = Math.round((average + adjustment) * 10) / 10;

  // Cap at 54.0 maximum
  handicapIndex = Math.min(handicapIndex, 54.0);

  // Ensure non-negative (though negative handicaps are technically valid for plus handicaps)
  // WHS allows plus handicaps, so we don't cap at 0

  return handicapIndex;
}

/**
 * Calculate Course Handicap
 *
 * The Course Handicap represents the number of strokes a player receives
 * on a specific course from a specific set of tees.
 *
 * Formula: Handicap Index × (Slope Rating / 113)
 *
 * @param handicapIndex - The player's Handicap Index
 * @param slopeRating - The Slope Rating of the tees being played
 * @returns Course Handicap rounded to nearest integer
 */
export function calculateCourseHandicap(
  handicapIndex: number,
  slopeRating: number
): number {
  const courseHandicap = handicapIndex * (slopeRating / 113);
  return Math.round(courseHandicap);
}

/**
 * Calculate Playing Handicap
 *
 * The Playing Handicap is the Course Handicap adjusted for the course's
 * Course Rating relative to Par. This is the actual number of strokes
 * a player receives for a round.
 *
 * Formula: Handicap Index × (Slope Rating / 113) + (Course Rating - Par)
 *
 * @param handicapIndex - The player's Handicap Index
 * @param slopeRating - The Slope Rating of the tees being played
 * @param courseRating - The Course Rating of the tees being played
 * @param par - The total par for the course
 * @returns Playing Handicap rounded to nearest integer
 */
export function calculatePlayingHandicap(
  handicapIndex: number,
  slopeRating: number,
  courseRating: number,
  par: number
): number {
  const playingHandicap = handicapIndex * (slopeRating / 113) + (courseRating - par);
  return Math.round(playingHandicap);
}

/**
 * Calculate Net Score
 *
 * @param grossScore - The player's gross score
 * @param playingHandicap - The player's Playing Handicap
 * @returns Net score
 */
export function calculateNetScore(
  grossScore: number,
  playingHandicap: number
): number {
  return grossScore - playingHandicap;
}

/**
 * Get the number of differentials used for handicap calculation
 *
 * @param totalDifferentials - Total number of differentials available
 * @returns Number of differentials that will be used in calculation
 */
export function getDifferentialsUsedCount(totalDifferentials: number): number {
  if (totalDifferentials < 3) return 0;
  if (totalDifferentials <= 5) return 1;
  if (totalDifferentials <= 8) return 2;
  if (totalDifferentials <= 11) return 3;
  if (totalDifferentials <= 14) return 4;
  if (totalDifferentials <= 16) return 5;
  if (totalDifferentials <= 18) return 6;
  if (totalDifferentials === 19) return 7;
  return 8; // 20+
}

/**
 * Get the adjustment applied to handicap calculation
 *
 * @param totalDifferentials - Total number of differentials available
 * @returns Adjustment value (negative number or 0)
 */
export function getHandicapAdjustment(totalDifferentials: number): number {
  if (totalDifferentials === 3) return -2.0;
  if (totalDifferentials === 4) return -1.0;
  if (totalDifferentials === 6) return -1.0;
  return 0;
}

/**
 * Format handicap for display
 *
 * @param handicap - Handicap value
 * @returns Formatted string (e.g., "12.4", "+2.1" for plus handicap)
 */
export function formatHandicap(handicap: number | null): string {
  if (handicap === null) return 'N/A';

  if (handicap < 0) {
    // Plus handicap (better than scratch)
    return `+${Math.abs(handicap).toFixed(1)}`;
  }

  return handicap.toFixed(1);
}

/**
 * Validate if a score differential is exceptional
 *
 * An exceptional score is one that is at least 7.0 strokes better than
 * the player's Handicap Index at the time the round was played.
 *
 * @param differential - The score differential
 * @param handicapIndex - The player's Handicap Index at time of round
 * @returns True if the score is exceptional
 */
export function isExceptionalScore(
  differential: number,
  handicapIndex: number
): boolean {
  return differential <= handicapIndex - 7.0;
}

/**
 * Calculate handicap reduction for exceptional score
 *
 * When an exceptional score is posted:
 * - 7.0 to 9.9 better: reduce by 1.0
 * - 10.0+ better: reduce by 2.0
 *
 * @param differential - The exceptional score differential
 * @param handicapIndex - The player's Handicap Index at time of round
 * @returns Reduction amount (1.0 or 2.0), or 0 if not exceptional
 */
export function getExceptionalScoreReduction(
  differential: number,
  handicapIndex: number
): number {
  const improvement = handicapIndex - differential;

  if (improvement >= 10.0) {
    return 2.0;
  } else if (improvement >= 7.0) {
    return 1.0;
  }

  return 0;
}
