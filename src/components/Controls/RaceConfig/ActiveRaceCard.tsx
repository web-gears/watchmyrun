'use client';

import {
  Card,
  Group,
  Text,
  Badge,
  Button,
  ActionIcon,
  Tooltip,
  Box,
  Divider,
  SegmentedControl,
} from '@mantine/core';
import { IconTrophy, IconLayoutSidebarLeftCollapse } from '@tabler/icons-react';
import { MarathonInfo } from '@/lib/data/marathonRegistry';
import { MarathonId } from '@/lib/forecasting/types';
import {
  RaceDistanceId,
  RaceDistanceOption,
  RACE_DISTANCE_OPTIONS,
} from '@/lib/data/newYorkCourses';

interface ActiveRaceCardProps {
  marathonInfo: MarathonInfo;
  selectedMarathon: MarathonId;
  selectedDistance: RaceDistanceId;
  distanceOption: RaceDistanceOption;
  onOpenRaceModal: () => void;
  onSelectDistance: (dist: RaceDistanceId) => void;
  onCollapse?: () => void;
}

export function ActiveRaceCard({
  marathonInfo,
  selectedMarathon,
  selectedDistance,
  distanceOption,
  onOpenRaceModal,
  onSelectDistance,
  onCollapse,
}: ActiveRaceCardProps) {
  return (
    <Card
      withBorder
      p="xs"
      radius="md"
      style={{
        background: 'var(--mantine-color-default-hover)',
        border: '1px solid var(--mantine-color-default-border)',
      }}
    >
      <Group justify="space-between" align="center" wrap="nowrap" gap="xs">
        <Group gap="xs" wrap="nowrap" align="center" style={{ flex: 1, minWidth: 0 }}>
          <Text size="24px" style={{ lineHeight: 1, flexShrink: 0 }}>
            {marathonInfo.flag}
          </Text>
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text fw={700} size="sm" style={{ lineHeight: 1.2 }} truncate>
              {marathonInfo.name}
            </Text>
            <Text size="11px" c="dimmed" mt={1} truncate>
              {marathonInfo.city} • {marathonInfo.annualDate}
            </Text>
          </Box>
        </Group>

        <Group gap={4} wrap="nowrap" style={{ flexShrink: 0 }}>
          <Button
            size="xs"
            variant="subtle"
            color="cyan"
            radius="md"
            leftSection={<IconTrophy size={14} />}
            onClick={onOpenRaceModal}
          >
            Change
          </Button>
          {onCollapse && (
            <Tooltip label="Collapse panel" position="right" withArrow>
              <ActionIcon
                size="md"
                variant="subtle"
                color="gray"
                radius="md"
                onClick={onCollapse}
                aria-label="Collapse race controls"
                style={{ minWidth: 32, minHeight: 32 }}
              >
                <IconLayoutSidebarLeftCollapse size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Group>

      {selectedMarathon === 'new_york' && (
        <Box mt="xs">
          <Divider my={6} />
          <Group justify="space-between" align="center" mb={4}>
            <Text size="11px" fw={600} c="dimmed">
              Course Distance:
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
  );
}
