import { CheerSpotPreset, MarathonId } from '../forecasting/types';
import { MARATHON_REGISTRY, MarathonWave } from '../data/marathonRegistry';

export interface SeoRacePageData {
  slug: string;
  name: string;
  shortName: string;
  flag: string;
  city: string;
  country: string;
  annualDate: string;
  distanceKm: number;
  distanceMi: number;
  defaultStartTime: string;
  defaultFinishTime: string;
  defaultPaceMinPerKm: string;
  defaultPaceMinPerMi: string;
  elevationHighlight: string;
  elevationGainM: number;
  elevationLossM: number;
  courseDescription: string;
  spectatorTip: string;
  appLaunchUrl: string;
  marathonId?: MarathonId;
  waves: MarathonWave[];
  cheerSpots: CheerSpotPreset[];
  faqs: { question: string; answer: string }[];
}

export const SEO_RACE_PAGES: SeoRacePageData[] = [
  // 1. TCS New York City Marathon
  {
    slug: 'nyc-marathon-spectator-guide',
    name: 'TCS New York City Marathon',
    shortName: 'NYC Marathon',
    flag: '🇺🇸',
    city: 'New York City, NY',
    country: 'USA',
    annualDate: 'First Sunday of November',
    distanceKm: 42.2,
    distanceMi: 26.2,
    defaultStartTime: '09:10',
    defaultFinishTime: '03:45:00',
    defaultPaceMinPerKm: '05:20',
    defaultPaceMinPerMi: '08:35',
    elevationHighlight: 'Verrazzano-Narrows Bridge start, Queensboro Bridge climb (Mi 15), and 5th Ave incline (Mi 23)',
    elevationGainM: 246,
    elevationLossM: 270,
    courseDescription:
      'A five-borough point-to-point tour starting on Staten Island, running north through Brooklyn (4th Ave & Williamsburg) and Queens, crossing the Queensboro Bridge into Manhattan (1st Ave), dipping into the Bronx, and finishing inside Central Park.',
    spectatorTip:
      'Take the subway (N/R/Q to 4th Ave Brooklyn, then F/Q to 63rd St & 1st Ave, then Q/4/5/6 to 86th–96th St) to see your runner 2–3 times without crossing street closures.',
    appLaunchUrl: '/?race=new_york&start=09:10&finish=03:45:00&spectator=6437,18507,25750,37015',
    marathonId: 'new_york',
    waves: MARATHON_REGISTRY.new_york.waves,
    cheerSpots: MARATHON_REGISTRY.new_york.cheerPresets,
    faqs: [
      {
        question: 'When will my runner pass Mile 16 (First Avenue) in the NYC Marathon?',
        answer:
          ' Mile 16 is at the Queensboro Bridge exit onto 1st Avenue & 59th Street (25.75 km). A Wave 1 runner starting at 09:10 AM running a 3:45:00 marathon pace will reach Mile 16 around 11:30–11:36 AM. Use our interactive NYC Marathon spectator calculator to get exact arrival windows for your runner’s wave start and pace.',
      },
      {
        question: 'Where are the best places to watch the NYC Marathon multiple times?',
        answer:
          'The best multi-spot spectator route is: (1) 4th Ave in Brooklyn (Mile 4–8) or Bedford Ave in Williamsburg (Mile 11.5), then take the subway to Manhattan for (2) 1st Avenue between 60th & 96th St (Mile 16–18), and walk two avenues west to (3) 5th Avenue / Museum Mile (Mile 23–24).',
      },
      {
        question: 'How do I track a runner in the NYC Marathon if the official app lags or they run without a phone?',
        answer:
          'Open WatchMy.Run with their wave start time and goal pace to see live elevation-adjusted arrival windows for every mile. When you spot your runner or receive an Apple AirTag ping, drop a Tracking Pin on the map to immediately recalibrate downstream arrival times.',
      },
    ],
  },

  // 2. Boston Marathon
  {
    slug: 'boston-marathon-spectator-guide',
    name: 'Boston Marathon (B.A.A.)',
    shortName: 'Boston Marathon',
    flag: '🇺🇸',
    city: 'Boston, MA',
    country: 'USA',
    annualDate: 'Third Monday of April (Patriots’ Day)',
    distanceKm: 42.2,
    distanceMi: 26.2,
    defaultStartTime: '10:00',
    defaultFinishTime: '03:30:00',
    defaultPaceMinPerKm: '04:58',
    defaultPaceMinPerMi: '08:00',
    elevationHighlight: 'Net downhill first 15 miles (-134m net drop) followed by the 4 Newton Hills & Heartbreak Hill (Mi 20.5)',
    elevationGainM: 188,
    elevationLossM: 322,
    courseDescription:
      'Historic point-to-point route from Hopkinton through Ashland, Framingham, Natick, Wellesley (Scream Tunnel), Newton (Heartbreak Hill), and Brookline to the iconic finish line on Boylston Street in Copley Square.',
    spectatorTip:
      'Use the MBTA Framingham/Worcester Commuter Rail for early miles (Framingham, Natick, Wellesley Square) and the Green Line (B, C, or D branches) for Newton, Cleveland Circle, and Kenmore Square.',
    appLaunchUrl: '/?race=boston&start=10:00&finish=03:30:00&spectator=20600,32992,40233',
    marathonId: 'boston',
    waves: MARATHON_REGISTRY.boston.waves,
    cheerSpots: MARATHON_REGISTRY.boston.cheerPresets,
    faqs: [
      {
        question: 'What time will my runner reach Heartbreak Hill (Mile 20.5) at the Boston Marathon?',
        answer:
          'Heartbreak Hill crests at Mile 20.5 (33.0 km) in Newton near Boston College. A Wave 1 runner starting at 10:00 AM on a 3:30:00 schedule typically reaches Heartbreak Hill between 12:40 PM and 12:48 PM, factoring in the slower grade-adjusted pace up the Newton hills.',
      },
      {
        question: 'How does Boston’s downhill start and Newton Hills affect spectator arrival windows?',
        answer:
          'Runners often bank 10–15 seconds per mile on the downhill opening miles out of Hopkinton and slow by 15–30 seconds per mile between Miles 16 and 21 in Newton. WatchMy.Run automatically applies grade-adjusted pacing and marathon fatigue so you don’t miss your runner.',
      },
    ],
  },

  // 3. Bank of America Chicago Marathon
  {
    slug: 'chicago-marathon-spectator-guide',
    name: 'Bank of America Chicago Marathon',
    shortName: 'Chicago Marathon',
    flag: '🇺🇸',
    city: 'Chicago, IL',
    country: 'USA',
    annualDate: 'Second Sunday of October',
    distanceKm: 42.2,
    distanceMi: 26.2,
    defaultStartTime: '07:30',
    defaultFinishTime: '03:40:00',
    defaultPaceMinPerKm: '05:13',
    defaultPaceMinPerMi: '08:23',
    elevationHighlight: 'Dead-flat urban loop across 29 neighborhoods; minor incline at Mount Roosevelt (Mi 26)',
    elevationGainM: 74,
    elevationLossM: 75,
    courseDescription:
      'A fast, flat loop starting and finishing in Grant Park, touring River North, Lincoln Park, Old Town, the West Loop, Greektown, Pilsen, Chinatown, and the South Loop.',
    spectatorTip:
      'Because Chicago’s course loops back near downtown three times, spectators using the CTA Red, Brown, and Pink lines can easily see their runner 3 to 4 times (Grand/State at Mi 1–3, Wells St at Mi 11, Adams/Halsted at Mi 14, and Cermak/Chinatown at Mi 21.5).',
    appLaunchUrl: '/?race=chicago&start=07:30&finish=03:40:00&spectator=4828,17703,23335,34600',
    marathonId: 'chicago',
    waves: MARATHON_REGISTRY.chicago.waves,
    cheerSpots: MARATHON_REGISTRY.chicago.cheerPresets,
    faqs: [
      {
        question: 'Why does GPS tracking fail during the first 3 miles of the Chicago Marathon?',
        answer:
          'Downtown Chicago’s tall skyscrapers and multi-level streets (Wacker Drive) scatter GPS signals, causing phone apps and watches to jump wildly. WatchMy.Run projects your runner along the certified course line using physics-based pacing and snaps any sighting pins directly onto the official route.',
      },
      {
        question: 'Where can I see my runner multiple times at the Chicago Marathon?',
        answer:
          'Stand at State & Grand (Mile 1.2 & Mile 3.2), take the CTA Red/Brown line north to Sedgwick/Old Town (Mile 11), then head south to Greektown (Mile 14.5) and Chinatown Red Line (Mile 21.5).',
      },
    ],
  },

  // 4. TCS London Marathon
  {
    slug: 'london-marathon-spectator-guide',
    name: 'TCS London Marathon',
    shortName: 'London Marathon',
    flag: '🇬🇧',
    city: 'London',
    country: 'United Kingdom',
    annualDate: 'Third or Fourth Sunday of April',
    distanceKm: 42.2,
    distanceMi: 26.2,
    defaultStartTime: '09:40',
    defaultFinishTime: '03:45:00',
    defaultPaceMinPerKm: '05:20',
    defaultPaceMinPerMi: '08:35',
    elevationHighlight: 'Downhill drop in Mile 3 from Charlton, flat Thames embankment & Docklands loop',
    elevationGainM: 122,
    elevationLossM: 157,
    courseDescription:
      'Starts at Blackheath/Greenwich Park, passes the Cutty Sark at Mile 6.5, crosses Tower Bridge at Mile 12.5, loops through Canary Wharf and the Isle of Dogs, and follows Victoria Embankment past Big Ben to finish on The Mall.',
    spectatorTip:
      'Avoid getting stuck at Cutty Sark and Tower Bridge at peak hours; instead, watch at Mile 13.5 on The Highway (Shadwell DLR/Overground) where runners pass in both directions (Mile 13.5 and Mile 22), then take the Jubilee/District line to Embankment (Mile 24.5).',
    appLaunchUrl: '/?race=london&start=09:40&finish=03:45:00&spectator=10460,20116,29772,39428',
    marathonId: 'london',
    waves: MARATHON_REGISTRY.london.waves,
    cheerSpots: MARATHON_REGISTRY.london.cheerPresets,
    faqs: [
      {
        question: 'Where can you see London Marathon runners twice without moving?',
        answer:
          'Along The Highway between Tower Gateway and Limehouse (around Shadwell station), runners head east toward Canary Wharf at Mile 13.5–14 and return heading west on the opposite side of the road at Mile 21.5–22.',
      },
      {
        question: 'What time will my runner cross Tower Bridge (Mile 12.5)?',
        answer:
          'Tower Bridge is just before the halfway mark at Mile 12.5 (20.1 km). A runner starting at 09:40 AM targeting 3:45:00 will cross Tower Bridge around 11:26–11:32 AM.',
      },
    ],
  },

  // 5. BMW Berlin-Marathon
  {
    slug: 'berlin-marathon-spectator-guide',
    name: 'BMW Berlin-Marathon',
    shortName: 'Berlin Marathon',
    flag: '🇩🇪',
    city: 'Berlin',
    country: 'Germany',
    annualDate: 'Last Sunday of September',
    distanceKm: 42.2,
    distanceMi: 26.2,
    defaultStartTime: '09:15',
    defaultFinishTime: '03:30:00',
    defaultPaceMinPerKm: '04:58',
    defaultPaceMinPerMi: '08:00',
    elevationHighlight: 'Ultra-flat world-record course through central Berlin (+33m total gain)',
    elevationGainM: 34,
    elevationLossM: 32,
    courseDescription:
      'The world’s fastest marathon course starts and ends on Straße des 17. Juni in the Tiergarten, sweeping past the Reichstag, Alexanderplatz, Kreuzberg, Schöneberg, Kurfürstendamm, Potsdamer Platz, and through the Brandenburg Gate.',
    spectatorTip:
      'Berlin’s U-Bahn and S-Bahn make multi-spot cheering effortless: watch at Ernst-Reuter-Platz (5 km), take U2 to Alexanderplatz (12.5 km) or Kottbusser Tor (15.5 km), then ride U9/U1 to Kurfürstendamm (34.5 km) and Potsdamer Platz (38.5 km).',
    appLaunchUrl: '/?race=berlin&start=09:15&finish=03:30:00&spectator=5000,15500,34500,41800',
    marathonId: 'berlin',
    waves: MARATHON_REGISTRY.berlin.waves,
    cheerSpots: MARATHON_REGISTRY.berlin.cheerPresets,
    faqs: [
      {
        question: 'How do I calculate split times and spectator arrival windows for the Berlin Marathon?',
        answer:
          'Select Berlin Marathon in WatchMy.Run, choose your start wave (Wave 1 at 09:15, Wave 2 at 09:35, Wave 3 at 10:05, or Wave 4 at 10:30), and enter your target pace to generate instant arrival windows for every U-Bahn cheer station.',
      },
    ],
  },

  // 6. Tokyo Marathon
  {
    slug: 'tokyo-marathon-spectator-guide',
    name: 'Tokyo Marathon',
    shortName: 'Tokyo Marathon',
    flag: '🇯🇵',
    city: 'Tokyo',
    country: 'Japan',
    annualDate: 'First Sunday of March',
    distanceKm: 42.2,
    distanceMi: 26.2,
    defaultStartTime: '09:10',
    defaultFinishTime: '03:45:00',
    defaultPaceMinPerKm: '05:20',
    defaultPaceMinPerMi: '08:35',
    elevationHighlight: '30m downhill drop in the first 5km from Shinjuku, then flat out-and-back avenues',
    elevationGainM: 65,
    elevationLossM: 90,
    courseDescription:
      'Starts at the Tokyo Metropolitan Government Building in Shinjuku, descends through Iidabashi to Nihombashi, loops past Asakusa Kaminarimon Gate, Ryogoku, Ginza, and Shinagawa, and finishes on Gyoko-dori in front of Tokyo Station and the Imperial Palace.',
    spectatorTip:
      'Because Tokyo’s course features three long out-and-back sections (Nihombashi–Asakusa, Ryogoku–Monzen-Nakacho, and Hibiya–Shinagawa), you can stand at Nihombashi, Kuramae, or Tamachi and cheer your runner twice from the same sidewalk.',
    appLaunchUrl: '/?race=tokyo&start=09:10&finish=03:45:00&spectator=10000,15000,30000,41800',
    marathonId: 'tokyo',
    waves: MARATHON_REGISTRY.tokyo.waves,
    cheerSpots: MARATHON_REGISTRY.tokyo.cheerPresets,
    faqs: [
      {
        question: 'Where are the best out-and-back spectator spots on the Tokyo Marathon course?',
        answer:
          'Kuramae/Asakusa (14 km & 17 km), Kiyosumi-Shirakawa (21 km & 26 km), and Tamachi/Shinagawa (33 km & 38 km) allow spectators to see their runner pass in both directions without taking a train in between.',
      },
    ],
  },

  // 7. Marine Corps Marathon (MCM)
  {
    slug: 'marine-corps-marathon-spectator-guide',
    name: 'Marine Corps Marathon (MCM)',
    shortName: 'Marine Corps Marathon',
    flag: '🇺🇸',
    city: 'Arlington, VA & Washington, D.C.',
    country: 'USA',
    annualDate: 'Last Sunday of October',
    distanceKm: 42.2,
    distanceMi: 26.2,
    defaultStartTime: '07:55',
    defaultFinishTime: '04:00:00',
    defaultPaceMinPerKm: '05:41',
    defaultPaceMinPerMi: '09:09',
    elevationHighlight: 'Rolling hills in Rosslyn/Georgetown (Mi 1–5), flat Hains Point & National Mall, steep uphill finish to the Marine Corps War Memorial',
    elevationGainM: 215,
    elevationLossM: 205,
    courseDescription:
      'Known as "The People’s Marathon," MCM starts in Arlington between the Pentagon and Arlington National Cemetery, crosses into Georgetown and Rock Creek Park, circles Hains Point and the National Mall (Capitol & monuments), crosses the 14th Street Bridge ("Beat the Bridge" at Mile 20), and finishes through Crystal City up to the Marine Corps War Memorial (Iwo Jima).',
    spectatorTip:
      'Use Metrorail (Rosslyn, Smithsonian, L’Enfant Plaza, and Crystal City stations) to see your runner in Rosslyn (Mile 3.5), on the National Mall (Mile 15–19), and at the Crystal City Water Park (Mile 23) before walking to the finish.',
    appLaunchUrl:
      '/?race=custom&trackUrl=https%3A%2F%2Fridewithgps.com%2Froutes%2F17926860&trackTitle=Marine%20Corps%20Marathon%20(MCM)&start=07:55&finish=04:00:00',
    waves: [
      { id: 'mcm_all', name: 'Mass Start (Runner Gaunlet)', timeStr: '07:55:00', description: 'Howitzer cannon start in Arlington' },
    ],
    cheerSpots: [
      { id: 'mcm_3_5', name: 'Rosslyn Metro (Lynn St)', mile: 3.5, distM: 5632, description: 'Descending into Rosslyn before Key Bridge' },
      { id: 'mcm_6', name: 'Georgetown (M Street)', mile: 6.0, distM: 9656, description: 'Historic Georgetown waterfront corridor' },
      { id: 'mcm_12', name: 'Hains Point Loop', mile: 12.0, distM: 19312, description: 'East Potomac Park peninsula' },
      { id: 'mcm_17', name: 'National Mall & Smithsonian', mile: 17.0, distM: 27358, description: 'Between the Capitol and Washington Monument' },
      { id: 'mcm_23', name: 'Crystal City (Crystal Drive)', mile: 23.0, distM: 37015, description: 'High-energy Crystal City cheer zone near Metro' },
      { id: 'mcm_26', name: 'Iwo Jima Memorial Finish', mile: 26.0, distM: 41842, description: 'Final steep climb to the Marine Corps War Memorial' },
    ],
    faqs: [
      {
        question: 'What is the "Beat the Bridge" cutoff time at the Marine Corps Marathon?',
        answer:
          'Runners must reach the 14th Street Bridge at Mile 20 by 1:15 PM (approximately 14:00/mile pace from the final start crossing). Use WatchMy.Run to check your runner’s exact Mile 20 ETA.',
      },
    ],
  },

  // 8. Valencia Marathon
  {
    slug: 'valencia-marathon-spectator-guide',
    name: 'Valencia Marathon (Trinidad Alfonso)',
    shortName: 'Valencia Marathon',
    flag: '🇪🇸',
    city: 'Valencia',
    country: 'Spain',
    annualDate: 'First Sunday of December',
    distanceKm: 42.2,
    distanceMi: 26.2,
    defaultStartTime: '08:15',
    defaultFinishTime: '03:30:00',
    defaultPaceMinPerKm: '04:58',
    defaultPaceMinPerMi: '08:00',
    elevationHighlight: 'Pancake-flat sea-level course finishing on the blue boardwalk over water at the City of Arts and Sciences',
    elevationGainM: 45,
    elevationLossM: 45,
    courseDescription:
      'One of the fastest marathon courses in the world, starting at Plaça de la Marató, sweeping along the Mediterranean beachfront, through Valencia’s historic Turia Gardens and Old Town, and finishing on the iconic blue ramp over the water at the Ciudad de las Artes y las Ciencias.',
    spectatorTip:
      'Valencia’s compact loop around the Turia riverbed lets spectators walk between Kilometer 15, Kilometer 28, Kilometer 34, and the finish line at the City of Arts and Sciences in under 15 minutes.',
    appLaunchUrl:
      '/?race=custom&trackUrl=https%3A%2F%2Fridewithgps.com%2Froutes%2F41724217&trackTitle=Valencia%20Marathon&start=08:15&finish=03:30:00',
    waves: [
      { id: 'val_w1', name: 'Wave 1 (Sub-2:50 & Elite)', timeStr: '08:15:00', description: 'First start wave' },
      { id: 'val_w2', name: 'Wave 2 (2:50 - 3:15)', timeStr: '08:25:00', description: 'Second start wave' },
      { id: 'val_w3', name: 'Wave 3 (3:15 - 3:45)', timeStr: '08:35:00', description: 'Third start wave' },
      { id: 'val_w4', name: 'Wave 4 (3:45+)', timeStr: '08:55:00', description: 'Mass participation waves' },
    ],
    cheerSpots: [
      { id: 'val_5k', name: 'Malvarrosa Beachfront (5K)', mile: 3.1, distM: 5000, description: 'Coastal avenue cheer spot' },
      { id: 'val_15k', name: 'Alameda & Turia Bridge (15K)', mile: 9.3, distM: 15000, description: 'Passeig de l’Alameda spectator hub' },
      { id: 'val_half', name: 'Halfway Split (21.1K)', mile: 13.1, distM: 21097, description: 'Half marathon timing mat' },
      { id: 'val_30k', name: 'Plaça de Tetuan / Historic Center (30K)', mile: 18.6, distM: 30000, description: 'Central Valencia cheer corridor' },
      { id: 'val_38k', name: 'Calle Colón (38K)', mile: 23.6, distM: 38000, description: 'Downtown shopping street roar before final push' },
      { id: 'val_42k', name: 'City of Arts & Sciences Finish', mile: 26.0, distM: 41850, description: 'Blue water-walkway finish line' },
    ],
    faqs: [
      {
        question: 'How can spectators track runners in the Valencia Marathon?',
        answer:
          'Open the Valencia Marathon route in WatchMy.Run, select your runner’s wave start time (08:15 to 09:15) and goal pace, and share a single link with arrival windows for the Turia bridges, Calle Colón, and the City of Arts and Sciences.',
      },
    ],
  },

  // 9. AACR Philadelphia Marathon
  {
    slug: 'philadelphia-marathon-spectator-guide',
    name: 'AACR Philadelphia Marathon',
    shortName: 'Philadelphia Marathon',
    flag: '🇺🇸',
    city: 'Philadelphia, PA',
    country: 'USA',
    annualDate: 'Third Sunday of November',
    distanceKm: 42.2,
    distanceMi: 26.2,
    defaultStartTime: '07:00',
    defaultFinishTime: '03:45:00',
    defaultPaceMinPerKm: '05:20',
    defaultPaceMinPerMi: '08:35',
    elevationHighlight: 'Flat historic Center City first half, rolling hills in Fairmount Park (Mi 9–13), flat out-and-back along Kelly Drive & Manayunk',
    elevationGainM: 165,
    elevationLossM: 165,
    courseDescription:
      'Starts and finishes in front of the Philadelphia Museum of Art ("Rocky Steps") on the Benjamin Franklin Parkway, touring Old City, Penn’s Landing, University City, Fairmount Park, and the scenic Schuylkill River out-and-back along Kelly Drive to Manayunk.',
    spectatorTip:
      'You can see your runner 3–4 times right around the Art Museum & Eakins Oval (Start, Mile 7, Mile 13.5 heading out on Kelly Drive, and Finish) or take the SEPTA Manayunk/Norristown Regional Rail to Manayunk Main Street (Mile 19–20).',
    appLaunchUrl:
      '/?race=custom&trackUrl=https%3A%2F%2Fridewithgps.com%2Froutes%2F30740682&trackTitle=AACR%20Philadelphia%20Marathon&start=07:00&finish=03:45:00',
    waves: [
      { id: 'phl_w1', name: 'Corrals A-H (Staggered Start)', timeStr: '07:00:00', description: 'Benjamin Franklin Parkway start' },
    ],
    cheerSpots: [
      { id: 'phl_3', name: 'Old City & Independence Hall', mile: 3.0, distM: 4828, description: 'Arch & Market St historic district' },
      { id: 'phl_7', name: 'University City (34th & Walnut)', mile: 7.0, distM: 11265, description: 'UPenn campus cheer zone' },
      { id: 'phl_13_5', name: 'Art Museum / Boathouse Row', mile: 13.5, distM: 21726, description: 'Halfway mark entering Kelly Drive' },
      { id: 'phl_19_8', name: 'Manayunk Main Street Turnaround', mile: 19.8, distM: 31865, description: 'Famous Manayunk party & turnaround zone' },
      { id: 'phl_26', name: 'Benjamin Franklin Parkway Finish', mile: 26.0, distM: 41842, description: 'Homestretch to the Philadelphia Museum of Art' },
    ],
    faqs: [
      {
        question: 'Where is the best spot to cheer at the Philadelphia Marathon?',
        answer:
          'Eakins Oval / Boathouse Row lets you see runners at the Start, Mile 13.5, and the Finish without walking more than two blocks. For the second half, Manayunk Main Street (Mile 19.5–20.5) has electric crowd support right on the out-and-back turnaround.',
      },
    ],
  },

  // 10. TCS Amsterdam Marathon
  {
    slug: 'amsterdam-marathon-spectator-guide',
    name: 'TCS Amsterdam Marathon',
    shortName: 'Amsterdam Marathon',
    flag: '🇳🇱',
    city: 'Amsterdam',
    country: 'Netherlands',
    annualDate: 'Third Sunday of October',
    distanceKm: 42.2,
    distanceMi: 26.2,
    defaultStartTime: '09:00',
    defaultFinishTime: '03:40:00',
    defaultPaceMinPerKm: '05:13',
    defaultPaceMinPerMi: '08:23',
    elevationHighlight: 'Super-flat course starting and finishing inside the 1928 Olympic Stadium, following the Amstel River and Vondelpark',
    elevationGainM: 38,
    elevationLossM: 38,
    courseDescription:
      'Starts and finishes on the track inside Amsterdam’s historic 1928 Olympic Stadium, passing the Rijksmuseum bicycle passage, Vondelpark, a scenic out-and-back along the Amstel River past traditional windmills, and Amsterdam Oost.',
    spectatorTip:
      'Watch inside Vondelpark (3 km and 39 km) and near the Rijksmuseum (4 km and 40 km), which are only a 15-minute walk from the Olympic Stadium finish.',
    appLaunchUrl:
      '/?race=custom&trackUrl=https%3A%2F%2Fridewithgps.com%2Froutes%2F41235492&trackTitle=TCS%20Amsterdam%20Marathon&start=09:00&finish=03:40:00',
    waves: [
      { id: 'ams_w1', name: 'Olympic Stadium Start Waves', timeStr: '09:00:00', description: 'Staggered wave starts from 09:00 to 09:40' },
    ],
    cheerSpots: [
      { id: 'ams_4k', name: 'Rijksmuseum Passage (4K)', mile: 2.5, distM: 4000, description: 'Iconic tunnel beneath the Rijksmuseum' },
      { id: 'ams_14k', name: 'Amstel River / Ouderkerk (14K)', mile: 8.7, distM: 14000, description: 'Scenic Amstel riverfront' },
      { id: 'ams_25k', name: 'Amstelstation / Berlagebrug (25K)', mile: 15.5, distM: 25000, description: 'Major Metro & train transfer cheer spot' },
      { id: 'ams_39k', name: 'Vondelpark Return (39K)', mile: 24.2, distM: 39000, description: 'Final park stretch before the Olympic Stadium' },
    ],
    faqs: [
      {
        question: 'Can spectators see runners twice at Vondelpark and the Rijksmuseum in the Amsterdam Marathon?',
        answer:
          'Yes! Runners pass through Vondelpark and the Rijksmuseum between 2–4 km at the start and return through the exact same corridor between 38.5–40.5 km on their way back to the Olympic Stadium.',
      },
    ],
  },

  // 11. NN Marathon Rotterdam
  {
    slug: 'rotterdam-marathon-spectator-guide',
    name: 'NN Marathon Rotterdam',
    shortName: 'Rotterdam Marathon',
    flag: '🇳🇱',
    city: 'Rotterdam',
    country: 'Netherlands',
    annualDate: 'Second Sunday of April',
    distanceKm: 42.2,
    distanceMi: 26.2,
    defaultStartTime: '10:00',
    defaultFinishTime: '03:35:00',
    defaultPaceMinPerKm: '05:06',
    defaultPaceMinPerMi: '08:12',
    elevationHighlight: 'Fast, flat Dutch course with two crossings of the iconic Erasmus Bridge',
    elevationGainM: 48,
    elevationLossM: 48,
    courseDescription:
      'Starts at the foot of the Erasmus Bridge, loops through South Rotterdam (Ahoy & Zuiderpark), crosses the Erasmus Bridge back to the north bank at 26 km, loops around Kralingse Plas lake, and finishes on the vibrant Coolsingel boulevard.',
    spectatorTip:
      'Stand near Wilhelminapier /Leuvehaven Metro to see runners cross the Erasmus Bridge at both the start (1 km) and 26 km, then walk 10 minutes up to Blaak / Coolsingel (30 km and 41.5 km).',
    appLaunchUrl:
      '/?race=custom&trackUrl=https%3A%2F%2Fridewithgps.com%2Froutes%2F7031737&trackTitle=NN%20Marathon%20Rotterdam&start=10:00&finish=03:35:00',
    waves: [
      { id: 'rot_w1', name: 'Wave 1 & Elite Start', timeStr: '10:00:00', description: 'Erasmus Bridge start' },
    ],
    cheerSpots: [
      { id: 'rot_1k', name: 'Erasmus Bridge Crossing (1K & 26K)', mile: 16.2, distM: 26000, description: 'Iconic swan bridge crossing' },
      { id: 'rot_30k', name: 'Blaak & Cube Houses (30K & 41K)', mile: 18.6, distM: 30000, description: 'Two-way cheer spot near Blaak station' },
      { id: 'rot_36k', name: 'Kralingse Bos Lake Loop (36K)', mile: 22.4, distM: 36000, description: 'Lakeside park loop' },
      { id: 'rot_42k', name: 'Coolsingel Finish Line', mile: 26.2, distM: 42195, description: 'Famous Coolsingel grand finish' },
    ],
    faqs: [
      {
        question: 'Where can you cheer runners multiple times at the Rotterdam Marathon?',
        answer:
          'Blaak station (near the Cube Houses and Markthal) sees runners at both 29.5 km heading toward Kralingse Plas and 41 km heading into the Coolsingel finish.',
      },
    ],
  },

  // 12. Chevron Houston Marathon
  {
    slug: 'houston-marathon-spectator-guide',
    name: 'Chevron Houston Marathon',
    shortName: 'Houston Marathon',
    flag: '🇺🇸',
    city: 'Houston, TX',
    country: 'USA',
    annualDate: 'Third Sunday of January',
    distanceKm: 42.2,
    distanceMi: 26.2,
    defaultStartTime: '07:01',
    defaultFinishTime: '03:45:00',
    defaultPaceMinPerKm: '05:20',
    defaultPaceMinPerMi: '08:35',
    elevationHighlight: 'Fast, flat Texas winter course through the Heights, Rice University, Uptown/Galleria, and Memorial Park',
    elevationGainM: 68,
    elevationLossM: 68,
    courseDescription:
      'Starts and finishes in Downtown Houston beside the George R. Brown Convention Center and Discovery Green, touring the Heights, Hermann Park, Rice University, the Galleria/Uptown, Tanglewood, Memorial Park, and Allen Parkway.',
    spectatorTip:
      'Spectators can watch near Downtown/Discovery Green for the start and finish, and drive or take METRORail to Hermann Park/Museum District (Mile 9–10) or Memorial Park (Mile 21–22).',
    appLaunchUrl:
      '/?race=custom&trackUrl=https%3A%2F%2Fridewithgps.com%2Froutes%2F35035212&trackTitle=Chevron%20Houston%20Marathon&start=07:01&finish=03:45:00',
    waves: [
      { id: 'hou_w1', name: 'Corrals A-D', timeStr: '07:01:00', description: 'Downtown Houston start' },
    ],
    cheerSpots: [
      { id: 'hou_5', name: 'The Heights (White Oak & Heights Blvd)', mile: 5.0, distM: 8046, description: 'Tree-lined Heights Boulevard cheer zone' },
      { id: 'hou_10', name: 'Rice University & Hermann Park', mile: 10.0, distM: 16093, description: 'Museum District / METRORail Red Line access' },
      { id: 'hou_15', name: 'Galleria / Post Oak Blvd', mile: 15.0, distM: 24140, description: 'Uptown Houston spectator hub' },
      { id: 'hou_21', name: 'Memorial Park (Memorial Dr)', mile: 21.0, distM: 33796, description: 'Mile 21 push entering Allen Parkway' },
      { id: 'hou_26', name: 'Discovery Green / Lamar St Finish', mile: 26.0, distM: 41842, description: 'Downtown Houston finish straight' },
    ],
    faqs: [
      {
        question: 'How can I plan cheer spot arrival times for the Chevron Houston Marathon?',
        answer:
          'Load the Houston Marathon course in WatchMy.Run, enter your runner’s corral start time and goal pace, and share the pre-configured map link with your family.',
      },
    ],
  },

  // 13. Custom GPX / FIT Race Pace & Spectator Calculator
  {
    slug: 'gpx-race-spectator-calculator',
    name: 'GPX & FIT Race Pace Spectator Calculator',
    shortName: 'Custom GPX / FIT Course',
    flag: '🗺️',
    city: 'Any Road or Trail Course Worldwide',
    country: 'Global',
    annualDate: 'Year-Round Road, Trail & Ultra Races',
    distanceKm: 42.2,
    distanceMi: 26.2,
    defaultStartTime: '08:00',
    defaultFinishTime: '03:45:00',
    defaultPaceMinPerKm: '05:20',
    defaultPaceMinPerMi: '08:35',
    elevationHighlight: 'Automatic elevation grade calculation (+gain / -loss) and Minetti metabolic pace adjustment from any GPX, FIT, TCX, or OpenStreetMap route',
    elevationGainM: 250,
    elevationLossM: 250,
    courseDescription:
      'Turn any marathon, half marathon, 10K, trail race, or ultra course into a live interactive spectator tracker. Search thousands of verified routes across OpenStreetMap, Waymarked Trails, and RideWithGPS—or drop your own .gpx, Garmin .fit, .tcx, or .geojson file.',
    spectatorTip:
      'Pick any custom cheer spot on the map, enter your start time and goal pace, and copy a 1-tap WhatsApp/iMessage Spectator Cheat Sheet for your crew.',
    appLaunchUrl: '/?race=new_york',
    waves: [
      { id: 'custom_start', name: 'Custom Start Time (Any Wave)', timeStr: '08:00:00', description: 'Supports any HH:MM start time' },
    ],
    cheerSpots: [
      { id: 'gpx_5k', name: 'Auto-Generated 5K / 10K / Halfway Splits', mile: 6.2, distM: 10000, description: 'Automatically places split checkpoints along your track' },
      { id: 'gpx_map', name: 'Click-to-Pin Custom Cheer Stations', mile: 13.1, distM: 21097, description: 'Tap any road crossing or aid station on the map' },
      { id: 'gpx_pin', name: 'Live On-Course Sighting / AirTag Recalibration', mile: 20.0, distM: 32186, description: 'Snap real-time sightings to the route to update finish ETAs' },
    ],
    faqs: [
      {
        question: 'Which route file formats and links does WatchMy.Run support?',
        answer:
          'WatchMy.Run supports GPX (.gpx), Garmin FIT binary files (.fit), Garmin Training Center (.tcx), GeoJSON (.geojson), plus direct links from RideWithGPS, OpenStreetMap route relations, Waymarked Trails, and RunGo.',
      },
      {
        question: 'Does the GPX spectator calculator account for hills and elevation gain?',
        answer:
          'Yes. WatchMy.Run computes the grade of every segment along your uploaded course and applies the Minetti metabolic cost model plus physiological marathon fatigue so uphill and downhill splits reflect real-world running speed.',
      },
    ],
  },
];

export function getSeoRaceBySlug(slug: string): SeoRacePageData | undefined {
  return SEO_RACE_PAGES.find((r) => r.slug === slug);
}
