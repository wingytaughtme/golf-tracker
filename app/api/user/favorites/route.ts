import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const favorites = await prisma.favoriteCourse.findMany({
      where: { user_id: session.user.id },
      include: {
        course: {
          include: {
            _count: {
              select: { tee_sets: true },
            },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const data = favorites.map((fav) => ({
      id: fav.course.id,
      name: fav.course.name,
      city: fav.course.city,
      state: fav.course.state,
      zip_code: fav.course.zip_code,
      address: fav.course.address,
      phone: fav.course.phone,
      website: fav.course.website,
      num_holes: fav.course.num_holes,
      course_type: fav.course.course_type,
      tee_set_count: fav.course._count.tee_sets,
      favorited_at: fav.created_at,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching favorite courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch favorite courses' },
      { status: 500 }
    );
  }
}
