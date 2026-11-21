export const materials = [
  { name: 'Iridescent Bloom', design: 'Opal petals', colors: ['#ff4c9f','#ffd4ed','#aa7bff','#90fff7'] },
  { name: 'Black Monolith', design: 'Gold fractures', colors: ['#171522','#655a77','#f4bc65','#fff0b8'] },
  { name: 'Inferno Circuit', design: 'Molten circuitry', colors: ['#620620','#fa304a','#ff882b','#fff0ae'] },
  { name: 'Abyss Aquarium', design: 'Deep-sea currents', colors: ['#073c8a','#297bfc','#5feeff','#ddffff'] },
  { name: 'Gilded Deco', design: 'Engraved brass fans', colors: ['#332019','#aa6b2b','#ffcc73','#fff0bf'] },
  { name: 'Jade Lotus', design: 'Carved jade rosettes', colors: ['#124846','#2aa780','#a9f8bd','#eaffd3'] },
  { name: 'Ultraviolet Pixel', design: 'Neon arcade mosaic', colors: ['#291360','#7f37cf','#f89bff','#a9ffff'] },
  { name: 'Porcelain Storm', design: 'Cobalt cloud scrolls', colors: ['#1c428d','#d6f4ff','#12448c','#fff8e6'] },
];

const corners = [[-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]];
const faces = [[0,1,2,3],[4,7,6,5],[0,4,5,1],[3,2,6,7],[0,3,7,4],[1,5,6,2]];
export function rotate([x,y,z], yaw, pitch) {
  const a = x*Math.cos(yaw) + z*Math.sin(yaw);
  const c = z*Math.cos(yaw) - x*Math.sin(yaw);
  return [a,y*Math.cos(pitch)-c*Math.sin(pitch),y*Math.sin(pitch)+c*Math.cos(pitch)];
}

export function viewDirection([x,y,z], yaw, pitch) {
  return rotate(rotate([x,y,z],0,-pitch),-yaw,0);
}

function polygon(ctx, points) {
  ctx.beginPath();
  points.forEach(([x,y], i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y));
  ctx.closePath();
}

function artwork(ctx, index, w, h, colors) {
  ctx.strokeStyle = colors[2];
  ctx.fillStyle = colors[3];
  if (index === 0) {
    ctx.translate(w*.5,h*.48);
    for (let i=0;i<16;i++) {
      ctx.rotate(Math.PI/8);
      ctx.beginPath();
      ctx.ellipse(28,0,70,15,0,0,Math.PI*2);
      ctx.stroke();
    }
  } else if (index === 1) {
    for (let i=0;i<8;i++) {
      polygon(ctx, [[i*w/7,0],[w*.5+(i%3-1)*23,h*.43],[i*w/8,h],[w*.53,h*.56]]);
      ctx.stroke();
    }
  } else if (index === 2) {
    for(let i=0;i<9;i++) {
      const d=i*11;
      polygon(ctx, [[w*.16+d,h*.09+d],[w*.84-d,h*.09+d],[w*.84-d,h*.65-d/2],[w*.58,h*.91-d],[w*.16+d,h*.68-d/2]]);
      ctx.stroke();
    }
  } else if (index === 3) {
    for(let i=0;i<15;i++) {
      ctx.beginPath();
      ctx.moveTo(0,i*17);
      ctx.bezierCurveTo(w*.32,i*17-72,w*.65,i*17+67,w,i*17-15);
      ctx.stroke();
    }
  } else if (index === 4) {
    for (const [x,y] of [[55,188],[165,188],[110,109],[55,30],[165,30]]) {
      ctx.beginPath();
      for (let ray=0;ray<=8;ray++) {
        const angle=Math.PI+ray*Math.PI/8;
        ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(angle)*45,y+Math.sin(angle)*45);
      }
      ctx.stroke();
      ctx.beginPath();ctx.arc(x,y,45,Math.PI,2*Math.PI);ctx.stroke();
    }
  } else if (index === 5) {
    for(const [x,y] of [[110,110],[23,23],[197,23],[23,197],[197,197]]) {
      ctx.save();ctx.translate(x,y);
      for(let petal=0;petal<8;petal++){
        ctx.rotate(Math.PI/4);
        ctx.beginPath();ctx.moveTo(0,0);
        ctx.quadraticCurveTo(-24,-24,0,-49);
        ctx.quadraticCurveTo(24,-24,0,0);ctx.stroke();
      }
      ctx.restore();
    }
  } else if (index === 6) {
    for(let y=0;y<11;y++)for(let x=0;x<11;x++){
      if ((x*7+y*11)%9>3)continue;
      ctx.fillStyle=colors[(x+y)%3+1];
      ctx.fillRect(x*20+3,y*20+3,14,14);
    }
    ctx.strokeRect(32,32,156,156);ctx.strokeRect(65,65,90,90);
  } else {
    for(let i=0;i<5;i++){
      ctx.beginPath();ctx.moveTo(0,22+i*44);
      for(let j=0;j<4;j++){
        const x=j*55,y=22+i*44;
        ctx.bezierCurveTo(x+10,y-33,x+46,y-33,x+43,y-4);
        ctx.bezierCurveTo(x+40,y+17,x+15,y+1,x+55,y);
      }
      ctx.stroke();
    }
  }
}

export function drawProCube(ctx, index, yaw, pitch, robot, collision, paintRobot, burst = 0) {
  const {width:w,height:h} = ctx.canvas;
  const colors=materials[index].colors;
  const project = ([x,y,z]) => {
    const zoom=Math.min(w,h)*1.13/(4.4+z);
    return [w/2+x*zoom,h/2+y*zoom,zoom];
  };
  const vertices=corners.map(p=>rotate(p,yaw,pitch));
  const ordered=faces.map((face,i)=>({i, points:face.map(v=>vertices[v]),
    depth:face.reduce((sum,v)=>sum+vertices[v][2],0)/4})).sort((a,b)=>b.depth-a.depth);
  function drawFace({i,points,depth}) {
    const screen=points.map(project);
    ctx.save();
    polygon(ctx,screen);
    ctx.clip();
    const [a,b,c,d]=screen;
    ctx.transform((b[0]-a[0])/220,(b[1]-a[1])/220,(d[0]-a[0])/220,(d[1]-a[1])/220,a[0],a[1]);
    const gradient=ctx.createLinearGradient(0,0,220,220);
    gradient.addColorStop(0,colors[0]);
    gradient.addColorStop(.58,colors[1]);
    gradient.addColorStop(1,colors[0]);
    ctx.globalAlpha=depth>=0 ? .68 : .23;
    ctx.fillStyle=gradient;
    // Overscan the affine pattern to fill the clipped perspective quadrilateral.
    ctx.fillRect(-200,-200,640,640);
    ctx.globalAlpha=depth>=0 ? .85 : .48;
    ctx.lineWidth=2.8;
    artwork(ctx,index,220,220,colors);
    ctx.restore();
    if (burst > 0) {
      ctx.save();
      polygon(ctx,screen);
      ctx.clip();
      ctx.transform((b[0]-a[0])/220,(b[1]-a[1])/220,(d[0]-a[0])/220,(d[1]-a[1])/220,a[0],a[1]);
      ctx.globalAlpha = Math.min(.9, burst * 1.8);
      ctx.lineWidth = 5;
      const shift = (1-burst)*120;
      for (let lane=0; lane<7; lane++) {
        const y=lane*39-30;
        ctx.strokeStyle=['#f9ff67','#ff53bd','#55fff1','#ad8cff'][ (lane+i)%4 ];
        ctx.shadowColor=ctx.strokeStyle;
        ctx.shadowBlur=10;
        ctx.beginPath();
        ctx.moveTo(-150,y+shift);
        ctx.lineTo(28+lane*7,y+shift);
        ctx.lineTo(28+lane*7,y+shift-26);
        ctx.lineTo(137+lane*6,y+shift-26);
        ctx.lineTo(137+lane*6,y+shift+5);
        ctx.lineTo(370,y+shift+5);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.save();
    ctx.restore();
    polygon(ctx,screen);
    ctx.strokeStyle=colors[3];
    ctx.lineWidth=collision?.face===i ? 2+collision.strength*8 : 2;
    ctx.stroke();
  }
  ordered.filter(face=>face.depth>=0).forEach(drawFace);
  const [x,y,scale]=project(rotate(robot,yaw,pitch));
  paintRobot(x,y,scale*.35);
  ordered.filter(face=>face.depth<0).forEach(drawFace);
}

export function advanceBody(position, velocity, dt) {
  let collision = null;
  const walls = [[4,5],[2,3],[0,1]];
  for (let axis=0;axis<3;axis++) {
    position[axis]+=velocity[axis]*dt;
    if (Math.abs(position[axis])>.83) {
      const side=position[axis]>0 ? 1 : 0;
      const strength=Math.min(1,Math.abs(velocity[axis])/6);
      if (!collision || strength>collision.strength) collision={face:walls[axis][side],strength};
      position[axis]=side ? .83 : -.83;
      velocity[axis]*=-.56;
    }
    velocity[axis]*=Math.exp(-1.2*dt);
  }
  return collision;
}
