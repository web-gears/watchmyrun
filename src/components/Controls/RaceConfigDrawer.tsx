'use client';

import { Stack, Accordion } from '@mantine/core';
import { MarathonInfo } from '@/lib/data/marathonRegistry';
import {
  RaceDistanceId,
  RaceDistanceOption,
} from '@/lib/data/newYorkCourses';
import {
  MarathonId,
  PacingStrategy,
  TrackingPin,
  SpectatorSpot,
  CheerSpotPreset,
  SpectatorMeetingWindow,
} from '@/lib/forecasting/types';
import { ActiveRaceCard } from './RaceConfig/ActiveRaceCard';
import { RunnerPacingSection } from './RaceConfig/RunnerPacingSection';
import { CheerStationsSection } from './RaceConfig/CheerStationsSection';
import { TrackingPinsSection } from './RaceConfig/TrackingPinsSection';
import { DrawerFooter } from './RaceConfig/DrawerFooter';

export interface RaceConfigDrawerProps {
  selectedMarathon: MarathonId;
  marathonInfo: MarathonInfo;
  onSelectMarathon: (id: MarathonId) => void;
  onOpenRaceModal: () => void;
  onCollapse?: () => void;
  selectedDistance: RaceDistanceId;
  onSelectDistance: (distance: RaceDistanceId) => void;
  distanceOption: RaceDistanceOption;
  startTimeStr: string;
  onStartTimeChange: (time: string) => void;
  finishTimeStr: string;
  onFinishTimeChange: (time: string) => void;
  paceStr: string;
  onPaceChange: (pace: string) => void;
  pacingUnit: 'km' | 'mi';
  onPacingUnitChange: (unit: 'km' | 'mi') => void;
  strategy: PacingStrategy;
  onStrategyChange: (strategy: PacingStrategy) => void;
  pins: TrackingPin[];
  calibratedPace?: {
    isCalibrated: boolean;
    paceMinPerKm: string;
    paceMinPerMi: string;
    summaryText: string;
    projectedFinishHms: string;
  };
  onApplyCalibratedPace?: () => void;
  onEditPin?: (pin: TrackingPin) => void;
  onRemovePin: (id: string) => void;
  onClearAllPins: () => void;
  isPinDropActive: boolean;
  onTogglePinDropMode: () => void;
  spectatorSpots: SpectatorSpot[];
  cheerPresets: CheerSpotPreset[];
  onTogglePresetSpot: (preset: CheerSpotPreset) => void;
  onAddCustomSpot: (distM: number, name?: string) => void;
  onRemoveSpot: (spotId: string) => void;
  onClearAllSpots: () => void;
  isCheerDropActive: boolean;
  onToggleCheerDropMode: () => void;
  meetingWindows?: SpectatorMeetingWindow[];
  onSetSpectatorMile?: (mile: number) => void;
  spectatorMile?: number;
  onClearSpectatorSpot?: () => void;
}

export function RaceConfigDrawer({
  selectedMarathon,
  marathonInfo,
  onOpenRaceModal,
  onCollapse,
  selectedDistance,
  onSelectDistance,
  distanceOption,
  startTimeStr,
  onStartTimeChange,
  finishTimeStr,
  onFinishTimeChange,
  paceStr,
  onPaceChange,
  pacingUnit,
  onPacingUnitChange,
  strategy,
  onStrategyChange,
  pins,
  calibratedPace,
  onApplyCalibratedPace,
  onEditPin,
  onRemovePin,
  onClearAllPins,
  isPinDropActive,
  onTogglePinDropMode,
  spectatorSpots,
  cheerPresets,
  onTogglePresetSpot,
  onAddCustomSpot,
  onRemoveSpot,
  onClearAllSpots,
  isCheerDropActive,
  onToggleCheerDropMode,
  meetingWindows,
}: RaceConfigDrawerProps) {
  return (
    <Stack gap="sm" p="sm" style={{ width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
      {/* 1. Compact Active Race Card */}
      <ActiveRaceCard
        marathonInfo={marathonInfo}
        selectedMarathon={selectedMarathon}
        selectedDistance={selectedDistance}
        distanceOption={distanceOption}
        onOpenRaceModal={onOpenRaceModal}
        onSelectDistance={onSelectDistance}
        onCollapse={onCollapse}
      />

      {/* 2. Unified Collapsible Sections */}
      <Accordion
        multiple
        defaultValue={['runner', 'pins', 'cheer']}
        variant="separated"
        radius="md"
        styles={{
          item: {
            border: '1px solid var(--mantine-color-default-border)',
            background: 'var(--mantine-color-default)',
            overflow: 'hidden',
          },
          control: {
            padding: '10px 12px',
            minHeight: 48,
          },
          content: {
            padding: '8px 10px 14px',
          },
        }}
      >
        <RunnerPacingSection
          marathonInfo={marathonInfo}
          startTimeStr={startTimeStr}
          onStartTimeChange={onStartTimeChange}
          finishTimeStr={finishTimeStr}
          onFinishTimeChange={onFinishTimeChange}
          paceStr={paceStr}
          onPaceChange={onPaceChange}
          pacingUnit={pacingUnit}
          onPacingUnitChange={onPacingUnitChange}
          strategy={strategy}
          onStrategyChange={onStrategyChange}
          calibratedPace={calibratedPace}
          onApplyCalibratedPace={onApplyCalibratedPace}
        />

        <TrackingPinsSection
          pins={pins}
          pacingUnit={pacingUnit}
          isPinDropActive={isPinDropActive}
          onTogglePinDropMode={onTogglePinDropMode}
          onEditPin={onEditPin}
          onRemovePin={onRemovePin}
          onClearAllPins={onClearAllPins}
        />

        <CheerStationsSection
          marathonInfo={marathonInfo}
          spectatorSpots={spectatorSpots}
          cheerPresets={cheerPresets}
          meetingWindows={meetingWindows}
          onTogglePresetSpot={onTogglePresetSpot}
          onAddCustomSpot={onAddCustomSpot}
          onRemoveSpot={onRemoveSpot}
          onClearAllSpots={onClearAllSpots}
          isCheerDropActive={isCheerDropActive}
          onToggleCheerDropMode={onToggleCheerDropMode}
        />
      </Accordion>

      {/* 3. Unified Footer */}
      <DrawerFooter />
    </Stack>
  );
}
