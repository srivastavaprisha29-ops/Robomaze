import { createGestureControl, pointDirection } from './mechanics.mjs';

const version = '0.10.22-rc.20250304';
const packageUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@' + version;
const modelUrl = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const fingers = [[0,1,2,3,4],[0,5,6,7,8],[5,9,10,11,12],[9,13,14,15,16],[13,17,18,19,20],[17,0]];

export function handCamera({ video, overlay, status, direction, state, mode }) {
  const ctx = overlay.getContext('2d');
  const gesture = createGestureControl();
  let session = null;
  let detectorPromise;
  function detector() {
    detectorPromise ??= import(packageUrl + '/vision_bundle.mjs').then(async ({ FilesetResolver, HandLandmarker }) => {
      const files = await FilesetResolver.forVisionTasks(packageUrl + '/wasm');
      return HandLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: modelUrl },
        runningMode: 'VIDEO', numHands: 1,
      });
    }).catch(error => { detectorPromise = null; throw error; });
    return detectorPromise;
  }
  function stop(message = 'Camera off') {
    if (session) {
      cancelAnimationFrame(session.frame);
      session.stream?.getTracks().forEach(track => track.stop());
      session = null;
    }
    gesture.reset();
    video.srcObject = null;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    status(message);
    state('off');
  }
  function draw(points) {
    if (overlay.width !== video.videoWidth || overlay.height !== video.videoHeight) {
      overlay.width = video.videoWidth;
      overlay.height = video.videoHeight;
    }
    const { width, height } = overlay;
    ctx.clearRect(0, 0, width, height);
    if (!points) return;
    ctx.strokeStyle = '#7ef5b3';
    ctx.lineWidth = Math.max(2, width / 210);
    for (const chain of fingers) {
      ctx.beginPath();
      chain.forEach((index, i) => {
        const { x, y } = points[index];
        if (i === 0) ctx.moveTo(x * width, y * height);
        else ctx.lineTo(x * width, y * height);
      });
      ctx.stroke();
    }
    ctx.fillStyle = '#ffe776';
    ctx.beginPath();
    ctx.arc(points[8].x * width, points[8].y * height, width / 90, 0, Math.PI * 2);
    ctx.fill();
  }
  async function start() {
    if (session) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      stop('Camera needs HTTPS or localhost. Manual controls are available.');
      return;
    }
    const run = { frame: 0, stream: null };
    session = run;
    state('loading');
    status('Allow camera access to continue.');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 } }, audio: false });
      if (session !== run) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      run.stream = stream;
      stream.getVideoTracks()[0].addEventListener('ended', () => {
        if (session === run) stop('Camera disconnected. Manual controls are available.');
      });
      video.srcObject = stream;
      await video.play();
      if (session !== run) return;
      status('Loading hand-tracking model…');
      const tracker = await detector();
      if (session !== run) return;
      state('live');
      let lastFrame = -1;
      let lastSample = -Infinity;
      function tick(now) {
        if (video.readyState >= 2 && video.currentTime !== lastFrame && now - lastSample >= 40) {
          if (now - lastSample > 350) gesture.reset();
          lastFrame = video.currentTime;
          lastSample = now;
          let points;
          try { [points] = tracker.detectForVideo(video, performance.now()).landmarks; }
          catch { stop('Hand tracking stopped. Try enabling the camera again.'); return; }
          draw(points);
          const command = pointDirection(points, video.videoWidth / video.videoHeight);
          const { phase, move } = gesture.update(command, now, mode());
          const labels = {
            ready: points ? 'Ready · point to move' : 'Camera live · show one hand',
            aim: 'Hold your point ' + command,
            tracking: 'Tracking · ' + command,
            release: 'Relax your hand for another step',
          };
          status(labels[phase]);
          if (move) direction(move);
        }
        run.frame = requestAnimationFrame(tick);
      }
      run.frame = requestAnimationFrame(tick);
    } catch (error) {
      if (session !== run) return;
      const message = error.name === 'NotAllowedError' ? 'Camera access blocked. Manual controls are available.'
        : !run.stream ? 'Camera unavailable. Manual controls are available.'
        : 'Could not start hand tracking. Try again or use manual controls.';
      stop(message);
    }
  }
  return { start, stop, resetGesture: gesture.reset, get active() { return session !== null; } };
}
