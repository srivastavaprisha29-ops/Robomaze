import { cameraPoint, directions, fingertipIndices, levels, makeMaze } from './mechanics.mjs';
import { handCamera } from './camera.mjs';

const byId = id => document.getElementById(id);
const board = byId('maze');
const ctx = board.getContext('2d');
const strings = byId('strings');
const stringContext = strings.getContext('2d');
const video = byId('video');
let trackedHand = null;

function drawStrings() {
  stringContext.clearRect(0, 0, strings.width, strings.height);
  if (!trackedHand || !video.videoWidth || !video.videoHeight) return;
  stringContext.strokeStyle = '#ffe776';
  stringContext.fillStyle = '#ffe776';
  stringContext.lineWidth = 1.6;
  for (const [finger, index] of fingertipIndices.entries()) {
    const tip = cameraPoint(trackedHand[index], video.videoWidth, video.videoHeight, strings.width, strings.height);
    stringContext.beginPath();
    stringContext.moveTo(tip.x, tip.y);
    stringContext.lineTo(x * cell + 6 + finger * 4, y * cell + 9);
    stringContext.stroke();
    stringContext.beginPath();
    stringContext.arc(tip.x, tip.y, 2.8, 0, Math.PI * 2);
    stringContext.fill();
  }
}

const robot = new Image();
robot.src = 'assets/robot.svg';
robot.onload = () => { if (tiles) render(); };
const cell = 28;
let screen = 'title';
let index, tiles, x, y, steps, started, won;
let sound = false;
let cameraLive = false;
let audio;
let manualAt = -Infinity;

function beep(frequency) {
  if (!sound || audio?.state !== 'running') return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = 'square';
  oscillator.frequency.value = frequency;
  gain.gain.value = .045;
  gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .11);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + .12);
}

byId('sound').onclick = () => {
  if (!window.AudioContext) return;
  sound = !sound;
  if (sound) {
    audio ??= new AudioContext();
    audio.resume().catch(() => {});
  }
  byId('sound').textContent = sound ? 'Sound on' : 'Sound off';
  byId('sound').setAttribute('aria-pressed', String(sound));
};

function show(name, focus) {
  screen = name;
  for (const id of ['title', 'brief', 'play']) byId(id).hidden = id !== name;
  focus?.focus();
}

function reset(levelIndex) {
  camera.resetGesture();
  index = levelIndex;
  const level = levels[index];
  tiles = makeMaze(level);
  x = 1;
  y = 1;
  steps = 0;
  started = null;
  won = false;
  byId('clear').hidden = true;
  byId('level').textContent = '◆  LEVEL ' + String(index + 1).padStart(2, '0');
  byId('level-name').textContent = level.name;
  board.width = level.width * cell;
  board.height = level.height * cell;
  strings.width = board.width;
  strings.height = board.height;
  ctx.imageSmoothingEnabled = false;
  byId('steps').textContent = '00';
  byId('time').textContent = '00:00';
  byId('signal').textContent = '—';
  render();
}

function render() {
  ctx.clearRect(0, 0, board.width, board.height);
  if (cameraLive) {
    // Darken the feed just enough to keep the maze readable over bright backgrounds.
    ctx.fillStyle = 'rgba(16, 9, 30, .44)';
    ctx.fillRect(0, 0, board.width, board.height);
    ctx.fillStyle = '#ffe776';
  }
  tiles.forEach((row, ty) => row.forEach((wall, tx) => {
    const left = tx * cell;
    const top = ty * cell;
    if (cameraLive) {
      if (wall) return;
      for (const [dx, dy] of Object.values(directions)) {
        if (tiles[ty + dy]?.[tx + dx] === 0) continue;
        for (let offset = 3; offset < cell; offset += 7) {
          const dotX = dx === 0 ? left + offset : left + (dx > 0 ? cell - 3 : 0);
          const dotY = dy === 0 ? top + offset : top + (dy > 0 ? cell - 3 : 0);
          ctx.fillRect(dotX, dotY, 3, 3);
        }
      }
      return;
    }
    ctx.fillStyle = wall ? '#38235e' : '#140e25';
    ctx.fillRect(left, top, cell, cell);
    if (wall) {
      ctx.fillStyle = '#6546a8';
      ctx.fillRect(left + 1, top + 1, cell - 2, 3);
      ctx.fillStyle = '#281b49';
      ctx.fillRect(left + 1, top + cell - 4, cell - 2, 3);
      ctx.fillStyle = '#825fca';
      ctx.fillRect(left + 5, top + 8, 3, 3);
    } else {
      ctx.fillStyle = '#2b1c3f';
      ctx.fillRect(left, top, cell, 1);
      ctx.fillRect(left, top, 1, cell);
    }
  }));
  const gx = (levels[index].width - 2) * cell;
  const gy = (levels[index].height - 2) * cell;
  ctx.fillStyle = '#f674ca';
  ctx.fillRect(gx + 5, gy + 4, 18, 20);
  ctx.fillStyle = '#692e83';
  ctx.fillRect(gx + 8, gy + 7, 12, 14);
  ctx.fillStyle = '#ffe776';
  ctx.fillRect(gx + 12, gy + 11, 4, 6);
  if (robot.complete && robot.naturalWidth) ctx.drawImage(robot, x * cell + 2, y * cell + 2, 24, 24);
  else {
    ctx.fillStyle = '#7ef5b3';
    ctx.fillRect(x * cell + 5, y * cell + 5, 18, 18);
  }
  drawStrings();
  board.setAttribute('aria-label', 'Maze board. Robot at column ' + (x + 1) + ', row ' + (y + 1) + '. Portal at column ' + (levels[index].width - 1) + ', row ' + (levels[index].height - 1) + '.');
}

function clock() {
  const seconds = started === null ? 0 : Math.floor((performance.now() - started) / 1000);
  return [Math.floor(seconds / 60), seconds % 60].map(value => String(value).padStart(2, '0')).join(':');
}
setInterval(() => {
  if (screen === 'play' && !won) byId('time').textContent = clock();
}, 250);

function move(command, source) {
  if (screen !== 'play' || won) return;
  const now = performance.now();
  if (source === 'gesture' && now - manualAt < 550) return;
  if (source === 'manual') manualAt = now;
  const [dx, dy] = directions[command];
  const label = command[0].toUpperCase() + command.slice(1);
  if (tiles[y + dy]?.[x + dx] !== 0) {
    byId('signal').textContent = label + ' · wall';
    return;
  }
  started ??= now;
  x += dx;
  y += dy;
  steps++;
  byId('steps').textContent = String(steps).padStart(2, '0');
  byId('signal').textContent = label;
  render();
  if (x === levels[index].width - 2 && y === levels[index].height - 2) {
    won = true;
    beep(740);
    byId('time').textContent = clock();
    const final = index === levels.length - 1;
    if (final) camera.stop();
    byId('result').textContent = final ? 'Game cleared!' : 'Level cleared!';
    byId('summary').textContent = steps + ' steps · ' + clock();
    byId('next').textContent = final ? 'PLAY AGAIN' : 'NEXT MAZE';
    byId('clear').hidden = false;
    byId('next').focus();
  } else beep(240);
}

const camera = handCamera({
  video,
  hand: points => { trackedHand = points; drawStrings(); },
  status: (message) => {
    if (byId('camera-status').textContent !== message) byId('camera-status').textContent = message;
  },
  direction: command => move(command, 'gesture'),
  mode: () => byId('gesture-mode').value,
  state: (state) => {
    byId('camera').textContent = state === 'off' ? 'Enable camera' : state === 'loading' ? 'Cancel camera' : 'Disable camera';
    cameraLive = state === 'live';
    video.hidden = !cameraLive;
    byId('recenter').hidden = !cameraLive;
    byId('board').classList.toggle('camera-live', cameraLive);
    if (tiles) render();
  },
});

byId('start').onclick = () => show('brief', byId('brief').querySelector('h2'));
function enter(useCamera) {
  reset(0);
  show('play', byId('level-name'));
  if (useCamera) camera.start();
}
byId('enter').onclick = () => enter(true);
byId('skip').onclick = () => enter(false);
byId('next').onclick = () => {
  reset((index + 1) % levels.length);
  byId('level-name').focus();
};
byId('reset').onclick = () => reset(index);
byId('gesture-mode').onchange = event => {
  camera.resetGesture();
  byId('mode-help').textContent = event.target.value === 'step'
    ? 'Shift for one tile, then return to center before the next move.'
    : 'Hold your hand off-center to keep moving.';
};
byId('recenter').onclick = () => camera.resetGesture();
byId('camera').onclick = () => camera.active ? camera.stop() : camera.start();
document.querySelectorAll('[data-home]').forEach(button => button.onclick = () => {
  camera.stop();
  show('title', byId('start'));
});
document.querySelectorAll('[data-dir]').forEach(button => button.onclick = () => move(button.dataset.dir, 'manual'));
const keys = { arrowup: 'up', w: 'up', arrowleft: 'left', a: 'left', arrowdown: 'down', s: 'down', arrowright: 'right', d: 'right' };
document.addEventListener('keydown', event => {
  const command = keys[event.key.toLowerCase()];
  if (screen !== 'play' || won || !command || event.altKey || event.ctrlKey || event.metaKey) return;
  event.preventDefault();
  move(command, 'manual');
});
window.addEventListener('pagehide', () => camera.stop());
