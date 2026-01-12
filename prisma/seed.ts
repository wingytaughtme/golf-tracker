import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { allCourses, CourseData } from './data';

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
    },
  });

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

    // Create holes for this tee set
    await prisma.hole.createMany({
      data: teeSetData.holes.map(hole => ({
        tee_set_id: teeSet.id,
        hole_number: hole.hole_number,
        par: hole.par,
        distance: hole.distance,
        handicap_index: hole.handicap_index,
      })),
    });
  }

  return course;
}

async function main() {
  console.log('Seeding database with 25 golf courses...\n');

  // Seed all courses
  const courses: { id: string; name: string }[] = [];

  for (const courseData of allCourses) {
    try {
      const course = await seedCourse(courseData);
      courses.push({ id: course.id, name: course.name });
      console.log(`  ✓ ${course.name}`);
    } catch (error) {
      console.error(`  ✗ Failed to seed ${courseData.name}:`, error);
    }
  }

  console.log(`\nCreated ${courses.length} courses with tee sets and holes.`);

  // Create a demo user
  const hashedPassword = await bcrypt.hash('demo1234', 12);
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      password_hash: hashedPassword,
      name: 'Demo User',
    },
  });

  console.log('\nCreated demo user: demo@example.com / demo1234');

  // Get Pebble Beach for the demo player's home course
  const pebbleBeach = courses.find(c => c.name.includes('Pebble Beach'));

  // Create player for demo user
  const demoPlayer = await prisma.player.create({
    data: {
      user_id: demoUser.id,
      name: 'Demo User',
      email: 'demo@example.com',
      ghin_number: '1234567',
      home_course_id: pebbleBeach?.id,
    },
  });

  // Create some additional players (friends to play with)
  const player2 = await prisma.player.create({
    data: {
      name: 'John Smith',
      email: 'john@example.com',
      ghin_number: '2345678',
    },
  });

  const player3 = await prisma.player.create({
    data: {
      name: 'Mike Johnson',
      email: 'mike@example.com',
      ghin_number: '3456789',
    },
  });

  const player4 = await prisma.player.create({
    data: {
      name: 'Sarah Williams',
      email: 'sarah@example.com',
      ghin_number: '4567890',
    },
  });

  console.log('Created 4 players');

  // Get Pebble Beach Blue tees for sample round
  if (pebbleBeach) {
    const pebbleBlue = await prisma.teeSet.findFirst({
      where: {
        course_id: pebbleBeach.id,
        name: 'Blue',
      },
    });

    if (pebbleBlue) {
      // Create a completed round
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

      // Add players to the round
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

      const roundPlayer2 = await prisma.roundPlayer.create({
        data: {
          round_id: completedRound.id,
          player_id: player2.id,
          playing_handicap: 15.0,
          gross_score: 92,
          net_score: 77.0,
          position: 2,
        },
      });

      // Get holes for scoring
      const holes = await prisma.hole.findMany({
        where: { tee_set_id: pebbleBlue.id },
        orderBy: { hole_number: 'asc' },
      });

      // Create scores for demo player
      const demoScores = [5, 6, 4, 4, 3, 6, 3, 5, 5, 5, 4, 4, 5, 6, 4, 5, 3, 6]; // Total: 85
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

      console.log('Created sample round with scores');
    }

    // Add handicap history
    await prisma.handicapHistory.createMany({
      data: [
        {
          player_id: demoPlayer.id,
          handicap_index: 14.2,
          effective_date: new Date('2024-11-01'),
        },
        {
          player_id: demoPlayer.id,
          handicap_index: 13.5,
          effective_date: new Date('2024-12-01'),
        },
        {
          player_id: demoPlayer.id,
          handicap_index: 12.5,
          effective_date: new Date('2024-12-15'),
        },
      ],
    });

    console.log('Created handicap history');

    // Add favorite courses
    const torrey = courses.find(c => c.name.includes('Torrey Pines'));
    const bethpage = courses.find(c => c.name.includes('Bethpage'));

    const favoriteCourseData = [
      { user_id: demoUser.id, course_id: pebbleBeach.id },
    ];

    if (torrey) favoriteCourseData.push({ user_id: demoUser.id, course_id: torrey.id });
    if (bethpage) favoriteCourseData.push({ user_id: demoUser.id, course_id: bethpage.id });

    await prisma.favoriteCourse.createMany({
      data: favoriteCourseData,
    });

    console.log('Created favorite courses');
  }

  // Summary
  console.log('\n========================================');
  console.log('Database seeded successfully!');
  console.log('========================================');
  console.log('\nCourses by state:');

  const stateCount: Record<string, number> = {};
  allCourses.forEach(c => {
    stateCount[c.state] = (stateCount[c.state] || 0) + 1;
  });

  Object.entries(stateCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([state, count]) => {
      console.log(`  ${state}: ${count} course(s)`);
    });

  console.log('\nDemo credentials:');
  console.log('  Email: demo@example.com');
  console.log('  Password: demo1234');
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
