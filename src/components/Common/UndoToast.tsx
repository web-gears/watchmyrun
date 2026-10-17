'use client';

import { useEffect, useState } from 'react';
import {
  Affix,
  Card,
  Group,
  Text,
  Button,
  ActionIcon,
  Transition,
  Box,
} from '@mantine/core';
import { IconArrowBackUp, IconX } from '@tabler/icons-react';

export interface UndoToastProps {
  opened: boolean;
  message: string;
  onUndo: () => void;
  onClose: () => void;
  durationMs?: number;
}

export function UndoToast({
  opened,
  message,
  onUndo,
  onClose,
  durationMs = 8000,
}: UndoToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!opened) {
      setProgress(100);
      return;
    }

    setProgress(100);
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(remainingPct);
      if (remainingPct <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [opened, durationMs]);

  return (
    <Affix
      position={{ bottom: 84, left: 16, right: 16 }}
      zIndex={3500}
      className="undo-toast-affix"
      style={{
        pointerEvents: 'none',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Transition mounted={opened} transition="slide-up" duration={220}>
        {(transitionStyles) => (
          <Card
            withBorder
            radius="md"
            p="xs"
            role="status"
            aria-live="polite"
            style={{
              ...transitionStyles,
              pointerEvents: 'auto',
              background: '#0f172a',
              color: '#f8fafc',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45)',
              width: '100%',
              maxWidth: 380,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Group justify="space-between" wrap="nowrap" gap="xs">
              <Group gap="xs" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                <Box
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'rgba(245, 158, 11, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: '#f59e0b',
                  }}
                >
                  <IconArrowBackUp size={16} stroke={2.2} />
                </Box>
                <Text
                  size="xs"
                  fw={600}
                  c="#f8fafc"
                  style={{ lineHeight: 1.3 }}
                  truncate
                >
                  {message}
                </Text>
              </Group>

              <Group gap={6} wrap="nowrap">
                <Button
                  size="xs"
                  color="amber"
                  variant="filled"
                  radius="md"
                  onClick={onUndo}
                  style={{
                    fontWeight: 700,
                    height: 32,
                    padding: '0 12px',
                  }}
                >
                  Undo
                </Button>
                <ActionIcon
                  size="md"
                  variant="subtle"
                  color="gray"
                  onClick={onClose}
                  aria-label="Dismiss undo notification"
                  style={{ color: '#94a3b8', minWidth: 32, minHeight: 32 }}
                >
                  <IconX size={15} />
                </ActionIcon>
              </Group>
            </Group>

            {/* Visual remaining time countdown bar (Hardware accelerated transform) */}
            <Box
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 2.5,
                background: '#f59e0b',
                transform: `scaleX(${progress / 100})`,
                transformOrigin: 'left center',
                transition: 'transform 0.05s linear',
              }}
            />
          </Card>
        )}
      </Transition>
    </Affix>
  );
}
