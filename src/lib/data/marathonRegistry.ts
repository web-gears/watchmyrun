import { CheerSpotPreset, MarathonId } from '../forecasting/types';

export interface MarathonWave {
  id: string;
  name: string;
  timeStr: string; // HH:mm:ss
  description: string;
  corrals?: string;
}

export interface MarathonInfo {
  id: MarathonId;
  name: string;
  shortName: string;
  flag: string;
  city: string;
  country: string;
  annualDate: string;
  defaultStartTime: string; // HH:mm
  defaultFinishTime: string; // HH:mm:ss
  defaultPace: string; // mm:ss
  distanceKm: number;
  distanceMi: number;
  waves: MarathonWave[];
  center: [number, number]; // [lat, lon]
  defaultZoom: number;
  onlineGeoJsonUrl: string;
  localGeoJsonPath: string;
  elevationHighlight: string;
  cheerPresets: CheerSpotPreset[];
}

export const MARATHON_REGISTRY: Record<MarathonId, MarathonInfo> = {
  new_york: {
    id: 'new_york',
    name: 'TCS New York City Marathon',
    shortName: 'New York',
    flag: '🇺🇸',
    city: 'New York City, NY',
    country: 'USA',
    annualDate: 'First Sunday of November',
    defaultStartTime: '09:10',
    defaultFinishTime: '03:45:00',
    defaultPace: '05:20',
    distanceKm: 42.2,
    distanceMi: 26.2,
    center: [40.73061, -73.935242],
    defaultZoom: 11,
    onlineGeoJsonUrl:
      'https://raw.githubusercontent.com/jamesad90/marathon-pollution/master/marathon%20gpx%20files/new_york.gpx',
    localGeoJsonPath: '/data/geojson/new_york.geojson',
    elevationHighlight: 'Verrazzano Bridge & Queensboro Bridge incline',
    waves: [
      { id: 'w1', name: 'Wave 1 (Corrals A–F)', timeStr: '09:10:00', description: 'Sub-3:15 Finishers', corrals: 'A–F' },
      { id: 'w2', name: 'Wave 2 (Corrals A–F)', timeStr: '09:45:00', description: '3:15 – 3:45 Finishers', corrals: 'A–F' },
      { id: 'w3', name: 'Wave 3 (Corrals A–F)', timeStr: '10:20:00', description: '3:45 – 4:15 Finishers', corrals: 'A–F' },
      { id: 'w4', name: 'Wave 4 (Corrals A–F)', timeStr: '10:55:00', description: '4:15 – 4:55 Finishers', corrals: 'A–F' },
      { id: 'w5', name: 'Wave 5 (Corrals A–F)', timeStr: '11:30:00', description: '4:55+ Finishers', corrals: 'A–F' },
      { id: 'ew', name: 'Elite Women', timeStr: '08:40:00', description: 'Professional Women Division' },
      { id: 'em', name: 'Elite Men', timeStr: '09:05:00', description: 'Professional Men Division' },
      { id: 'wc', name: 'Wheelchair Division', timeStr: '08:00:00', description: 'Athletes with Disabilities' },
    ],
    cheerPresets: [
      { id: 'ny_4', name: 'Bay Ridge (4th Ave & 86th St)', mile: 4.0, distM: 6437, description: 'Brooklyn crowd takeoff point' },
      { id: 'ny_8', name: 'Park Slope (4th Ave & 9th St)', mile: 8.0, distM: 12875, description: 'Epic live music & neighborhood cheers' },
      { id: 'ny_11_5', name: 'Williamsburg (Bedford Ave)', mile: 11.5, distM: 18507, description: 'Eclectic hipster cheer hub' },
      { id: 'ny_16', name: 'Queensboro Exit (1st Ave & 59th)', mile: 16.0, distM: 25750, description: 'Wall of sound into Manhattan' },
      { id: 'ny_20_5', name: 'Harlem (5th Ave & 125th St)', mile: 20.5, distM: 32992, description: 'High-energy gospel & drumlines' },
      { id: 'ny_23', name: 'Museum Mile (5th Ave & 90th St)', mile: 23.0, distM: 37015, description: 'Crucial push before Central Park' },
      { id: 'ny_25_5', name: 'Central Park South (Columbus Circle)', mile: 25.5, distM: 41038, description: 'Final charge toward the finish line' },
    ],
  },
  boston: {
    id: 'boston',
    name: 'Boston Marathon (B.A.A.)',
    shortName: 'Boston',
    flag: '🇺🇸',
    city: 'Boston, MA',
    country: 'USA',
    annualDate: 'Third Monday of April (Patriots’ Day)',
    defaultStartTime: '10:00',
    defaultFinishTime: '03:30:00',
    defaultPace: '04:58',
    distanceKm: 42.2,
    distanceMi: 26.2,
    center: [42.2905, -71.35],
    defaultZoom: 11,
    onlineGeoJsonUrl:
      'https://raw.githubusercontent.com/jamesad90/marathon-pollution/master/marathon%20gpx%20files/boston.gpx',
    localGeoJsonPath: '/data/geojson/boston.geojson',
    elevationHighlight: 'Hopkinton net downhill (-134m) & Heartbreak Hill (Mi 20.5)',
    waves: [
      { id: 'w1', name: 'Wave 1 (Bibs 1–7,999)', timeStr: '10:00:00', description: 'Sub-3:00 Finishers' },
      { id: 'w2', name: 'Wave 2 (Bibs 8,000–15,999)', timeStr: '10:25:00', description: '3:00 – 3:25 Finishers' },
      { id: 'w3', name: 'Wave 3 (Bibs 16,000–23,999)', timeStr: '10:50:00', description: '3:25 – 3:55 Finishers' },
      { id: 'w4', name: 'Wave 4 (Bibs 24,000+)', timeStr: '11:15:00', description: '3:55+ Finishers' },
      { id: 'em', name: 'Elite Men', timeStr: '09:37:00', description: 'Professional Men' },
      { id: 'ew', name: 'Elite Women', timeStr: '09:47:00', description: 'Professional Women' },
      { id: 'wc', name: 'Wheelchair Men', timeStr: '09:02:00', description: 'Push-rim wheelchairs' },
    ],
    cheerPresets: [
      { id: 'bos_1', name: 'Hopkinton Town Common', mile: 1.0, distM: 1609, description: 'Iconic start village sendoff' },
      { id: 'bos_6_7', name: 'Framingham Train Station', mile: 6.7, distM: 10782, description: 'Roaring commuter crowd crossing' },
      { id: 'bos_10_2', name: 'Natick Center Green', mile: 10.2, distM: 16415, description: 'Lively town center party' },
      { id: 'bos_12_8', name: 'Wellesley Scream Tunnel', mile: 12.8, distM: 20600, description: 'Legendary deafening cheer corridor at halfway' },
      { id: 'bos_16', name: 'Newton Lower Falls (Rt 16)', mile: 16.0, distM: 25750, description: 'Descent to the Newton hills bridge' },
      { id: 'bos_20_5', name: 'Heartbreak Hill (Newton)', mile: 20.5, distM: 32992, description: 'Famous climactic incline crest & BC fans' },
      { id: 'bos_22_5', name: 'Cleveland Circle (Brookline)', mile: 22.5, distM: 36210, description: 'MBTA reservoir crowds & high fives' },
      { id: 'bos_25', name: 'Kenmore Square (Citgo Sign)', mile: 25.0, distM: 40233, description: '1 Mile To Go under the landmark Citgo Sign' },
      { id: 'bos_25_8', name: 'Boylston St Homestretch', mile: 25.8, distM: 41521, description: 'Right on Hereford, Left on Boylston to glory' },
    ],
  },
  chicago: {
    id: 'chicago',
    name: 'Bank of America Chicago Marathon',
    shortName: 'Chicago',
    flag: '🇺🇸',
    city: 'Chicago, IL',
    country: 'USA',
    annualDate: 'Second Sunday of October',
    defaultStartTime: '07:30',
    defaultFinishTime: '03:40:00',
    defaultPace: '05:13',
    distanceKm: 42.2,
    distanceMi: 26.2,
    center: [41.881832, -87.623177],
    defaultZoom: 12,
    onlineGeoJsonUrl:
      'https://raw.githubusercontent.com/jamesad90/marathon-pollution/master/marathon%20gpx%20files/chicago.gpx',
    localGeoJsonPath: '/data/geojson/chicago.geojson',
    elevationHighlight: 'Ultra-flat World Record loop, minor Roosevelt bridge overpass',
    waves: [
      { id: 'w1', name: 'Wave 1 (Corrals A–E)', timeStr: '07:30:00', description: 'Corrals A through E' },
      { id: 'w2', name: 'Wave 2 (Corrals F–H)', timeStr: '08:00:00', description: 'Corrals F through H' },
      { id: 'w3', name: 'Wave 3 (Corrals J–N)', timeStr: '08:35:00', description: 'Corrals J through N' },
      { id: 'wc', name: 'Wheelchair / Handcycle', timeStr: '07:20:00', description: 'Handcycles & Wheelchairs' },
    ],
    cheerPresets: [
      { id: 'chi_3', name: 'River North (State & Grand)', mile: 3.0, distM: 4828, description: 'Early downtown skyscraper canyon' },
      { id: 'chi_8', name: 'Lincoln Park Zoo & Stockton Dr', mile: 8.0, distM: 12875, description: 'Lush park greenway & high-fiving crowds' },
      { id: 'chi_11', name: 'Old Town (Wells St)', mile: 11.0, distM: 17703, description: 'Historic neighborhood festival vibe' },
      { id: 'chi_14_5', name: 'Greektown (Gladys & Halsted)', mile: 14.5, distM: 23335, description: 'Energetic West Loop cheers & Greek music' },
      { id: 'chi_19', name: 'Pilsen (18th St Murals)', mile: 19.0, distM: 30577, description: 'Mariachi bands & festive authentic street cheer' },
      { id: 'chi_21_5', name: 'Chinatown Gate (Cermak & Wentworth)', mile: 21.5, distM: 34600, description: 'Dragon dancers & energetic drum beats' },
      { id: 'chi_24', name: 'South Loop (Michigan Ave & 31st)', mile: 24.0, distM: 38624, description: 'The long homeward straightaway north' },
      { id: 'chi_25_8', name: 'Mount Roosevelt & Grant Park', mile: 25.8, distM: 41521, description: 'Final bridge ascent to the Grant Park finish' },
    ],
  },
  london: {
    id: 'london',
    name: 'TCS London Marathon',
    shortName: 'London',
    flag: '🇬🇧',
    city: 'London',
    country: 'United Kingdom',
    annualDate: 'Third or Fourth Sunday of April',
    defaultStartTime: '09:40',
    defaultFinishTime: '03:45:00',
    defaultPace: '05:20',
    distanceKm: 42.2,
    distanceMi: 26.2,
    center: [51.5074, -0.05],
    defaultZoom: 12,
    onlineGeoJsonUrl:
      'https://raw.githubusercontent.com/jamesad90/marathon-pollution/master/marathon%20gpx%20files/london.gpx',
    localGeoJsonPath: '/data/geojson/london.geojson',
    elevationHighlight: 'Gentle downhill first 5km, flat along Thames & Tower Bridge',
    waves: [
      { id: 'w1', name: 'Mass Wave 1 & Elite Men', timeStr: '09:40:00', description: 'Blue, Green, Red Starts' },
      { id: 'w2', name: 'Mass Wave 2-4', timeStr: '10:00:00', description: 'Staggered color wave starts' },
      { id: 'w3', name: 'Mass Wave 5-8', timeStr: '10:30:00', description: 'Mass participation corrals' },
      { id: 'ew', name: 'Elite Women', timeStr: '09:00:00', description: 'Professional Women' },
      { id: 'wc', name: 'Elite Wheelchairs', timeStr: '08:50:00', description: 'Wheelchair racing' },
    ],
    cheerPresets: [
      { id: 'lon_3', name: 'Woolwich & Charlton Park', mile: 3.0, distM: 4828, description: 'Merger of the Blue and Red start lines' },
      { id: 'lon_6_5', name: 'Cutty Sark (Greenwich)', mile: 6.5, distM: 10460, description: 'Historic tea clipper ship rounding' },
      { id: 'lon_9_5', name: 'Surrey Quays & Rotherhithe', mile: 9.5, distM: 15288, description: 'Loud south-bank pub crowds' },
      { id: 'lon_12_5', name: 'Tower Bridge Crossing', mile: 12.5, distM: 20116, description: 'Iconic landmark crossing over the Thames' },
      { id: 'lon_14', name: 'The Highway (Wapping)', mile: 14.0, distM: 22530, description: 'Two-way runner viewing straightaway' },
      { id: 'lon_18_5', name: 'Canary Wharf (Heron Quays)', mile: 18.5, distM: 29772, description: 'Canyon of glass skyscrapers & cheering bankers' },
      { id: 'lon_22', name: 'Limehouse Reach (Commercial Rd)', mile: 22.0, distM: 35405, description: 'Crucial late-race endurance support' },
      { id: 'lon_24_5', name: 'Victoria Embankment', mile: 24.5, distM: 39428, description: 'Along the Thames towards Parliament' },
      { id: 'lon_25_8', name: 'Big Ben & The Mall', mile: 25.8, distM: 41521, description: 'Buckingham Palace turn into the finish' },
    ],
  },
  berlin: {
    id: 'berlin',
    name: 'BMW Berlin-Marathon',
    shortName: 'Berlin',
    flag: '🇩🇪',
    city: 'Berlin',
    country: 'Germany',
    annualDate: 'Last Sunday of September',
    defaultStartTime: '09:15',
    defaultFinishTime: '03:30:00',
    defaultPace: '04:58',
    distanceKm: 42.2,
    distanceMi: 26.2,
    center: [52.51, 13.38],
    defaultZoom: 12,
    onlineGeoJsonUrl:
      'https://raw.githubusercontent.com/jamesad90/marathon-pollution/master/marathon%20gpx%20files/berlin.gpx',
    localGeoJsonPath: '/data/geojson/berlin.geojson',
    elevationHighlight: 'Fastest marathon course in history, net +1.5m flat',
    waves: [
      { id: 'w1', name: 'Wave 1 (Blocks A–D)', timeStr: '09:15:00', description: 'Fast qualifiers (sub 3:30)' },
      { id: 'w2', name: 'Wave 2 (Block E)', timeStr: '09:35:00', description: '3:30 – 3:50 Finishers' },
      { id: 'w3', name: 'Wave 3 (Block F)', timeStr: '10:05:00', description: '3:50 – 4:15 Finishers' },
      { id: 'w4', name: 'Wave 4 (Blocks G–H)', timeStr: '10:30:00', description: '4:15+ Finishers' },
      { id: 'hb', name: 'Handbike / Wheelchair', timeStr: '08:50:00', description: 'Handbike division' },
    ],
    cheerPresets: [
      { id: 'ber_3_1', name: 'Ernst-Reuter-Platz', mile: 3.1, distM: 5000, description: 'West Berlin boulevard opening cheers' },
      { id: 'ber_5_3', name: 'Moabit & Spree River', mile: 5.3, distM: 8500, description: 'Industrial-cool canal side support' },
      { id: 'ber_7_8', name: 'Alexanderplatz & TV Tower', mile: 7.8, distM: 12500, description: 'Iconic East Berlin square & tram tracks' },
      { id: 'ber_9_6', name: 'Kottbusser Tor (Kreuzberg)', mile: 9.6, distM: 15500, description: 'Techno beats & wild street carnival' },
      { id: 'ber_13_1', name: 'Rathaus Schöneberg (Halfway)', mile: 13.1, distM: 21100, description: 'Historic JFK speech plaza & half split' },
      { id: 'ber_17_4', name: 'Steglitz (Schloßstraße)', mile: 17.4, distM: 28000, description: 'Shopping avenue drums & brass bands' },
      { id: 'ber_21_4', name: 'Kurfürstendamm (Kudamm)', mile: 21.4, distM: 34500, description: 'Gedächtniskirche & roaring West Berliners' },
      { id: 'ber_23_9', name: 'Potsdamer Platz', mile: 23.9, distM: 38500, description: 'Modern glass towers & 40km timing mat' },
      { id: 'ber_26_0', name: 'Brandenburg Gate & Finish', mile: 26.0, distM: 41800, description: 'World Record homestretch through the Gate' },
    ],
  },
  tokyo: {
    id: 'tokyo',
    name: 'Tokyo Marathon',
    shortName: 'Tokyo',
    flag: '🇯🇵',
    city: 'Tokyo',
    country: 'Japan',
    annualDate: 'First Sunday of March',
    defaultStartTime: '09:10',
    defaultFinishTime: '03:45:00',
    defaultPace: '05:20',
    distanceKm: 42.2,
    distanceMi: 26.2,
    center: [35.6895, 139.75],
    defaultZoom: 12,
    onlineGeoJsonUrl:
      'https://raw.githubusercontent.com/jamesad90/marathon-pollution/master/marathon%20gpx%20files/tokyo.gpx',
    localGeoJsonPath: '/data/geojson/tokyo.geojson',
    elevationHighlight: 'Downhill start from Shinjuku, flat out-and-back spurs to Tokyo Station',
    waves: [
      { id: 'w1', name: 'Wave 1 (Blocks A–E)', timeStr: '09:10:00', description: 'Elite and fast qualifier blocks' },
      { id: 'w2', name: 'Wave 2 (Blocks F–L)', timeStr: '09:25:00', description: 'Mass participation blocks' },
      { id: 'wc', name: 'Wheelchair Marathon', timeStr: '09:05:00', description: 'Wheelchair race' },
    ],
    cheerPresets: [
      { id: 'tok_3_1', name: 'Iidabashi & Kagurazaka', mile: 3.1, distM: 5000, description: 'Historic slope neighborhood crowd' },
      { id: 'tok_6_2', name: 'Nihombashi Bridge', mile: 6.2, distM: 10000, description: 'Historic zero-mile marker of Japan' },
      { id: 'tok_9_3', name: 'Asakusa (Kaminarimon Gate)', mile: 9.3, distM: 15000, description: 'Sensoji Temple Red Lantern & giant cheering crowds' },
      { id: 'tok_12_4', name: 'Ryogoku Sumo Arena', mile: 12.4, distM: 20000, description: 'Traditional Edo spirit & taiko drumming' },
      { id: 'tok_14_9', name: 'Monzen-Nakacho', mile: 14.9, distM: 24000, description: 'Spirited Fukagawa neighborhood cheer spot' },
      { id: 'tok_18_6', name: 'Ginza 4-Chome Crossing', mile: 18.6, distM: 30000, description: 'Luxury shopping avenue packed with spectators' },
      { id: 'tok_22_7', name: 'Shinagawa Turnaround', mile: 22.7, distM: 36500, description: 'High-tension 36km turnaround cheer station' },
      { id: 'tok_25_2', name: 'Hibiya Park & Imperial Palace', mile: 25.2, distM: 40500, description: 'Green oasis before the cobblestone final spur' },
      { id: 'tok_26_0', name: 'Tokyo Station (Gyoko-dori)', mile: 26.0, distM: 41800, description: 'Grand red-brick station plaza finish' },
    ],
  },
};

export const MARATHON_LIST: MarathonInfo[] = Object.values(MARATHON_REGISTRY);

/**
 * Calculates the great-circle distance between two points on the Earth in kilometers (Haversine formula).
 */
export function calculateGreatCircleDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the closest World Marathon Major to the given geographic coordinates.
 */
export function findClosestMarathon(lat: number, lon: number): MarathonId {
  let closestId: MarathonId = 'new_york';
  let minDistance = Infinity;

  for (const marathon of MARATHON_LIST) {
    const [mLat, mLon] = marathon.center;
    const dist = calculateGreatCircleDistanceKm(lat, lon, mLat, mLon);
    if (dist < minDistance) {
      minDistance = dist;
      closestId = marathon.id;
    }
  }

  return closestId;
}

/**
 * Fallback heuristic: Detects the closest World Marathon Major based on user's timezone.
 * Instant, synchronous, and requires zero browser permissions.
 */
export function detectClosestMarathonByTimezone(): MarathonId {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const tzLower = tz.toLowerCase();

    // Europe (UK -> London, Continental Europe -> Berlin)
    if (
      tzLower.includes('london') ||
      tzLower.includes('dublin') ||
      tzLower.includes('belfast') ||
      tzLower.startsWith('europe/london') ||
      tzLower.startsWith('gb')
    ) {
      return 'london';
    }
    if (
      tzLower.startsWith('europe/') ||
      tzLower.includes('berlin') ||
      tzLower.includes('paris') ||
      tzLower.includes('amsterdam') ||
      tzLower.includes('rome') ||
      tzLower.includes('madrid') ||
      tzLower.includes('vienna') ||
      tzLower.includes('warsaw') ||
      tzLower.includes('prague') ||
      tzLower.includes('zurich') ||
      tzLower.includes('stockholm') ||
      tzLower.includes('copenhagen') ||
      tzLower.includes('oslo') ||
      tzLower.includes('helsinki') ||
      tzLower.includes('athens') ||
      tzLower.includes('bucharest') ||
      tzLower.includes('budapest') ||
      tzLower.includes('brussels') ||
      tzLower.includes('kyiv') ||
      tzLower.includes('kiev')
    ) {
      return 'berlin';
    }

    // Asia / Japan / Pacific / Oceania -> Tokyo
    if (
      tzLower.includes('tokyo') ||
      tzLower.includes('japan') ||
      tzLower.includes('seoul') ||
      tzLower.includes('asia/') ||
      tzLower.includes('australia') ||
      tzLower.includes('auckland') ||
      tzLower.includes('pacific/')
    ) {
      return 'tokyo';
    }

    // North America Central / Mountain / Pacific -> Chicago (or closest US Major)
    if (
      tzLower.includes('chicago') ||
      tzLower.includes('central') ||
      tzLower.includes('indiana') ||
      tzLower.includes('winnipeg') ||
      tzLower.includes('denver') ||
      tzLower.includes('mountain') ||
      tzLower.includes('phoenix') ||
      tzLower.includes('los_angeles') ||
      tzLower.includes('pacific') ||
      tzLower.includes('vancouver')
    ) {
      return 'chicago';
    }

    // New England / Boston
    if (tzLower.includes('boston') || tzLower.includes('massachusetts')) {
      return 'boston';
    }

    // Default East Coast -> New York
    return 'new_york';
  } catch {
    return 'new_york';
  }
}
