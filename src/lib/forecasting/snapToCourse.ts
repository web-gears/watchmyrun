import { CoursePoint } from './types';
import { projectPointOntoSegment } from './geodesy';

export interface SnapResult {
  snappedLat: number;
  snappedLon: number;
  snappedEle: number;
  snappedDistM: number;
  orthogonalDistanceM: number;
  segmentIndex: number;
  ambiguityWarning?: string;
}

/**
 * Snaps a given lat/lon to the closest point along the marathon course.
 * Uses expected distance window (if elapsed time is provided) to disambiguate out-and-backs and loops.
 */
export function snapCoordinateToCourse(
  lat: number,
  lon: number,
  points: CoursePoint[],
  expectedDistM?: number,
  loopIndexOverride?: number
): SnapResult | null {
  if (points.length < 2) return null;

  type Candidate = {
    closestLat: number;
    closestLon: number;
    t: number;
    distM: number;
    cumDistM: number;
    ele: number;
    segIndex: number;
  };

  const candidates: Candidate[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];

    const proj = projectPointOntoSegment(lat, lon, p1.lat, p1.lon, p2.lat, p2.lon);

    // Only consider segments within 1200 meters of the click/ping
    if (proj.distM < 1200) {
      const segLen = p2.cumDistM - p1.cumDistM;
      const pointDistM = p1.cumDistM + proj.t * segLen;
      const ele = p1.ele + proj.t * (p2.ele - p1.ele);

      candidates.push({
        closestLat: proj.closestLat,
        closestLon: proj.closestLon,
        t: proj.t,
        distM: proj.distM,
        cumDistM: pointDistM,
        ele: ele,
        segIndex: i,
      });
    }
  }

  if (candidates.length === 0) {
    // If no candidate within 1200m, search globally for absolute closest
    let bestDist = Infinity;
    let bestCand: Candidate | null = null;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const proj = projectPointOntoSegment(lat, lon, p1.lat, p1.lon, p2.lat, p2.lon);
      if (proj.distM < bestDist) {
        bestDist = proj.distM;
        const segLen = p2.cumDistM - p1.cumDistM;
        bestCand = {
          closestLat: proj.closestLat,
          closestLon: proj.closestLon,
          t: proj.t,
          distM: proj.distM,
          cumDistM: p1.cumDistM + proj.t * segLen,
          ele: p1.ele + proj.t * (p2.ele - p1.ele),
          segIndex: i,
        };
      }
    }
    if (!bestCand) return null;
    candidates.push(bestCand);
  }

  // Sort candidates
  // If expected distance is given, rank by combination of physical proximity and temporal plausibility
  if (expectedDistM !== undefined && expectedDistM >= 0) {
    candidates.sort((a, b) => {
      // Score based on distance to runner + distance to course
      const scoreA = a.distM + 0.05 * Math.abs(a.cumDistM - expectedDistM);
      const scoreB = b.distM + 0.05 * Math.abs(b.cumDistM - expectedDistM);
      return scoreA - scoreB;
    });
  } else {
    // Otherwise rank strictly by shortest orthogonal distance
    candidates.sort((a, b) => a.distM - b.distM);
  }

  const chosen = candidates[0];
  let warning: string | undefined;

  if (candidates.length > 1) {
    const runnerDistDiff = Math.abs(candidates[1].cumDistM - chosen.cumDistM);
    if (runnerDistDiff > 2000 && Math.abs(candidates[1].distM - chosen.distM) < 80) {
      warning = `Multiple course sections nearby (Mile ${(chosen.cumDistM / 1609.344).toFixed(1)} vs Mile ${(candidates[1].cumDistM / 1609.344).toFixed(1)}). Auto-selected nearest expected loop.`;
    }
  }

  return {
    snappedLat: Number(chosen.closestLat.toFixed(6)),
    snappedLon: Number(chosen.closestLon.toFixed(6)),
    snappedEle: Number(chosen.ele.toFixed(1)),
    snappedDistM: Number(chosen.cumDistM.toFixed(1)),
    orthogonalDistanceM: Math.round(chosen.distM),
    segmentIndex: chosen.segIndex,
    ambiguityWarning: warning,
  };
}
