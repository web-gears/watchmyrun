import { MarathonInfo } from '@/lib/data/marathonRegistry';
import {
  RunnerForecastResult,
  SpectatorMeetingWindow,
  SpectatorSpot,
} from '@/lib/forecasting/types';

export interface SharePlanData {
  marathonInfo: MarathonInfo;
  distanceLabel?: string;
  startTimeStr: string;
  finishTimeStr?: string;
  paceStr?: string;
  pacingUnit?: 'km' | 'mi';
  forecast?: RunnerForecastResult | null;
  spectatorWindows?: SpectatorMeetingWindow[];
  spectatorSpots?: SpectatorSpot[];
  shareUrl: string;
}

/**
 * Formats a clean, scannable spectator itinerary for WhatsApp, iMessage, SMS, or Telegram.
 */
export function formatSpectatorCheatSheet(data: SharePlanData): string {
  const {
    marathonInfo,
    startTimeStr,
    finishTimeStr,
    paceStr,
    pacingUnit = 'km',
    forecast,
    spectatorWindows = [],
    spectatorSpots = [],
    shareUrl,
  } = data;

  const lines: string[] = [];

  // 1. Header line with flag & race name
  const flag = marathonInfo.flag || '🏃';
  lines.push(`${flag} ${marathonInfo.name} — Spectator Plan`);

  // 2. Start, Goal, Pace & Projected Finish
  const startClean = startTimeStr.slice(0, 5); // HH:MM
  const summaryParts: string[] = [`Start: ${startClean}`];

  if (forecast?.projectedFinishTime) {
    summaryParts.push(`Est. Finish: ${forecast.projectedFinishTime}`);
  } else if (finishTimeStr) {
    summaryParts.push(`Goal: ${finishTimeStr}`);
  }

  if (forecast?.calibratedPace?.isCalibrated) {
    const calPace =
      pacingUnit === 'mi'
        ? forecast.calibratedPace.paceMinPerMi
        : forecast.calibratedPace.paceMinPerKm;
    summaryParts.push(`Live Pace: ${calPace}`);
  } else if (paceStr) {
    summaryParts.push(`Pace: ${paceStr}/${pacingUnit}`);
  }

  lines.push(`⏱️ ${summaryParts.join(' • ')}`);

  // 3. Cheer Spots & Arrival Windows
  if (spectatorWindows.length > 0) {
    lines.push('');
    lines.push('📍 Cheer Spots & Arrival Windows:');
    spectatorWindows.forEach((w, idx) => {
      const distLabel =
        pacingUnit === 'mi' ? `Mi ${w.distMi.toFixed(1)}` : `${w.distKm.toFixed(1)} km`;
      if (w.hasRunnerPassed) {
        lines.push(`  ${idx + 1}. ${w.spotName} (${distLabel}) → Passed ✓`);
      } else {
        lines.push(
          `  ${idx + 1}. ${w.spotName} (${distLabel}) → ${w.windowEarly}–${w.windowLate} (ETA ${w.expectedEta})`
        );
      }
    });
  } else if (spectatorSpots.length > 0) {
    lines.push('');
    lines.push('📍 Cheer Spots:');
    spectatorSpots.forEach((s, idx) => {
      const distLabel =
        pacingUnit === 'mi'
          ? `Mi ${s.mile.toFixed(1)}`
          : `${(s.distM / 1000).toFixed(1)} km`;
      lines.push(`  ${idx + 1}. ${s.name} (${distLabel})`);
    });
  } else if (forecast && forecast.upcomingSplits.length > 0) {
    lines.push('');
    lines.push('📍 Upcoming Checkpoints:');
    forecast.upcomingSplits.slice(0, 3).forEach((split) => {
      lines.push(`  • ${split.name} (${split.distKm.toFixed(1)} km) → ETA ${split.eta}`);
    });
  }

  // 4. Live Map URL
  lines.push('');
  lines.push(`🗺️ Live Map & Pace Recalibration:`);
  lines.push(shareUrl);

  return lines.join('\n');
}
