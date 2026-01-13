/**
 * Migration script to convert existing courses to the Nine model
 *
 * Run with: npx tsx scripts/migrate-courses-to-nines.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient, NineType } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateCourses() {
  console.log('Starting course migration to Nine model...\n');

  // First, clean up any partial migration data
  console.log('Cleaning up any partial migration data...');
  await prisma.roundNine.deleteMany({});
  await prisma.teeHoleYardage.deleteMany({});
  await prisma.teeNineRating.deleteMany({});
  await prisma.hole.updateMany({
    where: { nine_id: { not: null } },
    data: { nine_id: null },
  });
  await prisma.nine.deleteMany({});
  console.log('Cleanup complete.\n');

  // Get all courses with their tee sets and holes
  const courses = await prisma.course.findMany({
    include: {
      tee_sets: {
        include: {
          holes: {
            orderBy: { hole_number: 'asc' },
          },
        },
      },
    },
  });

  console.log(`Found ${courses.length} courses to process\n`);

  let migratedCount = 0;
  let errorCount = 0;

  for (const course of courses) {
    // Skip if no tee sets
    if (course.tee_sets.length === 0) {
      console.log(`Skipping ${course.name} - no tee sets`);
      continue;
    }

    console.log(`Processing: ${course.name} (${course.num_holes} holes)`);

    try {
      // Determine nine structure based on num_holes
      let ninesToCreate: Array<{ name: string; nine_type: NineType; display_order: number }>;

      if (course.num_holes === 9) {
        ninesToCreate = [
          { name: 'Main', nine_type: 'named' as NineType, display_order: 0 },
        ];
      } else if (course.num_holes === 27) {
        ninesToCreate = [
          { name: 'First', nine_type: 'named' as NineType, display_order: 0 },
          { name: 'Second', nine_type: 'named' as NineType, display_order: 1 },
          { name: 'Third', nine_type: 'named' as NineType, display_order: 2 },
        ];
      } else {
        // Default to 18 holes (front/back)
        ninesToCreate = [
          { name: 'Front', nine_type: 'front' as NineType, display_order: 0 },
          { name: 'Back', nine_type: 'back' as NineType, display_order: 1 },
        ];
      }

      // Create Nine records
      const createdNines: Array<{ id: string; name: string; display_order: number }> = [];
      for (const nineData of ninesToCreate) {
        const nine = await prisma.nine.create({
          data: {
            course_id: course.id,
            name: nineData.name,
            nine_type: nineData.nine_type,
            display_order: nineData.display_order,
          },
        });
        createdNines.push(nine);
      }
      console.log(`  Created ${createdNines.length} nines: ${createdNines.map(n => n.name).join(', ')}`);

      // Process each tee set
      for (const teeSet of course.tee_sets) {
        const holes = teeSet.holes;
        if (holes.length === 0) continue;

        // Calculate 9-hole ratings
        const totalRating = Number(teeSet.course_rating);
        const frontRating = Math.round((totalRating / 2) * 10) / 10;
        const backRating = Math.round((totalRating - frontRating) * 10) / 10;

        // Batch create TeeNineRatings
        const teeNineRatingData = [];
        if (createdNines[0]) {
          teeNineRatingData.push({
            tee_set_id: teeSet.id,
            nine_id: createdNines[0].id,
            course_rating: frontRating,
            slope_rating: teeSet.slope_rating,
          });
        }
        if (createdNines[1]) {
          teeNineRatingData.push({
            tee_set_id: teeSet.id,
            nine_id: createdNines[1].id,
            course_rating: backRating,
            slope_rating: teeSet.slope_rating,
          });
        }
        if (createdNines[2]) {
          // For 27-hole courses, use average rating for third nine
          teeNineRatingData.push({
            tee_set_id: teeSet.id,
            nine_id: createdNines[2].id,
            course_rating: frontRating,
            slope_rating: teeSet.slope_rating,
          });
        }

        if (teeNineRatingData.length > 0) {
          await prisma.teeNineRating.createMany({ data: teeNineRatingData });
        }

        // Batch create TeeHoleYardages
        const teeHoleYardageData = holes.map(hole => ({
          tee_set_id: teeSet.id,
          hole_id: hole.id,
          yardage: hole.distance,
        }));

        if (teeHoleYardageData.length > 0) {
          await prisma.teeHoleYardage.createMany({ data: teeHoleYardageData });
        }

        // Update holes to link to nines
        for (const hole of holes) {
          const isBackNine = hole.hole_number > 9;
          const isThirdNine = hole.hole_number > 18;

          let targetNine;
          if (isThirdNine && createdNines[2]) {
            targetNine = createdNines[2];
          } else if (isBackNine && createdNines[1]) {
            targetNine = createdNines[1];
          } else {
            targetNine = createdNines[0];
          }

          if (targetNine) {
            await prisma.hole.update({
              where: { id: hole.id },
              data: { nine_id: targetNine.id },
            });
          }
        }

        console.log(`  TeeSet ${teeSet.name}: ${teeNineRatingData.length} ratings, ${holes.length} holes linked`);
      }

      // Create RoundNine records for existing rounds
      const rounds = await prisma.round.findMany({
        where: { course_id: course.id },
      });

      if (rounds.length > 0) {
        const roundNineData = [];
        for (const round of rounds) {
          if (createdNines.length >= 2) {
            roundNineData.push(
              { round_id: round.id, nine_id: createdNines[0].id, play_order: 0 },
              { round_id: round.id, nine_id: createdNines[1].id, play_order: 1 }
            );
          } else if (createdNines.length === 1) {
            roundNineData.push({
              round_id: round.id,
              nine_id: createdNines[0].id,
              play_order: 0,
            });
          }
        }

        if (roundNineData.length > 0) {
          await prisma.roundNine.createMany({ data: roundNineData });
          console.log(`  Linked ${rounds.length} rounds to nines`);
        }
      }

      migratedCount++;
      console.log(`  ✓ Done`);
    } catch (error) {
      errorCount++;
      console.error(`  ✗ Error:`, error instanceof Error ? error.message : error);
    }
  }

  console.log('\n========================================');
  console.log(`Migration complete!`);
  console.log(`  Migrated: ${migratedCount} courses`);
  console.log(`  Errors: ${errorCount} courses`);
  console.log('========================================\n');

  // Verify the migration
  console.log('Verification:');
  const nineCount = await prisma.nine.count();
  const teeNineRatingCount = await prisma.teeNineRating.count();
  const teeHoleYardageCount = await prisma.teeHoleYardage.count();
  const holesWithNine = await prisma.hole.count({ where: { nine_id: { not: null } } });
  const roundNineCount = await prisma.roundNine.count();

  console.log(`  Nines created: ${nineCount}`);
  console.log(`  TeeNineRatings: ${teeNineRatingCount}`);
  console.log(`  TeeHoleYardages: ${teeHoleYardageCount}`);
  console.log(`  Holes linked to nines: ${holesWithNine}`);
  console.log(`  RoundNines created: ${roundNineCount}`);
}

// Run the migration
migrateCourses()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
