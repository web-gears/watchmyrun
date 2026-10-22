import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  executeListMarathons,
  executeGetCourseLandmarks,
  executeCalculateForecast,
  executeGetCheerWindows,
  executeAddTrackingPin,
  executeGenerateRaceUrl,
} from './core';

const MarathonEnum = z.enum([
  'new_york',
  'boston',
  'chicago',
  'london',
  'berlin',
  'tokyo',
]);

const StrategyEnum = z.enum(['flat', 'fatigue', 'negative']);

const PinSchema = z.object({
  lat: z.number().describe('Latitude of the tracking pin / AirTag location'),
  lon: z.number().describe('Longitude of the tracking pin / AirTag location'),
  timestamp: z.string().describe('ISO timestamp or HH:mm:ss time of sighting'),
  id: z.string().optional().describe('Optional identifier for this pin'),
});

const CheerLocationSchema = z.object({
  name: z.string().optional().describe('Label or name of the cheer spot'),
  mile: z.number().optional().describe('Mile mark along the course (e.g. 8.0, 16.5)'),
  distM: z.number().optional().describe('Distance in meters from the start line'),
  presetId: z.string().optional().describe('Preset ID from marathon landmarks (e.g. "ny_16")'),
  lat: z.number().optional().describe('Optional custom latitude'),
  lon: z.number().optional().describe('Optional custom longitude'),
});

/**
 * Creates and configures a fresh WatchMy.Run McpServer instance.
 */
export function createWatchMyRunMcpServer(baseUrl = 'https://watchmy.run'): McpServer {
  const server = new McpServer({
    name: 'WatchMyRun Marathon Forecaster',
    version: '1.0.0',
  });

  // TOOL 1: list_marathons
  server.tool(
    'list_marathons',
    'Lists supported World Marathon Majors with course distances, annual dates, default start times, elevation highlights, and wave corral structures.',
    {
      marathonId: MarathonEnum.optional().describe('Optional marathon ID to query a specific race'),
    },
    async ({ marathonId }) => {
      const result = executeListMarathons(marathonId);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // TOOL 2: get_course_landmarks
  server.tool(
    'get_course_landmarks',
    'Retrieves official cheer presets, timing split mats, mile markers, and elevation profile summary along a marathon course.',
    {
      marathon: MarathonEnum.describe('The marathon ID (e.g. "new_york", "boston")'),
    },
    async ({ marathon }) => {
      const result = executeGetCourseLandmarks(marathon);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // TOOL 3: calculate_runner_forecast
  server.tool(
    'calculate_runner_forecast',
    'Computes real-time runner position, elapsed time, current pace, distance covered, progress percentage, upcoming timing splits, and projected finish time.',
    {
      marathon: MarathonEnum.describe('Marathon ID'),
      startTime: z.string().describe("Wave or runner start time in 'HH:mm' or 'HH:mm:ss' (e.g. '09:10')"),
      targetFinishTime: z.string().optional().describe("Target finish time in 'HH:mm:ss' (e.g. '03:45:00')"),
      targetPace: z.string().optional().describe("Target pace in 'mm:ss' (e.g. '05:20')"),
      paceUnit: z.enum(['km', 'mi']).optional().default('km').describe("Unit for targetPace ('km' or 'mi')"),
      strategy: StrategyEnum.optional().default('fatigue').describe("Pacing strategy: 'flat', 'fatigue', or 'negative'"),
      queryTime: z.string().optional().describe("Time to forecast at (defaults to now)"),
      pins: z.array(PinSchema).optional().describe("Prior sightings or tracking pins"),
    },
    async ({
      marathon,
      startTime,
      targetFinishTime,
      targetPace,
      paceUnit,
      strategy,
      queryTime,
      pins,
    }) => {
      const result = executeCalculateForecast({
        marathon,
        startTime,
        targetFinishTime,
        targetPace,
        paceUnit,
        strategy,
        queryTime,
        pins,
        baseUrl,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // TOOL 4: get_cheer_spot_windows
  server.tool(
    'get_cheer_spot_windows',
    'Computes spectator meeting arrival windows (expected arrival, early arrival, late arrival) for cheer spots along the course.',
    {
      marathon: MarathonEnum.describe('Marathon ID'),
      startTime: z.string().describe("Wave or runner start time ('HH:mm')"),
      targetFinishTime: z.string().optional().describe("Target finish time ('HH:mm:ss')"),
      targetPace: z.string().optional().describe("Target pace ('mm:ss')"),
      paceUnit: z.enum(['km', 'mi']).optional().default('km'),
      strategy: StrategyEnum.optional().default('fatigue'),
      cheerLocations: z.array(CheerLocationSchema).describe('List of cheer spots by mile mark, distance, or presetId'),
      pins: z.array(PinSchema).optional().describe('Prior sightings or pins'),
      queryTime: z.string().optional(),
    },
    async ({
      marathon,
      startTime,
      targetFinishTime,
      targetPace,
      paceUnit,
      strategy,
      cheerLocations,
      pins,
      queryTime,
    }) => {
      const result = executeGetCheerWindows({
        marathon,
        startTime,
        targetFinishTime,
        targetPace,
        paceUnit,
        strategy,
        cheerLocations,
        pins,
        queryTime,
        baseUrl,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // TOOL 5: add_tracking_pin
  server.tool(
    'add_tracking_pin',
    'Snaps an AirTag or visual sighting coordinate to the official marathon route, calculates pace delta, and updates projected finish time.',
    {
      marathon: MarathonEnum.describe('Marathon ID'),
      lat: z.number().describe('Latitude of sighting'),
      lon: z.number().describe('Longitude of sighting'),
      timestamp: z.string().describe("Time of sighting ('HH:mm:ss' or ISO)"),
      startTime: z.string().describe("Wave start time ('HH:mm')"),
      targetFinishTime: z.string().optional().describe("Planned target finish time ('HH:mm:ss')"),
      targetPace: z.string().optional().describe("Planned pace ('mm:ss')"),
      paceUnit: z.enum(['km', 'mi']).optional().default('km'),
      strategy: StrategyEnum.optional().default('fatigue'),
      existingPins: z.array(PinSchema).optional().describe('Prior pins if any'),
    },
    async ({
      marathon,
      lat,
      lon,
      timestamp,
      startTime,
      targetFinishTime,
      targetPace,
      paceUnit,
      strategy,
      existingPins,
    }) => {
      const result = executeAddTrackingPin({
        marathon,
        lat,
        lon,
        timestamp,
        startTime,
        targetFinishTime,
        targetPace,
        paceUnit,
        strategy,
        existingPins,
        baseUrl,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // TOOL 6: generate_race_url
  server.tool(
    'generate_race_url',
    'Converts race parameters, pins, and spectator meeting spots into a clickable WatchMy.Run web URL.',
    {
      marathon: MarathonEnum.describe('Marathon ID'),
      startTime: z.string().optional().describe("Wave start time ('HH:mm')"),
      targetFinishTime: z.string().optional().describe("Target finish time ('HH:mm:ss')"),
      targetPace: z.string().optional().describe("Target pace ('mm:ss')"),
      strategy: StrategyEnum.optional().describe('Pacing strategy'),
      pins: z.array(PinSchema).optional().describe('Tracking pins'),
      spectatorMiles: z.array(z.number()).optional().describe('Cheer spot mile markers (e.g. [8.0, 16.0, 23.0])'),
      customBaseUrl: z.string().optional().describe('Optional override for the website URL'),
    },
    async ({
      marathon,
      startTime,
      targetFinishTime,
      targetPace,
      strategy,
      pins,
      spectatorMiles,
      customBaseUrl,
    }) => {
      const result = executeGenerateRaceUrl({
        marathon,
        startTime,
        targetFinishTime,
        targetPace,
        strategy,
        pins,
        spectatorMiles,
        customBaseUrl: customBaseUrl || baseUrl,
      });
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  return server;
}
