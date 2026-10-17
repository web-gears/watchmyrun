'use client';

import { Box, Divider, Group, Tooltip, Anchor, Text } from '@mantine/core';
import { IconCloud, IconCoffee } from '@tabler/icons-react';
import { ThemeToggle } from '@/components/Header/ThemeToggle';

export function DrawerFooter() {
  return (
    <Box pt="xs" pb="xs">
      <Divider mb="xs" />
      <Group justify="space-between" align="center" px="xs" mb="xs">
        <Text size="xs" c="dimmed" fw={600}>
          Theme & Appearance
        </Text>
        <ThemeToggle />
      </Group>
      <Divider mb="xs" variant="dashed" />
      <Group justify="center" gap="xs" wrap="nowrap">
        <Tooltip label="Check outside running conditions at Run-Weather.com" position="top" withArrow>
          <Anchor
            href="https://run-weather.com/"
            target="_blank"
            rel="noopener noreferrer"
            size="11px"
            c="dimmed"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}
          >
            <IconCloud size={13} stroke={1.8} />
            Run-Weather.com
          </Anchor>
        </Tooltip>
        <Text size="11px" c="dimmed">
          •
        </Text>
        <Tooltip
          label="Support the project: Help keep WatchMy.Run free & cover map hosting costs"
          position="top"
          withArrow
          multiline
          w={230}
        >
          <Anchor
            href="https://ko-fi.com/lavenderaf"
            target="_blank"
            rel="noopener noreferrer"
            size="11px"
            c="pink"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
          >
            <IconCoffee size={13} stroke={2} />
            Support on Ko-fi
          </Anchor>
        </Tooltip>
      </Group>
      <Text size="10px" c="dimmed" ta="center" mt={6} style={{ opacity: 0.8 }}>
        © {new Date().getFullYear()} WatchMy.Run • Developed by Volodymyr Hartsev
      </Text>
    </Box>
  );
}
