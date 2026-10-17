'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import { useComputedColorScheme, ActionIcon } from '@mantine/core';
import { IconPlus, IconMinus, IconFocus2 } from '@tabler/icons-react';
import { CourseData, RunnerForecastResult, TrackingPin, SpectatorSpot } from '@/lib/forecasting/types';
import { snapCoordinateToCourse } from '@/lib/forecasting/snapToCourse';
import { formatPace } from '@/lib/forecasting/pacingModels';

interface MarathonMapProps {
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

export function MarathonMap({
  course,
  forecast,
  pins,
  spectatorLocation,
  spectatorSpots,
  startTimeStr = '09:10',
  onMapClick,
  isPinDropActive,
  onCancelPinDrop,
  isCheerDropActive,
  onCancelCheerDrop,
  onAddCustomCheerSpot,
  onRemoveSpectatorSpot,
  onEditPin,
  onUpdatePin,
  onRemovePin,
}: MarathonMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);

  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const courseCasingRef = useRef<L.Polyline | null>(null);
  const courseLineRef = useRef<L.Polyline | null>(null);
  const precisionLineRef = useRef<L.Polyline | null>(null);
  const precisionCircleRef = useRef<L.Circle | null>(null);
  const runnerMarkerRef = useRef<L.Marker | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const finishMarkerRef = useRef<L.Marker | null>(null);
  const pinsGroupRef = useRef<L.LayerGroup | null>(null);
  const timingMatsGroupRef = useRef<L.LayerGroup | null>(null);
  const spectatorGroupRef = useRef<L.LayerGroup | null>(null);

  const onMapClickRef = useRef(onMapClick);
  onMapClickRef.current = onMapClick;

  const isCheerDropActiveRef = useRef(isCheerDropActive);
  isCheerDropActiveRef.current = isCheerDropActive;

  const onAddCustomCheerSpotRef = useRef(onAddCustomCheerSpot);
  onAddCustomCheerSpotRef.current = onAddCustomCheerSpot;

  const onRemoveSpectatorSpotRef = useRef(onRemoveSpectatorSpot);
  onRemoveSpectatorSpotRef.current = onRemoveSpectatorSpot;

  const onUpdatePinRef = useRef(onUpdatePin);
  onUpdatePinRef.current = onUpdatePin;

  const onEditPinRef = useRef(onEditPin);
  onEditPinRef.current = onEditPin;

  const onRemovePinRef = useRef(onRemovePin);
  onRemovePinRef.current = onRemovePin;

  const isDraggingRef = useRef<boolean>(false);

  const computedColorScheme = useComputedColorScheme('light', { getInitialValueInEffect: true });
  const isDark = computedColorScheme === 'dark';

  const cartoApiKey =
    process.env.NEXT_PUBLIC_CARTO_API_KEY || 'cb1_4m2v_1_aaedddd627ea284f61f71095';

  const tileUrl = isDark
    ? `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png?key=${cartoApiKey}`
    : `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${cartoApiKey}`;

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || map) return;

    const initialCenter: [number, number] = course.points[0]
      ? [course.points[0].lat, course.points[0].lon]
      : [40.6019, -74.0593];

    const mapInstance = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 12,
      zoomControl: false,
      doubleClickZoom: true,
      scrollWheelZoom: true,
      touchZoom: true,
    });

    const tileLayer = L.tileLayer(tileUrl, {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(mapInstance);

    tileLayerRef.current = tileLayer;

    // Layer groups
    pinsGroupRef.current = L.layerGroup().addTo(mapInstance);
    timingMatsGroupRef.current = L.layerGroup().addTo(mapInstance);
    spectatorGroupRef.current = L.layerGroup().addTo(mapInstance);

    // Map click
    mapInstance.on('click', (e: L.LeafletMouseEvent) => {
      if (isCheerDropActiveRef.current) {
        if (onAddCustomCheerSpotRef.current) {
          onAddCustomCheerSpotRef.current(e.latlng.lat, e.latlng.lng);
        }
      } else if (onMapClickRef.current) {
        onMapClickRef.current(e.latlng.lat, e.latlng.lng);
      }
    });

    setMap(mapInstance);

    // Ensure size calculation is fresh
    setTimeout(() => {
      mapInstance.invalidateSize();
    }, 150);

    return () => {
      mapInstance.remove();
      setMap(null);
    };
  }, []);

  // Invalidate size on resize
  useEffect(() => {
    if (!map) return;
    const handleResize = () => map.invalidateSize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);

  // 2. Update Tiles on Theme Change
  useEffect(() => {
    if (tileLayerRef.current) {
      tileLayerRef.current.setUrl(tileUrl);
    }
  }, [tileUrl]);

  // 3. Draw Course Polyline, Start & Finish Markers, Timing Mats
  useEffect(() => {
    if (!map || !course || course.points.length === 0) return;

    const positions: [number, number][] = course.points.map((p) => [p.lat, p.lon]);

    // Outer contrast casing
    if (!courseCasingRef.current) {
      courseCasingRef.current = L.polyline(positions, {
        color: isDark ? '#0f172a' : '#ffffff',
        weight: 8,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
    } else {
      courseCasingRef.current.setLatLngs(positions);
      courseCasingRef.current.setStyle({
        color: isDark ? '#0f172a' : '#ffffff',
      });
    }

    // Inner vibrant course line
    if (!courseLineRef.current) {
      courseLineRef.current = L.polyline(positions, {
        color: isDark ? '#38bdf8' : '#0284c7',
        weight: 5,
        opacity: 1.0,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
    } else {
      courseLineRef.current.setLatLngs(positions);
      courseLineRef.current.setStyle({
        color: isDark ? '#38bdf8' : '#0284c7',
      });
    }

    // Start Marker
    const pStart = course.points[0];
    const startIcon = L.divIcon({
      className: 'start-flag-icon',
      html: `
        <div style="
          background: #10b981;
          color: white;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 800;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        ">
          🟢 START
        </div>
      `,
      iconSize: [68, 24],
      iconAnchor: [34, 12],
    });

    if (!startMarkerRef.current) {
      startMarkerRef.current = L.marker([pStart.lat, pStart.lon], {
        icon: startIcon,
        zIndexOffset: 800,
      }).addTo(map);
    } else {
      startMarkerRef.current.setLatLng([pStart.lat, pStart.lon]);
    }
    startMarkerRef.current.bindPopup(`<b>Start Line</b><br/>Elevation: ${pStart.ele}m`);

    // Finish Marker
    const pFinish = course.points[course.points.length - 1];
    const finishIcon = L.divIcon({
      className: 'finish-flag-icon',
      html: `
        <div style="
          background: #ef4444;
          color: white;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 800;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        ">
          🏁 FINISH
        </div>
      `,
      iconSize: [72, 24],
      iconAnchor: [36, 12],
    });

    if (!finishMarkerRef.current) {
      finishMarkerRef.current = L.marker([pFinish.lat, pFinish.lon], {
        icon: finishIcon,
        zIndexOffset: 800,
      }).addTo(map);
    } else {
      finishMarkerRef.current.setLatLng([pFinish.lat, pFinish.lon]);
    }
    finishMarkerRef.current.bindPopup(
      `<b>Finish Line</b><br/>Total Distance: ${(course.distanceM / 1000).toFixed(2)} km (${(
        course.distanceM / 1609.344
      ).toFixed(2)} mi)`
    );

    // Auto-fit Bounds to Course
    const lats = course.points.map((p) => p.lat);
    const lons = course.points.map((p) => p.lon);
    const bounds = L.latLngBounds([
      [Math.min(...lats), Math.min(...lons)],
      [Math.max(...lats), Math.max(...lons)],
    ]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });

    // Timing Mat Checkpoints
    if (timingMatsGroupRef.current) {
      timingMatsGroupRef.current.clearLayers();
      const intermediateMats = course.timingMats.filter(
        (m) => m.name !== 'Start' && m.name !== 'Finish'
      );

      for (const m of intermediateMats) {
        const icon = L.divIcon({
          className: 'timing-mat-div-icon',
          html: `
            <div style="
              background: ${isDark ? '#1e293b' : '#ffffff'};
              color: ${isDark ? '#38bdf8' : '#0284c7'};
              border: 1.5px solid ${isDark ? '#38bdf8' : '#0284c7'};
              border-radius: 4px;
              padding: 1px 5px;
              font-size: 10px;
              font-weight: 700;
              box-shadow: 0 1px 4px rgba(0,0,0,0.25);
              white-space: nowrap;
            ">
              ${m.name}
            </div>
          `,
          iconSize: [36, 18],
          iconAnchor: [18, 9],
        });
        const marker = L.marker([m.lat, m.lon], { icon, zIndexOffset: 450 });
        marker.bindPopup(`<b>${m.name} Split Mat</b><br/>Distance: ${(m.actualDistM / 1000).toFixed(1)} km`);
        marker.addTo(timingMatsGroupRef.current);
      }
    }
  }, [map, course, isDark]);

  // 4. Update Runner Location & Visible Precision Glow
  useEffect(() => {
    if (!map || !forecast) {
      if (runnerMarkerRef.current) {
        runnerMarkerRef.current.remove();
        runnerMarkerRef.current = null;
      }
      if (precisionLineRef.current) {
        precisionLineRef.current.remove();
        precisionLineRef.current = null;
      }
      if (precisionCircleRef.current) {
        precisionCircleRef.current.remove();
        precisionCircleRef.current = null;
      }
      return;
    }

    const runnerLatLng: [number, number] = [forecast.coord.lat, forecast.coord.lon];

    const runnerIcon = L.divIcon({
      className: 'runner-custom-div-icon',
      html: `
        <div class="runner-marker-pulse">
          <div class="runner-marker-wave"></div>
          <div class="runner-marker-core"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    if (!runnerMarkerRef.current) {
      runnerMarkerRef.current = L.marker(runnerLatLng, {
        icon: runnerIcon,
        zIndexOffset: 1000,
      }).addTo(map);
    } else {
      runnerMarkerRef.current.setLatLng(runnerLatLng);
      runnerMarkerRef.current.setIcon(runnerIcon);
    }

    runnerMarkerRef.current.bindPopup(`
      <div style="font-size: 13px; min-width: 170px;">
        <strong>Predicted Runner Location</strong>
        <div>Distance: <b>${forecast.currentDistKm} km</b> (${forecast.currentDistMi} mi)</div>
        <div>Progress: <b>${forecast.progressPct}%</b></div>
        <div>Current Pace: <b>${forecast.instantPaceMinPerKm}</b> ${forecast.calibratedPace?.isCalibrated ? '<span style="color: #059669; font-weight: 700;">(Recalibrated)</span>' : ''}</div>
        <div>Elevation: <b>${forecast.coord.ele}m</b> (Grade: ${forecast.coord.gradePct}%)</div>
        <div>Projected Finish: <b>${forecast.projectedFinishTime}</b></div>
        <div style="margin-top: 4px; color: #0284c7; font-size: 11px;">${forecast.precision.reason}</div>
      </div>
    `);

    // Visible Precision Along-Track Glow
    const spanCoords = forecast.precision.spanLineCoords as [number, number][];
    if (spanCoords.length > 1) {
      if (!precisionLineRef.current) {
        precisionLineRef.current = L.polyline(spanCoords, {
          color: isDark ? '#38bdf8' : '#0ea5e9',
          weight: 12,
          opacity: 0.6,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);
      } else {
        precisionLineRef.current.setLatLngs(spanCoords);
        precisionLineRef.current.setStyle({
          color: isDark ? '#38bdf8' : '#0ea5e9',
        });
      }
    } else if (precisionLineRef.current) {
      precisionLineRef.current.remove();
      precisionLineRef.current = null;
    }

    // Radial Confidence Circle
    if (!precisionCircleRef.current) {
      precisionCircleRef.current = L.circle(runnerLatLng, {
        radius: forecast.precision.radiusMeters,
        color: isDark ? '#38bdf8' : '#0284c7',
        weight: 1.5,
        fillColor: isDark ? '#38bdf8' : '#0284c7',
        fillOpacity: isDark ? 0.12 : 0.08,
        dashArray: '4, 4',
      }).addTo(map);
    } else {
      precisionCircleRef.current.setLatLng(runnerLatLng);
      precisionCircleRef.current.setRadius(forecast.precision.radiusMeters);
      precisionCircleRef.current.setStyle({
        color: isDark ? '#38bdf8' : '#0284c7',
        fillColor: isDark ? '#38bdf8' : '#0284c7',
        fillOpacity: isDark ? 0.12 : 0.08,
      });
    }
  }, [map, forecast, isDark]);

  // 5. Update Dropped Tracking Pins
  useEffect(() => {
    const group = pinsGroupRef.current;
    if (!group || !map) return;
    if (isDraggingRef.current) return; // Do not clear layers while the user is actively dragging a pin!

    group.clearLayers();

    pins.forEach((pin, idx) => {
      const pinDate = new Date(pin.timestamp);
      const timeFormatted = !isNaN(pinDate.getTime())
        ? pinDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
        : `Pin #${idx + 1}`;

      const pinIcon = L.divIcon({
        className: 'custom-pin-leaflet-icon',
        html: `
          <div class="tracking-pin-wrapper">
            <div class="tracking-pin-pill">${timeFormatted}</div>
            <svg class="tracking-pin-svg" width="30" height="38" viewBox="0 0 30 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 1C7.268 1 1 7.268 1 15C1 23.5 12.8 35.8 14.4 37.4C14.7 37.7 15.3 37.7 15.6 37.4C17.2 35.8 29 23.5 29 15C29 7.268 22.732 1 15 1Z" fill="url(#pinGrad_${idx})" stroke="#ffffff" stroke-width="2.2"/>
              <defs>
                <linearGradient id="pinGrad_${idx}" x1="15" y1="1" x2="15" y2="38" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#10b981"/>
                  <stop offset="100%" stop-color="#047857"/>
                </linearGradient>
              </defs>
              <circle cx="15" cy="15" r="8.5" fill="#ffffff" filter="drop-shadow(0 1px 2px rgba(0,0,0,0.2))"/>
              <text x="15" y="19" text-anchor="middle" font-size="11" font-weight="800" font-family="-apple-system, BlinkMacSystemFont, sans-serif" fill="#047857">${idx + 1}</text>
            </svg>
            <div class="pin-ground-shadow"></div>
          </div>
        `,
        iconSize: [60, 56],
        iconAnchor: [30, 52],
        popupAnchor: [0, -50],
      });

      const marker = L.marker([pin.snappedLat, pin.snappedLon], {
        icon: pinIcon,
        zIndexOffset: 900,
        draggable: true,
      });

      marker.on('dragstart', () => {
        isDraggingRef.current = true;
        map.dragging.disable();
        marker.closePopup();
      });

      marker.on('dragend', (e) => {
        isDraggingRef.current = false;
        map.dragging.enable();

        const latlng = (e.target as L.Marker).getLatLng();
        const snap = snapCoordinateToCourse(latlng.lat, latlng.lng, course.points);
        if (snap) {
          marker.setLatLng([snap.snappedLat, snap.snappedLon]);

          // Recalculate implied speed and pace from course position and pin timestamp
          const [startH, startM] = (startTimeStr || '09:10').split(':').map((v) => parseInt(v, 10));
          const pinD = new Date(pin.timestamp);
          const startD = new Date(pinD);
          startD.setHours(startH || 9, startM || 10, 0, 0);
          let elapsedSec = (pinD.getTime() - startD.getTime()) / 1000;
          if (elapsedSec <= 0 || elapsedSec > 86400) {
            elapsedSec = (pinD.getHours() * 3600 + pinD.getMinutes() * 60) - (startH * 3600 + startM * 60);
            if (elapsedSec <= 0) {
              elapsedSec = elapsedSec > -7200 ? 60 : elapsedSec + 86400;
            }
          }

          const speed = snap.snappedDistM / Math.max(60, elapsedSec);
          const clampedSpeed = Math.max(1.5, Math.min(6.8, speed));
          const impliedPaceSecPerKm = 1000 / clampedSpeed;

          const updatedPin: TrackingPin = {
            ...pin,
            lat: snap.snappedLat,
            lon: snap.snappedLon,
            snappedLat: snap.snappedLat,
            snappedLon: snap.snappedLon,
            snappedDistM: snap.snappedDistM,
            snappedEle: snap.snappedEle,
            impliedPaceSecPerKm,
          };
          onUpdatePinRef.current?.(updatedPin);
        } else {
          marker.setLatLng([pin.snappedLat, pin.snappedLon]);
        }
      });

      const pinPace = pin.impliedPaceSecPerKm ? formatPace(pin.impliedPaceSecPerKm) : null;

      marker.bindPopup(
        `
        <div style="font-size: 13px; min-width: 195px; padding: 4px;">
          <div style="font-weight: 700; color: #059669; margin-bottom: 3px;">📍 Tracking Pin #${idx + 1}</div>
          <div>Time: <b>${timeFormatted}</b></div>
          <div>Course Dist: <b>${(pin.snappedDistM / 1000).toFixed(2)} km</b> (${(pin.snappedDistM / 1609.344).toFixed(2)} mi)</div>
          ${pinPace ? `<div>Implied Pace: <b style="color: #059669;">${pinPace.minPerKm}</b> <span style="font-size: 11px; color: #64748b;">(${pinPace.minPerMi})</span></div>` : ''}
          ${pin.snappedEle ? `<div>Elevation: <b>${pin.snappedEle.toFixed(0)}m</b></div>` : ''}
          ${pin.note ? `<div style="margin-top: 4px; font-size: 11px; color: #64748b;">${pin.note}</div>` : ''}
          <div style="margin-top: 8px; display: flex; gap: 6px;">
            <button id="btn-edit-pin-${pin.id}" style="
              flex: 1;
              background: #10b981;
              color: white;
              border: none;
              border-radius: 6px;
              padding: 5px 8px;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 4px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            ">
              ✏️ Edit Pin
            </button>
            <button id="btn-del-pin-${pin.id}" style="
              background: #fee2e2;
              color: #ef4444;
              border: 1px solid #fca5a5;
              border-radius: 6px;
              padding: 5px 8px;
              font-size: 11px;
              font-weight: 700;
              cursor: pointer;
            ">
              🗑️
            </button>
          </div>
          <div style="margin-top: 6px; font-size: 10px; color: #64748b; text-align: center;">
            Tip: Drag pin along course to reposition
          </div>
        </div>
      `,
        { autoPan: false }
      );

      marker.on('popupopen', () => {
        const editBtn = document.getElementById(`btn-edit-pin-${pin.id}`);
        if (editBtn) {
          editBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            onEditPinRef.current?.(pin);
            marker.closePopup();
          };
        }
        const delBtn = document.getElementById(`btn-del-pin-${pin.id}`);
        if (delBtn) {
          delBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemovePinRef.current?.(pin.id);
            marker.closePopup();
          };
        }
      });

      marker.addTo(group);
    });
  }, [pins, course.points, startTimeStr, map]);

  // 6. Update Spectator Viewing Spots
  useEffect(() => {
    if (!map) return;
    const group = spectatorGroupRef.current;
    if (!group) return;

    group.clearLayers();

    const spotsToRender: SpectatorSpot[] =
      spectatorSpots && spectatorSpots.length > 0
        ? spectatorSpots
        : spectatorLocation
        ? [
            {
              id: 'single_spec',
              name: 'Cheer Station',
              distM: spectatorLocation.distM,
              mile: spectatorLocation.distM / 1609.344,
              lat: spectatorLocation.lat,
              lon: spectatorLocation.lon,
            },
          ]
        : [];

    spotsToRender.forEach((spot) => {
      const mileFormatted = spot.mile.toFixed(1);
      const kmFormatted = (spot.distM / 1000).toFixed(1);

      const spectatorIcon = L.divIcon({
        className: 'custom-spectator-leaflet-icon',
        html: `
          <div class="spectator-waypoint-wrapper">
            <div class="spectator-waypoint-pill">Mile ${mileFormatted}</div>
            <svg class="spectator-pin-svg" width="30" height="38" viewBox="0 0 30 38" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 1C7.268 1 1 7.268 1 15C1 23.5 12.8 35.8 14.4 37.4C14.7 37.7 15.3 37.7 15.6 37.4C17.2 35.8 29 23.5 29 15C29 7.268 22.732 1 15 1Z" fill="url(#specGrad)" stroke="#ffffff" stroke-width="2.2"/>
              <defs>
                <linearGradient id="specGrad" x1="15" y1="1" x2="15" y2="38" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#f59e0b"/>
                  <stop offset="100%" stop-color="#b45309"/>
                </linearGradient>
              </defs>
              <circle cx="15" cy="15" r="8.5" fill="#ffffff"/>
              <!-- Star / Flag Vector Icon -->
              <path d="M15 10.5L16.4 13.3L19.5 13.7L17.2 15.9L17.8 19L15 17.5L12.2 19L12.8 15.9L10.5 13.7L13.6 13.3L15 10.5Z" fill="#b45309"/>
            </svg>
            <div class="pin-ground-shadow"></div>
          </div>
        `,
        iconSize: [60, 56],
        iconAnchor: [30, 52],
        popupAnchor: [0, -50],
      });

      const marker = L.marker([spot.lat, spot.lon], {
        icon: spectatorIcon,
        zIndexOffset: 950,
      });

      marker.bindPopup(`
        <div style="font-size: 13px; min-width: 185px; padding: 4px;">
          <div style="font-weight: 700; color: #d97706; margin-bottom: 3px;">🚩 ${spot.name}</div>
          <div>Location: <b>Mile ${mileFormatted}</b> (${kmFormatted} km)</div>
          <div style="margin-top: 4px; font-size: 11px; color: #64748b;">Designated spectator cheer station</div>
          <button id="del-cheer-${spot.id}" style="margin-top: 8px; width: 100%; background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; border-radius: 6px; padding: 4px 8px; font-size: 11px; font-weight: 600; cursor: pointer;">
            Remove Cheer Spot
          </button>
        </div>
      `, { autoPan: false });

      marker.on('popupopen', () => {
        const btn = document.getElementById(`del-cheer-${spot.id}`);
        if (btn) {
          btn.onclick = (e) => {
            e.stopPropagation();
            onRemoveSpectatorSpotRef.current?.(spot.id);
            marker.closePopup();
          };
        }
      });

      marker.addTo(group);
    });
  }, [map, spectatorSpots, spectatorLocation]);

  // Dynamic crosshair cursor when pin drop mode or cheer drop mode is active
  useEffect(() => {
    if (!mapContainerRef.current) return;
    mapContainerRef.current.style.cursor = isPinDropActive || isCheerDropActive ? 'crosshair' : '';
  }, [isPinDropActive, isCheerDropActive]);

  const handleFitCourse = () => {
    if (!map || !course || course.points.length === 0) return;
    const lats = course.points.map((p) => p.lat);
    const lons = course.points.map((p) => p.lon);
    const bounds = L.latLngBounds([
      [Math.min(...lats), Math.min(...lons)],
      [Math.max(...lats), Math.max(...lons)],
    ]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '100%' }}>
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', minHeight: '100%' }} />

      {/* Floating Zoom & Fit Course Controls */}
      <div
        style={{
          position: 'absolute',
          bottom: 110,
          right: 16,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <ActionIcon
          size="lg"
          variant="default"
          radius="md"
          className="glass-panel"
          onClick={() => map?.zoomIn()}
          title="Zoom In (+)"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.18)' }}
        >
          <IconPlus size={18} />
        </ActionIcon>
        <ActionIcon
          size="lg"
          variant="default"
          radius="md"
          className="glass-panel"
          onClick={() => map?.zoomOut()}
          title="Zoom Out (-)"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.18)' }}
        >
          <IconMinus size={18} />
        </ActionIcon>
        <ActionIcon
          size="lg"
          variant="default"
          radius="md"
          className="glass-panel"
          onClick={handleFitCourse}
          title="Fit Track to Screen"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.18)' }}
        >
          <IconFocus2 size={18} />
        </ActionIcon>
      </div>

      {isPinDropActive && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1100,
            background: 'rgba(16, 185, 129, 0.95)',
            color: 'white',
            padding: '8px 18px',
            borderRadius: 24,
            fontSize: 13,
            fontWeight: 700,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span>📍 Pin Drop Mode: Click anywhere along the course</span>
          {onCancelPinDrop && (
            <button
              onClick={onCancelPinDrop}
              style={{
                background: 'rgba(255,255,255,0.25)',
                border: 'none',
                color: 'white',
                borderRadius: 12,
                padding: '3px 10px',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {isCheerDropActive && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1100,
            background: 'rgba(217, 119, 6, 0.95)',
            color: 'white',
            padding: '8px 18px',
            borderRadius: 24,
            fontSize: 13,
            fontWeight: 700,
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span>🚩 Cheer Station Drop: Click anywhere along course</span>
          {onCancelCheerDrop && (
            <button
              onClick={onCancelCheerDrop}
              style={{
                background: 'rgba(255,255,255,0.25)',
                border: 'none',
                color: 'white',
                borderRadius: 12,
                padding: '3px 10px',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
