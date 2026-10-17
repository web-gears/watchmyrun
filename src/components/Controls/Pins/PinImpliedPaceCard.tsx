'use client';

import { Stack, Group, Text, Badge } from '@mantine/core';
import { formatPace, formatSecondsToHms } from '@/lib/forecasting/pacingModels';

interface PinImpliedPaceCardProps {
  distM: number;
  timeStr: string;
  startTimeStr?: string;
  totalCourseDistM: number;
}

export function PinImpliedPaceCard({
  distM,
  timeStr,
  startTimeStr = '09:10',
  totalCourseDistM,
}: PinImpliedPaceCardProps) {
  if (!distM || distM <= 0 || !timeStr || !timeStr.includes(':')) {
    return null;
  }

  const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10));
  const [stH, stM] = startTimeStr.split(':').map((v) => parseInt(v, 10));
  if (isNaN(h) || isNaN(m)) {
    return null;
  }

  let elapsedMin = h * 60 + (m || 0) - (stH * 60 + (stM || 0));
  if (elapsedMin <= 0) elapsedMin += 24 * 60;
  const elapsedSec = elapsedMin * 60;

  if (elapsedSec <= 60) {
    return null;
  }

  const speedMs = Math.max(1.5, Math.min(6.8, distM / elapsedSec));
  const secPerKm = 1000 / speedMs;
  const formatted = formatPace(secPerKm);
  const totalSec = totalCourseDistM / speedMs;

  return (
    <Stack gap={4} p="xs" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid #10b981', borderRadius: 8 }}>
      <Group justify="space-between" align="center" wrap="nowrap">
        <Text size="xs" fw={700} c="emerald.7">
          ⚡ Recalculated Runner Pace:
        </Text>
        <Badge color="emerald" variant="filled" size="sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {formatted.minPerKm} ({formatted.minPerMi})
        </Badge>
      </Group>
      <Text size="xs" c="dimmed">
        Projected Finish Time: <b style={{ fontVariantNumeric: 'tabular-nums' }}>{formatSecondsToHms(totalSec)}</b>
      </Text>
    </Stack>
  );
}
