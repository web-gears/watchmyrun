import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createWatchMyRunMcpServer } from './server';
import { getOpenApiSpec } from './openapi';
import {
  executeListMarathons,
  executeSearchRaceCourses,
  executeGetCourseLandmarks,
  executeCalculateForecast,
  executeGetCheerWindows,
  executeAddTrackingPin,
  executeGenerateRaceUrl,
} from './core';
import { MarathonId } from '../../src/lib/forecasting/types';

export interface Env {
  BASE_WEB_URL?: string;
}

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, Last-Event-ID, Mcp-Session-Id',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id',
  'Access-Control-Max-Age': '86400',
};

function jsonResponse(data: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

function renderHtmlLandingPage(origin: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>WatchMy.Run MCP Server & API</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #090a0f;
      --card-bg: #131620;
      --card-border: #232738;
      --text: #f0f3fa;
      --dim: #8e99b3;
      --accent: #22d3ee;
      --accent-glow: rgba(34, 211, 238, 0.15);
      --code-bg: #0d1017;
      --green: #4ade80;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }
    .container {
      max-width: 860px;
      margin: 0 auto;
      padding: 48px 24px;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      border-radius: 9999px;
      background: rgba(74, 222, 128, 0.12);
      color: var(--green);
      font-size: 13px;
      font-weight: 600;
      border: 1px solid rgba(74, 222, 128, 0.25);
    }
    .badge-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 8px var(--green);
    }
    h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    p.lead {
      color: var(--dim);
      font-size: 18px;
      margin-top: 8px;
      margin-bottom: 32px;
    }
    .card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    }
    h2 {
      margin-top: 0;
      font-size: 20px;
      color: var(--accent);
    }
    pre {
      background: var(--code-bg);
      border: 1px solid var(--card-border);
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;
      font-size: 14px;
      color: #38bdf8;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
    }
    code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
      color: #38bdf8;
    }
    ul {
      padding-left: 20px;
      color: var(--text);
    }
    li {
      margin-bottom: 8px;
    }
    li strong {
      color: #fff;
    }
    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid var(--card-border);
      color: var(--dim);
      font-size: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    a {
      color: var(--accent);
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>WatchMy.Run MCP Server & API</h1>
      <span class="badge"><span class="badge-dot"></span> 24/7 Serverless</span>
    </div>
    <p class="lead">Dual-purpose AI engine: native Model Context Protocol (MCP) server for Claude Desktop / Cursor, plus OpenAPI 3.1 REST endpoints for ChatGPT Custom GPT Actions.</p>

    <div class="card">
      <h2>🔌 Connect Claude Desktop & Cursor (MCP)</h2>
      <p>Add this endpoint to your client configuration:</p>
      <pre><code>{
  "mcpServers": {
    "watchmyrun": {
      "url": "${origin}/mcp"
    }
  }
}</code></pre>
    </div>

    <div class="card">
      <h2>🤖 ChatGPT Custom GPT Actions (OpenAPI 3.1)</h2>
      <p>In your Custom GPT configure tab, add an Action and select <strong>Import from URL</strong>:</p>
      <pre><code>${origin}/openapi.json</code></pre>
      <p>OpenAI will automatically import all 6 marathon forecasting tools with zero manual coding.</p>
    </div>

    <div class="card">
      <h2>🛠️ Available Tools & REST Endpoints</h2>
      <ul>
        <li><code>GET /api/marathons</code> &bull; <code>list_marathons</code> &mdash; Discover all 6 World Marathon Majors (NYC, Boston, Chicago, London, Berlin, Tokyo).</li>
        <li><code>GET /api/landmarks</code> &bull; <code>get_course_landmarks</code> &mdash; Cheer presets, timing split mats, and elevation profiles.</li>
        <li><code>GET /api/forecast</code> &bull; <code>calculate_runner_forecast</code> &mdash; Live runner position, instantaneous pace, split ETAs, and projected finish time.</li>
        <li><code>GET /api/cheer-windows</code> &bull; <code>get_cheer_spot_windows</code> &mdash; Spectator arrival windows (early, expected, late arrival).</li>
        <li><code>POST /api/add-pin</code> &bull; <code>add_tracking_pin</code> &mdash; Ingest AirTag fixes, snap to course polyline, and recalibrate finish forecasts.</li>
        <li><code>GET /api/race-url</code> &bull; <code>generate_race_url</code> &mdash; Output pre-populated interactive map links.</li>
      </ul>
    </div>

    <div class="footer">
      <span>Hosted on Cloudflare Workers &bull; Zero Wall-Clock Limits</span>
      <span><a href="https://watchmy.run" target="_blank" rel="noopener">Visit WatchMy.Run &rarr;</a></span>
    </div>
  </div>
</body>
</html>`;
}

export default {
  async fetch(request: Request, env: Env = {}): Promise<Response> {
    const url = new URL(request.url);

    // 1. Handle CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // 2. Health check endpoint
    if (url.pathname === '/health') {
      return jsonResponse({
        status: 'healthy',
        server: 'watchmyrun-mcp',
        version: '1.0.0',
        uptime: 'serverless',
      });
    }

    // 3. OpenAPI 3.1 Schema for ChatGPT Custom GPT Actions
    if (url.pathname === '/openapi.json') {
      return jsonResponse(getOpenApiSpec(url.origin));
    }

    // 4. REST API Endpoints for ChatGPT Custom GPT Actions
    if (url.pathname.startsWith('/api/')) {
      const baseUrl = env.BASE_WEB_URL || 'https://watchmy.run';

      try {
        // Stateless pass-through proxy for external GPX / GeoJSON routes blocked by CORS
        if (url.pathname === '/api/proxy-route' && request.method === 'GET') {
          const targetUrl = url.searchParams.get('url');
          if (!targetUrl) {
            return jsonResponse({ error: 'Missing url query parameter' }, 400);
          }
          let parsedUrl: URL;
          try {
            parsedUrl = new URL(targetUrl);
          } catch {
            return jsonResponse({ error: 'Invalid URL format' }, 400);
          }
          if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            return jsonResponse({ error: 'Invalid URL protocol' }, 400);
          }

          const upstream = await fetch(parsedUrl.toString(), {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
              Accept: 'application/json, application/gpx+xml, text/xml, */*',
            },
          });

          if (!upstream.ok) {
            return new Response(`Upstream fetch failed: ${upstream.status} ${upstream.statusText}`, {
              status: upstream.status,
              headers: CORS_HEADERS,
            });
          }

          const bodyText = await upstream.text();
          return new Response(bodyText, {
            status: 200,
            headers: {
              'Content-Type': upstream.headers.get('content-type') || 'text/plain; charset=utf-8',
              ...CORS_HEADERS,
            },
          });
        }

        // Stateless multi-source public route search
        if (url.pathname === '/api/search-routes' && request.method === 'GET') {
          const q = (url.searchParams.get('q') || '').trim();
          const result = await executeSearchRaceCourses(q);
          return jsonResponse(result);
        }

        if (url.pathname === '/api/marathons' && request.method === 'GET') {
          const marathonId = (url.searchParams.get('marathonId') as MarathonId) || undefined;
          return jsonResponse(executeListMarathons(marathonId));
        }

        if (url.pathname === '/api/landmarks' && request.method === 'GET') {
          const marathon = (url.searchParams.get('marathon') as MarathonId) || undefined;
          const courseUrl = url.searchParams.get('courseUrl') || undefined;
          const courseTitle = url.searchParams.get('courseTitle') || undefined;
          return jsonResponse(
            await executeGetCourseLandmarks({ marathon, courseUrl, courseTitle })
          );
        }

        if (url.pathname === '/api/forecast' && request.method === 'GET') {
          const marathon = (url.searchParams.get('marathon') as MarathonId) || undefined;
          const courseUrl = url.searchParams.get('courseUrl') || undefined;
          const courseTitle = url.searchParams.get('courseTitle') || undefined;
          const startTime = url.searchParams.get('startTime') || '09:10';
          const targetFinishTime = url.searchParams.get('targetFinishTime') || undefined;
          const targetPace = url.searchParams.get('targetPace') || undefined;
          const paceUnit = (url.searchParams.get('paceUnit') as 'km' | 'mi') || 'km';
          const strategy = (url.searchParams.get('strategy') as 'flat' | 'fatigue' | 'negative') || 'fatigue';
          const queryTime = url.searchParams.get('queryTime') || undefined;

          const result = await executeCalculateForecast({
            marathon,
            courseUrl,
            courseTitle,
            startTime,
            targetFinishTime,
            targetPace,
            paceUnit,
            strategy,
            queryTime,
            baseUrl,
          });
          return jsonResponse(result);
        }

        if (url.pathname === '/api/cheer-windows' && request.method === 'GET') {
          const marathon = (url.searchParams.get('marathon') as MarathonId) || undefined;
          const courseUrl = url.searchParams.get('courseUrl') || undefined;
          const courseTitle = url.searchParams.get('courseTitle') || undefined;
          const startTime = url.searchParams.get('startTime') || '09:10';
          const targetFinishTime = url.searchParams.get('targetFinishTime') || undefined;
          const cheerMilesParam = url.searchParams.get('cheerMiles') || '8.0,16.0';
          const queryTime = url.searchParams.get('queryTime') || undefined;

          const cheerLocations = cheerMilesParam
            .split(',')
            .map((m) => parseFloat(m.trim()))
            .filter((m) => !isNaN(m))
            .map((mile) => ({ mile, name: `Mile ${mile.toFixed(1)}` }));

          const result = await executeGetCheerWindows({
            marathon,
            courseUrl,
            courseTitle,
            startTime,
            targetFinishTime,
            cheerLocations,
            queryTime,
            baseUrl,
          });
          return jsonResponse(result);
        }

        if (url.pathname === '/api/add-pin' && request.method === 'POST') {
          const body = (await request.json()) as any;
          const result = await executeAddTrackingPin({
            marathon: body.marathon,
            courseUrl: body.courseUrl,
            courseContent: body.courseContent,
            courseTitle: body.courseTitle,
            lat: Number(body.lat),
            lon: Number(body.lon),
            timestamp: body.timestamp || new Date().toISOString(),
            startTime: body.startTime || '09:10',
            targetFinishTime: body.targetFinishTime,
            existingPins: body.existingPins || [],
            baseUrl,
          });
          return jsonResponse(result);
        }

        if (url.pathname === '/api/race-url' && request.method === 'GET') {
          const marathon = (url.searchParams.get('marathon') as MarathonId) || undefined;
          const courseUrl = url.searchParams.get('courseUrl') || undefined;
          const courseTitle = url.searchParams.get('courseTitle') || undefined;
          const startTime = url.searchParams.get('startTime') || undefined;
          const finishTime = url.searchParams.get('finishTime') || undefined;
          const spectatorMilesParam = url.searchParams.get('spectatorMiles');
          const spectatorMiles = spectatorMilesParam
            ? spectatorMilesParam.split(',').map((m) => parseFloat(m.trim())).filter((m) => !isNaN(m))
            : undefined;

          const result = await executeGenerateRaceUrl({
            marathon,
            courseUrl,
            courseTitle,
            startTime,
            targetFinishTime: finishTime,
            spectatorMiles,
            customBaseUrl: baseUrl,
          });
          return jsonResponse(result);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResponse({ error: message }, 400);
      }
    }

    // 5. Landing page for browser / metadata query on GET /
    if (url.pathname === '/' || url.pathname === '') {
      if (request.method === 'GET') {
        const accept = request.headers.get('accept') || '';
        if (accept.includes('text/html')) {
          return new Response(renderHtmlLandingPage(url.origin), {
            status: 200,
            headers: {
              'Content-Type': 'text/html; charset=utf-8',
              ...CORS_HEADERS,
            },
          });
        }
        return jsonResponse({
          name: 'WatchMyRun Marathon Forecaster MCP & OpenAPI Server',
          version: '1.0.0',
          mcpEndpoint: `${url.origin}/mcp`,
          openApiSpec: `${url.origin}/openapi.json`,
          protocolVersion: '2024-11-05',
          transport: 'Streamable HTTP',
          documentation: 'https://watchmy.run',
        });
      }
    }

    // 6. MCP Transport Endpoint (/mcp, /messages, or POST /)
    const isMcpPath =
      url.pathname === '/mcp' ||
      url.pathname === '/messages' ||
      (url.pathname === '/' && request.method === 'POST');

    if (isMcpPath) {
      try {
        const headers = new Headers(request.headers);
        const accept = headers.get('accept') || '';
        if (!accept.includes('text/event-stream') || !accept.includes('application/json')) {
          headers.set('accept', 'application/json, text/event-stream');
        }

        const normalizedRequest = new Request(request, { headers });

        const baseUrl = env.BASE_WEB_URL || 'https://watchmy.run';
        const server = createWatchMyRunMcpServer(baseUrl);

        const transport = new WebStandardStreamableHTTPServerTransport({
          sessionIdGenerator: undefined,
          enableJsonResponse: true,
        });

        await server.connect(transport);
        const mcpResponse = await transport.handleRequest(normalizedRequest);

        const responseHeaders = new Headers(mcpResponse.headers);
        for (const [key, val] of Object.entries(CORS_HEADERS)) {
          if (!responseHeaders.has(key)) {
            responseHeaders.set(key, val);
          }
        }

        return new Response(mcpResponse.body, {
          status: mcpResponse.status,
          statusText: mcpResponse.statusText,
          headers: responseHeaders,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return jsonResponse(
          {
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: `Internal MCP Worker error: ${message}`,
            },
            id: null,
          },
          500
        );
      }
    }

    // 7. Fallback 404
    return jsonResponse(
      {
        error: 'Not Found',
        message: `Endpoint ${url.pathname} not recognized. Connect via POST /mcp or GET /openapi.json`,
      },
      404
    );
  },
};
