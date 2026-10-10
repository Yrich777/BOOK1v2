'use strict';
const scenes=[...document.querySelectorAll('.scene')];
const nav=document.querySelector('#chapters');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let current=0,busy=false,paused=reduced.matches,width=innerWidth,height=innerHeight,dpr=Math.min(devicePixelRatio||1,2);
const imageCache=new Map();
const materialMasks=new Map();
const paths=['hero','city','dagger','marble','rasta-interworld-tunnel','puzyr-courtyard'];
paths.forEach(name=>{const im=new Image();im.src=`assets/${name}.webp`;imageCache.set(name,im)});
const dots=scenes.map((s,i)=>{const b=document.createElement('button');b.className='chapter-dot';b.setAttribute('aria-label',`${i+1}. ${s.dataset.title}`);b.title=s.dataset.title;b.addEventListener('click',()=>turn(i));nav.append(b);return b});
const pageCanvas=document.querySelector('#page-turn'),pc=pageCanvas.getContext('2d');
const portalCanvas=document.querySelector('.portal'),vc=portalCanvas.getContext('2d');
const embers=document.querySelector('#embers'),ec=embers.getContext('2d');
function resize(){width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,2);[pageCanvas,portalCanvas,embers].forEach(c=>{c.width=width*dpr;c.height=height*dpr;c.getContext('2d').setTransform(dpr,0,0,dpr,0,0)});if(paused)ambient(0)}
function update(){document.querySelector('#page-number').textContent=String(current+1).padStart(2,'0');document.querySelector('#progress').style.width=`${(current+1)/scenes.length*100}%`;document.querySelector('#prev').disabled=current===0;document.querySelector('#next').disabled=current===scenes.length-1;dots.forEach((b,i)=>{if(i===current)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});document.querySelector('#announcement').textContent=`Страница ${current+1} из ${scenes.length}. ${scenes[current].dataset.title}`;window.Inaya?.sceneChanged();history.replaceState(null,'',`#${scenes[current].id}`)}
function show(i){scenes[current].hidden=true;scenes[current].classList.remove('active');current=i;scenes[current].hidden=false;scenes[current].classList.add('active');update();if(paused)ambient(0)}
function drawCover(ctx,img,w,h,position=.5){if(!img?.complete||!img.naturalWidth)return;const s=Math.max(w/img.width,h/img.height);ctx.drawImage(img,(w-img.width*s)*position,(h-img.height*s)*.5,img.width*s,img.height*s)}
const runes='ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛋᛏᛒᛖᛗᛚᛜᛞᛟ';
function parchment(){const c=document.createElement('canvas');c.width=Math.min(1600,Math.round(width));c.height=Math.round(c.width*height/width);const x=c.getContext('2d'),w=c.width,h=c.height;const g=x.createLinearGradient(0,0,w,h);g.addColorStop(0,'#746247');g.addColorStop(.35,'#b7a07a');g.addColorStop(.68,'#c4ad84');g.addColorStop(1,'#6d5941');x.fillStyle=g;x.fillRect(0,0,w,h);for(let j=0;j<14000;j++){x.fillStyle=Math.random()>.5?'#e6c99118':'#35292016';const n=1+Math.random()*2;x.fillRect(Math.random()*w,Math.random()*h,n,n)}x.strokeStyle='#44331d66';x.lineWidth=1;x.strokeRect(w*.035,h*.035,w*.93,h*.93);x.strokeRect(w*.045,h*.045,w*.91,h*.91);x.textAlign='center';x.textBaseline='middle';const step=Math.max(30,w/25);x.font=`${step*.49}px Georgia`;for(let y=step;y<h;y+=step*1.15)for(let a=step;a<w;a+=step){x.fillStyle=`rgba(70,48,22,${.22+Math.random()*.25})`;x.fillText(runes[Math.floor(Math.random()*runes.length)],a,y)}x.save();x.translate(w/2,h/2);x.strokeStyle='#58432455';[.16,.22,.31].forEach(r=>{x.beginPath();x.arc(0,0,Math.min(w,h)*r,0,Math.PI*2);x.stroke()});x.font=`${Math.min(w,h)*.18}px Georgia`;x.fillStyle='#73542655';x.fillText('ᛟ',0,0);x.restore();return c}
// A travelling cylindrical fold, sampled in two dimensions: the lower corner
// lifts first, and the fold radius and diagonal change throughout the turn.
function sceneTexture(index){
 const c=document.createElement('canvas');c.width=width;c.height=height;const x=c.getContext('2d');
 x.fillStyle='#091210';x.fillRect(0,0,width,height);
 const im=imageCache.get(paths[index]);if((index===3||index===4)&&width<600&&im?.naturalWidth){const terrace=index===3,s=height*(terrace?.62:.44)/im.height;x.drawImage(im,(width-im.width*s)*(terrace?.75:.83),terrace?0:height*.12,im.width*s,im.height*s)}else drawCover(x,im,width,height,index===0&&width<600?.67:index===2?(width<600?.69:.66):index===5?.75:.5);
 const g=x.createLinearGradient(0,0,width,0);g.addColorStop(0,'#06100fed');g.addColorStop(.4,'#07121199');g.addColorStop(1,'#07100c22');x.fillStyle=g;x.fillRect(0,0,width,height);
 window.Inaya?.paintTo(x);
 const walker=document.createTreeWalker(scenes[index],NodeFilter.SHOW_TEXT);let node;
 while(node=walker.nextNode()){if(!node.textContent.trim())continue;const el=node.parentElement,style=getComputedStyle(el);if(style.display==='none')continue;x.font=style.font;x.fillStyle=el.closest('.gold')?'#d9bb79':style.color;x.textBaseline='top';
 for(let j=0;j<node.length;j++){if(!node.textContent[j].trim())continue;const r=document.createRange();r.setStart(node,j);r.setEnd(node,j+1);const box=r.getBoundingClientRect();if(box.width)x.fillText(node.textContent[j],box.x,box.y);}}
 return c;
}
function triangle(ctx,img,src,dst){
 const [a,b,c]=src,[p,q,r]=dst;
 const den=(b.x-a.x)*(c.y-a.y)-(c.x-a.x)*(b.y-a.y);if(Math.abs(den)<.001)return;
 const A=((q.x-p.x)*(c.y-a.y)-(r.x-p.x)*(b.y-a.y))/den;
 const B=((q.y-p.y)*(c.y-a.y)-(r.y-p.y)*(b.y-a.y))/den;
 const C=((r.x-p.x)*(b.x-a.x)-(q.x-p.x)*(c.x-a.x))/den;
 const D=((r.y-p.y)*(b.x-a.x)-(q.y-p.y)*(c.x-a.x))/den;
 ctx.save();ctx.beginPath();const mx=(p.x+q.x+r.x)/3,my=(p.y+q.y+r.y)/3;[p,q,r].forEach((v,i)=>{const dx=v.x-mx,dy=v.y-my,n=Math.hypot(dx,dy)||1;const x=v.x+dx/n*.8,y=v.y+dy/n*.8;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.closePath();ctx.clip();ctx.transform(A,B,C,D,p.x-A*a.x-C*a.y,p.y-B*a.x-D*a.y);const sx=Math.max(0,Math.min(a.x,b.x,c.x)-2),sy=Math.max(0,Math.min(a.y,b.y,c.y)-2),sw=Math.min(img.width,Math.max(a.x,b.x,c.x)+2)-sx,sh=Math.min(img.height,Math.max(a.y,b.y,c.y)+2)-sy;ctx.drawImage(img,sx,sy,sw,sh,sx,sy,sw,sh);ctx.restore();
}
function turn(target){
 if(busy||target===current||target<0||target>=scenes.length)return;
 const focus=document.activeElement,wasSceneControl=scenes[current].contains(focus);
 if(paused||reduced.matches){show(target);if(wasSceneControl)document.querySelector('#next').focus({preventScroll:true});return}
 busy=true;const backward=target<current,texture=parchment(),front=sceneTexture(current);
 const frame=document.createElement('canvas');frame.width=width;frame.height=height;const fx=frame.getContext('2d');
 const reverse=document.createElement('canvas');reverse.width=width;reverse.height=height;const rx=reverse.getContext('2d');
 const started=performance.now(),duration=1750;pageCanvas.style.display='block';show(target);
 function animate(now){
 const raw=Math.min(1,(now-started)/duration),t=raw*raw*(3-2*raw);
 pc.clearRect(0,0,width,height);fx.clearRect(0,0,width,height);fx.drawImage(front,0,0);
 fx.globalAlpha=Math.min(.94,raw*3.5);fx.drawImage(texture,0,0,width,height);fx.globalAlpha=1;
 fx.save();fx.font=`${Math.max(20,width/48)}px Georgia`;fx.shadowColor='#ffb92f';fx.shadowBlur=14;
 for(let j=0;j<66;j++){fx.fillStyle=`rgba(255,222,142,${(.35+.6*Math.sin(j+raw*9)**2)*Math.min(1,raw*5)})`;fx.fillText(runes[j%runes.length],(j*137.51)%width,(j*73.9)%height)}fx.restore();
 // Darker verso with the front's marks faintly transmitted through the fibres.
 rx.clearRect(0,0,width,height);rx.drawImage(texture,0,0,width,height);
 rx.fillStyle='#49372555';rx.fillRect(0,0,width,height);
 rx.save();rx.translate(width,0);rx.scale(-1,1);rx.globalAlpha=.20;rx.drawImage(frame,0,0);rx.restore();
 pc.save();if(backward){pc.translate(width,0);pc.scale(-1,1)}
 const lift=Math.sin(Math.PI*Math.min(1,raw/.32));
 const radius=width*(.035+.105*Math.sin(t*Math.PI)**.8),fold=width*(1.025-1.34*t),twist=-(.20*lift+.15*Math.sin(t*Math.PI));
 function point(u,v){const y=v*height,edge=fold+(v-.5)*width*twist+Math.sin(v*Math.PI)*width*.025*Math.sin(t*Math.PI),dist=u*width-edge;let x=u*width,z=0,angle=0;
 if(dist>0){angle=Math.min(Math.PI,dist/radius);x=edge+radius*Math.sin(angle)-Math.max(0,dist-Math.PI*radius);z=radius*(1-Math.cos(angle));}
 const perspective=1/(1-z/(width*3));return {x:width*.5+(x-width*.5)*perspective,y:height*.5+(y-height*.5)*perspective+Math.sin(angle)*(v-.5)*height*.065,z,angle};}
 const shadow=pc.createLinearGradient(fold-60,0,fold+radius*2.8,0);shadow.addColorStop(0,'#0000');shadow.addColorStop(.4,'#0009');shadow.addColorStop(1,'#0000');pc.fillStyle=shadow;pc.fillRect(Math.max(0,fold-60),0,radius*3.5,height);
 const cols=36,rows=10;
 for(let j=0;j<cols;j++)for(let k=0;k<rows;k++){
 const u=j/cols,v=k/rows,U=(j+1)/cols,V=(k+1)/rows;
 const src=[{x:u*width,y:v*height},{x:U*width,y:v*height},{x:U*width,y:V*height},{x:u*width,y:V*height}];
 const dst=[point(u,v),point(U,v),point(U,V),point(u,V)];
 if(backward)src.forEach(p=>p.x=width-p.x);
 const surface=dst.reduce((sum,p)=>sum+p.angle,0)/4>Math.PI/2?reverse:frame;
 triangle(pc,surface,[src[0],src[1],src[2]],[dst[0],dst[1],dst[2]]);triangle(pc,surface,[src[0],src[2],src[3]],[dst[0],dst[2],dst[3]]);
 const angle=dst[0].angle,shade=Math.sin(angle)*.42;
 if(shade>.01){pc.beginPath();dst.forEach((p,i)=>i?pc.lineTo(p.x,p.y):pc.moveTo(p.x,p.y));pc.closePath();pc.fillStyle=`rgba(30,18,6,${shade})`;pc.fill();}
 }
 pc.restore();if(raw<1)requestAnimationFrame(animate);else{pageCanvas.style.display='none';pc.clearRect(0,0,width,height);busy=false;if(wasSceneControl)document.querySelector(target===6?'#prev':'#next').focus({preventScroll:true})}
 }requestAnimationFrame(animate);
}
document.querySelectorAll('.next').forEach(b=>b.addEventListener('click',()=>turn(current+1)));document.querySelector('#next').addEventListener('click',()=>turn(current+1));document.querySelector('#prev').addEventListener('click',()=>turn(current-1));document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();turn(0)});document.querySelector('.restart').addEventListener('click',()=>turn(0));
let wheelTotal=0,wheelLast=0;addEventListener('wheel',e=>{if(e.ctrlKey)return;e.preventDefault();const now=performance.now();if(busy){wheelTotal=0;wheelLast=now;return}if(now-wheelLast>220)wheelTotal=0;wheelLast=now;wheelTotal+=e.deltaY;if(Math.abs(wheelTotal)>65){turn(current+(wheelTotal>0?1:-1));wheelTotal=0}},{passive:false});
addEventListener('keydown',e=>{if(e.altKey||e.ctrlKey||e.metaKey)return;if(e.target.closest('button,a')&&[' ','Enter'].includes(e.key))return;if(['ArrowRight','ArrowDown','PageDown',' '].includes(e.key)){e.preventDefault();turn(current+1)}if(['ArrowLeft','ArrowUp','PageUp'].includes(e.key)){e.preventDefault();turn(current-1)}if(e.key==='Home'){e.preventDefault();turn(0)}if(e.key==='End'){e.preventDefault();turn(6)}});
let touch=null;addEventListener('touchstart',e=>{if(e.touches.length===1)touch={x:e.touches[0].clientX,y:e.touches[0].clientY}},{passive:true});addEventListener('touchend',e=>{if(!touch)return;const dx=touch.x-e.changedTouches[0].clientX,dy=touch.y-e.changedTouches[0].clientY;if(Math.max(Math.abs(dx),Math.abs(dy))>55)turn(current+((Math.abs(dx)>Math.abs(dy)?dx:dy)>0?1:-1));touch=null},{passive:true});
const mot=document.querySelector('.motion');function motionState(){document.body.classList.toggle('paused',paused);mot.setAttribute('aria-pressed',String(!paused));mot.setAttribute('aria-label',paused?'Включить анимацию':'Отключить постоянную анимацию');document.querySelector('.motion-label').textContent=paused?'Магия на паузе':'Магия включена';ambient(0)}mot.addEventListener('click',()=>{paused=!paused;motionState()});reduced.addEventListener('change',()=>{paused=reduced.matches;motionState()});
const stars=Array.from({length:14},()=>({x:Math.random(),y:Math.random(),r:.4+Math.random()*1.1,v:.4+Math.random(),phase:Math.random()*7}));
function ambient(t){ec.clearRect(0,0,width,height);for(const s of stars){const y=(s.y-t*.000007*s.v+2)%1;ec.globalAlpha=(.025+.075*(.5+.5*Math.sin(t*.001+s.phase)));ec.fillStyle='#d9bd79';ec.beginPath();ec.arc(s.x*width,y*height,s.r,0,Math.PI*2);ec.fill()}ec.globalAlpha=1;sceneMagic(t);vc.clearRect(0,0,width,height);if(current!==0)return;const scale=Math.max(width/1536,height/1024);const pos=width<600?.67:.5;const cx=(width-1536*scale)*pos+891*scale,cy=(height-1024*scale)*.5+535*scale;const rad=45*scale;vc.save();vc.translate(cx,cy);vc.scale(.65,1.15);vc.globalCompositeOperation='lighter';const glow=vc.createRadialGradient(0,0,0,0,0,rad*2.3);glow.addColorStop(0,'#ede0ff66');glow.addColorStop(.25,'#d394ff55');glow.addColorStop(.6,'#a74fff22');glow.addColorStop(1,'#6620d000');vc.fillStyle=glow;vc.fillRect(-rad*2.3,-rad*2.3,rad*4.6,rad*4.6);for(let k=0;k<22;k++){vc.beginPath();const rot=t*.00045+k*Math.PI*2/22;for(let s=0;s<65;s++){const u=s/64,r=rad*(.1+u*1.1),angle=rot+u*3.8+Math.sin(t*.001+k)*.12;const x=Math.cos(angle)*r,y=Math.sin(angle)*r;if(s===0)vc.moveTo(x,y);else vc.lineTo(x,y)}vc.strokeStyle=`rgba(${180+k*3},${120+k*4},255,${.12+(k%4)*.055})`;vc.lineWidth=(.8+k%3*.5)*scale;vc.shadowColor='#c684ff';vc.shadowBlur=9;vc.stroke()}vc.shadowBlur=0;for(let n=0;n<30;n++){const a=n*2.399+t*.0006,r=rad*(.4+(n%9)/10);vc.fillStyle=`rgba(235,204,255,${.2+.5*Math.sin(n+t*.001)**2})`;vc.beginPath();vc.arc(Math.cos(a)*r,Math.sin(a)*r,scale*(.5+n%3*.3),0,7);vc.fill()}vc.restore()}
let last=0;function loop(t){if(!paused&&!document.hidden&&t-last>32){ambient(t);last=t}requestAnimationFrame(loop)}
addEventListener('resize',resize);const initial=scenes.findIndex(s=>`#${s.id}`===location.hash);if(initial>0){scenes[0].hidden=true;scenes[0].classList.remove('active');current=initial;scenes[current].hidden=false;scenes[current].classList.add('active')}resize();update();motionState();requestAnimationFrame(loop);

// Derive glow from the actual photographed material, retaining its engraved shapes.
function materialMask(name,kind){
 const key=name+kind;if(materialMasks.has(key))return materialMasks.get(key);
 const im=imageCache.get(name);if(!im?.complete||!im.naturalWidth)return null;
 const c=document.createElement('canvas');c.width=im.width;c.height=im.height;
 const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(im,0,0);
 const pixels=x.getImageData(0,0,c.width,c.height),d=pixels.data;
 for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2],px=(i/4)%c.width,py=Math.floor(i/4/c.width);let alpha=0;
 if(kind==='gold')alpha=Math.max(0,Math.min(1,(r-b-18)/65))*Math.max(0,Math.min(1,(g-65)/100));
 if(kind==='stone')alpha=py>560?Math.max(0,(Math.max(g,b)-r)/120)*Math.min(1,(py-560)/180):0;
 if(kind==='tunnel')alpha=px>580&&px<1080?Math.max(0,(b-r*.72)/190)*Math.min(1,(px-580)/100,(1080-px)/100):0;
 d[i]=kind==='gold'?255:kind==='stone'?130:184;d[i+1]=kind==='gold'?213:kind==='stone'?232:158;d[i+2]=kind==='gold'?123:255;d[i+3]=Math.min(255,alpha*230);
 }x.putImageData(pixels,0,0);materialMasks.set(key,c);return c;
}
function sceneMagic(t){
 ec.save();ec.globalCompositeOperation='lighter';
 const pulse=(phase=0)=>.25+.75*(.5+.5*Math.sin(t*.0015+phase))**2;
 function mapped(fn,pos=.5){const im=imageCache.get(paths[current]);if(!im?.naturalWidth)return;const terrace=current===3&&width<600,tunnel=current===4&&width<600,scale=terrace?height*.62/im.height:tunnel?height*.44/im.height:Math.max(width/im.width,height/im.height);ec.save();ec.translate((width-im.width*scale)*(terrace?.75:tunnel?.83:pos),terrace?0:tunnel?height*.12:(height-im.height*scale)*.5);ec.scale(scale,scale);fn(im);ec.restore()}
 function spark(x,y,r,alpha,color='255,196,79'){ec.globalAlpha=alpha;const g=ec.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${color},.9)`);g.addColorStop(.2,`rgba(${color},.4)`);g.addColorStop(1,`rgba(${color},0)`);ec.fillStyle=g;ec.fillRect(x-r,y-r,r*2,r*2)}
 if(current===2)mapped(()=>{
 const mask=materialMask('dagger','gold');if(!mask)return;
 ec.save();ec.beginPath();ec.moveTo(407,975);ec.lineTo(925,450);ec.lineTo(1076,360);ec.lineTo(1120,432);ec.lineTo(950,601);ec.closePath();ec.clip();
 ec.globalAlpha=.13;ec.shadowColor='#ac865c';ec.shadowBlur=8;ec.drawImage(mask,0,0);ec.restore();
 const random=n=>{const f=Math.sin(n*127.1+31.7)*43758.5453;return f-Math.floor(f)};
 const origins=[[510,864],[563,821],[610,784],[666,738],[718,695],[774,653],[833,607],[886,563],[944,521],[1010,459],[1057,414]];
 // Engraved islands awaken independently. The mask keeps every glimmer on the
 // photographed gold; their irregular timing never creates a travelling band.
 origins.forEach(([x,y],i)=>{
   const phase=t*(.00043+random(i+3)*.0007)+random(i+19)*8;
   const flicker=Math.pow(Math.max(0,Math.sin(phase)+.35*Math.sin(phase*2.73+i)),5);
   ec.save();ec.beginPath();ec.ellipse(x,y,38+random(i)*30,12+random(i+5)*17,-.78,0,Math.PI*2);ec.clip();
   ec.globalAlpha=.12+Math.min(.8,flicker*.64);ec.shadowColor=i%4===0?'#b6c5c2':'#f3d695';ec.shadowBlur=7+flicker*12;
   ec.drawImage(mask,0,0);ec.restore();
 });
 // Each emission has its own birth time, lifetime, origin, curvature and hue.
 for(let i=0;i<32;i++){
   const period=1900+random(i+71)*5100,offset=random(i+91)*period;
   const cycle=Math.floor((t+offset)/period),age=(t+offset)%period;
   const seed=i*43+cycle*137,lifetime=420+random(seed+2)*1450;
   if(age>lifetime)continue;
   const life=age/lifetime,origin=origins[Math.floor(random(seed+3)*origins.length)];
   const angle=-Math.PI+random(seed+4)*Math.PI*1.7,speed=8+random(seed+5)**2*90;
   const curl=Math.sin(life*Math.PI)*Math.sin(seed)*14;
   const dx=Math.cos(angle)*speed*life+curl,dy=Math.sin(angle)*speed*life-(6+random(seed+7)*36)*life*life;
   const x=origin[0]+dx,y=origin[1]+dy,opacity=Math.sin(Math.PI*life)**(.6+random(seed+8))*(.35+random(seed+9)*.6);
   const colors=['255,217,145','208,187,233','159,205,201','255,239,201'],color=colors[Math.floor(random(seed+11)*colors.length)];
   spark(x,y,1.8+random(seed+12)*4.5,opacity,color);
   if(random(seed+13)>.45){ec.globalAlpha=opacity*.65;ec.strokeStyle=`rgb(${color})`;ec.lineWidth=.45+random(seed+14)*.6;ec.beginPath();ec.moveTo(x-dx*.05,y-dy*.05);ec.lineTo(x,y);ec.stroke();}
 }

 },width<600?.69:.66);
 if(current===1)mapped(()=>{const mask=materialMask('city','gold');if(mask){ec.globalAlpha=.11+.17*pulse();ec.drawImage(mask,0,0)}});
 if(current===3)mapped(()=>{const mask=materialMask('marble','stone');if(mask){const shadows=document.body.classList.contains('world-open');ec.globalAlpha=shadows?.025+.045*pulse():.16+.25*pulse();ec.filter=shadows?'saturate(0) brightness(.7)':`hue-rotate(${Math.sin(t*.00035)*38}deg)`;ec.drawImage(mask,0,0);ec.filter='none'}
 [[1173,543],[1374,545],[1098,547],[645,429]].forEach(([x,y],i)=>spark(x,y,22,.18*pulse(i),'192,143,255'));
 });
 if(current===4)mapped(()=>{const mask=materialMask('rasta-interworld-tunnel','tunnel');if(mask){ec.globalAlpha=.18+.25*pulse();ec.drawImage(mask,0,0);ec.save();ec.beginPath();const y=(t*.08)%1200-150;ec.rect(590,y,485,130);ec.clip();ec.globalAlpha=.4;ec.drawImage(mask,0,0);ec.restore()}});
 if(current===5)mapped(()=>{[[991,120],[1050,102]].forEach(([x,y])=>{spark(x,y,9,.3+.45*pulse());spark(x,y,2.5,.55+.3*pulse())});},.75);
 ec.restore();
}
