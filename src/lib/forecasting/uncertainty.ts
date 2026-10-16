import { CoursePoint, PrecisionEstimate, TrackingPin } from './types';
import { extractSubPolyline } from './geodesy';

/**
 * Computes the visible precision estimate:
 * - Distance interval [sMin, sMax]
 * - Sub-polyline coordinates for visual course glow
 * - Circular confidence radius in meters
 * - Human-readable confidence level and reasoning
 */
export function calculatePrecision(
  currentDistM: number,
  elapsedSeconds: number,
  points: CoursePoint[],
  pins: TrackingPin[] = [],
  queryTime: Date = new Date(),
  basePaceVariancePct = 0.06 // 6% natural marathon pace variance
): PrecisionEstimate {
  const totalCourseDist = points.length > 0 ? points[points.length - 1].cumDistM : 42195;

  let timeSinceLastFixSec = elapsedSeconds;
  let lastFixDescription = 'race start';

  // Find most recent pin before or at query time
  if (pins.length > 0) {
    const validPins = pins
      .map((p) => ({
        ...p,
        timeObj: new Date(p.timestamp),
      }))
      .filter((p) => !isNaN(p.timeObj.getTime()) && p.timeObj.getTime() <= queryTime.getTime())
      .sort((a, b) => b.timeObj.getTime() - a.timeObj.getTime());

    if (validPins.length > 0) {
      const latest = validPins[0];
      const diffSec = Math.max(0, (queryTime.getTime() - latest.timeObj.getTime()) / 1000);
      timeSinceLastFixSec = diffSec;
      const minsAgo = Math.round(diffSec / 60);
      lastFixDescription = minsAgo <= 1 ? 'just now' : `${minsAgo} min ago`;
    }
  }

  // Precision model:
  // Uncertainty sigma_s = base_error (15m) + pace_drift_rate * time_since_fix
  // Assume runner speed ~ 3.3 m/s (approx 5:00/km)
  const assumedSpeedMs = 3.3;
  const baseToleranceM = pins.length > 0 && timeSinceLastFixSec < elapsedSeconds ? 20.0 : 50.0;
  const growthRateMs = assumedSpeedMs * basePaceVariancePct; // ~0.20 m/s = 12m per minute

  const uncertaintyM = Math.min(
    1500, // cap maximum visual spread to 1.5km
    baseToleranceM + growthRateMs * timeSinceLastFixSec
  );

  const sMin = Math.max(0, currentDistM - uncertaintyM);
  const sMax = Math.min(totalCourseDist, currentDistM + uncertaintyM);

  const spanLineCoords = extractSubPolyline(points, sMin, sMax);

  let confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  if (uncertaintyM < 180) {
    confidenceLevel = 'HIGH';
  } else if (uncertaintyM > 550) {
    confidenceLevel = 'LOW';
  }

  const minsSpan = ((uncertaintyM / assumedSpeedMs) / 60).toFixed(1);
  const reason =
    pins.length > 0 && timeSinceLastFixSec < elapsedSeconds
      ? `Calibrated by pin dropped ${lastFixDescription} (±${Math.round(uncertaintyM)}m / ±${minsSpan} min)`
      : `Based on anticipated pace from start (±${Math.round(uncertaintyM)}m / ±${minsSpan} min)`;

  return {
    uncertaintyDistM: Math.round(uncertaintyM),
    confidenceSpanM: [Number(sMin.toFixed(1)), Number(sMax.toFixed(1))],
    spanLineCoords,
    radiusMeters: Math.round(uncertaintyM),
    confidenceLevel,
    reason,
  };
}
