import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create sample courses
  const pebbleBeach = await prisma.course.create({
    data: {
      name: 'Pebble Beach Golf Links',
      city: 'Pebble Beach',
      state: 'CA',
      zip_code: '93953',
      address: '1700 17 Mile Dr',
      phone: '800-654-9300',
      website: 'https://www.pebblebeach.com',
      num_holes: 18,
      course_type: 'resort',
      latitude: 36.5725,
      longitude: -121.9486,
    },
  });

  const augusta = await prisma.course.create({
    data: {
      name: 'Augusta National Golf Club',
      city: 'Augusta',
      state: 'GA',
      zip_code: '30904',
      address: '2604 Washington Rd',
      num_holes: 18,
      course_type: 'private',
      latitude: 33.5021,
      longitude: -82.0232,
    },
  });

  const torrey = await prisma.course.create({
    data: {
      name: 'Torrey Pines Golf Course',
      city: 'La Jolla',
      state: 'CA',
      zip_code: '92037',
      address: '11480 N Torrey Pines Rd',
      phone: '858-452-3226',
      website: 'https://www.torreypinesgolfcourse.com',
      num_holes: 18,
      course_type: 'municipal',
      latitude: 32.9005,
      longitude: -117.2518,
    },
  });

  console.log('Created courses:', pebbleBeach.name, augusta.name, torrey.name);

  // Create tee sets for Pebble Beach
  const pebbleBlue = await prisma.teeSet.create({
    data: {
      course_id: pebbleBeach.id,
      name: 'Blue',
      color: 'Blue',
      course_rating: 75.5,
      slope_rating: 145,
      total_yardage: 6828,
      gender: 'Men',
    },
  });

  const pebbleWhite = await prisma.teeSet.create({
    data: {
      course_id: pebbleBeach.id,
      name: 'White',
      color: 'White',
      course_rating: 72.3,
      slope_rating: 138,
      total_yardage: 6198,
      gender: 'Men',
    },
  });

  const pebbleRed = await prisma.teeSet.create({
    data: {
      course_id: pebbleBeach.id,
      name: 'Red',
      color: 'Red',
      course_rating: 71.9,
      slope_rating: 130,
      total_yardage: 5198,
      gender: 'Women',
    },
  });

  // Create tee sets for Torrey Pines
  const torreyBlack = await prisma.teeSet.create({
    data: {
      course_id: torrey.id,
      name: 'Black',
      color: 'Black',
      course_rating: 76.8,
      slope_rating: 148,
      total_yardage: 7258,
      gender: 'Men',
    },
  });

  const torreyBlue = await prisma.teeSet.create({
    data: {
      course_id: torrey.id,
      name: 'Blue',
      color: 'Blue',
      course_rating: 73.5,
      slope_rating: 136,
      total_yardage: 6615,
      gender: 'Men',
    },
  });

  console.log('Created tee sets');

  // Create holes for Pebble Beach Blue tees
  const pebbleHoles = [
    { hole_number: 1, par: 4, distance: 381, handicap_index: 8 },
    { hole_number: 2, par: 5, distance: 516, handicap_index: 14 },
    { hole_number: 3, par: 4, distance: 404, handicap_index: 12 },
    { hole_number: 4, par: 4, distance: 331, handicap_index: 16 },
    { hole_number: 5, par: 3, distance: 195, handicap_index: 10 },
    { hole_number: 6, par: 5, distance: 523, handicap_index: 2 },
    { hole_number: 7, par: 3, distance: 109, handicap_index: 18 },
    { hole_number: 8, par: 4, distance: 428, handicap_index: 4 },
    { hole_number: 9, par: 4, distance: 505, handicap_index: 6 },
    { hole_number: 10, par: 4, distance: 495, handicap_index: 1 },
    { hole_number: 11, par: 4, distance: 390, handicap_index: 9 },
    { hole_number: 12, par: 3, distance: 202, handicap_index: 15 },
    { hole_number: 13, par: 4, distance: 445, handicap_index: 3 },
    { hole_number: 14, par: 5, distance: 580, handicap_index: 5 },
    { hole_number: 15, par: 4, distance: 397, handicap_index: 13 },
    { hole_number: 16, par: 4, distance: 403, handicap_index: 11 },
    { hole_number: 17, par: 3, distance: 178, handicap_index: 17 },
    { hole_number: 18, par: 5, distance: 543, handicap_index: 7 },
  ];

  for (const hole of pebbleHoles) {
    await prisma.hole.create({
      data: {
        tee_set_id: pebbleBlue.id,
        ...hole,
      },
    });
  }

  // Create holes for Torrey Pines Blue tees
  const torreyHoles = [
    { hole_number: 1, par: 4, distance: 392, handicap_index: 10 },
    { hole_number: 2, par: 4, distance: 389, handicap_index: 12 },
    { hole_number: 3, par: 3, distance: 200, handicap_index: 16 },
    { hole_number: 4, par: 5, distance: 545, handicap_index: 4 },
    { hole_number: 5, par: 4, distance: 453, handicap_index: 2 },
    { hole_number: 6, par: 4, distance: 395, handicap_index: 8 },
    { hole_number: 7, par: 4, distance: 418, handicap_index: 6 },
    { hole_number: 8, par: 3, distance: 167, handicap_index: 18 },
    { hole_number: 9, par: 5, distance: 569, handicap_index: 14 },
    { hole_number: 10, par: 4, distance: 445, handicap_index: 1 },
    { hole_number: 11, par: 3, distance: 221, handicap_index: 15 },
    { hole_number: 12, par: 4, distance: 454, handicap_index: 3 },
    { hole_number: 13, par: 5, distance: 568, handicap_index: 5 },
    { hole_number: 14, par: 4, distance: 435, handicap_index: 7 },
    { hole_number: 15, par: 4, distance: 388, handicap_index: 9 },
    { hole_number: 16, par: 3, distance: 227, handicap_index: 17 },
    { hole_number: 17, par: 4, distance: 453, handicap_index: 11 },
    { hole_number: 18, par: 5, distance: 541, handicap_index: 13 },
  ];

  for (const hole of torreyHoles) {
    await prisma.hole.create({
      data: {
        tee_set_id: torreyBlue.id,
        ...hole,
      },
    });
  }

  console.log('Created holes');

  // Create a demo user
  const hashedPassword = await bcrypt.hash('demo1234', 12);
  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@example.com',
      password_hash: hashedPassword,
      name: 'Demo User',
    },
  });

  console.log('Created demo user: demo@example.com / demo1234');

  // Create player for demo user
  const demoPlayer = await prisma.player.create({
    data: {
      user_id: demoUser.id,
      name: 'Demo User',
      email: 'demo@example.com',
      ghin_number: '1234567',
      home_course_id: pebbleBeach.id,
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

  console.log('Created players');

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

  // Add handicap history
  await prisma.handicapHistory.create({
    data: {
      player_id: demoPlayer.id,
      handicap_index: 14.2,
      effective_date: new Date('2024-11-01'),
    },
  });

  await prisma.handicapHistory.create({
    data: {
      player_id: demoPlayer.id,
      handicap_index: 13.5,
      effective_date: new Date('2024-12-01'),
    },
  });

  await prisma.handicapHistory.create({
    data: {
      player_id: demoPlayer.id,
      handicap_index: 12.5,
      effective_date: new Date('2024-12-15'),
    },
  });

  console.log('Created handicap history');

  // Add favorite course
  await prisma.favoriteCourse.create({
    data: {
      user_id: demoUser.id,
      course_id: pebbleBeach.id,
    },
  });

  await prisma.favoriteCourse.create({
    data: {
      user_id: demoUser.id,
      course_id: torrey.id,
    },
  });

  console.log('Created favorite courses');

  console.log('\n✅ Database seeded successfully!');
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
