'use client';

import { useMemo } from 'react';
import { Box, Text, Group } from '@mantine/core';
import { CoursePoint } from '@/lib/forecasting/types';

interface ElevationChartProps {
  points: CoursePoint[];
  currentDistM: number;
  spectatorDistM?: number;
  spectatorDistMList?: number[];
  height?: number;
}

export function ElevationChart({
  points,
  currentDistM,
  spectatorDistM,
  spectatorDistMList,
  height = 50,
}: ElevationChartProps) {
  // Downsample points to ~80 points for smooth SVG rendering
  const sampled = useMemo(() => {
    if (points.length <= 80) return points;
    const step = Math.floor(points.length / 80);
    const res: CoursePoint[] = [];
    for (let i = 0; i < points.length; i += step) {
      res.push(points[i]);
    }
    if (res[res.length - 1] !== points[points.length - 1]) {
      res.push(points[points.length - 1]);
    }
    return res;
  }, [points]);

  if (sampled.length < 2) return null;

  const totalDist = points[points.length - 1].cumDistM;
  const elevations = sampled.map((p) => p.ele);
  const minEle = Math.min(...elevations);
  const maxEle = Math.max(...elevations);
  const eleRange = Math.max(10, maxEle - minEle);

  const width = 300;
  const paddingY = 4;

  const pointsSvg = sampled
    .map((p) => {
      const x = (p.cumDistM / totalDist) * width;
      const y = height - paddingY - ((p.ele - minEle) / eleRange) * (height - 2 * paddingY);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const runnerX = (Math.min(totalDist, currentDistM) / totalDist) * width;
  const runnerPoint = sampled.reduce((prev, curr) =>
    Math.abs(curr.cumDistM - currentDistM) < Math.abs(prev.cumDistM - currentDistM) ? curr : prev
  );
  const runnerY = height - paddingY - ((runnerPoint.ele - minEle) / eleRange) * (height - 2 * paddingY);

  const activeSpectatorDistances = useMemo(() => {
    if (spectatorDistMList && spectatorDistMList.length > 0) return spectatorDistMList;
    if (spectatorDistM !== undefined) return [spectatorDistM];
    return [];
  }, [spectatorDistMList, spectatorDistM]);

  const spectatorXs = activeSpectatorDistances.map(
    (dist) => (Math.min(totalDist, dist) / totalDist) * width
  );

  return (
    <Box style={{ width: '100%', position: 'relative' }}>
      <Group justify="space-between" mb={2}>
        <Text size="10px" c="dimmed">
          Course Elevation Profile
        </Text>
        <Text size="10px" c="dimmed">
          Min {Math.round(minEle)}m / Max {Math.round(maxEle)}m
        </Text>
      </Group>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: height, display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="eleGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Filled Area */}
        <polygon
          points={`0,${height} ${pointsSvg} ${width},${height}`}
          fill="url(#eleGrad)"
        />

        {/* Line */}
        <polyline
          points={pointsSvg}
          fill="none"
          stroke="#0284c7"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Runner Dot */}
        <circle cx={runnerX} cy={runnerY} r="4" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />

        {/* Spectator Cheer Spot Dots */}
        {spectatorXs.map((x, i) => (
          <circle
            key={i}
            cx={x}
            cy={height - paddingY - 10}
            r="3.5"
            fill="#f59e0b"
            stroke="#ffffff"
            strokeWidth="1.2"
          />
        ))}
      </svg>
    </Box>
  );
}
