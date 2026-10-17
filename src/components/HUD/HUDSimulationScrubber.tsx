'use client';

import { Box, Group, ActionIcon, Text, Button, Slider } from '@mantine/core';
import { IconPlayerPlay, IconPlayerPause } from '@tabler/icons-react';

interface HUDSimulationScrubberProps {
  isSimulationMode: boolean;
  onToggleSimulationMode: () => void;
  simulationElapsedSeconds: number;
  onSimulationElapsedChange: (secs: number) => void;
  targetFinishSeconds: number;
  isPlayingSimulation: boolean;
  onTogglePlaySimulation: () => void;
  onResetToLive: () => void;
  elapsedSeconds: number;
}

export function HUDSimulationScrubber({
  isSimulationMode,
  onToggleSimulationMode,
  simulationElapsedSeconds,
  onSimulationElapsedChange,
  targetFinishSeconds,
  isPlayingSimulation,
  onTogglePlaySimulation,
  onResetToLive,
  elapsedSeconds,
}: HUDSimulationScrubberProps) {
  const formatHms = (secs: number) => {
    const s = Math.max(0, Math.round(secs));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sc = s % 60;
    return `${h}h ${m.toString().padStart(2, '0')}m ${sc.toString().padStart(2, '0')}s`;
  };

  return (
    <Box mt="xs" p="xs" style={{ background: 'var(--mantine-color-default-hover)', borderRadius: 8 }}>
      <Group justify="space-between" align="center" mb={4}>
        <Group gap={6}>
          <ActionIcon
            size="md"
            variant="filled"
            color="cyan"
            radius="xl"
            onClick={onTogglePlaySimulation}
            aria-label={isPlayingSimulation ? 'Pause simulation' : 'Play simulation'}
            title={isPlayingSimulation ? 'Pause' : 'Play Simulation'}
            style={{ minWidth: 36, minHeight: 36 }}
          >
            {isPlayingSimulation ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
          </ActionIcon>

          <Text size="xs" fw={700} style={{ fontVariantNumeric: 'tabular-nums' }}>
            Elapsed: {formatHms(isSimulationMode ? simulationElapsedSeconds : elapsedSeconds)}
          </Text>
        </Group>

        <Group gap={4}>
          {!isSimulationMode ? (
            <Button size="compact-xs" variant="light" color="cyan" onClick={onToggleSimulationMode} style={{ minHeight: 28 }}>
              Scrub Timeline
            </Button>
          ) : (
            <Button size="compact-xs" variant="subtle" color="gray" onClick={onResetToLive} style={{ minHeight: 28 }}>
              Reset to Live
            </Button>
          )}
        </Group>
      </Group>

      {isSimulationMode && (
        <Slider
          size="sm"
          color="cyan"
          min={0}
          max={targetFinishSeconds}
          step={30}
          value={simulationElapsedSeconds}
          onChange={onSimulationElapsedChange}
          label={(val) => formatHms(val)}
          marks={[
            { value: 0, label: 'Start' },
            { value: targetFinishSeconds * 0.5, label: 'Half' },
            { value: targetFinishSeconds, label: 'Finish' },
          ]}
          mb="xs"
        />
      )}
    </Box>
  );
}
