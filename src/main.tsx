import { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { assess, HORIZON, predict, rankTracks } from '../shared/simulation';
import { useFeed } from './useFeed';
import './styles.css';
import { Radar } from './Radar';
const color = { HIGH: '#ee805f', WATCH: '#e2bb59', LOW: '#9bbd82' };
const km = (n: number) => `${(n / 1000).toFixed(2)} km`;
const clock = (n: number) => new Date(n).toLocaleTimeString('en-GB', { hour12: false });
function App() {
  const [low, setLow] = useState(false), [local, setLocal] = useState(false), [paused, setPaused] = useState(false);
  const [selected, setSelected] = useState('D-001'), [filter, setFilter] = useState('ALL'), [search, setSearch] = useState('');
  const [trails, setTrails] = useState(true), [prediction, setPrediction] = useState(true);
  const [horizon, setHorizon] = useState(HORIZON);
  const [ack, setAck] = useState<Set<string>>(new Set());
  const [events, setEvents] = useState<{ key: number; time: number; text: string; level: string }[]>([]);
  const previous = useRef(new Map<string, string>()), eventKey = useRef(0);
  const { snapshot, source, rate, lastServer, cache } = useFeed(low, local, paused);
  const ranked = useMemo(() => rankTracks(snapshot.tracks), [snapshot]);
  const chosen = snapshot.tracks.find(t => t.id === selected) || ranked[0].track;
  const risk = assess(chosen), future = predict(chosen, horizon);
  const visible = ranked.filter(({ track, risk: r }) => (filter === 'ALL' || r.level === filter) && track.id.toLowerCase().includes(search.toLowerCase()));
  const counts = { HIGH: ranked.filter(t => t.risk.level === 'HIGH').length, WATCH: ranked.filter(t => t.risk.level === 'WATCH').length, LOW: ranked.filter(t => t.risk.level === 'LOW').length };
  useEffect(() => {
    const changed: { key: number; time: number; text: string; level: string }[] = [];
    for (const { track, risk: r } of ranked) {
      const old = previous.current.get(track.id);
      if (old !== r.level && r.level !== 'LOW') changed.push({ key: eventKey.current++, time: snapshot.time, text: `${track.id} → ${r.level} · ${r.reasons.join(' / ')}`, level: r.level });
      previous.current.set(track.id, r.level);
    }
    if (changed.length) setEvents(e => [...changed.reverse(), ...e].slice(0, 50));
  }, [ranked, snapshot.time]);
  function exportData() {
    const data = { note: 'SIMULATED DATA ONLY', ...snapshot, tracks: ranked.map(t => ({ ...t.track, assessment: t.risk })), events };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = 'sky-shield-demo.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function acknowledge() {
    if (ack.has(chosen.id)) return;
    setAck(a => new Set([...a, chosen.id]));
    setEvents(e => [{ key: eventKey.current++, time: snapshot.time, text: `${chosen.id} reviewed by demo operator`, level: 'NOTE' }, ...e].slice(0, 50));
  }
  return <div className="app">
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="brand"><span className="brand-icon" aria-hidden="true">⌖</span><div><h1>SKY SHIELD<span className="version">v0.1</span></h1><p>COUNTER-DRONE / AIRSPACE MONITOR</p></div></div>
      <div className="header-meta"><strong className="demo-tag">SIMULATION ONLY</strong><span>HACKATHON BUILD · 01</span></div>
    </header>
    <main>
      <div className="intro flex flex-wrap items-end justify-between gap-3"><div><p className="eyebrow">CONTROL ROOM / FICTIONAL SECTOR A</p><h2>Airspace overview</h2><p>20 objects. One screen. Keep an eye on what comes next.</p></div><div className="feed-state" role="status"><i className={source === 'server' ? 'live-dot' : 'local-dot'} />{source === 'server' ? 'SERVER FEED' : source === 'connecting' ? 'CONNECTING…' : 'LOCAL SIMULATION'}<small>{paused ? 'VIEW PAUSED' : `UPDATED ${clock(snapshot.time)}`}</small></div></div>
      <section className="stats grid grid-cols-2 lg:grid-cols-4 gap-3" aria-label="Airspace summary">
        <div className="stat"><span>TRACKED OBJECTS</span><strong>{String(snapshot.tracks.length).padStart(2, '0')}</strong><small>All tracks are fake</small></div>
        <div className="stat high-stat"><span>HIGH PRIORITY</span><strong>{String(counts.HIGH).padStart(2, '0')}</strong><small>Score 65–100 / review first</small></div>
        <div className="stat watch-stat"><span>WATCH LIST</span><strong>{String(counts.WATCH).padStart(2, '0')}</strong><small>Score 40–64 / keep watching</small></div>
        <div className="stat"><span>DATA RATE</span><strong>{rate.toFixed(1)}<em> KB/s</em></strong><small>{low ? 'Low bandwidth · 2 s packets' : 'Fast feed · 250 ms packets'}</small></div>
      </section>
      <div className="toolbar flex flex-wrap items-center gap-3">
        <button onClick={() => setPaused(v => !v)} aria-pressed={paused}>{paused ? '▶ Resume view' : 'Ⅱ Pause view'}</button>
        <label><input type="checkbox" checked={low} onChange={e => setLow(e.target.checked)} /> Low bandwidth</label>
        <label><input type="checkbox" checked={local} onChange={e => setLocal(e.target.checked)} /> Try offline demo</label>
        <span className="toolbar-note">{cache}</span><button onClick={exportData} className="ml-auto">↓ Export JSON</button>
      </div>
      {source === 'local' && <div className="notice" role="status">{local ? 'Offline demo is on.' : 'Server is not available. Retrying in the background.'} Tracks keep moving with the local simulator. {lastServer ? `Last server packet: ${clock(lastServer)}.` : 'No server packet received yet.'}</div>}
      {paused && <div className="notice">View is paused at {clock(snapshot.time)}. The simulator keeps running; resume to see the latest tracks.</div>}
      <div className="workspace">
        <section className="panel radar-panel" aria-labelledby="radar-heading">
          <div className="panel-heading"><h3 id="radar-heading"><span className="section-num">01</span> LIVE RADAR</h3><span>10 × 10 km grid</span></div>
          <Radar tracks={visible.map(t => t.track)} chosen={chosen} onSelect={setSelected} trails={trails} prediction={prediction} horizon={horizon} paused={paused} low={low && source === 'server'} />
          <div className="radar-footer flex flex-wrap items-center gap-4"><label><input type="checkbox" checked={trails} onChange={e => setTrails(e.target.checked)} /> Trails</label><label><input type="checkbox" checked={prediction} onChange={e => setPrediction(e.target.checked)} /> +{horizon} s prediction</label><span className="legend"><i style={{ background: color.HIGH }} />High <i style={{ background: color.WATCH }} />Watch <i style={{ background: color.LOW }} />Low</span></div>
          <p className="radar-caption">Solid marker = now · dashed line = estimated path · hollow dot = +{horizon} s</p>
        </section>
        <section className="panel queue-panel" aria-labelledby="queue-heading">
          <div className="panel-heading"><h3 id="queue-heading"><span className="section-num">02</span> PRIORITY QUEUE</h3><span>{visible.length} / 20</span></div>
          <div className="queue-controls"><input aria-label="Search track ID" placeholder="Search track ID…" value={search} onChange={e => setSearch(e.target.value)} /><div className="filters" aria-label="Filter tracks">{['ALL', 'HIGH', 'WATCH', 'LOW'].map(f => <button key={f} aria-pressed={filter === f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f === 'ALL' ? 'All' : f === 'HIGH' ? 'High' : f === 'WATCH' ? 'Watch' : 'Low'}</button>)}</div></div>
          <div className="queue-label"><span>TRACK / STATUS</span><span>SCORE</span></div>
          <div className="queue-list">{visible.length === 0 ? <p className="empty">No matching tracks. Try another ID or filter.</p> : visible.map(({ track: t, risk: r }, i) => <button key={t.id} className={`queue-row ${chosen.id === t.id ? 'selected' : ''}`} aria-pressed={chosen.id === t.id} onClick={() => setSelected(t.id)}><span className="rank">{String(i + 1).padStart(2, '0')}</span><span className="track-info"><b>{t.id}{ack.has(t.id) && <small> ✓ reviewed</small>}</b><small>{km(r.distance)} away · {r.speed.toFixed(0)} m/s</small></span><span className="risk-label" data-level={r.level}>{r.level}<b>{r.score}</b></span></button>)}</div>
          <div className="queue-bottom"><span>Highest score first.</span><button onClick={() => { setFilter('ALL'); setSearch(''); setSelected(ranked[0].track.id); }}>↑ Select top threat</button></div>
        </section>
      </div>
      <div className="detail-grid">
        <section className="panel detail-panel"><div className="panel-heading"><h3><span className="section-num">03</span> TRACK INSPECTOR</h3><span>{chosen.id}</span></div><div className="detail-body inspector-content" key={chosen.id}>
          <div className="flex items-center justify-between gap-3"><div><h4>{chosen.id} <span className="badge" data-level={risk.level}>{risk.level}</span></h4><p>{chosen.known ? 'Known demo ID' : 'Unknown demo ID'} · {risk.approach ? 'Approaching centre' : 'Moving away'}</p></div><button onClick={acknowledge} disabled={ack.has(chosen.id)}>{ack.has(chosen.id) ? '✓ Reviewed' : 'Mark reviewed'}</button></div>
          <div className="track-metrics grid grid-cols-3 gap-3"><div><small>DISTANCE</small><b>{km(risk.distance)}</b></div><div><small>SPEED</small><b>{risk.speed.toFixed(1)} m/s</b></div><div><small>ALTITUDE</small><b>{chosen.altitude} m</b></div></div>
          <div className="score-line"><b>Demo threat score</b><strong>{risk.score}<small> / 100</small></strong></div><div className="score-bar"><div style={{ width: `${risk.score}%`, background: color[risk.level] }} /></div>
          <div className="score-parts">{Object.entries(risk.parts).map(([name, n]) => <span key={name}>{name} <b>+{n}</b></span>)}</div>
          <p className="reason">{risk.reasons.join(' · ')}</p><p className="tiny">High ≥65 · Watch ≥40 · Low &lt;40. Review marks do not change the score.</p>
        </div></section>
        <section className="panel math-panel"><div className="panel-heading"><h3><span className="section-num">04</span> HOW WE PREDICT</h3><span>+{horizon} s</span></div><div className="detail-body"><label className="horizon-control" htmlFor="horizon">Prediction preview <output>{horizon} s</output></label><input id="horizon" aria-label="Prediction seconds" type="range" min="10" max="60" step="5" value={horizon} onChange={e => setHorizon(Number(e.target.value))} /><p>Keep the same speed and direction for {horizon} seconds.</p><div className="formula">x_next = x + vx × {horizon}<br />y_next = y + vy × {horizon}</div><div className="math-values"><div><span>NOW (x, y)</span><b>{chosen.x.toFixed(0)}, {chosen.y.toFixed(0)} m</b></div><div><span>VELOCITY (vx, vy)</span><b>{chosen.vx.toFixed(1)}, {chosen.vy.toFixed(1)} m/s</b></div><div><span>IN {horizon} SECONDS</span><b>{future.x.toFixed(0)}, {future.y.toFixed(0)} m</b></div></div><p className="entry-note">{risk.entry === 0 ? '⚠ Track is inside the demo zone.' : risk.entry !== null && risk.entry <= horizon ? `⚠ Possible zone entry in ${risk.entry.toFixed(1)} s.` : `No zone entry expected in the next ${horizon} s.`}</p><details><summary>Score and zone math</summary><p>Proximity = round(35 × max(0, 1 − distance / 5000)). Unknown ID adds 25. Moving toward centre adds 15. Being inside or entering within 30 s adds 25.</p><p>Zone entry solves (x + vx·t)² + (y + vy·t)² = 1100² for the first positive t.</p></details><p className="tiny">Preview changes the dashed path only. Threat scores always use 30 s. Turns and edge bounces can change the path. This demo cannot tell real intent.</p></div></section>
      </div>
      <section className="panel events-panel"><div className="panel-heading"><h3><span className="section-num">05</span> EVENT LOG</h3><span>Last 50 events · this session</span></div><div className="events">{events.length === 0 ? <p className="empty">Waiting for a priority change…</p> : events.map(e => <div key={e.key} className="event"><time>{clock(e.time)}</time><span className="event-level" data-level={e.level}>{e.level}</span><span>{e.text}</span></div>)}</div></section>
      <footer className="flex flex-wrap justify-between gap-2"><span>SKY SHIELD / student prototype</span><span>Fake tracks only. No real military data. No drone control.</span><span>React + TypeScript + Node.js</span></footer>
    </main>
  </div>;
}
createRoot(document.getElementById('root')!).render(<App />);
