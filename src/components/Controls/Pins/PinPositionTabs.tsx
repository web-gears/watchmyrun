'use client';

import {
  Tabs,
  Stack,
  Group,
  NumberInput,
  Box,
  Slider,
  Text,
  Button,
  Alert,
} from '@mantine/core';
import { IconMapPin, IconInfoCircle } from '@tabler/icons-react';

interface PinPositionTabsProps {
  distKm: number;
  maxCourseKm: number;
  onDistanceChange: (km: number) => void;
  lat: number;
  lon: number;
  ele: number;
  onLatChange: (lat: number) => void;
  onLonChange: (lon: number) => void;
  onManualSnap: () => void;
}

export function PinPositionTabs({
  distKm,
  maxCourseKm,
  onDistanceChange,
  lat,
  lon,
  ele,
  onLatChange,
  onLonChange,
  onManualSnap,
}: PinPositionTabsProps) {
  const distMi = Number((distKm / 1.609344).toFixed(2));

  return (
    <Box>
      <Tabs defaultValue="distance" color="emerald">
        <Tabs.List grow mb="xs">
          <Tabs.Tab value="distance">
            Along Course Distance
          </Tabs.Tab>
          <Tabs.Tab value="coords">
            Coordinates (Lat/Lon)
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="distance">
          <Stack gap="xs">
            <Group grow>
              <NumberInput
                label="Distance (km)"
                size="xs"
                value={distKm}
                onChange={(val) => onDistanceChange(typeof val === 'number' ? val : distKm)}
                min={0}
                max={maxCourseKm}
                step={0.1}
                decimalScale={2}
              />
              <NumberInput
                label="Distance (miles)"
                size="xs"
                value={distMi}
                onChange={(val) => {
                  if (typeof val === 'number') {
                    onDistanceChange(val * 1.609344);
                  }
                }}
                min={0}
                max={Number((maxCourseKm / 1.609344).toFixed(2))}
                step={0.1}
                decimalScale={2}
              />
            </Group>

            <Box px={6} pt={4}>
              <Slider
                value={distKm}
                onChange={onDistanceChange}
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
                onChange={(val) => onLatChange(typeof val === 'number' ? val : lat)}
                decimalScale={6}
                step={0.0001}
              />
              <NumberInput
                label="Longitude"
                size="xs"
                value={lon}
                onChange={(val) => onLonChange(typeof val === 'number' ? val : lon)}
                decimalScale={6}
                step={0.0001}
              />
            </Group>
            <Button
              size="xs"
              variant="light"
              color="blue"
              leftSection={<IconMapPin size={14} />}
              onClick={onManualSnap}
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
  );
}
