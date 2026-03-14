/**
 * Side Games Engine - Skins, Nassau, Match Play
 */

export interface HoleScore {
  hole_number: number;
  strokes: number;
  par: number;
  handicap_index: number;
}

export interface GamePlayer {
  round_player_id: string;
  player_name: string;
  course_handicap: number;
}

export interface GameConfig {
  bet_amount: number;
  gross_net: 'gross' | 'net';
  carryover?: boolean;
  press_threshold?: number;
  player_a_id?: string;
  player_b_id?: string;
}

export interface SkinResult {
  hole: number;
  winner_id: string | null;
  value: number;
  carried_over: boolean;
}

export interface SkinsPlayerResult {
  round_player_id: string;
  skins_won: number;
  skins_value: number;
  payout: number;
}

export interface NassauBetResult {
  winner_id: string | null;
  score: number; // positive = player A ahead
}

export interface NassauResult {
  front: NassauBetResult;
  back: NassauBetResult;
  overall: NassauBetResult;
  presses: { start_hole: number; end_hole: number; winner_id: string | null; score: number }[];
  player_a_payout: number;
  player_b_payout: number;
}

export interface MatchPlayPlayerResult {
  round_player_id: string;
  holes_won: number;
  holes_lost: number;
  holes_halved: number;
  match_status: string;
  result: string;
  payout: number;
}

// Shared helper: allocate handicap strokes to holes
export function allocateStrokes(
  courseHandicapA: number,
  courseHandicapB: number,
  holes: { hole_number: number; handicap_index: number }[]
): Map<number, number> {
  const strokeMap = new Map<number, number>();
  const strokesGiven = Math.abs(courseHandicapA - courseHandicapB);
  if (strokesGiven === 0) return strokeMap;

  // Sort holes by handicap_index (lowest = hardest = gets stroke first)
  const sortedHoles = [...holes].sort((a, b) => a.handicap_index - b.handicap_index);

  for (let i = 0; i < strokesGiven && i < sortedHoles.length; i++) {
    const holeNum = sortedHoles[i % sortedHoles.length].hole_number;
    strokeMap.set(holeNum, (strokeMap.get(holeNum) || 0) + 1);
  }

  return strokeMap;
}

// Skins Engine
export function calculateSkins(
  playerScores: Map<string, HoleScore[]>, // round_player_id -> their scores
  players: GamePlayer[],
  config: GameConfig,
  holes: { hole_number: number; handicap_index: number }[]
): { details: SkinResult[]; playerResults: SkinsPlayerResult[] } {
  const details: SkinResult[] = [];
  const skinCounts = new Map<string, number>();
  const skinValues = new Map<string, number>();
  players.forEach(p => { skinCounts.set(p.round_player_id, 0); skinValues.set(p.round_player_id, 0); });

  let carryover = 0;
  const sortedHoles = [...holes].sort((a, b) => a.hole_number - b.hole_number);

  // Build stroke allocation for net mode
  const strokeAlloc = new Map<number, Map<string, number>>(); // hole -> player -> adjustment
  if (config.gross_net === 'net' && players.length >= 2) {
    const minHcp = Math.min(...players.map(p => p.course_handicap));
    for (const p of players) {
      const diff = p.course_handicap - minHcp;
      const sorted = [...holes].sort((a, b) => a.handicap_index - b.handicap_index);
      for (let i = 0; i < diff && i < sorted.length; i++) {
        const holeNum = sorted[i].hole_number;
        if (!strokeAlloc.has(holeNum)) strokeAlloc.set(holeNum, new Map());
        strokeAlloc.get(holeNum)!.set(p.round_player_id, (strokeAlloc.get(holeNum)!.get(p.round_player_id) || 0) + 1);
      }
    }
  }

  for (const hole of sortedHoles) {
    const holeScores: { playerId: string; net: number }[] = [];

    for (const p of players) {
      const pScores = playerScores.get(p.round_player_id) || [];
      const hs = pScores.find(s => s.hole_number === hole.hole_number);
      if (!hs) continue;
      const adj = strokeAlloc.get(hole.hole_number)?.get(p.round_player_id) || 0;
      holeScores.push({ playerId: p.round_player_id, net: hs.strokes - adj });
    }

    if (holeScores.length === 0) continue;

    const minScore = Math.min(...holeScores.map(s => s.net));
    const winners = holeScores.filter(s => s.net === minScore);

    if (winners.length === 1) {
      const value = config.bet_amount + (config.carryover ? carryover : 0);
      details.push({
        hole: hole.hole_number,
        winner_id: winners[0].playerId,
        value,
        carried_over: false,
      });
      skinCounts.set(winners[0].playerId, (skinCounts.get(winners[0].playerId) || 0) + 1);
      skinValues.set(winners[0].playerId, (skinValues.get(winners[0].playerId) || 0) + value);
      carryover = 0;
    } else {
      // Tie
      details.push({
        hole: hole.hole_number,
        winner_id: null,
        value: 0,
        carried_over: config.carryover || false,
      });
      if (config.carryover) {
        carryover += config.bet_amount;
      }
    }
  }

  const playerResults: SkinsPlayerResult[] = players.map(p => ({
    round_player_id: p.round_player_id,
    skins_won: skinCounts.get(p.round_player_id) || 0,
    skins_value: skinValues.get(p.round_player_id) || 0,
    payout: skinValues.get(p.round_player_id) || 0,
  }));

  return { details, playerResults };
}

// Nassau Engine
export function calculateNassau(
  playerAScores: HoleScore[],
  playerBScores: HoleScore[],
  playerA: GamePlayer,
  playerB: GamePlayer,
  config: GameConfig,
  holes: { hole_number: number; handicap_index: number }[]
): NassauResult {
  const strokeMap = config.gross_net === 'net'
    ? allocateStrokes(playerA.course_handicap, playerB.course_handicap, holes)
    : new Map<number, number>();

  const higherHcpId = playerA.course_handicap >= playerB.course_handicap
    ? playerA.round_player_id : playerB.round_player_id;

  const sortedHoles = [...holes].sort((a, b) => a.hole_number - b.hole_number);
  const frontHoles = sortedHoles.filter(h => h.hole_number <= 9);
  const backHoles = sortedHoles.filter(h => h.hole_number > 9);

  function compareHole(holeNum: number): number {
    const aScore = playerAScores.find(s => s.hole_number === holeNum);
    const bScore = playerBScores.find(s => s.hole_number === holeNum);
    if (!aScore || !bScore) return 0;

    let aNet = aScore.strokes;
    let bNet = bScore.strokes;

    if (config.gross_net === 'net') {
      const adj = strokeMap.get(holeNum) || 0;
      if (playerA.round_player_id === higherHcpId) aNet -= adj;
      else bNet -= adj;
    }

    if (aNet < bNet) return 1;   // A wins
    if (bNet < aNet) return -1;  // B wins
    return 0;                     // halved
  }

  function calculateBet(holeNums: number[]): NassauBetResult {
    let score = 0;
    for (const h of holeNums) {
      score += compareHole(h);
    }
    return {
      winner_id: score > 0 ? playerA.round_player_id :
                 score < 0 ? playerB.round_player_id : null,
      score,
    };
  }

  const front = calculateBet(frontHoles.map(h => h.hole_number));
  const back = calculateBet(backHoles.map(h => h.hole_number));
  const overall = calculateBet(sortedHoles.map(h => h.hole_number));

  // Press logic
  const presses: NassauResult['presses'] = [];
  if (config.press_threshold) {
    const threshold = config.press_threshold;

    for (const nineHoles of [frontHoles, backHoles]) {
      if (nineHoles.length === 0) continue;
      let running = 0;
      let pressActive = false;
      let pressStart = 0;
      let pressScore = 0;

      for (const hole of nineHoles) {
        running += compareHole(hole.hole_number);

        if (!pressActive && Math.abs(running) >= threshold) {
          pressActive = true;
          pressStart = hole.hole_number + 1;
          pressScore = 0;
        } else if (pressActive) {
          pressScore += compareHole(hole.hole_number);
        }
      }

      if (pressActive) {
        const lastHole = nineHoles[nineHoles.length - 1].hole_number;
        presses.push({
          start_hole: pressStart,
          end_hole: lastHole,
          winner_id: pressScore > 0 ? playerA.round_player_id :
                     pressScore < 0 ? playerB.round_player_id : null,
          score: pressScore,
        });
      }
    }
  }

  // Calculate payouts
  let aPayout = 0;
  if (front.winner_id === playerA.round_player_id) aPayout += config.bet_amount;
  else if (front.winner_id === playerB.round_player_id) aPayout -= config.bet_amount;
  if (back.winner_id === playerA.round_player_id) aPayout += config.bet_amount;
  else if (back.winner_id === playerB.round_player_id) aPayout -= config.bet_amount;
  if (overall.winner_id === playerA.round_player_id) aPayout += config.bet_amount;
  else if (overall.winner_id === playerB.round_player_id) aPayout -= config.bet_amount;

  for (const press of presses) {
    if (press.winner_id === playerA.round_player_id) aPayout += config.bet_amount;
    else if (press.winner_id === playerB.round_player_id) aPayout -= config.bet_amount;
  }

  return {
    front, back, overall, presses,
    player_a_payout: aPayout,
    player_b_payout: -aPayout,
  };
}

// Match Play Engine
export function calculateMatchPlay(
  playerAScores: HoleScore[],
  playerBScores: HoleScore[],
  playerA: GamePlayer,
  playerB: GamePlayer,
  config: GameConfig,
  holes: { hole_number: number; handicap_index: number }[]
): { playerA: MatchPlayPlayerResult; playerB: MatchPlayPlayerResult } {
  const strokeMap = config.gross_net === 'net'
    ? allocateStrokes(playerA.course_handicap, playerB.course_handicap, holes)
    : new Map<number, number>();

  const higherHcpId = playerA.course_handicap >= playerB.course_handicap
    ? playerA.round_player_id : playerB.round_player_id;

  const sortedHoles = [...holes].sort((a, b) => a.hole_number - b.hole_number);
  let aWins = 0, bWins = 0, halved = 0;
  let matchEnded = false;
  let endedAtHole = sortedHoles.length;

  for (let i = 0; i < sortedHoles.length; i++) {
    if (matchEnded) break;

    const hole = sortedHoles[i];
    const aScore = playerAScores.find(s => s.hole_number === hole.hole_number);
    const bScore = playerBScores.find(s => s.hole_number === hole.hole_number);
    if (!aScore || !bScore) continue;

    let aNet = aScore.strokes;
    let bNet = bScore.strokes;

    if (config.gross_net === 'net') {
      const adj = strokeMap.get(hole.hole_number) || 0;
      if (playerA.round_player_id === higherHcpId) aNet -= adj;
      else bNet -= adj;
    }

    if (aNet < bNet) aWins++;
    else if (bNet < aNet) bWins++;
    else halved++;

    // Check if match is over
    const holesRemaining = sortedHoles.length - i - 1;
    const lead = Math.abs(aWins - bWins);
    if (lead > holesRemaining) {
      matchEnded = true;
      endedAtHole = i + 1;
    }
  }

  const lead = aWins - bWins;
  const holesPlayed = matchEnded ? endedAtHole : sortedHoles.length;
  const holesRemaining = sortedHoles.length - holesPlayed;

  let resultStr: string;
  let statusStr: string;

  if (lead === 0) {
    resultStr = 'All Square';
    statusStr = 'All Square';
  } else if (matchEnded) {
    const winner = lead > 0 ? 'A' : 'B';
    const margin = Math.abs(lead);
    const remaining = sortedHoles.length - holesPlayed;
    resultStr = `${margin}&${remaining}`;
    statusStr = `${winner === 'A' ? playerA.player_name : playerB.player_name} wins ${resultStr}`;
  } else {
    const ahead = lead > 0 ? playerA.player_name : playerB.player_name;
    resultStr = `${Math.abs(lead)} up`;
    statusStr = holesRemaining === Math.abs(lead)
      ? `${ahead} is dormie`
      : `${ahead} ${Math.abs(lead)} up through ${holesPlayed}`;
  }

  const payout = lead > 0 ? config.bet_amount : lead < 0 ? -config.bet_amount : 0;

  return {
    playerA: {
      round_player_id: playerA.round_player_id,
      holes_won: aWins,
      holes_lost: bWins,
      holes_halved: halved,
      match_status: statusStr,
      result: resultStr,
      payout,
    },
    playerB: {
      round_player_id: playerB.round_player_id,
      holes_won: bWins,
      holes_lost: aWins,
      holes_halved: halved,
      match_status: statusStr,
      result: resultStr,
      payout: -payout,
    },
  };
}
