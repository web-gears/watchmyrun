export function getOpenApiSpec(origin: string) {
  return {
    openapi: '3.1.0',
    info: {
      title: 'WatchMy.Run Marathon Assistant',
      description:
        'Live marathon forecasting, AirTag tracking pin recalibration, and spectator cheer meeting windows for World Marathon Majors (New York, Boston, Chicago, London, Berlin, Tokyo).',
      version: '1.0.0',
    },
    servers: [
      {
        url: origin,
      },
    ],
    paths: {
      '/api/marathons': {
        get: {
          operationId: 'listMarathons',
          summary: 'List supported World Marathon Majors',
          description:
            'Returns all supported marathons (New York, Boston, Chicago, London, Berlin, Tokyo) with official wave corrals, distances, and elevation highlights.',
          parameters: [
            {
              name: 'marathonId',
              in: 'query',
              required: false,
              schema: {
                type: 'string',
                enum: ['new_york', 'boston', 'chicago', 'london', 'berlin', 'tokyo'],
              },
              description: 'Optional ID to fetch single marathon details',
            },
          ],
          responses: {
            '200': {
              description: 'Successful list of marathons',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      },
      '/api/landmarks': {
        get: {
          operationId: 'getCourseLandmarks',
          summary: 'Get course landmarks and timing split mats',
          description:
            'Retrieves official cheer presets, timing mats (5K, 10K, Half, etc.), and elevation profile summary along a marathon course.',
          parameters: [
            {
              name: 'marathon',
              in: 'query',
              required: true,
              schema: {
                type: 'string',
                enum: ['new_york', 'boston', 'chicago', 'london', 'berlin', 'tokyo'],
              },
              description: 'The marathon ID',
            },
          ],
          responses: {
            '200': {
              description: 'Landmarks and timing mats',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      },
      '/api/forecast': {
        get: {
          operationId: 'calculateRunnerForecast',
          summary: 'Calculate real-time runner position and finish ETA',
          description:
            'Computes real-time runner progress, distance covered, elapsed time, instantaneous pace, upcoming split ETAs, and projected finish time.',
          parameters: [
            {
              name: 'marathon',
              in: 'query',
              required: true,
              schema: {
                type: 'string',
                enum: ['new_york', 'boston', 'chicago', 'london', 'berlin', 'tokyo'],
              },
              description: 'The marathon ID',
            },
            {
              name: 'startTime',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: "Wave start time in 'HH:mm' (e.g. '09:10')",
            },
            {
              name: 'targetFinishTime',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: "Target finish time in 'HH:mm:ss' (e.g. '03:45:00')",
            },
            {
              name: 'targetPace',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: "Target pace in 'mm:ss' (e.g. '05:20')",
            },
            {
              name: 'paceUnit',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['km', 'mi'], default: 'km' },
            },
            {
              name: 'strategy',
              in: 'query',
              required: false,
              schema: { type: 'string', enum: ['flat', 'fatigue', 'negative'], default: 'fatigue' },
            },
            {
              name: 'queryTime',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Time to forecast at (defaults to now)',
            },
          ],
          responses: {
            '200': {
              description: 'Runner forecast telemetry',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      },
      '/api/cheer-windows': {
        get: {
          operationId: 'getCheerSpotWindows',
          summary: 'Compute spectator arrival windows for cheer spots',
          description:
            'Calculates estimated spectator meeting windows (early arrival, expected arrival, late arrival) for cheer spots along the course.',
          parameters: [
            {
              name: 'marathon',
              in: 'query',
              required: true,
              schema: {
                type: 'string',
                enum: ['new_york', 'boston', 'chicago', 'london', 'berlin', 'tokyo'],
              },
              description: 'The marathon ID',
            },
            {
              name: 'startTime',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: "Wave start time in 'HH:mm' (e.g. '09:10')",
            },
            {
              name: 'targetFinishTime',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: "Target finish time in 'HH:mm:ss' (e.g. '03:45:00')",
            },
            {
              name: 'cheerMiles',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: "Comma-separated mile marks, e.g. '8.0,16.0,23.0'",
            },
            {
              name: 'queryTime',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: 'Time to evaluate (defaults to now)',
            },
          ],
          responses: {
            '200': {
              description: 'Spectator meeting arrival windows',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      },
      '/api/add-pin': {
        post: {
          operationId: 'addTrackingPin',
          summary: 'Snap sighting/AirTag coordinate & recalibrate finish',
          description:
            'Ingests an on-course coordinate (e.g. from an Apple AirTag or spectator sighting), snaps it to the official course polyline, and recalibrates remaining finish projections.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['marathon', 'lat', 'lon', 'timestamp', 'startTime'],
                  properties: {
                    marathon: {
                      type: 'string',
                      enum: ['new_york', 'boston', 'chicago', 'london', 'berlin', 'tokyo'],
                    },
                    lat: { type: 'number', description: 'Latitude of the sighting' },
                    lon: { type: 'number', description: 'Longitude of the sighting' },
                    timestamp: { type: 'string', description: "Time of sighting ('HH:mm:ss' or ISO)" },
                    startTime: { type: 'string', description: "Wave start time ('HH:mm')" },
                    targetFinishTime: { type: 'string', description: "Planned target finish time ('HH:mm:ss')" },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: 'Snapped pin details and recalibrated pacing',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      },
      '/api/race-url': {
        get: {
          operationId: 'generateRaceUrl',
          summary: 'Generate clickable WatchMy.Run map link',
          description:
            'Generates a pre-populated https://watchmy.run/?race=... link that opens directly on mobile phones.',
          parameters: [
            {
              name: 'marathon',
              in: 'query',
              required: true,
              schema: {
                type: 'string',
                enum: ['new_york', 'boston', 'chicago', 'london', 'berlin', 'tokyo'],
              },
            },
            {
              name: 'startTime',
              in: 'query',
              required: false,
              schema: { type: 'string' },
            },
            {
              name: 'finishTime',
              in: 'query',
              required: false,
              schema: { type: 'string' },
            },
            {
              name: 'spectatorMiles',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: "Comma-separated cheer miles, e.g. '8.0,16.0'",
            },
          ],
          responses: {
            '200': {
              description: 'Generated interactive map URL',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}
