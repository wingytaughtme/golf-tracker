import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NineType } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Input types for course update
interface HoleInput {
  hole_number: number;
  par: number;
  handicap_index: number;
}

interface NineInput {
  name: string;
  nine_type: 'front' | 'back' | 'named';
  display_order: number;
  holes: HoleInput[];
}

interface NineRatingInput {
  nine_name: string;
  course_rating: number;
  slope_rating: number;
}

interface HoleYardageInput {
  nine_name: string;
  hole_number: number;
  yardage: number;
}

interface TeeSetInput {
  name: string;
  color: string;
  nine_ratings: NineRatingInput[];
  hole_yardages: HoleYardageInput[];
}

interface UpdateCourseInput {
  name: string;
  city: string;
  state: string;
  zip_code?: string;
  address?: string;
  phone?: string;
  website?: string;
  course_type?: 'public' | 'private' | 'resort' | 'municipal';
  nines: NineInput[];
  tee_sets: TeeSetInput[];
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        nines: {
          include: {
            holes: {
              orderBy: { hole_number: 'asc' },
            },
            tee_nine_ratings: {
              include: {
                tee_set: {
                  select: { id: true, name: true, color: true },
                },
              },
            },
          },
          orderBy: { display_order: 'asc' },
        },
        tee_sets: {
          include: {
            holes: {
              orderBy: { hole_number: 'asc' },
            },
            tee_yardages: {
              include: {
                hole: true,
              },
            },
            tee_nine_ratings: true,
          },
          orderBy: { course_rating: 'desc' },
        },
        _count: {
          select: { rounds: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Get all holes from nines (sorted by display_order, then hole_number)
    // For 18-hole courses, we need to renumber holes 1-18 (front 1-9, back 10-18)
    const allHolesFromNines = course.nines.flatMap((nine, nineIndex) =>
      nine.holes.map((hole) => ({
        ...hole,
        nine_id: nine.id,
        nine_name: nine.name,
        nine_type: nine.nine_type,
        // Calculate display hole number (1-9 for first nine, 10-18 for second, etc.)
        display_hole_number: nineIndex * 9 + hole.hole_number,
      }))
    );

    // Transform tee sets to include calculated totals
    const teeSetsWithTotals = course.tee_sets.map((teeSet) => {
      // Get yardages from TeeHoleYardage
      const yardageMap = new Map(
        teeSet.tee_yardages.map((y) => [y.hole_id, y.yardage])
      );

      // Use holes from nines for new model, fall back to teeSet.holes for legacy
      const holes = allHolesFromNines.length > 0
        ? allHolesFromNines.map((h) => ({
            id: h.id,
            hole_number: h.display_hole_number,
            par: h.par,
            handicap_index: h.handicap_index,
            distance: yardageMap.get(h.id) || 0,
          }))
        : teeSet.holes.map((h) => ({
            id: h.id,
            hole_number: h.hole_number,
            par: h.par,
            handicap_index: h.handicap_index,
            distance: yardageMap.get(h.id) || h.distance,
          }));

      const frontNine = holes.filter((h) => h.hole_number <= 9);
      const backNine = holes.filter((h) => h.hole_number > 9);

      // Get nine ratings
      const nineRatings = teeSet.tee_nine_ratings.map((r) => ({
        nine_id: r.nine_id,
        course_rating: Number(r.course_rating),
        slope_rating: r.slope_rating,
      }));

      return {
        id: teeSet.id,
        name: teeSet.name,
        color: teeSet.color,
        course_rating: Number(teeSet.course_rating),
        slope_rating: teeSet.slope_rating,
        total_yardage: teeSet.total_yardage,
        gender: teeSet.gender,
        holes,
        nine_ratings: nineRatings,
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
            par: holes.reduce((sum, h) => sum + h.par, 0),
            yardage: holes.reduce((sum, h) => sum + h.distance, 0),
          },
        },
      };
    });

    // Transform nines with their holes and yardages per tee
    const ninesWithData = course.nines.map((nine) => ({
      id: nine.id,
      name: nine.name,
      nine_type: nine.nine_type,
      display_order: nine.display_order,
      holes: nine.holes.map((hole) => ({
        id: hole.id,
        hole_number: hole.hole_number,
        par: hole.par,
        handicap_index: hole.handicap_index,
      })),
      ratings: nine.tee_nine_ratings.map((r) => ({
        tee_set_id: r.tee_set_id,
        tee_set_name: r.tee_set.name,
        tee_set_color: r.tee_set.color,
        course_rating: Number(r.course_rating),
        slope_rating: r.slope_rating,
      })),
      total_par: nine.holes.reduce((sum, h) => sum + h.par, 0),
    }));

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
      source: course.source,
      created_by: course.created_by,
      latitude: course.latitude,
      longitude: course.longitude,
      rounds_played: course._count.rounds,
      nines: ninesWithData,
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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Find the course
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: { rounds: true },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if user owns this course
    if (course.source !== 'user_created') {
      return NextResponse.json(
        { error: 'Cannot delete seeded courses' },
        { status: 403 }
      );
    }

    if (course.created_by !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only delete courses you created' },
        { status: 403 }
      );
    }

    // Check if course has any rounds
    if (course._count.rounds > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete course with ${course._count.rounds} round(s). Delete the rounds first.`,
        },
        { status: 400 }
      );
    }

    // Delete the course (cascades to nines, holes, tee_sets, etc.)
    await prisma.course.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body: UpdateCourseInput = await request.json();

    // Find the course
    const course = await prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Check if user owns this course
    if (course.source !== 'user_created') {
      return NextResponse.json(
        { error: 'Cannot edit seeded courses' },
        { status: 403 }
      );
    }

    if (course.created_by !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only edit courses you created' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Course name is required' },
        { status: 400 }
      );
    }

    if (!body.city?.trim()) {
      return NextResponse.json(
        { error: 'City is required' },
        { status: 400 }
      );
    }

    if (!body.state?.trim() || body.state.length !== 2) {
      return NextResponse.json(
        { error: 'State must be a 2-letter code' },
        { status: 400 }
      );
    }

    if (!body.nines || body.nines.length === 0) {
      return NextResponse.json(
        { error: 'At least one nine is required' },
        { status: 400 }
      );
    }

    if (!body.tee_sets || body.tee_sets.length === 0) {
      return NextResponse.json(
        { error: 'At least one tee set is required' },
        { status: 400 }
      );
    }

    // Calculate total holes
    const numHoles = body.nines.length * 9;

    // Update course basic info
    await prisma.course.update({
      where: { id },
      data: {
        name: body.name.trim(),
        city: body.city.trim(),
        state: body.state.toUpperCase(),
        zip_code: body.zip_code?.trim() || null,
        address: body.address?.trim() || null,
        phone: body.phone?.trim() || null,
        website: body.website?.trim() || null,
        num_holes: numHoles,
        course_type: body.course_type || null,
      },
    });

    // Delete existing nines, holes, tee sets (cascade will clean up related records)
    await prisma.nine.deleteMany({ where: { course_id: id } });
    await prisma.teeSet.deleteMany({ where: { course_id: id } });

    // Recreate nines and holes
    const nineMap = new Map<string, string>(); // name -> id
    const holeMap = new Map<string, string>(); // "nineName-holeNumber" -> id

    for (const nineInput of body.nines) {
      const nine = await prisma.nine.create({
        data: {
          course_id: id,
          name: nineInput.name.trim(),
          nine_type: nineInput.nine_type as NineType,
          display_order: nineInput.display_order,
        },
      });

      nineMap.set(nineInput.name, nine.id);

      // Create holes for this nine
      const holesData = nineInput.holes.map(holeInput => ({
        nine_id: nine.id,
        hole_number: holeInput.hole_number,
        par: holeInput.par,
        handicap_index: holeInput.handicap_index,
        distance: 0,
      }));

      await prisma.hole.createMany({ data: holesData });

      // Fetch the created holes to get their IDs
      const createdHoles = await prisma.hole.findMany({
        where: { nine_id: nine.id },
      });

      for (const hole of createdHoles) {
        holeMap.set(`${nineInput.name}-${hole.hole_number}`, hole.id);
      }
    }

    // Recreate tee sets with ratings and yardages
    for (const teeSetInput of body.tee_sets) {
      // Calculate total rating from nine ratings
      const totalRating = teeSetInput.nine_ratings.reduce(
        (sum, r) => sum + r.course_rating,
        0
      );
      const avgSlope = Math.round(
        teeSetInput.nine_ratings.reduce((sum, r) => sum + r.slope_rating, 0) /
          teeSetInput.nine_ratings.length
      );

      // Calculate total yardage
      const totalYardage = teeSetInput.hole_yardages.reduce(
        (sum, y) => sum + y.yardage,
        0
      );

      const teeSet = await prisma.teeSet.create({
        data: {
          course_id: id,
          name: teeSetInput.name.trim(),
          color: teeSetInput.color.trim(),
          gender: null,
          course_rating: totalRating,
          slope_rating: avgSlope,
          total_yardage: totalYardage,
        },
      });

      // Create TeeNineRatings
      const ratingsData = teeSetInput.nine_ratings
        .map(ratingInput => {
          const nineId = nineMap.get(ratingInput.nine_name);
          if (!nineId) return null;
          return {
            tee_set_id: teeSet.id,
            nine_id: nineId,
            course_rating: ratingInput.course_rating,
            slope_rating: ratingInput.slope_rating,
          };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null);

      if (ratingsData.length > 0) {
        await prisma.teeNineRating.createMany({ data: ratingsData });
      }

      // Create TeeHoleYardages
      const yardagesData = teeSetInput.hole_yardages
        .map(yardageInput => {
          const holeId = holeMap.get(
            `${yardageInput.nine_name}-${yardageInput.hole_number}`
          );
          if (!holeId) return null;
          return {
            tee_set_id: teeSet.id,
            hole_id: holeId,
            yardage: yardageInput.yardage,
          };
        })
        .filter((y): y is NonNullable<typeof y> => y !== null);

      if (yardagesData.length > 0) {
        await prisma.teeHoleYardage.createMany({ data: yardagesData });
      }
    }

    // Fetch and return the updated course
    const updatedCourse = await prisma.course.findUnique({
      where: { id },
      include: {
        nines: {
          include: {
            holes: { orderBy: { hole_number: 'asc' } },
          },
          orderBy: { display_order: 'asc' },
        },
        tee_sets: true,
        _count: { select: { tee_sets: true } },
      },
    });

    return NextResponse.json(updatedCourse);
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    );
  }
}
