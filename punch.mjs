import { handCamera } from './camera.mjs';
import { createFlickDetector } from './flick.mjs';

const byId = id => document.getElementById(id);
const video = byId('punch-video');
const canvas = byId('punch-stage');
const ctx = canvas.getContext('2d');
const button = byId('punch-camera');
const { width, height } = canvas;
const room = { left: 112, right: 568, top: 86, bottom: 354 };
const radius = 25;
const sprite = new Image();
sprite.src = 'assets/robot.svg';
const detect = createFlickDetector();
let ready = false;
let frame;
let previous;
let x, y, vx, vy, angle, spin, impact, wall;
let demoDirection = 1;

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

function rectangle(left, top, right, bottom) {
  ctx.strokeRect(left, top, right - left, bottom - top);
}

function render() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = video.hidden ? '#17112c55' : '#10091e65';
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.strokeStyle = '#8c6ae7';
  ctx.lineWidth = 2;
  rectangle(54, 39, 626, 393);
  for (const [ax, ay, bx, by] of [
    [54, 39, room.left, room.top], [626, 39, room.right, room.top],
    [54, 393, room.left, room.bottom], [626, 393, room.right, room.bottom],
  ]) {
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }
  ctx.strokeStyle = '#ffe776';
  ctx.lineWidth = 3;
  ctx.setLineDash([3, 8]);
  rectangle(room.left, room.top, room.right, room.bottom);
  ctx.setLineDash([]);
  if (wall && impact > 0) {
    const sides = {
      left: [room.left, room.top, room.left, room.bottom],
      right: [room.right, room.top, room.right, room.bottom],
      top: [room.left, room.top, room.right, room.top],
      bottom: [room.left, room.bottom, room.right, room.bottom],
    };
    const [ax, ay, bx, by] = sides[wall];
    ctx.globalAlpha = impact;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.imageSmoothingEnabled = false;
  if (sprite.complete && sprite.naturalWidth) ctx.drawImage(sprite, -radius, -radius, radius * 2, radius * 2);
  else {
    ctx.fillStyle = '#7ef5b3';
    ctx.fillRect(-20, -20, 40, 40);
  }
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
