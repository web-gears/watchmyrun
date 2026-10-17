'use client';

import { useState } from 'react';
import {
  Card,
  Group,
  Text,
  Badge,
  Progress,
  Stack,
  Tooltip,
  ActionIcon,
  Collapse,
  Box,
  Divider,
} from '@mantine/core';
import {
  IconChevronUp,
  IconChevronDown,
  IconShieldCheck,
  IconRun,
} from '@tabler/icons-react';
import { CoursePoint, RunnerForecastResult } from '@/lib/forecasting/types';
import { ElevationChart } from './ElevationChart';
import { HUDSimulationScrubber } from './HUDSimulationScrubber';
import { HUDMetricsGrid } from './HUDMetricsGrid';

export interface RunnerStatusHUDProps {
  marathonName: string;
  forecast: RunnerForecastResult;
  points: CoursePoint[];
  spectatorDistM?: number;
  spectatorDistMList?: number[];
  isSimulationMode: boolean;
  onToggleSimulationMode: () => void;
  simulationElapsedSeconds: number;
  onSimulationElapsedChange: (secs: number) => void;
  targetFinishSeconds: number;
  isPlayingSimulation: boolean;
  onTogglePlaySimulation: () => void;
  onResetToLive: () => void;
}

export function RunnerStatusHUD({
  marathonName,
  forecast,
  points,
  spectatorDistM,
  spectatorDistMList,
  isSimulationMode,
  onToggleSimulationMode,
  simulationElapsedSeconds,
  onSimulationElapsedChange,
  targetFinishSeconds,
  isPlayingSimulation,
  onTogglePlaySimulation,
  onResetToLive,
}: RunnerStatusHUDProps) {
  const [expanded, setExpanded] = useState<boolean>(true);

  const precision = forecast.precision;
  const badgeColor =
    precision.confidenceLevel === 'HIGH'
      ? 'emerald'
      : precision.confidenceLevel === 'MEDIUM'
      ? 'yellow'
      : 'orange';

  return (
    <Card
      withBorder
      shadow="xl"
      radius="lg"
      p="sm"
      className="glass-panel"
      style={{
        border: '1px solid var(--mantine-color-default-border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        maxWidth: 580,
        width: '100%',
      }}
    >
      {/* 1. Clear Title Header Row */}
      <Group justify="space-between" align="center" wrap="nowrap" mb={6}>
        <Group gap="xs" wrap="nowrap">
          <Box
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <IconRun size={16} stroke={2.2} />
          </Box>
          <div>
            <Text fw={700} size="sm" style={{ lineHeight: 1.1 }}>
              Runner Live Forecast
            </Text>
            <Text size="11px" c="dimmed" style={{ lineHeight: 1.1 }}>
              {marathonName}
            </Text>
          </div>
        </Group>

        <Group gap="xs" wrap="nowrap">
          <Badge
            size="sm"
            variant={isSimulationMode ? 'filled' : 'light'}
            color={isSimulationMode ? 'violet' : 'cyan'}
            style={{ cursor: 'pointer' }}
            onClick={onToggleSimulationMode}
            title="Click to toggle live clock vs interactive timeline scrubber"
          >
            {isSimulationMode ? 'Timeline Mode' : 'Live Clock'}
          </Badge>

          <ActionIcon
            variant="subtle"
            size="md"
            onClick={() => setExpanded(!expanded)}
            aria-label="Toggle HUD details"
            style={{ minWidth: 40, minHeight: 40 }}
          >
            {expanded ? <IconChevronDown size={18} /> : <IconChevronUp size={18} />}
          </ActionIcon>
        </Group>
      </Group>

      {/* 2. Key Status & Metrics Row */}
      <Group justify="space-between" align="center" wrap="nowrap">
        <Group gap="xs" wrap="nowrap">
          <Badge
            size="md"
            variant="filled"
            color={
              forecast.status === 'FINISHED'
                ? 'teal'
                : forecast.status === 'NOT_STARTED'
                ? 'gray'
                : 'cyan'
            }
            radius="sm"
          >
            {forecast.status === 'FINISHED'
              ? 'Finished Course'
              : forecast.status === 'NOT_STARTED'
              ? 'At Start Line'
              : `Mile ${forecast.currentDistMi}`}
          </Badge>

          <Text size="sm" fw={700}>
            {forecast.currentDistKm} km
          </Text>

          <Text size="xs" c="dimmed">
            ({forecast.progressPct}%)
          </Text>
        </Group>

        <Group gap="xs" wrap="nowrap">
          <Tooltip label={precision.reason} position="top" withArrow multiline w={220}>
            <Badge
              size="md"
              variant="light"
              color={badgeColor}
              leftSection={<IconShieldCheck size={14} />}
              style={{ cursor: 'pointer' }}
            >
              ±{precision.uncertaintyDistM}m
            </Badge>
          </Tooltip>
        </Group>
      </Group>

      {/* Progress Bar */}
      <Progress
        value={forecast.progressPct}
        size="xs"
        color="cyan"
        radius="xl"
        mt="xs"
        striped={forecast.status === 'ON_COURSE'}
        animated={forecast.status === 'ON_COURSE'}
      />

      {/* 3. Interactive Timeline Scrubber */}
      <HUDSimulationScrubber
        isSimulationMode={isSimulationMode}
        onToggleSimulationMode={onToggleSimulationMode}
        simulationElapsedSeconds={simulationElapsedSeconds}
        onSimulationElapsedChange={onSimulationElapsedChange}
        targetFinishSeconds={targetFinishSeconds}
        isPlayingSimulation={isPlayingSimulation}
        onTogglePlaySimulation={onTogglePlaySimulation}
        onResetToLive={onResetToLive}
        elapsedSeconds={forecast.elapsedSeconds}
      />

      {/* 4. Collapsible Detailed Status */}
      <Collapse in={expanded}>
        <Stack gap="xs" mt="xs">
          <HUDMetricsGrid forecast={forecast} />

          <Divider my={2} />

          {/* Elevation Profile Sparkline */}
          <ElevationChart
            points={points}
            currentDistM={forecast.currentDistM}
            spectatorDistM={spectatorDistM}
            spectatorDistMList={spectatorDistMList}
            height={44}
          />
        </Stack>
      </Collapse>
    </Card>
  );
}
