export const cast = [
  ['rookie','Arcade Bot','#7ef5b3','#ffdf81','Starter suit'],
  ['mean','Mean Girl','#ff68bc','#fff0a5','Pink tweed & bow'],
  ['exfriend','Ex-Best Friend','#b497ef','#f5b5ff','Patchwork jacket'],
  ['exboy','Ex-Boyfriend','#57287c','#fa6384','Moto jacket'],
  ['bestfriend','Boyfriend’s Best Friend','#617dff','#ffdc88','Varsity jacket'],
  ['boyfriend','Boyfriend','#34b5ab','#ff929f','Heart hoodie'],
  ['mother','Boyfriend’s Mother','#db3964','#fbd277','Sari & stern visor'],
  ['boss','Boss','#34405e','#edbf70','Pinstripe suit'],
  ['professor','Professor','#956648','#b6e2ff','Tweed & round glasses'],
  ['teacher','Teacher','#387459','#f7d785','Cardigan & lanyard'],
  ['guy','Annoying Guy','#ef8340','#a8ff95','Backward cap & headphones'],
  ['girl','Annoying Girl','#fd778d','#a8fff8','Star clips & neon jacket'],
];

export function drawCast(ctx, entry, x, y, size) {
  const [id,,coat,trim] = entry;
  ctx.save();
  ctx.translate(x-size/2,y-size/2);
  ctx.scale(size/64,size/64);
  const box=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
  const shape=(points,color)=>{
    ctx.fillStyle=color;
    ctx.beginPath();
    points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));
    ctx.closePath();ctx.fill();
  };
  const dot=(x,y,r,color)=>{
    ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  };
  const ink='#20162d', metal='#9295b5', shell='#d8deed', eye='#9ef8ff';
  box(30,1,4,12,metal);dot(32,4,4,trim);
  box(12,12,40,25,ink);box(15,10,34,26,shell);
  box(9,18,6,12,metal);box(49,18,6,12,metal);
  box(19,16,26,14,ink);
  box(23,21,5,4,eye);box(36,21,5,4,eye);
  box(28,31,8,1,metal);
  box(26,36,12,4,metal);
  box(12,41,7,12,coat);box(45,41,7,12,coat);
  dot(15,54,4,shell);dot(49,54,4,shell);
  shape([[22,39],[42,39],[47,55],[17,55]],coat);
  box(23,55,6,5,metal);box(35,55,6,5,metal);
  box(19,59,11,4,ink);box(34,59,11,4,ink);

  switch(id) {
    case 'mean':
      shape([[45,13],[36,7],[37,17],[44,14],[53,18],[53,7]],coat);
      dot(45,13,3,trim);
      box(21,41,22,2,trim);box(20,48,24,2,trim);
      for(let n=0;n<3;n++)box(31,42+n*4,3,2,trim);
      break;
    case 'exfriend':
      box(18,45,10,9,trim);box(36,40,7,8,'#7864bf');
      box(29,40,2,14,ink);box(34,49,8,3,'#fff1bd');
      break;
    case 'exboy':
      shape([[22,39],[31,44],[22,48],[26,52],[20,54]],trim);
      shape([[41,39],[34,46],[41,48],[38,54],[45,54]],ink);
      box(33,47,2,8,shell);
      break;
    case 'bestfriend':
      box(12,43,7,4,trim);box(45,43,7,4,trim);
      box(31,40,2,14,shell);box(36,43,5,2,trim);box(37,45,3,5,trim);
      break;
    case 'boyfriend':
      shape([[19,42],[24,37],[40,37],[45,42],[38,45],[26,45]],trim);
      shape([[32,53],[26,48],[29,46],[32,48],[35,46],[38,48]],trim);
      break;
    case 'mother':
      shape([[24,38],[29,39],[44,52],[45,55],[35,55],[19,45]],trim);
      box(19,53,26,2,'#ffae49');
      dot(32,14,2,'#f25069');dot(12,32,3,trim);dot(52,32,3,trim);
      shape([[22,18],[28,22],[28,19],[22,16]],trim);
      shape([[42,18],[36,22],[36,19],[42,16]],trim);
      box(29,32,6,2,ink);
      break;
    case 'boss':
      for(let n=0;n<4;n++)box(21+n*7,44,1,10,metal);
      shape([[25,39],[39,39],[32,52]],shell);
      shape([[32,40],[35,43],[32,51],[29,43]],trim);
      break;
    case 'professor':
      dot(24,23,7,trim);dot(40,23,7,trim);dot(24,23,4,ink);dot(40,23,4,ink);
      box(29,22,6,2,trim);box(14,45,5,5,trim);box(45,45,5,5,trim);
      shape([[25,40],[32,43],[39,40],[39,47],[32,44],[25,47]],trim);
      break;
    case 'teacher':
      shape([[24,39],[32,48],[40,39],[39,41],[32,52],[25,41]],trim);
      box(28,49,8,6,'#fff2bc');box(30,51,4,1,ink);
      box(43,43,7,10,'#8baed2');box(45,45,3,1,shell);
      break;
    case 'guy':
      shape([[14,10],[46,9],[48,15],[9,15]],coat);
      box(9,18,7,14,trim);box(48,18,7,14,trim);
      shape([[31,42],[36,42],[33,46],[37,46],[29,54],[31,48],[27,48]],trim);
      break;
    case 'girl':
      for (const [x,y] of [[15,12],[49,10]]) {
        shape([[x,y-5],[x+2,y-1],[x+6,y],[x+2,y+2],[x,y+6],[x-2,y+2],[x-5,y],[x-2,y-1]],trim);
      }
      shape([[23,40],[30,45],[25,54],[18,53]],trim);
      box(35,45,9,3,'#a259d0');box(33,49,11,2,trim);
      break;
    default:
      box(25,44,14,7,ink);box(29,46,6,3,trim);
  }
  ctx.restore();
}

export function mountCastPicker(container) {
  const key='robomaze.punch.robot';
  let selected=cast[0];
  try { selected=cast.find(([id])=>id===localStorage.getItem(key)) ?? selected; } catch {}
  const options=cast.map(entry=>{
    const button=document.createElement('button');
    button.type='button';
    button.className='cube-option cast-option';
    button.setAttribute('aria-pressed',String(selected===entry));
    const preview=document.createElement('canvas');
    preview.width=72;preview.height=72;
    preview.setAttribute('aria-hidden','true');
    drawCast(preview.getContext('2d'),entry,4,4,64);
    const name=document.createElement('strong');name.textContent=entry[1];
    const outfit=document.createElement('span');outfit.textContent=entry[4];
    button.append(preview,name,outfit);
    container.append(button);
    button.onclick=()=>{
      selected=entry;
      for(const option of options)option.setAttribute('aria-pressed',String(option===button));
      try { localStorage.setItem(key,entry[0]); } catch {}
    };
    return button;
  });
  return ()=>selected;
}
