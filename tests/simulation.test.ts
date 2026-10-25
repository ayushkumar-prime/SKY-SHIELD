import test from 'node:test';
import assert from 'node:assert/strict';
import { assess, createTracks, predict, rankTracks, stepTracks, validSnapshot, zoneEntry, type Track } from '../shared/simulation.ts';
const track = (changes: Partial<Track> = {}): Track => ({ id: 'D-001', x: 2000, y: 0, vx: -40, vy: 0, altitude: 100, known: false, history: [], ...changes });
test('prediction uses vector velocity', () => { assert.deepEqual(predict(track({ x: 100, y: 200, vx: 3, vy: -4 })), { x: 190, y: 80 }); });
test('entry handles inbound, outbound, stationary, tangent, and inside paths', () => {
  assert.equal(zoneEntry(track()), 22.5);
  assert.equal(zoneEntry(track({ vx: 40 })), null);
  assert.equal(zoneEntry(track({ vx: 0 })), null);
  assert.equal(zoneEntry(track({ x: 2000, y: 1100 })), 50);
  assert.equal(zoneEntry(track({ x: 200 })), 0);
  assert.equal(zoneEntry(track({ y: 2000 })), null);
});
test('score parts and priority ranking are explainable', () => {
  const risk = assess(track());
  assert.equal(risk.score, 86); assert.equal(risk.level, 'HIGH');
  const low = track({ id: 'D-002', x: 4500, vx: 20, known: true });
  assert.equal(assess(low).level, 'LOW');
  assert.equal(rankTracks([low, track()])[0].track.id, 'D-001');
});
test('simulation is deterministic and stays bounded with capped trails', () => {
  assert.deepEqual(createTracks(), createTracks());
  let tracks = createTracks(80);
  for (let n = 0; n < 10000; n++) tracks = stepTracks(tracks, .25);
  assert.ok(tracks.every(t => Math.abs(t.x) <= 5000 && Math.abs(t.y) <= 5000 && t.history.length <= 24));
  assert.equal(new Set(tracks.map(t => t.id)).size, 80);
  assert.equal(validSnapshot({ tracks, time: 0, seq: 1, simulated: true }), true);
});
test('wire validation rejects corrupt and non-demo snapshots', () => {
  const good = { tracks: createTracks(), time: 0, seq: 1, simulated: true };
  assert.ok(validSnapshot(good));
  assert.equal(validSnapshot({ ...good, simulated: false }), false);
  assert.equal(validSnapshot({ ...good, tracks: [{ ...track(), x: Infinity }] }), false);
  assert.equal(validSnapshot({ ...good, tracks: [null] }), false);
  assert.equal(validSnapshot({ ...good, tracks: [track(), track()] }), false);
});
