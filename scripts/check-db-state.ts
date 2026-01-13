import { config } from 'dotenv';
config({ path: '.env.local' });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const nines = await prisma.nine.count();
  const courses = await prisma.course.count();
  console.log('Total courses:', courses);
  console.log('Total nines:', nines);

  const holesWithNine = await prisma.hole.count({ where: { nine_id: { not: null } } });
  const holesWithoutNine = await prisma.hole.count({ where: { nine_id: null } });
  console.log('Holes with nine_id:', holesWithNine);
  console.log('Holes without nine_id:', holesWithoutNine);

  const teeNineRatings = await prisma.teeNineRating.count();
  console.log('TeeNineRating records:', teeNineRatings);

  const teeHoleYardages = await prisma.teeHoleYardage.count();
  console.log('TeeHoleYardage records:', teeHoleYardages);
}

check().finally(() => prisma.$disconnect());
