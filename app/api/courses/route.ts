import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma, NineType } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse query parameters
    const search = searchParams.get('search') || '';
    const state = searchParams.get('state') || '';
    const courseType = searchParams.get('course_type') || '';
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: Prisma.CourseWhereInput = {};

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (state) {
      where.state = state.toUpperCase();
    }

    if (courseType && ['public', 'private', 'resort', 'municipal'].includes(courseType)) {
      where.course_type = courseType as 'public' | 'private' | 'resort' | 'municipal';
    }

    // Get total count for pagination
    const total = await prisma.course.count({ where });

    // Fetch courses with tee set count
    const courses = await prisma.course.findMany({
      where,
      include: {
        _count: {
          select: { tee_sets: true },
        },
      },
      orderBy: { name: 'asc' },
      take: limit,
      skip: offset,
    });

    // Transform response
    const data = courses.map((course) => ({
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
      tee_set_count: course._count.tee_sets,
    }));

    return NextResponse.json({
      data,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + courses.length < total,
      },
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

// Input types for course creation
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
  gender?: string;
  nine_ratings: NineRatingInput[];
  hole_yardages: HoleYardageInput[];
}

interface CreateCourseInput {
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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: CreateCourseInput = await request.json();

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

    // Validate nines
    for (const nine of body.nines) {
      if (!nine.name?.trim()) {
        return NextResponse.json(
          { error: 'Nine name is required' },
          { status: 400 }
        );
      }

      if (!nine.holes || nine.holes.length !== 9) {
        return NextResponse.json(
          { error: `Nine "${nine.name}" must have exactly 9 holes` },
          { status: 400 }
        );
      }

      for (const hole of nine.holes) {
        if (hole.hole_number < 1 || hole.hole_number > 9) {
          return NextResponse.json(
            { error: `Hole number must be 1-9 in nine "${nine.name}"` },
            { status: 400 }
          );
        }

        if (hole.par < 3 || hole.par > 6) {
          return NextResponse.json(
            { error: `Par must be 3-6 for hole ${hole.hole_number} in nine "${nine.name}"` },
            { status: 400 }
          );
        }

        if (hole.handicap_index < 1 || hole.handicap_index > 18) {
          return NextResponse.json(
            { error: `Handicap index must be 1-18 for hole ${hole.hole_number} in nine "${nine.name}"` },
            { status: 400 }
          );
        }
      }
    }

    // Validate tee sets
    for (const teeSet of body.tee_sets) {
      if (!teeSet.name?.trim()) {
        return NextResponse.json(
          { error: 'Tee set name is required' },
          { status: 400 }
        );
      }

      if (!teeSet.color?.trim()) {
        return NextResponse.json(
          { error: 'Tee set color is required' },
          { status: 400 }
        );
      }

      // Validate nine ratings
      for (const rating of teeSet.nine_ratings) {
        const nineExists = body.nines.some(n => n.name === rating.nine_name);
        if (!nineExists) {
          return NextResponse.json(
            { error: `Nine "${rating.nine_name}" not found for tee set "${teeSet.name}" rating` },
            { status: 400 }
          );
        }

        if (rating.course_rating < 25 || rating.course_rating > 45) {
          return NextResponse.json(
            { error: `Course rating must be 25-45 for nine "${rating.nine_name}" in tee set "${teeSet.name}"` },
            { status: 400 }
          );
        }

        if (rating.slope_rating < 55 || rating.slope_rating > 155) {
          return NextResponse.json(
            { error: `Slope rating must be 55-155 for nine "${rating.nine_name}" in tee set "${teeSet.name}"` },
            { status: 400 }
          );
        }
      }
    }

    // Calculate total holes
    const numHoles = body.nines.length * 9;

    // Create course without transaction to avoid timeout
    // Create course first
    const course = await prisma.course.create({
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
        source: 'user_created',
        created_by: session.user.id,
      },
    });

    try {
      // Create nines and holes
      const nineMap = new Map<string, string>(); // name -> id
      const holeMap = new Map<string, string>(); // "nineName-holeNumber" -> id

      for (const nineInput of body.nines) {
        const nine = await prisma.nine.create({
          data: {
            course_id: course.id,
            name: nineInput.name.trim(),
            nine_type: nineInput.nine_type as NineType,
            display_order: nineInput.display_order,
          },
        });

        nineMap.set(nineInput.name, nine.id);

        // Create holes for this nine using createMany for speed
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

      // Create tee sets with ratings and yardages
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
            course_id: course.id,
            name: teeSetInput.name.trim(),
            color: teeSetInput.color.trim(),
            gender: teeSetInput.gender?.trim() || null,
            course_rating: totalRating,
            slope_rating: avgSlope,
            total_yardage: totalYardage,
          },
        });

        // Create TeeNineRatings using createMany
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

        // Create TeeHoleYardages using createMany
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
    } catch (innerError) {
      // If something fails, clean up the course
      await prisma.course.delete({ where: { id: course.id } });
      throw innerError;
    }

    // Fetch the created course with all relations
    const createdCourse = await prisma.course.findUnique({
      where: { id: course.id },
      include: {
        nines: {
          include: {
            holes: {
              orderBy: { hole_number: 'asc' },
            },
            tee_nine_ratings: true,
          },
          orderBy: { display_order: 'asc' },
        },
        tee_sets: {
          include: {
            tee_yardages: true,
          },
        },
        _count: {
          select: { tee_sets: true },
        },
      },
    });

    return NextResponse.json(createdCourse, { status: 201 });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}
