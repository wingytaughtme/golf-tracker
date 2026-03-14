import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';
import { generateInviteCode } from '@/lib/calculations/league-standings';

export async function POST(
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
      return NextResponse.json({ error: 'Only the commissioner can regenerate the invite code' }, { status: 403 });
    }

    // Generate a unique invite code
    let inviteCode = generateInviteCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.league.findUnique({ where: { invite_code: inviteCode } });
      if (!existing) break;
      inviteCode = generateInviteCode();
      attempts++;
    }

    const updated = await prisma.league.update({
      where: { id },
      data: { invite_code: inviteCode },
      select: { invite_code: true },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error regenerating invite code:', error);
    return NextResponse.json({ error: 'Failed to regenerate invite code' }, { status: 500 });
  }
}
