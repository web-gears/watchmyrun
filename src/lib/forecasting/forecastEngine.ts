import {
  CourseData,
  CoursePoint,
  PacingStrategy,
  TrackingPin,
  RunnerForecastResult,
  SpectatorMeetingWindow,
  SpectatorSpot,
} from './types';
import { interpolateAtDistance } from './geodesy';
import { calculatePointTimes, formatPace, calculatePinCalibration } from './pacingModels';
import { calculatePrecision } from './uncertainty';

export function forecastRunner(
  course: CourseData,
  startTime: Date,
  targetFinishSeconds: number,
  strategy: PacingStrategy = 'fatigue',
  pins: TrackingPin[] = [],
  queryTime: Date = new Date()
): RunnerForecastResult {
  const points = course.points;
  const totalDist = course.distanceM;

  const elapsedSeconds = Math.max(0, (queryTime.getTime() - startTime.getTime()) / 1000);

  // If before start and no tracking pins exist
  if (elapsedSeconds <= 0 && pins.length === 0) {
    const p0 = points[0] || { lat: 0, lon: 0, ele: 0, gradePct: 0 };
    return {
      status: 'NOT_STARTED',
      queryTime: queryTime.toISOString(),
      elapsedSeconds: 0,
      currentDistM: 0,
      currentDistKm: 0,
      currentDistMi: 0,
      progressPct: 0,
      coord: {
        lat: p0.lat,
        lon: p0.lon,
        ele: p0.ele,
        bearingDeg: 0,
        gradePct: 0,
      },
      instantPaceMinPerKm: '--:--',
      instantPaceMinPerMi: '--:--',
      projectedFinishTime: new Date(startTime.getTime() + targetFinishSeconds * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      precision: {
        uncertaintyDistM: 20,
        confidenceSpanM: [0, 20],
        spanLineCoords: [[p0.lat, p0.lon]],
        radiusMeters: 20,
        confidenceLevel: 'HIGH',
        reason: 'At Start Line',
      },
      upcomingSplits: course.timingMats.slice(0, 4).map((m) => ({
        name: m.name,
        distKm: Number((m.actualDistM / 1000).toFixed(1)),
        eta: new Date(startTime.getTime() + (m.actualDistM / (totalDist / targetFinishSeconds)) * 1000).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        secondsAway: Math.round(m.actualDistM / (totalDist / targetFinishSeconds)),
      })),
      activePacingStrategy: strategy,
    };
  }

  // Calculate base pacing profile
  const basePointTimes = calculatePointTimes(points, targetFinishSeconds, strategy);

  // Recalibrate pace and projected finish using dropped pins
  const pinCalibration = calculatePinCalibration(
    pins,
    startTime,
    totalDist,
    targetFinishSeconds
  );

  let activeSpeedMs = pinCalibration.calibratedSpeedMs;
  let currentDistM = 0;

  // Filter and sort pins chronologically
  const allSortedPins = pins
    .map((p) => ({
      ...p,
      timeObj: new Date(p.timestamp),
    }))
    .filter((p) => !isNaN(p.timeObj.getTime()))
    .sort((a, b) => a.timeObj.getTime() - b.timeObj.getTime());

  const validPins = allSortedPins.filter((p) => p.timeObj.getTime() <= queryTime.getTime());

  if (validPins.length === 0) {
    if (allSortedPins.length > 0) {
      // If queryTime is earlier than pins (e.g. testing or clock shift), anchor to latest pin
      const latestPin = allSortedPins[allSortedPins.length - 1];
      currentDistM = latestPin.snappedDistM;
    } else if (pinCalibration.isCalibrated) {
      // Runner is moving forward at the calibrated pace
      currentDistM = Math.min(totalDist, elapsedSeconds * activeSpeedMs);
    } else {
      // Standard model without pin calibration
      currentDistM = getDistanceFromElapsed(basePointTimes, points, elapsedSeconds, totalDist);
    }
  } else {
    // Project forward from latest pin at calibrated speed
    const latestPin = validPins[validPins.length - 1];
    const secSincePin = Math.max(0, (queryTime.getTime() - latestPin.timeObj.getTime()) / 1000);
    currentDistM = Math.min(totalDist, latestPin.snappedDistM + activeSpeedMs * secSincePin);
  }

  // Check if finished using calibrated projected finish
  const finishLimitSec = pinCalibration.isCalibrated
    ? pinCalibration.projectedFinishSeconds * 1.15
    : targetFinishSeconds * 1.25;
  const isFinished = currentDistM >= totalDist || (elapsedSeconds > 0 && elapsedSeconds >= finishLimitSec);

  const interpolated = interpolateAtDistance(points, currentDistM);

  // Instantaneous pace formatting (reflects real pin-calibrated pace)
  const secPerKm = 1000.0 / activeSpeedMs;
  const paceFormatted = formatPace(secPerKm);

  // Precision calculation
  const precision = calculatePrecision(currentDistM, elapsedSeconds, points, pins, queryTime);

  // Projected finish time
  const finishDate = new Date(startTime.getTime() + pinCalibration.projectedFinishSeconds * 1000);
  const projectedFinishTime = isFinished
    ? new Date(startTime.getTime() + pinCalibration.projectedFinishSeconds * 1000).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : finishDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Upcoming timing splits
  const upcomingSplits = course.timingMats
    .filter((m) => m.actualDistM > currentDistM)
    .slice(0, 4)
    .map((m) => {
      const dMeters = m.actualDistM - currentDistM;
      const dtSec = dMeters / activeSpeedMs;
      const etaDate = new Date(queryTime.getTime() + dtSec * 1000);
      return {
        name: m.name,
        distKm: Number((m.actualDistM / 1000).toFixed(1)),
        eta: etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        secondsAway: Math.round(dtSec),
      };
    });

  return {
    status: isFinished ? 'FINISHED' : 'ON_COURSE',
    queryTime: queryTime.toISOString(),
    elapsedSeconds: Math.round(elapsedSeconds),
    currentDistM: Number(currentDistM.toFixed(1)),
    currentDistKm: Number((currentDistM / 1000).toFixed(2)),
    currentDistMi: Number((currentDistM / 1609.344).toFixed(2)),
    progressPct: Number(((currentDistM / totalDist) * 100).toFixed(1)),
    coord: {
      lat: interpolated.lat,
      lon: interpolated.lon,
      ele: interpolated.ele,
      bearingDeg: interpolated.bearingDeg,
      gradePct: interpolated.gradePct,
    },
    instantPaceMinPerKm: paceFormatted.minPerKm,
    instantPaceMinPerMi: paceFormatted.minPerMi,
    projectedFinishTime,
    calibratedPace: {
      isCalibrated: pinCalibration.isCalibrated,
      paceMinPerKm: pinCalibration.impliedPaceMinPerKm,
      paceMinPerMi: pinCalibration.impliedPaceMinPerMi,
      summaryText: pinCalibration.summaryText,
      projectedFinishHms: pinCalibration.projectedFinishHms,
    },
    precision,
    upcomingSplits,
    activePacingStrategy: strategy,
  };
}

function getDistanceFromElapsed(
  pointTimes: number[],
  points: CoursePoint[],
  elapsed: number,
  totalDist: number
): number {
  if (elapsed >= pointTimes[pointTimes.length - 1]) {
    return totalDist;
  }

  // Binary search in time
  let low = 0;
  let high = pointTimes.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (pointTimes[mid] <= elapsed) {
      if (mid === pointTimes.length - 1 || pointTimes[mid + 1] >= elapsed) {
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
  const t1 = pointTimes[low];
  const t2 = pointTimes[Math.min(low + 1, pointTimes.length - 1)];
  const span = t2 - t1;
  const ratio = span > 1e-6 ? (elapsed - t1) / span : 0.0;

  return p1.cumDistM + ratio * (p2.cumDistM - p1.cumDistM);
}

/**
 * Calculates when the runner is expected to pass a designated spectator location
 */
export function calculateSpectatorMeetingWindow(
  course: CourseData,
  spectator: SpectatorSpot | number,
  runnerResult: RunnerForecastResult,
  queryTime: Date = new Date()
): SpectatorMeetingWindow {
  const isSpotObj = typeof spectator === 'object';
  const distM = isSpotObj ? spectator.distM : spectator;
  const spotId = isSpotObj ? spectator.id : `spot_${Math.round(distM)}`;
  const spotName = isSpotObj
    ? spectator.name
    : `Mile ${(distM / 1609.344).toFixed(1)} (${(distM / 1000).toFixed(1)} km)`;

  const interp = interpolateAtDistance(course.points, distM);
  const diffM = distM - runnerResult.currentDistM;

  const assumedSpeedMs = 1000.0 / (paceToSec(runnerResult.instantPaceMinPerKm) || 300);

  const hasRunnerPassed = diffM < -30;
  const secondsAway = Math.max(0, diffM / assumedSpeedMs);
  const passedAgoSec = hasRunnerPassed ? Math.round(Math.abs(diffM) / assumedSpeedMs) : undefined;

  const etaDate = new Date(queryTime.getTime() + (hasRunnerPassed ? -passedAgoSec! : secondsAway) * 1000);

  // Uncertainty in arrival time is proportional to distance uncertainty
  const uncertaintySec = Math.round(runnerResult.precision.uncertaintyDistM / assumedSpeedMs);
  const earlyDate = new Date(etaDate.getTime() - uncertaintySec * 1000);
  const lateDate = new Date(etaDate.getTime() + uncertaintySec * 1000);

  const formatHms = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return {
    spotId,
    spotName,
    distKm: Number((distM / 1000).toFixed(2)),
    distMi: Number((distM / 1609.344).toFixed(2)),
    lat: isSpotObj && spectator.lat ? spectator.lat : interp.lat,
    lon: isSpotObj && spectator.lon ? spectator.lon : interp.lon,
    ele: interp.ele,
    expectedEta: formatHms(etaDate),
    windowEarly: formatHms(earlyDate),
    windowLate: formatHms(lateDate),
    secondsAway: Math.round(secondsAway),
    distanceFromRunnerKm: Number((diffM / 1000).toFixed(2)),
    hasRunnerPassed,
    passedAgoSec,
  };
}

export function calculateAllSpectatorWindows(
  course: CourseData,
  spots: SpectatorSpot[],
  runnerResult: RunnerForecastResult,
  queryTime: Date = new Date()
): SpectatorMeetingWindow[] {
  return spots
    .map((spot) => calculateSpectatorMeetingWindow(course, spot, runnerResult, queryTime))
    .sort((a, b) => a.distKm - b.distKm);
}

function paceToSec(paceStr: string): number {
  const parts = paceStr.replace('/km', '').replace('/mi', '').trim().split(':');
  if (parts.length < 2) return 300;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}
