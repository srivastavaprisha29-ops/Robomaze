export const directions = { up: [0, -1], left: [-1, 0], down: [0, 1], right: [1, 0] };
export const levels = [
  { name: 'Neon Depot', width: 15, height: 11, seed: 27 },
  { name: 'Circuit Garden', width: 19, height: 13, seed: 92 },
  { name: 'Midnight Relay', width: 23, height: 17, seed: 147 },
];

export function makeMaze({ width, height, seed }) {
  const tiles = Array.from({ length: height }, () => Array(width).fill(1));
  const stack = [[1, 1]];
  tiles[1][1] = 0;
  while (stack.length) {
    const [x, y] = stack.at(-1);
    const options = Object.values(directions).filter(([dx, dy]) => tiles[y + dy * 2]?.[x + dx * 2] === 1);
    if (!options.length) {
      stack.pop();
      continue;
    }
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const [dx, dy] = options[Math.floor(seed / 2 ** 32 * options.length)];
    tiles[y + dy][x + dx] = 0;
    tiles[y + dy * 2][x + dx * 2] = 0;
    stack.push([x + dx * 2, y + dy * 2]);
  }
  return tiles;
}

export function pointDirection(landmarks, aspect = 1) {
  if (landmarks?.length !== 21) return null;
  const distance = (a, b) => Math.hypot((landmarks[a].x - landmarks[b].x) * aspect, landmarks[a].y - landmarks[b].y);
  const extension = (base) => {
    const length = distance(base, base + 1) + distance(base + 1, base + 2) + distance(base + 2, base + 3);
    return length ? distance(base, base + 3) / length : 0;
  };
  const palm = distance(0, 9);
  if (!palm || extension(5) < .86 || distance(5, 8) < palm * .4) return null;
  if ([9, 13, 17].some(base => extension(base) > .82 && distance(base, base + 3) > palm * .4)) return null;
  const x = (landmarks[5].x - landmarks[8].x) * aspect; // The preview is mirrored.
  const y = landmarks[8].y - landmarks[5].y;
  if (Math.abs(x) > Math.abs(y) * 1.24) return x > 0 ? 'right' : 'left';
  if (Math.abs(y) > Math.abs(x) * 1.24) return y > 0 ? 'down' : 'up';
  return null;
}

export function createGestureControl() {
  let candidate = null;
  let candidateSince = null;
  let lastMove = -Infinity;
  let needsRelease = false;

  function reset() {
    candidate = null;
    candidateSince = null;
    lastMove = -Infinity;
    needsRelease = false;
  }

  function update(command, now, mode) {
    if (candidateSince === null || command !== candidate) {
      candidate = command;
      candidateSince = now;
    }
    if (command === null) {
      if (now - candidateSince >= 140) needsRelease = false;
      return { phase: needsRelease ? 'release' : 'ready' };
    }
    if (mode === 'step' && needsRelease) return { phase: 'release' };
    if (now - candidateSince < 140) return { phase: 'aim' };
    if (now - lastMove < 255) return { phase: 'tracking' };
    lastMove = now;
    needsRelease = mode === 'step';
    return { phase: needsRelease ? 'release' : 'tracking', move: command };
  }

  return { update, reset };
}
