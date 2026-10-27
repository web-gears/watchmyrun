'use client';

import { SpectatorMeetingWindow } from '@/lib/forecasting/types';
import { MobileSpectatorTicker } from './MobileSpectatorTicker';
import { DesktopSpectatorCard } from './DesktopSpectatorCard';

export interface SpectatorWindowCardProps {
  meetingWindow?: SpectatorMeetingWindow;
  meetingWindows?: SpectatorMeetingWindow[];
  onClose: () => void;
  onRemoveSpot?: (spotId: string) => void;
  onCopyCheatSheet?: () => void;
  isMobile?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function SpectatorWindowCard({
  meetingWindow,
  meetingWindows,
  onClose,
  onRemoveSpot,
  onCopyCheatSheet,
  isMobile = false,
  isExpanded,
  onToggleExpand,
}: SpectatorWindowCardProps) {
  // Normalize to an array of meeting windows
  const windows =
    meetingWindows && meetingWindows.length > 0
      ? meetingWindows
      : meetingWindow
      ? [meetingWindow]
      : [];

  if (windows.length === 0) return null;

  if (isMobile) {
    return (
      <MobileSpectatorTicker
        windows={windows}
        onClose={onClose}
        onRemoveSpot={onRemoveSpot}
        onCopyCheatSheet={onCopyCheatSheet}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
      />
    );
  }

  return (
    <DesktopSpectatorCard
      windows={windows}
      onClose={onClose}
      onRemoveSpot={onRemoveSpot}
      onCopyCheatSheet={onCopyCheatSheet}
    />
  );
}
