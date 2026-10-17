'use client';

import { useState } from 'react';
import {
  Card,
  Group,
  Text,
  Badge,
  Button,
  Box,
  Collapse,
  ActionIcon,
  UnstyledButton,
} from '@mantine/core';
import {
  IconRun,
  IconTrophy,
  IconMapPin,
  IconPlayerPlay,
  IconChevronDown,
  IconChevronUp,
} from '@tabler/icons-react';
import { MarathonInfo } from '@/lib/data/marathonRegistry';
import { MarathonId } from '@/lib/forecasting/types';
import { RaceDistanceId, RaceDistanceOption } from '@/lib/data/newYorkCourses';

export interface AwaitingRunnerCardProps {
  marathonInfo: MarathonInfo;
  selectedMarathon: MarathonId;
  selectedDistance: RaceDistanceId;
  distanceOption: RaceDistanceOption;
  onOpenRaceModal: () => void;
  onFinishTimeChange: (time: string) => void;
  onOpenPinModal: () => void;
  onStartDemo: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function AwaitingRunnerCard({
  marathonInfo,
  selectedMarathon,
  selectedDistance,
  distanceOption,
  onOpenRaceModal,
  onFinishTimeChange,
  onOpenPinModal,
  onStartDemo,
  isExpanded,
  onToggleExpand,
}: AwaitingRunnerCardProps) {
  // Foldable state: can be collapsed into a compact glanceable pill or expanded for full setup
  const [internalExpanded, setInternalExpanded] = useState<boolean>(true);
  const expanded = isExpanded !== undefined ? isExpanded : internalExpanded;
  const toggleExpanded = () => {
    if (onToggleExpand) {
      onToggleExpand();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  return (
    <Card
      withBorder
      shadow="xl"
      radius="lg"
      p="sm"
      className="glass-panel"
      style={{
        border: '1px solid var(--mantine-color-default-border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        maxHeight: 'calc(100dvh - 90px)',
        overflowY: 'auto',
      }}
    >
      {/* 1. Header Row / Glance Bar with Fold Toggle */}
      <Group justify="space-between" align="center" wrap="nowrap" mb={expanded ? 8 : 0}>
        <UnstyledButton
          onClick={toggleExpanded}
          style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
          aria-label={expanded ? 'Fold runner setup card' : 'Expand runner setup card'}
        >
          <Group gap="xs" wrap="nowrap">
            <Box
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                flexShrink: 0,
              }}
            >
              <IconRun size={18} stroke={2.2} />
            </Box>
            <div style={{ minWidth: 0, flex: 1 }}>
              <Text fw={700} size="sm" truncate style={{ lineHeight: 1.1 }}>
                {marathonInfo.name}
              </Text>
              <Text size="11px" c="dimmed" truncate style={{ lineHeight: 1.1 }}>
                {marathonInfo.city} • {selectedMarathon === 'new_york' ? distanceOption.label : 'Course Loaded'}
              </Text>
            </div>
          </Group>
        </UnstyledButton>

        <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
          <Badge
            size="sm"
            variant="light"
            color="cyan"
            visibleFrom="xs"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            Awaiting Data
          </Badge>

          <Button
            size="xs"
            variant="subtle"
            color="cyan"
            visibleFrom="sm"
            leftSection={<IconTrophy size={13} />}
            onClick={onOpenRaceModal}
          >
            Change Race
          </Button>

          <ActionIcon
            variant="subtle"
            color="gray"
            size="md"
            onClick={toggleExpanded}
            aria-label={expanded ? 'Fold setup details' : 'Expand setup details'}
            style={{ minWidth: 40, minHeight: 40 }}
          >
            {expanded ? <IconChevronDown size={18} /> : <IconChevronUp size={18} />}
          </ActionIcon>
        </Group>
      </Group>

      {/* 2. Foldable Content */}
      <Collapse in={expanded}>
        {/* Phone-Free Explainer Callout */}
        <Box
          p="xs"
          mb="xs"
          style={{
            background: 'rgba(2, 132, 199, 0.06)',
            borderRadius: 8,
            border: '1px solid rgba(2, 132, 199, 0.18)',
          }}
        >
          <Text size="xs" fw={700} c="cyan.8">
            Phone-free tracking with AirTag or tracking pins
          </Text>
          <Text size="11px" c="dimmed" mt={2} style={{ lineHeight: 1.35 }}>
            Track your runner using AirTag updates or course checkpoints. Drop tracking pins to update live pace and cheer station arrival windows.
          </Text>
        </Box>

        <Text size="xs" c="dimmed" mb="xs">
          Select a goal time below or set custom pace in the controls panel:
        </Text>

        <Group gap="xs" wrap="wrap">
          {selectedDistance === 'marathon' && (
            <>
              <Button size="xs" variant="light" color="cyan" onClick={() => onFinishTimeChange('03:15:00')}>
                3h 15m
              </Button>
              <Button size="xs" variant="light" color="cyan" onClick={() => onFinishTimeChange('03:30:00')}>
                3h 30m
              </Button>
              <Button size="xs" variant="light" color="cyan" onClick={() => onFinishTimeChange('03:45:00')}>
                3h 45m
              </Button>
              <Button size="xs" variant="light" color="cyan" onClick={() => onFinishTimeChange('04:00:00')}>
                4h 00m
              </Button>
            </>
          )}

          {selectedMarathon === 'new_york' && selectedDistance === 'half' && (
            <>
              <Button size="xs" variant="light" color="cyan" onClick={() => onFinishTimeChange('01:30:00')}>
                1h 30m Goal
              </Button>
              <Button size="xs" variant="light" color="cyan" onClick={() => onFinishTimeChange('01:45:00')}>
                1h 45m Goal
              </Button>
              <Button size="xs" variant="light" color="cyan" onClick={() => onFinishTimeChange('02:00:00')}>
                2h 00m Goal
              </Button>
            </>
          )}

          {selectedMarathon === 'new_york' && selectedDistance === '10k' && (
            <>
              <Button size="xs" variant="light" color="cyan" onClick={() => onFinishTimeChange('00:45:00')}>
                45m Goal
              </Button>
              <Button size="xs" variant="light" color="cyan" onClick={() => onFinishTimeChange('00:50:00')}>
                50m Goal
              </Button>
              <Button size="xs" variant="light" color="cyan" onClick={() => onFinishTimeChange('00:55:00')}>
                55m Goal
              </Button>
            </>
          )}

          {selectedMarathon === 'new_york' && selectedDistance === '5k' && (
            <>
              <Button size="xs" variant="light" color="cyan" onClick={() => onFinishTimeChange('00:22:00')}>
                22m Goal
              </Button>
              <Button size="xs" variant="light" color="cyan" onClick={() => onFinishTimeChange('00:25:00')}>
                25m Goal
              </Button>
              <Button size="xs" variant="light" color="cyan" onClick={() => onFinishTimeChange('00:30:00')}>
                30m Goal
              </Button>
            </>
          )}

          <Button
            size="xs"
            variant="default"
            leftSection={<IconMapPin size={14} />}
            onClick={onOpenPinModal}
          >
            Drop Tracking Pin
          </Button>

          <Button
            size="xs"
            variant="subtle"
            color="violet"
            leftSection={<IconPlayerPlay size={14} />}
            onClick={onStartDemo}
          >
            Preview Simulation
          </Button>
        </Group>
      </Collapse>
    </Card>
  );
}
