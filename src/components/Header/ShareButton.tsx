'use client';

import { useState } from 'react';
import {
  Popover,
  Tooltip,
  ActionIcon,
  Group,
  Text,
  Stack,
  Button,
  Box,
  Divider,
} from '@mantine/core';
import {
  IconShare,
  IconCheck,
  IconLink,
  IconMessageShare,
  IconSend,
} from '@tabler/icons-react';
import { SharePlanData, formatSpectatorCheatSheet } from '@/lib/share/formatSpectatorPlan';

interface ShareButtonProps {
  shareUrl: string;
  sharePlanData?: Omit<SharePlanData, 'shareUrl'>;
}

async function copyTextToClipboard(text: string): Promise<void> {
  let success = false;
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      success = true;
    }
  } catch {
    // Fallback below
  }

  if (!success && typeof document !== 'undefined') {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch {
      // Ignore
    }
  }
}

export function ShareButton({ shareUrl, sharePlanData }: ShareButtonProps) {
  const [opened, setOpened] = useState(false);
  const [copiedMode, setCopiedMode] = useState<'link' | 'plan' | null>(null);

  const getEffectiveUrl = () =>
    shareUrl || (typeof window !== 'undefined' ? window.location.href : 'https://watchmy.run');

  const getCheatSheetText = () => {
    const url = getEffectiveUrl();
    if (!sharePlanData) return url;
    return formatSpectatorCheatSheet({
      ...sharePlanData,
      shareUrl: url,
    });
  };

  const handleCopyLink = async () => {
    const url = getEffectiveUrl();
    await copyTextToClipboard(url);
    setCopiedMode('link');
    setTimeout(() => {
      setCopiedMode(null);
      setOpened(false);
    }, 1600);
  };

  const handleCopyPlan = async () => {
    const text = getCheatSheetText();
    await copyTextToClipboard(text);
    setCopiedMode('plan');
    setTimeout(() => {
      setCopiedMode(null);
      setOpened(false);
    }, 1800);
  };

  const handleNativeShare = async () => {
    const url = getEffectiveUrl();
    const text = getCheatSheetText();
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: sharePlanData
            ? `${sharePlanData.marathonInfo.name} — Spectator Plan`
            : 'WatchMy.Run - Phone-Free Marathon Tracker',
          text,
          url,
        });
        setOpened(false);
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return;
      }
    }
  };

  const canNativeShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const spotCount =
    sharePlanData?.spectatorWindows?.length ||
    sharePlanData?.spectatorSpots?.length ||
    0;

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-end"
      withArrow
      shadow="lg"
      radius="md"
      width={276}
    >
      <Popover.Target>
        <Tooltip label="Share link or spectator plan" disabled={opened}>
          <ActionIcon
            size="lg"
            variant={copiedMode ? 'filled' : opened ? 'light' : 'default'}
            radius="md"
            onClick={() => setOpened((o) => !o)}
            color={copiedMode ? 'teal' : opened ? 'cyan' : undefined}
            aria-label="Share race tracking link or spectator cheat sheet"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            {copiedMode ? <IconCheck size={20} color="white" /> : <IconShare size={20} />}
          </ActionIcon>
        </Tooltip>
      </Popover.Target>

      <Popover.Dropdown p="xs">
        <Stack gap={6}>
          <Box px={4} py={2}>
            <Text size="xs" fw={700}>
              Share Race & Spectator Plan
            </Text>
            <Text size="11px" c="dimmed">
              Send to your family or group chat
            </Text>
          </Box>

          {/* Option 1: Copy Spectator Cheat Sheet (Formatted for WhatsApp / iMessage) */}
          <Button
            variant={copiedMode === 'plan' ? 'filled' : 'light'}
            color={copiedMode === 'plan' ? 'teal' : 'cyan'}
            size="xs"
            radius="sm"
            fullWidth
            justify="flex-start"
            leftSection={
              copiedMode === 'plan' ? <IconCheck size={15} /> : <IconMessageShare size={15} />
            }
            onClick={handleCopyPlan}
            styles={{
              root: { height: 38 },
              inner: { justifyContent: 'flex-start' },
            }}
          >
            {copiedMode === 'plan'
              ? 'Copied Spectator Cheat Sheet!'
              : spotCount > 0
              ? `Copy Spectator Cheat Sheet (${spotCount} ${spotCount === 1 ? 'spot' : 'spots'})`
              : 'Copy Spectator Cheat Sheet'}
          </Button>

          {/* Option 2: Copy Direct URL */}
          <Button
            variant={copiedMode === 'link' ? 'filled' : 'default'}
            color={copiedMode === 'link' ? 'teal' : undefined}
            size="xs"
            radius="sm"
            fullWidth
            justify="flex-start"
            leftSection={
              copiedMode === 'link' ? <IconCheck size={15} /> : <IconLink size={15} />
            }
            onClick={handleCopyLink}
            styles={{
              root: { height: 36 },
              inner: { justifyContent: 'flex-start' },
            }}
          >
            {copiedMode === 'link' ? 'Link copied to clipboard!' : 'Copy Direct Map Link'}
          </Button>

          {/* Option 3: Native Share Sheet on Mobile */}
          {canNativeShare && (
            <>
              <Divider my={2} />
              <Button
                variant="subtle"
                color="gray"
                size="compact-xs"
                fullWidth
                leftSection={<IconSend size={13} />}
                onClick={handleNativeShare}
              >
                More Share Options…
              </Button>
            </>
          )}
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}
