/**
 * Multi-source public race course aggregator search.
 * Loaded 100% dynamically on-demand inside CustomRouteModal so it adds 0 bytes to the core app bundle.
 */

export interface RaceSearchResult {
  id: string;
  title: string;
  subtitle: string;
  distanceKm?: number;
  source: 'curated' | 'ridewithgps' | 'osm' | 'waymarked';
  sourceLabel: string;
  routeUrl: string;
  externalUrl?: string;
}

/**
 * Curated popular global marathons & road races with verified public GPS tracks.
 * Displayed immediately as quick picks and matched first during search.
 */
export const CURATED_POPULAR_RACES: RaceSearchResult[] = [
  {
    id: 'curated_mcm',
    title: 'Marine Corps Marathon (MCM)',
    subtitle: 'Arlington, VA & Washington, D.C., USA • 42.2 km',
    distanceKm: 42.2,
    source: 'curated',
    sourceLabel: 'Verified Course',
    routeUrl: 'https://ridewithgps.com/routes/17926860',
    externalUrl: 'https://ridewithgps.com/routes/17926860',
  },
  {
    id: 'curated_valencia',
    title: 'Valencia Marathon (Trinidad Alfonso)',
    subtitle: 'Valencia, Spain • 42.2 km',
    distanceKm: 42.2,
    source: 'curated',
    sourceLabel: 'Verified Course',
    routeUrl: 'https://ridewithgps.com/routes/41724217',
    externalUrl: 'https://ridewithgps.com/routes/41724217',
  },
  {
    id: 'curated_amsterdam',
    title: 'TCS Amsterdam Marathon',
    subtitle: 'Amsterdam, Netherlands • 42.2 km',
    distanceKm: 42.2,
    source: 'curated',
    sourceLabel: 'Verified Course',
    routeUrl: 'https://ridewithgps.com/routes/41235492',
    externalUrl: 'https://ridewithgps.com/routes/41235492',
  },
  {
    id: 'curated_rotterdam',
    title: 'NN Marathon Rotterdam',
    subtitle: 'Rotterdam, Netherlands • 42.2 km',
    distanceKm: 42.2,
    source: 'curated',
    sourceLabel: 'Verified Course',
    routeUrl: 'https://ridewithgps.com/routes/7031737',
    externalUrl: 'https://ridewithgps.com/routes/7031737',
  },
  {
    id: 'curated_philly',
    title: 'AACR Philadelphia Marathon',
    subtitle: 'Philadelphia, PA, USA • 42.2 km',
    distanceKm: 42.2,
    source: 'curated',
    sourceLabel: 'Verified Course',
    routeUrl: 'https://ridewithgps.com/routes/30740682',
    externalUrl: 'https://ridewithgps.com/routes/30740682',
  },
  {
    id: 'curated_houston',
    title: 'Chevron Houston Marathon',
    subtitle: 'Houston, TX, USA • 42.2 km',
    distanceKm: 42.2,
    source: 'curated',
    sourceLabel: 'Verified Course',
    routeUrl: 'https://ridewithgps.com/routes/35035212',
    externalUrl: 'https://ridewithgps.com/routes/35035212',
  },
];

/**
 * Searches public route aggregators (Curated catalog, RideWithGPS via Worker,
 * OpenStreetMap Overpass Running Routes, and Waymarked Trails).
 */
export async function searchPublicRaceCourses(
  query: string,
  proxyWorkerBase = 'https://watchmyrun-mcp.webgears.workers.dev'
): Promise<RaceSearchResult[]> {
  const q = query.trim();
  if (!q) {
    return CURATED_POPULAR_RACES;
  }

  const qLower = q.toLowerCase();

  // 1. Instant local matches from curated popular races
  const curatedMatches = CURATED_POPULAR_RACES.filter(
    (item) =>
      item.title.toLowerCase().includes(qLower) ||
      item.subtitle.toLowerCase().includes(qLower)
  );

  // 2. Query Cloudflare Worker aggregator & direct CORS-enabled public APIs in parallel
  const [workerResults, overpassResults, waymarkedResults] = await Promise.all([
    fetchWorkerSearchResults(q, proxyWorkerBase),
    fetchOverpassRunningRoutes(q),
    fetchWaymarkedTrailsRoutes(q),
  ]);

  // 3. Merge and deduplicate by routeUrl or title
  const seenUrls = new Set<string>();
  const merged: RaceSearchResult[] = [];

  for (const item of [
    ...curatedMatches,
    ...workerResults,
    ...overpassResults,
    ...waymarkedResults,
  ]) {
    const key = item.routeUrl.toLowerCase();
    if (!seenUrls.has(key)) {
      seenUrls.add(key);
      merged.push(item);
    }
  }

  return merged.slice(0, 20);
}

/**
 * Queries our stateless Cloudflare Worker `/api/search-routes?q=...` endpoint
 * which searches RideWithGPS public routes and route indices.
 */
async function fetchWorkerSearchResults(
  query: string,
  proxyWorkerBase: string
): Promise<RaceSearchResult[]> {
  try {
    const url = `${proxyWorkerBase}/api/search-routes?q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data.results)) {
      return data.results;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Queries OpenStreetMap Overpass API directly for mapped running / marathon / foot race relations.
 * Overpass API supports CORS (`Access-Control-Allow-Origin: *`) natively.
 */
async function fetchOverpassRunningRoutes(query: string): Promise<RaceSearchResult[]> {
  try {
    // Sanitize regex special characters in user query
    const safeQuery = query.replace(/[.*+?^${}()|[\]\\"]/g, ' ').trim();
    if (safeQuery.length < 2) return [];

    const overpassQl = `[out:json][timeout:10];(relation["route"~"running|foot|fitness_trail"]["name"~"${safeQuery}",i];);out tags center 12;`;
    const res = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQl)}`
    );
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.elements || !Array.isArray(data.elements)) return [];

    return data.elements
      .filter((el: any) => el.type === 'relation' && el.tags?.name)
      .map((el: any) => {
        const name = el.tags['name:en'] || el.tags.name;
        const distTag = el.tags.distance || el.tags.length || '';
        const parsedKm = parseDistanceKmTag(distTag);
        const routeType = el.tags.route === 'running' ? 'Running Course' : 'Trail / Foot Route';
        const loc = el.tags['addr:city'] || el.tags.network || el.tags.operator || routeType;
        const distLabel = parsedKm ? ` • ${parsedKm} km` : distTag ? ` • ${distTag}` : '';

        return {
          id: `osm_${el.id}`,
          title: name,
          subtitle: `${loc}${distLabel} (OSM #${el.id})`,
          distanceKm: parsedKm,
          source: 'osm' as const,
          sourceLabel: 'OpenStreetMap',
          routeUrl: `osm-relation://${el.id}`,
          externalUrl: `https://www.openstreetmap.org/relation/${el.id}`,
        };
      });
  } catch {
    return [];
  }
}

/**
 * Queries Waymarked Trails public search API for mapped routes.
 */
async function fetchWaymarkedTrailsRoutes(query: string): Promise<RaceSearchResult[]> {
  try {
    const url = `https://hiking.waymarkedtrails.org/api/v1/list/search?query=${encodeURIComponent(
      query
    )}&limit=8`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results
      .filter((item: any) => item.id && item.name)
      .map((item: any) => {
        const sub = item.group || item.ref || 'Mapped Trail / Course';
        return {
          id: `wmt_${item.id}`,
          title: item.name,
          subtitle: `${sub} (Relation #${item.id})`,
          source: 'waymarked' as const,
          sourceLabel: 'Waymarked Trails',
          routeUrl: `https://hiking.waymarkedtrails.org/api/v1/details/relation/${item.id}/geometry/gpx`,
          externalUrl: `https://hiking.waymarkedtrails.org/#route?id=${item.id}`,
        };
      });
  } catch {
    return [];
  }
}

function parseDistanceKmTag(distStr: string): number | undefined {
  if (!distStr) return undefined;
  const match = distStr.match(/(\d+(?:[.,]\d+)?)\s*(km|mi|m)?/i);
  if (!match) return undefined;
  let val = parseFloat(match[1].replace(',', '.'));
  if (isNaN(val)) return undefined;
  const unit = (match[2] || 'km').toLowerCase();
  if (unit === 'mi') val = val * 1.609344;
  else if (unit === 'm' && val > 500) val = val / 1000;
  return Number(val.toFixed(1));
}
