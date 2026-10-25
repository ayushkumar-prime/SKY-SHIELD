// Fictional Cartesian airspace in metres. No real locations or sensor data.
export const LIMIT = 5000;
export const ZONE = 1100;
export const HORIZON = 30;
export type Track = { id: string; x: number; y: number; vx: number; vy: number; altitude: number; known: boolean; history: [number, number][] };
export type Snapshot = { tracks: Track[]; time: number; seq: number; simulated: true };
export type Assessment = { score: number; level: 'HIGH' | 'WATCH' | 'LOW'; distance: number; speed: number; approach: boolean; entry: number | null; reasons: string[]; parts: { proximity: number; identity: number; approach: number; entry: number } };
export function createTracks(count = 20, seed = 42): Track[] {
  let state = seed >>> 0;
  const random = () => { state = (1664525 * state + 1013904223) >>> 0; return state / 4294967296; };
  return Array.from({ length: Math.min(80, Math.max(1, count)) }, (_, i) => {
    const angle = random() * Math.PI * 2;
    const radius = i === 0 ? 1800 : 900 + random() * 3700;
    const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
    const heading = i % 4 === 0 ? angle + Math.PI : random() * Math.PI * 2;
    const speed = 12 + random() * 32;
    return { id: `D-${String(i + 1).padStart(3, '0')}`, x, y, vx: Math.cos(heading) * speed, vy: Math.sin(heading) * speed, altitude: Math.round(40 + random() * 230), known: i !== 0 && i % 3 === 0, history: [[x, y]] };
  });
}
export function predict(track: Pick<Track, 'x' | 'y' | 'vx' | 'vy'>, seconds = HORIZON) {
  return { x: track.x + track.vx * seconds, y: track.y + track.vy * seconds };
}
// First circle crossing for a constant-velocity path. null = no crossing.
export function zoneEntry(track: Track): number | null {
  const c = track.x ** 2 + track.y ** 2 - ZONE ** 2;
  if (c <= 0) return 0;
  const a = track.vx ** 2 + track.vy ** 2;
  const b = 2 * (track.x * track.vx + track.y * track.vy);
  const discriminant = b * b - 4 * a * c;
  if (a === 0 || discriminant < 0) return null;
  const seconds = (-b - Math.sqrt(discriminant)) / (2 * a);
  return seconds >= 0 ? seconds : null;
}
export function assess(track: Track): Assessment {
  const distance = Math.hypot(track.x, track.y);
  const approach = track.x * track.vx + track.y * track.vy < 0;
  const entry = zoneEntry(track);
  const parts = { proximity: Math.round(35 * Math.max(0, 1 - distance / LIMIT)), identity: track.known ? 0 : 25, approach: approach ? 15 : 0, entry: entry !== null && entry <= HORIZON ? 25 : 0 };
  const score = Object.values(parts).reduce((sum, value) => sum + value, 0);
  const reasons = [track.known ? 'Known demo ID' : 'Unknown demo ID'];
  if (distance <= ZONE) reasons.push('Inside protected zone');
  else if (entry !== null && entry <= HORIZON) reasons.push('May enter zone in 30 s');
  if (approach) reasons.push('Moving toward centre');
  return { score, level: score >= 65 ? 'HIGH' : score >= 40 ? 'WATCH' : 'LOW', distance, speed: Math.hypot(track.vx, track.vy), approach, entry, reasons, parts };
}
export function stepTracks(tracks: Track[], seconds: number): Track[] {
  const dt = Math.min(3, Math.max(0, seconds));
  return tracks.map(track => {
    let { x, y, vx, vy } = track;
    x += vx * dt; y += vy * dt;
    if (Math.abs(x) > LIMIT) { x = Math.sign(x) * (2 * LIMIT - Math.abs(x)); vx *= -1; }
    if (Math.abs(y) > LIMIT) { y = Math.sign(y) * (2 * LIMIT - Math.abs(y)); vy *= -1; }
    return { ...track, x, y, vx, vy, history: [...track.history.slice(-23), [x, y] as [number, number]] };
  });
}
export function rankTracks(tracks: Track[]) { return tracks.map(track => ({ track, risk: assess(track) })).sort((a, b) => b.risk.score - a.risk.score || a.track.id.localeCompare(b.track.id)); }
export function validSnapshot(value: unknown): value is Snapshot {
  if (!value || typeof value !== 'object') return false;
  const s = value as Snapshot;
  return s.simulated === true && Number.isFinite(s.time) && Number.isInteger(s.seq) && Array.isArray(s.tracks) && s.tracks.length > 0 && s.tracks.length <= 80 && s.tracks.every(t => t && typeof t.id === 'string' && /^D-\d{3}$/.test(t.id) && [t.x, t.y, t.vx, t.vy, t.altitude].every(Number.isFinite) && Math.abs(t.x) <= LIMIT && Math.abs(t.y) <= LIMIT && Math.abs(t.vx) <= 100 && Math.abs(t.vy) <= 100 && typeof t.known === 'boolean' && Array.isArray(t.history) && t.history.length <= 24 && t.history.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite))) && new Set(s.tracks.map(t => t.id)).size === s.tracks.length;
}
