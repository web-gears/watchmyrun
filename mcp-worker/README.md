# WatchMy.Run Hosted MCP Server

A 100% serverless, 24/7 hosted **Model Context Protocol (MCP)** server running on **Cloudflare Workers**. It enables any AI assistant (Claude Desktop, Cursor, Cline, LibreChat, OpenAI custom actions, or agentic frameworks) to calculate marathon forecasts, snap AirTag coordinates to official race courses, compute spectator cheer arrival windows, and generate interactive WatchMy.Run map links.

---

## 🚀 Quick Setup for AI Clients

Add this server to your AI client's MCP configuration:

### Claude Desktop (`claude_desktop_config.json`) / Cursor (`mcp.json`):
```json
{
  "mcpServers": {
    "watchmyrun": {
      "url": "https://watchmyrun-mcp.<your-subdomain>.workers.dev/mcp"
    }
  }
}
```

*(For local testing with `wrangler dev`, use `"url": "http://localhost:8787/mcp"`)*

---

## 🛠️ Available MCP Tools

### 1. `list_marathons`
- **Description**: Lists supported World Marathon Majors (`new_york`, `boston`, `chicago`, `london`, `berlin`, `tokyo`) with official distances, annual dates, default start times, elevation highlights, and wave corral structures.
- **Parameters**: `marathonId` (optional)

### 2. `get_course_landmarks`
- **Description**: Retrieves cheer presets, timing split mats, mile markers, and elevation summary along the course.
- **Parameters**: `marathon` (`"new_york" | "boston" | "chicago" | "london" | "berlin" | "tokyo"`)

### 3. `calculate_runner_forecast`
- **Description**: Computes real-time runner position, elapsed time, current instantaneous and cumulative pace, progress percentage, upcoming timing splits, and projected finish time.
- **Parameters**:
  - `marathon`: Marathon ID
  - `startTime`: Wave start time (e.g. `"09:10"`)
  - `targetFinishTime` (optional): Planned finish time (e.g. `"03:45:00"`)
  - `targetPace` (optional): Planned pace (e.g. `"05:20"`)
  - `paceUnit` (optional): `"km"` (default) or `"mi"`
  - `strategy` (optional): `"flat"`, `"fatigue"` (default), or `"negative"`
  - `queryTime` (optional): Time to evaluate progress (defaults to now)
  - `pins` (optional): Array of previously recorded tracking pins

### 4. `get_cheer_spot_windows`
- **Description**: Computes spectator arrival windows (`expectedArrival`, `windowEarly`, `windowLate`, `secondsAway`) for cheer spots along the course, accounting for dynamic pacing and uncertainty buffers.
- **Parameters**:
  - `marathon`: Marathon ID
  - `startTime`: Wave start time
  - `targetFinishTime` / `targetPace`
  - `cheerLocations`: Array of objects with `mile`, `distM`, or `presetId`
  - `pins` (optional): Checkpoints to factor into calibration

### 5. `add_tracking_pin`
- **Description**: Snaps an on-course coordinate (e.g. from an Apple AirTag or spectator sighting) to the official course geometry, calculates pace delta (sec/km faster/slower), and updates finish time projections.
- **Parameters**:
  - `marathon`: Marathon ID
  - `lat`, `lon`: Geographic coordinates of sighting
  - `timestamp`: Time of sighting (`"HH:mm:ss"` or ISO)
  - `startTime`: Wave start time
  - `targetFinishTime`: Planned finish time
  - `existingPins` (optional): Earlier pins

### 6. `generate_race_url`
- **Description**: Converts configured race state into a clickable `https://watchmy.run/?race=...` link that opens directly on mobile phones with all pins and cheer spots pre-loaded.
- **Parameters**:
  - `marathon`: Marathon ID
  - `startTime`, `targetFinishTime`, `targetPace`, `strategy`, `pins`, `spectatorMiles`

---

## 🧑‍💻 Local Development & Testing

```bash
# Enter subproject directory
cd mcp-worker

# Run automated verification suite (tests all 10 operations)
npm test

# Run local development server
npm run dev

# Dry-run build
npx wrangler deploy --dry-run
```

---

## ☁️ Deployment

Deploy to your Cloudflare account with a single command:

```bash
cd mcp-worker
npm run deploy
```
