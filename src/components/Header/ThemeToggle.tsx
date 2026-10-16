'use client';

import { ActionIcon, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';

export function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  const isDark = computedColorScheme === 'dark';

  return (
    <ActionIcon
      onClick={() => setColorScheme(isDark ? 'light' : 'dark')}
      variant="default"
      size="lg"
      radius="md"
      aria-label="Toggle color scheme"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <IconSun size={18} stroke={1.8} color="#f59e0b" />
      ) : (
        <IconMoon size={18} stroke={1.8} color="#6366f1" />
      )}
    </ActionIcon>
  );
}
