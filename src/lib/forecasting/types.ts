export type MajorMarathonId = 'new_york' | 'boston' | 'chicago' | 'london' | 'berlin' | 'tokyo';
export type MarathonId = MajorMarathonId | 'custom';

export interface CoursePoint {
  lat: number;
  lon: number;
  ele: number;
  cumDistM: number;
  gradePct: number;
  bearingDeg?: number;
}

export interface TimingMat {
  name: string;
  targetDistM: number;
  actualDistM: number;
  lat: number;
  lon: number;
  ele: number;
}

export interface ElevationSummary {
  startM: number;
  finishM: number;
  netM: number;
  minM: number;
  maxM: number;
  gainM: number;
  lossM: number;
}

export interface CourseData {
  id: MarathonId | string;
  title: string;
  distanceM: number;
  points: CoursePoint[];
  timingMats: TimingMat[];
  bbox: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  elevationSummary: ElevationSummary;
}

export type PacingStrategy = 'even' | 'fatigue' | 'gap_elevation';

export interface TrackingPin {
  id: string;
  lat: number;
  lon: number;
  timestamp: string; // ISO string or time string
  loopIndex?: number;
  snappedDistM: number;
  snappedLat: number;
  snappedLon: number;
  snappedEle: number;
  impliedPaceSecPerKm?: number;
  note?: string;
}

export interface PrecisionEstimate {
  uncertaintyDistM: number;
  confidenceSpanM: [number, number]; // [sMin, sMax]
  spanLineCoords: [number, number][]; // [lat, lon][]
  radiusMeters: number;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  reason: string;
}

export interface UpcomingSplit {
  name: string;
  distKm: number;
  eta: string;
  secondsAway: number;
}

export interface RunnerForecastResult {
  status: 'NOT_STARTED' | 'ON_COURSE' | 'FINISHED';
  queryTime: string;
  elapsedSeconds: number;
  currentDistM: number;
  currentDistKm: number;
  currentDistMi: number;
  progressPct: number;
  coord: {
    lat: number;
    lon: number;
    ele: number;
    bearingDeg: number;
    gradePct: number;
  };
  instantPaceMinPerKm: string;
  instantPaceMinPerMi: string;
  projectedFinishTime: string;
  calibratedPace?: {
    isCalibrated: boolean;
    paceMinPerKm: string;
    paceMinPerMi: string;
    summaryText: string;
    projectedFinishHms: string;
  };
  precision: PrecisionEstimate;
  upcomingSplits: UpcomingSplit[];
  activePacingStrategy: PacingStrategy;
}

export interface CheerSpotPreset {
  id: string;
  name: string;
  mile: number;
  distM: number;
  description?: string;
}

export interface SpectatorSpot {
  id: string;
  name: string;
  distM: number;
  mile: number;
  lat: number;
  lon: number;
  ele?: number;
  isCustom?: boolean;
}

export interface SpectatorMeetingWindow {
  spotId: string;
  spotName: string;
  distKm: number;
  distMi: number;
  lat: number;
  lon: number;
  ele: number;
  expectedEta: string;
  windowEarly: string;
  windowLate: string;
  secondsAway: number;
  distanceFromRunnerKm: number;
  hasRunnerPassed: boolean;
  passedAgoSec?: number;
}

