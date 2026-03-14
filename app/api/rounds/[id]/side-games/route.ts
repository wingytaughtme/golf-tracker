import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { calculateSkins, calculateNassau, calculateMatchPlay, type HoleScore, type GamePlayer, type GameConfig } from '@/lib/calculations/side-games';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { id: roundId } = await params;
    const body = await request.json();

    const round = await prisma.round.findUnique({
      where: { id: roundId },
      select: { status: true, created_by: true },
    });

    if (!round) return NextResponse.json({ error: 'Round not found' }, { status: 404 });
    if (round.status !== 'in_progress') return NextResponse.json({ error: 'Round not in progress' }, { status: 400 });

    const game = await prisma.sideGame.create({
      data: {
        round_id: roundId,
        game_type: body.game_type,
        config: body.config || {},
      },
    });

    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    console.error('Error creating side game:', error);
    return NextResponse.json({ error: 'Failed to create side game' }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { error } = await requireAuth();
    if (error) return error;

    const { id: roundId } = await params;

    const sideGames = await prisma.sideGame.findMany({
      where: { round_id: roundId },
      include: { results: true },
    });

    if (sideGames.length === 0) {
      return NextResponse.json({ games: [] });
    }

    // Fetch round data for calculations
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: {
        tee_set: true,
        round_nines: {
          orderBy: { play_order: 'asc' },
          include: {
            nine: {
              include: {
                holes: { orderBy: { hole_number: 'asc' } },
              },
            },
          },
        },
        round_players: {
          include: {
            player: { select: { name: true } },
            scores: { include: { hole: true } },
          },
        },
      },
    });

    if (!round) return NextResponse.json({ error: 'Round not found' }, { status: 404 });

    const teeSetId = round.tee_set.id;
    const holes = round.round_nines.flatMap(rn =>
      rn.nine.holes.filter(h => h.tee_set_id === teeSetId)
    );

    const gamesWithResults = sideGames.map(game => {
      const config = game.config as unknown as GameConfig;

      // If game is completed, return stored results
      if (game.status === 'completed') {
        return { ...game, calculated_results: game.results };
      }

      // Calculate live results from current scores
      const players: GamePlayer[] = round.round_players.map(rp => ({
        round_player_id: rp.id,
        player_name: rp.player.name,
        course_handicap: rp.playing_handicap ? Math.round(Number(rp.playing_handicap)) : 0,
      }));

      const holeInfo = holes.map(h => ({ hole_number: h.hole_number, handicap_index: h.handicap_index }));

      let calculated_results: unknown = null;

      if (game.game_type === 'skins') {
        const playerScoresMap = new Map<string, HoleScore[]>();
        for (const rp of round.round_players) {
          playerScoresMap.set(rp.id, rp.scores
            .filter(s => s.strokes !== null)
            .map(s => ({
              hole_number: s.hole.hole_number,
              strokes: s.strokes!,
              par: s.hole.par,
              handicap_index: s.hole.handicap_index,
            }))
          );
        }
        calculated_results = calculateSkins(playerScoresMap, players, config, holeInfo);
      } else if (game.game_type === 'nassau' && players.length >= 2) {
        const pA = config.player_a_id ? players.find(p => p.round_player_id === config.player_a_id) || players[0] : players[0];
        const pB = config.player_b_id ? players.find(p => p.round_player_id === config.player_b_id) || players[1] : players[1];

        const rpA = round.round_players.find(rp => rp.id === pA.round_player_id);
        const rpB = round.round_players.find(rp => rp.id === pB.round_player_id);

        if (rpA && rpB) {
          const scoresA: HoleScore[] = rpA.scores.filter(s => s.strokes !== null).map(s => ({
            hole_number: s.hole.hole_number, strokes: s.strokes!, par: s.hole.par, handicap_index: s.hole.handicap_index,
          }));
          const scoresB: HoleScore[] = rpB.scores.filter(s => s.strokes !== null).map(s => ({
            hole_number: s.hole.hole_number, strokes: s.strokes!, par: s.hole.par, handicap_index: s.hole.handicap_index,
          }));
          calculated_results = calculateNassau(scoresA, scoresB, pA, pB, config, holeInfo);
        }
      } else if (game.game_type === 'match_play' && players.length >= 2) {
        const pA = config.player_a_id ? players.find(p => p.round_player_id === config.player_a_id) || players[0] : players[0];
        const pB = config.player_b_id ? players.find(p => p.round_player_id === config.player_b_id) || players[1] : players[1];

        const rpA = round.round_players.find(rp => rp.id === pA.round_player_id);
        const rpB = round.round_players.find(rp => rp.id === pB.round_player_id);

        if (rpA && rpB) {
          const scoresA: HoleScore[] = rpA.scores.filter(s => s.strokes !== null).map(s => ({
            hole_number: s.hole.hole_number, strokes: s.strokes!, par: s.hole.par, handicap_index: s.hole.handicap_index,
          }));
          const scoresB: HoleScore[] = rpB.scores.filter(s => s.strokes !== null).map(s => ({
            hole_number: s.hole.hole_number, strokes: s.strokes!, par: s.hole.par, handicap_index: s.hole.handicap_index,
          }));
          calculated_results = calculateMatchPlay(scoresA, scoresB, pA, pB, config, holeInfo);
        }
      }

      return { ...game, calculated_results };
    });

    return NextResponse.json({ games: gamesWithResults });
  } catch (error) {
    console.error('Error fetching side games:', error);
    return NextResponse.json({ error: 'Failed to fetch side games' }, { status: 500 });
  }
}
