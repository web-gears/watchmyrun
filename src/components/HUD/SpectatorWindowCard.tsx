'use client';

import {
  Card,
  Group,
  Text,
  Badge,
  CloseButton,
  Stack,
  Box,
  ScrollArea,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { IconEye, IconFlag, IconCheck, IconTrash, IconClock } from '@tabler/icons-react';
import { SpectatorMeetingWindow } from '@/lib/forecasting/types';

interface SpectatorWindowCardProps {
  meetingWindow?: SpectatorMeetingWindow;
  meetingWindows?: SpectatorMeetingWindow[];
  onClose: () => void;
  onRemoveSpot?: (spotId: string) => void;
}

export function SpectatorWindowCard({
  meetingWindow,
  meetingWindows,
  onClose,
  onRemoveSpot,
}: SpectatorWindowCardProps) {
  // Normalize to an array of meeting windows
  const windows = meetingWindows && meetingWindows.length > 0
    ? meetingWindows
    : meetingWindow
    ? [meetingWindow]
    : [];

  if (windows.length === 0) return null;

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
        borderLeft: '4px solid #f59e0b',
        width: 370,
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
        <CloseButton size="xs" onClick={onClose} aria-label="Close cheer stations" />
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
                  NEXT CHEER SPOT
                </Badge>
                <Text size="xs" fw={700} truncate style={{ maxWidth: 170 }}>
                  {nextSpot.spotName}
                </Text>
              </Group>
              <Text size="11px" c="dimmed">
                Window: <b>{nextSpot.windowEarly} – {nextSpot.windowLate}</b>
              </Text>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text size="xs" fw={700} c="amber">
                ~{Math.round(nextSpot.secondsAway / 60)} min
              </Text>
              <Text size="10px" c="dimmed">
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
                    <Text size="11px" c="dimmed">
                      Mile {w.distMi} ({w.distKm} km)
                    </Text>
                    {w.hasRunnerPassed ? (
                      <Badge size="xs" color="gray" variant="light" leftSection={<IconCheck size={10} />}>
                        Runner Passed {w.passedAgoSec ? `(~${Math.round(w.passedAgoSec / 60)}m ago)` : ''}
                      </Badge>
                    ) : (
                      <Badge size="xs" color="amber" variant="light" leftSection={<IconClock size={10} />}>
                        ETA {w.expectedEta}
                      </Badge>
                    )}
                  </Group>

                  {!w.hasRunnerPassed && (
                    <Text size="10px" c="dimmed" mt={2}>
                      Window: <b style={{ color: '#d97706' }}>{w.windowEarly} – {w.windowLate}</b> (± uncertainty)
                    </Text>
                  )}
                </div>

                <Group gap={4} wrap="nowrap">
                  {!w.hasRunnerPassed && (
                    <div style={{ textAlign: 'right', marginRight: 4 }}>
                      <Text size="xs" fw={600}>
                        ~{Math.round(w.secondsAway / 60)}m
                      </Text>
                      <Text size="10px" c="dimmed">
                        {w.distanceFromRunnerKm}km
                      </Text>
                    </div>
                  )}
                  {onRemoveSpot && (
                    <Tooltip label="Remove this cheer station">
                      <ActionIcon
                        size="xs"
                        color="red"
                        variant="subtle"
                        onClick={() => onRemoveSpot(w.spotId)}
                        aria-label={`Remove cheer station ${w.spotName}`}
                      >
                        <IconTrash size={13} />
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
