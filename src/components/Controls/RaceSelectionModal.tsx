'use client';

import {
  Modal,
  SimpleGrid,
  Card,
  Group,
  Stack,
  Text,
  Badge,
  Button,
  Box,
  Divider,
} from '@mantine/core';
import {
  IconCheck,
  IconCalendar,
  IconTrendingUp,
  IconTrophy,
  IconRoute,
} from '@tabler/icons-react';
import { CourseData, MarathonId } from '@/lib/forecasting/types';
import { MARATHON_LIST, MarathonInfo } from '@/lib/data/marathonRegistry';
import { RaceDistanceId, RACE_DISTANCE_OPTIONS } from '@/lib/data/newYorkCourses';

interface RaceSelectionModalProps {
  opened: boolean;
  onClose: () => void;
  selectedMarathon: MarathonId;
  onSelectMarathon: (id: MarathonId) => void;
  selectedDistance?: RaceDistanceId;
  onSelectDistance?: (distId: RaceDistanceId) => void;
  customCourse?: CourseData | null;
  onOpenCustomModal?: () => void;
}

export function RaceSelectionModal({
  opened,
  onClose,
  selectedMarathon,
  onSelectMarathon,
  selectedDistance = 'marathon',
  onSelectDistance,
  customCourse,
  onOpenCustomModal,
}: RaceSelectionModalProps) {
  const handleChoose = (id: MarathonId) => {
    onSelectMarathon(id);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <Box
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
            }}
          >
            <IconTrophy size={20} stroke={2.2} />
          </Box>
          <div>
            <Text fw={700} size="md" style={{ lineHeight: 1.1 }}>
              Select Marathon Major
            </Text>
            <Text size="xs" c="dimmed">
              Choose an official course map, elevation profile, and cheer stations
            </Text>
          </div>
        </Group>
      }
      size="xl"
      radius="lg"
      padding="lg"
      centered
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 4,
      }}
    >
      <Stack gap="md">
        {/* Custom Course Card */}
        {onOpenCustomModal && (
          <Card
            withBorder
            padding="md"
            radius="md"
            style={{
              border:
                selectedMarathon === 'custom'
                  ? '2px solid var(--mantine-color-cyan-6)'
                  : '1px dashed var(--mantine-color-cyan-6)',
              backgroundColor:
                selectedMarathon === 'custom'
                  ? 'var(--mantine-color-cyan-light)'
                  : 'var(--mantine-color-default-hover)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onClick={() => {
              onClose();
              onOpenCustomModal();
            }}
          >
            <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
              <Group gap="sm" wrap="nowrap" style={{ minWidth: 0, flex: 1 }}>
                <Box
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  <IconRoute size={20} stroke={2.2} />
                </Box>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Group gap="xs" align="center" wrap="nowrap">
                    <Text fw={700} size="sm" truncate>
                      {customCourse ? customCourse.title : 'Search or Import Any Race Course'}
                    </Text>
                    {selectedMarathon === 'custom' ? (
                      <Badge size="xs" variant="filled" color="cyan" leftSection={<IconCheck size={10} />}>
                        Active
                      </Badge>
                    ) : customCourse ? (
                      <Badge size="xs" variant="light" color="cyan">
                        Loaded
                      </Badge>
                    ) : null}
                  </Group>
                  <Text size="xs" c="dimmed" truncate>
                    {customCourse
                      ? `${(customCourse.distanceM / 1000).toFixed(1)} km (${(customCourse.distanceM / 1609.344).toFixed(1)} mi) • Click to search or change course`
                      : 'Search race courses worldwide, upload a GPX/FIT/TCX/GeoJSON file, or paste a route link'}
                  </Text>
                </div>
              </Group>

              <Group gap={6} wrap="nowrap" style={{ flexShrink: 0 }}>
                {customCourse && selectedMarathon !== 'custom' && (
                  <Button
                    size="xs"
                    variant="light"
                    color="cyan"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChoose('custom');
                    }}
                  >
                    Select
                  </Button>
                )}
                <Button
                  size="xs"
                  variant={selectedMarathon === 'custom' ? 'filled' : 'subtle'}
                  color="cyan"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                    onOpenCustomModal();
                  }}
                >
                  {customCourse ? 'Change Track' : 'Search / Import'}
                </Button>
              </Group>
            </Group>
          </Card>
        )}

        <div>
          <Group justify="space-between" align="baseline" mb="xs">
            <div>
              <Text fw={700} size="sm">
                World Marathon Majors
              </Text>
              <Text size="xs" c="dimmed">
                Includes official course maps, timing mats, elevation profiles, and curated cheer stations
              </Text>
            </div>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {MARATHON_LIST.map((marathon: MarathonInfo) => {
              const isSelected = marathon.id === selectedMarathon;

              return (
                <Card
                  key={marathon.id}
                  withBorder
                  padding="md"
                  radius="md"
                  style={{
                    cursor: 'pointer',
                    border: isSelected
                      ? '2px solid var(--mantine-color-cyan-6)'
                      : '1px solid var(--mantine-color-default-border)',
                    backgroundColor: isSelected
                      ? 'var(--mantine-color-cyan-light)'
                      : undefined,
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                  onClick={() => handleChoose(marathon.id)}
                  className="hover-card"
                >
                  <div>
                    <Group justify="space-between" align="flex-start" wrap="nowrap" mb="xs">
                      <Group gap="xs" wrap="nowrap">
                        <Text size="24px" style={{ lineHeight: 1 }}>
                          {marathon.flag}
                        </Text>
                        <div>
                          <Text fw={700} size="sm" style={{ lineHeight: 1.2 }}>
                            {marathon.shortName}
                          </Text>
                          <Text size="11px" c="dimmed">
                            {marathon.city}
                          </Text>
                        </div>
                      </Group>
                      {isSelected ? (
                        <Badge size="xs" variant="filled" color="cyan" leftSection={<IconCheck size={10} />}>
                          Active
                        </Badge>
                      ) : (
                        <Badge size="xs" variant="light" color="gray">
                          42.2 km
                        </Badge>
                      )}
                    </Group>

                    <Text size="xs" fw={500} lineClamp={2} mb="xs">
                      {marathon.name}
                    </Text>

                    <Stack gap={4} mb="xs">
                      <Group gap={6} wrap="nowrap">
                        <IconCalendar size={13} style={{ opacity: 0.6, flexShrink: 0 }} />
                        <Text size="11px" c="dimmed" lineClamp={1}>
                          {marathon.annualDate}
                        </Text>
                      </Group>
                      <Group gap={6} wrap="nowrap">
                        <IconTrendingUp size={13} style={{ opacity: 0.6, flexShrink: 0 }} />
                        <Text size="11px" c="dimmed" lineClamp={1}>
                          {marathon.elevationHighlight}
                        </Text>
                      </Group>
                    </Stack>
                  </div>

                  <Button
                    size="xs"
                    variant={isSelected ? 'filled' : 'light'}
                    color="cyan"
                    fullWidth
                    mt="xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleChoose(marathon.id);
                    }}
                  >
                    {isSelected ? 'Currently Selected' : `Select ${marathon.shortName}`}
                  </Button>
                </Card>
              );
            })}
          </SimpleGrid>
        </div>

        {/* If New York is selected, show distance options */}
        {selectedMarathon === 'new_york' && onSelectDistance && (
          <Box mt="xs">
            <Divider my="xs" label="New York Course Distance Variation" labelPosition="center" />
            <Text size="xs" c="dimmed" mb="xs" ta="center">
              New York also provides sub-distance course maps for events held over marathon weekend:
            </Text>
            <Group justify="center" gap="xs" wrap="wrap">
              {RACE_DISTANCE_OPTIONS.map((opt) => (
                <Button
                  key={opt.id}
                  size="xs"
                  variant={selectedDistance === opt.id ? 'filled' : 'default'}
                  color="cyan"
                  onClick={() => onSelectDistance(opt.id)}
                >
                  {opt.label}
                </Button>
              ))}
            </Group>
          </Box>
        )}

        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={onClose} size="sm">
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
