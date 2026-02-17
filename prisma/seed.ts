import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { allCourses, personalCourses, CourseData } from './data';

const prisma = new PrismaClient();

async function seedCourse(courseData: CourseData): Promise<{ id: string; name: string; created: boolean }> {
  // Idempotent: find existing course by name + city + state
  let course = await prisma.course.findFirst({
    where: {
      name: courseData.name,
      city: courseData.city,
      state: courseData.state,
    },
    include: { tee_sets: true },
  });

  const courseFields = {
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
    source: 'seeded' as const,
  };

  const isNew = !course;

  if (course) {
    // Update existing course metadata
    course = await prisma.course.update({
      where: { id: course.id },
      data: courseFields,
      include: { tee_sets: true },
    });
  } else {
    // Create new course
    course = await prisma.course.create({
      data: courseFields,
      include: { tee_sets: true },
    });
  }

  // Seed tee sets and holes
  for (const teeSetData of courseData.tee_sets) {
    const existingTee = course.tee_sets.find(
      t => t.name === teeSetData.name && t.gender === teeSetData.gender
    );

    let teeSetId: string;

    if (existingTee) {
      // Update existing tee set ratings/yardage
      await prisma.teeSet.update({
        where: { id: existingTee.id },
        data: {
          color: teeSetData.color,
          course_rating: teeSetData.course_rating,
          slope_rating: teeSetData.slope_rating,
          total_yardage: teeSetData.total_yardage,
        },
      });
      teeSetId = existingTee.id;

      // Upsert holes for existing tee set (safe even if rounds reference these holes)
      for (const h of teeSetData.holes) {
        await prisma.hole.upsert({
          where: {
            tee_set_id_hole_number: {
              tee_set_id: teeSetId,
              hole_number: h.hole_number,
            },
          },
          update: {
            par: h.par,
            distance: h.distance,
            handicap_index: h.handicap_index,
          },
          create: {
            tee_set_id: teeSetId,
            hole_number: h.hole_number,
            par: h.par,
            distance: h.distance,
            handicap_index: h.handicap_index,
          },
        });
      }
    } else {
      // Create new tee set + bulk create holes
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
      teeSetId = teeSet.id;

      await prisma.hole.createMany({
        data: teeSetData.holes.map(h => ({
          tee_set_id: teeSetId,
          hole_number: h.hole_number,
          par: h.par,
          distance: h.distance,
          handicap_index: h.handicap_index,
        })),
      });
    }
  }

  return { id: course.id, name: course.name, created: isNew };
}

async function seedDemoUser(courses: { id: string; name: string }[]) {
  // Idempotent: check if demo user exists
  const existing = await prisma.user.findUnique({
    where: { email: 'demo@example.com' },
  });
  if (existing) {
    console.log('\n  Demo user already exists, skipping demo data.');
    return;
  }

  const hashedPassword = await bcrypt.hash('demo1234', 12);
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      password_hash: hashedPassword,
      name: 'Demo User',
    },
  });

  const pebbleBeach = courses.find(c => c.name.includes('Pebble Beach'));

  const demoPlayer = await prisma.player.create({
    data: {
      user_id: demoUser.id,
      name: 'Demo User',
      email: 'demo@example.com',
      ghin_number: '1234567',
      home_course_id: pebbleBeach?.id,
    },
  });

  const player2 = await prisma.player.create({
    data: { name: 'John Smith', email: 'john@example.com', ghin_number: '2345678' },
  });

  console.log('\n  Created demo user: demo@example.com / demo1234');
  console.log('  Created 3 players');

  if (pebbleBeach) {
    const pebbleBlue = await prisma.teeSet.findFirst({
      where: { course_id: pebbleBeach.id, name: 'Blue' },
    });

    if (pebbleBlue) {
      const completedRound = await prisma.round.create({
        data: {
          course_id: pebbleBeach.id,
          tee_set_id: pebbleBlue.id,
          created_by: demoUser.id,
          date_played: new Date('2024-12-15'),
          status: 'completed',
          round_type: 'casual',
          weather: 'Sunny',
          temperature: 68,
          notes: 'Great day on the course!',
          started_at: new Date('2024-12-15T08:00:00'),
          completed_at: new Date('2024-12-15T12:30:00'),
        },
      });

      const roundPlayer1 = await prisma.roundPlayer.create({
        data: {
          round_id: completedRound.id,
          player_id: demoPlayer.id,
          playing_handicap: 12.5,
          gross_score: 85,
          net_score: 72.5,
          position: 1,
        },
      });

      await prisma.roundPlayer.create({
        data: {
          round_id: completedRound.id,
          player_id: player2.id,
          playing_handicap: 15.0,
          gross_score: 92,
          net_score: 77.0,
          position: 2,
        },
      });

      const holes = await prisma.hole.findMany({
        where: { tee_set_id: pebbleBlue.id },
        orderBy: { hole_number: 'asc' },
      });

      const demoScores = [5, 6, 4, 4, 3, 6, 3, 5, 5, 5, 4, 4, 5, 6, 4, 5, 3, 6];
      for (let i = 0; i < holes.length; i++) {
        await prisma.score.create({
          data: {
            round_player_id: roundPlayer1.id,
            hole_id: holes[i].id,
            strokes: demoScores[i],
            putts: Math.floor(Math.random() * 2) + 1,
            fairway_hit: Math.random() > 0.4,
            green_in_regulation: demoScores[i] <= holes[i].par,
            penalties: Math.random() > 0.9 ? 1 : 0,
          },
        });
      }

      console.log('  Created sample round with scores');
    }

    await prisma.handicapHistory.createMany({
      data: [
        { player_id: demoPlayer.id, handicap_index: 14.2, effective_date: new Date('2024-11-01') },
        { player_id: demoPlayer.id, handicap_index: 13.5, effective_date: new Date('2024-12-01') },
        { player_id: demoPlayer.id, handicap_index: 12.5, effective_date: new Date('2024-12-15') },
      ],
    });

    console.log('  Created handicap history');
  }
}

async function main() {
  const personalOnly = process.env.SEED_PERSONAL_ONLY === 'true';
  const skipDemo = process.env.SEED_SKIP_DEMO === 'true' || personalOnly;
  const coursesToSeed = personalOnly ? personalCourses : allCourses;

  console.log(`Seeding ${coursesToSeed.length} courses${personalOnly ? ' (personal only)' : ''}...\n`);

  let created = 0;
  let updated = 0;
  const courses: { id: string; name: string }[] = [];

  for (const courseData of coursesToSeed) {
    try {
      const result = await seedCourse(courseData);
      courses.push({ id: result.id, name: result.name });
      if (result.created) {
        created++;
        console.log(`  + ${result.name}`);
      } else {
        updated++;
        console.log(`  ~ ${result.name} (updated)`);
      }
    } catch (error) {
      console.error(`  ✗ Failed to seed ${courseData.name}:`, error);
    }
  }

  console.log(`\nCourses: ${created} created, ${updated} updated (${courses.length} total).`);

  if (!skipDemo) {
    await seedDemoUser(courses);
  }

  // Summary
  console.log('\n========================================');
  console.log('Database seeded successfully!');
  console.log('========================================');

  const stateCount: Record<string, number> = {};
  coursesToSeed.forEach(c => {
    stateCount[c.state] = (stateCount[c.state] || 0) + 1;
  });

  console.log('\nCourses by state:');
  Object.entries(stateCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([state, count]) => {
      console.log(`  ${state}: ${count} course(s)`);
    });

  if (!skipDemo) {
    console.log('\nDemo credentials:');
    console.log('  Email: demo@example.com');
    console.log('  Password: demo1234');
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
