/**
 * Production Seed Script
 *
 * Seeds the database with courses ONLY - no demo users or test data.
 * Use this when setting up a fresh production database.
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/seed-production.ts
 *
 * Or add to package.json:
 *   "db:seed:prod": "npx ts-node --compiler-options '{\"module\":\"CommonJS\"}' scripts/seed-production.ts"
 */

import { PrismaClient, NineType } from '@prisma/client';
import { allCourses, CourseData } from '../prisma/data';

const prisma = new PrismaClient();

async function seedCourse(courseData: CourseData) {
  // Create the course
  const course = await prisma.course.create({
    data: {
      name: courseData.name,
      city: courseData.city,
      state: courseData.state,
      zip_code: courseData.zip_code,
      address: courseData.address,
      phone: courseData.phone,
      website: courseData.website,
      num_holes: courseData.num_holes,
      course_type: courseData.course_type,
      latitude: courseData.latitude,
      longitude: courseData.longitude,
      source: 'seeded',
    },
  });

  // Determine nine configuration
  type NineInfo = { name: string; type: NineType; holeStart: number; holeEnd: number };
  const nineTypes: NineInfo[] = [];

  if (courseData.nines) {
    // Custom nines (e.g., 27-hole facility with named nines)
    let holeStart = 1;
    for (const nineConfig of courseData.nines) {
      nineTypes.push({
        name: nineConfig.name,
        type: nineConfig.nine_type as NineType,
        holeStart,
        holeEnd: holeStart + 8,
      });
      holeStart += 9;
    }
  } else if (courseData.num_holes === 18) {
    nineTypes.push(
      { name: 'Front', type: 'front', holeStart: 1, holeEnd: 9 },
      { name: 'Back', type: 'back', holeStart: 10, holeEnd: 18 }
    );
  } else if (courseData.num_holes === 9) {
    nineTypes.push(
      { name: 'Front', type: 'front', holeStart: 1, holeEnd: 9 }
    );
  }

  // Create nines
  const nines = await Promise.all(
    nineTypes.map((nine, index) =>
      prisma.nine.create({
        data: {
          course_id: course.id,
          name: nine.name,
          nine_type: nine.type,
          display_order: courseData.nines ? courseData.nines[index].display_order : index,
        },
      })
    )
  );

  // Create tee sets and holes for each tee set
  for (const teeSetData of courseData.tee_sets) {
    const teeSet = await prisma.teeSet.create({
      data: {
        course_id: course.id,
        name: teeSetData.name,
        color: teeSetData.color,
        course_rating: teeSetData.course_rating,
        slope_rating: teeSetData.slope_rating,
        total_yardage: teeSetData.total_yardage,
        gender: teeSetData.gender,
      },
    });

    // Only create holes if hole data is provided
    if (teeSetData.holes.length > 0) {
      for (const holeData of teeSetData.holes) {
        // Find which nine this hole belongs to
        const nineInfo = nineTypes.find(
          n => holeData.hole_number >= n.holeStart && holeData.hole_number <= n.holeEnd
        );
        const nine = nines.find(n => n.name === nineInfo?.name);

        // Calculate hole number within the nine (1-9)
        const holeNumberInNine = nineInfo
          ? holeData.hole_number - nineInfo.holeStart + 1
          : holeData.hole_number;

        await prisma.hole.create({
          data: {
            tee_set_id: teeSet.id,
            nine_id: nine?.id,
            hole_number: holeNumberInNine,
            par: holeData.par,
            distance: holeData.distance,
            handicap_index: holeData.handicap_index,
          },
        });
      }
    }

    // Create TeeNineRating for each nine (skip if slope is 0 — unrated course)
    if (teeSetData.slope_rating > 0) {
      for (const nine of nines) {
        const isBackNine = nine.name === 'Back';
        // Approximate split - front nine typically has slightly lower rating
        const nineRating = Number(teeSetData.course_rating) / 2;
        const nineSlope = teeSetData.slope_rating;

        await prisma.teeNineRating.create({
          data: {
            tee_set_id: teeSet.id,
            nine_id: nine.id,
            course_rating: isBackNine ? nineRating + 0.2 : nineRating - 0.2,
            slope_rating: nineSlope,
          },
        });
      }
    }
  }

  return course;
}

async function main() {
  console.log('='.repeat(60));
  console.log('Production Database Seed');
  console.log('Seeding courses only - NO demo users or test data');
  console.log('='.repeat(60));
  console.log('');

  // Check if database already has courses
  const existingCourses = await prisma.course.count();
  if (existingCourses > 0) {
    console.log(`Database already has ${existingCourses} courses.`);
    console.log('To reseed, first run: npx prisma migrate reset');
    console.log('');
    return;
  }

  console.log(`Seeding ${allCourses.length} golf courses...\n`);

  let successCount = 0;
  let failCount = 0;

  for (const courseData of allCourses) {
    try {
      const course = await seedCourse(courseData);
      const holeCount = courseData.tee_sets.reduce((sum, ts) => sum + ts.holes.length, 0);
      const teeCount = courseData.tee_sets.length;
      const nineCount = courseData.nines?.length ?? (courseData.num_holes === 18 ? 2 : 1);
      const detail = holeCount > 0
        ? `${teeCount} tees, ${holeCount} holes`
        : `${teeCount} tees, ${nineCount} nines (no hole data)`;
      console.log(`  [OK] ${course.name} (${courseData.city}, ${courseData.state}) — ${detail}`);
      successCount++;
    } catch (error) {
      console.error(`  [FAIL] ${courseData.name}:`, error instanceof Error ? error.message : error);
      failCount++;
    }
  }

  console.log('');
  console.log('='.repeat(60));
  console.log(`Summary: ${successCount} courses seeded, ${failCount} failed`);
  console.log('');
  console.log('Next steps:');
  console.log('1. Register your account at /register');
  console.log('2. Promote yourself to admin:');
  console.log('   UPDATE users SET role = \'admin\' WHERE email = \'your@email.com\';');
  console.log('='.repeat(60));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
