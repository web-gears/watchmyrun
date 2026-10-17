'use client';

import {
  Group,
  Text,
  Badge,
  ActionIcon,
  Button,
  Tooltip,
  Box,
  Burger,
} from '@mantine/core';
import {
  IconMapPin,
  IconChevronDown,
  IconInfoCircle,
  IconCoffee,
  IconCloud,
} from '@tabler/icons-react';
import { MarathonInfo } from '@/lib/data/marathonRegistry';
import { RaceDistanceOption } from '@/lib/data/newYorkCourses';
import { ThemeToggle } from './ThemeToggle';
import { ShareButton } from './ShareButton';

interface AppHeaderProps {
  marathonInfo: MarathonInfo;
  onOpenRaceModal: () => void;
  onOpenHowItWorksModal: () => void;
  distanceOption: RaceDistanceOption;
  onOpenMobileDrawer: () => void;
  isMobileDrawerOpen: boolean;
  onOpenPinModal: () => void;
  statusBadgeText?: string;
  shareUrl: string;
}

export function AppHeader({
  marathonInfo,
  onOpenRaceModal,
  onOpenHowItWorksModal,
  distanceOption,
  onOpenMobileDrawer,
  isMobileDrawerOpen,
  onOpenPinModal,
  statusBadgeText,
  shareUrl,
}: AppHeaderProps) {
  return (
    <>
      <Box
        component="header"
        px="md"
        py="xs"
        className="glass-panel"
        style={{
          borderBottom: '1px solid var(--mantine-color-default-border)',
          position: 'relative',
          zIndex: 1000,
        }}
      >
        <Group justify="space-between" wrap="nowrap">
          {/* Left: Brand & Mobile Burger */}
          <Group gap="sm" wrap="nowrap">
            <Burger
              opened={isMobileDrawerOpen}
              onClick={onOpenMobileDrawer}
              hiddenFrom="lg"
              size="sm"
              aria-label="Toggle race controls drawer"
              style={{ minWidth: 44, minHeight: 44 }}
            />
            <Group gap="xs" wrap="nowrap">
              <Box
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                <svg viewBox="0 0 100 100" width="32" height="32" style={{ display: 'block' }}>
                  <defs>
                    <linearGradient id="header-radar-g" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0369a1" />
                      <stop offset="100%" stopColor="#0284c7" />
                    </linearGradient>
                    <linearGradient id="header-sweep-g" x1="50%" y1="50%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <rect width="100" height="100" rx="24" fill="url(#header-radar-g)" />
                  <circle cx="50" cy="50" r="34" stroke="#ffffff" strokeWidth="3" strokeDasharray="4 4" fill="none" opacity="0.35" />
                  <circle cx="50" cy="50" r="22" stroke="#ffffff" strokeWidth="3" fill="none" opacity="0.6" />
                  <path d="M 50 50 L 78 22 A 38 38 0 0 0 32 15 Z" fill="url(#header-sweep-g)" />
                  <circle cx="50" cy="50" r="8" fill="#ffffff" />
                  <circle cx="50" cy="50" r="4.5" fill="#0284c7" />
                  <circle cx="68" cy="30" r="5" fill="#38bdf8" stroke="#ffffff" strokeWidth="2" />
                </svg>
              </Box>
              <Box>
                <Text fw={800} size="sm" style={{ lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                  WatchMy<Text span c="cyan.6">.Run</Text>
                </Text>
                <Text size="xs" c="dimmed" style={{ lineHeight: 1.1 }}>
                  Phone-Free Marathon Tracker
                </Text>
              </Box>
            </Group>
          </Group>

          {/* Center: Interactive Race Selector Pill */}
          <Group gap="xs" wrap="nowrap">
            <Button
              variant="light"
              color="cyan"
              size="sm"
              radius="xl"
              leftSection={<Text size="md">{marathonInfo.flag}</Text>}
              rightSection={<IconChevronDown size={14} />}
              onClick={onOpenRaceModal}
              style={{
                fontWeight: 600,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              }}
            >
              <Box visibleFrom="sm" component="span">
                {marathonInfo.name}
              </Box>
              <Box hiddenFrom="sm" component="span">
                {marathonInfo.shortName}
              </Box>
            </Button>

            {marathonInfo.id === 'new_york' && distanceOption.id !== 'marathon' && (
              <Badge size="md" variant="dot" color="cyan" visibleFrom="md">
                {distanceOption.label}
              </Badge>
            )}
          </Group>

          {/* Right: Quick Actions, How it Works & Theming */}
          <Group gap="xs" wrap="nowrap">
            {statusBadgeText && (
              <Badge
                size="md"
                variant="light"
                color="cyan"
                radius="sm"
                visibleFrom="lg"
              >
                {statusBadgeText}
              </Badge>
            )}

            <Button
              leftSection={<IconInfoCircle size={16} />}
              variant="subtle"
              color="cyan"
              size="sm"
              radius="md"
              onClick={onOpenHowItWorksModal}
              visibleFrom="md"
            >
              How It Works
            </Button>

            <Tooltip label="How WatchMy.Run works">
              <ActionIcon
                size="lg"
                variant="subtle"
                radius="md"
                color="cyan"
                hiddenFrom="md"
                onClick={onOpenHowItWorksModal}
                aria-label="How WatchMy.Run works"
                style={{ minWidth: 44, minHeight: 44 }}
              >
                <IconInfoCircle size={20} />
              </ActionIcon>
            </Tooltip>

            <Button
              leftSection={<IconMapPin size={16} />}
              variant="light"
              color="emerald"
              size="sm"
              radius="md"
              onClick={onOpenPinModal}
              visibleFrom="xs"
              style={{ minHeight: 36 }}
            >
              Drop Pin
            </Button>

            {/* Share Button with Popover and Tooltip */}
            <ShareButton shareUrl={shareUrl} />

            {/* Running Weather Forecast (Run-Weather.com) */}
            <Tooltip label="Race weather forecast (Run-Weather.com)" position="bottom-end" withArrow>
              <ActionIcon
                component="a"
                href="https://run-weather.com/"
                target="_blank"
                rel="noopener noreferrer"
                size="lg"
                variant="default"
                radius="md"
                aria-label="Running weather forecast on Run-Weather.com"
                title="Race weather forecast (Run-Weather.com)"
                visibleFrom="xs"
                style={{ minWidth: 44, minHeight: 44 }}
              >
                <IconCloud size={20} stroke={1.8} color="#0284c7" />
              </ActionIcon>
            </Tooltip>

            {/* Support on Ko-fi */}
            <Tooltip
              label="Support the project: Help keep WatchMy.Run free & cover map/server costs on Ko-fi"
              position="bottom-end"
              withArrow
              multiline
              w={240}
            >
              <ActionIcon
                component="a"
                href="https://ko-fi.com/lavenderaf"
                target="_blank"
                rel="noopener noreferrer"
                size="lg"
                variant="default"
                radius="md"
                aria-label="Support the project on Ko-fi"
                title="Support the project: Help keep WatchMy.Run free & cover map/server costs on Ko-fi"
                visibleFrom="xs"
                style={{ minWidth: 44, minHeight: 44 }}
              >
                <IconCoffee size={20} stroke={1.8} color="#f43f5e" />
              </ActionIcon>
            </Tooltip>

            <ThemeToggle />
          </Group>
        </Group>
      </Box>
    </>
  );
}
