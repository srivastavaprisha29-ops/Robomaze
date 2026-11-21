import { handCamera } from './camera.mjs';
import { cameraPoint, fingertipIndices } from './mechanics.mjs';

const canvas = document.querySelector('#dance-canvas');
const ctx = canvas.getContext('2d');
const video = document.querySelector('#dance-video');
const toggle = document.querySelector('#dance-toggle');
const cameraButton = document.querySelector('#dance-camera');
const status = document.querySelector('#dance-status');
const routine = document.querySelector('#routine');
const { width, height } = canvas;
let points = null;
let playing = !matchMedia('(prefers-reduced-motion: reduce)').matches;
let frame = 0;
let previous = null;
let time = 0;

function joint(x, y, length, angle) {
  return [x + Math.sin(angle) * length, y + Math.cos(angle) * length];
}

function line(path, color, size) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  path.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.stroke();
}

function dot(x, y, radius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function box(x, y, w, h, color, radius = 10) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
}

function fingerBend(tip) {
  if (!points) return 0;
  const distance = (a, b) => Math.hypot(
    (points[a].x - points[b].x) * video.videoWidth / video.videoHeight,
    points[a].y - points[b].y,
  );
  const length = distance(tip, tip - 1) + distance(tip - 1, tip - 2) + distance(tip - 2, tip - 3);
  return length ? Math.max(0, 1 - distance(tip, tip - 3) / length) : 0;
}

function render() {
  ctx.clearRect(0, 0, width, height);
  if (!video.hidden) box(0, 0, width, height, '#10091e55', 0);
  const beat = time * 5;
  const shuffle = routine.value === 'shuffle';
  const bounce = routine.value === 'bounce';
  const handX = points ? (0.5 - points[9].x) * 106 : 0;
  const handY = points ? (points[9].y - .5) * 95 : 0;
  const x = width / 2 + Math.sin(beat / 2) * (shuffle ? 95 : 24) + handX;
  const y = 231 - Math.abs(Math.sin(beat)) * (bounce ? 53 : 18) + handY;
  const ends = [];
  ctx.save();
  ctx.translate(x, 413);
  ctx.scale(1, .26);
  dot(0, 0, 107, '#392466b0');
  ctx.restore();

  const limbs = [-1, 1].map((side, i) => {
    const shoulder = [x + side * 49, y - 45];
    const hip = [x + side * 23, y + 63];
    const swing = Math.sin(beat + i * Math.PI);
    const armAngle = side * (1.55 + swing * (shuffle ? .46 : .89) - handY / 70);
    const elbow = joint(...shoulder, 48, armAngle);
    const wrist = joint(...elbow, 42, armAngle + side * (0.55 + 1.3 * fingerBend(i ? 8 : 4)));
    const knee = joint(...hip, 43, side * .24 + swing * (shuffle ? .62 : .33));
    const foot = joint(...knee, 46, -side * .15 - swing * .26 - side * fingerBend(i ? 20 : 16));
    ends[i] = wrist;
    ends[3 + i] = foot;
    return { shoulder, elbow, wrist, hip, knee, foot };
  });
  for (const { shoulder, elbow, wrist, hip, knee, foot } of limbs) {
    line([hip, knee, foot], '#271348', 28);
    line([hip, knee, foot], '#9270ff', 18);
    line([shoulder, elbow, wrist], '#271348', 27);
    line([shoulder, elbow, wrist], '#ab83ff', 17);
    for (const p of [shoulder, elbow, wrist, knee]) {
      dot(...p, 12, '#513297');
      dot(...p, 5, '#daa8ff');
    }
    box(foot[0] - 14, foot[1] - 5, 28, 13, '#f69adf', 4);
  }
  box(x - 43, y - 58, 86, 123, '#271348');
  box(x - 37, y - 52, 74, 109, '#734bd6');
  box(x - 29, y + 29, 58, 18, '#43287b', 5);
  const core = [x, y - 9 + fingerBend(12) * 12];
  ends[2] = core;
  dot(...core, 17, '#43319c');
  dot(...core, 10, '#8dfce8');
  box(x - 40, y - 124, 80, 60, '#513297');
  box(x - 33, y - 115, 66, 41, '#9873f9', 7);
  box(x - 26, y - 102, 52, 19, '#26194c', 5);
  box(x - 17, y - 97, 11, 8, '#94fff2', 3);
  box(x + 6, y - 97, 11, 8, '#94fff2', 3);
  line([[x, y - 124], [x + 10, y - 141]], '#ac86ff', 5);
  dot(x + 11, y - 143, 6, '#ffe776');

  if (points && video.videoWidth && video.videoHeight) {
    ctx.save();
    ctx.shadowColor = '#ffe776';
    ctx.shadowBlur = 8;
    fingertipIndices.forEach((index, finger) => {
      const tip = cameraPoint(points[index], video.videoWidth, video.videoHeight, width, height);
      line([[tip.x, tip.y], ends[finger]], '#ffe776', 1.6);
      dot(tip.x, tip.y, 4, '#fff5bd');
    });
    ctx.restore();
  }
}

function animate(now) {
  if (previous !== null && playing) time += Math.min(now - previous, 50) / 1000;
  previous = now;
  render();
  frame = requestAnimationFrame(animate);
}

function syncToggle() {
  toggle.textContent = playing ? 'Pause dance' : 'Start dance';
}
syncToggle();
toggle.onclick = () => {
  playing = !playing;
  syncToggle();
};
routine.onchange = () => { time = 0; };
const camera = handCamera({
  video,
  hand: result => { points = result; },
  status: message => { if (status.textContent !== message) status.textContent = message; },
  state: state => {
    video.hidden = state !== 'live';
    cameraButton.textContent = state === 'live' ? 'Disable camera' : state === 'loading' ? 'Cancel camera' : 'Enable camera';
  },
});
cameraButton.onclick = () => camera.active ? camera.stop() : camera.start();
window.addEventListener('pagehide', () => {
  camera.stop();
  cancelAnimationFrame(frame);
});
window.addEventListener('pageshow', event => {
  if (event.persisted) frame = requestAnimationFrame(animate);
});
frame = requestAnimationFrame(animate);
