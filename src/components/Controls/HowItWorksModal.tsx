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
  ThemeIcon,
  Timeline,
  Tooltip,
} from '@mantine/core';
import {
  IconDeviceMobileOff,
  IconRadar,
  IconMapPin,
  IconSparkles,
  IconInfoCircle,
  IconShare,
  IconFlag,
  IconClock,
  IconCheck,
  IconTrophy,
  IconCoffee,
  IconCloud,
} from '@tabler/icons-react';

interface HowItWorksModalProps {
  opened: boolean;
  onClose: () => void;
  onSelectRace?: () => void;
  selectedMarathonName?: string;
}

export function HowItWorksModal({
  opened,
  onClose,
  onSelectRace,
  selectedMarathonName,
}: HowItWorksModalProps) {
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
            <IconInfoCircle size={20} stroke={2.2} />
          </Box>
          <div>
            <Text fw={700} size="md" style={{ lineHeight: 1.1 }}>
              How WatchMy.Run Works
            </Text>
            <Text size="xs" c="dimmed">
              Phone-free marathon tracking & spectator meeting guide
            </Text>
          </div>
        </Group>
      }
      size="lg"
      radius="lg"
      padding="lg"
      yOffset="4vh"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 4,
      }}
    >
      <Stack gap="md">
        {/* Core Value Proposition Card */}
        <Card
          radius="md"
          p="md"
          style={{
            background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(56, 189, 248, 0.03) 100%)',
            border: '1px solid rgba(2, 132, 199, 0.25)',
          }}
        >
          <Group gap="xs" wrap="nowrap" mb={8} align="flex-start">
            <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'cyan', to: 'blue' }}>
              <IconSparkles size={20} />
            </ThemeIcon>
            <div>
              <Group gap={8} align="center">
                <Text fw={800} size="md" style={{ letterSpacing: '-0.02em' }}>
                  Phone-free tracking with an AirTag
                </Text>
                <Badge size="xs" variant="filled" color="cyan">
                  Phone-Free Racing
                </Badge>
              </Group>
              <Text size="xs" c="dimmed" mt={2}>
                Runners can leave their phones behind. Track progress using an AirTag or visual checkpoints.
              </Text>
            </div>
          </Group>

          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="sm" mt="xs">
            <Card p="xs" radius="sm" withBorder style={{ background: 'var(--mantine-color-body)' }}>
              <Group gap="xs" wrap="nowrap" align="flex-start">
                <ThemeIcon size="md" radius="sm" color="red" variant="light" style={{ flexShrink: 0 }}>
                  <IconDeviceMobileOff size={16} />
                </ThemeIcon>
                <div>
                  <Text fw={700} size="xs">
                    1. Run Phone-Free
                  </Text>
                  <Text size="11px" c="dimmed" mt={2} style={{ lineHeight: 1.3 }}>
                    Run without carrying a phone, wearing an armband, or draining battery.
                  </Text>
                </div>
              </Group>
            </Card>

            <Card p="xs" radius="sm" withBorder style={{ background: 'var(--mantine-color-body)' }}>
              <Group gap="xs" wrap="nowrap" align="flex-start">
                <ThemeIcon size="md" radius="sm" color="emerald" variant="light" style={{ flexShrink: 0 }}>
                  <IconRadar size={16} />
                </ThemeIcon>
                <div>
                  <Text fw={700} size="xs">
                    2. AirTag or Sightings
                  </Text>
                  <Text size="11px" c="dimmed" mt={2} style={{ lineHeight: 1.3 }}>
                    Clip an AirTag to laces, attach to a bib, or update progress via crowd sightings.
                  </Text>
                </div>
              </Group>
            </Card>

            <Card p="xs" radius="sm" withBorder style={{ background: 'var(--mantine-color-body)' }}>
              <Group gap="xs" wrap="nowrap" align="flex-start">
                <ThemeIcon size="md" radius="sm" color="amber" variant="light" style={{ flexShrink: 0 }}>
                  <IconMapPin size={16} />
                </ThemeIcon>
                <div>
                  <Text fw={700} size="xs">
                    3. Cheer Station ETAs
                  </Text>
                  <Text size="11px" c="dimmed" mt={2} style={{ lineHeight: 1.3 }}>
                    Spectators get estimated arrival windows and live countdowns at each cheer spot.
                  </Text>
                </div>
              </Group>
            </Card>
          </SimpleGrid>
        </Card>

        {/* Step-by-Step Walkthrough */}
        <div>
          <Text fw={700} size="sm" mb="xs">
            How it works:
          </Text>

          <Timeline active={3} bulletSize={24} lineWidth={2} color="cyan">
            <Timeline.Item bullet={<IconFlag size={12} />} title="1. Runner Setup (Before the Race)">
              <Text size="xs" c="dimmed" mt={2}>
                Attach an Apple AirTag to shoelaces, bib, or pocket. Tap <b>Share</b> to copy your tracking link and send it to friends and family.
              </Text>
            </Timeline.Item>

            <Timeline.Item bullet={<IconClock size={12} />} title="2. Spectator Setup (Race Morning)">
              <Text size="xs" c="dimmed" mt={2}>
                Open the link to view the course, start wave, and target pace. Check race weather at{' '}
                <a
                  href="https://run-weather.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--mantine-color-cyan-6)', textDecoration: 'none', fontWeight: 600 }}
                >
                  Run-Weather.com
                </a>
                . Under <b>Spectator Cheer Stations</b>, select the spots where you plan to watch.
              </Text>
            </Timeline.Item>

            <Timeline.Item bullet={<IconMapPin size={12} />} title="3. Live Sighting Pins (During the Race)">
              <Text size="xs" c="dimmed" mt={2}>
                When an AirTag location updates or you spot the runner, tap <b>&quot;Drop Pin&quot;</b> and mark the location. The app recalibrates live pace and updates arrival estimates.
              </Text>
            </Timeline.Item>

            <Timeline.Item bullet={<IconCheck size={12} />} title="4. Cheer on Time at Every Spot">
              <Text size="xs" c="dimmed" mt={2}>
                The <b>Spectator Card</b> shows estimated arrival times and arrival windows for each cheer station.
              </Text>
            </Timeline.Item>
          </Timeline>
        </div>

        {onSelectRace && (
          <Card
            p="xs"
            radius="md"
            style={{
              background: 'rgba(2, 132, 199, 0.08)',
              border: '1px solid rgba(2, 132, 199, 0.25)',
            }}
          >
            <Group justify="space-between" align="center" wrap="nowrap">
              <div>
                <Group gap={6} align="center">
                  <Text size="xs" fw={700}>
                    Selected Race:
                  </Text>
                  <Badge size="sm" variant="filled" color="cyan">
                    {selectedMarathonName || 'New York'}
                  </Badge>
                </Group>
                <Text size="11px" c="dimmed" mt={2}>
                  Selected automatically based on your closest location.
                </Text>
              </div>
              <Button
                variant="light"
                color="cyan"
                size="xs"
                radius="md"
                leftSection={<IconTrophy size={14} />}
                onClick={() => {
                  onClose();
                  onSelectRace();
                }}
              >
                Change Marathon
              </Button>
            </Group>
          </Card>
        )}

        {/* Support the developer */}
        <Box
          p="xs"
          style={{
            background: 'rgba(244, 63, 94, 0.05)',
            borderRadius: 8,
            border: '1px solid rgba(244, 63, 94, 0.18)',
          }}
        >
          <Group justify="space-between" align="center" wrap="nowrap">
            <Group gap="xs" wrap="nowrap">
              <ThemeIcon size="md" radius="sm" color="pink" variant="light">
                <IconCoffee size={16} />
              </ThemeIcon>
              <div>
                <Text size="xs" fw={700}>
                  Support WatchMy.Run
                </Text>
                <Text size="11px" c="dimmed">
                  Free and ad-free project. If this helps on race day, you can support development via Ko-fi.
                </Text>
              </div>
            </Group>
            <Group gap="xs" wrap="nowrap">
              <Tooltip label="Check outside running conditions & weather scores at Run-Weather.com" position="top" withArrow>
                <Button
                  component="a"
                  href="https://run-weather.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  size="xs"
                  variant="subtle"
                  color="cyan"
                  radius="md"
                  leftSection={<IconCloud size={14} />}
                  style={{ flexShrink: 0 }}
                  title="Check outside running conditions & weather scores at Run-Weather.com"
                >
                  Weather
                </Button>
              </Tooltip>
              <Tooltip
                label="Support the project: Help keep WatchMy.Run free & cover map/server hosting costs"
                position="top"
                withArrow
                multiline
                w={230}
              >
                <Button
                  component="a"
                  href="https://ko-fi.com/lavenderaf"
                  target="_blank"
                  rel="noopener noreferrer"
                  size="xs"
                  variant="light"
                  color="pink"
                  radius="md"
                  leftSection={<IconCoffee size={14} />}
                  style={{ flexShrink: 0 }}
                  title="Support the project: Help keep WatchMy.Run free & cover map/server hosting costs"
                >
                  Ko-fi
                </Button>
              </Tooltip>
            </Group>
          </Group>
        </Box>

        <Divider />

        <Group justify="space-between">
          {onSelectRace ? (
            <Button
              variant="default"
              size="sm"
              leftSection={<IconTrophy size={15} />}
              onClick={() => {
                onClose();
                onSelectRace();
              }}
            >
              Choose Different Race
            </Button>
          ) : (
            <Box />
          )}

          <Button variant="filled" color="cyan" onClick={onClose} size="sm">
            Start Tracking
          </Button>
        </Group>

        <Text size="11px" c="dimmed" ta="center" mt={2} style={{ opacity: 0.75 }}>
          © {new Date().getFullYear()} WatchMy.Run • Developed by Volodymyr Hartsev
        </Text>
      </Stack>
    </Modal>
  );
}
