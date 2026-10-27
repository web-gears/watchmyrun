import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Container,
  Title,
  Text,
  Card,
  Group,
  Stack,
  Badge,
  Button,
  SimpleGrid,
  Box,
} from '@mantine/core';
import { IconArrowRight, IconFlag, IconTrendingUp } from '@tabler/icons-react';
import { SEO_RACE_PAGES } from '@/lib/seo/raceLandingData';

export const metadata: Metadata = {
  title: 'Marathon Spectator Guides, Cheer Spots & ETA Calculators | WatchMy.Run',
  description:
    'Interactive marathon spectator guides, cheer spot arrival window calculators, and live elevation-adjusted pace trackers for NYC, Boston, Chicago, London, Berlin, Tokyo, Valencia, Marine Corps, Philadelphia, and any GPX/FIT race course.',
  alternates: {
    canonical: 'https://watchmy.run/races/',
  },
};

export default function RacesIndexPage() {
  return (
    <Box
      style={{
        minHeight: '100dvh',
        background: 'var(--mantine-color-body)',
        color: 'var(--mantine-color-text)',
      }}
    >
      {/* Top Bar */}
      <Box
        component="header"
        px="md"
        py="sm"
        style={{
          borderBottom: '1px solid var(--mantine-color-default-border)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(12px)',
          background: 'var(--mantine-color-body)',
        }}
      >
        <Container size="lg">
          <Group justify="space-between" align="center">
            <Link
              href="/"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Box
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: 14,
                }}
              >
                ◎
              </Box>
              <Text fw={800} size="sm" style={{ letterSpacing: '-0.02em' }}>
                WatchMy<Text span c="cyan.6">.Run</Text>
              </Text>
            </Link>

            <Button
              component={Link}
              href="/"
              color="cyan"
              size="xs"
              radius="xl"
              rightSection={<IconArrowRight size={14} />}
            >
              Open Live Tracker Map
            </Button>
          </Group>
        </Container>
      </Box>

      <Container size="lg" py="xl">
        <Stack gap="xl">
          <div>
            <Badge color="cyan" variant="light" mb="xs">
              MARATHON SPECTATOR GUIDES & ETA CALCULATORS
            </Badge>
            <Title order={1} fz={{ base: 28, sm: 38 }} fw={800}>
              Race Course Spectator Guides & Cheer Spot Planners
            </Title>
            <Text size="md" c="dimmed" mt="xs" maw={760}>
              Select a marathon below to view the best spectator cheer spots, subway/transit tips, wave start schedules, and launch the live elevation-adjusted arrival window calculator.
            </Text>
          </div>

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {SEO_RACE_PAGES.map((race) => (
              <Card
                key={race.slug}
                withBorder
                radius="md"
                p="md"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <Group justify="space-between" align="flex-start" wrap="nowrap" mb="xs">
                    <Group gap="xs" wrap="nowrap">
                      <Text size="24px" style={{ lineHeight: 1 }}>
                        {race.flag}
                      </Text>
                      <div>
                        <Text fw={700} size="sm" style={{ lineHeight: 1.2 }}>
                          {race.name}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {race.city}
                        </Text>
                      </div>
                    </Group>
                    <Badge size="xs" variant="light" color="cyan" style={{ flexShrink: 0 }}>
                      {race.distanceKm} km
                    </Badge>
                  </Group>

                  <Text size="xs" c="dimmed" lineClamp={3} mb="sm">
                    {race.courseDescription}
                  </Text>

                  <Group gap="xs" mb="sm">
                    <Badge
                      size="xs"
                      variant="outline"
                      color="amber"
                      leftSection={<IconFlag size={10} />}
                    >
                      {race.cheerSpots.length} Cheer Spots
                    </Badge>
                    <Badge
                      size="xs"
                      variant="outline"
                      color="gray"
                      leftSection={<IconTrendingUp size={10} />}
                    >
                      +{race.elevationGainM}m gain
                    </Badge>
                  </Group>
                </div>

                <Group gap="xs" mt="xs" grow>
                  <Button
                    component={Link}
                    href={`/races/${race.slug}/`}
                    size="xs"
                    variant="light"
                    color="cyan"
                  >
                    Spectator Guide
                  </Button>
                  <Button
                    component={Link}
                    href={race.appLaunchUrl}
                    size="xs"
                    variant="filled"
                    color="cyan"
                    rightSection={<IconArrowRight size={13} />}
                  >
                    Live Map
                  </Button>
                </Group>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>
      </Container>
    </Box>
  );
}
