import { RaceDistanceId } from '../data/newYorkCourses';
import { MarathonId, PacingStrategy, TrackingPin } from '../forecasting/types';

export interface AppUrlState {
  marathon?: MarathonId;
  distance?: RaceDistanceId;
  startTime?: string; // HH:mm
  pace?: string; // mm:ss
  finishTime?: string; // hh:mm:ss
  strategy?: PacingStrategy;
  pins?: TrackingPin[];
  spectatorDistM?: number;
  spectatorDistMList?: number[];
  trackUrl?: string;
  trackTitle?: string;
}

const VALID_MARATHONS: MarathonId[] = [
  'new_york',
  'boston',
  'chicago',
  'london',
  'berlin',
  'tokyo',
  'custom',
];
const VALID_DISTANCES: RaceDistanceId[] = ['marathon', 'half', '10k', '5k'];

export function parseUrlState(searchParams: URLSearchParams): AppUrlState {
  const raceParam = searchParams.get('race') || searchParams.get('marathon');
  const distParam = searchParams.get('distance');

  let marathon: MarathonId | undefined;
  let distance: RaceDistanceId | undefined;

  if (raceParam && VALID_MARATHONS.includes(raceParam as MarathonId)) {
    marathon = raceParam as MarathonId;
  } else if (raceParam && VALID_DISTANCES.includes(raceParam as RaceDistanceId)) {
    // Backward compatibility if race was used for distance
    marathon = 'new_york';
    distance = raceParam as RaceDistanceId;
  }

  if (distParam && VALID_DISTANCES.includes(distParam as RaceDistanceId)) {
    distance = distParam as RaceDistanceId;
  }

  const startTime = searchParams.get('start') || undefined;
  const pace = searchParams.get('pace') || undefined;
  const finishTime = searchParams.get('finish') || undefined;
  const strategy = (searchParams.get('strategy') as PacingStrategy) || undefined;

  const pinsParam = searchParams.get('pins');
  let pins: TrackingPin[] | undefined;
  if (pinsParam) {
    try {
      // Format: lat,lon,epochSec|lat,lon,epochSec
      pins = pinsParam.split('|').map((item, idx) => {
        const [latStr, lonStr, epochStr] = item.split(',');
        const lat = parseFloat(latStr);
        const lon = parseFloat(lonStr);
        const epochMs = parseInt(epochStr, 10) * 1000;
        return {
          id: `pin_${idx}_${epochStr}`,
          lat,
          lon,
          timestamp: new Date(epochMs).toISOString(),
          snappedDistM: 0,
          snappedLat: lat,
          snappedLon: lon,
          snappedEle: 0,
        };
      });
    } catch {
      // Ignore parse failure
    }
  }

  const specStr = searchParams.get('spectator');
  let spectatorDistMList: number[] | undefined;
  let spectatorDistM: number | undefined;
  if (specStr) {
    const parts = specStr
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n) && n > 0);
    if (parts.length > 0) {
      spectatorDistMList = parts;
      spectatorDistM = parts[0];
    }
  }

  const trackUrl = searchParams.get('trackUrl') || searchParams.get('routeUrl') || undefined;
  const trackTitle = searchParams.get('trackTitle') || searchParams.get('title') || undefined;
  if (!marathon && trackUrl) {
    marathon = 'custom';
  }

  return {
    marathon,
    distance,
    startTime,
    pace,
    finishTime,
    strategy,
    pins,
    spectatorDistM,
    spectatorDistMList,
    trackUrl,
    trackTitle,
  };
}

export function serializeUrlState(state: AppUrlState): string {
  const params = new URLSearchParams();

  if (state.marathon) {
    params.set('race', state.marathon);
  }
  if (state.marathon === 'new_york' && state.distance && state.distance !== 'marathon') {
    params.set('distance', state.distance);
  }

  if (state.trackUrl) params.set('trackUrl', state.trackUrl);
  if (state.trackTitle) params.set('trackTitle', state.trackTitle);

  if (state.startTime) params.set('start', state.startTime);
  if (state.pace) params.set('pace', state.pace);
  if (state.finishTime) params.set('finish', state.finishTime);
  if (state.strategy && state.strategy !== 'fatigue') params.set('strategy', state.strategy);

  if (state.pins && state.pins.length > 0) {
    const encoded = state.pins
      .map((p) => {
        const epochSec = Math.round(new Date(p.timestamp).getTime() / 1000);
        return `${p.lat.toFixed(5)},${p.lon.toFixed(5)},${epochSec}`;
      })
      .join('|');
    params.set('pins', encoded);
  }

  if (state.spectatorDistMList && state.spectatorDistMList.length > 0) {
    params.set('spectator', state.spectatorDistMList.map((m) => Math.round(m)).join(','));
  } else if (state.spectatorDistM !== undefined && state.spectatorDistM > 0) {
    params.set('spectator', Math.round(state.spectatorDistM).toString());
  }

  return params.toString();
}
