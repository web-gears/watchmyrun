import { CoursePoint } from './types';

export const EARTH_RADIUS_M = 6371000.0;

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const p1 = (lat1 * Math.PI) / 180.0;
  const p2 = (lat2 * Math.PI) / 180.0;
  const dp = ((lat2 - lat1) * Math.PI) / 180.0;
  const dl = ((lon2 - lon1) * Math.PI) / 180.0;

  const a =
    Math.sin(dp / 2.0) * Math.sin(dp / 2.0) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2.0) * Math.sin(dl / 2.0);
  const c = 2.0 * Math.atan2(Math.sqrt(a), Math.sqrt(1.0 - a));
  return EARTH_RADIUS_M * c;
}

export function initialBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const p1 = (lat1 * Math.PI) / 180.0;
  const p2 = (lat2 * Math.PI) / 180.0;
  const dl = ((lon2 - lon1) * Math.PI) / 180.0;

  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  const deg = (Math.atan2(y, x) * 180.0) / Math.PI;
  return (deg + 360.0) % 360.0;
}

/**
 * Projects a point onto a great-circle segment using local equirectangular plane
 * Returns closest point [lat, lon], fraction t in [0, 1], and perpendicular distance in meters
 */
export function projectPointOntoSegment(
  pLat: number,
  pLon: number,
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { closestLat: number; closestLon: number; t: number; distM: number } {
  // Local projection around midpoint
  const midLat = ((lat1 + lat2) / 2.0 * Math.PI) / 180.0;
  const cosLat = Math.cos(midLat);

  // Convert to local meter coordinates (x = East, y = North)
  const x1 = ((lon1 * Math.PI) / 180.0) * EARTH_RADIUS_M * cosLat;
  const y1 = ((lat1 * Math.PI) / 180.0) * EARTH_RADIUS_M;

  const x2 = ((lon2 * Math.PI) / 180.0) * EARTH_RADIUS_M * cosLat;
  const y2 = ((lat2 * Math.PI) / 180.0) * EARTH_RADIUS_M;

  const px = ((pLon * Math.PI) / 180.0) * EARTH_RADIUS_M * cosLat;
  const py = ((pLat * Math.PI) / 180.0) * EARTH_RADIUS_M;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  let t = 0.0;
  if (lenSq > 1e-4) {
    t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
    t = Math.max(0.0, Math.min(1.0, t));
  }

  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  const distM = Math.hypot(px - projX, py - projY);

  const closestLat = (projY / EARTH_RADIUS_M) * (180.0 / Math.PI);
  const closestLon = (projX / (EARTH_RADIUS_M * cosLat)) * (180.0 / Math.PI);

  return { closestLat, closestLon, t, distM };
}

/**
 * Interpolates coordinate, elevation, bearing, and grade at a given cumulative distance
 */
export function interpolateAtDistance(
  points: CoursePoint[],
  distM: number
): {
  lat: number;
  lon: number;
  ele: number;
  bearingDeg: number;
  gradePct: number;
  segmentIndex: number;
} {
  if (points.length === 0) {
    return { lat: 0, lon: 0, ele: 0, bearingDeg: 0, gradePct: 0, segmentIndex: 0 };
  }

  const clampedDist = Math.max(0, Math.min(distM, points[points.length - 1].cumDistM));

  if (clampedDist <= points[0].cumDistM) {
    const p0 = points[0];
    const p1 = points[1] || p0;
    return {
      lat: p0.lat,
      lon: p0.lon,
      ele: p0.ele,
      bearingDeg: initialBearing(p0.lat, p0.lon, p1.lat, p1.lon),
      gradePct: p0.gradePct,
      segmentIndex: 0,
    };
  }

  if (clampedDist >= points[points.length - 1].cumDistM) {
    const pEnd = points[points.length - 1];
    const pPrev = points[points.length - 2] || pEnd;
    return {
      lat: pEnd.lat,
      lon: pEnd.lon,
      ele: pEnd.ele,
      bearingDeg: initialBearing(pPrev.lat, pPrev.lon, pEnd.lat, pEnd.lon),
      gradePct: pEnd.gradePct,
      segmentIndex: points.length - 1,
    };
  }

  // Binary search
  let low = 0;
  let high = points.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (points[mid].cumDistM <= clampedDist) {
      if (mid === points.length - 1 || points[mid + 1].cumDistM >= clampedDist) {
        low = mid;
        break;
      }
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const p1 = points[low];
  const p2 = points[Math.min(low + 1, points.length - 1)];
  const segDist = p2.cumDistM - p1.cumDistM;
  const ratio = segDist > 1e-6 ? (clampedDist - p1.cumDistM) / segDist : 0.0;

  const lat = p1.lat + ratio * (p2.lat - p1.lat);
  const lon = p1.lon + ratio * (p2.lon - p1.lon);
  const ele = p1.ele + ratio * (p2.ele - p1.ele);
  const bearingDeg = initialBearing(p1.lat, p1.lon, p2.lat, p2.lon);

  return {
    lat: Number(lat.toFixed(6)),
    lon: Number(lon.toFixed(6)),
    ele: Number(ele.toFixed(1)),
    bearingDeg: Math.round(bearingDeg),
    gradePct: p2.gradePct,
    segmentIndex: low,
  };
}

/**
 * Extracts a sub-polyline between startDistM and endDistM for the precision glow span
 */
export function extractSubPolyline(
  points: CoursePoint[],
  startDistM: number,
  endDistM: number
): [number, number][] {
  if (points.length < 2) return [];

  const minD = Math.max(0, Math.min(startDistM, endDistM));
  const maxD = Math.min(points[points.length - 1].cumDistM, Math.max(startDistM, endDistM));

  const startCoord = interpolateAtDistance(points, minD);
  const endCoord = interpolateAtDistance(points, maxD);

  const coords: [number, number][] = [[startCoord.lat, startCoord.lon]];

  for (let i = 0; i < points.length; i++) {
    const d = points[i].cumDistM;
    if (d > minD && d < maxD) {
      coords.push([points[i].lat, points[i].lon]);
    }
  }

  coords.push([endCoord.lat, endCoord.lon]);
  return coords;
}
