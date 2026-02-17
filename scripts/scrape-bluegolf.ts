/**
 * BlueGolf Scorecard Scraper
 *
 * Fetches hole-by-hole data (par, yardage, handicap index) from BlueGolf
 * detailed scorecard pages for personal courses and writes an updated
 * personalCourses.ts with holes populated.
 *
 * Usage:
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/scrape-bluegolf.ts
 *
 * Data source: The "Show All" summary table on the detailed scorecard page at
 *   course.bluegolf.com/bluegolf/course/course/{slug}/detailedscorecard.htm
 *
 * The table contains: tee name + per-hole yardage for each tee, plus
 * Men's/Women's par and handicap rows. We match BlueGolf tees to our
 * personalCourses tees by course_rating + slope_rating (exact match).
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import {
  olympiaFieldsNorth,
  olympiaFieldsSouth,
  prestwickCC,
  greenGardenGold,
  sugarSprings,
  pheasantRunNS,
  pheasantRunSW,
  pheasantRunWN,
  maumeeBay,
  theDream,
  theNightmare,
  cogHill1,
  cogHill2,
  cogHill3,
  cogHill4,
  clarkLake,
} from '../prisma/data/personalCourses';
import { CourseData, TeeSetData, HoleData } from '../prisma/data/courses';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BlueGolfTeeInfo {
  name: string;         // e.g. "Black", "Blue", "White/Green"
  gender: 'M' | 'L';   // M = men's, L = ladies
  rating: number;       // course rating
  slope: number;        // slope rating
}

interface ParsedScorecard {
  teeInfo: BlueGolfTeeInfo[];    // tee metadata from dropdown
  mensTeeRows: TeeRow[];         // men's tee yardage rows from Show All table
  womensTeeRows: TeeRow[];       // women's tee yardage rows from Show All table
  mensHcp: number[];             // men's handicap per hole (18 values)
  mensPar: number[];             // men's par per hole (18 values)
  womensHcp: number[];           // women's handicap per hole (18 values)
  womensPar: number[];           // women's par per hole (18 values)
}

interface TeeRow {
  name: string;
  yardages: number[];  // 18 hole yardages
  total: number;
}

interface CourseConfig {
  slug: string;
  course: CourseData;
  varName: string;
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const COURSES: CourseConfig[] = [
  { slug: 'olympiafieldscc', course: olympiaFieldsNorth, varName: 'olympiaFieldsNorth' },
  { slug: 'olympiafieldsccsouth', course: olympiaFieldsSouth, varName: 'olympiaFieldsSouth' },
  { slug: 'prestwickcc1', course: prestwickCC, varName: 'prestwickCC' },
  { slug: 'greengardencountryclub', course: greenGardenGold, varName: 'greenGardenGold' },
  { slug: 'sugarspringscc', course: sugarSprings, varName: 'sugarSprings' },
  { slug: 'pheasantrungolfclub', course: pheasantRunNS, varName: 'pheasantRunNS' },
  { slug: 'pheasantrungcsw', course: pheasantRunSW, varName: 'pheasantRunSW' },
  { slug: 'pheasantrungcwn', course: pheasantRunWN, varName: 'pheasantRunWN' },
  { slug: 'maumeebay', course: maumeeBay, varName: 'maumeeBay' },
  { slug: 'dreamgc', course: theDream, varName: 'theDream' },
  { slug: 'nightmare', course: theNightmare, varName: 'theNightmare' },
  { slug: 'coghill1', course: cogHill1, varName: 'cogHill1' },
  { slug: 'coghillgolfcountryclub', course: cogHill2, varName: 'cogHill2' },
  { slug: 'coghill3', course: cogHill3, varName: 'cogHill3' },
  { slug: 'coghilldubsdread4', course: cogHill4, varName: 'cogHill4' },
];

const BLUEGOLF_BASE = 'https://course.bluegolf.com/bluegolf/course/course';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;
const FETCH_TIMEOUT_MS = 30000;
const CACHE_DIR = path.resolve(__dirname, '../.bluegolf-cache');

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

function fetchPage(slug: string): string {
  // Check cache first
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cachePath = path.join(CACHE_DIR, `${slug}.html`);

  if (fs.existsSync(cachePath)) {
    const cached = fs.readFileSync(cachePath, 'utf-8');
    if (cached.length > 1000 && !cached.includes('captcha')) {
      console.log(`  Using cached file (${(cached.length / 1024).toFixed(0)}KB)`);
      return cached;
    }
  }

  const url = `${BLUEGOLF_BASE}/${slug}/detailedscorecard.htm`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Use curl — BlueGolf's AWS WAF blocks Node's TLS fingerprint
      const html = execSync(
        `curl -s -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" -H "Accept: text/html" --max-time ${FETCH_TIMEOUT_MS / 1000} "${url}"`,
        { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 },
      );

      if (!html || html.length < 1000) {
        throw new Error(`Response too small (${html.length} bytes) — may be rate limited`);
      }

      // Check for WAF block
      if (html.includes('captcha') || html.includes('aws-waf')) {
        throw new Error('WAF CAPTCHA block — wait longer between requests');
      }

      // Cache the response
      fs.writeFileSync(cachePath, html, 'utf-8');
      return html;
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error(`  [attempt ${attempt}/${MAX_RETRIES}] ${slug}: ${msg.substring(0, 120)}`);
      if (attempt < MAX_RETRIES) {
        console.log(`  Waiting ${RETRY_DELAY_MS * attempt / 1000}s before retry...`);
        execSync(`sleep ${RETRY_DELAY_MS * attempt / 1000}`);
      } else {
        throw new Error(`Failed to fetch ${slug} after ${MAX_RETRIES} attempts — try again later`);
      }
    }
  }
  throw new Error('unreachable');
}

// ---------------------------------------------------------------------------
// HTML parsing helpers
// ---------------------------------------------------------------------------

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').replace(/&#160;/g, '').replace(/&amp;/g, '&').replace(/&emsp;/g, '').replace(/&#x2713;/g, '').trim();
}

function parseTableRows(tableHtml: string): string[][] {
  const rows: string[][] = [];
  const rowMatches = tableHtml.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || [];

  for (const rowHtml of rowMatches) {
    const cellMatches = rowHtml.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi) || [];
    const cells = cellMatches.map(c => stripTags(c)).filter(c => c.length > 0);
    if (cells.length > 0) {
      rows.push(cells);
    }
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Parse scorecard data from HTML
// ---------------------------------------------------------------------------

function parseScorecard(html: string): ParsedScorecard {
  // 1. Extract tee info from dropdown items
  //    Pattern: ddm-first float-right">(M - 76.6/150)
  //    Preceding text has tee name in a span like: >Black<
  const teeInfo: BlueGolfTeeInfo[] = [];
  const dropdownPattern = /dropdown-tee-0-(\d+)"[\s\S]*?<span[^>]*>([^<]+)<\/span>[\s\S]*?ddm-first[^"]*">\(([ML])\s*-\s*([\d.]+)\/([\d]+)\)/g;
  let dm;
  const seenIndices = new Set<string>();
  while ((dm = dropdownPattern.exec(html)) !== null) {
    const idx = dm[1];
    if (seenIndices.has(idx)) continue; // duplicated in page
    seenIndices.add(idx);
    teeInfo.push({
      name: dm[2].trim(),
      gender: dm[3] as 'M' | 'L',
      rating: parseFloat(dm[4]),
      slope: parseInt(dm[5], 10),
    });
  }

  // 2. Find the last "Show All" summary table
  //    It's the last <table> after the last "Show All" link
  const showAllIndices: number[] = [];
  let searchIdx = 0;
  while (true) {
    const idx = html.indexOf('Show All', searchIdx);
    if (idx === -1) break;
    showAllIndices.push(idx);
    searchIdx = idx + 1;
  }

  if (showAllIndices.length === 0) {
    throw new Error('Could not find "Show All" section in page');
  }

  const lastShowAll = showAllIndices[showAllIndices.length - 1];
  const afterShowAll = html.substring(lastShowAll);

  // Find the table
  const tableMatch = afterShowAll.match(/<table[^>]*>([\s\S]*?)<\/table>/i);
  if (!tableMatch) {
    throw new Error('Could not find summary table after "Show All"');
  }

  const rows = parseTableRows(tableMatch[0]);

  // 3. Parse the table rows
  //    Structure:
  //      Row 0: Header (Tee, 1, 2, ..., 18, Out, In, Tot)
  //      Rows 1..N: Men's tee rows (name, 18 yardages, out, in, total)
  //      Men's Hcp row
  //      (empty row)
  //      Men's Par row
  //      Women's Par row
  //      (empty row)
  //      Women's Hcp row
  //      Rows after: Women's tee rows
  const mensTeeRows: TeeRow[] = [];
  const womensTeeRows: TeeRow[] = [];
  let mensHcp: number[] = [];
  let mensPar: number[] = [];
  let womensHcp: number[] = [];
  let womensPar: number[] = [];

  let section: 'mens_tees' | 'after_mens_hcp' | 'womens_tees' = 'mens_tees';

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // Normalize: strip all non-ASCII apostrophes, lowercase
    const label = (row[0] || '').toLowerCase().replace(/[\u2018\u2019\u0027\u2032]/g, "'");

    // Detect special rows by checking if label contains key words
    const isHcp = label.includes('hcp') || label.includes('handicap');
    const isPar = label.includes('par');
    const isMens = label.includes('men') && !label.includes('women');
    const isWomens = label.includes('women') || label.includes('ladies') || label.includes('lady');

    if (isHcp && (isMens || (!isWomens && section === 'mens_tees'))) {
      mensHcp = extractHoleValues(row);
      section = 'after_mens_hcp';
      continue;
    }
    if (isPar && isMens) {
      mensPar = extractHoleValues(row);
      continue;
    }
    if (isPar && isWomens) {
      womensPar = extractHoleValues(row);
      continue;
    }
    // Shared "Par" row (no Men's/Women's prefix) — assign to both
    if (isPar && !isMens && !isWomens) {
      const vals = extractHoleValues(row);
      if (mensPar.length === 0) mensPar = vals;
      if (womensPar.length === 0) womensPar = vals;
      continue;
    }
    if (isHcp && (isWomens || section !== 'mens_tees')) {
      womensHcp = extractHoleValues(row);
      section = 'womens_tees';
      continue;
    }

    // Skip if it looks like a label row (not a tee yardage row)
    if (isPar || isHcp) continue;

    // Tee row: first cell is tee name, rest are numbers
    if (row.length >= 19 && /^\d+$/.test(row[1])) {
      const teeRow = parseTeeRow(row);
      if (teeRow) {
        if (section === 'mens_tees') {
          mensTeeRows.push(teeRow);
        } else if (section === 'womens_tees') {
          womensTeeRows.push(teeRow);
        }
      }
    }
  }

  // Fallback: if mensHcp is still empty, try parsing from individual tee sections
  if (mensHcp.length === 0) {
    mensHcp = extractHcpFromIndividualSections(html, 'M');
  }
  if (womensHcp.length === 0) {
    womensHcp = extractHcpFromIndividualSections(html, 'L');
  }

  return { teeInfo, mensTeeRows, womensTeeRows, mensHcp, mensPar, womensHcp, womensPar };
}

function extractHoleValues(row: string[]): number[] {
  // Row format: [label, h1..h9, (Out), h10..h18, (In), (Total)]
  // For Par/Hcp rows, Out/In/Total are summaries we need to skip.
  // Parse all numbers first, then determine which are hole values.
  const allNums: number[] = [];
  for (let i = 1; i < row.length; i++) {
    const val = parseInt(row[i], 10);
    if (!isNaN(val)) allNums.push(val);
  }

  // If exactly 18 values, return as-is (Hcp rows with no totals)
  if (allNums.length === 18) return allNums;

  // If 21 values: h1-h9, Out, h10-h18, In, Total
  if (allNums.length === 21) {
    return [...allNums.slice(0, 9), ...allNums.slice(10, 19)];
  }

  // If 20 values: h1-h9, Out, h10-h18, In (no grand total)
  if (allNums.length === 20) {
    return [...allNums.slice(0, 9), ...allNums.slice(10, 19)];
  }

  // If 19 values: h1-h9, h10-h18, Total (no Out/In subtotals)
  if (allNums.length === 19) {
    return allNums.slice(0, 18);
  }

  // Fallback: take first 18 values
  if (allNums.length >= 18) {
    return allNums.slice(0, 18);
  }

  return allNums;
}

function parseTeeRow(row: string[]): TeeRow | null {
  const name = row[0];
  const yardages: number[] = [];

  for (let i = 1; i < row.length; i++) {
    const val = parseInt(row[i], 10);
    if (!isNaN(val)) {
      yardages.push(val);
    }
  }

  // Expect: 9 holes + out total + 9 holes + in total + grand total = 21 numbers
  // Or: 9 + 9 + totals variants
  if (yardages.length >= 20) {
    // Standard layout: h1-h9, Out, h10-h18, In, Tot
    const holes = [...yardages.slice(0, 9), ...yardages.slice(10, 19)];
    const total = yardages[yardages.length - 1];
    return { name, yardages: holes, total };
  }

  return null;
}

function extractHcpFromIndividualSections(html: string, gender: 'M' | 'L'): number[] {
  // Find individual per-tee scorecard sections which have Hcp rows
  // Look for the first tee of the right gender
  // Each section pattern: ...rating...slope...Tee 1 2 3...yds...Par...Hcp...
  const pattern = gender === 'M'
    ? /\(M\s*-[\s\S]*?Hcp<\/td>((?:<td[^>]*>\d+<\/td>[\s]*){18})/gi
    : /\(L\s*-[\s\S]*?Hcp<\/td>((?:<td[^>]*>\d+<\/td>[\s]*){18})/gi;

  const match = pattern.exec(html);
  if (match) {
    const nums = match[1].match(/>\s*(\d+)\s*</g) || [];
    return nums.map(n => parseInt(n.replace(/[><\s]/g, ''), 10));
  }
  return [];
}

// ---------------------------------------------------------------------------
// Tee matching
// ---------------------------------------------------------------------------

interface MatchedTeeData {
  yardages: number[];    // 18 hole yardages
  par: number[];         // 18 hole pars
  hcp: number[];         // 18 hole handicaps
}

function findMatchingTee(
  teeSet: TeeSetData,
  scorecard: ParsedScorecard,
): MatchedTeeData | null {
  const isWomen = teeSet.gender === 'Women';

  // Strategy 1: Match by course_rating + slope_rating (most reliable)
  for (let i = 0; i < scorecard.teeInfo.length; i++) {
    const info = scorecard.teeInfo[i];
    if (isWomen && info.gender !== 'L') continue;
    if (!isWomen && info.gender !== 'M') continue;

    if (Math.abs(info.rating - teeSet.course_rating) < 0.15 &&
        info.slope === teeSet.slope_rating) {
      // Found a rating/slope match — now find the corresponding yardage row
      const teeRows = isWomen ? scorecard.womensTeeRows : scorecard.mensTeeRows;
      const targetRow = findTeeRowByName(info.name, teeRows);

      if (targetRow) {
        return {
          yardages: targetRow.yardages,
          par: isWomen ? scorecard.womensPar : scorecard.mensPar,
          hcp: isWomen ? scorecard.womensHcp : scorecard.mensHcp,
        };
      }

      // If women's tee not found in women's rows, it might share a men's row
      if (isWomen) {
        const mensRow = findTeeRowByName(info.name, scorecard.mensTeeRows);
        if (mensRow) {
          return {
            yardages: mensRow.yardages,
            par: scorecard.womensPar,
            hcp: scorecard.womensHcp,
          };
        }
      }
    }
  }

  // Strategy 2: Match by tee name/color + yardage proximity
  const teeRows = isWomen ? scorecard.womensTeeRows : scorecard.mensTeeRows;
  const allRows = [...teeRows, ...(isWomen ? scorecard.mensTeeRows : [])];

  for (const row of allRows) {
    const bgName = row.name.toLowerCase();
    const tsColor = teeSet.color.toLowerCase();
    const tsName = teeSet.name.toLowerCase();

    const nameMatch = bgName === tsColor || bgName === tsName ||
      bgName.includes(tsColor) || tsColor.includes(bgName);
    const yardageClose = Math.abs(row.total - teeSet.total_yardage) <= 150;

    if (nameMatch && yardageClose) {
      return {
        yardages: row.yardages,
        par: isWomen ? scorecard.womensPar : scorecard.mensPar,
        hcp: isWomen ? scorecard.womensHcp : scorecard.mensHcp,
      };
    }
  }

  return null;
}

function findTeeRowByName(name: string, rows: TeeRow[]): TeeRow | null {
  const target = name.toLowerCase();
  return rows.find(r => r.name.toLowerCase() === target) || null;
}

// ---------------------------------------------------------------------------
// Build HoleData
// ---------------------------------------------------------------------------

function buildHoleData(match: MatchedTeeData): HoleData[] {
  const holes: HoleData[] = [];
  for (let i = 0; i < 18; i++) {
    holes.push({
      hole_number: i + 1,
      par: match.par[i],
      distance: match.yardages[i],
      handicap_index: match.hcp[i],
    });
  }
  return holes;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateHoles(holes: HoleData[], courseName: string, teeName: string): string[] {
  const errors: string[] = [];

  if (holes.length !== 18) {
    errors.push(`${courseName} / ${teeName}: expected 18 holes, got ${holes.length}`);
    return errors;
  }

  for (let i = 0; i < holes.length; i++) {
    if (holes[i].hole_number !== i + 1) {
      errors.push(`${courseName} / ${teeName}: hole ${i + 1} has number ${holes[i].hole_number}`);
    }
  }

  const totalPar = holes.reduce((s, h) => s + h.par, 0);
  if (totalPar < 60 || totalPar > 80) {
    errors.push(`${courseName} / ${teeName}: total par ${totalPar} out of range`);
  }

  const handicaps = holes.map(h => h.handicap_index).sort((a, b) => a - b);
  const expected = Array.from({ length: 18 }, (_, i) => i + 1);
  if (JSON.stringify(handicaps) !== JSON.stringify(expected)) {
    errors.push(`${courseName} / ${teeName}: handicap indices not 1-18 unique (got ${handicaps.join(',')})`);
  }

  return errors;
}

// ---------------------------------------------------------------------------
// Code generation (unchanged from original)
// ---------------------------------------------------------------------------

function generateHolesArray(holes: HoleData[]): string {
  const lines = holes.map(h =>
    `        { hole_number: ${h.hole_number}, par: ${h.par}, distance: ${h.distance}, handicap_index: ${h.handicap_index} },`
  );
  return `[\n${lines.join('\n')}\n      ]`;
}

function generateTeeSet(tee: TeeSetData): string {
  const holesStr = tee.holes.length > 0
    ? generateHolesArray(tee.holes)
    : '[]';

  return `    {
      name: '${tee.name}',
      color: '${tee.color}',
      course_rating: ${tee.course_rating},
      slope_rating: ${tee.slope_rating},
      total_yardage: ${tee.total_yardage},
      gender: '${tee.gender}',
      holes: ${holesStr},
    }`;
}

function generateCourse(varName: string, course: CourseData): string {
  const ninePart = course.nines
    ? `\n  nines: [\n${course.nines.map(n => `    { name: '${n.name}', nine_type: '${n.nine_type}', display_order: ${n.display_order} },`).join('\n')}\n  ],`
    : '';

  const mensTees = course.tee_sets.filter(t => t.gender === 'Men');
  const womensTees = course.tee_sets.filter(t => t.gender === 'Women');

  let teeSetsStr = mensTees.map(t => generateTeeSet(t)).join(',\n');
  if (womensTees.length > 0) {
    teeSetsStr += ',\n    // Women\'s rated tees\n';
    teeSetsStr += womensTees.map(t => generateTeeSet(t)).join(',\n');
  }

  return `export const ${varName}: CourseData = {
  name: '${course.name.replace(/'/g, "\\'")}',
  city: '${course.city}',
  state: '${course.state}',
  zip_code: '${course.zip_code}',
  address: '${course.address.replace(/'/g, "\\'")}',
  phone: ${course.phone ? `'${course.phone}'` : 'null'},
  website: ${course.website ? `'${course.website}'` : 'null'},
  num_holes: ${course.num_holes},
  course_type: '${course.course_type}',
  latitude: ${course.latitude},
  longitude: ${course.longitude},${ninePart}
  tee_sets: [
${teeSetsStr},
  ],
};`;
}

function generateFile(courses: { varName: string; course: CourseData }[]): string {
  const lines: string[] = [
    '// Personal courses for friends-beta seeding',
    '// Course-level data + hole-by-hole data from BlueGolf scorecards.',
    '// Clark Lake hole data to be populated manually.',
    '',
    "import { CourseData } from './courses';",
    '',
  ];

  const headers: Record<string, string> = {
    olympiaFieldsNorth: [
      '// =============================================================================',
      '// OLYMPIA FIELDS COUNTRY CLUB - NORTH COURSE',
      '// Par 70, Private, Olympia Fields IL',
      '// Designer: Willie Park Jr. (original)',
      '// =============================================================================',
    ].join('\n'),
    olympiaFieldsSouth: [
      '// =============================================================================',
      '// OLYMPIA FIELDS COUNTRY CLUB - SOUTH COURSE',
      '// Par 72, Private, Olympia Fields IL',
      '// Designer: Tom Bendelow (original), Andy Staples (2021-22 restoration)',
      '// =============================================================================',
    ].join('\n'),
    prestwickCC: [
      '// =============================================================================',
      '// PRESTWICK COUNTRY CLUB',
      '// Par 72, Private, Frankfort IL',
      '// Designer: E. Lawrence Packard, ASGCA (1964)',
      '// =============================================================================',
    ].join('\n'),
    greenGardenGold: [
      '// =============================================================================',
      '// GREEN GARDEN COUNTRY CLUB - GOLD COURSE',
      '// Par 72, Public, Frankfort IL',
      '// Designer: Buz Diddier (1991)',
      '// Note: Facility has 45 holes (Gold 18, Blue 18, Links 9). Only Gold seeded.',
      '// =============================================================================',
    ].join('\n'),
    sugarSprings: [
      '// =============================================================================',
      '// SUGAR SPRINGS GOLF COURSE',
      '// Par 72, Public, Gladwin MI',
      '// Designer: Jerry Matthews, ASGCA (1978)',
      '// =============================================================================',
    ].join('\n'),
    pheasantRunNS: [
      '// =============================================================================',
      '// PHEASANT RUN GOLF CLUB - NORTH-SOUTH',
      '// Par 72, Public, Canton MI',
      '// Designer: Arthur Hills (1995)',
      '// =============================================================================',
    ].join('\n'),
    pheasantRunSW: [
      '// =============================================================================',
      '// PHEASANT RUN GOLF CLUB - SOUTH-WEST',
      '// Par 72, Public, Canton MI',
      '// Designer: Arthur Hills (1995)',
      '// =============================================================================',
    ].join('\n'),
    pheasantRunWN: [
      '// =============================================================================',
      '// PHEASANT RUN GOLF CLUB - WEST-NORTH',
      '// Par 72, Public, Canton MI',
      '// Designer: Arthur Hills (1995)',
      '// =============================================================================',
    ].join('\n'),
    maumeeBay: [
      '// =============================================================================',
      '// MAUMEE BAY GOLF COURSE',
      '// Par 72, Resort, Oregon OH',
      '// Designer: Arthur Hills (1991)',
      '// =============================================================================',
    ].join('\n'),
    theDream: [
      '// =============================================================================',
      '// THE DREAM GOLF COURSE',
      '// Par 72, Public, West Branch MI',
      '// Designer: Tom & Dan Courtemanche (1997)',
      '// =============================================================================',
    ].join('\n'),
    theNightmare: [
      '// =============================================================================',
      '// THE NIGHTMARE GOLF COURSE',
      '// Par 72, Public, West Branch MI',
      '// Designer: Tom & Dan Courtemanche (2003)',
      '// =============================================================================',
    ].join('\n'),
    cogHill1: [
      '// =============================================================================',
      '// COG HILL GOLF & COUNTRY CLUB - COURSE 1',
      '// Par 71, Public, Lemont IL',
      '// Designer: David McIntosh',
      '// =============================================================================',
    ].join('\n'),
    cogHill2: [
      '// =============================================================================',
      '// COG HILL GOLF & COUNTRY CLUB - COURSE 2',
      '// Par 72, Public, Lemont IL',
      '// Designer: McIntosh/Coghill',
      '// =============================================================================',
    ].join('\n'),
    cogHill3: [
      '// =============================================================================',
      '// COG HILL GOLF & COUNTRY CLUB - COURSE 3',
      '// Par 72, Public, Lemont IL',
      '// Designer: McIntosh/Wilson',
      '// =============================================================================',
    ].join('\n'),
    cogHill4: [
      '// =============================================================================',
      '// COG HILL GOLF & COUNTRY CLUB - COURSE 4 (DUBSDREAD)',
      '// Par 72, Public, Lemont IL',
      '// Designer: Dick Wilson & Joe Lee',
      '// =============================================================================',
    ].join('\n'),
    clarkLake: [
      '// =============================================================================',
      '// CLARK LAKE GOLF COURSE',
      '// 27 holes (3 nines), Public, Brooklyn MI',
      '// Designer: Frank Forgione (South/East 1971, North 1976)',
      '// NOTE: No USGA course ratings available — tees have placeholder 0.0/0 values.',
      '// Update ratings after contacting course or GAM.',
      '// =============================================================================',
    ].join('\n'),
  };

  for (const { varName, course } of courses) {
    lines.push(headers[varName] || '');
    lines.push('');
    lines.push(generateCourse(varName, course));
    lines.push('');
  }

  lines.push('// All personal courses for seeding');
  lines.push('export const personalCourses: CourseData[] = [');
  for (const { varName } of courses) {
    lines.push(`  ${varName},`);
  }
  lines.push('];');
  lines.push('');

  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  console.log('BlueGolf Scorecard Scraper');
  console.log('=========================\n');

  const personalCoursesPath = path.resolve(__dirname, '../prisma/data/personalCourses.ts');
  const backupPath = personalCoursesPath.replace('.ts', '.backup.ts');

  // Back up original
  fs.copyFileSync(personalCoursesPath, backupPath);
  console.log(`Backup saved to: ${path.basename(backupPath)}\n`);

  // Deep clone all courses
  const allCourses: { varName: string; course: CourseData }[] = [
    { varName: 'olympiaFieldsNorth', course: JSON.parse(JSON.stringify(olympiaFieldsNorth)) },
    { varName: 'olympiaFieldsSouth', course: JSON.parse(JSON.stringify(olympiaFieldsSouth)) },
    { varName: 'prestwickCC', course: JSON.parse(JSON.stringify(prestwickCC)) },
    { varName: 'greenGardenGold', course: JSON.parse(JSON.stringify(greenGardenGold)) },
    { varName: 'sugarSprings', course: JSON.parse(JSON.stringify(sugarSprings)) },
    { varName: 'pheasantRunNS', course: JSON.parse(JSON.stringify(pheasantRunNS)) },
    { varName: 'pheasantRunSW', course: JSON.parse(JSON.stringify(pheasantRunSW)) },
    { varName: 'pheasantRunWN', course: JSON.parse(JSON.stringify(pheasantRunWN)) },
    { varName: 'maumeeBay', course: JSON.parse(JSON.stringify(maumeeBay)) },
    { varName: 'theDream', course: JSON.parse(JSON.stringify(theDream)) },
    { varName: 'theNightmare', course: JSON.parse(JSON.stringify(theNightmare)) },
    { varName: 'cogHill1', course: JSON.parse(JSON.stringify(cogHill1)) },
    { varName: 'cogHill2', course: JSON.parse(JSON.stringify(cogHill2)) },
    { varName: 'cogHill3', course: JSON.parse(JSON.stringify(cogHill3)) },
    { varName: 'cogHill4', course: JSON.parse(JSON.stringify(cogHill4)) },
    { varName: 'clarkLake', course: JSON.parse(JSON.stringify(clarkLake)) },
  ];

  const allErrors: string[] = [];
  let totalMatched = 0;
  let totalTees = 0;

  for (const config of COURSES) {
    console.log(`--- ${config.course.name} ---`);
    console.log(`  Fetching: ${config.slug}`);

    let html: string;
    try {
      html = fetchPage(config.slug);
      console.log(`  Fetched: ${(html.length / 1024).toFixed(0)}KB`);
    } catch (err: any) {
      console.error(`  FAILED: ${err.message}`);
      allErrors.push(`${config.course.name}: fetch failed — ${err.message}`);
      continue;
    }

    let scorecard: ParsedScorecard;
    try {
      scorecard = parseScorecard(html);
      console.log(`  Tees in dropdown: ${scorecard.teeInfo.map(t => `${t.name}(${t.gender})`).join(', ')}`);
      console.log(`  Men's tee rows: ${scorecard.mensTeeRows.map(t => `${t.name}(${t.total})`).join(', ')}`);
      console.log(`  Women's tee rows: ${scorecard.womensTeeRows.map(t => `${t.name}(${t.total})`).join(', ') || 'none'}`);
      console.log(`  Men's Hcp: ${scorecard.mensHcp.length} values, Par: ${scorecard.mensPar.length} values`);
      console.log(`  Women's Hcp: ${scorecard.womensHcp.length} values, Par: ${scorecard.womensPar.length} values`);
    } catch (err: any) {
      console.error(`  PARSE FAILED: ${err.message}`);
      allErrors.push(`${config.course.name}: parse failed — ${err.message}`);
      continue;
    }

    // Find matching course in allCourses
    const target = allCourses.find(c => c.varName === config.varName)!;
    let matched = 0;

    for (const teeSet of target.course.tee_sets) {
      totalTees++;
      const matchData = findMatchingTee(teeSet, scorecard);

      if (matchData && matchData.par.length === 18 && matchData.hcp.length === 18 && matchData.yardages.length === 18) {
        teeSet.holes = buildHoleData(matchData);
        const errors = validateHoles(teeSet.holes, config.course.name, `${teeSet.name} (${teeSet.gender})`);
        if (errors.length > 0) {
          allErrors.push(...errors);
          console.log(`  ! ${teeSet.name} (${teeSet.gender}): matched but validation errors`);
          errors.forEach(e => console.log(`      ${e}`));
        } else {
          const totalYds = matchData.yardages.reduce((s, y) => s + y, 0);
          console.log(`  + ${teeSet.name} (${teeSet.gender}): matched, ${totalYds} yds`);
        }
        matched++;
        totalMatched++;
      } else {
        const reason = matchData
          ? `incomplete data (par:${matchData.par.length}, hcp:${matchData.hcp.length}, yds:${matchData.yardages.length})`
          : `no match (${teeSet.course_rating}/${teeSet.slope_rating})`;
        console.log(`  - ${teeSet.name} (${teeSet.gender}): ${reason}`);
      }
    }

    console.log(`  Result: ${matched}/${target.course.tee_sets.length} tees matched\n`);

    // Be polite between requests (10s delay to avoid WAF rate limits)
    execSync('sleep 10');
  }

  // Generate output
  console.log('--- Generating output ---');
  const output = generateFile(allCourses);
  fs.writeFileSync(personalCoursesPath, output, 'utf-8');
  console.log(`Wrote: ${path.basename(personalCoursesPath)}\n`);

  // Summary
  console.log('=========================');
  console.log('Summary');
  console.log('=========================');
  console.log(`Courses fetched: ${COURSES.length}`);
  console.log(`Tees matched:    ${totalMatched}/${totalTees}`);
  console.log(`Errors:          ${allErrors.length}`);

  if (allErrors.length > 0) {
    console.log('\nErrors:');
    allErrors.forEach(e => console.log(`  - ${e}`));
  }

  console.log('\nNext steps:');
  console.log('  1. Review: git diff prisma/data/personalCourses.ts');
  console.log('  2. Type-check: npx tsc --noEmit');
  console.log('  3. If bad: cp prisma/data/personalCourses.backup.ts prisma/data/personalCourses.ts');
  console.log('  4. If good: npm run db:seed:prod');
}

try {
  main();
} catch (err: any) {
  console.error('\nFatal error:', err.message);
  process.exit(1);
}
