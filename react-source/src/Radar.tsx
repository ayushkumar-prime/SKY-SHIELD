import { useState } from 'react';
import { assess, predict, ZONE, type Track } from '../shared/simulation';
const colors = { HIGH: '#ee805f', WATCH: '#e2bb59', LOW: '#9bbd82' };
export function Radar({ tracks, chosen, onSelect, trails, prediction, horizon, paused, low }: {
  tracks: Track[]; chosen: Track; onSelect: (id: string) => void;
  trails: boolean; prediction: boolean; horizon: number; paused: boolean; low: boolean;
}) {
  const [zoom, setZoom] = useState(1), [follow, setFollow] = useState(false), [scan, setScan] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);
  const hoveredTrack = tracks.find(t => t.id === hovered);
  const span = 11000 / zoom, bound = 5500 - span / 2;
  const cx = follow ? Math.max(-bound, Math.min(bound, chosen.x)) : 0;
  const cy = follow ? Math.max(-bound, Math.min(bound, -chosen.y)) : 0;
  return <>
    <div className="radar-tools">
      <div className="zoom-tools"><button onClick={() => setZoom(z => Math.max(1, z - .5))} disabled={zoom === 1} aria-label="Zoom out">−</button><output aria-label="Radar zoom">{zoom.toFixed(1)}×</output><button onClick={() => setZoom(z => Math.min(3, z + .5))} disabled={zoom === 3} aria-label="Zoom in">+</button><button onClick={() => { setZoom(1); setFollow(false); }}>Reset</button></div>
      <button aria-pressed={follow} className={follow ? 'active-tool' : ''} onClick={() => { setFollow(v => !v); if (!follow && zoom === 1) setZoom(2); }}>⌖ Follow {chosen.id}</button>
      <label><input type="checkbox" checked={scan} onChange={e => setScan(e.target.checked)} /> Scan sweep</label>
    </div>
    <div className={`radar-wrap ${paused ? 'motion-paused' : ''}`}>
      <svg className="radar" viewBox={`${cx - span / 2} ${cy - span / 2} ${span} ${span}`} role="group" aria-label="Interactive fictional airspace radar. Select a marker or use the priority list.">
        <defs>
          <pattern id="grid" width="1000" height="1000" patternUnits="userSpaceOnUse"><path d="M1000 0H0V1000" fill="none" stroke="#354534" strokeWidth="10" /></pattern>
          <clipPath id="bounds"><rect x="-5000" y="-5000" width="10000" height="10000" /></clipPath>
          <radialGradient id="sweep-glow"><stop offset="0" stopColor="#a8c679" stopOpacity="0" /><stop offset="1" stopColor="#a8c679" stopOpacity=".12" /></radialGradient>
        </defs>
        <rect x="-5000" y="-5000" width="10000" height="10000" fill="url(#grid)" stroke="#52624a" strokeWidth="12" />
        <g fill="none" stroke="#506047" strokeWidth="10">{[2000, 3500, 5000].map(r => <circle key={r} r={r} />)}<path d="M-5000 0H5000M0-5000V5000" /></g>
        {scan && <g clipPath="url(#bounds)" pointerEvents="none"><g className="radar-sweep"><path d="M0 0L0-5000A5000 5000 0 0 1 3535-3535Z" fill="url(#sweep-glow)" /><path d="M0 0V-5000" stroke="#adc784" strokeWidth="16" opacity=".5" /></g></g>}
        <circle r={ZONE} fill="#a3894220" stroke="#c39d50" strokeWidth="18" strokeDasharray="65 50" />
        <g fill="#a3b093" fontSize="140" fontFamily="monospace"><text x="-60" y="-5200">N</text><text x="5150" y="50">E</text><text x="-60" y="5390">S</text><text x="-5420" y="50">W</text><text x="80" y="-3400">3.5 km</text><text x="80" y="-1950">2 km</text></g>
        <path d="M-90 0H90M0-90V90" stroke="#d1dbc5" strokeWidth="22" /><text x="0" y="270" textAnchor="middle" fill="#d3c18d" fontSize="125" fontFamily="monospace">PROTECTED ZONE</text>
        <g clipPath="url(#bounds)">{tracks.map(t => {
          const risk = assess(t), p = predict(t, horizon), active = t.id === chosen.id;
          return <g key={t.id}>
            {trails && <polyline points={t.history.map(([x, y]) => `${x},${-y}`).join(' ')} fill="none" stroke={colors[risk.level]} opacity=".4" strokeWidth="18" />}
            <g className="moving-track" style={{ transform: `translate(${t.x}px, ${-t.y}px)`, transitionDuration: paused ? '0s' : low ? '1.9s' : '240ms' }}>
              {prediction && <g stroke={colors[risk.level]} fill="none" pointerEvents="none" opacity={active ? 1 : .45}><line className={active ? 'prediction-line' : ''} x1="0" y1="0" x2={p.x - t.x} y2={t.y - p.y} strokeWidth="16" strokeDasharray="60 45" /><circle cx={p.x - t.x} cy={t.y - p.y} r="40" strokeWidth="14" /></g>}
              <g className={`radar-track ${active ? 'is-selected' : ''}`} role="button" tabIndex={0} aria-label={`Select ${t.id}, ${risk.level}, score ${risk.score}`} aria-pressed={active} onClick={() => onSelect(t.id)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(t.id); } }} onMouseEnter={() => setHovered(t.id)} onMouseLeave={() => setHovered(null)} onFocus={() => setHovered(t.id)} onBlur={() => setHovered(null)}>
                <title>{t.id}: {risk.level}, score {risk.score}</title><circle r="190" fill="transparent" />
                {risk.level === 'HIGH' && <circle className="threat-pulse" r="115" fill="none" stroke={colors.HIGH} strokeWidth="12" pointerEvents="none" />}
                {active && <rect x="-145" y="-145" width="290" height="290" fill="none" stroke="#fff" strokeWidth="18" pointerEvents="none" />}
                <path className="track-shape" d="M0-80L65 65L0 35L-65 65Z" transform={`rotate(${Math.atan2(t.vx, t.vy) * 180 / Math.PI})`} fill={colors[risk.level]} pointerEvents="none" /><text x="140" y="-90" fill={active ? '#fff' : colors[risk.level]} fontSize="140" fontFamily="monospace" pointerEvents="none">{t.id}</text>
              </g>
            </g>
          </g>;
        })}</g>
        <g pointerEvents="none" stroke="#a3b093" strokeWidth="15" fill="#a3b093" fontFamily="monospace"><path d="M3500 4800H4500M3500 4720V4880M4500 4720V4880" /><text x="4000" y="4620" textAnchor="middle" stroke="none" fontSize="140">1 km</text></g>
      </svg>
      <div className="radar-corner">SYNTHETIC AIRSPACE<br />{paused ? 'SCAN PAUSED' : follow ? `FOLLOWING ${chosen.id}` : 'NO LIVE SENSORS'}</div>
      {hoveredTrack && <div className="radar-tooltip"><b>{hoveredTrack.id}</b> · {assess(hoveredTrack).level} · {Math.hypot(hoveredTrack.vx, hoveredTrack.vy).toFixed(0)} m/s <span>Click to inspect</span></div>}
    </div>
  </>;
}
