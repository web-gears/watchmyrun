'use client';

import { useState } from 'react';
import {
  Stack,
  Text,
  Group,
  TextInput,
  SegmentedControl,
  Select,
  Button,
  Badge,
  Card,
  ActionIcon,
  Divider,
  Tooltip,
  Box,
  Checkbox,
  Anchor,
} from '@mantine/core';
import {
  IconClock,
  IconRun,
  IconMapPin,
  IconTrash,
  IconTarget,
  IconPencil,
  IconPlus,
  IconCheck,
  IconTrophy,
  IconCoffee,
  IconCloud,
} from '@tabler/icons-react';
import {
  RaceDistanceId,
  RaceDistanceOption,
  RACE_DISTANCE_OPTIONS,
} from '@/lib/data/newYorkCourses';
import {
  MarathonId,
  PacingStrategy,
  TrackingPin,
  SpectatorSpot,
  CheerSpotPreset,
  SpectatorMeetingWindow,
} from '@/lib/forecasting/types';
import { MarathonInfo } from '@/lib/data/marathonRegistry';
import { formatPace } from '@/lib/forecasting/pacingModels';

interface RaceConfigDrawerProps {
  selectedMarathon: MarathonId;
  marathonInfo: MarathonInfo;
  onSelectMarathon: (id: MarathonId) => void;
  onOpenRaceModal: () => void;
  selectedDistance: RaceDistanceId;
  onSelectDistance: (distance: RaceDistanceId) => void;
  distanceOption: RaceDistanceOption;
  startTimeStr: string; // HH:mm
  onStartTimeChange: (time: string) => void;
  finishTimeStr: string; // HH:mm:ss
  onFinishTimeChange: (time: string) => void;
  paceStr: string; // mm:ss
  onPaceChange: (pace: string) => void;
  pacingUnit: 'km' | 'mi';
  onPacingUnitChange: (unit: 'km' | 'mi') => void;
  strategy: PacingStrategy;
  onStrategyChange: (strategy: PacingStrategy) => void;
  pins: TrackingPin[];
  calibratedPace?: {
    isCalibrated: boolean;
    paceMinPerKm: string;
    paceMinPerMi: string;
    summaryText: string;
    projectedFinishHms: string;
  };
  onApplyCalibratedPace?: () => void;
  onEditPin?: (pin: TrackingPin) => void;
  onRemovePin: (id: string) => void;
  onClearAllPins: () => void;
  isPinDropActive: boolean;
  onTogglePinDropMode: () => void;
  spectatorSpots: SpectatorSpot[];
  cheerPresets: CheerSpotPreset[];
  onTogglePresetSpot: (preset: CheerSpotPreset) => void;
  onAddCustomSpot: (distM: number, name?: string) => void;
  onRemoveSpot: (spotId: string) => void;
  onClearAllSpots: () => void;
  isCheerDropActive: boolean;
  onToggleCheerDropMode: () => void;
  meetingWindows?: SpectatorMeetingWindow[];
  onSetSpectatorMile?: (mile: number) => void;
  spectatorMile?: number;
  onClearSpectatorSpot?: () => void;
}

export function RaceConfigDrawer({
  selectedMarathon,
  marathonInfo,
  onSelectMarathon,
  onOpenRaceModal,
  selectedDistance,
  onSelectDistance,
  distanceOption,
  startTimeStr,
  onStartTimeChange,
  finishTimeStr,
  onFinishTimeChange,
  paceStr,
  onPaceChange,
  pacingUnit,
  onPacingUnitChange,
  strategy,
  onStrategyChange,
  pins,
  calibratedPace,
  onApplyCalibratedPace,
  onEditPin,
  onRemovePin,
  onClearAllPins,
  isPinDropActive,
  onTogglePinDropMode,
  spectatorSpots,
  cheerPresets,
  onTogglePresetSpot,
  onAddCustomSpot,
  onRemoveSpot,
  onClearAllSpots,
  isCheerDropActive,
  onToggleCheerDropMode,
  meetingWindows,
}: RaceConfigDrawerProps) {
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

  // Dynamically formatted wave options based on selected marathon's real wave corrals
  const waveOptions = marathonInfo.waves.map((w) => ({
    value: w.timeStr.slice(0, 5),
    label: `${w.timeStr.slice(0, 5)} - ${w.name}${w.corrals ? ` (${w.corrals})` : ''}`,
  }));

  return (
    <Stack gap="md" p="sm" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* 1. World Marathon Major Selection */}
      <div>
        <Card
          withBorder
          p="xs"
          radius="md"
          style={{
            background: 'var(--mantine-color-default-hover)',
            border: '1px solid var(--mantine-color-default-border)',
            overflow: 'hidden',
          }}
        >
          {/* Active Race Header */}
          <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
            <Group gap="xs" wrap="nowrap" align="center" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <Text size="26px" style={{ lineHeight: 1, flexShrink: 0 }}>
                {marathonInfo.flag}
              </Text>
              <Box style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <Text fw={700} size="sm" style={{ lineHeight: 1.2 }} truncate>
                  {marathonInfo.name}
                </Text>
                <Text size="11px" c="dimmed" mt={2} truncate>
                  {marathonInfo.city} • {marathonInfo.annualDate}
                </Text>
              </Box>
            </Group>

            <Button
              size="xs"
              variant="subtle"
              color="cyan"
              radius="md"
              style={{ flexShrink: 0 }}
              leftSection={<IconTrophy size={14} />}
              onClick={onOpenRaceModal}
            >
              Change
            </Button>
          </Group>

          {/* If New York is selected, display sub-distance options */}
          {selectedMarathon === 'new_york' && (
            <Box mt="xs">
              <Divider my={6} />
              <Group justify="space-between" align="center" mb={4}>
                <Text size="11px" fw={600} c="dimmed">
                  Event Course Distance:
                </Text>
                <Badge size="xs" variant="light" color="cyan">
                  {distanceOption.distanceKm} km ({distanceOption.distanceMi} mi)
                </Badge>
              </Group>
              <SegmentedControl
                size="xs"
                value={selectedDistance}
                onChange={(val) => onSelectDistance(val as RaceDistanceId)}
                data={RACE_DISTANCE_OPTIONS.map((opt) => ({
                  value: opt.id,
                  label: opt.id === 'marathon' ? '42.2K' : opt.id === 'half' ? '21.1K' : opt.id.toUpperCase(),
                }))}
                fullWidth
                color="cyan"
              />
            </Box>
          )}
        </Card>
      </div>

      <Divider />

      {/* 2. Start Time & Wave Selection */}
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Text size="sm" fw={600}>
            Race Start Time
          </Text>
          <Group gap="xs" align="center">
            <Anchor
              href="https://run-weather.com/"
              target="_blank"
              rel="noopener noreferrer"
              size="xs"
              c="cyan"
              title="Check outside running conditions & weather scores at Run-Weather.com"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'none', fontWeight: 500 }}
            >
              <IconCloud size={14} stroke={1.8} />
              Race Weather
            </Anchor>
            <Badge size="xs" variant="light" color="blue">
              Wave Default
            </Badge>
          </Group>
        </Group>

        <Select
          size="sm"
          radius="md"
          label="Wave / Corral Preset"
          data={waveOptions}
          value={startTimeStr}
          onChange={(val) => val && onStartTimeChange(val)}
        />

        <TextInput
          size="sm"
          radius="md"
          label="Exact Chip Start Time"
          leftSection={<IconClock size={16} />}
          value={startTimeStr}
          onChange={(e) => onStartTimeChange(e.currentTarget.value)}
          placeholder={marathonInfo.defaultStartTime}
        />
      </Stack>

      <Divider />

      {/* 3. Anticipated Pacing */}
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <Text size="sm" fw={600}>
            Pacing & Goal Time
          </Text>
          <SegmentedControl
            size="xs"
            value={pacingUnit}
            onChange={(val) => onPacingUnitChange(val as 'km' | 'mi')}
            data={[
              { label: 'min/km', value: 'km' },
              { label: 'min/mi', value: 'mi' },
            ]}
          />
        </Group>

        <Group grow gap="xs">
          <TextInput
            size="sm"
            radius="md"
            label="Target Pace"
            leftSection={<IconRun size={16} />}
            value={paceStr}
            onChange={(e) => onPaceChange(e.currentTarget.value)}
            placeholder="05:00"
          />
          <TextInput
            size="sm"
            radius="md"
            label="Goal Finish Time"
            leftSection={<IconTarget size={16} />}
            value={finishTimeStr}
            onChange={(e) => onFinishTimeChange(e.currentTarget.value)}
            placeholder={marathonInfo.defaultFinishTime}
          />
        </Group>

        {calibratedPace?.isCalibrated && (
          <Card
            p="xs"
            radius="sm"
            withBorder
            style={{
              background: 'rgba(16, 185, 129, 0.08)',
              borderColor: '#10b981',
            }}
          >
            <Group justify="space-between" align="center" wrap="nowrap">
              <div>
                <Group gap={6}>
                  <Text size="xs" fw={700} c="emerald.8">
                    ⚡ Live Recalibrated Pace:
                  </Text>
                  <Badge size="xs" color="emerald" variant="filled">
                    {pacingUnit === 'km'
                      ? calibratedPace.paceMinPerKm
                      : calibratedPace.paceMinPerMi}
                  </Badge>
                </Group>
                <Text size="11px" c="dimmed" mt={2}>
                  Projected Finish: <b>{calibratedPace.projectedFinishHms}</b> • {calibratedPace.summaryText}
                </Text>
              </div>

              {onApplyCalibratedPace && (
                <Button
                  size="xs"
                  color="emerald"
                  variant="filled"
                  onClick={onApplyCalibratedPace}
                >
                  Apply
                </Button>
              )}
            </Group>
          </Card>
        )}

        <Select
          size="sm"
          radius="md"
          label="Pacing Strategy"
          value={strategy}
          onChange={(val) => val && onStrategyChange(val as PacingStrategy)}
          data={[
            { value: 'fatigue', label: 'Fatigue Model (+5-10% positive split in final 10K)' },
            { value: 'even', label: 'Even Pacing (Constant pace throughout)' },
            { value: 'gap_elevation', label: 'Grade-Adjusted (Pace slows on uphills)' },
          ]}
        />
      </Stack>

      <Divider />

      {/* 4. Tracking Pins (AirTag / Sighting Calibration) */}
      <Stack gap="xs">
        <Group justify="space-between">
          <div>
            <Text size="sm" fw={600}>
              Tracking Pins (AirTag / Sighting)
            </Text>
            <Text size="xs" c="dimmed">
              No phone needed: track with AirTag pings or visual sightings
            </Text>
          </div>
          <Badge size="sm" color={pins.length > 0 ? 'emerald' : 'gray'}>
            {pins.length} active
          </Badge>
        </Group>

        <Button
          color={isPinDropActive ? 'red' : 'emerald'}
          variant={isPinDropActive ? 'filled' : 'light'}
          size="sm"
          radius="md"
          leftSection={<IconMapPin size={16} />}
          onClick={onTogglePinDropMode}
          fullWidth
        >
          {isPinDropActive ? 'Cancel Pin Drop Mode' : 'Drop Tracking Pin on Map'}
        </Button>

        {pins.length > 0 && (
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
                >
                  <Group justify="space-between" wrap="nowrap">
                    <div
                      style={{ flex: 1 }}
                      onClick={() => onEditPin?.(pin)}
                    >
                      <Group gap={6}>
                        <Text size="xs" fw={700} c="emerald.7">
                          Pin #{idx + 1}
                        </Text>
                        <Text size="xs" fw={600}>
                          • {new Date(pin.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                        {pinPace && (
                          <Badge size="xs" variant="light" color="emerald">
                            {pacingUnit === 'km' ? pinPace.minPerKm : pinPace.minPerMi}
                          </Badge>
                        )}
                      </Group>
                      <Text size="xs" c="dimmed">
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
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditPin(pin);
                            }}
                          >
                            <IconPencil size={15} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                      <Tooltip label="Delete pin">
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemovePin(pin.id);
                          }}
                        >
                          <IconTrash size={15} />
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
        )}
      </Stack>

      <Divider />

      {/* 5. Spectator Cheer Stations (Multi-Spot & Custom Monitoring) */}
      <Stack gap="xs">
        <Group justify="space-between" align="center">
          <div>
            <Text size="sm" fw={600}>
              Spectator Cheer Stations
            </Text>
            <Text size="xs" c="dimmed">
              Choose cheer spots along the course for {marathonInfo.shortName}
            </Text>
          </div>
          <Badge size="sm" color={spectatorSpots.length > 0 ? 'amber' : 'gray'}>
            {spectatorSpots.length} selected
          </Badge>
        </Group>

        {/* Race-Tailored Pre-Defined Spots */}
        <div>
          <Group justify="space-between" align="center" mb={6}>
            <Text size="xs" fw={600} c="dimmed">
              Official Landmark Stations ({marathonInfo.shortName}):
            </Text>
            <Text size="11px" c="dimmed">
              Tap cards to select
            </Text>
          </Group>

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
                  <Group justify="space-between" align="flex-start" wrap="nowrap">
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
                        <Text size="11px" c="dimmed" mt={2} lineClamp={2}>
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
                      style={{ pointerEvents: 'none', flexShrink: 0, marginTop: 4 }}
                      aria-label={`Select ${preset.name}`}
                    />
                  </Group>
                </Card>
              );
            })}
          </Stack>
        </div>

        {/* Selected Cheer Stations List (Appears above Add Custom form) */}
        {spectatorSpots.length > 0 && (
          <Stack gap="xs" mt={4}>
            <Group justify="space-between" align="center">
              <Text size="xs" fw={600} c="amber.8">
                Your Cheer Stations ({spectatorSpots.length}):
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
            {spectatorSpots.map((spot) => {
              const win = meetingWindows?.find((w) => w.spotId === spot.id);
              return (
                <Card
                  key={spot.id}
                  p="xs"
                  radius="sm"
                  withBorder
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
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
                        <Text size="11px" c="dimmed">
                          Mile {spot.mile.toFixed(1)} ({(spot.distM / 1000).toFixed(1)} km)
                        </Text>
                        {win && (
                          win.hasRunnerPassed ? (
                            <Badge size="xs" color="gray" variant="light">
                              Passed
                            </Badge>
                          ) : (
                            <Badge size="xs" color="amber" variant="light">
                              ETA {win.expectedEta}
                            </Badge>
                          )
                        )}
                      </Group>
                    </div>

                    <Tooltip label="Delete cheer spot">
                      <ActionIcon
                        size="sm"
                        color="red"
                        variant="subtle"
                        onClick={() => onRemoveSpot(spot.id)}
                        aria-label={`Remove cheer spot ${spot.name}`}
                      >
                        <IconTrash size={14} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Card>
              );
            })}
          </Stack>
        )}

        {/* Custom Cheer Spot Creator */}
        <Card p="xs" radius="sm" withBorder style={{ background: 'rgba(245, 158, 11, 0.04)' }}>
          <Text size="xs" fw={600} mb={6} c="amber.8">
            Add Custom Cheer Station
          </Text>
          <Stack gap={6}>
            <Group grow align="flex-end" gap="xs">
              <TextInput
                size="xs"
                radius="md"
                placeholder={customUnit === 'mi' ? 'e.g. 14.5' : 'e.g. 23.0'}
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
                placeholder="e.g. Near church"
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
                Add Spot
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

      {/* Footer attribution & support */}
      <Box pt="xs" pb="xs">
        <Divider mb="xs" />
        <Group justify="center" gap="xs" wrap="nowrap">
          <Tooltip label="Check outside running conditions & weather scores at Run-Weather.com" position="top" withArrow>
            <Anchor
              href="https://run-weather.com/"
              target="_blank"
              rel="noopener noreferrer"
              size="11px"
              c="dimmed"
              title="Check outside running conditions & weather scores at Run-Weather.com"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}
            >
              <IconCloud size={13} stroke={1.8} />
              Run-Weather.com
            </Anchor>
          </Tooltip>
          <Text size="11px" c="dimmed">
            •
          </Text>
          <Tooltip
            label="Support the project: Help keep WatchMy.Run 100% free & cover map hosting costs on Ko-fi"
            position="top"
            withArrow
            multiline
            w={230}
          >
            <Anchor
              href="https://ko-fi.com/lavenderaf"
              target="_blank"
              rel="noopener noreferrer"
              size="11px"
              c="pink"
              title="Support the project: Help keep WatchMy.Run 100% free & cover map hosting costs on Ko-fi"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
            >
              <IconCoffee size={13} stroke={2} />
              Support on Ko-fi
            </Anchor>
          </Tooltip>
        </Group>
        <Text size="10px" c="dimmed" ta="center" mt={6} style={{ opacity: 0.8 }}>
          © {new Date().getFullYear()} WatchMy.Run • Developed by Volodymyr Hartsev
        </Text>
      </Box>
    </Stack>
  );
}
