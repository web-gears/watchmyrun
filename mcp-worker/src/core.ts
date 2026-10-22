import { MARATHON_REGISTRY } from '../../src/lib/data/marathonRegistry';
import { forecastRunner, calculateAllSpectatorWindows } from '../../src/lib/forecasting/forecastEngine';
import { snapCoordinateToCourse } from '../../src/lib/forecasting/snapToCourse';
import { calculatePinCalibration, formatPace } from '../../src/lib/forecasting/pacingModels';
import { interpolateAtDistance } from '../../src/lib/forecasting/geodesy';
import {
  MarathonId,
  PacingStrategy,
  TrackingPin,
  SpectatorSpot,
} from '../../src/lib/forecasting/types';
import {
  VALID_MARATHON_IDS,
  getCourseData,
  getMarathonInfo,
  resolveDateTime,
  parseFinishTimeToSeconds,
  convertPaceToFinishSeconds,
  formatSecondsToHms,
  buildRaceUrl,
} from './helpers';

export interface RawPinInput {
  lat: number;
  lon: number;
  timestamp: string;
  id?: string;
}

export interface RawCheerLocationInput {
  name?: string;
  mile?: number;
  distM?: number;
  presetId?: string;
  lat?: number;
  lon?: number;
}

export function executeListMarathons(marathonId?: MarathonId) {
  if (marathonId) {
    const m = getMarathonInfo(marathonId);
    return {
      id: m.id,
      name: m.name,
      shortName: m.shortName,
      code: m.code,
      flag: m.flag,
      city: m.city,
      country: m.country,
      annualDate: m.annualDate,
      distanceKm: m.distanceKm,
      distanceMi: m.distanceMi,
      defaultStartTime: m.defaultStartTime,
      defaultFinishTime: m.defaultFinishTime,
      defaultPace: m.defaultPace,
      elevationHighlight: m.elevationHighlight,
      waves: m.waves,
    };
  }

  const marathons = VALID_MARATHON_IDS.map((id) => {
    const m = MARATHON_REGISTRY[id];
    return {
      id: m.id,
      name: m.name,
      shortName: m.shortName,
      code: m.code,
      flag: m.flag,
      city: m.city,
      country: m.country,
      annualDate: m.annualDate,
      distanceKm: m.distanceKm,
      distanceMi: m.distanceMi,
      defaultStartTime: m.defaultStartTime,
      defaultFinishTime: m.defaultFinishTime,
      defaultPace: m.defaultPace,
      elevationHighlight: m.elevationHighlight,
      wavesCount: m.waves.length,
    };
  });

  return { marathons };
}

export function executeGetCourseLandmarks(marathon: MarathonId) {
  const info = getMarathonInfo(marathon);
  const course = getCourseData(marathon);

  return {
    marathon: info.name,
    distanceM: course.distanceM,
    cheerPresets: info.cheerPresets,
    timingMats: course.timingMats.map((mat) => ({
      name: mat.name,
      distM: mat.actualDistM,
      distKm: Number((mat.actualDistM / 1000).toFixed(2)),
      distMi: Number((mat.actualDistM / 1609.344).toFixed(2)),
      lat: mat.lat,
      lon: mat.lon,
      elevationM: mat.ele,
    })),
    elevationSummary: course.elevationSummary,
  };
}

export function executeCalculateForecast(params: {
  marathon: MarathonId;
  startTime: string;
  targetFinishTime?: string;
  targetPace?: string;
  paceUnit?: 'km' | 'mi';
  strategy?: 'flat' | 'fatigue' | 'negative';
  queryTime?: string;
  pins?: RawPinInput[];
  baseUrl?: string;
}) {
  const {
    marathon,
    startTime,
    targetFinishTime,
    targetPace,
    paceUnit = 'km',
    strategy = 'fatigue',
    queryTime,
    pins = [],
    baseUrl = 'https://watchmy.run',
  } = params;

  const course = getCourseData(marathon);
  const info = getMarathonInfo(marathon);

  let finishSeconds: number;
  if (targetFinishTime) {
    finishSeconds = parseFinishTimeToSeconds(targetFinishTime);
  } else if (targetPace) {
    finishSeconds = convertPaceToFinishSeconds(targetPace, paceUnit, course.distanceM);
  } else {
    finishSeconds = parseFinishTimeToSeconds(info.defaultFinishTime);
  }

  const queryDate = queryTime ? resolveDateTime(queryTime) : new Date();
  const startDate = resolveDateTime(startTime, queryDate);

  const snappedPins: TrackingPin[] = pins.map((p, idx) => {
    const pinDate = resolveDateTime(p.timestamp, startDate);
    const elapsedAtPin = Math.max(0, (pinDate.getTime() - startDate.getTime()) / 1000);
    const expectedDistM = (elapsedAtPin / finishSeconds) * course.distanceM;
    const snap = snapCoordinateToCourse(p.lat, p.lon, course.points, expectedDistM);
    const distM = snap ? snap.snappedDistM : 0;
    return {
      id: p.id || `pin_${idx}_${pinDate.getTime()}`,
      lat: p.lat,
      lon: p.lon,
      timestamp: pinDate.toISOString(),
      snappedDistM: distM,
      snappedLat: snap ? snap.snappedLat : p.lat,
      snappedLon: snap ? snap.snappedLon : p.lon,
      snappedEle: snap ? snap.snappedEle : 0,
    };
  });

  const forecast = forecastRunner(
    course,
    startDate,
    finishSeconds,
    strategy as PacingStrategy,
    snappedPins,
    queryDate
  );

  const webUrl = buildRaceUrl(
    {
      marathon,
      startTime,
      finishTime: formatSecondsToHms(finishSeconds),
      strategy: strategy as PacingStrategy,
      pins: snappedPins,
    },
    baseUrl
  );

  return {
    marathon: info.name,
    status: forecast.status,
    queryTime: forecast.queryTime,
    elapsedSeconds: forecast.elapsedSeconds,
    elapsedFormatted: formatSecondsToHms(forecast.elapsedSeconds),
    progressPct: forecast.progressPct,
    distanceCoveredKm: forecast.currentDistKm,
    distanceCoveredMi: forecast.currentDistMi,
    totalDistanceKm: Number((course.distanceM / 1000).toFixed(2)),
    currentPosition: forecast.coord,
    instantPace: {
      minPerKm: forecast.instantPaceMinPerKm,
      minPerMi: forecast.instantPaceMinPerMi,
    },
    projectedFinishTime: forecast.projectedFinishTime,
    calibration: forecast.calibratedPace,
    precision: {
      radiusMeters: forecast.precision.radiusMeters,
      confidenceLevel: forecast.precision.confidenceLevel,
      reason: forecast.precision.reason,
    },
    upcomingSplits: forecast.upcomingSplits,
    webTrackingUrl: webUrl,
  };
}

export function executeGetCheerWindows(params: {
  marathon: MarathonId;
  startTime: string;
  targetFinishTime?: string;
  targetPace?: string;
  paceUnit?: 'km' | 'mi';
  strategy?: 'flat' | 'fatigue' | 'negative';
  cheerLocations: RawCheerLocationInput[];
  pins?: RawPinInput[];
  queryTime?: string;
  baseUrl?: string;
}) {
  const {
    marathon,
    startTime,
    targetFinishTime,
    targetPace,
    paceUnit = 'km',
    strategy = 'fatigue',
    cheerLocations,
    pins = [],
    queryTime,
    baseUrl = 'https://watchmy.run',
  } = params;

  const course = getCourseData(marathon);
  const info = getMarathonInfo(marathon);

  let finishSeconds: number;
  if (targetFinishTime) {
    finishSeconds = parseFinishTimeToSeconds(targetFinishTime);
  } else if (targetPace) {
    finishSeconds = convertPaceToFinishSeconds(targetPace, paceUnit, course.distanceM);
  } else {
    finishSeconds = parseFinishTimeToSeconds(info.defaultFinishTime);
  }

  const queryDate = queryTime ? resolveDateTime(queryTime) : new Date();
  const startDate = resolveDateTime(startTime, queryDate);

  const snappedPins: TrackingPin[] = pins.map((p, idx) => {
    const pinDate = resolveDateTime(p.timestamp, startDate);
    const elapsedAtPin = Math.max(0, (pinDate.getTime() - startDate.getTime()) / 1000);
    const expectedDistM = (elapsedAtPin / finishSeconds) * course.distanceM;
    const snap = snapCoordinateToCourse(p.lat, p.lon, course.points, expectedDistM);
    return {
      id: p.id || `pin_${idx}_${pinDate.getTime()}`,
      lat: p.lat,
      lon: p.lon,
      timestamp: pinDate.toISOString(),
      snappedDistM: snap ? snap.snappedDistM : 0,
      snappedLat: snap ? snap.snappedLat : p.lat,
      snappedLon: snap ? snap.snappedLon : p.lon,
      snappedEle: snap ? snap.snappedEle : 0,
    };
  });

  const forecast = forecastRunner(
    course,
    startDate,
    finishSeconds,
    strategy as PacingStrategy,
    snappedPins,
    queryDate
  );

  const spectatorSpots: SpectatorSpot[] = cheerLocations.map((loc, idx) => {
    let distM = 10000;
    let name = loc.name || `Cheer Point #${idx + 1}`;
    let mile = Number((distM / 1609.344).toFixed(2));
    let description: string | undefined;

    if (loc.presetId) {
      const preset = info.cheerPresets.find((cp) => cp.id === loc.presetId);
      if (preset) {
        distM = preset.distM;
        name = preset.name;
        mile = preset.mile;
        description = preset.description;
      }
    } else if (loc.distM !== undefined) {
      distM = loc.distM;
      mile = Number((loc.distM / 1609.344).toFixed(2));
      name = loc.name || `Cheer Point ${(loc.distM / 1000).toFixed(1)} km`;
    } else if (loc.mile !== undefined) {
      distM = loc.mile * 1609.344;
      mile = loc.mile;
      name = loc.name || `Mile ${loc.mile.toFixed(1)}`;
    }

    const interp = interpolateAtDistance(course.points, distM);
    const lat = loc.lat ?? interp.lat;
    const lon = loc.lon ?? interp.lon;
    const ele = interp.ele;

    return {
      id: loc.presetId || `spot_${idx}`,
      name,
      distM,
      mile,
      lat,
      lon,
      ele,
      description,
    };
  });

  const windows = calculateAllSpectatorWindows(course, spectatorSpots, forecast, queryDate);

  const webUrl = buildRaceUrl(
    {
      marathon,
      startTime,
      finishTime: formatSecondsToHms(finishSeconds),
      strategy: strategy as PacingStrategy,
      pins: snappedPins,
      spectatorDistMList: spectatorSpots.map((s) => s.distM),
    },
    baseUrl
  );

  return {
    marathon: info.name,
    runnerCurrentDistKm: forecast.currentDistKm,
    runnerCurrentDistMi: forecast.currentDistMi,
    meetingWindows: windows.map((w) => ({
      spotName: w.spotName,
      mileMark: w.distMi,
      kmMark: w.distKm,
      expectedEta: w.expectedEta,
      windowEarly: w.windowEarly,
      windowLate: w.windowLate,
      secondsAway: w.secondsAway,
      distanceFromRunnerKm: w.distanceFromRunnerKm,
      distanceFromRunnerMi: Number((w.distanceFromRunnerKm / 1.609344).toFixed(2)),
      hasRunnerPassed: w.hasRunnerPassed,
      passedAgoSec: w.passedAgoSec,
      coordinates: { lat: w.lat, lon: w.lon },
    })),
    webTrackingUrl: webUrl,
  };
}

export function executeAddTrackingPin(params: {
  marathon: MarathonId;
  lat: number;
  lon: number;
  timestamp: string;
  startTime: string;
  targetFinishTime?: string;
  targetPace?: string;
  paceUnit?: 'km' | 'mi';
  strategy?: 'flat' | 'fatigue' | 'negative';
  existingPins?: RawPinInput[];
  baseUrl?: string;
}) {
  const {
    marathon,
    lat,
    lon,
    timestamp,
    startTime,
    targetFinishTime,
    targetPace,
    paceUnit = 'km',
    strategy = 'fatigue',
    existingPins = [],
    baseUrl = 'https://watchmy.run',
  } = params;

  const course = getCourseData(marathon);
  const info = getMarathonInfo(marathon);

  let finishSeconds: number;
  if (targetFinishTime) {
    finishSeconds = parseFinishTimeToSeconds(targetFinishTime);
  } else if (targetPace) {
    finishSeconds = convertPaceToFinishSeconds(targetPace, paceUnit, course.distanceM);
  } else {
    finishSeconds = parseFinishTimeToSeconds(info.defaultFinishTime);
  }

  const pinDate = resolveDateTime(timestamp);
  const startDate = resolveDateTime(startTime, pinDate);

  const parsedExistingPins: TrackingPin[] = existingPins.map((p, idx) => {
    const d = resolveDateTime(p.timestamp, startDate);
    const elapsed = Math.max(0, (d.getTime() - startDate.getTime()) / 1000);
    const expDist = (elapsed / finishSeconds) * course.distanceM;
    const s = snapCoordinateToCourse(p.lat, p.lon, course.points, expDist);
    return {
      id: p.id || `pin_${idx}_${d.getTime()}`,
      lat: p.lat,
      lon: p.lon,
      timestamp: d.toISOString(),
      snappedDistM: s ? s.snappedDistM : 0,
      snappedLat: s ? s.snappedLat : p.lat,
      snappedLon: s ? s.snappedLon : p.lon,
      snappedEle: s ? s.snappedEle : 0,
    };
  });

  const elapsedAtNewPin = Math.max(0, (pinDate.getTime() - startDate.getTime()) / 1000);
  const expectedDistM = (elapsedAtNewPin / finishSeconds) * course.distanceM;
  const snapResult = snapCoordinateToCourse(lat, lon, course.points, expectedDistM);

  if (!snapResult) {
    throw new Error('Failed to snap coordinate to course geometry.');
  }

  const newPin: TrackingPin = {
    id: `pin_${parsedExistingPins.length + 1}_${pinDate.getTime()}`,
    lat,
    lon,
    timestamp: pinDate.toISOString(),
    snappedDistM: snapResult.snappedDistM,
    snappedLat: snapResult.snappedLat,
    snappedLon: snapResult.snappedLon,
    snappedEle: snapResult.snappedEle,
  };

  const allPins = [...parsedExistingPins, newPin];
  const calibration = calculatePinCalibration(allPins, startDate, course.distanceM, finishSeconds);

  const targetSpeed = course.distanceM / finishSeconds;
  const paceDeltaSecPerKm = Math.round(calibration.impliedPaceSecPerKm - 1000 / targetSpeed);
  const paceDeltaText =
    paceDeltaSecPerKm === 0
      ? 'Exactly on planned target pace'
      : paceDeltaSecPerKm > 0
      ? `${paceDeltaSecPerKm}s/km slower than target`
      : `${Math.abs(paceDeltaSecPerKm)}s/km faster than target`;

  const webUrl = buildRaceUrl(
    {
      marathon,
      startTime,
      finishTime: formatSecondsToHms(finishSeconds),
      strategy: strategy as PacingStrategy,
      pins: allPins,
    },
    baseUrl
  );

  return {
    success: true,
    marathon: info.name,
    pinAdded: {
      id: newPin.id,
      snappedMile: Number((snapResult.snappedDistM / 1609.344).toFixed(2)),
      snappedKm: Number((snapResult.snappedDistM / 1000).toFixed(2)),
      orthogonalErrorMeters: Number(snapResult.orthogonalDistanceM.toFixed(1)),
      snappedCoordinates: {
        lat: snapResult.snappedLat,
        lon: snapResult.snappedLon,
        ele: snapResult.snappedEle,
      },
    },
    recalibration: {
      isCalibrated: calibration.isCalibrated,
      impliedPaceMinPerKm: calibration.impliedPaceMinPerKm,
      impliedPaceMinPerMi: calibration.impliedPaceMinPerMi,
      paceDeltaVsTarget: paceDeltaText,
      newProjectedFinishTime: calibration.projectedFinishHms,
      originalTargetFinishTime: formatSecondsToHms(finishSeconds),
      summaryText: calibration.summaryText,
    },
    allPins: allPins.map((p) => ({
      id: p.id,
      lat: p.lat,
      lon: p.lon,
      timestamp: p.timestamp,
      snappedKm: Number((p.snappedDistM / 1000).toFixed(2)),
    })),
    webTrackingUrl: webUrl,
  };
}

export function executeGenerateRaceUrl(params: {
  marathon: MarathonId;
  startTime?: string;
  targetFinishTime?: string;
  targetPace?: string;
  strategy?: 'flat' | 'fatigue' | 'negative';
  pins?: RawPinInput[];
  spectatorMiles?: number[];
  customBaseUrl?: string;
}) {
  const {
    marathon,
    startTime,
    targetFinishTime,
    targetPace,
    strategy,
    pins = [],
    spectatorMiles,
    customBaseUrl = 'https://watchmy.run',
  } = params;

  const course = getCourseData(marathon);

  const snappedPins: TrackingPin[] = pins.map((p, idx) => {
    const snap = snapCoordinateToCourse(p.lat, p.lon, course.points);
    return {
      id: p.id || `pin_${idx}`,
      lat: p.lat,
      lon: p.lon,
      timestamp: p.timestamp,
      snappedDistM: snap ? snap.snappedDistM : 0,
      snappedLat: snap ? snap.snappedLat : p.lat,
      snappedLon: snap ? snap.snappedLon : p.lon,
      snappedEle: snap ? snap.snappedEle : 0,
    };
  });

  const spectatorDistMList = spectatorMiles?.map((m) => m * 1609.344);

  const url = buildRaceUrl(
    {
      marathon,
      startTime,
      finishTime: targetFinishTime,
      pace: targetPace,
      strategy: strategy as PacingStrategy,
      pins: snappedPins,
      spectatorDistMList,
    },
    customBaseUrl
  );

  return {
    url,
    markdownLink: `[Open Live Race Map in WatchMy.Run](${url})`,
  };
}
