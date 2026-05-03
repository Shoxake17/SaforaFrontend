// src/utils/callTimer.ts

export function formatCallDuration(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function elapsedSecondsFrom(startTimeMs: number | null): number {
  if (!startTimeMs) return 0;
  return Math.max(0, Math.floor((Date.now() - startTimeMs) / 1000));
}