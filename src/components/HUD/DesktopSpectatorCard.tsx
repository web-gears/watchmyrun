'use client';

import {
  Card,
  Group,
  Text,
  Badge,
  CloseButton,
  Stack,
  ScrollArea,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconEye,
  IconFlag,
  IconCheck,
  IconTrash,
  IconClock,
} from '@tabler/icons-react';
import { SpectatorMeetingWindow } from '@/lib/forecasting/types';

interface DesktopSpectatorCardProps {
  windows: SpectatorMeetingWindow[];
  onClose: () => void;
  onRemoveSpot?: (spotId: string) => void;
}

export function DesktopSpectatorCard({
  windows,
  onClose,
  onRemoveSpot,
}: DesktopSpectatorCardProps) {
  // Find the next upcoming cheer station (closest spot where runner has not yet passed)
  const nextSpot = windows.find((w) => !w.hasRunnerPassed) || windows[windows.length - 1];

  return (
    <Card
      withBorder
      shadow="md"
      radius="md"
      p="xs"
      className="glass-panel"
      style={{
        border: '1px solid var(--mantine-color-default-border)',
        width: 360,
        maxWidth: 'calc(100vw - 32px)',
        backdropFilter: 'blur(16px)',
      }}
    >
      {/* Header */}
      <Group justify="space-between" align="center" wrap="nowrap" mb={6}>
        <Group gap="xs" wrap="nowrap">
          <IconEye size={18} color="#f59e0b" />
          <Text size="sm" fw={700}>
            Spectator Cheer Stations
          </Text>
          <Badge size="xs" color="amber" variant="filled">
            {windows.length} {windows.length === 1 ? 'spot' : 'spots'}
          </Badge>
        </Group>
        <CloseButton
          size="sm"
          onClick={onClose}
          aria-label="Close cheer stations"
          style={{ minWidth: 36, minHeight: 36 }}
        />
      </Group>

      {/* Highlight Next Upcoming Spot */}
      {windows.length > 1 && nextSpot && !nextSpot.hasRunnerPassed && (
        <Card
          p="xs"
          mb="xs"
          radius="sm"
          style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
          }}
        >
          <Group justify="space-between" align="center" wrap="nowrap">
            <div>
              <Group gap={4}>
                <Badge size="xs" color="amber" variant="filled">
                  Next Cheer Spot
                </Badge>
                <Text size="xs" fw={700} truncate style={{ maxWidth: 170 }}>
                  {nextSpot.spotName}
                </Text>
              </Group>
              <Text size="11px" c="dimmed" style={{ fontVariantNumeric: 'tabular-nums' }}>
                Window: <b>{nextSpot.windowEarly} - {nextSpot.windowLate}</b>
              </Text>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text size="xs" fw={700} c="amber" style={{ fontVariantNumeric: 'tabular-nums' }}>
                ~{Math.round(nextSpot.secondsAway / 60)} min
              </Text>
              <Text size="11px" c="dimmed" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {nextSpot.distanceFromRunnerKm} km away
              </Text>
            </div>
          </Group>
        </Card>
      )}

      {/* List of Monitored Stations */}
      <ScrollArea.Autosize mah={windows.length > 1 ? 240 : 180} type="auto" offsetScrollbars>
        <Stack gap={6}>
          {windows.map((w, idx) => (
            <Card
              key={w.spotId || idx}
              p="xs"
              radius="sm"
              withBorder
              style={{
                background: w.hasRunnerPassed ? 'rgba(100, 116, 139, 0.06)' : 'rgba(255, 255, 255, 0.04)',
                borderColor: w.hasRunnerPassed ? 'rgba(100, 116, 139, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                opacity: w.hasRunnerPassed ? 0.75 : 1,
              }}
            >
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Group gap={6} wrap="nowrap">
                    <IconFlag size={14} color={w.hasRunnerPassed ? '#64748b' : '#f59e0b'} />
                    <Text size="xs" fw={700} truncate title={w.spotName}>
                      {w.spotName}
                    </Text>
                  </Group>

                  <Group gap="xs" mt={2} wrap="nowrap">
                    <Text size="11px" c="dimmed" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      Mile {w.distMi} ({w.distKm} km)
                    </Text>
                    {w.hasRunnerPassed ? (
                      <Badge size="xs" color="gray" variant="light" leftSection={<IconCheck size={10} />}>
                        Runner Passed {w.passedAgoSec ? `(~${Math.round(w.passedAgoSec / 60)}m ago)` : ''}
                      </Badge>
                    ) : (
                      <Badge size="xs" color="amber" variant="light" leftSection={<IconClock size={10} />} style={{ fontVariantNumeric: 'tabular-nums' }}>
                        ETA {w.expectedEta}
                      </Badge>
                    )}
                  </Group>

                  {!w.hasRunnerPassed && (
                    <Text size="11px" c="dimmed" mt={2} style={{ fontVariantNumeric: 'tabular-nums' }}>
                      Window: <Text span fw={700} c="amber.7">{w.windowEarly} - {w.windowLate}</Text> (± uncertainty)
                    </Text>
                  )}
                </div>

                <Group gap={4} wrap="nowrap">
                  {!w.hasRunnerPassed && (
                    <div style={{ textAlign: 'right', marginRight: 4 }}>
                      <Text size="xs" fw={600} style={{ fontVariantNumeric: 'tabular-nums' }}>
                        ~{Math.round(w.secondsAway / 60)}m
                      </Text>
                      <Text size="11px" c="dimmed" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {w.distanceFromRunnerKm}km
                      </Text>
                    </div>
                  )}
                  {onRemoveSpot && (
                    <Tooltip label="Remove this cheer station">
                      <ActionIcon
                        size="md"
                        color="red"
                        variant="subtle"
                        onClick={() => onRemoveSpot(w.spotId)}
                        aria-label={`Remove cheer station ${w.spotName}`}
                        style={{ minWidth: 36, minHeight: 36 }}
                      >
                        <IconTrash size={15} />
                      </ActionIcon>
                    </Tooltip>
                  )}
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>
      </ScrollArea.Autosize>
    </Card>
  );
}
