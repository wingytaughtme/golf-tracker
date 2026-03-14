import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        track_detailed_stats: true,
        preferences: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      track_detailed_stats: user.track_detailed_stats,
      preferences: user.preferences,
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    const { track_detailed_stats, preferences } = body;

    const updateData: { track_detailed_stats?: boolean; preferences?: object } = {};

    if (track_detailed_stats !== undefined) {
      updateData.track_detailed_stats = track_detailed_stats ?? false;
    }

    if (preferences !== undefined) {
      // Merge with existing preferences
      const existingUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { preferences: true },
      });
      const existingPrefs = (existingUser?.preferences as Record<string, unknown>) || {};
      updateData.preferences = { ...existingPrefs, ...preferences };
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        track_detailed_stats: true,
        preferences: true,
      },
    });

    return NextResponse.json({
      track_detailed_stats: user.track_detailed_stats,
      preferences: user.preferences,
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return NextResponse.json(
      { error: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
