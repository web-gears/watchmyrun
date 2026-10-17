'use client';

import {
  Accordion,
  Stack,
  Group,
  Box,
  Text,
  Badge,
  Button,
  Card,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { IconMapPin, IconPencil, IconTrash } from '@tabler/icons-react';
import { TrackingPin } from '@/lib/forecasting/types';
import { formatPace } from '@/lib/forecasting/pacingModels';

export interface TrackingPinsSectionProps {
  pins: TrackingPin[];
  pacingUnit: 'km' | 'mi';
  isPinDropActive: boolean;
  onTogglePinDropMode: () => void;
  onEditPin?: (pin: TrackingPin) => void;
  onRemovePin: (id: string) => void;
  onClearAllPins: () => void;
}

export function TrackingPinsSection({
  pins,
  pacingUnit,
  isPinDropActive,
  onTogglePinDropMode,
  onEditPin,
  onRemovePin,
  onClearAllPins,
}: TrackingPinsSectionProps) {
  return (
    <Accordion.Item value="pins">
      <Accordion.Control icon={<IconMapPin size={20} color="var(--mantine-color-emerald-6)" />}>
        <Group justify="space-between" align="center" wrap="nowrap" style={{ flex: 1, paddingRight: 8 }}>
          <Box style={{ minWidth: 0 }}>
            <Text size="sm" fw={700} style={{ lineHeight: 1.2 }}>
              Tracking Pins
            </Text>
            <Text size="11px" c="dimmed" mt={1}>
              AirTag &amp; course checkpoints
            </Text>
          </Box>
          {pins.length > 0 && (
            <Badge size="xs" color="emerald" variant="filled" style={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
              {pins.length} active
            </Badge>
          )}
        </Group>
      </Accordion.Control>

      <Accordion.Panel>
        <Stack gap="xs">
          <Text size="11px" c="dimmed">
            Calibrates live pace from AirTag updates or course checkpoints.
          </Text>

          <Button
            color={isPinDropActive ? 'red' : 'emerald'}
            variant={isPinDropActive ? 'filled' : 'light'}
            size="sm"
            radius="md"
            leftSection={<IconMapPin size={16} />}
            onClick={onTogglePinDropMode}
            fullWidth
            style={{ minHeight: 38 }}
          >
            {isPinDropActive ? 'Cancel Pin Drop Mode' : 'Drop Tracking Pin on Map'}
          </Button>

          {pins.length > 0 ? (
            <Stack gap="xs" mt="xs">
              {pins.map((pin, idx) => {
                const pinPace = pin.impliedPaceSecPerKm ? formatPace(pin.impliedPaceSecPerKm) : null;
                return (
                  <Card
                    key={pin.id}
                    p="xs"
                    radius="sm"
                    withBorder
                    style={{
                      cursor: onEditPin ? 'pointer' : 'default',
                      transition: 'background 0.15s ease',
                    }}
                    onClick={() => onEditPin?.(pin)}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Group gap={6}>
                          <Text size="xs" fw={700} c="emerald.7">
                            Pin #{idx + 1}
                          </Text>
                          <Text size="xs" fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
                            • {new Date(pin.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                          {pinPace && (
                            <Badge size="xs" variant="light" color="emerald" style={{ fontVariantNumeric: 'tabular-nums' }}>
                              {pacingUnit === 'km' ? pinPace.minPerKm : pinPace.minPerMi}
                            </Badge>
                          )}
                        </Group>
                        <Text size="11px" c="dimmed" mt={2} truncate style={{ fontVariantNumeric: 'tabular-nums' }}>
                          Mile {(pin.snappedDistM / 1609.344).toFixed(1)} ({(pin.snappedDistM / 1000).toFixed(1)} km)
                          {pin.note ? ` • ${pin.note}` : ''}
                        </Text>
                      </div>
                      <Group gap={4}>
                        {onEditPin && (
                          <Tooltip label="Edit pin time or position">
                            <ActionIcon
                              color="blue"
                              variant="subtle"
                              size="md"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditPin(pin);
                              }}
                              aria-label="Edit pin"
                              style={{ minWidth: 38, minHeight: 38 }}
                            >
                              <IconPencil size={16} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                        <Tooltip label="Delete pin">
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            size="md"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemovePin(pin.id);
                            }}
                            aria-label="Delete pin"
                            style={{ minWidth: 38, minHeight: 38 }}
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Group>
                  </Card>
                );
              })}

              <Button
                variant="subtle"
                color="gray"
                size="xs"
                onClick={onClearAllPins}
              >
                Clear All Tracking Pins
              </Button>
            </Stack>
          ) : (
            <Card p="sm" radius="sm" withBorder style={{ textAlign: 'center', background: 'var(--mantine-color-default-hover)' }}>
              <Text size="xs" fw={600} c="dimmed">
                No tracking pins recorded yet
              </Text>
              <Text size="11px" c="dimmed" mt={2}>
                Whenever an AirTag updates or you see your runner, tap &quot;Drop Tracking Pin on Map&quot; to recalibrate their live arrival window.
              </Text>
            </Card>
          )}
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
}
