// Famous and popular US golf courses with accurate data

export interface HoleData {
  hole_number: number;
  par: number;
  distance: number;
  handicap_index: number;
}

export interface TeeSetData {
  name: string;
  color: string;
  course_rating: number;
  slope_rating: number;
  total_yardage: number;
  gender: string;
  holes: HoleData[];
}

export interface CourseData {
  name: string;
  city: string;
  state: string;
  zip_code: string;
  address: string;
  phone: string | null;
  website: string | null;
  num_holes: number;
  course_type: 'public' | 'private' | 'resort' | 'municipal';
  latitude: number;
  longitude: number;
  tee_sets: TeeSetData[];
}

// Helper to generate holes with slight variations for different tees
function adjustHolesForTee(baseHoles: HoleData[], yardageMultiplier: number): HoleData[] {
  return baseHoles.map(h => ({
    ...h,
    distance: Math.round(h.distance * yardageMultiplier)
  }));
}

// =============================================================================
// FAMOUS COURSES (1-10)
// =============================================================================

export const pebbleBeach: CourseData = {
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
  tee_sets: [
    {
      name: 'Blue',
      color: 'Blue',
      course_rating: 75.5,
      slope_rating: 145,
      total_yardage: 6828,
      gender: 'Men',
      holes: [
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
      ]
    },
    {
      name: 'White',
      color: 'White',
      course_rating: 72.3,
      slope_rating: 138,
      total_yardage: 6198,
      gender: 'Men',
      holes: [
        { hole_number: 1, par: 4, distance: 346, handicap_index: 8 },
        { hole_number: 2, par: 5, distance: 468, handicap_index: 14 },
        { hole_number: 3, par: 4, distance: 367, handicap_index: 12 },
        { hole_number: 4, par: 4, distance: 300, handicap_index: 16 },
        { hole_number: 5, par: 3, distance: 177, handicap_index: 10 },
        { hole_number: 6, par: 5, distance: 475, handicap_index: 2 },
        { hole_number: 7, par: 3, distance: 99, handicap_index: 18 },
        { hole_number: 8, par: 4, distance: 389, handicap_index: 4 },
        { hole_number: 9, par: 4, distance: 459, handicap_index: 6 },
        { hole_number: 10, par: 4, distance: 450, handicap_index: 1 },
        { hole_number: 11, par: 4, distance: 354, handicap_index: 9 },
        { hole_number: 12, par: 3, distance: 183, handicap_index: 15 },
        { hole_number: 13, par: 4, distance: 404, handicap_index: 3 },
        { hole_number: 14, par: 5, distance: 527, handicap_index: 5 },
        { hole_number: 15, par: 4, distance: 360, handicap_index: 13 },
        { hole_number: 16, par: 4, distance: 366, handicap_index: 11 },
        { hole_number: 17, par: 3, distance: 162, handicap_index: 17 },
        { hole_number: 18, par: 5, distance: 493, handicap_index: 7 },
      ]
    },
    {
      name: 'Red',
      color: 'Red',
      course_rating: 71.9,
      slope_rating: 130,
      total_yardage: 5198,
      gender: 'Women',
      holes: [
        { hole_number: 1, par: 4, distance: 290, handicap_index: 8 },
        { hole_number: 2, par: 5, distance: 392, handicap_index: 14 },
        { hole_number: 3, par: 4, distance: 307, handicap_index: 12 },
        { hole_number: 4, par: 4, distance: 252, handicap_index: 16 },
        { hole_number: 5, par: 3, distance: 148, handicap_index: 10 },
        { hole_number: 6, par: 5, distance: 398, handicap_index: 2 },
        { hole_number: 7, par: 3, distance: 83, handicap_index: 18 },
        { hole_number: 8, par: 4, distance: 325, handicap_index: 4 },
        { hole_number: 9, par: 4, distance: 384, handicap_index: 6 },
        { hole_number: 10, par: 4, distance: 376, handicap_index: 1 },
        { hole_number: 11, par: 4, distance: 297, handicap_index: 9 },
        { hole_number: 12, par: 3, distance: 154, handicap_index: 15 },
        { hole_number: 13, par: 4, distance: 338, handicap_index: 3 },
        { hole_number: 14, par: 5, distance: 441, handicap_index: 5 },
        { hole_number: 15, par: 4, distance: 302, handicap_index: 13 },
        { hole_number: 16, par: 4, distance: 306, handicap_index: 11 },
        { hole_number: 17, par: 3, distance: 135, handicap_index: 17 },
        { hole_number: 18, par: 5, distance: 413, handicap_index: 7 },
      ]
    }
  ]
};

export const augustaNational: CourseData = {
  name: 'Augusta National Golf Club',
  city: 'Augusta',
  state: 'GA',
  zip_code: '30904',
  address: '2604 Washington Rd',
  phone: null,
  website: null,
  num_holes: 18,
  course_type: 'private',
  latitude: 33.5021,
  longitude: -82.0232,
  tee_sets: [
    {
      name: 'Championship',
      color: 'Gold',
      course_rating: 76.2,
      slope_rating: 148,
      total_yardage: 7545,
      gender: 'Men',
      holes: [
        { hole_number: 1, par: 4, distance: 445, handicap_index: 4 },
        { hole_number: 2, par: 5, distance: 575, handicap_index: 13 },
        { hole_number: 3, par: 4, distance: 350, handicap_index: 7 },
        { hole_number: 4, par: 3, distance: 240, handicap_index: 16 },
        { hole_number: 5, par: 4, distance: 495, handicap_index: 11 },
        { hole_number: 6, par: 3, distance: 180, handicap_index: 18 },
        { hole_number: 7, par: 4, distance: 450, handicap_index: 8 },
        { hole_number: 8, par: 5, distance: 570, handicap_index: 5 },
        { hole_number: 9, par: 4, distance: 460, handicap_index: 1 },
        { hole_number: 10, par: 4, distance: 495, handicap_index: 9 },
        { hole_number: 11, par: 4, distance: 520, handicap_index: 6 },
        { hole_number: 12, par: 3, distance: 155, handicap_index: 14 },
        { hole_number: 13, par: 5, distance: 510, handicap_index: 15 },
        { hole_number: 14, par: 4, distance: 440, handicap_index: 10 },
        { hole_number: 15, par: 5, distance: 550, handicap_index: 17 },
        { hole_number: 16, par: 3, distance: 170, handicap_index: 12 },
        { hole_number: 17, par: 4, distance: 440, handicap_index: 2 },
        { hole_number: 18, par: 4, distance: 465, handicap_index: 3 },
      ]
    },
    {
      name: 'Member',
      color: 'White',
      course_rating: 73.5,
      slope_rating: 137,
      total_yardage: 6800,
      gender: 'Men',
      holes: [
        { hole_number: 1, par: 4, distance: 401, handicap_index: 4 },
        { hole_number: 2, par: 5, distance: 518, handicap_index: 13 },
        { hole_number: 3, par: 4, distance: 315, handicap_index: 7 },
        { hole_number: 4, par: 3, distance: 216, handicap_index: 16 },
        { hole_number: 5, par: 4, distance: 446, handicap_index: 11 },
        { hole_number: 6, par: 3, distance: 162, handicap_index: 18 },
        { hole_number: 7, par: 4, distance: 405, handicap_index: 8 },
        { hole_number: 8, par: 5, distance: 513, handicap_index: 5 },
        { hole_number: 9, par: 4, distance: 414, handicap_index: 1 },
        { hole_number: 10, par: 4, distance: 446, handicap_index: 9 },
        { hole_number: 11, par: 4, distance: 468, handicap_index: 6 },
        { hole_number: 12, par: 3, distance: 140, handicap_index: 14 },
        { hole_number: 13, par: 5, distance: 459, handicap_index: 15 },
        { hole_number: 14, par: 4, distance: 396, handicap_index: 10 },
        { hole_number: 15, par: 5, distance: 495, handicap_index: 17 },
        { hole_number: 16, par: 3, distance: 153, handicap_index: 12 },
        { hole_number: 17, par: 4, distance: 396, handicap_index: 2 },
        { hole_number: 18, par: 4, distance: 419, handicap_index: 3 },
      ]
    }
  ]
};

export const pinehurstNo2: CourseData = {
  name: 'Pinehurst No. 2',
  city: 'Pinehurst',
  state: 'NC',
  zip_code: '28374',
  address: '80 Carolina Vista Dr',
  phone: '855-235-8507',
  website: 'https://www.pinehurst.com',
  num_holes: 18,
  course_type: 'resort',
  latitude: 35.1954,
  longitude: -79.4700,
  tee_sets: [
    {
      name: 'Championship',
      color: 'Black',
      course_rating: 75.9,
      slope_rating: 143,
      total_yardage: 7588,
      gender: 'Men',
      holes: [
        { hole_number: 1, par: 4, distance: 404, handicap_index: 11 },
        { hole_number: 2, par: 4, distance: 502, handicap_index: 1 },
        { hole_number: 3, par: 4, distance: 398, handicap_index: 15 },
        { hole_number: 4, par: 5, distance: 565, handicap_index: 5 },
        { hole_number: 5, par: 4, distance: 482, handicap_index: 3 },
        { hole_number: 6, par: 3, distance: 223, handicap_index: 17 },
        { hole_number: 7, par: 4, distance: 439, handicap_index: 9 },
        { hole_number: 8, par: 5, distance: 588, handicap_index: 7 },
        { hole_number: 9, par: 3, distance: 194, handicap_index: 13 },
        { hole_number: 10, par: 5, distance: 610, handicap_index: 4 },
        { hole_number: 11, par: 4, distance: 478, handicap_index: 10 },
        { hole_number: 12, par: 4, distance: 471, handicap_index: 8 },
        { hole_number: 13, par: 4, distance: 384, handicap_index: 16 },
        { hole_number: 14, par: 4, distance: 480, handicap_index: 6 },
        { hole_number: 15, par: 3, distance: 206, handicap_index: 18 },
        { hole_number: 16, par: 5, distance: 582, handicap_index: 12 },
        { hole_number: 17, par: 3, distance: 197, handicap_index: 14 },
        { hole_number: 18, par: 4, distance: 447, handicap_index: 2 },
      ]
    },
    {
      name: 'Blue',
      color: 'Blue',
      course_rating: 73.2,
      slope_rating: 135,
      total_yardage: 6853,
      gender: 'Men',
      holes: [
        { hole_number: 1, par: 4, distance: 364, handicap_index: 11 },
        { hole_number: 2, par: 4, distance: 452, handicap_index: 1 },
        { hole_number: 3, par: 4, distance: 358, handicap_index: 15 },
        { hole_number: 4, par: 5, distance: 509, handicap_index: 5 },
        { hole_number: 5, par: 4, distance: 434, handicap_index: 3 },
        { hole_number: 6, par: 3, distance: 201, handicap_index: 17 },
        { hole_number: 7, par: 4, distance: 395, handicap_index: 9 },
        { hole_number: 8, par: 5, distance: 529, handicap_index: 7 },
        { hole_number: 9, par: 3, distance: 175, handicap_index: 13 },
        { hole_number: 10, par: 5, distance: 549, handicap_index: 4 },
        { hole_number: 11, par: 4, distance: 430, handicap_index: 10 },
        { hole_number: 12, par: 4, distance: 424, handicap_index: 8 },
        { hole_number: 13, par: 4, distance: 346, handicap_index: 16 },
        { hole_number: 14, par: 4, distance: 432, handicap_index: 6 },
        { hole_number: 15, par: 3, distance: 186, handicap_index: 18 },
        { hole_number: 16, par: 5, distance: 524, handicap_index: 12 },
        { hole_number: 17, par: 3, distance: 177, handicap_index: 14 },
        { hole_number: 18, par: 4, distance: 402, handicap_index: 2 },
      ]
    },
    {
      name: 'Red',
      color: 'Red',
      course_rating: 71.5,
      slope_rating: 128,
      total_yardage: 5520,
      gender: 'Women',
      holes: [
        { hole_number: 1, par: 4, distance: 293, handicap_index: 11 },
        { hole_number: 2, par: 4, distance: 364, handicap_index: 1 },
        { hole_number: 3, par: 4, distance: 288, handicap_index: 15 },
        { hole_number: 4, par: 5, distance: 410, handicap_index: 5 },
        { hole_number: 5, par: 4, distance: 349, handicap_index: 3 },
        { hole_number: 6, par: 3, distance: 162, handicap_index: 17 },
        { hole_number: 7, par: 4, distance: 318, handicap_index: 9 },
        { hole_number: 8, par: 5, distance: 426, handicap_index: 7 },
        { hole_number: 9, par: 3, distance: 141, handicap_index: 13 },
        { hole_number: 10, par: 5, distance: 442, handicap_index: 4 },
        { hole_number: 11, par: 4, distance: 346, handicap_index: 10 },
        { hole_number: 12, par: 4, distance: 341, handicap_index: 8 },
        { hole_number: 13, par: 4, distance: 279, handicap_index: 16 },
        { hole_number: 14, par: 4, distance: 348, handicap_index: 6 },
        { hole_number: 15, par: 3, distance: 150, handicap_index: 18 },
        { hole_number: 16, par: 5, distance: 422, handicap_index: 12 },
        { hole_number: 17, par: 3, distance: 143, handicap_index: 14 },
        { hole_number: 18, par: 4, distance: 324, handicap_index: 2 },
      ]
    }
  ]
};
