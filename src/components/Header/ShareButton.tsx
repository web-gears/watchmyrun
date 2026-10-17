'use client';

import { useState } from 'react';
import { Popover, Tooltip, ActionIcon, Group, Text } from '@mantine/core';
import { IconShare, IconCheck } from '@tabler/icons-react';

interface ShareButtonProps {
  shareUrl: string;
}

export function ShareButton({ shareUrl }: ShareButtonProps) {
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
      // Clipboard API failed, fallback to textarea
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
        // Fallback failed
      }
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
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
            style={{ minWidth: 44, minHeight: 44 }}
          >
            {copied ? <IconCheck size={20} color="white" /> : <IconShare size={20} />}
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
  );
}
