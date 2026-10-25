import { useEffect, useRef, useState } from 'react';
import { createTracks, stepTracks, validSnapshot, type Snapshot } from '../shared/simulation';
const initial = (): Snapshot => {
  try { const value: unknown = JSON.parse(localStorage.getItem('sky-snapshot') || 'null'); if (validSnapshot(value)) return value; } catch { /* storage is optional */ }
  return { tracks: createTracks(), time: Date.now(), seq: 0, simulated: true };
};
export function useFeed(low: boolean, local: boolean, paused: boolean) {
  const [snapshot, setSnapshot] = useState(initial);
  const current = useRef(snapshot);
  const pausedRef = useRef(paused); pausedRef.current = paused;
  const [source, setSource] = useState<'connecting' | 'server' | 'local'>('connecting');
  const [rate, setRate] = useState(0);
  const [lastServer, setLastServer] = useState<number | null>(null);
  const [cache, setCache] = useState('Preparing offline cache');
  useEffect(() => {
    if (!import.meta.env.PROD) { setCache('Offline reload needs production build'); return; }
    if (!('serviceWorker' in navigator)) { setCache('Offline reload is not supported here'); return; }
    let alive = true;
    const onMessage = (e: MessageEvent) => { if (alive && e.data === 'SKY_CACHE_READY') setCache('Offline app ready'); };
    navigator.serviceWorker.addEventListener('message', onMessage);
    navigator.serviceWorker.register('/sw.js').then(async reg => {
      await navigator.serviceWorker.ready;
      (reg.active || reg.waiting)?.postMessage('SKY_CHECK_CACHE');
    }).catch(() => { if (alive) setCache('Offline cache unavailable'); });
    return () => { alive = false; navigator.serviceWorker.removeEventListener('message', onMessage); };
  }, []);
  useEffect(() => {
    let received = 0, bytes = 0, measuredAt = Date.now(), lastSave = 0, previousTick = Date.now();
    let activeSource = local ? 'local' : 'connecting';
    setSource(activeSource as 'local' | 'connecting'); setRate(0);
    const publish = (next: Snapshot) => {
      current.current = next;
      if (!pausedRef.current) setSnapshot(next);
      if (Date.now() - lastSave > 5000) { try { localStorage.setItem('sky-snapshot', JSON.stringify(next)); } catch { /* no storage required */ } lastSave = Date.now(); }
    };
    const stream = local ? null : new EventSource(`/api/stream?low=${low ? 1 : 0}`);
    if (stream) {
      stream.onmessage = event => {
        try {
          const next: unknown = JSON.parse(event.data);
          if (!validSnapshot(next)) return;
          const old = new Map(current.current.tracks.map(t => [t.id, t]));
          next.tracks = next.tracks.map(t => ({ ...t, history: [...(old.get(t.id)?.history || []).slice(-23), [t.x, t.y]] }));
          received = Date.now(); bytes += new TextEncoder().encode(event.data).length;
          setLastServer(received); activeSource = 'server'; setSource('server'); publish(next);
        } catch { /* Invalid messages cannot replace our simulation. */ }
      };
      stream.onerror = () => { activeSource = 'local'; setSource('local'); setRate(0); };
    }
    const timer = window.setInterval(() => {
      const now = Date.now(); const dt = (now - previousTick) / 1000; previousTick = now;
      if (activeSource !== 'server' || now - received > (low ? 6000 : 3000)) {
        activeSource = 'local'; setSource('local');
        publish({ tracks: stepTracks(current.current.tracks, dt), time: now, seq: current.current.seq + 1, simulated: true });
      } else if (!pausedRef.current) setSnapshot(current.current);
      if (now - measuredAt >= 2000) { setRate(bytes / ((now - measuredAt) / 1000) / 1024); bytes = 0; measuredAt = now; }
    }, 250);
    return () => { stream?.close(); window.clearInterval(timer); };
  }, [low, local]);
  return { snapshot, source, rate, lastServer, cache };
}
