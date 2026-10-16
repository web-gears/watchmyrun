import { CoursePoint, PacingStrategy, TrackingPin } from './types';

/**
 * Minetti et al. (2002) metabolic energy cost of running as a function of gradient i = dh/ds.
 * Flat ground (i = 0) is approx 3.6 J / (kg * m).
 */
export function minettiEnergyCost(slope: number): number {
  const i = Math.max(-0.35, Math.min(0.35, slope));
  return (
    155.4 * Math.pow(i, 5) -
    30.4 * Math.pow(i, 4) -
    43.3 * Math.pow(i, 3) +
    46.3 * Math.pow(i, 2) +
    19.5 * i +
    3.6
  );
}

/**
 * Generates an array of cumulative elapsed seconds for every point in the course
 * based on total goal time and chosen pacing strategy.
 */
export function calculatePointTimes(
  points: CoursePoint[],
  targetFinishSeconds: number,
  strategy: PacingStrategy
): number[] {
  if (points.length === 0) return [];
  const totalDist = points[points.length - 1].cumDistM;
  const avgSpeed = totalDist / Math.max(1, targetFinishSeconds); // m/s

  if (strategy === 'even') {
    return points.map((p) => p.cumDistM / avgSpeed);
  }

  if (strategy === 'fatigue') {
    // Standard marathon fatigue profile: ~6-8% positive split
    // Speed factor: v(s) = v_base * (1.05 - 0.12 * (s/L)^1.3)
    const rawTimes: number[] = [0];
    let cumT = 0;
    for (let i = 1; i < points.length; i++) {
      const ds = points[i].cumDistM - points[i - 1].cumDistM;
      const midDist = (points[i].cumDistM + points[i - 1].cumDistM) / 2.0;
      const progress = midDist / totalDist;
      const speedFactor = 1.05 - 0.12 * Math.pow(progress, 1.3);
      cumT += ds / (avgSpeed * speedFactor);
      rawTimes.push(cumT);
    }
    const norm = targetFinishSeconds / rawTimes[rawTimes.length - 1];
    return rawTimes.map((t) => t * norm);
  }

  if (strategy === 'gap_elevation') {
    // Minetti metabolic cost model
    const flatCost = minettiEnergyCost(0.0);
    const rawTimes: number[] = [0];
    let cumT = 0;
    for (let i = 1; i < points.length; i++) {
      const ds = points[i].cumDistM - points[i - 1].cumDistM;
      const grade = points[i].gradePct / 100.0;
      const cost = minettiEnergyCost(grade);
      const effectiveSpeed = avgSpeed * (flatCost / cost);
      cumT += ds / Math.max(0.5, effectiveSpeed);
      rawTimes.push(cumT);
    }
    const norm = targetFinishSeconds / rawTimes[rawTimes.length - 1];
    return rawTimes.map((t) => t * norm);
  }

  return points.map((p) => p.cumDistM / avgSpeed);
}

export function formatPace(secPerKm: number): { minPerKm: string; minPerMi: string } {
  if (!secPerKm || secPerKm <= 0 || !isFinite(secPerKm)) {
    return { minPerKm: '--:--', minPerMi: '--:--' };
  }

  const mKm = Math.floor(secPerKm / 60);
  const sKm = Math.floor(secPerKm % 60);
  const minPerKm = `${mKm}:${sKm.toString().padStart(2, '0')}/km`;

  const secPerMi = secPerKm * 1.609344;
  const mMi = Math.floor(secPerMi / 60);
  const sMi = Math.floor(secPerMi % 60);
  const minPerMi = `${mMi}:${sMi.toString().padStart(2, '0')}/mi`;

  return { minPerKm, minPerMi };
}

export function paceStringToSeconds(paceStr: string, unit: 'km' | 'mi'): number {
  const parts = paceStr.trim().split(':');
  if (parts.length < 2) return 300; // default 5:00 /km
  const mins = parseInt(parts[0], 10) || 0;
  const secs = parseInt(parts[1], 10) || 0;
  const totalSecs = mins * 60 + secs;
  return unit === 'mi' ? totalSecs / 1.609344 : totalSecs;
}

export function finishTimeToSeconds(timeStr: string): number {
  const parts = timeStr.trim().split(':');
  if (parts.length === 3) {
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const s = parseInt(parts[2], 10) || 0;
    return h * 3600 + m * 60 + s;
  }
  if (parts.length === 2) {
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 3600 + m * 60;
  }
  return 3.5 * 3600; // default 3:30:00
}

export function formatSecondsToHms(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export interface PinCalibrationResult {
  isCalibrated: boolean;
  calibratedSpeedMs: number;
  impliedPaceSecPerKm: number;
  impliedPaceMinPerKm: string;
  impliedPaceMinPerMi: string;
  projectedFinishSeconds: number;
  projectedFinishHms: string;
  summaryText: string;
}

/**
 * Recalibrates runner speed and projected finish time using dropped tracking pins.
 */
export function calculatePinCalibration(
  pins: TrackingPin[],
  startTime: Date,
  totalDistM: number,
  fallbackTargetSeconds: number
): PinCalibrationResult {
  const fallbackSpeed = totalDistM / Math.max(1, fallbackTargetSeconds);
  const fallbackFormatted = formatPace(1000 / fallbackSpeed);

  if (!pins || pins.length === 0) {
    return {
      isCalibrated: false,
      calibratedSpeedMs: fallbackSpeed,
      impliedPaceSecPerKm: 1000 / fallbackSpeed,
      impliedPaceMinPerKm: fallbackFormatted.minPerKm,
      impliedPaceMinPerMi: fallbackFormatted.minPerMi,
      projectedFinishSeconds: fallbackTargetSeconds,
      projectedFinishHms: formatSecondsToHms(fallbackTargetSeconds),
      summaryText: 'Based on goal target pace',
    };
  }

  // Parse and sort pins chronologically
  const sortedPins = [...pins]
    .map((p) => ({
      ...p,
      timeMs: new Date(p.timestamp).getTime(),
    }))
    .filter((p) => !isNaN(p.timeMs))
    .sort((a, b) => a.timeMs - b.timeMs);

  if (sortedPins.length === 0) {
    return {
      isCalibrated: false,
      calibratedSpeedMs: fallbackSpeed,
      impliedPaceSecPerKm: 1000 / fallbackSpeed,
      impliedPaceMinPerKm: fallbackFormatted.minPerKm,
      impliedPaceMinPerMi: fallbackFormatted.minPerMi,
      projectedFinishSeconds: fallbackTargetSeconds,
      projectedFinishHms: formatSecondsToHms(fallbackTargetSeconds),
      summaryText: 'Based on goal target pace',
    };
  }

  const latestPin = sortedPins[sortedPins.length - 1];

  // Align dates: compute elapsed time between race start and pin
  const startMs = startTime.getTime();
  let elapsedFromStartSec = (latestPin.timeMs - startMs) / 1000;

  // Safe day-alignment: if pin timestamp date does not match startTime date, align hour & min
  if (elapsedFromStartSec <= 0 || elapsedFromStartSec > 86400) {
    const pinD = new Date(latestPin.timeMs);
    const alignedPin = new Date(startTime);
    alignedPin.setHours(pinD.getHours(), pinD.getMinutes(), pinD.getSeconds() || 0, 0);
    let diff = (alignedPin.getTime() - startMs) / 1000;
    if (diff <= 0) {
      if (diff > -7200) {
        // Within 2 hours before start, treat as just started
        diff = 60;
      } else {
        diff += 86400;
      }
    }
    elapsedFromStartSec = diff;
  }

  let speedMs = fallbackSpeed;

  if (sortedPins.length >= 2) {
    const prevPin = sortedPins[sortedPins.length - 2];
    const segmentDist = latestPin.snappedDistM - prevPin.snappedDistM;
    let segmentTime = (latestPin.timeMs - prevPin.timeMs) / 1000;
    if (segmentTime <= 0) segmentTime = 60;

    let segmentSpeed = fallbackSpeed;
    if (segmentTime > 30 && segmentDist > 0) {
      segmentSpeed = segmentDist / segmentTime;
    }

    let overallSpeed = fallbackSpeed;
    if (latestPin.impliedPaceSecPerKm && latestPin.impliedPaceSecPerKm > 60) {
      overallSpeed = 1000 / latestPin.impliedPaceSecPerKm;
    } else if (elapsedFromStartSec > 60 && latestPin.snappedDistM > 0) {
      overallSpeed = latestPin.snappedDistM / elapsedFromStartSec;
    }

    // Weighted blend: 70% latest segment, 30% overall from start
    speedMs = 0.7 * segmentSpeed + 0.3 * overallSpeed;
  } else {
    if (latestPin.impliedPaceSecPerKm && latestPin.impliedPaceSecPerKm > 60) {
      speedMs = 1000 / latestPin.impliedPaceSecPerKm;
    } else if (elapsedFromStartSec > 60 && latestPin.snappedDistM > 0) {
      speedMs = latestPin.snappedDistM / elapsedFromStartSec;
    }
  }

  // Realistic human marathon speed bounds: 1.5 m/s (~11:00/km) to 6.8 m/s (~2:27/km)
  speedMs = Math.max(1.5, Math.min(6.8, speedMs));

  const impliedPaceSecPerKm = 1000 / speedMs;
  const paceFormatted = formatPace(impliedPaceSecPerKm);

  // Projected finish: actual elapsed time up to latest pin + remaining distance at calibrated speed
  const remainingDist = Math.max(0, totalDistM - latestPin.snappedDistM);
  const remainingSec = remainingDist / speedMs;
  const projectedFinishSeconds = Math.round(elapsedFromStartSec + remainingSec);

  return {
    isCalibrated: true,
    calibratedSpeedMs: speedMs,
    impliedPaceSecPerKm,
    impliedPaceMinPerKm: paceFormatted.minPerKm,
    impliedPaceMinPerMi: paceFormatted.minPerMi,
    projectedFinishSeconds,
    projectedFinishHms: formatSecondsToHms(projectedFinishSeconds),
    summaryText: `Calibrated from Pin #${sortedPins.length} (${(latestPin.snappedDistM / 1000).toFixed(1)} km)`,
  };
}
