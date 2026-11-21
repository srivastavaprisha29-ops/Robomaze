export const cubes = [
  { id: 'prism', name: 'Rose Prism', note: 'Cut crystal', edge: '#ffb8e6', fill: '#c72b9760', spark: '#fff2fa' },
  { id: 'eclipse', name: 'Obsidian', note: 'Etched runes', edge: '#bfa7ff', fill: '#171225b8', spark: '#e1ddff' },
  { id: 'reactor', name: 'Crimson Reactor', note: 'Hot circuitry', edge: '#ff796e', fill: '#9e221370', spark: '#ffdb86' },
  { id: 'tidal', name: 'Tidal Glass', note: 'Liquid contours', edge: '#8ff6ff', fill: '#0c70976b', spark: '#ddffff' },
];

function path(ctx, points, close = false) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  if (close) ctx.closePath();
}

function motif(ctx, id, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.lineWidth = .075;
  if (id === 'prism') {
    path(ctx, [[0,-1],[.78,-.2],[0,1],[-.78,-.2]],true);
    ctx.stroke();
    path(ctx, [[-.78,-.2],[.78,-.2],[0,.19],[0,1],[0,-1]]);
    ctx.stroke();
  } else if (id === 'eclipse') {
    ctx.beginPath();
    ctx.arc(0, 0, .67, -.8, 4.43);
    ctx.stroke();
    path(ctx, [[-.85,.65],[-.3,-.1],[.21,.32],[.8,-.69]]);
    ctx.stroke();
    ctx.strokeRect(-.16,-.16,.32,.32);
  } else if (id === 'reactor') {
    for (const side of [-1,1]) {
      path(ctx, [[side*.96,-.72],[side*.58,-.72],[side*.27,-.24],[side*.27,.13],[side*.84,.13]]);
      ctx.stroke();
      ctx.strokeRect(side*.84-.11,.03,.22,.2);
    }
    path(ctx, [[-.29,.51],[.08,.29],[-.03,.61],[.3,.52],[-.09,.93],[.01,.61]],true);
    ctx.fill();
  } else {
    for (const row of [-.45,0,.45]) {
      ctx.beginPath();
      ctx.moveTo(-.94,row);
      ctx.bezierCurveTo(-.34,row-.61,.2,row+.62,.93,row-.15);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(.54,-.66,.13,0,Math.PI*2);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawCube(ctx, cube, room) {
  const { left:l, top:t, right:r, bottom:b } = room;
  const outer = [[l-58,t-47],[r+58,t-47],[r+58,b+39],[l-58,b+39]];
  const inner = [[l,t],[r,t],[r,b],[l,b]];
  ctx.save();
  ctx.strokeStyle = cube.edge;
  ctx.fillStyle = cube.fill;
  for (let i=0; i<4; i++) {
    const j=(i+1)%4;
    path(ctx,[outer[i],outer[j],inner[j],inner[i]],true);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = cube.spark;
    ctx.fillStyle = cube.spark;
    ctx.globalAlpha = .68;
    const horizontal = i % 2 === 0;
    for (let n=0; n<(horizontal ? 11 : 6); n++) {
      motif(ctx,cube.id,horizontal ? l+12+n*43 : i===1 ? r+29 : l-29,
        horizontal ? (i===0 ? t-23 : b+20) : t+12+n*46, horizontal ? 13 : 17);
    }
    ctx.restore();
  }
  ctx.shadowColor = cube.edge;
  ctx.shadowBlur = 14;
  ctx.lineWidth = 3;
  ctx.strokeRect(l,t,r-l,b-t);
  ctx.shadowBlur = 0;
  ctx.globalAlpha = .74;
  ctx.lineWidth = 1;
  ctx.strokeRect(l+7,t+7,r-l-14,b-t-14);
  ctx.restore();
}

export function drawCubeImpact(ctx, cube, x, y, impact) {
  ctx.save();
  ctx.globalAlpha = impact;
  ctx.strokeStyle = cube.spark;
  ctx.fillStyle = cube.spark;
  ctx.shadowColor = cube.edge;
  ctx.shadowBlur = 12;
  const spread = 13 + (1-impact)*70;
  for (let i=0; i<8; i++) {
    const angle = i*Math.PI/4;
    motif(ctx,cube.id,x+Math.cos(angle)*spread,y+Math.sin(angle)*spread,4+impact*8);
  }
  ctx.restore();
}
