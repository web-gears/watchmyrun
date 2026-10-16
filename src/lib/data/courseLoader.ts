import { CourseData, CoursePoint, MarathonId, TimingMat } from '../forecasting/types';
import { MARATHON_REGISTRY } from './marathonRegistry';

interface GeoJsonFeature {
  type: string;
  id?: string;
  properties?: any;
  geometry: {
    type: string;
    coordinates: any;
  };
}

interface GeoJsonPayload {
  type: string;
  properties?: any;
  features: GeoJsonFeature[];
}

const memoryCache = new Map<MarathonId, CourseData>();

export async function loadCourseData(marathonId: MarathonId): Promise<CourseData> {
  if (memoryCache.has(marathonId)) {
    return memoryCache.get(marathonId)!;
  }

  const info = MARATHON_REGISTRY[marathonId];
  if (!info) {
    throw new Error(`Unknown marathon ID: ${marathonId}`);
  }

  let geoJsonData: GeoJsonPayload | null = null;
  let source = 'local';

  // Attempt online-first fetch with a 2.5 second timeout
  if (typeof window !== 'undefined') {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      // Attempt loading from local static bundle first or online endpoint
      const response = await fetch(info.localGeoJsonPath, {
        signal: controller.signal,
        cache: 'default',
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        geoJsonData = await response.json();
        source = 'bundled';
      }
    } catch {
      // Offline fallback
    }
  }

  if (!geoJsonData) {
    try {
      const res = await fetch(info.localGeoJsonPath);
      if (res.ok) {
        geoJsonData = (await res.json()) as GeoJsonPayload;
      }
    } catch {
      // ignore
    }
  }

  if (!geoJsonData) {
    throw new Error(`Failed to load or parse course data for ${marathonId}`);
  }

  const course = parseGeoJsonPayload(marathonId, info.name, geoJsonData);
  memoryCache.set(marathonId, course);
  return course;
}

function parseGeoJsonPayload(id: MarathonId, title: string, data: GeoJsonPayload): CourseData {
  const lineFeature = data.features.find(
    (f) => f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString'
  );

  if (!lineFeature) {
    throw new Error(`No LineString geometry found in GeoJSON for ${id}`);
  }

  const coords: number[][] =
    lineFeature.geometry.type === 'MultiLineString'
      ? lineFeature.geometry.coordinates.flat()
      : lineFeature.geometry.coordinates;

  const distancesM: number[] = lineFeature.properties?.distances_m || [];
  const elevationsM: number[] = lineFeature.properties?.elevations_m || [];
  const gradesPct: number[] = lineFeature.properties?.grades_pct || [];

  const points: CoursePoint[] = coords.map((c, i) => ({
    lon: c[0],
    lat: c[1],
    ele: elevationsM[i] !== undefined ? elevationsM[i] : c[2] || 0,
    cumDistM: distancesM[i] !== undefined ? distancesM[i] : (i / (coords.length - 1)) * 42195,
    gradePct: gradesPct[i] !== undefined ? gradesPct[i] : 0,
  }));

  // Parse timing split points
  const timingMats: TimingMat[] = [];
  const pointFeatures = data.features.filter((f) => f.geometry.type === 'Point');

  if (pointFeatures.length > 0) {
    for (const f of pointFeatures) {
      const p = f.properties || {};
      const coord = f.geometry.coordinates;
      timingMats.push({
        name: p.split_name || 'Checkpoint',
        targetDistM: (p.distance_km || 0) * 1000,
        actualDistM: (p.distance_km || 0) * 1000,
        lat: coord[1],
        lon: coord[0],
        ele: coord[2] || p.elevation_m || 0,
      });
    }
  }

  // Sort timing mats by distance
  timingMats.sort((a, b) => a.actualDistM - b.actualDistM);

  const totalDistM = points.length > 0 ? points[points.length - 1].cumDistM : 42195;
  const elevSummary = data.properties?.elevation_summary || {
    startM: points[0]?.ele || 0,
    finishM: points[points.length - 1]?.ele || 0,
    netM: (points[points.length - 1]?.ele || 0) - (points[0]?.ele || 0),
    minM: Math.min(...points.map((p) => p.ele)),
    maxM: Math.max(...points.map((p) => p.ele)),
    gainM: 0,
    lossM: 0,
  };

  const bbox = data.properties?.bbox || [-74.1, 40.5, -73.8, 40.9];

  return {
    id,
    title,
    distanceM: totalDistM,
    points,
    timingMats,
    bbox,
    elevationSummary: elevSummary,
  };
}
