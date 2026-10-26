import { CourseData, CoursePoint, TimingMat, ElevationSummary } from '../forecasting/types';
import { haversineDistance, interpolateAtDistance } from '../forecasting/geodesy';

/**
 * Parses raw GPX or TCX XML string into a fully typed WatchMy.Run CourseData object.
 */
export function parseGpxToCourseData(gpxText: string, defaultTitle = 'Custom Course'): CourseData {
  const win = (globalThis as any).window;
  let doc: any;
  if (typeof win !== 'undefined' && typeof win.DOMParser !== 'undefined') {
    const parser = new win.DOMParser();
    doc = parser.parseFromString(gpxText, 'application/xml');
  } else {
    // Non-browser environment (Cloudflare Workers / Node.js) fallback
    return parseGpxSimpleRegex(gpxText, defaultTitle);
  }

  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('Invalid XML format: parsing failed.');
  }

  // 1. Extract Course Title (GPX or TCX)
  const titleElem = doc.querySelector(
    'metadata > name, trk > name, rte > name, gpx > name, Course > Name, Activity > Id'
  );
  const courseTitle = titleElem?.textContent?.trim() || defaultTitle;

  const rawCoords: { lat: number; lon: number; ele: number }[] = [];

  // 2a. Extract GPX Track Points (<trkpt>, <rtept>, or fallback to <wpt>)
  let ptNodes: any[] = Array.from(doc.querySelectorAll('trkpt'));
  if (ptNodes.length === 0) {
    ptNodes = Array.from(doc.querySelectorAll('rtept'));
  }
  if (ptNodes.length === 0) {
    ptNodes = Array.from(doc.querySelectorAll('wpt'));
  }

  if (ptNodes.length >= 2) {
    for (const node of ptNodes) {
      const latStr = node.getAttribute('lat');
      const lonStr = node.getAttribute('lon');
      if (!latStr || !lonStr) continue;

      const lat = parseFloat(latStr);
      const lon = parseFloat(lonStr);
      if (isNaN(lat) || isNaN(lon)) continue;

      const eleElem = node.querySelector('ele');
      const ele = eleElem && eleElem.textContent ? parseFloat(eleElem.textContent) : 0.0;

      rawCoords.push({ lat, lon, ele: isNaN(ele) ? 0.0 : ele });
    }
  } else {
    // 2b. Check for Garmin TCX <Trackpoint> elements
    const tcxNodes: any[] = Array.from(doc.querySelectorAll('Trackpoint'));
    for (const node of tcxNodes) {
      const latElem = node.querySelector('Position > LatitudeDegrees');
      const lonElem = node.querySelector('Position > LongitudeDegrees');
      if (!latElem?.textContent || !lonElem?.textContent) continue;

      const lat = parseFloat(latElem.textContent);
      const lon = parseFloat(lonElem.textContent);
      if (isNaN(lat) || isNaN(lon)) continue;

      const eleElem = node.querySelector('AltitudeMeters');
      const ele = eleElem && eleElem.textContent ? parseFloat(eleElem.textContent) : 0.0;

      rawCoords.push({ lat, lon, ele: isNaN(ele) ? 0.0 : ele });
    }
  }

  if (rawCoords.length < 2) {
    throw new Error('Track file contains insufficient coordinate points (minimum 2 points required).');
  }

  // 3. Extract Waypoints as Potential Landmarks / Cheer Presets
  const wptNodes: any[] = Array.from(doc.querySelectorAll('gpx > wpt'));
  const waypoints = wptNodes
    .map((wpt: any) => {
      const lat = parseFloat(wpt.getAttribute('lat') || '0');
      const lon = parseFloat(wpt.getAttribute('lon') || '0');
      const name = wpt.querySelector('name')?.textContent?.trim() || 'Waypoint';
      return { lat, lon, name };
    })
    .filter((w) => !isNaN(w.lat) && !isNaN(w.lon) && w.lat !== 0);

  return buildCourseDataFromCoords(courseTitle, rawCoords, waypoints);
}

/**
 * Zero-dependency binary parser for Garmin FIT (.fit) course and activity files.
 * Extracts track records (Global Msg 20: position_lat, position_long, altitude/enhanced_altitude)
 * and course metadata (Global Msg 31: course name).
 */
export function parseFitToCourseData(buffer: ArrayBuffer, defaultTitle = 'Custom Course'): CourseData {
  const view = new DataView(buffer);
  if (buffer.byteLength < 14) {
    throw new Error('Invalid FIT file: file is too small.');
  }

  const headerSize = view.getUint8(0);
  if (headerSize < 12 || headerSize > 64) {
    throw new Error('Invalid FIT file header size.');
  }

  // Verify ".FIT" magic ASCII signature at bytes 8..11
  const magic =
    String.fromCharCode(view.getUint8(8)) +
    String.fromCharCode(view.getUint8(9)) +
    String.fromCharCode(view.getUint8(10)) +
    String.fromCharCode(view.getUint8(11));
  if (magic !== '.FIT') {
    throw new Error('Invalid FIT file: missing ".FIT" signature.');
  }

  const dataSize = view.getUint32(4, true);
  const endOffset = Math.min(buffer.byteLength, headerSize + dataSize);

  interface FitFieldDef {
    defNum: number;
    size: number;
    baseType: number;
  }
  interface FitMessageDef {
    littleEndian: boolean;
    globalMsgNum: number;
    fields: FitFieldDef[];
    devFieldSizes: number[];
  }

  const localDefs = new Map<number, FitMessageDef>();
  const rawCoords: { lat: number; lon: number; ele: number }[] = [];
  let courseTitle = defaultTitle;
  const SEMICIRCLE_TO_DEG = 180 / 2147483648; // 180 / 2^31

  let offset = headerSize;

  while (offset < endOffset) {
    const recordHeader = view.getUint8(offset++);
    const isCompressedTimestamp = (recordHeader & 0x80) !== 0;
    const isDefinition = !isCompressedTimestamp && (recordHeader & 0x40) !== 0;

    if (isDefinition) {
      const hasDevData = (recordHeader & 0x20) !== 0;
      const localMsgType = recordHeader & 0x0f;

      if (offset + 5 > endOffset) break;
      offset++; // Reserved byte
      const arch = view.getUint8(offset++);
      const littleEndian = arch === 0;
      const globalMsgNum = view.getUint16(offset, littleEndian);
      offset += 2;
      const numFields = view.getUint8(offset++);

      const fields: FitFieldDef[] = [];
      for (let i = 0; i < numFields; i++) {
        if (offset + 3 > endOffset) break;
        const defNum = view.getUint8(offset++);
        const size = view.getUint8(offset++);
        const baseType = view.getUint8(offset++);
        fields.push({ defNum, size, baseType });
      }

      const devFieldSizes: number[] = [];
      if (hasDevData && offset < endOffset) {
        const numDevFields = view.getUint8(offset++);
        for (let i = 0; i < numDevFields; i++) {
          if (offset + 3 > endOffset) break;
          offset++; // fieldNum
          const size = view.getUint8(offset++);
          offset++; // devDataIndex
          devFieldSizes.push(size);
        }
      }

      localDefs.set(localMsgType, {
        littleEndian,
        globalMsgNum,
        fields,
        devFieldSizes,
      });
    } else {
      // Data Message (Normal or Compressed Timestamp)
      const localMsgType = isCompressedTimestamp
        ? (recordHeader >> 5) & 0x03
        : recordHeader & 0x0f;

      const def = localDefs.get(localMsgType);
      if (!def) {
        break;
      }

      let lat: number | null = null;
      let lon: number | null = null;
      let alt: number | null = null;
      let enhancedAlt: number | null = null;

      for (const field of def.fields) {
        if (offset + field.size > endOffset) {
          offset = endOffset;
          break;
        }

        // Global Msg 20 = Record (Trackpoint)
        if (def.globalMsgNum === 20) {
          if (field.defNum === 0 && field.size === 4) {
            const rawLat = view.getInt32(offset, def.littleEndian);
            if (rawLat !== 0x7fffffff) {
              lat = rawLat * SEMICIRCLE_TO_DEG;
            }
          } else if (field.defNum === 1 && field.size === 4) {
            const rawLon = view.getInt32(offset, def.littleEndian);
            if (rawLon !== 0x7fffffff) {
              lon = rawLon * SEMICIRCLE_TO_DEG;
            }
          } else if (field.defNum === 2 && field.size === 2) {
            const rawAlt = view.getUint16(offset, def.littleEndian);
            if (rawAlt !== 0xffff) {
              alt = rawAlt / 5.0 - 500.0;
            }
          } else if (field.defNum === 78 && field.size === 4) {
            const rawEnhAlt = view.getUint32(offset, def.littleEndian);
            if (rawEnhAlt !== 0xffffffff) {
              enhancedAlt = rawEnhAlt / 5.0 - 500.0;
            }
          }
        } else if (def.globalMsgNum === 31 && field.defNum === 5) {
          // Global Msg 31 = Course, Field 5 = Course Name (string)
          const bytes = new Uint8Array(buffer, offset, field.size);
          let endIdx = bytes.indexOf(0);
          if (endIdx === -1) endIdx = bytes.length;
          if (endIdx > 0) {
            try {
              const decoded = new TextDecoder('utf-8').decode(bytes.subarray(0, endIdx)).trim();
              if (decoded) courseTitle = decoded;
            } catch {
              // Ignore string decode error
            }
          }
        }

        offset += field.size;
      }

      for (const devSize of def.devFieldSizes) {
        offset += devSize;
      }

      if (
        def.globalMsgNum === 20 &&
        lat !== null &&
        lon !== null &&
        Math.abs(lat) <= 90 &&
        Math.abs(lon) <= 180 &&
        (lat !== 0 || lon !== 0)
      ) {
        rawCoords.push({
          lat,
          lon,
          ele: enhancedAlt ?? alt ?? 0.0,
        });
      }
    }
  }

  if (rawCoords.length < 2) {
    throw new Error('FIT file contains insufficient GPS trackpoints (minimum 2 points required).');
  }

  return buildCourseDataFromCoords(courseTitle, rawCoords);
}

/**
 * Parses GeoJSON text into a CourseData object.
 */
export function parseGeoJsonToCourseData(geoJsonText: string, defaultTitle = 'Custom Course'): CourseData {
  const json = JSON.parse(geoJsonText);
  let title = defaultTitle;
  const rawCoords: { lat: number; lon: number; ele: number }[] = [];

  let lineStringFeature: any = null;

  if (json.type === 'FeatureCollection' && Array.isArray(json.features)) {
    lineStringFeature = json.features.find(
      (f: any) => f.geometry?.type === 'LineString' || f.geometry?.type === 'MultiLineString'
    );
    if (json.properties?.name) title = json.properties.name;
    if (lineStringFeature?.properties?.name) title = lineStringFeature.properties.name;
  } else if (json.type === 'Feature') {
    lineStringFeature = json;
    if (json.properties?.name) title = json.properties.name;
  } else if (json.type === 'LineString' || json.type === 'MultiLineString') {
    lineStringFeature = { geometry: json };
  }

  if (!lineStringFeature || !lineStringFeature.geometry) {
    throw new Error('No valid LineString or MultiLineString found in GeoJSON.');
  }

  const coordsArray: number[][] =
    lineStringFeature.geometry.type === 'MultiLineString'
      ? lineStringFeature.geometry.coordinates.flat()
      : lineStringFeature.geometry.coordinates;

  for (const c of coordsArray) {
    if (!Array.isArray(c) || c.length < 2) continue;
    const lon = Number(c[0]);
    const lat = Number(c[1]);
    const ele = c.length > 2 && !isNaN(Number(c[2])) ? Number(c[2]) : 0.0;
    if (!isNaN(lon) && !isNaN(lat)) {
      rawCoords.push({ lat, lon, ele });
    }
  }

  if (rawCoords.length < 2) {
    throw new Error('Failed to extract valid coordinates from GeoJSON.');
  }

  return buildCourseDataFromCoords(title, rawCoords);
}

/**
 * Common builder for calculating geodesic distance, elevation profiles,
 * automatic timing mats, and bounding box from coordinates.
 */
function buildCourseDataFromCoords(
  title: string,
  rawCoords: { lat: number; lon: number; ele: number }[],
  waypoints: { lat: number; lon: number; name: string }[] = []
): CourseData {
  // Downsample if excessively dense (> 3000 points) to guarantee fast 60fps mobile map performance
  const coords = downsampleCoords(rawCoords, 2500);

  let cumDistM = 0;
  let minLat = coords[0].lat;
  let maxLat = coords[0].lat;
  let minLon = coords[0].lon;
  let maxLon = coords[0].lon;

  let minEle = coords[0].ele;
  let maxEle = coords[0].ele;
  let gainM = 0;
  let lossM = 0;

  const points: CoursePoint[] = [];

  for (let i = 0; i < coords.length; i++) {
    const pt = coords[i];

    if (i > 0) {
      const prev = coords[i - 1];
      const d = haversineDistance(prev.lat, prev.lon, pt.lat, pt.lon);
      cumDistM += d;

      const dele = pt.ele - prev.ele;
      if (dele > 0) gainM += dele;
      else if (dele < 0) lossM += Math.abs(dele);
    }

    minLat = Math.min(minLat, pt.lat);
    maxLat = Math.max(maxLat, pt.lat);
    minLon = Math.min(minLon, pt.lon);
    maxLon = Math.max(maxLon, pt.lon);

    minEle = Math.min(minEle, pt.ele);
    maxEle = Math.max(maxEle, pt.ele);

    let gradePct = 0;
    if (i > 0) {
      const prev = coords[i - 1];
      const ds = cumDistM - points[i - 1].cumDistM;
      if (ds > 1.0) {
        gradePct = Number((((pt.ele - prev.ele) / ds) * 100).toFixed(2));
      }
    }

    points.push({
      lat: Number(pt.lat.toFixed(6)),
      lon: Number(pt.lon.toFixed(6)),
      ele: Number(pt.ele.toFixed(1)),
      cumDistM: Number(cumDistM.toFixed(1)),
      gradePct,
    });
  }

  const distanceM = Number(cumDistM.toFixed(1));
  const elevationSummary: ElevationSummary = {
    startM: Number(points[0].ele.toFixed(1)),
    finishM: Number(points[points.length - 1].ele.toFixed(1)),
    netM: Number((points[points.length - 1].ele - points[0].ele).toFixed(1)),
    minM: Number(minEle.toFixed(1)),
    maxM: Number(maxEle.toFixed(1)),
    gainM: Number(gainM.toFixed(1)),
    lossM: Number(lossM.toFixed(1)),
  };

  const timingMats = generateTimingMats(points, distanceM);

  return {
    id: 'custom',
    title,
    distanceM,
    points,
    timingMats,
    bbox: [minLon, minLat, maxLon, maxLat],
    elevationSummary,
  };
}

/**
 * Automatically places standard checkpoints (Start, 5K, 10K, Half, Finish, etc.)
 * along the course for instant timing split calculations.
 */
function generateTimingMats(points: CoursePoint[], totalDistM: number): TimingMat[] {
  const mats: TimingMat[] = [];

  // Start mat
  mats.push({
    name: 'Start',
    targetDistM: 0,
    actualDistM: 0,
    lat: points[0].lat,
    lon: points[0].lon,
    ele: points[0].ele,
  });

  // Determine split targets based on total course distance
  const targets: { name: string; distM: number }[] = [];

  if (totalDistM >= 35000) {
    // Marathon distance (42K)
    [5000, 10000, 15000, 20000, 21097.5, 25000, 30000, 35000, 40000].forEach((d) => {
      if (d < totalDistM - 500) {
        const name = d === 21097.5 ? 'Half' : `${Math.round(d / 1000)}K`;
        targets.push({ name, distM: d });
      }
    });
  } else if (totalDistM >= 18000) {
    // Half-marathon distance (21K)
    [5000, 10000, 15000].forEach((d) => {
      if (d < totalDistM - 500) {
        targets.push({ name: `${Math.round(d / 1000)}K`, distM: d });
      }
    });
  } else if (totalDistM >= 8000) {
    // 10K distance
    [2500, 5000, 7500].forEach((d) => {
      if (d < totalDistM - 400) {
        targets.push({ name: `${(d / 1000).toFixed(1)}K`, distM: d });
      }
    });
  } else if (totalDistM >= 3000) {
    // 5K distance
    [1000, 2000, 3000, 4000].forEach((d) => {
      if (d < totalDistM - 300) {
        targets.push({ name: `${Math.round(d / 1000)}K`, distM: d });
      }
    });
  }

  for (const t of targets) {
    const interp = interpolateAtDistance(points, t.distM);
    mats.push({
      name: t.name,
      targetDistM: t.distM,
      actualDistM: t.distM,
      lat: interp.lat,
      lon: interp.lon,
      ele: interp.ele,
    });
  }

  // Finish mat
  const last = points[points.length - 1];
  mats.push({
    name: 'Finish',
    targetDistM: totalDistM,
    actualDistM: totalDistM,
    lat: last.lat,
    lon: last.lon,
    ele: last.ele,
  });

  return mats;
}

/**
 * Downsamples coordinate array to keep mobile rendering fast.
 */
function downsampleCoords(
  coords: { lat: number; lon: number; ele: number }[],
  maxPoints: number
): { lat: number; lon: number; ele: number }[] {
  if (coords.length <= maxPoints) return coords;

  const step = Math.ceil(coords.length / maxPoints);
  const result: { lat: number; lon: number; ele: number }[] = [];

  for (let i = 0; i < coords.length; i += step) {
    result.push(coords[i]);
  }
  // Ensure final point is preserved
  if (result[result.length - 1] !== coords[coords.length - 1]) {
    result.push(coords[coords.length - 1]);
  }
  return result;
}

// In-memory LRU cache for parsed routes so re-selecting a course is instantaneous (0ms)
const parsedCourseCache = new Map<string, CourseData>();

/**
 * Normalizes input URLs (e.g. RideWithGPS, RunGo, OpenStreetMap, Waymarked Trails, GitHub, direct GPX).
 */
export function normalizeTrackUrl(inputUrl: string): {
  normalizedUrl: string;
  sourceType: 'ridewithgps' | 'rungo' | 'osm' | 'waymarked' | 'direct';
  osmRelationId?: string;
} {
  const url = inputUrl.trim();

  // OpenStreetMap Relation URI: osm-relation://12345, openstreetmap.org/relation/12345, or api.openstreetmap.org/api/0.6/relation/12345
  const osmMatch = url.match(/(?:osm-relation:\/\/|openstreetmap\.org\/(?:api\/0\.6\/)?relation\/)(\d+)/i);
  if (osmMatch) {
    const relId = osmMatch[1];
    return {
      normalizedUrl: `https://api.openstreetmap.org/api/0.6/relation/${relId}/full.json`,
      sourceType: 'osm',
      osmRelationId: relId,
    };
  }

  // Waymarked Trails route URL: https://hiking.waymarkedtrails.org/#route?id=12345 or .../details/relation/12345...
  // Waymarked Trails route IDs are OpenStreetMap relation IDs. Resolve them via OSM Fastly CDN v0.6 full.json (~120ms).
  const wmtMatch = url.match(/waymarkedtrails\.org\/.*?(?:id=|relation\/)(\d+)/i);
  if (wmtMatch) {
    const relId = wmtMatch[1];
    return {
      normalizedUrl: `https://api.openstreetmap.org/api/0.6/relation/${relId}/full.json`,
      sourceType: 'osm',
      osmRelationId: relId,
    };
  }

  // RideWithGPS route: https://ridewithgps.com/routes/12345
  const rwgMatch = url.match(/ridewithgps\.com\/routes\/(\d+)/i);
  if (rwgMatch) {
    const routeId = rwgMatch[1];
    return {
      normalizedUrl: `https://ridewithgps.com/routes/${routeId}.json`,
      sourceType: 'ridewithgps',
    };
  }

  // RunGo route: https://rungoapp.com/route/12345
  const rungoMatch = url.match(/rungoapp\.com\/route\/(\d+)/i);
  if (rungoMatch) {
    const routeId = rungoMatch[1];
    return {
      normalizedUrl: `https://api.rungoapp.com/route/${routeId}`,
      sourceType: 'rungo',
    };
  }

  return {
    normalizedUrl: url,
    sourceType: 'direct',
  };
}

/**
 * Parses an OpenStreetMap API v0.6 `full.json` response OR an Overpass API `out geom;` JSON response
 * into a continuous CourseData track by stitching ordered member ways (including child relations for superroutes).
 */
export function parseOverpassToCourseData(overpassJsonText: string, defaultTitle = 'OSM Running Route'): CourseData {
  const json = JSON.parse(overpassJsonText);
  if (!json.elements || !Array.isArray(json.elements) || json.elements.length === 0) {
    throw new Error('No OpenStreetMap route relation found in response.');
  }

  // Index nodes and ways for OpenStreetMap API v0.6 `/relation/{id}/full.json` format
  const nodeById = new Map<number, { lat: number; lon: number; ele: number }>();
  for (const el of json.elements) {
    if (el.type === 'node' && el.id !== undefined && el.lat !== undefined && el.lon !== undefined) {
      const eleVal = el.tags?.ele ? parseFloat(el.tags.ele) : 0.0;
      nodeById.set(Number(el.id), {
        lat: Number(el.lat),
        lon: Number(el.lon),
        ele: isNaN(eleVal) ? 0.0 : eleVal,
      });
    }
  }

  const wayCoordsById = new Map<number, { lat: number; lon: number; ele: number }[]>();
  for (const el of json.elements) {
    if (el.type === 'way' && el.id !== undefined) {
      if (Array.isArray(el.geometry) && el.geometry.length >= 2) {
        const seg = el.geometry
          .map((pt: any) => ({
            lat: Number(pt.lat),
            lon: Number(pt.lon),
            ele: pt.ele !== undefined && !isNaN(Number(pt.ele)) ? Number(pt.ele) : 0.0,
          }))
          .filter((pt: any) => !isNaN(pt.lat) && !isNaN(pt.lon));
        if (seg.length >= 2) {
          wayCoordsById.set(Number(el.id), seg);
        }
      } else if (Array.isArray(el.nodes) && el.nodes.length >= 2) {
        const seg: { lat: number; lon: number; ele: number }[] = [];
        for (const nodeId of el.nodes) {
          const pt = nodeById.get(Number(nodeId));
          if (pt) seg.push(pt);
        }
        if (seg.length >= 2) {
          wayCoordsById.set(Number(el.id), seg);
        }
      }
    }
  }

  const relations = json.elements.filter((el: any) => el.type === 'relation');
  const primaryRelation = relations[0] || json.elements[0];
  const title = primaryRelation.tags?.name || primaryRelation.tags?.['name:en'] || defaultTitle;

  const waySegments: { lat: number; lon: number; ele: number }[][] = [];
  const relationById = new Map<number, any>();
  for (const rel of relations) {
    if (rel.id) relationById.set(Number(rel.id), rel);
  }

  const collectWaysFromRelation = (rel: any, visited = new Set<number>()) => {
    if (!rel || !Array.isArray(rel.members)) return;
    if (rel.id && visited.has(Number(rel.id))) return;
    if (rel.id) visited.add(Number(rel.id));

    for (const member of rel.members) {
      if (member.role === 'platform' || member.role === 'stop') continue;

      if (member.type === 'way') {
        if (Array.isArray(member.geometry) && member.geometry.length >= 2) {
          const seg = member.geometry
            .map((pt: any) => ({
              lat: Number(pt.lat),
              lon: Number(pt.lon),
              ele: pt.ele !== undefined && !isNaN(Number(pt.ele)) ? Number(pt.ele) : 0.0,
            }))
            .filter((pt: any) => !isNaN(pt.lat) && !isNaN(pt.lon));
          if (seg.length >= 2) {
            waySegments.push(seg);
          }
        } else if (member.ref !== undefined && wayCoordsById.has(Number(member.ref))) {
          waySegments.push(wayCoordsById.get(Number(member.ref))!);
        }
      } else if (member.type === 'relation' && member.ref && relationById.has(Number(member.ref))) {
        collectWaysFromRelation(relationById.get(Number(member.ref)), visited);
      }
    }
  };

  collectWaysFromRelation(primaryRelation);

  // If primary relation didn't directly list child ways, check remaining relations or standalone ways
  if (waySegments.length === 0) {
    for (const rel of relations) {
      collectWaysFromRelation(rel);
    }
  }
  if (waySegments.length === 0 && wayCoordsById.size > 0) {
    for (const seg of wayCoordsById.values()) {
      waySegments.push(seg);
    }
  }

  if (waySegments.length === 0) {
    throw new Error('OpenStreetMap relation contains no valid way geometry.');
  }

  // Stitch consecutive way segments oriented along the direction of travel
  const stitched: { lat: number; lon: number; ele: number }[] = [];

  for (let i = 0; i < waySegments.length; i++) {
    let seg = waySegments[i];

    if (i === 0 && waySegments.length > 1) {
      // Orient first segment so its end connects to the second segment
      const nextSeg = waySegments[1];
      const endToNextStart = haversineDistance(seg[seg.length - 1].lat, seg[seg.length - 1].lon, nextSeg[0].lat, nextSeg[0].lon);
      const endToNextEnd = haversineDistance(
        seg[seg.length - 1].lat,
        seg[seg.length - 1].lon,
        nextSeg[nextSeg.length - 1].lat,
        nextSeg[nextSeg.length - 1].lon
      );
      const startToNextStart = haversineDistance(seg[0].lat, seg[0].lon, nextSeg[0].lat, nextSeg[0].lon);
      const startToNextEnd = haversineDistance(seg[0].lat, seg[0].lon, nextSeg[nextSeg.length - 1].lat, nextSeg[nextSeg.length - 1].lon);

      if (Math.min(startToNextStart, startToNextEnd) < Math.min(endToNextStart, endToNextEnd)) {
        seg = [...seg].reverse();
      }
    } else if (stitched.length > 0) {
      const lastPt = stitched[stitched.length - 1];
      const distToStart = haversineDistance(lastPt.lat, lastPt.lon, seg[0].lat, seg[0].lon);
      const distToEnd = haversineDistance(lastPt.lat, lastPt.lon, seg[seg.length - 1].lat, seg[seg.length - 1].lon);
      if (distToEnd < distToStart) {
        seg = [...seg].reverse();
      }
    }

    for (const pt of seg) {
      if (stitched.length > 0) {
        const prev = stitched[stitched.length - 1];
        if (Math.abs(prev.lat - pt.lat) < 1e-7 && Math.abs(prev.lon - pt.lon) < 1e-7) {
          continue;
        }
      }
      stitched.push(pt);
    }
  }

  if (stitched.length < 2) {
    throw new Error('Failed to stitch valid coordinates from OpenStreetMap relation.');
  }

  return buildCourseDataFromCoords(title, stitched);
}

/**
 * Parses RideWithGPS public route JSON (`track_points: [{ x, y, e, d }]`) into CourseData.
 */
export function parseRideWithGpsJsonToCourseData(
  jsonObj: any,
  defaultTitle = 'RideWithGPS Route'
): CourseData {
  const routeObj = jsonObj.route || jsonObj;
  const title = routeObj.name || defaultTitle;
  const trackPoints = Array.isArray(routeObj.track_points) ? routeObj.track_points : [];

  const rawCoords: { lat: number; lon: number; ele: number }[] = [];
  for (const pt of trackPoints) {
    const lat = Number(pt.y);
    const lon = Number(pt.x);
    const ele = pt.e !== undefined && !isNaN(Number(pt.e)) ? Number(pt.e) : 0.0;
    if (!isNaN(lat) && !isNaN(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      rawCoords.push({ lat, lon, ele });
    }
  }

  if (rawCoords.length < 2) {
    throw new Error('RideWithGPS route contains insufficient track points.');
  }

  return buildCourseDataFromCoords(title, rawCoords);
}

/**
 * Parses raw text content (GPX, TCX, GeoJSON, Overpass JSON, or RideWithGPS JSON) into CourseData.
 */
export function parseRouteTextToCourseData(text: string, customTitle?: string): CourseData {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Route content is empty.');
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const parsedJson = JSON.parse(trimmed);
    if (parsedJson.elements && Array.isArray(parsedJson.elements)) {
      return parseOverpassToCourseData(trimmed, customTitle || 'OSM Running Route');
    }
    if (
      Array.isArray(parsedJson.track_points) ||
      Array.isArray(parsedJson.route?.track_points)
    ) {
      return parseRideWithGpsJsonToCourseData(parsedJson, customTitle || 'RideWithGPS Route');
    }
    return parseGeoJsonToCourseData(trimmed, customTitle || 'Imported Route');
  } else if (
    trimmed.includes('<gpx') ||
    trimmed.includes('<trk') ||
    trimmed.includes('<rte') ||
    trimmed.includes('<wpt') ||
    trimmed.includes('<TrainingCenterDatabase')
  ) {
    return parseGpxToCourseData(trimmed, customTitle || 'Imported Route');
  } else {
    throw new Error('Unsupported route format. Expected GPX, FIT, TCX, GeoJSON, or RideWithGPS / OSM link.');
  }
}

/**
 * Fetches and parses a route from a URL into CourseData.
 * Uses OpenStreetMap Fastly CDN v0.6 (~120ms) for OSM/Waymarked Trails relations
 * and caches parsed courses in memory.
 */
export async function fetchAndParseRoute(
  inputUrl: string,
  customTitle?: string,
  proxyWorkerBase = 'https://watchmyrun-mcp.webgears.workers.dev'
): Promise<CourseData> {
  const { normalizedUrl, sourceType, osmRelationId } = normalizeTrackUrl(inputUrl);
  const cacheKey = `${normalizedUrl}::${customTitle || ''}`;
  const cached = parsedCourseCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const isBrowser = typeof (globalThis as any).window !== 'undefined';

  let text: string | null = null;

  // 1a. For OpenStreetMap / Waymarked Trails relations, fetch from OSM Fastly CDN v0.6 (~120ms, native CORS!)
  if (sourceType === 'osm' && osmRelationId) {
    try {
      const osmApiUrl = `https://api.openstreetmap.org/api/0.6/relation/${osmRelationId}/full.json`;
      const res = await fetch(osmApiUrl);
      if (res.ok) {
        const data = (await res.json()) as any;
        if (Array.isArray(data.elements)) {
          const hasWays = data.elements.some((el: any) => el.type === 'way');
          if (!hasWays) {
            // Superroute: relation consists of child relations. Fetch up to 8 child relations in parallel (~150ms)
            const rel = data.elements.find((el: any) => el.type === 'relation');
            const childRelIds: number[] = (rel?.members || [])
              .filter((m: any) => m.type === 'relation' && m.ref)
              .map((m: any) => Number(m.ref))
              .slice(0, 8);

            if (childRelIds.length > 0) {
              const childResponses = await Promise.all(
                childRelIds.map((cId) =>
                  fetch(`https://api.openstreetmap.org/api/0.6/relation/${cId}/full.json`)
                    .then((r) => (r.ok ? r.json() : null))
                    .catch(() => null)
                )
              );
              for (const childData of childResponses) {
                if (childData && Array.isArray((childData as any).elements)) {
                  data.elements.push(...(childData as any).elements);
                }
              }
            }
          }
          text = JSON.stringify(data);
        }
      }
    } catch {
      // Fallback to Overpass below if OSM Fastly API fails
    }
  }

  // 1b. Attempt direct fetch (in browser: skip RideWithGPS due to CORS; on server/worker: fetch directly with browser headers)
  if (!text && (!isBrowser || sourceType !== 'ridewithgps')) {
    try {
      const res = await fetch(
        normalizedUrl,
        isBrowser
          ? undefined
          : {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                Accept: 'application/json, application/gpx+xml, text/xml, */*',
              },
            }
      );
      if (res.ok) {
        text = await res.text();
      } else if (!isBrowser && sourceType === 'ridewithgps') {
        const gpxFallbackUrl = normalizedUrl.replace(/\.json$/i, '.gpx?sub_format=track');
        const gpxRes = await fetch(gpxFallbackUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          },
        });
        if (gpxRes.ok) {
          text = await gpxRes.text();
        }
      }
    } catch {
      // CORS or network error, fallback to proxy
    }
  }

  // 2. Fallback to stateless pass-through proxy (when running in browser)
  if (!text && isBrowser && proxyWorkerBase) {
    const proxyUrl = `${proxyWorkerBase}/api/proxy-route?url=${encodeURIComponent(normalizedUrl)}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) {
      // If RideWithGPS .json failed, try .gpx?sub_format=track fallback
      if (sourceType === 'ridewithgps') {
        const gpxFallbackUrl = normalizedUrl.replace(/\.json$/i, '.gpx?sub_format=track');
        const gpxProxyUrl = `${proxyWorkerBase}/api/proxy-route?url=${encodeURIComponent(gpxFallbackUrl)}`;
        const gpxRes = await fetch(gpxProxyUrl);
        if (gpxRes.ok) {
          text = await gpxRes.text();
        }
      }
      if (!text) {
        throw new Error(`Failed to fetch route (${res.status}): ${await res.text()}`);
      }
    } else {
      text = await res.text();
    }
  }

  if (!text || text.length === 0) {
    throw new Error('Could not fetch route from the provided link.');
  }

  const course = parseRouteTextToCourseData(text, customTitle);
  parsedCourseCache.set(cacheKey, course);
  return course;
}

/**
 * Non-DOM regex XML parser for Cloudflare Workers / Node.js environments without browser DOMParser.
 * Supports GPX (<trkpt>, <rtept>, <wpt>) and Garmin TCX (<Trackpoint>).
 */
function parseGpxSimpleRegex(gpxText: string, defaultTitle: string): CourseData {
  const rawCoords: { lat: number; lon: number; ele: number }[] = [];

  // Match <trkpt ...>, <rtept ...>, or <wpt ...> (both self-closing and paired tags)
  const ptTagRegex = /<(trkpt|rtept|wpt)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/gi;
  let match: RegExpExecArray | null;
  while ((match = ptTagRegex.exec(gpxText)) !== null) {
    const attrs = match[2];
    const body = match[3] || '';
    const latMatch = attrs.match(/\blat\s*=\s*["']([^"']+)["']/i);
    const lonMatch = attrs.match(/\blon\s*=\s*["']([^"']+)["']/i);
    if (!latMatch || !lonMatch) continue;

    const lat = parseFloat(latMatch[1]);
    const lon = parseFloat(lonMatch[1]);
    if (isNaN(lat) || isNaN(lon)) continue;

    const eleMatch = body.match(/<ele>([^<]+)<\/ele>/i);
    const ele = eleMatch ? parseFloat(eleMatch[1]) : 0.0;
    rawCoords.push({ lat, lon, ele: isNaN(ele) ? 0.0 : ele });
  }

  // Fallback to Garmin TCX <Trackpoint>
  if (rawCoords.length < 2) {
    const tcxRegex = /<Trackpoint\b[^>]*>([\s\S]*?)<\/Trackpoint>/gi;
    while ((match = tcxRegex.exec(gpxText)) !== null) {
      const body = match[1];
      const latMatch = body.match(/<LatitudeDegrees>([^<]+)<\/LatitudeDegrees>/i);
      const lonMatch = body.match(/<LongitudeDegrees>([^<]+)<\/LongitudeDegrees>/i);
      if (!latMatch || !lonMatch) continue;

      const lat = parseFloat(latMatch[1]);
      const lon = parseFloat(lonMatch[1]);
      if (isNaN(lat) || isNaN(lon)) continue;

      const eleMatch = body.match(/<AltitudeMeters>([^<]+)<\/AltitudeMeters>/i);
      const ele = eleMatch ? parseFloat(eleMatch[1]) : 0.0;
      rawCoords.push({ lat, lon, ele: isNaN(ele) ? 0.0 : ele });
    }
  }

  if (rawCoords.length < 2) {
    throw new Error('Track file contains insufficient coordinate points (minimum 2 points required).');
  }

  const nameMatch = gpxText.match(/<name>([^<]+)<\/name>/i);
  const title = nameMatch ? nameMatch[1].trim() : defaultTitle;

  return buildCourseDataFromCoords(title, rawCoords);
}
