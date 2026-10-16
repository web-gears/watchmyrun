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
  Slider,
  Button,
} from '@mantine/core';
import {
  IconChevronUp,
  IconChevronDown,
  IconShieldCheck,
  IconClock,
  IconPlayerPlay,
  IconPlayerPause,
  IconRotateClockwise2,
  IconRun,
} from '@tabler/icons-react';
import { CoursePoint, RunnerForecastResult } from '@/lib/forecasting/types';
import { ElevationChart } from './ElevationChart';

interface RunnerStatusHUDProps {
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

  const formatHms = (secs: number) => {
    const s = Math.max(0, Math.round(secs));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sc = s % 60;
    return `${h}h ${m.toString().padStart(2, '0')}m ${sc.toString().padStart(2, '0')}s`;
  };

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
            size="sm"
            onClick={() => setExpanded(!expanded)}
            aria-label="Toggle HUD details"
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
          {/* Visible Precision Badge */}
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

      {/* 3. Interactive Timeline Scrubber (When in Simulation Mode or Finished) */}
      <Box mt="xs" p="xs" style={{ background: 'var(--mantine-color-default-hover)', borderRadius: 8 }}>
        <Group justify="space-between" align="center" mb={4}>
          <Group gap={6}>
            <ActionIcon
              size="sm"
              variant="filled"
              color="cyan"
              radius="xl"
              onClick={onTogglePlaySimulation}
              title={isPlayingSimulation ? 'Pause' : 'Play Simulation'}
            >
              {isPlayingSimulation ? <IconPlayerPause size={14} /> : <IconPlayerPlay size={14} />}
            </ActionIcon>

            <Text size="xs" fw={600}>
              Elapsed: {formatHms(isSimulationMode ? simulationElapsedSeconds : forecast.elapsedSeconds)}
            </Text>
          </Group>

          <Group gap={4}>
            {!isSimulationMode ? (
              <Button size="compact-xs" variant="light" color="cyan" onClick={onToggleSimulationMode}>
                Scrub Timeline
              </Button>
            ) : (
              <Button size="compact-xs" variant="subtle" color="gray" onClick={onResetToLive}>
                Reset to Live
              </Button>
            )}
          </Group>
        </Group>

        {isSimulationMode && (
          <Slider
            size="sm"
            color="cyan"
            min={0}
            max={targetFinishSeconds}
            step={30}
            value={simulationElapsedSeconds}
            onChange={onSimulationElapsedChange}
            label={(val) => formatHms(val)}
            marks={[
              { value: 0, label: 'Start' },
              { value: targetFinishSeconds * 0.5, label: 'Half' },
              { value: targetFinishSeconds, label: 'Finish' },
            ]}
            mb="xs"
          />
        )}
      </Box>

      {/* 4. Collapsible Detailed Status */}
      <Collapse in={expanded}>
        <Stack gap="xs" mt="xs">
          {/* Core metrics row */}
          <Group justify="space-between" grow>
            <Box p={6} style={{ background: 'var(--mantine-color-default-hover)', borderRadius: 6 }}>
              <Group justify="space-between" align="baseline">
                <Text size="10px" c="dimmed" tt="uppercase" fw={700}>
                  Current Pace
                </Text>
                {forecast.calibratedPace?.isCalibrated && (
                  <Badge size="xs" color="emerald" variant="filled">
                    Live Pin
                  </Badge>
                )}
              </Group>
              <Text size="xs" fw={700} c={forecast.calibratedPace?.isCalibrated ? 'emerald.7' : undefined}>
                {forecast.instantPaceMinPerKm}
              </Text>
              <Text size="10px" c="dimmed">
                {forecast.instantPaceMinPerMi}
                {forecast.calibratedPace?.isCalibrated ? ' • Recalibrated' : ' • Target'}
              </Text>
            </Box>

            <Box p={6} style={{ background: 'var(--mantine-color-default-hover)', borderRadius: 6 }}>
              <Text size="10px" c="dimmed" tt="uppercase" fw={700}>
                Elevation
              </Text>
              <Text size="xs" fw={700}>
                {forecast.coord.ele} m
              </Text>
              <Text size="10px" c="dimmed">
                Grade: {forecast.coord.gradePct}%
              </Text>
            </Box>

            <Box p={6} style={{ background: 'var(--mantine-color-default-hover)', borderRadius: 6 }}>
              <Text size="10px" c="dimmed" tt="uppercase" fw={700}>
                Projected Finish
              </Text>
              <Text size="xs" fw={700} c="cyan">
                {forecast.projectedFinishTime}
              </Text>
              <Text size="10px" c="dimmed">
                Profile: {forecast.activePacingStrategy}
              </Text>
            </Box>
          </Group>

          {/* Precision reason narrative */}
          <Text size="11px" c="dimmed" style={{ fontStyle: 'italic' }}>
            ℹ️ {precision.reason}
          </Text>

          {/* Upcoming Timing Splits */}
          {forecast.upcomingSplits.length > 0 && (
            <div>
              <Text size="10px" fw={700} c="dimmed" tt="uppercase" mb={2}>
                Upcoming Timing Checkpoints
              </Text>
              <Group gap="xs" wrap="nowrap" style={{ overflowX: 'auto' }}>
                {forecast.upcomingSplits.map((s) => (
                  <Badge
                    key={s.name}
                    variant="outline"
                    color="gray"
                    size="sm"
                    radius="sm"
                    leftSection={<IconClock size={12} />}
                  >
                    {s.name}: {s.eta} ({Math.round(s.secondsAway / 60)}m)
                  </Badge>
                ))}
              </Group>
            </div>
          )}

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
