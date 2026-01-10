import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface RouteParams {
  params: Promise<{ courseId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { courseId } = await params;

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    // Check if already favorited
    const existing = await prisma.favoriteCourse.findUnique({
      where: {
        user_id_course_id: {
          user_id: session.user.id,
          course_id: courseId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Course already in favorites' },
        { status: 409 }
      );
    }

    // Create favorite
    const favorite = await prisma.favoriteCourse.create({
      data: {
        user_id: session.user.id,
        course_id: courseId,
      },
    });

    return NextResponse.json({
      message: 'Course added to favorites',
      id: favorite.id,
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding favorite course:', error);
    return NextResponse.json(
      { error: 'Failed to add favorite course' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { courseId } = await params;

    // Check if favorite exists
    const existing = await prisma.favoriteCourse.findUnique({
      where: {
        user_id_course_id: {
          user_id: session.user.id,
          course_id: courseId,
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Course not in favorites' },
        { status: 404 }
      );
    }

    // Delete favorite
    await prisma.favoriteCourse.delete({
      where: {
        user_id_course_id: {
          user_id: session.user.id,
          course_id: courseId,
        },
      },
    });

    return NextResponse.json({
      message: 'Course removed from favorites',
    });
  } catch (error) {
    console.error('Error removing favorite course:', error);
    return NextResponse.json(
      { error: 'Failed to remove favorite course' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { courseId } = await params;

    const favorite = await prisma.favoriteCourse.findUnique({
      where: {
        user_id_course_id: {
          user_id: session.user.id,
          course_id: courseId,
        },
      },
    });

    return NextResponse.json({
      isFavorite: !!favorite,
    });
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return NextResponse.json(
      { error: 'Failed to check favorite status' },
      { status: 500 }
    );
  }
}
