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

const searchCache = new Map<string, RaceSearchResult[]>();

function deduplicateResults(items: RaceSearchResult[]): RaceSearchResult[] {
  const seenUrls = new Set<string>();
  const seenTitles = new Set<string>();
  const merged: RaceSearchResult[] = [];

  for (const item of items) {
    const urlKey = item.routeUrl.toLowerCase();
    const titleKey = item.title.toLowerCase().trim();
    if (!seenUrls.has(urlKey) && !seenTitles.has(titleKey)) {
      seenUrls.add(urlKey);
      seenTitles.add(titleKey);
      merged.push(item);
    }
  }
  return merged.slice(0, 20);
}

/**
 * Searches public route catalogs (Curated catalog, Waymarked Trails / OpenStreetMap indexed routes,
 * and RideWithGPS via Worker) with progressive streaming and caching.
 */
export async function searchPublicRaceCourses(
  query: string,
  proxyWorkerBase = 'https://watchmyrun-mcp.webgears.workers.dev',
  onPartialResults?: (results: RaceSearchResult[]) => void
): Promise<RaceSearchResult[]> {
  const q = query.trim();
  if (!q) {
    return CURATED_POPULAR_RACES;
  }

  const qLower = q.toLowerCase();
  const cached = searchCache.get(qLower);
  if (cached) {
    onPartialResults?.(cached);
    return cached;
  }

  // 1. Instant local matches from curated popular races (0ms)
  const curatedMatches = CURATED_POPULAR_RACES.filter(
    (item) =>
      item.title.toLowerCase().includes(qLower) ||
      item.subtitle.toLowerCase().includes(qLower)
  );
  if (curatedMatches.length > 0) {
    onPartialResults?.(curatedMatches);
  }

  let waymarkedList: RaceSearchResult[] = [];
  let workerList: RaceSearchResult[] = [];

  // 2. Run fast indexed searches in parallel (~180ms Waymarked Trails + ~300ms Worker RideWithGPS)
  // Stream results immediately as each provider resolves instead of blocking on the slowest one.
  const wmtPromise = fetchWaymarkedTrailsRoutes(q).then((res) => {
    waymarkedList = res;
    if (res.length > 0 && onPartialResults) {
      onPartialResults(deduplicateResults([...curatedMatches, ...workerList, ...waymarkedList]));
    }
    return res;
  });

  const workerPromise = fetchWorkerSearchResults(q, proxyWorkerBase).then((res) => {
    workerList = res;
    if (res.length > 0 && onPartialResults) {
      onPartialResults(deduplicateResults([...curatedMatches, ...workerList, ...waymarkedList]));
    }
    return res;
  });

  await Promise.allSettled([wmtPromise, workerPromise]);

  const finalResults = deduplicateResults([
    ...curatedMatches,
    ...workerList,
    ...waymarkedList,
  ]);

  if (finalResults.length > 0) {
    searchCache.set(qLower, finalResults);
  }

  return finalResults;
}

/**
 * Queries our stateless Cloudflare Worker `/api/search-routes?q=...` endpoint
 * which searches RideWithGPS public routes and route indices in parallel.
 */
async function fetchWorkerSearchResults(
  query: string,
  proxyWorkerBase: string
): Promise<RaceSearchResult[]> {
  try {
    const url = `${proxyWorkerBase}/api/search-routes?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      signal: typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal ? AbortSignal.timeout(3500) : undefined,
    });
    if (!res.ok) return [];
    const data = (await res.json()) as any;
    if (Array.isArray(data.results)) {
      return data.results;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Queries Waymarked Trails public PostgreSQL full-text search API (~180ms) for mapped OSM routes.
 * Each Waymarked Trails route is an OpenStreetMap relation (`item.id`),
 * resolved directly via `osm-relation://${item.id}` on OSM's Fastly CDN (~120ms).
 */
async function fetchWaymarkedTrailsRoutes(query: string): Promise<RaceSearchResult[]> {
  try {
    const url = `https://hiking.waymarkedtrails.org/api/v1/list/search?query=${encodeURIComponent(
      query
    )}&limit=10`;
    const res = await fetch(url, {
      signal: typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal ? AbortSignal.timeout(3000) : undefined,
    });
    if (!res.ok) return [];

    const data = (await res.json()) as any;
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results
      .filter((item: any) => item.id && item.name)
      .map((item: any) => {
        const sub = item.group || item.ref || 'Mapped Trail / Course';
        return {
          id: `wmt_${item.id}`,
          title: item.name,
          subtitle: `${sub} (OSM #${item.id})`,
          source: 'waymarked' as const,
          sourceLabel: 'Waymarked Trails',
          routeUrl: `osm-relation://${item.id}`,
          externalUrl: `https://hiking.waymarkedtrails.org/#route?id=${item.id}`,
        };
      });
  } catch {
    return [];
  }
}
