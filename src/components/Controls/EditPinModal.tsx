'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  Text,
  TextInput,
  Button,
  Group,
  Badge,
  ActionIcon,
  Tooltip,
  Box,
  Divider,
} from '@mantine/core';
import {
  IconPencil,
  IconClock,
  IconTrash,
  IconCheck,
} from '@tabler/icons-react';
import { CoursePoint, TrackingPin } from '@/lib/forecasting/types';
import { interpolateAtDistance } from '@/lib/forecasting/geodesy';
import { snapCoordinateToCourse } from '@/lib/forecasting/snapToCourse';
import { PinPositionTabs } from './Pins/PinPositionTabs';
import { PinImpliedPaceCard } from './Pins/PinImpliedPaceCard';

interface EditPinModalProps {
  opened: boolean;
  onClose: () => void;
  pin: TrackingPin | null;
  pinIndex?: number;
  points: CoursePoint[];
  totalCourseDistM: number;
  startTimeStr?: string;
  onSavePin: (updatedPin: TrackingPin) => void;
  onDeletePin: (pinId: string) => void;
}

export function EditPinModal({
  opened,
  onClose,
  pin,
  pinIndex = 0,
  points,
  totalCourseDistM,
  startTimeStr = '09:10',
  onSavePin,
  onDeletePin,
}: EditPinModalProps) {
  const [timeStr, setTimeStr] = useState<string>('10:00');
  const [distKm, setDistKm] = useState<number>(0);
  const [lat, setLat] = useState<number>(0);
  const [lon, setLon] = useState<number>(0);
  const [ele, setEle] = useState<number>(0);
  const [note, setNote] = useState<string>('');

  const maxCourseKm = Number((totalCourseDistM / 1000).toFixed(2));
  const distMi = Number((distKm / 1.609344).toFixed(2));

  // Initialize form state when the active pin changes
  useEffect(() => {
    if (pin && opened) {
      const pinDate = new Date(pin.timestamp);
      if (!isNaN(pinDate.getTime())) {
        const hh = pinDate.getHours().toString().padStart(2, '0');
        const mm = pinDate.getMinutes().toString().padStart(2, '0');
        setTimeStr(`${hh}:${mm}`);
      } else {
        setTimeStr('10:00');
      }

      const initialDistKm = Number((pin.snappedDistM / 1000).toFixed(2));
      setDistKm(initialDistKm);
      setLat(pin.snappedLat || pin.lat);
      setLon(pin.snappedLon || pin.lon);
      setEle(Math.round(pin.snappedEle || 0));
      setNote(pin.note || '');
    }
  }, [pin, opened]);

  if (!pin) return null;

  // Handle distance adjustment
  const handleDistanceChange = (newKm: number) => {
    const clampedKm = Math.max(0, Math.min(newKm, maxCourseKm));
    setDistKm(Number(clampedKm.toFixed(2)));

    // Recompute lat, lon, and elevation along course
    const distM = clampedKm * 1000;
    const interpolated = interpolateAtDistance(points, distM);
    setLat(Number(interpolated.lat.toFixed(6)));
    setLon(Number(interpolated.lon.toFixed(6)));
    setEle(Math.round(interpolated.ele));
  };

  // Adjust time by +/- minutes
  const handleAdjustMinutes = (deltaMin: number) => {
    const parts = timeStr.split(':').map((v) => parseInt(v, 10));
    let hh = parts[0] || 0;
    let mm = parts[1] || 0;

    let totalMin = hh * 60 + mm + deltaMin;
    if (totalMin < 0) totalMin += 24 * 60;
    totalMin = totalMin % (24 * 60);

    const newHh = Math.floor(totalMin / 60).toString().padStart(2, '0');
    const newMm = (totalMin % 60).toString().padStart(2, '0');
    setTimeStr(`${newHh}:${newMm}`);
  };

  const handleSetCurrentTime = () => {
    const now = new Date();
    const hh = now.getHours().toString().padStart(2, '0');
    const mm = now.getMinutes().toString().padStart(2, '0');
    setTimeStr(`${hh}:${mm}`);
  };

  // Snap manual lat/lon back to course
  const handleManualSnap = () => {
    const snap = snapCoordinateToCourse(lat, lon, points);
    if (snap) {
      setDistKm(Number((snap.snappedDistM / 1000).toFixed(2)));
      setLat(Number(snap.snappedLat.toFixed(6)));
      setLon(Number(snap.snappedLon.toFixed(6)));
      setEle(Math.round(snap.snappedEle));
    }
  };

  const handleSave = () => {
    const [hh, mm] = timeStr.split(':').map((v) => parseInt(v, 10));
    const baseDate = new Date(pin.timestamp);
    const validBase = isNaN(baseDate.getTime()) ? new Date() : baseDate;

    validBase.setHours(hh || 0, mm || 0, 0, 0);

    const [stH, stM] = startTimeStr.split(':').map((v) => parseInt(v, 10));
    let elapsedMin = (hh || 0) * 60 + (mm || 0) - (stH * 60 + (stM || 0));
    if (elapsedMin <= 0) elapsedMin += 24 * 60;
    const elapsedSec = elapsedMin * 60;
    let impliedPaceSecPerKm: number | undefined;
    if (elapsedSec > 60 && distKm > 0) {
      const speedMs = Math.max(1.5, Math.min(6.8, (distKm * 1000) / elapsedSec));
      impliedPaceSecPerKm = 1000 / speedMs;
    }

    const updatedPin: TrackingPin = {
      ...pin,
      lat: lat,
      lon: lon,
      timestamp: validBase.toISOString(),
      snappedDistM: distKm * 1000,
      snappedLat: lat,
      snappedLon: lon,
      snappedEle: ele,
      impliedPaceSecPerKm,
      note: note.trim() || undefined,
    };

    onSavePin(updatedPin);
    onClose();
  };

  const handleDelete = () => {
    onDeletePin(pin.id);
    onClose();
  };

  const notePresets = ['AirTag Ping', 'Find My', 'Cheer Station', 'Runner Text', 'Mile Marker'];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconPencil size={20} color="#10b981" />
          <div>
            <Text fw={700}>Edit Pin #{pinIndex + 1}</Text>
            <Text size="xs" c="dimmed">
              Adjust observation time, course position, or notes
            </Text>
          </div>
        </Group>
      }
      radius="md"
      centered
      size="md"
    >
      <Stack gap="md">
        {/* 1. Observation Time */}
        <Box>
          <Group justify="space-between" mb={4}>
            <Text size="xs" fw={600}>
              Observation Time
            </Text>
            <Text size="11px" c="dimmed">
              Start: {startTimeStr}
            </Text>
          </Group>

          <Group gap="xs" align="flex-end">
            <TextInput
              style={{ flex: 1 }}
              leftSection={<IconClock size={16} />}
              value={timeStr}
              onChange={(e) => setTimeStr(e.currentTarget.value)}
              placeholder="HH:mm"
              size="sm"
              styles={{ input: { fontVariantNumeric: 'tabular-nums' } }}
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

          <Group gap={4} mt={6} justify="space-between">
            <Group gap={4}>
              <Button size="compact-xs" variant="default" onClick={() => handleAdjustMinutes(-5)}>
                -5m
              </Button>
              <Button size="compact-xs" variant="default" onClick={() => handleAdjustMinutes(-1)}>
                -1m
              </Button>
              <Button size="compact-xs" variant="default" onClick={() => handleAdjustMinutes(1)}>
                +1m
              </Button>
              <Button size="compact-xs" variant="default" onClick={() => handleAdjustMinutes(5)}>
                +5m
              </Button>
            </Group>
            <Text size="11px" c="dimmed">
              Quick adjust
            </Text>
          </Group>

          {/* Implied Pace Preview Card */}
          <Box mt="xs">
            <PinImpliedPaceCard
              distM={distKm * 1000}
              timeStr={timeStr}
              startTimeStr={startTimeStr}
              totalCourseDistM={totalCourseDistM}
            />
          </Box>
        </Box>

        <Divider />

        {/* 2. Position Adjustment */}
        <Box>
          <Group justify="space-between" mb={6}>
            <Text size="xs" fw={600}>
              Position on Course
            </Text>
            <Badge color="emerald" variant="light" size="sm">
              {distKm.toFixed(2)} km / {distMi.toFixed(2)} mi
            </Badge>
          </Group>

          <PinPositionTabs
            distKm={distKm}
            maxCourseKm={maxCourseKm}
            onDistanceChange={handleDistanceChange}
            lat={lat}
            lon={lon}
            ele={ele}
            onLatChange={(newLat) => {
              setLat(newLat);
              const snap = snapCoordinateToCourse(newLat, lon, points);
              if (snap) {
                setDistKm(Number((snap.snappedDistM / 1000).toFixed(2)));
                setEle(Math.round(snap.snappedEle));
              }
            }}
            onLonChange={(newLon) => {
              setLon(newLon);
              const snap = snapCoordinateToCourse(lat, newLon, points);
              if (snap) {
                setDistKm(Number((snap.snappedDistM / 1000).toFixed(2)));
                setEle(Math.round(snap.snappedEle));
              }
            }}
            onManualSnap={handleManualSnap}
          />
        </Box>

        <Divider />

        {/* 3. Note / Description */}
        <Box>
          <TextInput
            label="Note / Source"
            placeholder="e.g. AirTag ping, 1st Ave checkpoint"
            value={note}
            onChange={(e) => setNote(e.currentTarget.value)}
            size="xs"
          />
          <Group gap={4} mt={6} wrap="wrap">
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
        </Box>

        {/* 4. Action Buttons */}
        <Group justify="space-between" mt="sm">
          <Button
            color="red"
            variant="subtle"
            size="xs"
            leftSection={<IconTrash size={15} />}
            onClick={handleDelete}
          >
            Delete Pin
          </Button>

          <Group gap="xs">
            <Button variant="default" size="xs" onClick={onClose}>
              Cancel
            </Button>
            <Button
              color="emerald"
              size="xs"
              leftSection={<IconCheck size={15} />}
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
