# WatchMy.Run Hosted MCP Server (`v1.1.0`)

[![Live MCP Endpoint](https://img.shields.io/badge/MCP_Endpoint-Live_24%2F7-10b981?style=flat-square)](https://watchmyrun-mcp.webgears.workers.dev/mcp)
[![OpenAPI 3.1](https://img.shields.io/badge/OpenAPI_3.1-Spec-38bdf8?style=flat-square)](https://watchmyrun-mcp.webgears.workers.dev/openapi.json)
[![Web App](https://img.shields.io/badge/Web_App-watchmy.run-0284c7?style=flat-square)](https://watchmy.run)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](../LICENSE)

A 100% serverless, 24/7 hosted **Model Context Protocol (MCP)** server running on **Cloudflare Workers**. It enables any AI assistant (Claude Desktop, Cursor, Cline, Windsurf, ChatGPT Custom GPTs, or agentic frameworks) to:
- Search public race courses worldwide (curated marathons, OpenStreetMap route relations, Waymarked Trails, RideWithGPS).
- Calculate real-time runner position, elevation-adjusted pacing, and split ETAs for the **6 World Marathon Majors** or **any custom GPX / FIT / TCX / GeoJSON / OpenStreetMap route**.
- Compute **Spectator Cheer Spot Arrival Windows** (`windowEarly` – `windowLate`) so friends and family know exactly when to look up.
- Recalibrate runner pace mid-race by snapping an on-course sighting coordinate or Apple AirTag ping to the course geometry.
- Generate shareable `https://watchmy.run/?race=...` live map links with all cheer spots and tracking pins pre-loaded.

---

## 🚀 Quick Setup for AI Clients

### 1. Remote Streamable HTTP (Claude Desktop / Cursor / Windsurf / Cline)
```json
{
  "mcpServers": {
    "watchmyrun": {
      "url": "https://watchmyrun-mcp.webgears.workers.dev/mcp"
    }
  }
}
```

### 2. Via `mcp-remote` Bridge (for stdio-only MCP clients)
```json
{
  "mcpServers": {
    "watchmyrun": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://watchmyrun-mcp.webgears.workers.dev/mcp"
      ]
    }
  }
}
```

### 3. ChatGPT Custom GPT Actions (OpenAPI 3.1)
Import the live OpenAPI specification URL directly in GPT Builder:
```text
https://watchmyrun-mcp.webgears.workers.dev/openapi.json
```

---

## 🛠️ Available MCP Tools (7 Tools)

### 1. `list_marathons`
- **Description**: Lists supported World Marathon Majors (`new_york`, `boston`, `chicago`, `london`, `berlin`, `tokyo`) with official distances, annual dates, default start times, elevation highlights, and wave corral structures.
- **Parameters**: `marathonId` (optional)

### 2. `search_race_courses`
- **Description**: Searches worldwide road & trail running courses across curated marathons, Waymarked Trails, OpenStreetMap route relations, and RideWithGPS. Returns `routeUrl` values that can be passed directly as `courseUrl` to any forecasting tool.
- **Parameters**: `query` (e.g. `"Madeira"`, `"Valencia Marathon"`, `"Marine Corps"`), `limit` (optional)

### 3. `get_course_landmarks`
- **Description**: Retrieves cheer presets, timing split mats, mile markers, and elevation summary along an official World Major or custom course (`courseUrl` or `courseContent`).
- **Parameters**: `marathon` (optional), `courseUrl` (optional), `courseContent` (optional), `courseTitle` (optional)

### 4. `calculate_runner_forecast`
- **Description**: Computes real-time runner position, elapsed time, current instantaneous and cumulative pace, progress percentage, upcoming timing splits, and projected finish time.
- **Parameters**:
  - `marathon` or `courseUrl` / `courseContent`
  - `startTime`: Wave start time (e.g. `"09:10"`)
  - `targetFinishTime` (optional): Planned finish time (e.g. `"03:45:00"`)
  - `targetPace` (optional): Planned pace (e.g. `"05:20"`)
  - `paceUnit` (optional): `"km"` (default) or `"mi"`
  - `strategy` (optional): `"even"`, `"fatigue"` (default), or `"gap_elevation"`
  - `queryTime` (optional): Time to evaluate progress (defaults to now)
  - `pins` (optional): Array of previously recorded tracking pins

### 5. `get_cheer_spot_windows`
- **Description**: Computes spectator arrival windows (`expectedEta`, `windowEarly`, `windowLate`, `secondsAway`) for cheer spots along the course, accounting for elevation grade and dynamic uncertainty buffers.
- **Parameters**:
  - `marathon` or `courseUrl` / `courseContent`
  - `startTime`: Wave start time
  - `targetFinishTime` / `targetPace`
  - `cheerLocations`: Array of objects with `mile`, `distM`, `presetId`, or `name`
  - `pins` (optional): Checkpoints to factor into calibration

### 6. `add_tracking_pin`
- **Description**: Snaps an on-course coordinate (e.g. from an Apple AirTag or spectator sighting) to the course geometry, calculates pace delta (sec/km faster/slower), and updates finish time projections.
- **Parameters**:
  - `marathon` or `courseUrl` / `courseContent`
  - `lat`, `lon`: Geographic coordinates of sighting
  - `timestamp`: Time of sighting (`"HH:mm:ss"` or ISO)
  - `startTime`: Wave start time
  - `targetFinishTime`: Planned finish time
  - `existingPins` (optional): Earlier pins

### 7. `generate_race_url`
- **Description**: Converts configured race state (including custom `courseUrl`) into a clickable `https://watchmy.run/?race=...` link that opens directly on mobile phones with all pins and cheer spots pre-loaded.
- **Parameters**:
  - `marathon` or `courseUrl` + `courseTitle`
  - `startTime`, `targetFinishTime`, `targetPace`, `strategy`, `pins`, `spectatorMiles`

---

## 🧑‍💻 Local Development & Testing

```bash
# Enter subproject directory
cd mcp-worker

# Run automated verification suite (tests all tools + custom courses)
npm test

# Run local development server
npm run dev

# Deploy to Cloudflare Workers
npm run deploy
```
