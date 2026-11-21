const fingers = [[8, 5], [12, 9]];

export function createFlickDetector({ depth = false } = {}) {
  let charged = null;
  let lastFlick = -Infinity;

  return function detect(points, now, aspect) {
    if (!points) {
      charged = null;
      return { armed: false };
    }

    // Measure the finger relative to its knuckle and normalize by hand size.
    const palm = Math.hypot((points[0].x - points[9].x) * aspect, points[0].y - points[9].y);
    if (palm < .015) {
      charged = null;
      return { armed: false };
    }
    const relative = (tip, base) => ({
      x: (points[base].x - points[tip].x) * aspect / palm,
      y: (points[tip].y - points[base].y) / palm,
      z: depth ? ((points[tip].z ?? 0) - (points[base].z ?? 0)) * aspect / palm : 0,
    });
    const gap = tip => Math.hypot((points[4].x - points[tip].x) * aspect, points[4].y - points[tip].y,
      depth ? ((points[4].z ?? 0) - (points[tip].z ?? 0)) * aspect : 0) / palm;
    if (!charged) {
      const finger = fingers.find(([tip]) => gap(tip) <= .3);
      if (finger && now - lastFlick >= 180) {
        charged = { finger, ...relative(...finger), time: now };
      }
      return { armed: Boolean(charged) };
    }

    const { finger } = charged;
    const position = relative(...finger);
    if (gap(finger[0]) <= .35) {
      charged = { finger, ...position, time: now };
      return { armed: true };
    }

    const elapsed = now - charged.time;
    const dx = position.x - charged.x;
    const dy = position.y - charged.y;
    const dz = position.z - charged.z;
    const distance = Math.hypot(dx, dy, dz);
    const speed = distance / Math.max(elapsed, 1);
    if (elapsed <= 135 && gap(finger[0]) >= .52 && distance >= .24 && speed >= .004) {
      charged = null;
      lastFlick = now;
      return { armed: false, hit: { x: dx / distance, y: dy / distance, z: dz / distance, power: Math.min(1, .16 + speed * 25) } };
    }
    if (elapsed > 135) charged = null;
    return { armed: Boolean(charged) };
  };
}
