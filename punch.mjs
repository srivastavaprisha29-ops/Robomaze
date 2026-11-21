import { drawCast, mountCastPicker } from './punch-cast.mjs';
import { handCamera } from './camera.mjs';
import { cubes, drawCube, drawCubeImpact } from './cubes.mjs';
import { createFlickDetector } from './flick.mjs';

const byId = id => document.getElementById(id);
const video = byId('punch-video');
const canvas = byId('punch-stage');
const ctx = canvas.getContext('2d');
const button = byId('punch-camera');
const { width, height } = canvas;
const room = { left: 112, right: 568, top: 86, bottom: 354 };
const radius = 25;
const selectedRobot = mountCastPicker(byId('robot-cast'));
const detect = createFlickDetector();
let ready = false;
let frame;
let previous;
let x, y, vx, vy, angle, spin, impact, wall;
let demoDirection = 1;
let selectedCube = cubes[0];
let impactX, impactY;
const picker = byId('cube-picker');
for (const cube of cubes) {
  const option = document.createElement('button');
  option.type = 'button';
  option.className = 'cube-option';
  option.setAttribute('aria-pressed', String(cube === selectedCube));
  const preview = document.createElement('canvas');
  preview.width = 144;
  preview.height = 88;
  preview.setAttribute('aria-hidden', 'true');
  const previewContext = preview.getContext('2d');
  previewContext.scale(144 / width, 88 / height);
  drawCube(previewContext, cube, room);
  const name = document.createElement('strong');
  name.textContent = cube.name;
  const note = document.createElement('span');
  note.textContent = cube.note;
  option.append(preview, name, note);
  option.onclick = () => {
    selectedCube = cube;
    for (const button of picker.children) button.setAttribute('aria-pressed', String(button === option));
  };
  picker.append(option);
}

function reset() {
  x = width / 2;
  y = height / 2;
  vx = vy = angle = spin = impact = 0;
  wall = null;
  detect(null);
  byId('punch-power').value = 0;
  byId('punch-value').value = '0%';
}
reset();

function launch(hit) {
  const speed = 270 + hit.power * 850;
  vx = hit.x * speed;
  vy = hit.y * speed;
  spin = hit.x * (2 + hit.power * 9);
  const percent = Math.round(hit.power * 100);
  byId('punch-power').value = percent;
  byId('punch-value').value = percent + '%';
}

function advance(dt) {
  x += vx * dt;
  y += vy * dt;
  angle += spin * dt;

  const bounce = (position, velocity, min, max, near, far) => {
    if (position >= min && position <= max) return [position, velocity];
    wall = position < min ? near : far;
    impact = Math.min(1, Math.abs(velocity) / 780);
    impactX = wall === 'left' ? room.left : wall === 'right' ? room.right : Math.max(room.left, Math.min(room.right, x));
    impactY = wall === 'top' ? room.top : wall === 'bottom' ? room.bottom : Math.max(room.top, Math.min(room.bottom, y));
    spin *= -.52;
    return [Math.max(min, Math.min(max, position)), velocity * -.45];
  };
  [x, vx] = bounce(x, vx, room.left + radius, room.right - radius, 'left', 'right');
  [y, vy] = bounce(y, vy, room.top + radius, room.bottom - radius, 'top', 'bottom');
  const drag = Math.exp(-1.2 * dt);
  vx *= drag;
  vy *= drag;
  spin *= drag;
  impact = Math.max(0, impact - dt * 2);
}

function render() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = video.hidden ? '#17112c55' : '#10091e65';
  ctx.fillRect(0, 0, width, height);
  drawCube(ctx, selectedCube, room);
  if (wall && impact > 0) drawCubeImpact(ctx, selectedCube, impactX, impactY, impact);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  drawCast(ctx, selectedRobot(), -radius, -radius, radius * 2);
  ctx.restore();
}

function animate(now) {
  advance(Math.min(32, now - (previous ?? now)) / 1000);
  previous = now;
  render();
  frame = requestAnimationFrame(animate);
}

function status(message) {
  const label = byId('punch-status');
  if (label.textContent !== message) label.textContent = message;
}

const camera = handCamera({
  video,
  rawHand: true,
  hand: (points, now) => {
    const { armed, hit } = detect(points, now, video.videoWidth / video.videoHeight);
    if (!ready) return;
    if (hit) launch(hit);
    status(armed ? 'Finger loaded · flick outward' : 'Touch thumb to index or middle finger');
  },
  status: message => { if (!ready) status(message); },
  state: state => {
    ready = state === 'live';
    video.hidden = !ready;
    button.textContent = ready ? 'Disable camera' : state === 'loading' ? 'Cancel camera' : 'Enable camera';
  },
});
button.onclick = () => camera.active ? camera.stop() : camera.start();
byId('punch-demo').onclick = () => {
  reset();
  launch({ x: demoDirection, y: -.18, power: .65 });
  demoDirection *= -1;
};
byId('punch-reset').onclick = reset;
window.addEventListener('pagehide', () => {
  camera.stop();
  cancelAnimationFrame(frame);
});
window.addEventListener('pageshow', event => {
  if (event.persisted) frame = requestAnimationFrame(animate);
});
frame = requestAnimationFrame(animate);
