'use client';

import { Group, Box, Text, Badge } from '@mantine/core';
import { IconClock, IconInfoCircle } from '@tabler/icons-react';
import { RunnerForecastResult } from '@/lib/forecasting/types';

interface HUDMetricsGridProps {
  forecast: RunnerForecastResult;
}

export function HUDMetricsGrid({ forecast }: HUDMetricsGridProps) {
  return (
    <>
      {/* Core metrics row */}
      <Group justify="space-between" grow>
        <Box p={6} style={{ background: 'var(--mantine-color-default-hover)', borderRadius: 6 }}>
          <Group justify="space-between" align="baseline">
            <Text size="11px" c="dimmed" fw={700}>
              Current Pace
            </Text>
            {forecast.calibratedPace?.isCalibrated && (
              <Badge size="xs" color="emerald" variant="filled">
                Live Pin
              </Badge>
            )}
          </Group>
          <Text
            size="sm"
            fw={700}
            c={forecast.calibratedPace?.isCalibrated ? 'emerald.7' : undefined}
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {forecast.instantPaceMinPerKm}
          </Text>
          <Text size="11px" c="dimmed" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {forecast.instantPaceMinPerMi}
            {forecast.calibratedPace?.isCalibrated ? ' • Recalibrated' : ' • Target'}
          </Text>
        </Box>

        <Box p={6} style={{ background: 'var(--mantine-color-default-hover)', borderRadius: 6 }}>
          <Text size="11px" c="dimmed" fw={700}>
            Elevation
          </Text>
          <Text size="sm" fw={700} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {forecast.coord.ele} m
          </Text>
          <Text size="11px" c="dimmed" style={{ fontVariantNumeric: 'tabular-nums' }}>
            Grade: {forecast.coord.gradePct}%
          </Text>
        </Box>

        <Box p={6} style={{ background: 'var(--mantine-color-default-hover)', borderRadius: 6 }}>
          <Text size="11px" c="dimmed" fw={700}>
            Projected Finish
          </Text>
          <Text size="sm" fw={700} c="cyan" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {forecast.projectedFinishTime}
          </Text>
          <Text size="11px" c="dimmed">
            Profile: {forecast.activePacingStrategy}
          </Text>
        </Box>
      </Group>

      {/* Precision reason narrative */}
      <Group gap={4} wrap="nowrap" align="center">
        <IconInfoCircle size={13} style={{ flexShrink: 0, color: 'var(--mantine-color-dimmed)' }} />
        <Text size="11px" c="dimmed" style={{ fontStyle: 'italic' }}>
          {forecast.precision.reason}
        </Text>
      </Group>

      {/* Upcoming Timing Splits */}
      {forecast.upcomingSplits.length > 0 && (
        <div>
          <Text size="11px" fw={700} c="dimmed" mb={3}>
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
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {s.name}: {s.eta} ({Math.round(s.secondsAway / 60)}m)
              </Badge>
            ))}
          </Group>
        </div>
      )}
    </>
  );
}
