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
  Popover,
} from '@mantine/core';
import {
  IconShare,
  IconCheck,
  IconFlame,
  IconMapPin,
  IconChevronDown,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useState } from 'react';
import { MarathonInfo } from '@/lib/data/marathonRegistry';
import { RaceDistanceOption } from '@/lib/data/newYorkCourses';
import { ThemeToggle } from './ThemeToggle';

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
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    let success = false;
    const url = shareUrl || (typeof window !== 'undefined' ? window.location.href : '');

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        success = true;
      }
    } catch {
      // Fallback
    }

    if (!success && typeof document !== 'undefined') {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch {
        // Fallback
      }
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

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
              hiddenFrom="md"
              size="sm"
              aria-label="Toggle race controls drawer"
            />
            <Group gap="xs" wrap="nowrap">
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
                <IconFlame size={20} stroke={2.2} />
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
              >
                <IconInfoCircle size={18} />
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
            >
              Drop Pin
            </Button>

            {/* Share Button with Popover and Tooltip */}
            <Popover opened={copied} position="bottom-end" withArrow shadow="md">
              <Popover.Target>
                <Tooltip label={copied ? 'Copied to clipboard!' : 'Copy shareable link'}>
                  <ActionIcon
                    size="lg"
                    variant={copied ? 'filled' : 'default'}
                    radius="md"
                    onClick={handleShare}
                    color={copied ? 'teal' : undefined}
                    aria-label="Share race tracking link"
                  >
                    {copied ? <IconCheck size={18} color="white" /> : <IconShare size={18} />}
                  </ActionIcon>
                </Tooltip>
              </Popover.Target>
              <Popover.Dropdown
                style={{
                  background: '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  padding: '6px 12px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                }}
              >
                <Group gap={6} wrap="nowrap">
                  <IconCheck size={15} stroke={3} />
                  <Text size="xs" fw={700} c="white">
                    Link copied to clipboard!
                  </Text>
                </Group>
              </Popover.Dropdown>
            </Popover>

            <ThemeToggle />
          </Group>
        </Group>
      </Box>
    </>
  );
}
