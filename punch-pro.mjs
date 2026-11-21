import { drawCast, mountCastPicker } from './punch-cast.mjs';
import { handCamera } from './camera.mjs';
import { createFlickDetector } from './flick.mjs';
import { advanceBody, drawProCube, materials, viewDirection } from './pro-cube.mjs';

const get = id => document.getElementById(id);
const canvas=get('pro-canvas');
const ctx=canvas.getContext('2d');
const video=get('pro-video');
const picker=get('pro-materials');
const button=get('pro-camera');
const selectedRobot = mountCastPicker(get('robot-cast'));
const detect=createFlickDetector({depth:true});
const position=[0,0,0];
let velocity=[0,0,0];
let yaw=.58, pitch=-.4, material=0, collision=null, last, frame, drag=null, live=false;
const tower=get('strike-tower');
const marker=get('strike-marker');
const result=get('strike-result');
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)');
const bellPower=.94;
const overdrivePower=.99;
let strike=null;
let markerLevel=0;
let burst=0;
let demo=0;
const status=message=>{if(get('pro-status').textContent!==message)get('pro-status').textContent=message;};

materials.forEach(({name,design},i)=>{
  const tile=document.createElement('button');
  tile.type='button';
  tile.className='cube-option';
  tile.setAttribute('aria-pressed',String(i===0));
  const preview=document.createElement('canvas');
  preview.width=190;
  preview.height=132;
  preview.setAttribute('aria-hidden','true');
  drawProCube(preview.getContext('2d'),i,.58,-.4,[0,0,0],null,()=>{});
  const label=document.createElement('strong');
  label.textContent=name;
  const caption=document.createElement('span');
  caption.textContent=design;
  tile.append(preview,label,caption);
  tile.onclick=()=>{
    material=i;
    for(const item of picker.children) item.setAttribute('aria-pressed',String(item===tile));
  };
  picker.append(tile);
});

function launch({x,y,z,power}) {
  velocity=viewDirection([x,y,z],yaw,pitch).map(component=>component*(3.2+power*8));
  const percent=Math.round(power*100);
  get('pro-value').value=percent+'%';
  strike={target:Math.min(1.06,power/bellPower),elapsed:0,power};
  markerLevel=0;
  marker.style.bottom='0%';
  burst=0;
  tower.dataset.tier='green';
  result.textContent='Marker climbing…';
}

function orbit(dx,dy) {
  yaw+=dx;
  pitch=Math.max(-1.35,Math.min(1.35,pitch+dy));
}
canvas.onpointerdown=event=>{
  if(drag || event.button!==0)return;
  drag={id:event.pointerId,x:event.clientX,y:event.clientY};
  canvas.setPointerCapture(event.pointerId);
};
canvas.onpointermove=event=>{
  if(drag?.id!==event.pointerId)return;
  orbit((event.clientX-drag.x)*.009,(event.clientY-drag.y)*.009);
  drag.x=event.clientX;
  drag.y=event.clientY;
};
canvas.onlostpointercapture=()=>{drag=null;};
canvas.onkeydown=event=>{
  const delta={ArrowLeft:[-.1,0],ArrowRight:[.1,0],ArrowUp:[0,-.1],ArrowDown:[0,.1]}[event.key];
  if(delta){event.preventDefault();orbit(...delta);}
};

const camera=handCamera({
  video,
  rawHand:true,
  hand:(points,now)=>{
    const {armed,hit}=detect(points,now,video.videoWidth/video.videoHeight);
    if(!live)return;
    if(hit)launch(hit);
    status(armed?'Finger loaded · flick outward':'Touch thumb to index or middle finger');
  },
  status:message=>{if(!live)status(message);},
  state:state=>{
    live=state==='live';
    video.hidden=!live;
    button.textContent=live?'Disable camera':state==='loading'?'Cancel camera':'Enable camera';
  },
});
button.onclick=()=>camera.active?camera.stop():camera.start();
get('pro-demo').onclick=()=>{
  position.fill(0);
  collision=null;
  const directions=[[1,0,0],[0,-1,0],[0,0,-1],[-1,0,0],[0,1,0],[0,0,1]];
  const [x,y,z]=directions[demo%directions.length];
  const power=[.28,.62,.96,1][demo++%4];
  launch({x,y,z,power});
};

function animate(now) {
  const dt=Math.min(.033,(now-(last??now))/1000);
  last=now;
  if(strike){
    strike.elapsed+=dt;
    const progress=reduceMotion.matches?1:Math.min(1,strike.elapsed/.86);
    markerLevel=strike.target*(1-(1-progress)**2);
    marker.style.bottom=(Math.min(1.06,markerLevel)*100)+'%';
    tower.dataset.tier=markerLevel>=1?'red':markerLevel>=.45?'yellow':'green';
    if(progress===1){
      const overdrive=strike.power>=overdrivePower;
      result.textContent=overdrive?'OVERDRIVE · maze burst!':strike.target>=1?'Bell rung!':strike.target>=.45?'Strong hit':'Light hit';
      if(overdrive && !reduceMotion.matches)burst=1;
      strike=null;
    }
  }
  burst=Math.max(0,burst-dt/1.35);
  if(collision)collision.strength-=dt*2;
  collision=advanceBody(position,velocity,dt) ?? (collision?.strength>0?collision:null);
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawProCube(ctx,material,yaw,pitch,position,collision,(x,y,size)=>{
    drawCast(ctx, selectedRobot(), x-size/2, y-size/2, size);
  },burst);
  frame=requestAnimationFrame(animate);
}
window.addEventListener('pagehide',()=>{camera.stop();cancelAnimationFrame(frame);});
window.addEventListener('pageshow',event=>{if(event.persisted)frame=requestAnimationFrame(animate);});
frame=requestAnimationFrame(animate);
