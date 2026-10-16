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
                  Don&apos;t carry a phone — an AirTag is all you need.
                </Text>
                <Badge size="xs" variant="filled" color="cyan">
                  Phone-Free Racing
                </Badge>
              </Group>
              <Text size="xs" c="dimmed" mt={2}>
                Marathoners shouldn&apos;t have to run with a bouncing 200g phone in their waistband or worry about battery death from cellular GPS apps.
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
                    No running belts, armbands, or battery anxiety. Race light and free for 26.2 miles.
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
                    2. AirTag Is Enough
                  </Text>
                  <Text size="11px" c="dimmed" mt={2} style={{ lineHeight: 1.3 }}>
                    Clip an AirTag to shoelaces, pin it under your bib, or tuck it in a waistband pouch.
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
                    3. Exact Cheer ETAs
                  </Text>
                  <Text size="11px" c="dimmed" mt={2} style={{ lineHeight: 1.3 }}>
                    Spectators get minute-by-minute countdowns and arrival windows at every cheer station.
                  </Text>
                </div>
              </Group>
            </Card>
          </SimpleGrid>
        </Card>

        {/* Step-by-Step Walkthrough */}
        <div>
          <Text fw={700} size="sm" mb="xs">
            Step-by-Step Race Day Guide:
          </Text>

          <Timeline active={3} bulletSize={24} lineWidth={2} color="cyan">
            <Timeline.Item bullet={<IconFlag size={12} />} title="1. Runner Setup (Before the Race)">
              <Text size="xs" c="dimmed" mt={2}>
                Clip an Apple AirTag to your shoelaces, pin it under your race bib, or slip it in a waistband pocket. Tap the <b>Share</b> button at the top to copy your personal race tracking link and send it to your cheering squad.
              </Text>
            </Timeline.Item>

            <Timeline.Item bullet={<IconClock size={12} />} title="2. Spectator Setup (Race Morning)">
              <Text size="xs" c="dimmed" mt={2}>
                Open the link to view the course. Confirm the runner&apos;s start wave and target goal time. Check race morning conditions and what to wear at{' '}
                <a
                  href="https://run-weather.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--mantine-color-cyan-6)', textDecoration: 'none', fontWeight: 600 }}
                >
                  Run-Weather.com
                </a>
                . Under <b>Spectator Cheer Stations</b>, tap the landmark stations where you plan to cheer (e.g. Wellesley Scream Tunnel, Heartbreak Hill, Tower Bridge, Central Park).
              </Text>
            </Timeline.Item>

            <Timeline.Item bullet={<IconMapPin size={12} />} title="3. Live Sighting Pins (During the Race)">
              <Text size="xs" c="dimmed" mt={2}>
                Whenever you get an Apple Find My / AirTag ping or a visual crowd sighting, tap <b>&quot;Drop Pin&quot;</b> and click where the runner was seen. The engine automatically snaps to course elevation, recalibrates live pace, and updates the projected finish time.
              </Text>
            </Timeline.Item>

            <Timeline.Item bullet={<IconCheck size={12} />} title="4. Cheer on Time at Every Spot">
              <Text size="xs" c="dimmed" mt={2}>
                The floating <b>Spectator Card</b> displays a live countdown (e.g. <i>&quot;Arriving in 14 mins&quot;</i>) with a confidence meeting window so you know exactly when to stand by the barriers.
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
                  Free &amp; ad-free project. If this helps cheer your runner, consider buying a coffee!
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
            Got It! Start Tracking
          </Button>
        </Group>

        <Text size="11px" c="dimmed" ta="center" mt={2} style={{ opacity: 0.75 }}>
          © {new Date().getFullYear()} WatchMy.Run • Developed by Volodymyr Hartsev
        </Text>
      </Stack>
    </Modal>
  );
}
