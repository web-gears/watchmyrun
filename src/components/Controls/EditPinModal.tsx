'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  Text,
  TextInput,
  NumberInput,
  Slider,
  Button,
  Group,
  Badge,
  ActionIcon,
  Tooltip,
  Tabs,
  Alert,
  Box,
  Divider,
} from '@mantine/core';
import {
  IconPencil,
  IconClock,
  IconMapPin,
  IconTrash,
  IconCheck,
  IconAlertCircle,
  IconArrowsExchange,
  IconInfoCircle,
} from '@tabler/icons-react';
import { CoursePoint, TrackingPin } from '@/lib/forecasting/types';
import { interpolateAtDistance } from '@/lib/forecasting/geodesy';
import { snapCoordinateToCourse } from '@/lib/forecasting/snapToCourse';
import { formatPace, formatSecondsToHms } from '@/lib/forecasting/pacingModels';

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
  const [activeTab, setActiveTab] = useState<string | null>('distance');

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

  // Handle distance adjustment (slider or number input)
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

  // Handle miles adjustment
  const handleMilesChange = (newMi: number) => {
    const km = newMi * 1.609344;
    handleDistanceChange(km);
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

  // Save changes
  // Live implied pace calculation
  let impliedPaceBadge: { paceKm: string; paceMi: string; finishHms: string; secPerKm: number } | null = null;
  if (distKm > 0 && timeStr && timeStr.includes(':')) {
    const [h, m] = timeStr.split(':').map((v) => parseInt(v, 10));
    const [stH, stM] = startTimeStr.split(':').map((v) => parseInt(v, 10));
    let elapsedMin = (h * 60 + (m || 0)) - (stH * 60 + (stM || 0));
    if (elapsedMin <= 0) elapsedMin += 24 * 60;
    const elapsedSec = elapsedMin * 60;

    if (elapsedSec > 60) {
      const speedMs = Math.max(1.5, Math.min(6.8, (distKm * 1000) / elapsedSec));
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

  const handleSave = () => {
    const [hh, mm] = timeStr.split(':').map((v) => parseInt(v, 10));
    const baseDate = new Date(pin.timestamp);
    const validBase = isNaN(baseDate.getTime()) ? new Date() : baseDate;

    validBase.setHours(hh || 0, mm || 0, 0, 0);

    const updatedPin: TrackingPin = {
      ...pin,
      lat: lat,
      lon: lon,
      timestamp: validBase.toISOString(),
      snappedDistM: distKm * 1000,
      snappedLat: lat,
      snappedLon: lon,
      snappedEle: ele,
      impliedPaceSecPerKm: impliedPaceBadge?.secPerKm,
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
          <Text size="xs" fw={600} mb={4}>
            Observation Time (Start Time: {startTimeStr})
          </Text>
          <Group gap="xs" align="flex-end">
            <TextInput
              style={{ flex: 1 }}
              leftSection={<IconClock size={16} />}
              value={timeStr}
              onChange={(e) => setTimeStr(e.currentTarget.value)}
              placeholder="HH:mm (e.g. 10:14)"
            />
            <Button
              size="xs"
              variant="light"
              color="gray"
              onClick={handleSetCurrentTime}
            >
              Now
            </Button>
          </Group>

          {/* Quick nudge buttons */}
          <Group gap={6} mt={6}>
            <Text size="xs" c="dimmed" mr={4}>
              Nudge:
            </Text>
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

          {impliedPaceBadge && (
            <Stack gap={4} mt="xs" p="xs" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid #10b981', borderRadius: 8 }}>
              <Group justify="space-between">
                <Text size="xs" fw={700} c="emerald.7">
                  ⚡ Recalculated Pace:
                </Text>
                <Badge color="emerald" variant="filled" size="sm">
                  {impliedPaceBadge.paceKm} ({impliedPaceBadge.paceMi})
                </Badge>
              </Group>
              <Text size="xs" c="dimmed">
                Projected Finish: <b>{impliedPaceBadge.finishHms}</b>
              </Text>
            </Stack>
          )}
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

          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List mb="xs">
              <Tabs.Tab value="distance" leftSection={<IconMapPin size={14} />}>
                Along Course
              </Tabs.Tab>
              <Tabs.Tab value="coords" leftSection={<IconArrowsExchange size={14} />}>
                Coordinates
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="distance">
              <Stack gap="xs">
                <Group grow>
                  <NumberInput
                    label="Distance (km)"
                    size="xs"
                    value={distKm}
                    onChange={(val) => handleDistanceChange(typeof val === 'number' ? val : 0)}
                    min={0}
                    max={maxCourseKm}
                    step={0.1}
                    decimalScale={2}
                  />
                  <NumberInput
                    label="Distance (miles)"
                    size="xs"
                    value={distMi}
                    onChange={(val) => handleMilesChange(typeof val === 'number' ? val : 0)}
                    min={0}
                    max={Number((maxCourseKm / 1.609344).toFixed(2))}
                    step={0.1}
                    decimalScale={2}
                  />
                </Group>

                <Box px={6} pt={4}>
                  <Slider
                    value={distKm}
                    onChange={handleDistanceChange}
                    min={0}
                    max={maxCourseKm}
                    step={0.05}
                    label={(val) => `${val.toFixed(2)} km (${(val / 1.609344).toFixed(1)} mi)`}
                    color="emerald"
                    marks={[
                      { value: 0, label: '0k' },
                      { value: maxCourseKm * 0.25, label: '25%' },
                      { value: maxCourseKm * 0.5, label: 'Half' },
                      { value: maxCourseKm * 0.75, label: '75%' },
                      { value: maxCourseKm, label: 'Finish' },
                    ]}
                  />
                </Box>

                <Group justify="space-between" mt={8}>
                  <Text size="xs" c="dimmed">
                    Elevation at point: <b>{ele}m</b>
                  </Text>
                  <Text size="xs" c="dimmed">
                    Coordinates: <b>{lat.toFixed(4)}, {lon.toFixed(4)}</b>
                  </Text>
                </Group>
              </Stack>
            </Tabs.Panel>

            <Tabs.Panel value="coords">
              <Stack gap="xs">
                <Group grow>
                  <NumberInput
                    label="Latitude"
                    size="xs"
                    value={lat}
                    onChange={(val) => setLat(typeof val === 'number' ? val : lat)}
                    decimalScale={6}
                    step={0.0001}
                  />
                  <NumberInput
                    label="Longitude"
                    size="xs"
                    value={lon}
                    onChange={(val) => setLon(typeof val === 'number' ? val : lon)}
                    decimalScale={6}
                    step={0.0001}
                  />
                </Group>
                <Button
                  size="xs"
                  variant="light"
                  color="blue"
                  leftSection={<IconMapPin size={14} />}
                  onClick={handleManualSnap}
                >
                  Snap Coordinates to Course
                </Button>
              </Stack>
            </Tabs.Panel>
          </Tabs>

          <Alert
            icon={<IconInfoCircle size={15} />}
            color="gray"
            variant="light"
            p="xs"
            mt="xs"
          >
            <Text size="xs">
              💡 <b>Tip:</b> You can also drag the pin directly on the interactive map to reposition it instantly!
            </Text>
          </Alert>
        </Box>

        <Divider />

        {/* 3. Note / Description */}
        <Box>
          <TextInput
            label="Note / Source"
            placeholder="e.g. AirTag ping, 1st Ave sighting"
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
