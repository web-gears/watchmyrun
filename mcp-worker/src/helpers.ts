import { MarathonId, PacingStrategy, TrackingPin, CourseData } from '../../src/lib/forecasting/types';
import { MARATHON_REGISTRY } from '../../src/lib/data/marathonRegistry';
import { MAJOR_MARATHON_COURSES } from '../../src/lib/data/majorCourses';
import { serializeUrlState, AppUrlState } from '../../src/lib/state/urlState';

export const VALID_MARATHON_IDS: MarathonId[] = [
  'new_york',
  'boston',
  'chicago',
  'london',
  'berlin',
  'tokyo',
];

/**
 * Parses a finish time string into total seconds.
 * Accepts "HH:mm:ss" (e.g. "03:45:00") or "HH:mm" (e.g. "03:45").
 */
export function parseFinishTimeToSeconds(timeStr: string): number {
  const parts = timeStr.trim().split(':').map((p) => parseInt(p, 10));
  if (parts.some((n) => isNaN(n))) {
    throw new Error(`Invalid finish time format: "${timeStr}". Expected "HH:mm:ss" or "HH:mm".`);
  }
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  if (parts.length === 2) {
    return parts[0] * 3600 + parts[1] * 60;
  }
  if (parts.length === 1) {
    return parts[0] * 3600;
  }
  throw new Error(`Invalid finish time format: "${timeStr}".`);
}

/**
 * Parses a pace string ("mm:ss", e.g. "05:20" or "08:35") into seconds per unit.
 */
export function parsePaceToSeconds(paceStr: string): number {
  const clean = paceStr.replace('/km', '').replace('/mi', '').trim();
  const parts = clean.split(':').map((p) => parseInt(p, 10));
  if (parts.length < 2 || parts.some((n) => isNaN(n))) {
    throw new Error(`Invalid pace format: "${paceStr}". Expected "mm:ss" (e.g. "05:20").`);
  }
  return parts[0] * 60 + parts[1];
}

/**
 * Converts a pace ("05:20") and unit ('km' | 'mi') to total course finish seconds.
 */
export function convertPaceToFinishSeconds(
  paceStr: string,
  unit: 'km' | 'mi',
  totalDistM: number
): number {
  const secPerUnit = parsePaceToSeconds(paceStr);
  const units = unit === 'mi' ? totalDistM / 1609.344 : totalDistM / 1000;
  return Math.round(secPerUnit * units);
}

/**
 * Formats seconds into "HH:mm:ss"
 */
export function formatSecondsToHms(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  const hrs = Math.floor(s / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return [
    hrs.toString().padStart(2, '0'),
    mins.toString().padStart(2, '0'),
    secs.toString().padStart(2, '0'),
  ].join(':');
}

/**
 * Resolves a date/time string into a JS Date.
 * Handles ISO strings ("2026-11-01T09:10:00Z"), full dates, or simple times ("09:10" or "09:10:00").
 */
export function resolveDateTime(timeStr: string, referenceDate: Date = new Date()): Date {
  const trimmed = timeStr.trim();
  // If it contains a date separator (- or /) or 'T', parse as full ISO / date
  if (trimmed.includes('-') || trimmed.includes('/') || trimmed.includes('T')) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;
  }

  // Otherwise treat as "HH:mm" or "HH:mm:ss" local race time
  const parts = trimmed.split(':').map((p) => parseInt(p, 10));
  if (parts.length >= 2 && !parts.some((n) => isNaN(n))) {
    const d = new Date(referenceDate);
    d.setHours(parts[0], parts[1], parts[2] || 0, 0);
    return d;
  }

  const fallback = new Date(trimmed);
  if (!isNaN(fallback.getTime())) return fallback;

  throw new Error(`Invalid date/time format: "${timeStr}". Expected "HH:mm", "HH:mm:ss", or ISO timestamp.`);
}

/**
 * Retrieves the course data for a marathon major.
 */
export function getCourseData(marathonId: MarathonId): CourseData {
  const course = MAJOR_MARATHON_COURSES[marathonId];
  if (!course) {
    throw new Error(`Course data not found for marathon: "${marathonId}".`);
  }
  return course;
}

/**
 * Retrieves marathon registry metadata.
 */
export function getMarathonInfo(marathonId: MarathonId) {
  const info = MARATHON_REGISTRY[marathonId];
  if (!info) {
    throw new Error(`Marathon registry not found for: "${marathonId}".`);
  }
  return info;
}

/**
 * Generates an interactive WatchMy.Run web URL for a race state.
 */
export function buildRaceUrl(state: AppUrlState, baseUrl = 'https://watchmy.run'): string {
  const queryString = serializeUrlState(state);
  return queryString ? `${baseUrl}/?${queryString}` : baseUrl;
}
