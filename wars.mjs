import { handCamera } from './camera.mjs';
import { cameraPoint } from './mechanics.mjs';
import { drawCast } from './punch-cast.mjs';
import { createThumbWar } from './thumb-war.mjs';

const byId=id=>document.getElementById(id);
const video=byId('wars-video');
const canvas=byId('wars-canvas');
const ctx=canvas.getContext('2d');
const {width,height}=canvas;
const tracking=createThumbWar();
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
const players=[byId('wars-p1'),byId('wars-p2')];
const roster=[
  ['rookie','Robo Robo','#b7c9de','#f9d775'],
  ['mean','Pink Robo','#ff6ac4','#ffe1f7'],
  ['bestfriend','Blue Robo','#5d92ff','#c5ffff'],
  ['exboy','Red Robo','#ed425b','#ffca75'],
];
const arenas={
  metro:['#292947','#151a30','#6f75b2'],
  garden:['#235653','#133333','#81cfab'],
  sunrise:['#8c4e43','#4c3041','#e8ad77'],
};
const instructions={
  missing:'Show both thumbs and wrists. Scoring paused.',
  ambiguous:'Wrists overlap. Adjust the camera angle.',
  relink:'Tracking was interrupted. Raise both thumbs to relink.',
  clasp:'Clasp hands in view of the camera.',
  'thumbs-up':'Raise both thumbs to calibrate.',
  fight:'Fight! Pin the other thumb.',
};
let cameraLive=false, sample={}, winner=null, wonAt=0, frame;

players.forEach((select,i)=>{
  roster.forEach((entry,index)=>select.add(new Option(entry[1],String(index))));
  select.value=String(i?2:1);
});
function status(message){
  const el=byId('wars-status');
  if(el.textContent!==message)el.textContent=message;
}
function win(player,now){
  if(winner!==null)return;
  winner=player;
  wonAt=now;
  players.forEach(select=>{select.disabled=true;});
  byId('wars-award-1').disabled=true;
  byId('wars-award-2').disabled=true;
  const banner=byId('wars-winner');
  banner.textContent='PLAYER '+(player+1)+' · '+roster[players[player].value][1]+' wins!';
  banner.hidden=false;
  status('Round complete.');
}
function reset(){
  tracking.reset();
  sample={};
  winner=null;
  players.forEach(select=>{select.disabled=false;});
  byId('wars-award-1').disabled=false;
  byId('wars-award-2').disabled=false;
  byId('wars-winner').hidden=true;
  byId('wars-pin').value=0;
  status(cameraLive?instructions.clasp:'Enable the camera to start.');
}

function tiles(){
  const [light,dark,edge]=arenas[byId('wars-arena').value];
  for(let row=0;row<4;row++){
    const top=309+row*33;
    const grow=27+row*9;
    for(let col=-5;col<=5;col++){
      const a=width/2+col*grow*2;
      ctx.fillStyle=(row+col)%2===0?light:dark;
      ctx.strokeStyle=edge;
      ctx.beginPath();
      ctx.moveTo(a,top);
      ctx.lineTo(a+grow*2,top);
      ctx.lineTo(a+grow*2+(col+1)*18,top+33);
      ctx.lineTo(a+col*18,top+33);
      ctx.closePath();ctx.fill();ctx.stroke();
    }
  }
}
function render(now){
  ctx.clearRect(0,0,width,height);
  ctx.fillStyle=cameraLive?'#120b224d':'#170d29';
  ctx.fillRect(0,0,width,height);
  tiles();
  const move=byId('wars-style').value;
  const finish=winner===null?0:reducedMotion.matches?1:Math.min(1,(now-wonAt)/640);
  const motion=sample.motion??[0,0];
  for(let i=0;i<2;i++){
    const side=i===0?1:-1;
    const entry=roster[players[i].value];
    const x=(i===0?210:550)+side*motion[i]*(move==='sonic'?23:108);
    const y=245+(winner!==null && winner!==i ? 67*finish : 0);
    const size=145;
    ctx.save();ctx.translate(x,y);
    if(winner!==null && winner!==i){ctx.rotate(side*finish*1.35);ctx.globalAlpha=1-finish*.85;}
    ctx.fillStyle=entry[3];
    if(motion[i]>.25){
      if(move==='sonic'){
        ctx.strokeStyle=entry[3];ctx.lineWidth=6;
        for(let ring=0;ring<3;ring++){
          ctx.beginPath();ctx.ellipse(side*(56+ring*29),-5,7,14+ring*4,0,0,Math.PI*2);ctx.stroke();
        }
      } else {
        ctx.fillRect(side>0?35:-91,move==='kick'?36:-5,56*motion[i]+12,13);
        ctx.fillRect(side*(42+46*motion[i])-9,move==='kick'?35:-8,19,18);
      }
    }
    drawCast(ctx,entry,-size/2,-size/2,size);
    ctx.restore();
    if(sample.hands && video.videoWidth){
      const tip=cameraPoint(sample.hands[i][4],video.videoWidth,video.videoHeight,width,height);
      ctx.strokeStyle=entry[3];ctx.lineWidth=2;
      ctx.beginPath();ctx.moveTo(tip.x,tip.y);ctx.lineTo(x,y-54);ctx.stroke();
      ctx.beginPath();ctx.arc(tip.x,tip.y,5,0,Math.PI*2);ctx.stroke();
    }
    ctx.fillStyle=entry[3];ctx.font='bold 17px monospace';ctx.textAlign='center';
    ctx.fillText('P'+(i+1)+' · '+entry[1],i===0?178:582,378);
  }
  frame=requestAnimationFrame(render);
}

const camera=handCamera({
  video,
  hands:(hands,now)=>{
    if(!cameraLive || winner!==null)return;
    sample=tracking.update(hands,now,video.videoWidth/video.videoHeight);
    byId('wars-pin').value=sample.progress??0;
    if(sample.winner!=null)win(sample.winner,now);
    else status(sample.phase==='pin'?'Player '+(sample.pin+1)+' is holding a pin…':instructions[sample.phase]);
  },
  status:message=>{if(winner===null)status(message);},
  state:state=>{
    cameraLive=state==='live';
    video.hidden=!cameraLive;
    tracking.reset();
    sample={};
    byId('wars-pin').value=0;
    if(cameraLive && winner===null)status(instructions.clasp);
    byId('wars-camera').textContent=cameraLive?'Disable camera':state==='loading'?'Cancel camera':'Enable camera';
  },
});
byId('wars-camera').onclick=()=>camera.active?camera.stop():camera.start();
byId('wars-reset').onclick=reset;
byId('wars-award-1').onclick=()=>win(0,performance.now());
byId('wars-award-2').onclick=()=>win(1,performance.now());
window.addEventListener('pagehide',()=>{camera.stop();cancelAnimationFrame(frame);});
window.addEventListener('pageshow',event=>{if(event.persisted)frame=requestAnimationFrame(render);});
frame=requestAnimationFrame(render);
