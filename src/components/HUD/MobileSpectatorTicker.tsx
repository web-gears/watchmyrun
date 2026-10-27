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
  Collapse,
  UnstyledButton,
} from '@mantine/core';
import {
  IconFlag,
  IconCheck,
  IconTrash,
  IconChevronDown,
  IconChevronUp,
  IconCopy,
} from '@tabler/icons-react';
import { useState } from 'react';
import { SpectatorMeetingWindow } from '@/lib/forecasting/types';

export interface MobileSpectatorTickerProps {
  windows: SpectatorMeetingWindow[];
  onClose: () => void;
  onRemoveSpot?: (spotId: string) => void;
  onCopyCheatSheet?: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function MobileSpectatorTicker({
  windows,
  onClose,
  onRemoveSpot,
  onCopyCheatSheet,
  isExpanded,
  onToggleExpand,
}: MobileSpectatorTickerProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const expanded = isExpanded !== undefined ? isExpanded : internalExpanded;

  const handleCopy = () => {
    if (!onCopyCheatSheet) return;
    onCopyCheatSheet();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const toggleExpanded = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  // Find the next upcoming cheer station (closest spot where runner has not yet passed)
  const nextSpot = windows.find((w) => !w.hasRunnerPassed) || windows[windows.length - 1];

  return (
    <Card
      withBorder
      shadow="lg"
      radius="md"
      p="xs"
      className="glass-panel"
      style={{
        width: '100%',
        border: '1px solid var(--mantine-color-default-border)',
        background: 'var(--mantine-color-body)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      }}
    >
      {/* Mobile Header / Quick Glance Bar */}
      <UnstyledButton
        onClick={toggleExpanded}
        style={{ width: '100%', display: 'block' }}
        aria-label={expanded ? 'Collapse cheer spots' : 'Expand cheer spots'}
      >
        <Group justify="space-between" align="center" wrap="nowrap">
          <Group gap="xs" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
            <Box
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706',
                flexShrink: 0,
              }}
            >
              <IconFlag size={16} stroke={2.2} />
            </Box>
            <div style={{ minWidth: 0, flex: 1 }}>
              <Group gap={6} wrap="nowrap">
                <Text size="11px" fw={700} c="amber.8">
                  Next Cheer Spot
                </Text>
                {windows.length > 1 && (
                  <Badge size="xs" variant="light" color="amber">
                    +{windows.length - 1} more
                  </Badge>
                )}
              </Group>
              <Text size="sm" fw={700} truncate title={nextSpot.spotName}>
                {nextSpot.spotName}
              </Text>
            </div>
          </Group>

          <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
            <div style={{ textAlign: 'right' }}>
              <Text size="sm" fw={800} c="amber.7" style={{ lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
                ~{Math.round(nextSpot.secondsAway / 60)} min
              </Text>
              <Text size="11px" c="dimmed" style={{ fontVariantNumeric: 'tabular-nums' }}>
                {nextSpot.windowEarly} - {nextSpot.windowLate}
              </Text>
            </div>
            <ActionIcon
              size="md"
              variant="subtle"
              color="gray"
              aria-label="Toggle cheer spot details"
              style={{ minWidth: 40, minHeight: 40 }}
            >
              {expanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
            </ActionIcon>
          </Group>
        </Group>
      </UnstyledButton>

      {/* Collapsible Mobile Station List */}
      <Collapse in={expanded}>
        <Box pt="xs" mt="xs" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
          <Group justify="space-between" align="center" mb={6}>
            <Text size="11px" fw={700} c="dimmed">
              All Monitored Stations ({windows.length}):
            </Text>
            <Group gap={4} wrap="nowrap">
              {onCopyCheatSheet && (
                <ActionIcon
                  size="sm"
                  variant={copied ? 'filled' : 'subtle'}
                  color={copied ? 'teal' : 'amber'}
                  onClick={handleCopy}
                  aria-label="Copy spectator cheat sheet"
                  title="Copy spectator cheat sheet"
                  style={{ minWidth: 36, minHeight: 36 }}
                >
                  {copied ? <IconCheck size={15} /> : <IconCopy size={15} />}
                </ActionIcon>
              )}
              <CloseButton
                size="sm"
                onClick={onClose}
                aria-label="Clear all cheer stations"
                title="Clear all cheer stations"
                style={{ minWidth: 36, minHeight: 36 }}
              />
            </Group>
          </Group>

          <ScrollArea.Autosize mah={220} type="auto" offsetScrollbars>
            <Stack gap={6}>
              {windows.map((w, idx) => (
                <Card
                  key={w.spotId || idx}
                  p="xs"
                  radius="sm"
                  withBorder
                  style={{
                    background: w.hasRunnerPassed
                      ? 'rgba(100, 116, 139, 0.06)'
                      : 'rgba(245, 158, 11, 0.05)',
                    borderColor: w.hasRunnerPassed
                      ? 'rgba(100, 116, 139, 0.2)'
                      : 'rgba(245, 158, 11, 0.25)',
                    opacity: w.hasRunnerPassed ? 0.75 : 1,
                  }}
                >
                  <Group justify="space-between" align="center" wrap="nowrap">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Group gap={6} wrap="nowrap">
                        <IconFlag
                          size={14}
                          color={w.hasRunnerPassed ? '#64748b' : '#f59e0b'}
                        />
                        <Text size="xs" fw={700} truncate title={w.spotName}>
                          {w.spotName}
                        </Text>
                      </Group>
                      <Group gap="xs" mt={2} wrap="nowrap">
                        <Text size="11px" c="dimmed" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          Mile {w.distMi} ({w.distKm} km)
                        </Text>
                        {w.hasRunnerPassed ? (
                          <Badge
                            size="xs"
                            color="gray"
                            variant="light"
                            leftSection={<IconCheck size={10} />}
                          >
                            Passed
                          </Badge>
                        ) : (
                          <Badge size="xs" color="amber" variant="light" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            ETA {w.expectedEta}
                          </Badge>
                        )}
                      </Group>
                    </div>

                    <Group gap="xs" wrap="nowrap">
                      {!w.hasRunnerPassed && (
                        <div style={{ textAlign: 'right' }}>
                          <Text size="xs" fw={700} c="amber.7" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            ~{Math.round(w.secondsAway / 60)}m
                          </Text>
                          <Text size="11px" c="dimmed" style={{ fontVariantNumeric: 'tabular-nums' }}>
                            {w.distanceFromRunnerKm}km
                          </Text>
                        </div>
                      )}
                      {onRemoveSpot && (
                        <ActionIcon
                          size="md"
                          color="red"
                          variant="subtle"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveSpot(w.spotId);
                          }}
                          aria-label={`Remove cheer station ${w.spotName}`}
                          style={{ minWidth: 36, minHeight: 36 }}
                        >
                          <IconTrash size={15} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Group>
                </Card>
              ))}
            </Stack>
          </ScrollArea.Autosize>
        </Box>
      </Collapse>
    </Card>
  );
}
