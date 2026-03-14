import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;
    const { id } = await params;

    const league = await prisma.league.findUnique({
      where: { id },
      include: {
        commissioner: { select: { id: true, name: true } },
        default_course: { select: { id: true, name: true, city: true, state: true } },
        players: {
          where: { is_active: true },
          include: { player: { select: { id: true, name: true } }, user: { select: { name: true } } },
        },
        seasons: { orderBy: { created_at: 'desc' } },
      },
    });

    if (!league) return NextResponse.json({ error: 'League not found' }, { status: 404 });

    return NextResponse.json({
      ...league,
      is_commissioner: league.commissioner_id === session.user.id,
      member_count: league.players.length,
    });
  } catch (error) {
    console.error('Error fetching league:', error);
    return NextResponse.json({ error: 'Failed to fetch league' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;
    const { id } = await params;
    const body = await request.json();

    const league = await prisma.league.findUnique({ where: { id }, select: { commissioner_id: true } });
    if (!league) return NextResponse.json({ error: 'League not found' }, { status: 404 });
    if (league.commissioner_id !== session.user.id) {
      return NextResponse.json({ error: 'Only the commissioner can update the league' }, { status: 403 });
    }

    const updated = await prisma.league.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        default_course_id: body.default_course_id,
        config: body.config,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating league:', error);
    return NextResponse.json({ error: 'Failed to update league' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;
    const { id } = await params;

    const league = await prisma.league.findUnique({ where: { id }, select: { commissioner_id: true } });
    if (!league) return NextResponse.json({ error: 'League not found' }, { status: 404 });
    if (league.commissioner_id !== session.user.id) {
      return NextResponse.json({ error: 'Only the commissioner can archive the league' }, { status: 403 });
    }

    await prisma.league.update({ where: { id }, data: { status: 'archived' } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error archiving league:', error);
    return NextResponse.json({ error: 'Failed to archive league' }, { status: 500 });
  }
}
