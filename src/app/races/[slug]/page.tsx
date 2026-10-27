import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
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
  Divider,
  Table,
  TableThead,
  TableTbody,
  TableTr,
  TableTh,
  TableTd,
} from '@mantine/core';
import {
  IconMapPin,
  IconClock,
  IconTrendingUp,
  IconArrowRight,
  IconFlag,
  IconShare,
  IconSparkles,
  IconRoute,
} from '@tabler/icons-react';
import { SEO_RACE_PAGES, getSeoRaceBySlug } from '@/lib/seo/raceLandingData';
import { finishTimeToSeconds } from '@/lib/forecasting/pacingModels';

export function generateStaticParams() {
  return SEO_RACE_PAGES.map((race) => ({
    slug: race.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const race = getSeoRaceBySlug(slug);
  if (!race) {
    return {
      title: 'Race Spectator Guide | WatchMy.Run',
    };
  }

  const title = `${race.name} Spectator Guide, Cheer Spots & ETA Calculator | WatchMy.Run`;
  const description = `Interactive ${race.shortName} spectator calculator and cheer spot planner. Calculate exact runner arrival windows by mile, wave start times, and elevation-adjusted pace—no app install required.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://watchmy.run/races/${race.slug}/`,
    },
    openGraph: {
      title,
      description,
      url: `https://watchmy.run/races/${race.slug}/`,
      siteName: 'WatchMy.Run',
      type: 'article',
      images: [
        {
          url: '/og-card.png',
          width: 1200,
          height: 630,
          alt: `${race.name} Spectator Planner — WatchMy.Run`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-card.png'],
    },
  };
}

function addSecondsToClockTime(startTimeHhMm: string, addSec: number): string {
  const parts = startTimeHhMm.split(':').map((n) => parseInt(n, 10));
  const startSec = (parts[0] || 9) * 3600 + (parts[1] || 0) * 60;
  const totalSec = (startSec + Math.round(addSec)) % (24 * 3600);
  const hh24 = Math.floor(totalSec / 3600);
  const mm = Math.floor((totalSec % 3600) / 60);
  const period = hh24 >= 12 ? 'PM' : 'AM';
  const hh12 = hh24 % 12 === 0 ? 12 : hh24 % 12;
  return `${hh12}:${mm.toString().padStart(2, '0')} ${period}`;
}

export default async function RaceSpectatorGuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const race = getSeoRaceBySlug(slug);
  if (!race) notFound();

  const totalGoalSec = finishTimeToSeconds(race.defaultFinishTime) || 13500;
  const totalDistM = race.distanceKm * 1000;

  // JSON-LD Structured Data (SportsEvent + FAQPage)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SportsEvent',
        name: race.name,
        description: race.courseDescription,
        sport: 'Running',
        location: {
          '@type': 'Place',
          name: `${race.city}, ${race.country}`,
          address: {
            '@type': 'PostalAddress',
            addressLocality: race.city,
            addressCountry: race.country,
          },
        },
        url: `https://watchmy.run/races/${race.slug}/`,
      },
      ...(race.faqs.length > 0
        ? [
            {
              '@type': 'FAQPage',
              mainEntity: race.faqs.map((f) => ({
                '@type': 'Question',
                name: f.question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: f.answer,
                },
              })),
            },
          ]
        : []),
    ],
  };

  return (
    <Box
      style={{
        minHeight: '100dvh',
        background: 'var(--mantine-color-body)',
        color: 'var(--mantine-color-text)',
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top Navigation Bar */}
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
          <Group justify="space-between" align="center" wrap="nowrap">
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

            <Group gap="xs">
              <Button
                component={Link}
                href="/races/"
                variant="subtle"
                color="gray"
                size="xs"
              >
                All Race Guides
              </Button>
              <Button
                component={Link}
                href={race.appLaunchUrl}
                color="cyan"
                size="xs"
                radius="xl"
                rightSection={<IconArrowRight size={14} />}
              >
                Open Live Map
              </Button>
            </Group>
          </Group>
        </Container>
      </Box>

      {/* Main Content */}
      <Container size="lg" py="xl">
        <Stack gap="xl">
          {/* Hero Section */}
          <Card
            withBorder
            radius="lg"
            p={{ base: 'md', sm: 'xl' }}
            style={{
              background:
                'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(56, 189, 248, 0.03) 100%)',
              borderColor: 'rgba(2, 132, 199, 0.25)',
            }}
          >
            <Stack gap="md">
              <Group gap="xs" wrap="wrap">
                <Badge size="md" variant="light" color="cyan">
                  {race.flag} {race.city}
                </Badge>
                <Badge size="md" variant="outline" color="gray">
                  {race.annualDate}
                </Badge>
                <Badge size="md" variant="dot" color="teal">
                  {race.distanceKm} km ({race.distanceMi} mi)
                </Badge>
              </Group>

              <div>
                <Title order={1} fz={{ base: 26, sm: 36 }} fw={800} style={{ lineHeight: 1.15 }}>
                  {race.name} Spectator Guide & Live ETA Calculator
                </Title>
                <Text size="md" c="dimmed" mt="xs" maw={780}>
                  {race.courseDescription}
                </Text>
              </div>

              <Group gap="sm" wrap="wrap" mt="xs">
                <Button
                  component={Link}
                  href={race.appLaunchUrl}
                  size="md"
                  color="cyan"
                  radius="md"
                  rightSection={<IconArrowRight size={18} />}
                >
                  Launch Interactive {race.shortName} Tracker
                </Button>
                <Button
                  component={Link}
                  href={
                    race.marathonId
                      ? `/?race=${race.marathonId}`
                      : race.appLaunchUrl
                  }
                  size="md"
                  variant="default"
                  radius="md"
                  leftSection={<IconMapPin size={18} />}
                >
                  Pick Custom Cheer Spots on Map
                </Button>
              </Group>
            </Stack>
          </Card>

          {/* Quick Course Stats */}
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            <Card withBorder radius="md" p="md">
              <Group gap="xs" mb={4}>
                <IconTrendingUp size={18} color="#0284c7" />
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  Elevation Profile
                </Text>
              </Group>
              <Text size="lg" fw={800}>
                +{race.elevationGainM}m gain / -{race.elevationLossM}m loss
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                {race.elevationHighlight}
              </Text>
            </Card>

            <Card withBorder radius="md" p="md">
              <Group gap="xs" mb={4}>
                <IconClock size={18} color="#f59e0b" />
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  Default Start & Goal Sample
                </Text>
              </Group>
              <Text size="lg" fw={800}>
                {race.defaultStartTime} Start • {race.defaultFinishTime} Goal
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                Avg Pace: {race.defaultPaceMinPerKm}/km ({race.defaultPaceMinPerMi}/mi)
              </Text>
            </Card>

            <Card withBorder radius="md" p="md">
              <Group gap="xs" mb={4}>
                <IconSparkles size={18} color="#10b981" />
                <Text size="xs" fw={700} tt="uppercase" c="dimmed">
                  Multi-Spot Spectator Tip
                </Text>
              </Group>
              <Text size="xs" style={{ lineHeight: 1.45 }}>
                {race.spectatorTip}
              </Text>
            </Card>
          </SimpleGrid>

          {/* Cheer Spots & Sample Arrival Windows Table */}
          <Card withBorder radius="md" p={{ base: 'md', sm: 'lg' }}>
            <Group justify="space-between" align="flex-start" mb="md" wrap="wrap">
              <div>
                <Group gap="xs">
                  <IconFlag size={20} color="#f59e0b" />
                  <Title order={2} size="h3">
                    Best Cheer Spots & Sample Arrival Windows
                  </Title>
                </Group>
                <Text size="xs" c="dimmed" mt={2}>
                  Sample schedule based on a {race.defaultStartTime} start and {race.defaultFinishTime} finish ({race.defaultPaceMinPerMi}/mi). Click any spot to customize for your runner’s exact wave and pace.
                </Text>
              </div>
              <Button
                component={Link}
                href={race.appLaunchUrl}
                size="xs"
                variant="light"
                color="amber"
                rightSection={<IconArrowRight size={14} />}
              >
                Customize Start & Pace
              </Button>
            </Group>

            <Box style={{ overflowX: 'auto' }}>
              <Table striped highlightOnHover verticalSpacing="sm">
                <TableThead>
                  <TableTr>
                    <TableTh>Cheer Spot / Landmark</TableTh>
                    <TableTh>Distance</TableTh>
                    <TableTh>Sample Arrival Window</TableTh>
                    <TableTh>Notes</TableTh>
                    <TableTh style={{ textAlign: 'right' }}>Action</TableTh>
                  </TableTr>
                </TableThead>
                <TableTbody>
                  {race.cheerSpots.map((spot) => {
                    const fraction = Math.min(1, spot.distM / Math.max(1, totalDistM));
                    const expectedSec = fraction * totalGoalSec;
                    const bufferSec = Math.max(120, Math.min(420, expectedSec * 0.03));
                    const earlyStr = addSecondsToClockTime(
                      race.defaultStartTime,
                      expectedSec - bufferSec
                    );
                    const lateStr = addSecondsToClockTime(
                      race.defaultStartTime,
                      expectedSec + bufferSec
                    );
                    const spotUrl = race.marathonId
                      ? `/?race=${race.marathonId}&start=${race.defaultStartTime}&finish=${race.defaultFinishTime}&spectator=${spot.distM}`
                      : `${race.appLaunchUrl}&spectator=${spot.distM}`;

                    return (
                      <TableTr key={spot.id}>
                        <TableTd fw={700}>{spot.name}</TableTd>
                        <TableTd style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                          Mile {spot.mile} ({(spot.distM / 1000).toFixed(1)} km)
                        </TableTd>
                        <TableTd style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                          <Badge color="amber" variant="light" size="sm">
                            {earlyStr} – {lateStr}
                          </Badge>
                        </TableTd>
                        <TableTd>
                          <Text size="xs" c="dimmed">
                            {spot.description}
                          </Text>
                        </TableTd>
                        <TableTd style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <Button
                            component={Link}
                            href={spotUrl}
                            size="compact-xs"
                            variant="subtle"
                            color="cyan"
                          >
                            Track Spot →
                          </Button>
                        </TableTd>
                      </TableTr>
                    );
                  })}
                </TableTbody>
              </Table>
            </Box>
          </Card>

          {/* Start Waves Schedule */}
          {race.waves.length > 0 && (
            <Card withBorder radius="md" p={{ base: 'md', sm: 'lg' }}>
              <Title order={2} size="h4" mb="xs">
                {race.shortName} Wave Start Schedule
              </Title>
              <Text size="xs" c="dimmed" mb="md">
                Click your runner’s start wave below to open the live map pre-configured for that wave start time:
              </Text>
              <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="sm">
                {race.waves.map((wave) => {
                  const waveStartHhMm = wave.timeStr.slice(0, 5);
                  const waveUrl = race.marathonId
                    ? `/?race=${race.marathonId}&start=${waveStartHhMm}&finish=${race.defaultFinishTime}`
                    : race.appLaunchUrl;
                  return (
                    <Card
                      key={wave.id}
                      component={Link}
                      href={waveUrl}
                      withBorder
                      padding="sm"
                      radius="md"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <Group justify="space-between" align="center" mb={4}>
                        <Text size="sm" fw={700}>
                          {wave.name}
                        </Text>
                        <Badge size="sm" color="cyan" variant="light">
                          {waveStartHhMm}
                        </Badge>
                      </Group>
                      <Text size="xs" c="dimmed">
                        {wave.description}
                      </Text>
                    </Card>
                  );
                })}
              </SimpleGrid>
            </Card>
          )}

          {/* FAQ Section */}
          {race.faqs.length > 0 && (
            <Card withBorder radius="md" p={{ base: 'md', sm: 'lg' }}>
              <Title order={2} size="h3" mb="md">
                Frequently Asked Questions — {race.shortName} Spectators
              </Title>
              <Stack gap="md">
                {race.faqs.map((faq, idx) => (
                  <Box key={idx}>
                    <Text fw={700} size="sm" mb={4}>
                      {faq.question}
                    </Text>
                    <Text size="sm" c="dimmed" style={{ lineHeight: 1.55 }}>
                      {faq.answer}
                    </Text>
                    {idx < race.faqs.length - 1 && <Divider mt="md" />}
                  </Box>
                ))}
              </Stack>
            </Card>
          )}

          {/* Other Marathon Guides Cross-Links */}
          <Box>
            <Group justify="space-between" align="center" mb="sm">
              <Title order={3} size="h4">
                More Marathon Spectator Guides & Calculators
              </Title>
              <Button
                component={Link}
                href="/races/"
                variant="subtle"
                size="xs"
                color="cyan"
              >
                View All Guides →
              </Button>
            </Group>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="sm">
              {SEO_RACE_PAGES.filter((r) => r.slug !== race.slug)
                .slice(0, 8)
                .map((other) => (
                  <Card
                    key={other.slug}
                    component={Link}
                    href={`/races/${other.slug}/`}
                    withBorder
                    padding="sm"
                    radius="md"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <Group gap="xs" wrap="nowrap">
                      <Text size="lg">{other.flag}</Text>
                      <div style={{ minWidth: 0 }}>
                        <Text size="xs" fw={700} truncate>
                          {other.shortName}
                        </Text>
                        <Text size="11px" c="dimmed" truncate>
                          {other.city}
                        </Text>
                      </div>
                    </Group>
                  </Card>
                ))}
            </SimpleGrid>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
