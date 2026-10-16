'use client';

import dynamic from 'next/dynamic';
import { Skeleton, Center, Loader } from '@mantine/core';
import { CourseData, RunnerForecastResult, TrackingPin, SpectatorSpot } from '@/lib/forecasting/types';

interface MapWrapperProps {
  course: CourseData;
  forecast?: RunnerForecastResult | null;
  pins: TrackingPin[];
  spectatorLocation?: { lat: number; lon: number; distM: number };
  spectatorSpots?: SpectatorSpot[];
  startTimeStr?: string;
  onMapClick?: (lat: number, lon: number) => void;
  isPinDropActive?: boolean;
  onCancelPinDrop?: () => void;
  isCheerDropActive?: boolean;
  onCancelCheerDrop?: () => void;
  onAddCustomCheerSpot?: (lat: number, lon: number) => void;
  onRemoveSpectatorSpot?: (spotId: string) => void;
  onEditPin?: (pin: TrackingPin) => void;
  onUpdatePin?: (pin: TrackingPin) => void;
  onRemovePin?: (pinId: string) => void;
}

const DynamicMap = dynamic(
  () => import('./MarathonMap').then((mod) => mod.MarathonMap),
  {
    ssr: false,
    loading: () => (
      <Center style={{ width: '100%', height: '100%', minHeight: 400 }}>
        <Loader size="lg" color="cyan" type="bars" />
      </Center>
    ),
  }
);

export function MapWrapper(props: MapWrapperProps) {
  return <DynamicMap {...props} />;
}
