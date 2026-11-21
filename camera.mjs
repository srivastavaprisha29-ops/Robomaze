import { createGestureControl, createHandSteering } from './mechanics.mjs';

const version = '0.10.22-rc.20250304';
const packageUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@' + version;
const modelUrl = 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
export function handCamera({ video, status, direction, state, mode, hand }) {
  const gesture = createGestureControl();
  const steering = createHandSteering();

  function resetGesture() {
    gesture.reset();
    steering.reset();
    hand(null);
  }

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
    resetGesture();
    video.srcObject = null;
    status(message);
    state('off');
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
          if (now - lastSample > 350) resetGesture();
          lastFrame = video.currentTime;
          lastSample = now;
          let points;
          try { [points] = tracker.detectForVideo(video, performance.now()).landmarks; }
          catch { stop('Hand tracking stopped. Try enabling the camera again.'); return; }
          hand(points ?? null);
          if (!points) {
            resetGesture();
            status('Show one open hand to set your center');
          } else {
            const command = steering.update(points, video.videoWidth / video.videoHeight);
            const { phase, move } = gesture.update(command, now, mode());
            const labels = {
              ready: 'Ready · slide your hand to steer',
              aim: 'Moving hand ' + command,
              tracking: 'Steering ' + command,
              release: 'Return your hand to center',
            };
            status(labels[phase]);
            if (move) direction(move);
          }
        }
        if (session === run) run.frame = requestAnimationFrame(tick);
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
  return { start, stop, resetGesture, get active() { return session !== null; } };
}
