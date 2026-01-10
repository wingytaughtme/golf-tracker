// Export all course data
export type { CourseData, TeeSetData, HoleData } from './courses';

// Famous courses
export { pebbleBeach, augustaNational, pinehurstNo2 } from './courses';
export { tpcSawgrass, torreyPinesSouth, bethpageBlack, whistlingStraits } from './courses2';
export { kiawahOcean, bandonDunes, shadowCreek } from './courses3';

// Popular public courses
export { caddyShack as streamsongRed, chambersBay, cogsHill, rusticCanyon, arcadia as arcadiaBluffs } from './publicCourses1';
export { pga_west as pgaWest, bayHill, harborTown, lpgaIntl, halfMoonBay } from './publicCourses2';
export { worldGolf, kohlerBlackwolf, kapaluaBay, troonNorth, pasatimpo } from './publicCourses3';

// Import all for convenience
import { pebbleBeach, augustaNational, pinehurstNo2 } from './courses';
import { tpcSawgrass, torreyPinesSouth, bethpageBlack, whistlingStraits } from './courses2';
import { kiawahOcean, bandonDunes, shadowCreek } from './courses3';
import { caddyShack, chambersBay, cogsHill, rusticCanyon, arcadia } from './publicCourses1';
import { pga_west, bayHill, harborTown, lpgaIntl, halfMoonBay } from './publicCourses2';
import { worldGolf, kohlerBlackwolf, kapaluaBay, troonNorth, pasatimpo } from './publicCourses3';
import { CourseData } from './courses';

// All courses array for seeding
export const allCourses: CourseData[] = [
  // Famous courses (10)
  pebbleBeach,
  augustaNational,
  pinehurstNo2,
  tpcSawgrass,
  torreyPinesSouth,
  bethpageBlack,
  whistlingStraits,
  kiawahOcean,
  bandonDunes,
  shadowCreek,
  // Popular public courses (15)
  caddyShack,      // Streamsong Red, FL
  chambersBay,     // WA
  cogsHill,        // IL
  rusticCanyon,    // CA
  arcadia,         // Arcadia Bluffs, MI
  pga_west,        // CA
  bayHill,         // FL
  harborTown,      // SC
  lpgaIntl,        // FL
  halfMoonBay,     // CA
  worldGolf,       // FL
  kohlerBlackwolf, // WI
  kapaluaBay,      // HI
  troonNorth,      // AZ
  pasatimpo,       // CA
];
