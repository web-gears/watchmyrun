# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Primary Audience**: Spectators (family, friends, cheering squads) standing along major marathon courses on race day, using mobile phones in dense crowds under variable sunlight and degraded cellular network conditions.
- **Secondary Audience**: Remote supporters tracking runners from home or transit on desktop/tablet web browsers.
- **The Runner**: Participates phone-free (no bouncing phone, armband, or battery drain), carrying only an Apple AirTag (clipped to laces, pinned to bib, or in pocket).

## Product Purpose
WatchMy.Run eliminates the anxiety of missing runners during major marathons. It enables phone-free tracking for runners and provides spectators with real-time arrival windows at their chosen cheering stations, accounting for course elevation and actual race-day pace.

## Positioning
Unlike official marathon tracking apps that rely on delayed timing mat crossings (often 5-10 km apart with congested race servers) or cellular GPS apps requiring runners to haul heavy phones, WatchMy.Run lets runners race phone-free using Apple AirTags and manual crowd sightings. It converts sporadic location pings into calibrated, elevation-aware pace projections and exact cheer station arrival windows.

## Operating Context
- **On-Course Conditions**: Loud, crowded streets with bright sunlight, physical barriers, spotty cellular connectivity, and fast-moving crowds.
- **User State**: Spectators need one-handed mobile glanceability, instant arrival countdowns ("Arriving in ~8 min"), and quick two-tap pin dropping to calibrate positions without losing their place on the barrier.
- **Supported Courses**: World Marathon Majors (New York City, Boston, Chicago, London, Berlin, Tokyo) with curated cheer landmarks and multiple race distances for NYC (Marathon, Half, 10K, 5K).

## Capabilities and Constraints
- **Capabilities**:
  - Interactive Leaflet/OSM course map with elevation-encoded polyline rendering.
  - Tracking pin placement (time, distance snap, elevation calculation, pace recalculation).
  - Multi-spot cheer station selection with arrival windows (early/expected/late accounting for pacing uncertainty).
  - Floating glanceable spectator card with live countdowns and pass status.
  - Course-specific elevation profile chart with interactive runner scrubbers.
  - Zero-friction sharing via URL parameters (preserving race, wave start, goal time, and custom sightings without accounts).
  - External weather integration linking to Run-Weather.com.
- **Constraints**:
  - No user accounts, passwords, or personal data storage.
  - No backend database dependency; state is shareable via URL hash/parameters and local browser state.
  - Free and ad-free community project supported optionally via Ko-fi donations.

## Brand Commitments
- **Name**: WatchMy.Run
- **Developer Attribution**: Developed by Volodymyr Hartsev
- **Voice & Tone**: Functional, understated, calm, athletic, and direct. Zero marketing fluff, infomercial buzzwords, or artificial excitement.
- **Visual Identity**: High-contrast, clean athletic interface with cyan accents, glassmorphic HUD overlays, legible typography, and seamless light/dark mode support.

## Evidence on Hand
- Full GPX / GeoJSON elevation datasets for all 6 World Marathon Majors in `/public/data/` and `src/lib/data/marathonRegistry.ts`.
- Sub-course datasets for NYC Marathon, Half Marathon, 10K, and 5K in `src/lib/data/newYorkCourses.ts`.
- Elevation-aware pacing and mathematical forecasting engine in `src/lib/forecasting/`.

## Product Principles
1. **Glanceable Over Complex**: In race-day crowds, spectators have seconds to understand when to look up from their screen. Arrival times and windows must be immediately legible at arm's length.
2. **Phone-Free for the Runner**: Never require the runner to carry hardware, run background GPS tracking apps, or interact with a screen during 26.2 miles.
3. **Calibrate, Don't Guess**: Use actual tracking pins and course elevation dynamics to adaptively project finish times and cheer arrivals.
4. **Zero Friction & Privacy First**: No app store downloads, logins, or tracking cookies. Works instantly in any mobile browser via a shared link.

## Accessibility & Inclusion
- High color contrast between map layers, route polylines, and typography for outdoor sunlight readability.
- Clear touch target sizing (minimum 44x44px) for one-handed mobile operation.
- Native keyboard navigation and standard ARIA labels across modals and drawer controls.
