'use client';

import { useState } from 'react';
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
  Checkbox,
  TextInput,
  SegmentedControl,
} from '@mantine/core';
import { IconFlag, IconTrash, IconMapPin, IconPlus } from '@tabler/icons-react';
import { MarathonInfo } from '@/lib/data/marathonRegistry';
import {
  SpectatorSpot,
  CheerSpotPreset,
  SpectatorMeetingWindow,
} from '@/lib/forecasting/types';

export interface CheerStationsSectionProps {
  marathonInfo: MarathonInfo;
  spectatorSpots: SpectatorSpot[];
  cheerPresets: CheerSpotPreset[];
  meetingWindows?: SpectatorMeetingWindow[];
  onTogglePresetSpot: (preset: CheerSpotPreset) => void;
  onAddCustomSpot: (distM: number, name?: string) => void;
  onRemoveSpot: (spotId: string) => void;
  onClearAllSpots: () => void;
  isCheerDropActive: boolean;
  onToggleCheerDropMode: () => void;
}

export function CheerStationsSection({
  marathonInfo,
  spectatorSpots,
  cheerPresets,
  meetingWindows,
  onTogglePresetSpot,
  onAddCustomSpot,
  onRemoveSpot,
  onClearAllSpots,
  isCheerDropActive,
  onToggleCheerDropMode,
}: CheerStationsSectionProps) {
  const [customDistStr, setCustomDistStr] = useState('');
  const [customUnit, setCustomUnit] = useState<'mi' | 'km'>('mi');
  const [customName, setCustomName] = useState('');

  const handleAddCustomSpot = () => {
    const val = parseFloat(customDistStr);
    if (isNaN(val) || val <= 0) return;
    const distM = customUnit === 'mi' ? val * 1609.344 : val * 1000;
    onAddCustomSpot(distM, customName.trim() || undefined);
    setCustomDistStr('');
    setCustomName('');
  };

  return (
    <Accordion.Item value="cheer">
      <Accordion.Control icon={<IconFlag size={20} color="var(--mantine-color-amber-6)" />}>
        <Group justify="space-between" align="center" wrap="nowrap" style={{ flex: 1, paddingRight: 8 }}>
          <Box style={{ minWidth: 0 }}>
            <Text size="sm" fw={700} style={{ lineHeight: 1.2 }}>
              Cheer Stations
            </Text>
            <Text size="11px" c="dimmed" mt={1}>
              Meeting spots along course
            </Text>
          </Box>
          {spectatorSpots.length > 0 && (
            <Badge size="xs" color="amber" variant="filled" style={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
              {spectatorSpots.length} {spectatorSpots.length === 1 ? 'station' : 'stations'}
            </Badge>
          )}
        </Group>
      </Accordion.Control>

      <Accordion.Panel>
        <Stack gap="xs">
          {spectatorSpots.length > 0 && (
            <Group justify="space-between" align="center">
              <Text size="xs" fw={700}>
                Monitored Stations ({spectatorSpots.length})
              </Text>
              <Button
                variant="subtle"
                color="gray"
                size="compact-xs"
                onClick={onClearAllSpots}
              >
                Clear All
              </Button>
            </Group>
          )}

          {/* Selected Cheer Stations List */}
          {spectatorSpots.length > 0 && (
            <Stack gap={6}>
              {spectatorSpots.map((spot) => {
                const win = meetingWindows?.find((w) => w.spotId === spot.id);
                return (
                  <Card
                    key={spot.id}
                    p="xs"
                    radius="sm"
                    withBorder
                    style={{
                      background: 'rgba(245, 158, 11, 0.05)',
                      borderColor: 'rgba(245, 158, 11, 0.25)',
                    }}
                  >
                    <Group justify="space-between" align="center" wrap="nowrap">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Group gap={6} wrap="nowrap">
                          <Text size="xs" fw={700} c="amber.8" truncate>
                            {spot.name}
                          </Text>
                          {spot.isCustom && (
                            <Badge size="xs" variant="outline" color="amber">
                              Custom
                            </Badge>
                          )}
                        </Group>
                        <Group gap={6} mt={2}>
                          <Text size="11px" c="dimmed" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            Mile {spot.mile.toFixed(1)} ({(spot.distM / 1000).toFixed(1)} km)
                          </Text>
                          {win && (
                            win.hasRunnerPassed ? (
                              <Badge size="xs" color="gray" variant="light">
                                Passed
                              </Badge>
                            ) : (
                              <Badge size="xs" color="amber" variant="light" style={{ fontVariantNumeric: 'tabular-nums' }}>
                                ETA {win.expectedEta}
                              </Badge>
                            )
                          )}
                        </Group>
                      </div>

                      <ActionIcon
                        size="md"
                        color="red"
                        variant="subtle"
                        onClick={() => onRemoveSpot(spot.id)}
                        aria-label={`Remove cheer spot ${spot.name}`}
                        style={{ minWidth: 38, minHeight: 38 }}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Card>
                );
              })}
            </Stack>
          )}

          {/* Landmark Cheer Presets */}
          <div>
            <Text size="xs" fw={600} mb={6} c="dimmed">
              Landmarks for {marathonInfo.shortName}:
            </Text>
            <Stack gap={6}>
              {cheerPresets.map((preset) => {
                const isSelected = spectatorSpots.some((s) => s.id === preset.id);
                return (
                  <Card
                    key={preset.id}
                    p="xs"
                    radius="sm"
                    withBorder
                    style={{
                      cursor: 'pointer',
                      background: isSelected
                        ? 'rgba(245, 158, 11, 0.12)'
                        : 'var(--mantine-color-default-hover)',
                      borderColor: isSelected
                        ? 'var(--mantine-color-amber-6)'
                        : 'var(--mantine-color-default-border)',
                      transition: 'all 0.15s ease',
                    }}
                    onClick={() => onTogglePresetSpot(preset)}
                  >
                    <Group justify="space-between" align="center" wrap="nowrap">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Group gap={6} wrap="nowrap" align="center">
                          <Text size="xs" fw={700} c={isSelected ? 'amber.8' : undefined} truncate>
                            {preset.name}
                          </Text>
                          <Badge
                            size="xs"
                            variant={isSelected ? 'filled' : 'light'}
                            color="amber"
                            style={{ flexShrink: 0 }}
                          >
                            Mi {preset.mile}
                          </Badge>
                        </Group>
                        {preset.description && (
                          <Text size="11px" c="dimmed" mt={2} lineClamp={1}>
                            {preset.description}
                          </Text>
                        )}
                      </div>
                      <Checkbox
                        checked={isSelected}
                        readOnly
                        color="amber"
                        radius="xl"
                        size="sm"
                        style={{ pointerEvents: 'none', flexShrink: 0 }}
                        aria-label={`Select ${preset.name}`}
                      />
                    </Group>
                  </Card>
                );
              })}
            </Stack>
          </div>

          {/* Custom Cheer Spot Section */}
          <Card p="xs" radius="sm" withBorder style={{ background: 'var(--mantine-color-default-hover)' }}>
            <Text size="xs" fw={600} mb={6}>
              Add Custom Cheer Location
            </Text>
            <Stack gap={6}>
              <Group grow align="flex-end" gap="xs">
                <TextInput
                  size="xs"
                  radius="md"
                  placeholder={customUnit === 'mi' ? '14.5' : '23.0'}
                  label={`Distance (${customUnit})`}
                  value={customDistStr}
                  onChange={(e) => setCustomDistStr(e.currentTarget.value)}
                />
                <SegmentedControl
                  size="xs"
                  value={customUnit}
                  onChange={(v) => setCustomUnit(v as 'mi' | 'km')}
                  data={[
                    { label: 'Mile', value: 'mi' },
                    { label: 'KM', value: 'km' },
                  ]}
                />
              </Group>

              <Group gap="xs" align="flex-end" wrap="nowrap" style={{ width: '100%' }}>
                <TextInput
                  size="xs"
                  radius="md"
                  style={{ flex: 1, minWidth: 0 }}
                  placeholder="e.g. Near subway exit"
                  label="Station Label (Optional)"
                  value={customName}
                  onChange={(e) => setCustomName(e.currentTarget.value)}
                />
                <Button
                  size="xs"
                  color="amber"
                  variant="light"
                  radius="md"
                  style={{ flexShrink: 0 }}
                  leftSection={<IconPlus size={14} />}
                  onClick={handleAddCustomSpot}
                  disabled={!customDistStr || isNaN(parseFloat(customDistStr))}
                >
                  Add
                </Button>
              </Group>

              <Button
                size="xs"
                color={isCheerDropActive ? 'red' : 'amber'}
                variant={isCheerDropActive ? 'filled' : 'subtle'}
                radius="md"
                leftSection={<IconMapPin size={14} />}
                onClick={onToggleCheerDropMode}
                fullWidth
                mt={4}
              >
                {isCheerDropActive ? 'Cancel Map Cheer Drop' : 'Drop Cheer Spot on Map'}
              </Button>
            </Stack>
          </Card>
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
}
