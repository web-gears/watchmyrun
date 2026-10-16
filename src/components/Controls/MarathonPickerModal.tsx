'use client';

import {
  Modal,
  SimpleGrid,
  Card,
  Text,
  Badge,
  Group,
  Stack,
  Button,
  Box,
} from '@mantine/core';
import { IconFlame, IconMapPin, IconCalendar, IconMountain } from '@tabler/icons-react';
import { MARATHON_LIST } from '@/lib/data/marathonRegistry';
import { MarathonId } from '@/lib/forecasting/types';

interface MarathonPickerModalProps {
  opened: boolean;
  onClose: () => void;
  selectedId: MarathonId | null;
  onSelect: (id: MarathonId) => void;
}

export function MarathonPickerModal({
  opened,
  onClose,
  selectedId,
  onSelect,
}: MarathonPickerModalProps) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconFlame size={22} color="#0284c7" />
          <Text fw={700} size="lg">
            Choose a Marathon to Track
          </Text>
        </Group>
      }
      size="lg"
      radius="lg"
      centered
    >
      <Stack gap="sm">
        <Text size="sm" c="dimmed">
          Select an official Abbott World Marathon Major to load its certified course, elevation
          profile, wave start schedule, and runner forecasting model:
        </Text>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
          {MARATHON_LIST.map((m) => {
            const isSelected = selectedId === m.id;
            return (
              <Card
                key={m.id}
                withBorder
                radius="md"
                p="sm"
                style={{
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--mantine-color-cyan-6)' : undefined,
                  background: isSelected ? 'var(--mantine-color-cyan-light)' : undefined,
                  transition: 'transform 0.15s ease, border-color 0.15s ease',
                }}
                onClick={() => {
                  onSelect(m.id);
                  onClose();
                }}
              >
                <Stack gap={6}>
                  <Group justify="space-between" wrap="nowrap" align="flex-start">
                    <Text fw={700} size="sm" style={{ lineHeight: 1.2 }}>
                      {m.name}
                    </Text>
                    {isSelected && (
                      <Badge color="cyan" size="xs" variant="filled">
                        Active
                      </Badge>
                    )}
                  </Group>

                  <Group gap={4}>
                    <IconMapPin size={13} color="#64748b" />
                    <Text size="xs" c="dimmed">
                      {m.city}, {m.country}
                    </Text>
                  </Group>

                  <Group gap={4}>
                    <IconCalendar size={13} color="#64748b" />
                    <Text size="xs" c="dimmed">
                      {m.annualDate}
                    </Text>
                  </Group>

                  <Group gap={4} mt={2}>
                    <IconMountain size={13} color="#0284c7" />
                    <Text size="11px" c="cyan" fw={500} lineClamp={1}>
                      {m.elevationHighlight}
                    </Text>
                  </Group>
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      </Stack>
    </Modal>
  );
}
