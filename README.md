# WatchMy.Run — Phone-Free Marathon Tracker, Spectator Planner & MCP Server

[![Live App](https://img.shields.io/badge/Live_App-watchmy.run-0284c7?style=flat-square)](https://watchmy.run)
[![MCP Server](https://img.shields.io/badge/MCP_Server-Live_24%2F7-10b981?style=flat-square)](https://watchmyrun-mcp.webgears.workers.dev/mcp)
[![OpenAPI 3.1](https://img.shields.io/badge/OpenAPI_3.1-Spec-38bdf8?style=flat-square)](https://watchmyrun-mcp.webgears.workers.dev/openapi.json)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

A geospatial dataset collection, web application, and **Model Context Protocol (MCP)** forecasting engine for the **6 World Marathon Majors** (New York City, Boston, Chicago, London, Berlin, Tokyo) and **any custom running course worldwide** (GPX, Garmin FIT, TCX, GeoJSON, OpenStreetMap, Waymarked Trails, RideWithGPS). Designed to calculate, predict, and project runner live coordinates, pacing splits, and spectator cheer spot arrival windows without requiring the runner to carry a phone.

---

## 🤖 Hosted MCP Server & OpenAPI Integration

WatchMy.Run includes a 24/7 serverless MCP & OpenAPI server on Cloudflare Workers ([`mcp-worker/`](mcp-worker/README.md)).

### Connect in Claude Desktop / Cursor / Windsurf / Cline
```json
{
  "mcpServers": {
    "watchmyrun": {
      "url": "https://watchmyrun-mcp.webgears.workers.dev/mcp"
    }
  }
}
```

### Available MCP Tools (7 Tools)
1. `list_marathons` — Official distances, dates, start waves, and elevation profiles for the 6 World Marathon Majors.
2. `search_race_courses` — Search worldwide road & trail courses across curated marathons, OpenStreetMap route relations, Waymarked Trails, and RideWithGPS.
3. `get_course_landmarks` — Retrieve split timing mats, cheer spot presets, and elevation summaries for any major or custom course.
4. `calculate_runner_forecast` — Calculate live runner position, grade-adjusted pace, and projected finish time.
5. `get_cheer_spot_windows` — Calculate spectator arrival windows (`windowEarly` – `windowLate`) for any mile, km, or landmark along the route.
6. `add_tracking_pin` — Snap an on-course sighting coordinate or Apple AirTag ping to the course geometry and recalibrate downstream pace.
7. `generate_race_url` — Generate a shareable `https://watchmy.run/?race=...` link with all cheer spots and tracking pins pre-loaded.

---

## 1. Directory Structure

```text
follow-me-running/
├── out/                      # Static export production bundle ready for Appwrite Static Sites
├── public/
│   ├── data/                 # Bundled offline fallback datasets
│   ├── icon.svg              # App PWA icon
│   └── manifest.json         # PWA Web App manifest
├── src/
│   ├── app/                  # Next.js 15 App Router (layout, page, globals)
│   ├── components/
│   │   ├── Header/           # AppHeader, ThemeToggle
│   │   ├── Map/              # MarathonMap, MapWrapper (Leaflet with CartoDB)
│   │   ├── Controls/         # RaceConfigDrawer, PinDropModal
│   │   └── HUD/              # RunnerStatusHUD, ElevationChart, SpectatorWindowCard
│   └── lib/
│       ├── data/             # marathonRegistry, courseLoader (online-first + offline fallback)
│       ├── forecasting/      # geodesy, pacingModels, snapToCourse, forecastEngine, uncertainty
│       └── state/            # urlState (shareable link query sync)
├── data/                     # Raw source files (gpx, geojson, schedules, projections)
└── scripts/                  # Python ETL and CLI testing scripts
```

---

## Quickstart & Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev
# Open http://localhost:3000

# Build static site for Appwrite Static Sites deployment
npm run build
# Generated static bundle is located in out/
```

### Deploying to Appwrite Static Sites
1. Run `npm run build`.
2. Upload the contents of the `out/` directory to your Appwrite Static Sites project / CDN bucket.
3. The site runs completely client-side with zero Node.js server dependencies and full offline support.


---

## 2. Course & Elevation Comparison Matrix

All tracks are normalized from official USATF/AIMS/World Athletics certified 42.195 km marathon routes.

| Marathon | Track Distance | Start Ele | Finish Ele | Net Change | Total Gain ($G^+$) | Total Loss ($G^-$) | Max Ele | Min Ele | Course Profile |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **New York City** | 42.61 km | 33.0 m | 8.5 m | -24.5 m | **+89.2 m** | **-113.7 m** | 52.0 m | 2.0 m | Rolling bridges & 5th Ave false flat |
| **Boston** | 42.43 km | 144.0 m | 10.0 m | **-134.0 m** | **+187.5 m** | **-321.5 m** | 144.0 m | 3.0 m | Severe downhill start, 4 Newton Hills |
| **Chicago** | 42.81 km | 181.8 m | 180.1 m | -1.7 m | **+6.1 m** | **-7.8 m** | 182.5 m | 176.5 m | Dead flat; minor Roosevelt overpass |
| **London** | 42.29 km | 43.0 m | 8.0 m | -35.0 m | **+71.8 m** | **-106.8 m** | 48.0 m | 4.0 m | Downhill first 5 km, flat Thames banks |
| **Berlin** | 42.75 km | 38.0 m | 39.5 m | +1.5 m | **+33.6 m** | **-32.1 m** | 47.0 m | 31.0 m | Ultra-flat World Record loop |
| **Tokyo** | 42.29 km | 38.0 m | 13.0 m | -25.0 m | **+664.3 m** | **-689.3 m** | 42.0 m | 2.0 m | Downhill start from Shinjuku, flat spurs |

---

## 3. Wave Schedules & Cut-Off Constraints

### TCS New York City Marathon
- **Staging / Start**: Fort Wadsworth, Staten Island. 3 Start Corrals (**Blue**, **Orange**, **Green**).
  - Blue & Orange run on the Verrazzano Upper Deck; Green runs on the Lower Deck.
  - All three color waves converge at Fourth Ave & 92nd St in Brooklyn (Mile 3 / 4.8 km).
- **Start Timeline**:
  - `08:00:00`: Professional Wheelchairs
  - `08:22:00`: Handcycle Category & Athletes with Disabilities
  - `08:40:00`: Professional Women Open Division
  - `09:05:00`: Professional Men Open Division
  - `09:10:00`: Wave 1 (Corrals A–F, sub-3:15 pace)
  - `09:45:00`: Wave 2 (Corrals A–F, 3:15–3:45 pace)
  - `10:20:00`: Wave 3 (Corrals A–F, 3:45–4:15 pace)
  - `10:55:00`: Wave 4 (Corrals A–F, 4:15–4:55 pace)
  - `11:30:00`: Wave 5 (Corrals A–F, 4:55+ pace)
- **Cut-off Policy**: Sweep bus follows at **13:45 min/mile** pace (~6 hours after the final wave starts, course closes ~7:30 PM).

### Boston Marathon
- **Start Timeline**:
  - `09:02:00`: Men's Wheelchair | `09:05:00`: Women's Wheelchair
  - `09:30:00`: Handcycles & Duos
  - `09:37:00`: Elite Men | `09:47:00`: Elite Women | `09:50:00`: Para Division
  - `10:00:00`: Wave 1 (Bibs 1–7,999)
  - `10:25:00`: Wave 2 (Bibs 8,000–15,999)
  - `10:50:00`: Wave 3 (Bibs 16,000–23,999)
  - `11:15:00`: Wave 4 (Bibs 24,000–33,000+)
- **Cut-off**: 6 hours after last start crossing (~5:30 PM).

### Bank of America Chicago Marathon
- **Start Timeline**:
  - `07:20:00`: Wheelchairs & Handcycles
  - `07:30:00`: Wave 1 (Corrals A–E)
  - `08:00:00`: Wave 2 (Corrals F–H)
  - `08:35:00`: Wave 3 (Corrals J–N)
- **Cut-off**: 6 hours 30 minutes from crossing the start mat (15:00 min/mile pace).

---

## 4. Map Projections & Coordinate Systems

| Marathon | Display CRS | Local Conformal Planar CRS | Central Meridian | Scale Factor | Best For |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **New York** | EPSG:4326 / EPSG:3857 | **EPSG:2263** (NAD83 NY Long Island) / **EPSG:32618** (UTM 18N) | -75.0° | 0.9996 | High-precision meter-based local distance |
| **Boston** | EPSG:4326 / EPSG:3857 | **EPSG:26986** (NAD83 Mass Mainland) / **EPSG:32619** (UTM 19N) | -69.0° | 0.9996 | Flat planar projection across Middlesex/Suffolk |
| **Chicago** | EPSG:4326 / EPSG:3857 | **EPSG:3435** (NAD83 Illinois East) / **EPSG:32616** (UTM 16N) | -87.0° | 0.9996 | Eliminates urban canyon distortion |
| **London** | EPSG:4326 / EPSG:3857 | **EPSG:27700** (OSGB36 British National Grid) / **EPSG:32630** (UTM 30N) | -2.0° | 0.9996 | Ordnance Survey alignment |
| **Berlin** | EPSG:4326 / EPSG:3857 | **EPSG:25833** (ETRS89 / UTM Zone 33N) | +15.0° | 0.9996 | European standard metric grid |
| **Tokyo** | EPSG:4326 / EPSG:3857 | **EPSG:6677** (JGD2011 CS IX) / **EPSG:32654** (UTM 54N) | +141.0° | 0.9996 | GSI Japan official rectangular plane |

### Planar Equirectangular Approximation
For fast mobile evaluation (avoiding heavy ellipsoidal math in JS/Dart/Flutter loops):
$$x = R \cdot (\lambda_2 - \lambda_1) \cos\left(\frac{\phi_1 + \phi_2}{2}\right)$$
$$y = R \cdot (\phi_2 - \phi_1)$$
$$d = \sqrt{x^2 + y^2}$$
*Relative error is $< 0.05\%$ over a 42 km marathon bounding box.*

---

## 5. Runner Position Forecasting Engine

The engine located at [`scripts/runner_forecast_engine.py`](scripts/runner_forecast_engine.py) models runner progress using 4 distinct strategies:

1. **Even Pacing (`even`)**:
   $$s(t) = v_{\text{avg}} \cdot t$$
2. **Fatigue / Positive-Split Model (`fatigue`)**:
   Accounts for physiological slowdown over 42.195 km:
   $$v(s) = v_0 \cdot \left(1.05 - 0.12 \cdot \left(\frac{s}{L}\right)^{1.3}\right)$$
3. **Grade-Adjusted Pace Model (`gap_elevation`)**:
   Applies the **Minetti Metabolic Cost Equation** ($i = \frac{dh}{ds}$):
   $$C_r(i) = 155.4 i^5 - 30.4 i^4 - 43.3 i^3 + 46.3 i^2 + 19.5 i + 3.6 \quad [\text{J}/(\text{kg}\cdot\text{m})]$$
   Instantaneous running velocity is adjusted by metabolic cost ratio $\frac{C_r(0)}{C_r(i)}$.
4. **Timing-Mat Calibrated Update**:
   When live split times $(s_k, t_k)$ arrive from RFID timing mats, the model recalibrates projected pace for downstream segments.

### Usage Example

```python
from datetime import datetime, timedelta
from scripts.runner_forecast_engine import MarathonCourse, RunnerForecast

# 1. Load Course
course = MarathonCourse('new_york')

# 2. Configure Runner (Wave 1 at 09:10:00, 3h30m goal)
start_time = datetime(2026, 11, 1, 9, 10, 0)
target_seconds = 3 * 3600 + 30 * 60
forecast = RunnerForecast(course, start_time, target_seconds, pacing_strategy="fatigue")

# 3. Query Position at 10:40:00 (+90 mins)
query_time = start_time + timedelta(minutes=90)
res = forecast.forecast_at_time(query_time)

print("Distance:", res["distance_km"], "km")
print("Coordinates:", res["coordinate"]["lat"], res["coordinate"]["lon"])
print("Instant Pace:", res["instant_pace"])
print("Nearby Landmark:", res["nearby_landmark"]["description"])
print("Upcoming Splits:", res["upcoming_splits"])
```
