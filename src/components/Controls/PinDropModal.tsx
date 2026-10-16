'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Stack,
  Text,
  TextInput,
  Button,
  Group,
  Badge,
  Alert,
} from '@mantine/core';
import { IconMapPin, IconClock, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { snapCoordinateToCourse } from '@/lib/forecasting/snapToCourse';
import { CoursePoint, TrackingPin } from '@/lib/forecasting/types';
import { formatPace, formatSecondsToHms } from '@/lib/forecasting/pacingModels';

interface PinDropModalProps {
  opened: boolean;
  onClose: () => void;
  clickedCoord: { lat: number; lon: number } | null;
  points: CoursePoint[];
  expectedDistM?: number;
  totalCourseDistM?: number;
  startTimeStr?: string;
  targetFinishSeconds?: number;
  onSavePin: (pin: TrackingPin) => void;
}

export function PinDropModal({
  opened,
  onClose,
  clickedCoord,
  points,
  expectedDistM,
  totalCourseDistM = 42195,
  startTimeStr = '09:10',
  targetFinishSeconds = 12600,
  onSavePin,
}: PinDropModalProps) {
  const [timeStr, setTimeStr] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // Memoize snap result so it doesn't recalculate new object references on every render
  const snapResult = useMemo(() => {
    if (!clickedCoord) return null;
    return snapCoordinateToCourse(
      clickedCoord.lat,
      clickedCoord.lon,
      points,
      expectedDistM
    );
  }, [clickedCoord?.lat, clickedCoord?.lon, points, expectedDistM]);

  // Set default observation time ONLY when the modal opens or when coordinates change
  useEffect(() => {
    if (opened && snapResult) {
      const fraction = snapResult.snappedDistM / Math.max(1, totalCourseDistM);
      const effectiveTargetSecs = targetFinishSeconds > 0 ? targetFinishSeconds : 12600;
      const expectedSecs = fraction * effectiveTargetSecs;
      const [startH, startM] = (startTimeStr || '09:10').split(':').map((v) => parseInt(v, 10));
      const arrivalDate = new Date();
      arrivalDate.setHours(startH || 9, startM || 10, 0, 0);
      arrivalDate.setTime(arrivalDate.getTime() + expectedSecs * 1000);

      const hh = arrivalDate.getHours().toString().padStart(2, '0');
      const mm = arrivalDate.getMinutes().toString().padStart(2, '0');
      setTimeStr(`${hh}:${mm}`);
      setNote('AirTag / Spectator sighting');
    }
  }, [opened, clickedCoord?.lat, clickedCoord?.lon]); // Stable dependencies: typing into timeStr will NOT overwrite it!

  if (!clickedCoord) return null;

  // Live implied pace calculation from start time to this observation time
  let impliedPaceBadge: { paceKm: string; paceMi: string; finishHms: string; secPerKm: number } | null = null;
  if (snapResult && timeStr && timeStr.includes(':')) {
    const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10));
    const [stH, stM] = (startTimeStr || '09:10').split(':').map((v) => parseInt(v, 10));
    if (!isNaN(h) && !isNaN(m)) {
      let elapsedMin = (h * 60 + m) - (stH * 60 + (stM || 0));
      if (elapsedMin <= 0) elapsedMin += 24 * 60;
      const elapsedSec = elapsedMin * 60;

      if (elapsedSec > 60 && snapResult.snappedDistM > 0) {
        const speedMs = Math.max(1.5, Math.min(6.8, snapResult.snappedDistM / elapsedSec));
        const secPerKm = 1000 / speedMs;
        const formatted = formatPace(secPerKm);
        const totalSec = totalCourseDistM / speedMs;
        impliedPaceBadge = {
          paceKm: formatted.minPerKm,
          paceMi: formatted.minPerMi,
          finishHms: formatSecondsToHms(totalSec),
          secPerKm,
        };
      }
    }
  }

  const applyOffsetMinutes = (deltaMin: number) => {
    if (!timeStr || !timeStr.includes(':')) return;
    const parts = timeStr.split(':').map((v) => parseInt(v, 10));
    const h = parts[0] || 0;
    const m = parts[1] || 0;
    let totalMin = h * 60 + m + deltaMin;
    if (totalMin < 0) totalMin += 24 * 60;
    totalMin = totalMin % (24 * 60);
    const newH = Math.floor(totalMin / 60).toString().padStart(2, '0');
    const newM = (totalMin % 60).toString().padStart(2, '0');
    setTimeStr(`${newH}:${newM}`);
  };

  const handleSetCurrentTime = () => {
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    setTimeStr(`${hh}:${mm}`);
  };

  const applyPaceMultiplier = (multiplier: number) => {
    if (!snapResult) return;
    const fraction = snapResult.snappedDistM / Math.max(1, totalCourseDistM);
    const effectiveTargetSecs = targetFinishSeconds > 0 ? targetFinishSeconds : 12600;
    const expectedSecs = Math.max(60, fraction * effectiveTargetSecs * multiplier);
    const [startH, startM] = (startTimeStr || '09:10').split(':').map((v) => parseInt(v, 10));
    const arrivalDate = new Date();
    arrivalDate.setHours(startH || 9, startM || 10, 0, 0);
    arrivalDate.setTime(arrivalDate.getTime() + expectedSecs * 1000);
    const hh = arrivalDate.getHours().toString().padStart(2, '0');
    const mm = arrivalDate.getMinutes().toString().padStart(2, '0');
    setTimeStr(`${hh}:${mm}`);
  };

  const handleSave = () => {
    if (!snapResult || !clickedCoord) return;

    // Build timestamp from today's date + timeStr
    const parts = timeStr.split(':').map((v) => parseInt(v, 10));
    const hh = parts[0] || 0;
    const mm = parts[1] || 0;
    const ss = parts[2] || 0;

    const pinDate = new Date();
    pinDate.setHours(hh, mm, ss, 0);

    const newPin: TrackingPin = {
      id: `pin_${Date.now()}`,
      lat: clickedCoord.lat,
      lon: clickedCoord.lon,
      timestamp: pinDate.toISOString(),
      snappedDistM: snapResult.snappedDistM,
      snappedLat: snapResult.snappedLat,
      snappedLon: snapResult.snappedLon,
      snappedEle: snapResult.snappedEle,
      impliedPaceSecPerKm: impliedPaceBadge?.secPerKm,
      note: note.trim() || undefined,
    };

    onSavePin(newPin);
    onClose();
  };

  const notePresets = ['AirTag Ping', 'Find My', 'Cheer Station', 'Runner Text', 'Mile Marker'];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconMapPin size={20} color="#10b981" />
          <Text fw={700}>Drop Tracking Pin</Text>
        </Group>
      }
      radius="md"
      centered
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Drop a pin from your <b>Apple AirTag</b>, <b>Find My</b>, or visual sighting to
          recalibrate the runner&apos;s live pace and prediction precision.
        </Text>

        {snapResult ? (
          <Stack gap="xs" p="xs" style={{ background: 'var(--mantine-color-default-hover)', borderRadius: 8 }}>
            <Group justify="space-between">
              <Text size="xs" fw={600} c="dimmed">
                Snapped to Course:
              </Text>
              <Badge color="emerald" variant="light" size="sm">
                {(snapResult.snappedDistM / 1000).toFixed(2)} km /{' '}
                {(snapResult.snappedDistM / 1609.344).toFixed(2)} mi
              </Badge>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                Elevation:
              </Text>
              <Text size="xs" fw={600}>
                {snapResult.snappedEle} m
              </Text>
            </Group>
            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                Distance from Course:
              </Text>
              <Text size="xs">
                {snapResult.orthogonalDistanceM} m
              </Text>
            </Group>

            {snapResult.ambiguityWarning && (
              <Alert icon={<IconAlertCircle size={16} />} color="yellow" variant="light" p="xs">
                <Text size="xs">{snapResult.ambiguityWarning}</Text>
              </Alert>
            )}
          </Stack>
        ) : (
          <Alert color="red" variant="light">
            Selected location is too far from the certified marathon course.
          </Alert>
        )}

        <Stack gap={4}>
          <Group justify="space-between" align="baseline">
            <Text size="xs" fw={600}>
              Observation Time (HH:mm)
            </Text>
            <Text size="11px" c="dimmed">
              Race start: {startTimeStr}
            </Text>
          </Group>

          <Group gap="xs" align="flex-end">
            <TextInput
              style={{ flex: 1 }}
              leftSection={<IconClock size={16} />}
              value={timeStr}
              onChange={(e) => setTimeStr(e.currentTarget.value)}
              placeholder="e.g. 10:24"
              required
            />
            <Button
              size="sm"
              variant="light"
              color="gray"
              onClick={handleSetCurrentTime}
            >
              Now
            </Button>
          </Group>

          <Group gap="xs" justify="space-between" mt={4} wrap="wrap">
            <Group gap={4}>
              <Button size="compact-xs" variant="light" color="cyan" onClick={() => applyPaceMultiplier(0.9)}>
                ⚡ Fast (-10%)
              </Button>
              <Button size="compact-xs" variant="light" color="gray" onClick={() => applyPaceMultiplier(1.0)}>
                🎯 Target
              </Button>
              <Button size="compact-xs" variant="light" color="orange" onClick={() => applyPaceMultiplier(1.1)}>
                🐢 Slow (+10%)
              </Button>
            </Group>
            <Group gap={4}>
              <Button size="compact-xs" variant="default" onClick={() => applyOffsetMinutes(-5)}>
                -5m
              </Button>
              <Button size="compact-xs" variant="default" onClick={() => applyOffsetMinutes(-1)}>
                -1m
              </Button>
              <Button size="compact-xs" variant="default" onClick={() => applyOffsetMinutes(1)}>
                +1m
              </Button>
              <Button size="compact-xs" variant="default" onClick={() => applyOffsetMinutes(5)}>
                +5m
              </Button>
            </Group>
          </Group>
        </Stack>

        {impliedPaceBadge && (
          <Stack gap={4} p="xs" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid #10b981', borderRadius: 8 }}>
            <Group justify="space-between">
              <Text size="xs" fw={700} c="emerald.7">
                ⚡ Recalculated Runner Pace:
              </Text>
              <Badge color="emerald" variant="filled" size="sm">
                {impliedPaceBadge.paceKm} ({impliedPaceBadge.paceMi})
              </Badge>
            </Group>
            <Text size="xs" c="dimmed">
              Projected Finish Time: <b>{impliedPaceBadge.finishHms}</b>
            </Text>
          </Stack>
        )}

        <Stack gap={4}>
          <TextInput
            label="Note (Optional)"
            placeholder="e.g. AirTag ping, mile 12 water station"
            value={note}
            onChange={(e) => setNote(e.currentTarget.value)}
          />
          <Group gap={4} mt={2} wrap="wrap">
            {notePresets.map((preset) => (
              <Badge
                key={preset}
                size="xs"
                variant={note === preset ? 'filled' : 'outline'}
                color={note === preset ? 'emerald' : 'gray'}
                style={{ cursor: 'pointer' }}
                onClick={() => setNote(preset)}
              >
                {preset}
              </Badge>
            ))}
          </Group>
        </Stack>

        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button
            color="emerald"
            leftSection={<IconCheck size={16} />}
            onClick={handleSave}
            disabled={!snapResult || !timeStr || !timeStr.includes(':')}
          >
            Save Tracking Pin
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
