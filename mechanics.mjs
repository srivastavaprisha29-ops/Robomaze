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

// Smooth small landmark changes while letting intentional motion catch up quickly.
export function createLandmarkFilter() {
  let last = null;
  let previousTime = 0;

  return (points, now) => {
    if (!points || !last || now - previousTime > 200) {
      last = points;
    } else {
      const dt = Math.max(1, now - previousTime);
      last = points.map((point, i) => {
        const dx = point.x - last[i].x;
        const dy = point.y - last[i].y;
        const response = Math.min(1, Math.hypot(dx, dy) / .045);
        const weight = 1 - Math.exp(-dt / (75 - 63 * response));
        return { x: last[i].x + dx * weight, y: last[i].y + dy * weight };
      });
    }
    previousTime = now;
    return last;
  };
}

export function createHandSteering() {
  let neutral = null;
  let previous = null;

  function reset() {
    neutral = null;
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
    const dx = center.x - neutral.x;
    const dy = center.y - neutral.y;
    if (previous) {
      const [sx, sy] = directions[previous];
      const along = dx * sx + dy * sy;
      const across = Math.abs(dx * sy - dy * sx);
      if (along >= .024 && across < along * 1.2) return previous;
    }
    const horizontal = Math.abs(dx) >= Math.abs(dy);
    const command = horizontal ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    previous = Math.max(Math.abs(dx), Math.abs(dy)) >= .045 ? command : null;
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
  let lastCommand = null;
  let needsRelease = false;

  function reset() {
    candidate = null;
    candidateSince = null;
    lastMove = -Infinity;
    lastCommand = null;
    needsRelease = false;
  }

  function update(command, now, mode) {
    if (candidateSince === null || command !== candidate) {
      candidate = command;
      candidateSince = now;
    }
    if (command === null) {
      if (now - candidateSince >= 95) needsRelease = false;
      return { phase: needsRelease ? 'release' : 'ready' };
    }
    if (mode === 'step' && needsRelease) return { phase: 'release' };
    if (now - candidateSince < 48) return { phase: 'aim' };
    if (command === lastCommand && now - lastMove < 175) return { phase: 'tracking' };
    lastMove = now;
    lastCommand = command;
    needsRelease = mode === 'step';
    return { phase: needsRelease ? 'release' : 'tracking', move: command };
  }

  return { update, reset };
}
