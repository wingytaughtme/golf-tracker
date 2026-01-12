import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        tee_sets: {
          include: {
            holes: {
              orderBy: { hole_number: 'asc' },
            },
          },
          orderBy: { course_rating: 'desc' },
        },
        _count: {
          select: { rounds: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Transform tee sets to include calculated totals
    const teeSetsWithTotals = course.tee_sets.map((teeSet) => {
      const frontNine = teeSet.holes.filter((h) => h.hole_number <= 9);
      const backNine = teeSet.holes.filter((h) => h.hole_number > 9);

      return {
        id: teeSet.id,
        name: teeSet.name,
        color: teeSet.color,
        course_rating: teeSet.course_rating,
        slope_rating: teeSet.slope_rating,
        total_yardage: teeSet.total_yardage,
        gender: teeSet.gender,
        holes: teeSet.holes,
        totals: {
          front: {
            par: frontNine.reduce((sum, h) => sum + h.par, 0),
            yardage: frontNine.reduce((sum, h) => sum + h.distance, 0),
          },
          back: {
            par: backNine.reduce((sum, h) => sum + h.par, 0),
            yardage: backNine.reduce((sum, h) => sum + h.distance, 0),
          },
          total: {
            par: teeSet.holes.reduce((sum, h) => sum + h.par, 0),
            yardage: teeSet.holes.reduce((sum, h) => sum + h.distance, 0),
          },
        },
      };
    });

    return NextResponse.json({
      id: course.id,
      name: course.name,
      city: course.city,
      state: course.state,
      zip_code: course.zip_code,
      address: course.address,
      phone: course.phone,
      website: course.website,
      num_holes: course.num_holes,
      course_type: course.course_type,
      latitude: course.latitude,
      longitude: course.longitude,
      rounds_played: course._count.rounds,
      tee_sets: teeSetsWithTotals,
    });
  } catch (error) {
    console.error('Error fetching course:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    );
  }
}
