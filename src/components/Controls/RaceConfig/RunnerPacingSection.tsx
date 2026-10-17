'use client';

import { useState } from 'react';
import {
  Accordion,
  Stack,
  Group,
  Box,
  Text,
  Badge,
  Select,
  TextInput,
  SegmentedControl,
  Divider,
  Card,
  Button,
  UnstyledButton,
  Collapse,
} from '@mantine/core';
import {
  IconRun,
  IconClock,
  IconTarget,
  IconAdjustments,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import { MarathonInfo } from '@/lib/data/marathonRegistry';
import { PacingStrategy } from '@/lib/forecasting/types';

export interface RunnerPacingSectionProps {
  marathonInfo: MarathonInfo;
  startTimeStr: string;
  onStartTimeChange: (time: string) => void;
  finishTimeStr: string;
  onFinishTimeChange: (time: string) => void;
  paceStr: string;
  onPaceChange: (pace: string) => void;
  pacingUnit: 'km' | 'mi';
  onPacingUnitChange: (unit: 'km' | 'mi') => void;
  strategy: PacingStrategy;
  onStrategyChange: (strategy: PacingStrategy) => void;
  calibratedPace?: {
    isCalibrated: boolean;
    paceMinPerKm: string;
    paceMinPerMi: string;
    summaryText: string;
    projectedFinishHms: string;
  };
  onApplyCalibratedPace?: () => void;
}

export function RunnerPacingSection({
  marathonInfo,
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
  calibratedPace,
  onApplyCalibratedPace,
}: RunnerPacingSectionProps) {
  const [showAdvancedPacing, setShowAdvancedPacing] = useState(false);

  const waveOptions = marathonInfo.waves.map((w) => ({
    value: w.timeStr.slice(0, 5),
    label: `${w.timeStr.slice(0, 5)} - ${w.name}${w.corrals ? ` (${w.corrals})` : ''}`,
  }));

  return (
    <Accordion.Item value="runner">
      <Accordion.Control icon={<IconRun size={20} color="var(--mantine-color-cyan-6)" />}>
        <Group justify="space-between" align="center" wrap="nowrap" style={{ flex: 1, paddingRight: 8 }}>
          <Box style={{ minWidth: 0 }}>
            <Text size="sm" fw={700} style={{ lineHeight: 1.2 }}>
              Runner &amp; Pacing
            </Text>
            <Text size="11px" c="dimmed" mt={1}>
              Wave start, chip time &amp; goal
            </Text>
          </Box>
          <Badge size="xs" variant="light" color="cyan" style={{ fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
            {paceStr || '--:--'} • {finishTimeStr || '--:--:--'}
          </Badge>
        </Group>
      </Accordion.Control>

      <Accordion.Panel>
        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Text size="xs" fw={700}>
              Start Time &amp; Waves
            </Text>
            <Badge size="xs" variant="light" color="blue">
              Wave Default
            </Badge>
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
            styles={{ input: { fontVariantNumeric: 'tabular-nums' } }}
          />

          <Divider my={4} />

          <Group justify="space-between" align="center">
            <Text size="xs" fw={700}>
              Goal Time &amp; Pace
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
              styles={{ input: { fontVariantNumeric: 'tabular-nums' } }}
            />
            <TextInput
              size="sm"
              radius="md"
              label="Goal Finish Time"
              leftSection={<IconTarget size={16} />}
              value={finishTimeStr}
              onChange={(e) => onFinishTimeChange(e.currentTarget.value)}
              placeholder={marathonInfo.defaultFinishTime}
              styles={{ input: { fontVariantNumeric: 'tabular-nums' } }}
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
                      ⚡ Live Calibrated Pace:
                    </Text>
                    <Badge size="xs" color="emerald" variant="filled" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {pacingUnit === 'km'
                        ? calibratedPace.paceMinPerKm
                        : calibratedPace.paceMinPerMi}
                    </Badge>
                  </Group>
                  <Text size="11px" c="dimmed" mt={2} style={{ fontVariantNumeric: 'tabular-nums' }}>
                    Projected Finish: <b>{calibratedPace.projectedFinishHms}</b>
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

          {/* Progressive Disclosure: Advanced Pacing Strategy */}
          <Card p="xs" radius="sm" withBorder style={{ background: 'var(--mantine-color-default-hover)' }}>
            <UnstyledButton
              onClick={() => setShowAdvancedPacing(!showAdvancedPacing)}
              style={{ width: '100%' }}
              aria-label="Toggle advanced pacing options"
            >
              <Group justify="space-between" align="center">
                <Group gap={6}>
                  <IconAdjustments size={15} color="var(--mantine-color-dimmed)" />
                  <Text size="xs" fw={600}>
                    Advanced Pacing Strategy
                  </Text>
                </Group>
                {showAdvancedPacing ? <IconChevronUp size={15} /> : <IconChevronDown size={15} />}
              </Group>
            </UnstyledButton>

            <Collapse in={showAdvancedPacing}>
              <Box pt="xs">
                <Select
                  size="xs"
                  radius="md"
                  label="Pacing Formula"
                  value={strategy}
                  onChange={(val) => val && onStrategyChange(val as PacingStrategy)}
                  data={[
                    { value: 'fatigue', label: 'Fatigue Model (+5-10% in final 10K)' },
                    { value: 'even', label: 'Even Pacing (Constant speed throughout)' },
                    { value: 'gap_elevation', label: 'Grade-Adjusted (Slows on uphills)' },
                  ]}
                />
                <Text size="11px" c="dimmed" mt={4}>
                  Elevation-compensated pacing adjusts arrival forecasts at hills and bridge inclines.
                </Text>
              </Box>
            </Collapse>
          </Card>
        </Stack>
      </Accordion.Panel>
    </Accordion.Item>
  );
}
