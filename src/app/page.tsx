'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Drawer,
  Card,
  ScrollArea,
  Text,
  Group,
  Button,
  Badge,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconRun, IconMapPin, IconPlayerPlay, IconTrophy, IconAdjustments } from '@tabler/icons-react';
import { AppHeader } from '@/components/Header/AppHeader';
import { MapWrapper } from '@/components/Map/MapWrapper';
import { RaceConfigDrawer } from '@/components/Controls/RaceConfigDrawer';
import { RaceSelectionModal } from '@/components/Controls/RaceSelectionModal';
import { HowItWorksModal } from '@/components/Controls/HowItWorksModal';
import { PinDropModal } from '@/components/Controls/PinDropModal';
import { EditPinModal } from '@/components/Controls/EditPinModal';
import { RunnerStatusHUD } from '@/components/HUD/RunnerStatusHUD';
import { SpectatorWindowCard } from '@/components/HUD/SpectatorWindowCard';
import { UndoToast } from '@/components/Common/UndoToast';
import { SwitchRaceConfirmModal } from '@/components/Controls/SwitchRaceConfirmModal';
import {
  NEW_YORK_COURSES,
  RaceDistanceId,
  RACE_DISTANCE_OPTIONS,
  RaceDistanceOption,
} from '@/lib/data/newYorkCourses';
import { MAJOR_MARATHON_COURSES } from '@/lib/data/majorCourses';
import {
  MARATHON_REGISTRY,
  MarathonInfo,
  detectClosestMarathonByTimezone,
  findClosestMarathon,
} from '@/lib/data/marathonRegistry';
import {
  MarathonId,
  PacingStrategy,
  TrackingPin,
  RunnerForecastResult,
  SpectatorMeetingWindow,
  SpectatorSpot,
  CheerSpotPreset,
} from '@/lib/forecasting/types';
import {
  forecastRunner,
  calculateAllSpectatorWindows,
} from '@/lib/forecasting/forecastEngine';
import {
  finishTimeToSeconds,
  formatSecondsToHms,
  paceStringToSeconds,
} from '@/lib/forecasting/pacingModels';
import { interpolateAtDistance } from '@/lib/forecasting/geodesy';
import { snapCoordinateToCourse } from '@/lib/forecasting/snapToCourse';
import { parseUrlState, serializeUrlState } from '@/lib/state/urlState';

const LOCAL_STORAGE_MARATHON_KEY = 'follow_me_running_selected_marathon';
const LOCAL_STORAGE_DISTANCE_KEY = 'follow_me_running_selected_distance';
const LOCAL_STORAGE_VISITED_KEY = 'follow_me_running_has_visited';

export default function MarathonTrackerPage() {
  // 1. World Marathon Major Selection (New York, Boston, Chicago, London, Berlin, Tokyo)
  const [selectedMarathon, setSelectedMarathon] = useState<MarathonId>('new_york');
  const [selectedDistance, setSelectedDistance] = useState<RaceDistanceId>('marathon');
  const [raceModalOpen, setRaceModalOpen] = useState<boolean>(false);
  const [howItWorksModalOpen, setHowItWorksModalOpen] = useState<boolean>(false);
  const [pendingMarathonId, setPendingMarathonId] = useState<MarathonId | null>(null);
  const [undoToast, setUndoToast] = useState<{ message: string; action: () => void } | null>(null);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  const marathonInfo: MarathonInfo = useMemo(() => {
    return MARATHON_REGISTRY[selectedMarathon] || MARATHON_REGISTRY.new_york;
  }, [selectedMarathon]);

  const courseData = useMemo(() => {
    if (selectedMarathon === 'new_york' && selectedDistance !== 'marathon') {
      return NEW_YORK_COURSES[selectedDistance] || MAJOR_MARATHON_COURSES.new_york;
    }
    return MAJOR_MARATHON_COURSES[selectedMarathon] || MAJOR_MARATHON_COURSES.new_york;
  }, [selectedMarathon, selectedDistance]);

  const distanceOption: RaceDistanceOption = useMemo(() => {
    if (selectedMarathon === 'new_york') {
      return (
        RACE_DISTANCE_OPTIONS.find((opt) => opt.id === selectedDistance) ||
        RACE_DISTANCE_OPTIONS[0]
      );
    }

    return {
      id: 'marathon',
      label: `${marathonInfo.name} (${marathonInfo.distanceKm} km)`,
      subLabel: `${marathonInfo.distanceMi} mi • ${marathonInfo.elevationHighlight}`,
      distanceKm: marathonInfo.distanceKm,
      distanceMi: marathonInfo.distanceMi,
      defaultTime: marathonInfo.defaultFinishTime,
      defaultPace: marathonInfo.defaultPace,
      course: courseData,
      cheerPresets: marathonInfo.cheerPresets,
    };
  }, [selectedMarathon, selectedDistance, marathonInfo, courseData]);

  const cheerPresets: CheerSpotPreset[] = useMemo(() => {
    if (selectedMarathon === 'new_york' && selectedDistance !== 'marathon') {
      const opt = RACE_DISTANCE_OPTIONS.find((o) => o.id === selectedDistance);
      return opt?.cheerPresets || marathonInfo.cheerPresets;
    }
    return marathonInfo.cheerPresets;
  }, [selectedMarathon, selectedDistance, marathonInfo]);

  // 2. Timing & Pacing Configuration (Starts EMPTY until user enters data)
  const [startTimeStr, setStartTimeStr] = useState<string>(marathonInfo.defaultStartTime);
  const [finishTimeStr, setFinishTimeStr] = useState<string>('');
  const [paceStr, setPaceStr] = useState<string>('');
  const [pacingUnit, setPacingUnit] = useState<'km' | 'mi'>('km');
  const [strategy, setStrategy] = useState<PacingStrategy>('fatigue');

  // 3. Tracking Pins (AirTag / Geo Pin Fixes)
  const [pins, setPins] = useState<TrackingPin[]>([]);
  const [isPinDropActive, setIsPinDropActive] = useState<boolean>(false);
  const [pinModalOpen, setPinModalOpen] = useState<boolean>(false);
  const [clickedCoord, setClickedCoord] = useState<{ lat: number; lon: number } | null>(null);
  const [editingPin, setEditingPin] = useState<TrackingPin | null>(null);

  // 4. Spectator Cheer Stations (Multi-Spot & Custom)
  const [spectatorSpots, setSpectatorSpots] = useState<SpectatorSpot[]>([]);
  const [isCheerDropActive, setIsCheerDropActive] = useState<boolean>(false);
  const spectatorDistM = spectatorSpots[0]?.distM;
  const spectatorMile = spectatorSpots[0] ? Math.round(spectatorSpots[0].mile) : undefined;
  const spectatorDistMList = useMemo(() => spectatorSpots.map((s) => s.distM), [spectatorSpots]);

  // 5. Mobile Drawer & Desktop Panel
  const [mobileDrawerOpened, { open: openMobileDrawer, close: closeMobileDrawer }] =
    useDisclosure(false);
  const [desktopDrawerCollapsed, setDesktopDrawerCollapsed] = useState(false);

  // 6. Clock & Simulation State (Off by default on clean load)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [isSimulationMode, setIsSimulationMode] = useState<boolean>(false);
  const [simulationElapsedSeconds, setSimulationElapsedSeconds] = useState<number>(0);
  const [isPlayingSimulation, setIsPlayingSimulation] = useState<boolean>(false);
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if runner data has been provided
  const hasRunnerData = Boolean(
    (paceStr && paceStr.trim() !== '') ||
    (finishTimeStr && finishTimeStr.trim() !== '') ||
    pins.length > 0
  );

  // Live clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Play / Pause Simulation Timer
  useEffect(() => {
    if (isPlayingSimulation) {
      playTimerRef.current = setInterval(() => {
        setSimulationElapsedSeconds((prev) => {
          const targetFinish = finishTimeToSeconds(finishTimeStr || distanceOption.defaultTime);
          if (prev >= targetFinish) {
            setIsPlayingSimulation(false);
            return targetFinish;
          }
          return prev + 60; // Advance 1 minute of race time every 500ms real time
        });
      }, 500);
    } else if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
      playTimerRef.current = null;
    }

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlayingSimulation, finishTimeStr, distanceOption.defaultTime]);

  // Initial mount: load URL state or localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const urlState = parseUrlState(searchParams);
      const storedMarathon = localStorage.getItem(LOCAL_STORAGE_MARATHON_KEY) as MarathonId | null;
      const storedDistance = localStorage.getItem(LOCAL_STORAGE_DISTANCE_KEY) as RaceDistanceId | null;
      const hasVisited = localStorage.getItem(LOCAL_STORAGE_VISITED_KEY);

      let initialMarathon: MarathonId = 'new_york';

      if (urlState.marathon && MARATHON_REGISTRY[urlState.marathon]) {
        initialMarathon = urlState.marathon;
        setSelectedMarathon(urlState.marathon);
      } else if (storedMarathon && MARATHON_REGISTRY[storedMarathon]) {
        initialMarathon = storedMarathon;
        setSelectedMarathon(storedMarathon);
      } else {
        // First visit: select closest race based on user's location (timezone heuristic)
        const closestByTz = detectClosestMarathonByTimezone();
        initialMarathon = closestByTz;
        setSelectedMarathon(closestByTz);

        // Refine with browser geolocation coordinates if available
        if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const closestGeo = findClosestMarathon(pos.coords.latitude, pos.coords.longitude);
              setSelectedMarathon(closestGeo);
            },
            () => {
              // Denied or unavailable: timezone heuristic already applied
            },
            { timeout: 6000, maximumAge: 300000 }
          );
        }
      }

      // Display How It Works popup on first visit
      if (!hasVisited && !urlState.marathon) {
        setHowItWorksModalOpen(true);
        localStorage.setItem(LOCAL_STORAGE_VISITED_KEY, 'true');
      }

      if (urlState.distance && NEW_YORK_COURSES[urlState.distance]) {
        setSelectedDistance(urlState.distance);
      } else if (storedDistance && NEW_YORK_COURSES[storedDistance]) {
        setSelectedDistance(storedDistance);
      }

      const activeCourse =
        initialMarathon === 'new_york' && urlState.distance && NEW_YORK_COURSES[urlState.distance]
          ? NEW_YORK_COURSES[urlState.distance]
          : MAJOR_MARATHON_COURSES[initialMarathon] || MAJOR_MARATHON_COURSES.new_york;

      if (urlState.startTime) setStartTimeStr(urlState.startTime);
      else {
        const info = MARATHON_REGISTRY[initialMarathon];
        if (info) setStartTimeStr(info.defaultStartTime);
      }

      if (urlState.finishTime) setFinishTimeStr(urlState.finishTime);
      if (urlState.pace) setPaceStr(urlState.pace);
      if (urlState.strategy) setStrategy(urlState.strategy);
      if (urlState.pins && urlState.pins.length > 0) setPins(urlState.pins);

      if (urlState.spectatorDistMList && urlState.spectatorDistMList.length > 0) {
        const spots: SpectatorSpot[] = urlState.spectatorDistMList.map((m, idx) => {
          const interp = interpolateAtDistance(activeCourse.points, m);
          const mile = m / 1609.344;
          return {
            id: `spec_url_${idx}_${Math.round(m)}`,
            name: `Mile ${mile.toFixed(1)} (${(m / 1000).toFixed(1)} km)`,
            distM: m,
            mile,
            lat: interp.lat,
            lon: interp.lon,
            ele: interp.ele,
          };
        });
        setSpectatorSpots(spots);
      } else if (urlState.spectatorDistM) {
        const m = urlState.spectatorDistM;
        const interp = interpolateAtDistance(activeCourse.points, m);
        const mile = m / 1609.344;
        setSpectatorSpots([
          {
            id: `spec_url_${Math.round(m)}`,
            name: `Mile ${mile.toFixed(1)} (${(m / 1000).toFixed(1)} km)`,
            distM: m,
            mile,
            lat: interp.lat,
            lon: interp.lon,
            ele: interp.ele,
          },
        ]);
      }
    }
  }, []);

  // Sync state to URL and localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_MARATHON_KEY, selectedMarathon);
      localStorage.setItem(LOCAL_STORAGE_DISTANCE_KEY, selectedDistance);

      const queryString = serializeUrlState({
        marathon: selectedMarathon,
        distance: selectedMarathon === 'new_york' ? selectedDistance : undefined,
        startTime: startTimeStr,
        finishTime: finishTimeStr,
        pace: paceStr,
        strategy,
        pins,
        spectatorDistMList: spectatorSpots.map((s) => s.distM),
        spectatorDistM: spectatorSpots[0]?.distM,
      });
      const newUrl = queryString ? `?${queryString}` : window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [selectedMarathon, selectedDistance, startTimeStr, finishTimeStr, paceStr, strategy, pins, spectatorSpots]);

  // Reversible action undo handlers
  const triggerUndo = useCallback((message: string, action: () => void) => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }
    setUndoToast({ message, action });
    undoTimerRef.current = setTimeout(() => {
      setUndoToast(null);
    }, 8000);
  }, []);

  const handleUndo = useCallback(() => {
    if (undoToast) {
      undoToast.action();
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
      setUndoToast(null);
    }
  }, [undoToast]);

  const handleCloseUndo = useCallback(() => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }
    setUndoToast(null);
  }, []);

  // Handle switching World Marathon Majors with confirmation if data exists
  const confirmMarathonChange = useCallback(
    (marathonId: MarathonId) => {
      setSelectedMarathon(marathonId);
      setSelectedDistance('marathon');

      const info = MARATHON_REGISTRY[marathonId];
      if (info) {
        setStartTimeStr(info.defaultStartTime);
        // Update goal finish time and pace to match the newly selected major's baseline
        if (finishTimeStr && paceStr) {
          setFinishTimeStr(info.defaultFinishTime);
          setPaceStr(info.defaultPace);
        }
      }

      // Reset pins and spectator stations when changing courses
      setPins([]);
      setSpectatorSpots([]);
      setPendingMarathonId(null);
    },
    [finishTimeStr, paceStr]
  );

  const handleMarathonChange = useCallback(
    (marathonId: MarathonId) => {
      if (marathonId === selectedMarathon) return;

      // Guard against accidental data loss if tracking pins or cheer spots are configured
      if (pins.length > 0 || spectatorSpots.length > 0) {
        setPendingMarathonId(marathonId);
        return;
      }

      confirmMarathonChange(marathonId);
    },
    [selectedMarathon, pins.length, spectatorSpots.length, confirmMarathonChange]
  );

  // Handle switching distances for New York
  const handleDistanceChange = (distId: RaceDistanceId) => {
    setSelectedDistance(distId);
    const opt = RACE_DISTANCE_OPTIONS.find((o) => o.id === distId) || RACE_DISTANCE_OPTIONS[0];

    // If user already had set a finish time, update it to match the new distance
    if (finishTimeStr && paceStr) {
      setFinishTimeStr(opt.defaultTime);
      setPaceStr(opt.defaultPace);
    }

    // Filter out spectator cheer spots that exceed the new distance
    setSpectatorSpots((prev) => prev.filter((s) => s.distM <= opt.course.distanceM));
  };

  // Synchronize pace and finish time inputs using active distance
  const handlePaceChange = (newPace: string) => {
    setPaceStr(newPace);
    const secPerKm = paceStringToSeconds(newPace, pacingUnit);
    if (secPerKm > 60 && secPerKm < 900) {
      const totalSecs = secPerKm * distanceOption.distanceKm;
      setFinishTimeStr(formatSecondsToHms(totalSecs));
    }
  };

  const handleFinishTimeChange = (newTime: string) => {
    setFinishTimeStr(newTime);
    const totalSecs = finishTimeToSeconds(newTime);
    if (totalSecs > 600 && totalSecs < 36000) {
      const secPerKm = totalSecs / distanceOption.distanceKm;
      const targetSec = pacingUnit === 'mi' ? secPerKm * 1.609344 : secPerKm;
      const m = Math.floor(targetSec / 60);
      const s = Math.floor(targetSec % 60);
      setPaceStr(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }
  };

  // Quick Demo Simulation Trigger
  const handleStartDemo = () => {
    setFinishTimeStr(distanceOption.defaultTime);
    setPaceStr(distanceOption.defaultPace);
    setIsSimulationMode(true);
    const totalSecs = finishTimeToSeconds(distanceOption.defaultTime);
    setSimulationElapsedSeconds(Math.round(totalSecs * 0.35)); // 35% through the course
  };

  // Build Start Date Object
  const startDate = useMemo(() => {
    const d = new Date(currentTime);
    const parts = startTimeStr.split(':').map((v) => parseInt(v, 10));
    d.setHours(parts[0] || 9, parts[1] || 10, parts[2] || 0, 0);
    return d;
  }, [currentTime, startTimeStr]);

  const targetFinishSeconds = useMemo(() => {
    if (!finishTimeStr) return 0;
    return finishTimeToSeconds(finishTimeStr);
  }, [finishTimeStr]);

  // Query Date for Forecast: either real current time, or simulated race time
  const effectiveQueryTime = useMemo(() => {
    if (isSimulationMode) {
      return new Date(startDate.getTime() + simulationElapsedSeconds * 1000);
    }
    return currentTime;
  }, [isSimulationMode, startDate, simulationElapsedSeconds, currentTime]);

  // Compute Runner Forecast ONLY when runner tracking data exists
  const forecast: RunnerForecastResult | null = useMemo(() => {
    if (!courseData || !hasRunnerData || targetFinishSeconds <= 0) return null;
    return forecastRunner(
      courseData,
      startDate,
      targetFinishSeconds,
      strategy,
      pins,
      effectiveQueryTime
    );
  }, [courseData, hasRunnerData, startDate, targetFinishSeconds, strategy, pins, effectiveQueryTime]);

  // Compute Spectator Windows (for all monitored stations)
  const spectatorWindows: SpectatorMeetingWindow[] = useMemo(() => {
    if (!courseData || !forecast || spectatorSpots.length === 0) return [];
    return calculateAllSpectatorWindows(courseData, spectatorSpots, forecast, effectiveQueryTime);
  }, [courseData, forecast, spectatorSpots, effectiveQueryTime]);

  const spectatorWindow: SpectatorMeetingWindow | null = useMemo(() => {
    if (spectatorWindows.length === 0) return null;
    return spectatorWindows.find((w) => !w.hasRunnerPassed) || spectatorWindows[spectatorWindows.length - 1];
  }, [spectatorWindows]);

  // Map click handler (ONLY triggers if user explicitly enabled Pin Drop Mode)
  const handleMapClick = useCallback(
    (lat: number, lon: number) => {
      if (!isPinDropActive) return; // Ignore regular clicks/double-clicks for normal map navigation!
      setClickedCoord({ lat, lon });
      setPinModalOpen(true);
      setIsPinDropActive(false);
    },
    [isPinDropActive]
  );

  const handleSavePin = useCallback((pin: TrackingPin) => {
    setPins((prev) => [...prev, pin]);
    // Immediately recalibrate and update target pace & goal time to reflect the dropped pin!
    if (pin.impliedPaceSecPerKm && pin.impliedPaceSecPerKm > 60) {
      const totalSec = Math.round(pin.impliedPaceSecPerKm * distanceOption.distanceKm);
      setFinishTimeStr(formatSecondsToHms(totalSec));
      const targetSec = pacingUnit === 'mi' ? pin.impliedPaceSecPerKm * 1.609344 : pin.impliedPaceSecPerKm;
      const m = Math.floor(targetSec / 60);
      const s = Math.floor(targetSec % 60);
      setPaceStr(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    } else if (!finishTimeStr) {
      setFinishTimeStr(distanceOption.defaultTime);
      setPaceStr(distanceOption.defaultPace);
    }
  }, [distanceOption.distanceKm, distanceOption.defaultTime, distanceOption.defaultPace, finishTimeStr, pacingUnit]);

  const handleApplyCalibratedPace = useCallback(() => {
    if (forecast?.calibratedPace?.isCalibrated) {
      const paceClean = (pacingUnit === 'km'
        ? forecast.calibratedPace.paceMinPerKm
        : forecast.calibratedPace.paceMinPerMi
      ).replace(/\/km|\/mi/, '');
      setPaceStr(paceClean);
      setFinishTimeStr(forecast.calibratedPace.projectedFinishHms);
    }
  }, [forecast?.calibratedPace, pacingUnit]);

  const handleEditPin = useCallback((pin: TrackingPin) => {
    setEditingPin(pin);
  }, []);

  const handleUpdatePin = useCallback((updatedPin: TrackingPin) => {
    setPins((prev) => prev.map((p) => (p.id === updatedPin.id ? updatedPin : p)));
    // When a pin is dragged or edited on the map, immediately recalibrate live pace & goal time!
    if (updatedPin.impliedPaceSecPerKm && updatedPin.impliedPaceSecPerKm > 60) {
      const totalSec = Math.round(updatedPin.impliedPaceSecPerKm * distanceOption.distanceKm);
      setFinishTimeStr(formatSecondsToHms(totalSec));
      const targetSec = pacingUnit === 'mi' ? updatedPin.impliedPaceSecPerKm * 1.609344 : updatedPin.impliedPaceSecPerKm;
      const m = Math.floor(targetSec / 60);
      const s = Math.floor(targetSec % 60);
      setPaceStr(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }
  }, [distanceOption.distanceKm, pacingUnit]);

  const handleRemovePin = useCallback(
    (id: string) => {
      const pinToRemove = pins.find((p) => p.id === id);
      if (!pinToRemove) return;
      const previousPins = [...pins];
      setPins((prev) => prev.filter((p) => p.id !== id));
      setEditingPin((cur) => (cur?.id === id ? null : cur));
      triggerUndo(
        `Removed pin at Mile ${(pinToRemove.snappedDistM / 1609.344).toFixed(1)}`,
        () => setPins(previousPins)
      );
    },
    [pins, triggerUndo]
  );

  const handleClearAllPins = useCallback(() => {
    if (pins.length === 0) return;
    const previousPins = [...pins];
    setPins([]);
    triggerUndo(
      `Cleared ${previousPins.length} tracking pin${previousPins.length > 1 ? 's' : ''}`,
      () => setPins(previousPins)
    );
  }, [pins, triggerUndo]);

  const handleTogglePresetSpot = useCallback(
    (preset: CheerSpotPreset) => {
      setSpectatorSpots((prev) => {
        const exists = prev.some((s) => s.id === preset.id);
        if (exists) {
          return prev.filter((s) => s.id !== preset.id);
        }
        const interp = interpolateAtDistance(courseData.points, preset.distM);
        const spot: SpectatorSpot = {
          id: preset.id,
          name: preset.name,
          distM: preset.distM,
          mile: preset.mile,
          lat: interp.lat,
          lon: interp.lon,
          ele: interp.ele,
          isCustom: false,
        };
        return [...prev, spot].sort((a, b) => a.distM - b.distM);
      });
    },
    [courseData.points]
  );

  const handleAddCustomSpot = useCallback(
    (distM: number, name?: string) => {
      const clamped = Math.min(courseData.distanceM, Math.max(0, distM));
      const interp = interpolateAtDistance(courseData.points, clamped);
      const mile = clamped / 1609.344;
      const spot: SpectatorSpot = {
        id: `custom_${Date.now()}_${Math.round(clamped)}`,
        name: name || `Custom Spot - Mile ${mile.toFixed(1)}`,
        distM: clamped,
        mile,
        lat: interp.lat,
        lon: interp.lon,
        ele: interp.ele,
        isCustom: true,
      };
      setSpectatorSpots((prev) => [...prev, spot].sort((a, b) => a.distM - b.distM));
    },
    [courseData.distanceM, courseData.points]
  );

  const handleAddCustomCheerSpotFromMap = useCallback(
    (lat: number, lon: number) => {
      const snapped = snapCoordinateToCourse(lat, lon, courseData.points);
      if (!snapped) return;
      const mile = snapped.snappedDistM / 1609.344;
      const spot: SpectatorSpot = {
        id: `custom_map_${Date.now()}`,
        name: `Map Spot - Mile ${mile.toFixed(1)}`,
        distM: snapped.snappedDistM,
        mile,
        lat: snapped.snappedLat,
        lon: snapped.snappedLon,
        ele: snapped.snappedEle,
        isCustom: true,
      };
      setSpectatorSpots((prev) => [...prev, spot].sort((a, b) => a.distM - b.distM));
      setIsCheerDropActive(false);
    },
    [courseData.points]
  );

  const handleRemoveSpectatorSpot = useCallback(
    (spotId: string) => {
      const spotToRemove = spectatorSpots.find((s) => s.id === spotId);
      if (!spotToRemove) return;
      const previousSpots = [...spectatorSpots];
      setSpectatorSpots((prev) => prev.filter((s) => s.id !== spotId));
      triggerUndo(
        `Removed cheer station: ${spotToRemove.name}`,
        () => setSpectatorSpots(previousSpots)
      );
    },
    [spectatorSpots, triggerUndo]
  );

  const handleClearAllSpectatorSpots = useCallback(() => {
    if (spectatorSpots.length === 0) return;
    const previousSpots = [...spectatorSpots];
    setSpectatorSpots([]);
    triggerUndo(
      `Cleared ${previousSpots.length} cheer station${previousSpots.length > 1 ? 's' : ''}`,
      () => setSpectatorSpots(previousSpots)
    );
  }, [spectatorSpots, triggerUndo]);

  const handleSetSpectatorMile = useCallback(
    (mile: number) => {
      handleAddCustomSpot(mile * 1609.344, `Mile ${mile}`);
    },
    [handleAddCustomSpot]
  );

  const handleClearSpectatorSpot = useCallback(() => {
    handleClearAllSpectatorSpots();
  }, [handleClearAllSpectatorSpots]);

  return (
    <Box
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* 1. App Header with Interactive Race Selector */}
      <AppHeader
        marathonInfo={marathonInfo}
        onOpenRaceModal={() => setRaceModalOpen(true)}
        onOpenHowItWorksModal={() => setHowItWorksModalOpen(true)}
        distanceOption={distanceOption}
        onOpenMobileDrawer={openMobileDrawer}
        isMobileDrawerOpen={mobileDrawerOpened}
        onOpenPinModal={() => {
          setIsPinDropActive(true);
        }}
        statusBadgeText={
          forecast ? `Progress: ${forecast.progressPct}%` : 'Awaiting Pace Data'
        }
        shareUrl={typeof window !== 'undefined' ? window.location.href : ''}
      />

      {/* 2. Main Map View & Overlays */}
      <Box
        style={{
          flex: 1,
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {/* Full-bleed Map */}
        <MapWrapper
          course={courseData}
          forecast={forecast}
          pins={pins}
          startTimeStr={startTimeStr}
          spectatorSpots={spectatorSpots}
          onMapClick={handleMapClick}
          isPinDropActive={isPinDropActive}
          onCancelPinDrop={() => setIsPinDropActive(false)}
          isCheerDropActive={isCheerDropActive}
          onCancelCheerDrop={() => setIsCheerDropActive(false)}
          onAddCustomCheerSpot={handleAddCustomCheerSpotFromMap}
          onRemoveSpectatorSpot={handleRemoveSpectatorSpot}
          onEditPin={handleEditPin}
          onUpdatePin={handleUpdatePin}
          onRemovePin={handleRemovePin}
        />

        {/* Desktop Left Floating Marathon Configuration Card */}
        <Box
          visibleFrom="lg"
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            width: 360,
            maxWidth: 'calc(100vw - 32px)',
            zIndex: 1000,
            pointerEvents: desktopDrawerCollapsed ? 'none' : 'auto',
            transform: desktopDrawerCollapsed ? 'translateX(calc(-100% - 32px))' : 'translateX(0)',
            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
            opacity: desktopDrawerCollapsed ? 0 : 1,
          }}
        >
          <Card
            withBorder
            shadow="xl"
            radius="lg"
            p={0}
            className="glass-panel"
            style={{
              overflow: 'hidden',
              pointerEvents: 'auto',
              border: '1px solid var(--mantine-color-default-border)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}
            onWheel={(e) => e.stopPropagation()}
          >
            <ScrollArea.Autosize
              mah="calc(100vh - 84px)"
              type="scroll"
              scrollHideDelay={600}
              scrollbars="y"
              scrollbarSize={6}
              viewportProps={{ style: { overscrollBehavior: 'contain', overflowX: 'hidden', width: '100%', maxWidth: '100%', display: 'block' } }}
            >
              <RaceConfigDrawer
                selectedMarathon={selectedMarathon}
                marathonInfo={marathonInfo}
                onSelectMarathon={handleMarathonChange}
                onOpenRaceModal={() => setRaceModalOpen(true)}
                onCollapse={() => setDesktopDrawerCollapsed(true)}
                selectedDistance={selectedDistance}
                onSelectDistance={handleDistanceChange}
                distanceOption={distanceOption}
                startTimeStr={startTimeStr}
                onStartTimeChange={setStartTimeStr}
                finishTimeStr={finishTimeStr}
                onFinishTimeChange={handleFinishTimeChange}
                paceStr={paceStr}
                onPaceChange={handlePaceChange}
                pacingUnit={pacingUnit}
                onPacingUnitChange={setPacingUnit}
                strategy={strategy}
                onStrategyChange={setStrategy}
                pins={pins}
                calibratedPace={forecast?.calibratedPace}
                onApplyCalibratedPace={handleApplyCalibratedPace}
                onEditPin={handleEditPin}
                onRemovePin={handleRemovePin}
                onClearAllPins={handleClearAllPins}
                isPinDropActive={isPinDropActive}
                onTogglePinDropMode={() => setIsPinDropActive(!isPinDropActive)}
                spectatorSpots={spectatorSpots}
                cheerPresets={cheerPresets}
                onTogglePresetSpot={handleTogglePresetSpot}
                onAddCustomSpot={handleAddCustomSpot}
                onRemoveSpot={handleRemoveSpectatorSpot}
                onClearAllSpots={handleClearAllSpectatorSpots}
                isCheerDropActive={isCheerDropActive}
                onToggleCheerDropMode={() => setIsCheerDropActive(!isCheerDropActive)}
                meetingWindows={spectatorWindows}
                onSetSpectatorMile={handleSetSpectatorMile}
                spectatorMile={spectatorMile}
                onClearSpectatorSpot={handleClearSpectatorSpot}
              />
            </ScrollArea.Autosize>
          </Card>
        </Box>

        {/* Desktop Restore Pill Button when Left Floating Card is Collapsed */}
        <Box
          visibleFrom="lg"
          style={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 1000,
            pointerEvents: desktopDrawerCollapsed ? 'auto' : 'none',
            transform: desktopDrawerCollapsed ? 'translateX(0)' : 'translateX(-120%)',
            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease',
            opacity: desktopDrawerCollapsed ? 1 : 0,
          }}
        >
          <Button
            variant="default"
            radius="md"
            size="sm"
            className="glass-panel"
            leftSection={<Text size="sm">{marathonInfo.flag}</Text>}
            rightSection={<IconAdjustments size={14} />}
            onClick={() => setDesktopDrawerCollapsed(false)}
            style={{
              boxShadow: '0 4px 16px rgba(0,0,0,0.14)',
              border: '1px solid var(--mantine-color-default-border)',
              fontWeight: 600,
            }}
          >
            Race Controls
          </Button>
        </Box>

        {/* Bottom HUD: Live Forecast OR Awaiting Runner Data Prompt */}
        <Box
          className={`bottom-hud-container ${!desktopDrawerCollapsed ? 'bottom-hud-desktop-offset' : ''}`}
          style={{
            position: 'absolute',
            bottom: 16,
            zIndex: 1000,
            width: 'calc(100% - 32px)',
            maxWidth: 580,
            pointerEvents: 'auto',
          }}
        >
          {forecast ? (
            <RunnerStatusHUD
              marathonName={marathonInfo.name}
              forecast={forecast}
              points={courseData.points}
              spectatorDistM={spectatorDistM}
              spectatorDistMList={spectatorDistMList}
              isSimulationMode={isSimulationMode}
              onToggleSimulationMode={() => setIsSimulationMode(!isSimulationMode)}
              simulationElapsedSeconds={simulationElapsedSeconds}
              onSimulationElapsedChange={setSimulationElapsedSeconds}
              targetFinishSeconds={targetFinishSeconds}
              isPlayingSimulation={isPlayingSimulation}
              onTogglePlaySimulation={() => setIsPlayingSimulation(!isPlayingSimulation)}
              onResetToLive={() => {
                setIsSimulationMode(false);
                setIsPlayingSimulation(false);
              }}
            />
          ) : (
            <Card
              withBorder
              shadow="xl"
              radius="lg"
              p="sm"
              className="glass-panel"
              style={{
                border: '1px solid var(--mantine-color-default-border)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              }}
            >
              <Group justify="space-between" align="center" wrap="nowrap" mb={6}>
                <Group gap="xs" wrap="nowrap">
                  <Box
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    <IconRun size={18} stroke={2.2} />
                  </Box>
                  <div>
                    <Text fw={700} size="sm" style={{ lineHeight: 1.1 }}>
                      {marathonInfo.name}
                    </Text>
                    <Text size="11px" c="dimmed" style={{ lineHeight: 1.1 }}>
                      {marathonInfo.city} • {selectedMarathon === 'new_york' ? distanceOption.label : '42.2 km Course Loaded'}
                    </Text>
                  </div>
                </Group>
                <Group gap="xs" wrap="nowrap">
                  <Button
                    size="xs"
                    variant="subtle"
                    color="cyan"
                    leftSection={<IconTrophy size={13} />}
                    onClick={() => setRaceModalOpen(true)}
                  >
                    Change Race
                  </Button>
                  <Badge size="sm" variant="light" color="cyan">
                    Awaiting Runner Data
                  </Badge>
                </Group>
              </Group>

              {/* Phone-Free Explainer Callout */}
              <Box
                p="xs"
                mb="xs"
                style={{
                  background: 'rgba(2, 132, 199, 0.06)',
                  borderRadius: 8,
                  border: '1px solid rgba(2, 132, 199, 0.18)',
                }}
              >
                <Text size="xs" fw={700} c="cyan.8">
                  Phone-free tracking with AirTag or tracking pins
                </Text>
                <Text size="11px" c="dimmed" mt={2}>
                  Track your runner using AirTag updates or course checkpoints. Drop tracking pins to update live pace and cheer station arrival windows.
                </Text>
              </Box>

              <Text size="xs" c="dimmed" mb="xs">
                Select a goal time below or set custom pace in the controls panel:
              </Text>

              <Group gap="xs" wrap="wrap">
                {selectedDistance === 'marathon' && (
                  <>
                    <Button size="xs" variant="light" color="cyan" onClick={() => handleFinishTimeChange('03:15:00')}>
                      3h 15m
                    </Button>
                    <Button size="xs" variant="light" color="cyan" onClick={() => handleFinishTimeChange('03:30:00')}>
                      3h 30m
                    </Button>
                    <Button size="xs" variant="light" color="cyan" onClick={() => handleFinishTimeChange('03:45:00')}>
                      3h 45m
                    </Button>
                    <Button size="xs" variant="light" color="cyan" onClick={() => handleFinishTimeChange('04:00:00')}>
                      4h 00m
                    </Button>
                  </>
                )}
                {selectedMarathon === 'new_york' && selectedDistance === 'half' && (
                  <>
                    <Button size="xs" variant="light" color="cyan" onClick={() => handleFinishTimeChange('01:30:00')}>
                      1h 30m Goal
                    </Button>
                    <Button size="xs" variant="light" color="cyan" onClick={() => handleFinishTimeChange('01:45:00')}>
                      1h 45m Goal
                    </Button>
                    <Button size="xs" variant="light" color="cyan" onClick={() => handleFinishTimeChange('02:00:00')}>
                      2h 00m Goal
                    </Button>
                  </>
                )}
                {selectedMarathon === 'new_york' && selectedDistance === '10k' && (
                  <>
                    <Button size="xs" variant="light" color="cyan" onClick={() => handleFinishTimeChange('00:45:00')}>
                      45m Goal
                    </Button>
                    <Button size="xs" variant="light" color="cyan" onClick={() => handleFinishTimeChange('00:50:00')}>
                      50m Goal
                    </Button>
                    <Button size="xs" variant="light" color="cyan" onClick={() => handleFinishTimeChange('00:55:00')}>
                      55m Goal
                    </Button>
                  </>
                )}
                {selectedMarathon === 'new_york' && selectedDistance === '5k' && (
                  <>
                    <Button size="xs" variant="light" color="cyan" onClick={() => handleFinishTimeChange('00:22:00')}>
                      22m Goal
                    </Button>
                    <Button size="xs" variant="light" color="cyan" onClick={() => handleFinishTimeChange('00:25:00')}>
                      25m Goal
                    </Button>
                    <Button size="xs" variant="light" color="cyan" onClick={() => handleFinishTimeChange('00:30:00')}>
                      30m Goal
                    </Button>
                  </>
                )}

                <Button
                  size="xs"
                  variant="default"
                  leftSection={<IconMapPin size={14} />}
                  onClick={() => setIsPinDropActive(true)}
                >
                  Drop Pin
                </Button>

                <Button
                  size="xs"
                  variant="subtle"
                  color="violet"
                  leftSection={<IconPlayerPlay size={14} />}
                  onClick={handleStartDemo}
                >
                  Preview Simulation
                </Button>
              </Group>
            </Card>
          )}
        </Box>

        {/* Spectator Meeting Station Card */}
        {spectatorWindows.length > 0 && (
          <>
            {/* Desktop / Tablet View */}
            <Box
              visibleFrom="sm"
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                zIndex: 1000,
                pointerEvents: 'auto',
              }}
            >
              <SpectatorWindowCard
                meetingWindows={spectatorWindows}
                onClose={handleClearAllSpectatorSpots}
                onRemoveSpot={handleRemoveSpectatorSpot}
              />
            </Box>

            {/* Mobile View */}
            <Box
              hiddenFrom="sm"
              style={{
                position: 'absolute',
                top: 10,
                left: 10,
                right: 10,
                zIndex: 1000,
                pointerEvents: 'auto',
              }}
            >
              <SpectatorWindowCard
                meetingWindows={spectatorWindows}
                onClose={handleClearAllSpectatorSpots}
                onRemoveSpot={handleRemoveSpectatorSpot}
                isMobile
              />
            </Box>
          </>
        )}
      </Box>

      {/* 3. Mobile Slide-Over Drawer */}
      <Drawer
        opened={mobileDrawerOpened}
        onClose={closeMobileDrawer}
        title={
          <Group gap="xs">
            <Text size="lg">{marathonInfo.flag}</Text>
            <Text fw={700} size="md">
              {marathonInfo.shortName} Marathon Controls
            </Text>
          </Group>
        }
        position="left"
        size="md"
        radius="md"
        padding={0}
      >
        <ScrollArea.Autosize
          mah="calc(100dvh - 60px)"
          type="scroll"
          scrollHideDelay={600}
          scrollbars="y"
          scrollbarSize={6}
          viewportProps={{ style: { overscrollBehavior: 'contain', overflowX: 'hidden', width: '100%', maxWidth: '100%', display: 'block' } }}
        >
          <RaceConfigDrawer
            selectedMarathon={selectedMarathon}
            marathonInfo={marathonInfo}
            onSelectMarathon={(id) => {
              handleMarathonChange(id);
              closeMobileDrawer();
            }}
            onOpenRaceModal={() => {
              setRaceModalOpen(true);
              closeMobileDrawer();
            }}
            selectedDistance={selectedDistance}
            onSelectDistance={(d) => {
              handleDistanceChange(d);
              closeMobileDrawer();
            }}
            distanceOption={distanceOption}
            startTimeStr={startTimeStr}
            onStartTimeChange={setStartTimeStr}
            finishTimeStr={finishTimeStr}
            onFinishTimeChange={handleFinishTimeChange}
            paceStr={paceStr}
            onPaceChange={handlePaceChange}
            pacingUnit={pacingUnit}
            onPacingUnitChange={setPacingUnit}
            strategy={strategy}
            onStrategyChange={setStrategy}
            pins={pins}
            calibratedPace={forecast?.calibratedPace}
            onApplyCalibratedPace={handleApplyCalibratedPace}
            onEditPin={(pin) => {
              handleEditPin(pin);
              closeMobileDrawer();
            }}
            onRemovePin={handleRemovePin}
            onClearAllPins={handleClearAllPins}
            isPinDropActive={isPinDropActive}
            onTogglePinDropMode={() => {
              setIsPinDropActive(!isPinDropActive);
              closeMobileDrawer();
            }}
            spectatorSpots={spectatorSpots}
            cheerPresets={cheerPresets}
            onTogglePresetSpot={(preset) => {
              handleTogglePresetSpot(preset);
            }}
            onAddCustomSpot={(distM, name) => {
              handleAddCustomSpot(distM, name);
            }}
            onRemoveSpot={handleRemoveSpectatorSpot}
            onClearAllSpots={handleClearAllSpectatorSpots}
            isCheerDropActive={isCheerDropActive}
            onToggleCheerDropMode={() => {
              setIsCheerDropActive(!isCheerDropActive);
              closeMobileDrawer();
            }}
            meetingWindows={spectatorWindows}
            onSetSpectatorMile={handleSetSpectatorMile}
            spectatorMile={spectatorMile}
            onClearSpectatorSpot={handleClearSpectatorSpot}
          />
        </ScrollArea.Autosize>
      </Drawer>

      {/* 4. World Marathon Major Selection Modal */}
      <RaceSelectionModal
        opened={raceModalOpen}
        onClose={() => setRaceModalOpen(false)}
        selectedMarathon={selectedMarathon}
        onSelectMarathon={handleMarathonChange}
        selectedDistance={selectedDistance}
        onSelectDistance={handleDistanceChange}
      />

      {/* 4b. How It Works Modal */}
      <HowItWorksModal
        opened={howItWorksModalOpen}
        onClose={() => setHowItWorksModalOpen(false)}
        onSelectRace={() => setRaceModalOpen(true)}
        selectedMarathonName={marathonInfo.name}
      />

      {/* 5. Pin Drop Calibration Modal */}
      {courseData && (
        <PinDropModal
          opened={pinModalOpen}
          onClose={() => setPinModalOpen(false)}
          clickedCoord={clickedCoord}
          points={courseData.points}
          expectedDistM={forecast?.currentDistM}
          startTimeStr={startTimeStr}
          targetFinishSeconds={targetFinishSeconds || finishTimeToSeconds(distanceOption.defaultTime)}
          totalCourseDistM={courseData.distanceM}
          onSavePin={handleSavePin}
        />
      )}

      {/* 6. Pin Edit Modal */}
      {courseData && (
        <EditPinModal
          opened={Boolean(editingPin)}
          onClose={() => setEditingPin(null)}
          pin={editingPin}
          pinIndex={editingPin ? pins.findIndex((p) => p.id === editingPin.id) : 0}
          points={courseData.points}
          totalCourseDistM={courseData.distanceM}
          startTimeStr={startTimeStr}
          onSavePin={handleUpdatePin}
          onDeletePin={handleRemovePin}
        />
      )}

      {/* 7. Destructive Race Switch Confirmation Modal */}
      <SwitchRaceConfirmModal
        opened={Boolean(pendingMarathonId)}
        onClose={() => setPendingMarathonId(null)}
        onConfirm={() => {
          if (pendingMarathonId) {
            confirmMarathonChange(pendingMarathonId);
          }
        }}
        currentMarathonName={marathonInfo.name}
        targetMarathonName={
          pendingMarathonId ? MARATHON_REGISTRY[pendingMarathonId]?.name || '' : ''
        }
        pinsCount={pins.length}
        spotsCount={spectatorSpots.length}
      />

      {/* 8. Reversible Action Undo Notification (8-Second Safety Window) */}
      <UndoToast
        opened={Boolean(undoToast)}
        message={undoToast?.message || ''}
        onUndo={handleUndo}
        onClose={handleCloseUndo}
      />
    </Box>
  );
}
