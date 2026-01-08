import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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
