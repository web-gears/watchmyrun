'use client';

import {
  Modal,
  Stack,
  Group,
  Text,
  Button,
  Box,
  List,
} from '@mantine/core';
import { IconAlertTriangle, IconMapPin, IconFlag } from '@tabler/icons-react';

export interface SwitchRaceConfirmModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentMarathonName: string;
  targetMarathonName: string;
  pinsCount: number;
  spotsCount: number;
}

export function SwitchRaceConfirmModal({
  opened,
  onClose,
  onConfirm,
  currentMarathonName,
  targetMarathonName,
  pinsCount,
  spotsCount,
}: SwitchRaceConfirmModalProps) {
  const parts: string[] = [];
  if (pinsCount > 0) {
    parts.push(`${pinsCount} tracking pin${pinsCount > 1 ? 's' : ''}`);
  }
  if (spotsCount > 0) {
    parts.push(`${spotsCount} cheer station${spotsCount > 1 ? 's' : ''}`);
  }
  const summaryText = parts.join(' and ');

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs" wrap="nowrap">
          <Box
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
              flexShrink: 0,
            }}
          >
            <IconAlertTriangle size={18} stroke={2.2} />
          </Box>
          <Text fw={700} size="md">
            Switch to {targetMarathonName}?
          </Text>
        </Group>
      }
      radius="lg"
      centered
      size="sm"
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}
    >
      <Stack gap="md" pt="xs">
        <Text size="sm" c="dimmed" style={{ lineHeight: 1.4 }}>
          You have <strong>{summaryText}</strong> configured for {currentMarathonName}.
          Switching races will load the new course map and clear these markers:
        </Text>

        <List
          size="xs"
          spacing={6}
          icon={
            <Box
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: 'rgba(100, 116, 139, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
              }}
            >
              <IconFlag size={11} />
            </Box>
          }
        >
          {pinsCount > 0 && (
            <List.Item>
              <strong>{pinsCount}</strong> tracking pin{pinsCount > 1 ? 's' : ''} (calibrated paces will reset)
            </List.Item>
          )}
          {spotsCount > 0 && (
            <List.Item>
              <strong>{spotsCount}</strong> cheer spot{spotsCount > 1 ? 's' : ''} (monitored meeting stations)
            </List.Item>
          )}
        </List>

        <Group justify="flex-end" gap="xs" mt="sm">
          <Button variant="default" size="sm" radius="md" onClick={onClose}>
            Keep {currentMarathonName}
          </Button>
          <Button
            color="cyan"
            variant="filled"
            size="sm"
            radius="md"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Switch Race
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
