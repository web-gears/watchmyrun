'use client';

import { ActionIcon, useComputedColorScheme, useMantineColorScheme } from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';

export function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });

  return (
    <ActionIcon
      onClick={() => setColorScheme(computedColorScheme === 'dark' ? 'light' : 'dark')}
      variant="default"
      size="lg"
      radius="md"
      aria-label="Toggle color scheme"
      title="Toggle color scheme"
    >
      <IconSun className="theme-icon-sun" size={18} stroke={1.8} color="#f59e0b" />
      <IconMoon className="theme-icon-moon" size={18} stroke={1.8} color="#6366f1" />
    </ActionIcon>
  );
}
