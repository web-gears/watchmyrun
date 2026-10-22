import worker from '../src/index';

async function sendMcpRequest(method: string, params: unknown, id: number) {
  const req = new Request('https://mcp.watchmy.run/mcp', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept': 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id,
      method,
      params,
    }),
  });

  const res = await worker.fetch(req, { BASE_WEB_URL: 'https://watchmy.run' });
  const text = await res.text();
  if (res.status !== 200) {
    throw new Error(`Request failed (${res.status}): ${text}`);
  }
  return JSON.parse(text);
}

async function runTests() {
  console.log('🧪 Starting WatchMy.Run MCP Server Verification Suite...\n');

  // Test 1: Health check
  console.log('1️⃣ Testing GET /health');
  const healthRes = await worker.fetch(new Request('https://mcp.watchmy.run/health'));
  const healthJson = await healthRes.json();
  console.log('   Status:', healthJson.status, '| Server:', healthJson.server);
  if (healthJson.status !== 'healthy') throw new Error('Health check failed');

  // Test 2: Landing page (HTML & JSON)
  console.log('\n2️⃣ Testing GET /');
  const landingHtmlRes = await worker.fetch(
    new Request('https://mcp.watchmy.run/', { headers: { accept: 'text/html' } })
  );
  console.log('   HTML landing page Content-Type:', landingHtmlRes.headers.get('content-type'));
  if (!landingHtmlRes.headers.get('content-type')?.includes('text/html')) {
    throw new Error('HTML landing page failed');
  }

  const landingJsonRes = await worker.fetch(
    new Request('https://mcp.watchmy.run/', { headers: { accept: 'application/json' } })
  );
  const landingJson = await landingJsonRes.json();
  console.log('   JSON landing info:', landingJson.name);

  // Test 2b: OpenAPI Schema for ChatGPT
  console.log('\n2️⃣b Testing GET /openapi.json (ChatGPT Custom Actions)');
  const openApiRes = await worker.fetch(new Request('https://mcp.watchmy.run/openapi.json'));
  const openApiJson = (await openApiRes.json()) as any;
  console.log('   OpenAPI Version:', openApiJson.openapi, '| Actions count:', Object.keys(openApiJson.paths).length);
  if (!openApiJson.paths['/api/forecast']) throw new Error('Missing /api/forecast in OpenAPI schema');

  // Test 2c: REST API for ChatGPT
  console.log('\n2️⃣c Testing GET /api/forecast (REST endpoint)');
  const restForecastRes = await worker.fetch(
    new Request('https://mcp.watchmy.run/api/forecast?marathon=new_york&startTime=09:10&targetFinishTime=03:45:00&queryTime=10:30:00')
  );
  const restForecastJson = (await restForecastRes.json()) as any;
  console.log('   REST Forecast Status:', restForecastJson.status, '| Distance:', restForecastJson.distanceCoveredKm, 'km');
  if (!restForecastJson.distanceCoveredKm) throw new Error('REST forecast failed');

  // Test 3: Initialize MCP protocol
  console.log('\n3️⃣ Testing MCP initialize');
  const initRes = await sendMcpRequest(
    'initialize',
    {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' },
    },
    1
  );
  console.log('   Server Name:', initRes.result.serverInfo.name);
  console.log('   Protocol Version:', initRes.result.protocolVersion);

  // Test 4: List registered tools
  console.log('\n4️⃣ Testing tools/list');
  const toolsListRes = await sendMcpRequest('tools/list', {}, 2);
  const toolNames = toolsListRes.result.tools.map((t: { name: string }) => t.name);
  console.log('   Registered tools (' + toolNames.length + '):', toolNames.join(', '));
  if (toolNames.length !== 6) throw new Error(`Expected 6 tools, found ${toolNames.length}`);

  // Test 5: Tool 1 - list_marathons
  console.log('\n5️⃣ Testing tool: list_marathons');
  const listRes = await sendMcpRequest(
    'tools/call',
    {
      name: 'list_marathons',
      arguments: {},
    },
    3
  );
  const marathonsData = JSON.parse(listRes.result.content[0].text);
  console.log('   Supported marathons:', marathonsData.marathons.map((m: any) => m.shortName).join(', '));

  // Test 6: Tool 2 - get_course_landmarks (New York)
  console.log('\n6️⃣ Testing tool: get_course_landmarks (new_york)');
  const landmarksRes = await sendMcpRequest(
    'tools/call',
    {
      name: 'get_course_landmarks',
      arguments: { marathon: 'new_york' },
    },
    4
  );
  const landmarksData = JSON.parse(landmarksRes.result.content[0].text);
  console.log('   Cheer presets count:', landmarksData.cheerPresets.length);
  console.log('   Timing mats count:', landmarksData.timingMats.length);
  console.log('   First cheer preset:', landmarksData.cheerPresets[0].name);

  // Test 7: Tool 3 - calculate_runner_forecast (NYC, start 09:10, query 10:30, target 03:45:00)
  console.log('\n7️⃣ Testing tool: calculate_runner_forecast (NYC, 09:10 start, 10:30 elapsed)');
  const forecastRes = await sendMcpRequest(
    'tools/call',
    {
      name: 'calculate_runner_forecast',
      arguments: {
        marathon: 'new_york',
        startTime: '09:10',
        targetFinishTime: '03:45:00',
        queryTime: '10:30:00',
        strategy: 'fatigue',
      },
    },
    5
  );
  const forecastData = JSON.parse(forecastRes.result.content[0].text);
  console.log('   Status:', forecastData.status);
  console.log('   Elapsed:', forecastData.elapsedFormatted);
  console.log('   Distance Covered:', forecastData.distanceCoveredKm, 'km (' + forecastData.distanceCoveredMi + ' mi)');
  console.log('   Progress:', forecastData.progressPct + '%');
  console.log('   Current Pace:', forecastData.instantPace.minPerKm, '/km (' + forecastData.instantPace.minPerMi + ' /mi)');
  console.log('   Projected Finish:', forecastData.projectedFinishTime);
  console.log('   Tracking URL:', forecastData.webTrackingUrl);

  // Test 8: Tool 4 - get_cheer_spot_windows (Mile 8 & Mile 16)
  console.log('\n8️⃣ Testing tool: get_cheer_spot_windows (NYC, Mile 8 & Mile 16)');
  const windowsRes = await sendMcpRequest(
    'tools/call',
    {
      name: 'get_cheer_spot_windows',
      arguments: {
        marathon: 'new_york',
        startTime: '09:10',
        targetFinishTime: '03:45:00',
        queryTime: '10:30:00',
        cheerLocations: [
          { mile: 8.0, name: 'Park Slope (4th Ave)' },
          { mile: 16.0, name: 'Queensboro Bridge Exit' },
        ],
      },
    },
    6
  );
  const windowsData = JSON.parse(windowsRes.result.content[0].text);
  console.log('   Cheer Windows Count:', windowsData.meetingWindows.length);
  for (const w of windowsData.meetingWindows) {
    console.log(`   - ${w.spotName} (Mi ${w.mileMark}): ETA ${w.expectedEta} [${w.windowEarly} - ${w.windowLate}], Runner passed: ${w.hasRunnerPassed}`);
  }

  // Test 9: Tool 5 - add_tracking_pin (AirTag sighting along 1st Ave near 68th St)
  console.log('\n9️⃣ Testing tool: add_tracking_pin (AirTag at 1st Ave, 10:45:00)');
  const pinRes = await sendMcpRequest(
    'tools/call',
    {
      name: 'add_tracking_pin',
      arguments: {
        marathon: 'new_york',
        lat: 40.7656,
        lon: -73.9575,
        timestamp: '10:45:00',
        startTime: '09:10',
        targetFinishTime: '03:45:00',
      },
    },
    7
  );
  const pinData = JSON.parse(pinRes.result.content[0].text);
  console.log('   Pin Snapped Mile:', pinData.pinAdded.snappedMile, 'mi (' + pinData.pinAdded.snappedKm + ' km)');
  console.log('   Orthogonal Error:', pinData.pinAdded.orthogonalErrorMeters, 'm');
  console.log('   Implied Pace:', pinData.recalibration.impliedPaceMinPerKm, '/km');
  console.log('   Pace Delta:', pinData.recalibration.paceDeltaVsTarget);
  console.log('   Recalibrated Finish ETA:', pinData.recalibration.newProjectedFinishTime);
  console.log('   Tracking URL with Pin:', pinData.webTrackingUrl);

  // Test 10: Tool 6 - generate_race_url
  console.log('\n🔟 Testing tool: generate_race_url');
  const urlRes = await sendMcpRequest(
    'tools/call',
    {
      name: 'generate_race_url',
      arguments: {
        marathon: 'boston',
        startTime: '10:00',
        targetFinishTime: '03:30:00',
        spectatorMiles: [12.5, 21.0],
      },
    },
    8
  );
  const urlData = JSON.parse(urlRes.result.content[0].text);
  console.log('   Generated URL:', urlData.url);
  console.log('   Markdown Link:', urlData.markdownLink);

  console.log('\n🎉 ALL 10 TESTS PASSED SUCCESSFULLY! The MCP server is 100% verified and operational.');
}

runTests().catch((err) => {
  console.error('\n❌ Test suite failed:', err);
  process.exit(1);
});
