import { MARATHON_REGISTRY } from '../../src/lib/data/marathonRegistry';
import { CURATED_POPULAR_RACES, RaceSearchResult } from '../../src/lib/data/raceAggregatorSearch';
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
  resolveCourseAndInfo,
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

export async function executeSearchRaceCourses(query: string) {
  const q = query.trim();
  if (!q) {
    return {
      query: '',
      results: CURATED_POPULAR_RACES,
    };
  }

  const lower = q.toLowerCase();
  const curatedMatches = CURATED_POPULAR_RACES.filter(
    (r) => r.title.toLowerCase().includes(lower) || r.subtitle.toLowerCase().includes(lower)
  );

  const results: RaceSearchResult[] = [...curatedMatches];
  const seenTitles = new Set<string>(results.map((r) => r.title.toLowerCase()));

  const addResult = (item: RaceSearchResult) => {
    const key = item.title.toLowerCase().trim();
    if (!seenTitles.has(key)) {
      seenTitles.add(key);
      results.push(item);
    }
  };

  // 1. Search RideWithGPS public routes via DuckDuckGo HTML
  try {
    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(
      `site:ridewithgps.com/routes ${q}`
    )}`;
    const ddgRes = await fetch(ddgUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html',
      },
    });
    if (ddgRes.ok) {
      const html = await ddgRes.text();
      const linkRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
      let match: RegExpExecArray | null;
      const seenIds = new Set<string>();
      while ((match = linkRegex.exec(html)) !== null) {
        const rawHref = decodeURIComponent(match[1]);
        const rwgIdMatch = rawHref.match(/ridewithgps\.com\/routes\/(\d+)/i);
        if (rwgIdMatch && !seenIds.has(rwgIdMatch[1])) {
          const routeId = rwgIdMatch[1];
          seenIds.add(routeId);
          const cleanTitle = match[2]
            .replace(/<[^>]+>/g, '')
            .replace(/\s*\|\s*Ride with GPS.*$/i, '')
            .replace(/\s*-\s*Ride with GPS.*$/i, '')
            .trim();
          addResult({
            id: `rwg_${routeId}`,
            title: cleanTitle || `RideWithGPS Route #${routeId}`,
            subtitle: `RideWithGPS Route #${routeId}`,
            source: 'ridewithgps',
            sourceLabel: 'RideWithGPS',
            routeUrl: `https://ridewithgps.com/routes/${routeId}`,
            externalUrl: `https://ridewithgps.com/routes/${routeId}`,
          });
        }
      }
    }
  } catch {
    // Continue if DDG search fails
  }

  // 2. Search OpenStreetMap Overpass API for running/foot relations
  try {
    const safeQuery = q.replace(/[.*+?^${}()|[\]\\"]/g, ' ').trim();
    if (safeQuery.length >= 2) {
      const overpassQl = `[out:json][timeout:10];(relation["route"~"running|foot|fitness_trail"]["name"~"${safeQuery}",i];);out tags center 10;`;
      const osmRes = await fetch(
        `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQl)}`,
        {
          headers: {
            'User-Agent': 'WatchMyRun/1.3 (+https://watchmy.run)',
            Accept: 'application/json',
          },
        }
      );
      if (osmRes.ok) {
        const osmData = (await osmRes.json()) as any;
        if (Array.isArray(osmData.elements)) {
          for (const el of osmData.elements) {
            if (el.type === 'relation' && el.tags?.name) {
              const name = el.tags['name:en'] || el.tags.name;
              const loc =
                el.tags['addr:city'] || el.tags.network || el.tags.operator || 'Running Course';
              addResult({
                id: `osm_${el.id}`,
                title: name,
                subtitle: `${loc} (OSM #${el.id})`,
                source: 'osm',
                sourceLabel: 'OpenStreetMap',
                routeUrl: `osm-relation://${el.id}`,
                externalUrl: `https://www.openstreetmap.org/relation/${el.id}`,
              });
            }
          }
        }
      }
    }
  } catch {
    // Continue if OSM search fails
  }

  // 3. Search Waymarked Trails API (all route IDs are OpenStreetMap relation IDs)
  try {
    const wmtUrl = `https://hiking.waymarkedtrails.org/api/v1/list/search?query=${encodeURIComponent(
      q
    )}&limit=8`;
    const wmtRes = await fetch(wmtUrl, {
      headers: {
        'User-Agent': 'WatchMyRun/1.3 (+https://watchmy.run)',
        Accept: 'application/json',
      },
    });
    if (wmtRes.ok) {
      const wmtData = (await wmtRes.json()) as any;
      if (Array.isArray(wmtData.results)) {
        for (const item of wmtData.results) {
          if (item.id && item.name) {
            addResult({
              id: `wmt_${item.id}`,
              title: item.name,
              subtitle: `${item.group || item.ref || 'Mapped Route'} (OSM #${item.id})`,
              source: 'waymarked',
              sourceLabel: 'Waymarked Trails',
              routeUrl: `osm-relation://${item.id}`,
              externalUrl: `https://hiking.waymarkedtrails.org/#route?id=${item.id}`,
            });
          }
        }
      }
    }
  } catch {
    // Continue if WMT search fails
  }

  return {
    query: q,
    results: results.slice(0, 20),
  };
}

export async function executeGetCourseLandmarks(params: {
  marathon?: MarathonId;
  courseUrl?: string;
  courseContent?: string;
  courseTitle?: string;
}) {
  const { course, info } = await resolveCourseAndInfo(params);

  return {
    marathon: info.name,
    distanceM: course.distanceM,
    distanceKm: Number((course.distanceM / 1000).toFixed(2)),
    distanceMi: Number((course.distanceM / 1609.344).toFixed(2)),
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

export async function executeCalculateForecast(params: {
  marathon?: MarathonId;
  courseUrl?: string;
  courseContent?: string;
  courseTitle?: string;
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
    courseUrl,
    courseContent,
    courseTitle,
    startTime,
    targetFinishTime,
    targetPace,
    paceUnit = 'km',
    strategy = 'fatigue',
    queryTime,
    pins = [],
    baseUrl = 'https://watchmy.run',
  } = params;

  const { course, info, marathonId, trackUrl, trackTitle } = await resolveCourseAndInfo({
    marathon,
    courseUrl,
    courseContent,
    courseTitle,
  });

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
      marathon: marathonId,
      trackUrl,
      trackTitle,
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

export async function executeGetCheerWindows(params: {
  marathon?: MarathonId;
  courseUrl?: string;
  courseContent?: string;
  courseTitle?: string;
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
    courseUrl,
    courseContent,
    courseTitle,
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

  const { course, info, marathonId, trackUrl, trackTitle } = await resolveCourseAndInfo({
    marathon,
    courseUrl,
    courseContent,
    courseTitle,
  });

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
      const preset = info.cheerPresets.find((cp: { id: string }) => cp.id === loc.presetId);
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
      marathon: marathonId,
      trackUrl,
      trackTitle,
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

export async function executeAddTrackingPin(params: {
  marathon?: MarathonId;
  courseUrl?: string;
  courseContent?: string;
  courseTitle?: string;
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
    courseUrl,
    courseContent,
    courseTitle,
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

  const { course, info, marathonId, trackUrl, trackTitle } = await resolveCourseAndInfo({
    marathon,
    courseUrl,
    courseContent,
    courseTitle,
  });

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
      marathon: marathonId,
      trackUrl,
      trackTitle,
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

export async function executeGenerateRaceUrl(params: {
  marathon?: MarathonId;
  courseUrl?: string;
  courseContent?: string;
  courseTitle?: string;
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
    courseUrl,
    courseContent,
    courseTitle,
    startTime,
    targetFinishTime,
    targetPace,
    strategy,
    pins = [],
    spectatorMiles,
    customBaseUrl = 'https://watchmy.run',
  } = params;

  const { course, marathonId, trackUrl, trackTitle } = await resolveCourseAndInfo({
    marathon,
    courseUrl,
    courseContent,
    courseTitle,
  });

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
      marathon: marathonId,
      trackUrl,
      trackTitle,
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
