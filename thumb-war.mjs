export const pinDuration = 1200;

const distance = (a,b,aspect) => Math.hypot((a.x-b.x)*aspect,a.y-b.y);
function thumbContact(tip, base, end, aspect) {
  const dx=(end.x-base.x)*aspect, dy=end.y-base.y;
  const px=(tip.x-base.x)*aspect, py=tip.y-base.y;
  const length=dx*dx+dy*dy;
  const t=length ? Math.max(0,Math.min(1,(px*dx+py*dy)/length)) : 0;
  return Math.hypot(px-t*dx,py-t*dy);
}

export function createThumbWar() {
  let wrists, neutral, last, pinSince, pin;
  function resetPin() { pin=null;pinSince=null; }
  function reset() { wrists=null;neutral=null;last=null;resetPin(); }
  reset();

  function update(hands, now, aspect) {
    if(hands.length!==2 || hands.some(h=>h.length!==21) || !Number.isFinite(aspect) || aspect<=0){
      resetPin();
      return { phase:'missing' };
    }
    let [a,b]=hands;
    const separation=distance(a[0],b[0],aspect);
    if(separation<.075){resetPin();return {phase:'ambiguous'};}
    if(last!==null && now-last>250) resetPin();
    if(wrists){
      const direct=distance(a[0],wrists[0],aspect)+distance(b[0],wrists[1],aspect);
      const swapped=distance(b[0],wrists[0],aspect)+distance(a[0],wrists[1],aspect);
      if(Math.abs(direct-swapped)<.035 || (last!==null && now-last>750)){
        reset();
        return {phase:'relink'};
      }
      if(swapped<direct)[a,b]=[b,a];
    } else if(a[0].x<b[0].x) [a,b]=[b,a]; // Player 1 is on the left of the mirrored view.
    wrists=[a[0],b[0]];
    last=now;
    const scale=[a,b].map(h=>Math.max(.03,distance(h[0],h[9],aspect)));
    const pose=[a,b].map((h,i)=>({
      height:(h[2].y-h[4].y)/scale[i],
      reach:(h[4].x-h[2].x)*aspect/scale[i],
    }));
    const height=pose.map(thumb=>thumb.height);
    const linked=distance(a[9],b[9],aspect)<.23;
    if(!neutral){
      if(linked && height.every(n=>n>.18))neutral=pose;
      else return {phase:linked?'thumbs-up':'clasp',hands:[a,b]};
    }
    if(!linked){resetPin();return {phase:'clasp',hands:[a,b]};}
    const contactRadius=Math.max(.023,(scale[0]+scale[1])*.16);
    const pressing=(attacker,defender,i,j)=>{
      const drop=neutral[j].height-height[j];
      return drop>.52 && height[j]<.12 && drop>neutral[i].height-height[i]+.28 &&
        attacker[4].y < defender[4].y+.018 &&
        thumbContact(defender[4],attacker[2],attacker[4],aspect)<contactRadius;
    };
    const candidate=pressing(a,b,0,1)?0:pressing(b,a,1,0)?1:null;
    if(candidate!==pin){pin=candidate;pinSince=now;}
    const progress=pin===null?0:Math.min(1,(now-pinSince)/pinDuration);
    const motion=pose.map((thumb,i)=>{
      const down=neutral[i].height-thumb.height;
      const inward=(thumb.reach-neutral[i].reach)*(i===0?-1:1);
      return Math.min(1,Math.max(0,down,inward)*1.1);
    });
    if(candidate!==null)motion[candidate]=1;
    return {phase:pin===null?'fight':'pin',hands:[a,b],motion,pin,progress,winner:progress===1?pin:null};
  }
  return { update, reset };
}
