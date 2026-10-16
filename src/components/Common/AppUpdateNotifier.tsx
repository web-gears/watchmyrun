'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Affix,
  Card,
  Group,
  Text,
  Button,
  ActionIcon,
  Badge,
  ThemeIcon,
  Transition,
} from '@mantine/core';
import { IconSparkles, IconRefresh, IconX } from '@tabler/icons-react';
import { APP_VERSION, BUILD_TIMESTAMP } from '@/lib/version';

interface RemoteVersionInfo {
  version: string;
  buildTimestamp: number;
  appName?: string;
}

export function AppUpdateNotifier() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersion, setNewVersion] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const isCheckingRef = useRef(false);

  const checkForUpdate = useCallback(async () => {
    if (isCheckingRef.current || typeof window === 'undefined') return;
    isCheckingRef.current = true;

    try {
      // Cache-busted fetch to bypass any browser or CDN HTML/JSON caching
      const res = await fetch(`/version.json?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
        },
      });

      if (!res.ok) return;

      const remote: RemoteVersionInfo = await res.json();

      // Check if remote version is newer than current running bundle
      const isNewer =
        Boolean(remote.buildTimestamp && remote.buildTimestamp > BUILD_TIMESTAMP) ||
        (Boolean(remote.version) && remote.version !== APP_VERSION);

      if (isNewer) {
        setNewVersion(remote.version);
        setUpdateAvailable(true);
      }
    } catch {
      // Network offline or fetch failed; quietly continue
    } finally {
      isCheckingRef.current = false;
    }
  }, []);

  // 1. Initial check + periodic polling + window focus/visibility checks
  useEffect(() => {
    // Check shortly after mount
    const initialTimer = setTimeout(() => {
      checkForUpdate();
    }, 3000);

    // Periodic check every 5 minutes
    const interval = setInterval(checkForUpdate, 5 * 60 * 1000);

    // Check when user returns to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkForUpdate);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkForUpdate);
    };
  }, [checkForUpdate]);

  // 2. Automatic Chunk Load Error Recovery
  // If a new build was deployed and an old lazy-loaded chunk returns 404, auto-reload to get new chunks!
  useEffect(() => {
    const handleChunkError = (event: ErrorEvent) => {
      const msg = event.message || '';
      if (
        msg.includes('Loading chunk') ||
        msg.includes('ChunkLoadError') ||
        msg.includes('Failed to fetch dynamically imported module')
      ) {
        console.warn('[WatchMy.Run] Chunk load error detected; reloading latest version...');
        window.location.reload();
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = String(event.reason || '');
      if (
        reason.includes('Loading chunk') ||
        reason.includes('ChunkLoadError') ||
        reason.includes('Failed to fetch dynamically imported module')
      ) {
        console.warn('[WatchMy.Run] Chunk rejection detected; reloading latest version...');
        window.location.reload();
      }
    };

    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  const handleApplyUpdate = () => {
    // Clear any service worker / cached state if present and hard reload
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  if (!updateAvailable || dismissed) {
    return null;
  }

  return (
    <Affix position={{ bottom: 20, right: 20 }} zIndex={5000}>
      <Transition mounted={updateAvailable && !dismissed} transition="slide-up" duration={250}>
        {(transitionStyles) => (
          <Card
            withBorder
            shadow="xl"
            radius="lg"
            p="sm"
            style={{
              ...transitionStyles,
              background: 'var(--mantine-color-body)',
              border: '1.5px solid var(--mantine-color-cyan-6)',
              boxShadow: '0 8px 32px rgba(2, 132, 199, 0.25)',
              maxWidth: 360,
            }}
          >
            <Group justify="space-between" align="flex-start" wrap="nowrap" mb={6}>
              <Group gap="xs" wrap="nowrap">
                <ThemeIcon
                  size="md"
                  radius="md"
                  variant="gradient"
                  gradient={{ from: 'cyan', to: 'blue' }}
                >
                  <IconSparkles size={16} />
                </ThemeIcon>
                <div>
                  <Group gap={6} align="center">
                    <Text size="xs" fw={700}>
                      Update Ready
                    </Text>
                    {newVersion && (
                      <Badge size="xs" variant="light" color="cyan">
                        v{newVersion}
                      </Badge>
                    )}
                  </Group>
                  <Text size="11px" c="dimmed" mt={1}>
                    A new version of WatchMy.Run is available.
                  </Text>
                </div>
              </Group>
              <ActionIcon
                size="xs"
                variant="subtle"
                color="gray"
                onClick={() => setDismissed(true)}
                aria-label="Dismiss update notification"
              >
                <IconX size={12} />
              </ActionIcon>
            </Group>

            <Group justify="flex-end" gap="xs" mt={8}>
              <Button
                size="compact-xs"
                variant="subtle"
                color="gray"
                onClick={() => setDismissed(true)}
              >
                Later
              </Button>
              <Button
                size="compact-xs"
                variant="filled"
                color="cyan"
                leftSection={<IconRefresh size={12} />}
                onClick={handleApplyUpdate}
              >
                Update Now
              </Button>
            </Group>
          </Card>
        )}
      </Transition>
    </Affix>
  );
}
