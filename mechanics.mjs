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

export const fingertipIndices = [4, 8, 12, 16, 20];
const fingerBases = [1, 5, 9, 13, 17];

export function createHandSteering() {
  let neutral = null;
  let filtered = null;
  let previous = null;

  function reset() {
    neutral = null;
    filtered = null;
    previous = null;
  }

  function update(points, aspect) {
    if (!points) {
      reset();
      return null;
    }
    const center = { x: 0, y: 0 };
    for (const index of fingerBases) {
      center.x += (1 - points[index].x) * aspect / fingerBases.length;
      center.y += points[index].y / fingerBases.length;
    }
    neutral ??= center;
    filtered = filtered ? {
      x: filtered.x + (center.x - filtered.x) * .55,
      y: filtered.y + (center.y - filtered.y) * .55,
    } : center;
    const dx = filtered.x - neutral.x;
    const dy = filtered.y - neutral.y;
    const horizontal = Math.abs(dx) >= Math.abs(dy);
    const command = horizontal ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    const threshold = command === previous ? .035 : .065;
    previous = Math.max(Math.abs(dx), Math.abs(dy)) >= threshold ? command : null;
    return previous;
  }

  return { update, reset };
}

export function cameraPoint(point, videoWidth, videoHeight, boardWidth, boardHeight) {
  const scale = Math.max(boardWidth / videoWidth, boardHeight / videoHeight);
  return {
    x: (1 - point.x - .5) * videoWidth * scale + boardWidth / 2,
    y: (point.y - .5) * videoHeight * scale + boardHeight / 2,
  };
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
