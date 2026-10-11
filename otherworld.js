'use strict';
// Illustration-space coordinates keep the apparition attached to the terrace.
(() => {
  const button = document.querySelector('#world-toggle');
  const status = document.querySelector('#world-status');
  const canvas = document.createElement('canvas');
  canvas.className = 'otherworld-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  const query = matchMedia('(prefers-reduced-motion: reduce)');
  const images = {};
  const materializations = new Map();
  const noiseHashes = new Float64Array(16384).fill(NaN);
  const backgrounds = {};
  const floorImage=new Image();floorImage.src='assets/marble.webp';backgrounds.marble=floorImage;
  const duration = 7.2;
  let activeScene = null, open = false, progress = 0, last = 0, clock = 0, encounterTime=0;
  let w = innerWidth, h = innerHeight, pixelRatio = 1;
  let waveOrigin = {x:w*.78,y:75};
  const clamp = n => Math.max(0, Math.min(1, n));
  const smooth = n => { n = clamp(n); return n * n * (3 - 2 * n); };
  const messages = {
    prologue: 'За порталом кто-то ждёт.',
    city: 'У города есть другие обитатели.',
    blade: 'Заклятие оставляет след даже в отражении.',
    marble: 'За краем моста цепляются каменные когти. Бомбо поднимает голову.',
    between: 'Стены перехода переливаются, словно грани иного мира.',
    fates: 'В свете старого фонаря просыпается феникс.',
    read: 'Иная Москва остаётся по ту сторону страниц.'
  };
  for (const [key, file] of Object.entries({bridgeGolem:'golem-bridge-atlas',gargoyle:'gargoyle-climber',golemsha:'golem-woman',djinn:'djinn-orb',phoenix:'phoenix-filaments'})) {
    const im = new Image();
    im.onload = () => {if(!window.Manifestations)materialization(im,0,key==='golem'?'stone':'smoke');render();};
    im.onerror = () => { status.textContent = 'Образ не загрузился. Попробуйте обновить страницу.'; };
    im.src = `assets/${file}.webp`;
    images[key] = im;
  }
  function resize() {
    w = innerWidth; h = innerHeight; pixelRatio = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(w * pixelRatio); canvas.height = Math.round(h * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    render();
  }
  function sceneChanged() {
    const next = document.querySelector('.scene.active');
    if (next === activeScene) return;
    activeScene = next; activeScene.append(canvas);
    encounterTime=0;
    progress = open ? (still() ? duration : 0) : 0;
    waveOrigin = {x:w*.75,y:h*.3};
    const names={prologue:'hero',city:'city',blade:'dagger',marble:'marble',between:'rasta-interworld-tunnel',fates:'puzyr-courtyard'};
    if(names[next.id]&&!backgrounds[next.id]){const im=new Image();im.src=`assets/${names[next.id]}.webp`;backgrounds[next.id]=im;}
    status.textContent = open ? messages[activeScene.id] : 'Увидеть то, что скрыто';
    render();
  }
  function still() { return query.matches || document.body.classList.contains('paused'); }
  button.addEventListener('click', () => {
    open = !open;
    if(open){encounterTime=0;progress=0;}
    const rect=button.getBoundingClientRect();waveOrigin={x:rect.x+rect.width*.5,y:rect.y+rect.height*.5};
    button.setAttribute('aria-pressed', String(open));
    button.querySelector('.world-label').textContent = open ? 'Вернуться в привычный мир' : 'Увидеть Москву иную';
    document.body.classList.toggle('world-open', open);
    status.textContent = open ? messages[activeScene.id] : 'Увидеть то, что скрыто';
    if (still()) progress = open ? duration : 0;
    document.querySelector('#announcement').textContent = open ? `Москва иная открыта. ${messages[activeScene.id]}` : 'Вы вернулись в привычный мир.';
    render();
  });
  function gradient(x, y, rx, ry, color, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.scale(rx, ry);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, `rgba(${color},${alpha})`); g.addColorStop(1, `rgba(${color},0)`);
    ctx.fillStyle = g; ctx.fillRect(-1, -1, 2, 2); ctx.restore();
  }
  function noise(x,y){
    const hash=(a,b)=>{const key=a+b*128;if(!Number.isNaN(noiseHashes[key]))return noiseHashes[key];const n=Math.sin(a*127.1+b*311.7)*43758.5453;return noiseHashes[key]=n-Math.floor(n);};
    const ix=Math.floor(x),iy=Math.floor(y),fx=smooth(x-ix),fy=smooth(y-iy);
    const a=hash(ix,iy)*(1-fx)+hash(ix+1,iy)*fx,b=hash(ix,iy+1)*(1-fx)+hash(ix+1,iy+1)*fx;
    return a*(1-fy)+b*fy;
  }
  function materialization(im,phase,kind){
    // A spatial dissolve reveals connected fragments of stone/fabric, rather than
    // fading a complete photograph. Both surfaces are reused between frames.
    let data=materializations.get(im);
    if(!data){
      const mw=320,mh=Math.round(mw*im.naturalHeight/im.naturalWidth);
      const make=()=>{const c=document.createElement('canvas');c.width=mw;c.height=mh;return c;};
      data={layer:make(),mask:make(),edge:make(),field:new Float32Array(mw*mh),key:-1};
      data.layerCtx=data.layer.getContext('2d');data.maskCtx=data.mask.getContext('2d');data.edgeCtx=data.edge.getContext('2d');
      data.maskPixels=data.maskCtx.createImageData(mw,mh);data.edgePixels=data.edgeCtx.createImageData(mw,mh);
      for(let y=0;y<mh;y++)for(let x=0;x<mw;x++){
        const n=noise(x/29,y/36)*.6+noise(x/11,y/13)*.28+noise(x/4,y/5)*.12;
        // The golem builds upward out of its reflection. The djinn gathers inward
        // from broad drifting folds of smoke into a narrow physical silhouette.
        data.field[y*mw+x]=kind==='stone'?.08+.62*(1-y/mh)+.3*n:.08+.5*n+.24*Math.abs(x/mw-.5)*2+.18*(y/mh);
      }
      materializations.set(im,data);
    }
    const key=Math.round(phase*100);
    if(data.key!==key){
      const p=key/100,m=data.maskPixels.data,e=data.edgePixels.data;
      for(let i=0;i<data.field.length;i++){
        const distance=p*1.12-data.field[i],a=smooth(distance/.085);
        m[i*4]=m[i*4+1]=m[i*4+2]=255;m[i*4+3]=Math.round(a*255);
        e[i*4]=165;e[i*4+1]=148;e[i*4+2]=192;
        e[i*4+3]=Math.round(Math.max(0,1-Math.abs(distance-.022)/.048)*105*(1-smooth((p-.8)/.2)));
      }
      data.maskCtx.putImageData(data.maskPixels,0,0);data.edgeCtx.putImageData(data.edgePixels,0,0);
      const lx=data.layerCtx;lx.clearRect(0,0,data.layer.width,data.layer.height);lx.globalCompositeOperation='source-over';
      lx.drawImage(im,0,0,data.layer.width,data.layer.height);lx.globalCompositeOperation='destination-in';lx.drawImage(data.mask,0,0);lx.globalCompositeOperation='source-over';
      // The luminous boundary follows the actual creature's alpha silhouette.
      data.edgeCtx.globalCompositeOperation='destination-in';data.edgeCtx.drawImage(im,0,0,data.edge.width,data.edge.height);data.edgeCtx.globalCompositeOperation='source-over';
      data.key=key;
    }
    return data;
  }
  function shadow(im,x,foot,height,strength){
    if(!im?.naturalWidth||strength<=0)return;
    ctx.save();ctx.globalAlpha=strength;ctx.filter='brightness(0) blur(9px)';
    const sw=height*im.naturalWidth/im.naturalHeight;
    ctx.translate(x,foot);ctx.transform(1,-.12,.23,1,0,0);ctx.drawImage(im,-sw*.5,-height,sw,height);ctx.restore();
  }
  function figure(im, x, foot, height, alpha, reflection = false, tint = false) {
    if (!im?.naturalWidth || alpha <= 0) return;
    const width = height * im.naturalWidth / im.naturalHeight;
    ctx.save(); ctx.globalAlpha = alpha;
    const phase=smooth((progress-(activeScene.id==='marble'?2.3:.35))/(activeScene.id==='marble'?4.6:5.6));
    const kind=im===images.golem?2:activeScene.id==='prologue'?0:1;
    const spell=im===images.djinn?djinnSpell():{reach:-1,power:0};
    const living=window.Manifestations?.render(im,{time:still()?0:clock,reveal:reflection?1:phase,kind,opacity:1,floor:floorImage,reach:spell.reach,orbPower:spell.power});
    if (reflection) {
      // Perspective-compressed inversion, sampled in strips for water distortion.
      const reflectedHeight = height * .44;
      const source=living||im,strips = 36, slice = (source.height||im.naturalHeight) / strips;
      ctx.filter = 'blur(.8px) saturate(.5) brightness(.9)' + (im===images.golem?' saturate(0)':'');
      for (let i = 0; i < strips; i++) {
        const v = i / strips;
        ctx.globalAlpha = alpha * (1 - v) ** 1.7;
        const shift = Math.sin(v * 31 + clock * .0011) * (1.2 + v * 4);
        ctx.drawImage(source, 0, (source.height||im.naturalHeight) - (i + 1) * slice, source.width||im.naturalWidth, slice,
          x - width / 2 + shift, foot + v * reflectedHeight, width, reflectedHeight / strips + .6);
      }
    } else {
      if(living){ctx.filter='none';ctx.globalAlpha=alpha;ctx.drawImage(living,x-width/2,foot-height,width,height);ctx.restore();return;}
      if(phase>0){
        const data=materialization(im,phase,im===images.golem?'stone':'smoke');
        ctx.filter = tint ? 'brightness(.56) saturate(.6)' : im===images.golem?'brightness(.84) saturate(0) brightness(.6)':'brightness(.84) saturate(.82)';
        if(phase>=1||still()) ctx.drawImage(im,x-width/2,foot-height,width,height);
        else {
          // Space buckles along the forming silhouette, then becomes perfectly still.
          const slices=48,sh=data.layer.height/slices;
          for(let i=0;i<slices;i++){
            const v=i/slices,shift=Math.sin(v*19-clock*.004)*(1-phase)**2*height*.026;
            ctx.drawImage(data.layer,0,i*sh,data.layer.width,sh,x-width/2+shift,foot-height+v*height,width,height/slices+.6);
          }
          ctx.globalCompositeOperation='screen';ctx.globalAlpha=alpha*.5;ctx.filter='blur(3px)';
          ctx.drawImage(data.edge,x-width/2,foot-height,width,height);
        }
      }
    }
    ctx.restore();
  }
  function djinnSpell(){
    const t=still()?0:clock*.001;
    const reach=smooth((progress-2)/2.8),arrival=smooth((progress-4.1)/1.7);
    const pulse=.34+.66*(.5+.5*Math.sin(t*.91+.48*Math.sin(t*.37)))**2;
    return {reach,arrival,power:arrival*pulse,t};
  }
  function djinnOrb(x,foot,height){
    if(!images.djinn?.naturalWidth)return;
    const {reach,arrival,power,t}=djinnSpell();
    if(!arrival)return;
    const width=height*images.djinn.naturalWidth/images.djinn.naturalHeight;
    // Same palm anchor and reach offset as the cloud material (UV Y is flipped).
    const cx=x-width*.5+width*(.343+.075*(1-reach));
    const cy=foot-height+height*(.262+.04*(1-reach));
    const r=height*.024*(.88+.12*arrival);
    ctx.save();ctx.globalCompositeOperation='screen';
    gradient(cx,cy,r*4.1,r*3.8,'123,44,223',power*.46);
    gradient(cx,cy+r*.8,r*2,r*1.4,'167,80,232',power*.31);
    ctx.translate(cx,cy);ctx.globalAlpha=arrival*(.44+.56*power);
    const sphere=ctx.createRadialGradient(-r*.23,-r*.28,r*.06,0,0,r);
    sphere.addColorStop(0,'#efe1ff');sphere.addColorStop(.24,'#caa0ff');
    sphere.addColorStop(.58,'#8b3ee3');sphere.addColorStop(.86,'#492080');sphere.addColorStop(1,'#7d3eb200');
    ctx.fillStyle=sphere;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.clip();
    // Uneven currents turn inside the sphere, without flashing or an orbit ring.
    for(let i=0;i<4;i++){
      ctx.save();ctx.rotate(t*(.13+i*.035)+i*1.8);
      ctx.beginPath();ctx.ellipse(Math.sin(t*.43+i)*r*.2,0,r*(.35+i*.15),r*.8,i*.7,0,Math.PI*2);
      ctx.strokeStyle=i%2?'#ead7ff':'#a861f5';ctx.lineWidth=r*(.065+i*.012);
      ctx.globalAlpha=arrival*(.12+.23*power)*(.7+.3*Math.sin(t*.7+i));ctx.stroke();ctx.restore();
    }
    ctx.restore();
  }
  function bridgeEdge(){
    ctx.beginPath();ctx.moveTo(1020,-100);ctx.lineTo(1636,-100);ctx.lineTo(1636,725);
    ctx.lineTo(1375,662);ctx.lineTo(1174,612);ctx.lineTo(1020,573);ctx.closePath();
  }
  function bridgeEncounter(){
    const t=still()?0:clock*.001,presence=smooth(progress/1.3);
    const storm=window.Manifestations?.render(floorImage,{time:still()?0:encounterTime*1000,kind:9,reveal:smooth(progress/3),opacity:presence});
    if(storm)ctx.drawImage(storm,0,0,1536,1024);
    else {ctx.save();bridgeEdge();ctx.clip();gradient(1310,220,480,480,'8,8,25',presence*.65);ctx.restore();}
    // The parapet is a real occluder: bodies remain beyond its sloping edge.
    const creatures=[[1483,686,175,.05],[1150,604,110,.48]];
    const im=images.gargoyle;
    if(im?.naturalWidth)creatures.forEach(([x,edge,width,delay],i)=>{
      const pull=smooth((progress-delay)/3.4);if(pull<=0)return;
      const height=width*im.naturalHeight/im.naturalWidth;
      const moving=window.Manifestations?.render(im,{time:still()?0:clock+i*1900,kind:10,reach:pull})||im;
      const strain=still()?0:Math.sin(t*3.1+i*2)*2.5*Math.sin(pull*Math.PI);
      ctx.save();bridgeEdge();ctx.clip();
      const bodyX=x-pull*22,bodyY=edge+height*(.90-pull*.78)-pull*5+strain;
      ctx.translate(bodyX,bodyY);
      ctx.rotate((1-pull)*.18+(still()?0:Math.sin(t*.85+i)*.015));
      ctx.filter='brightness(.67) saturate(.7)';
      ctx.drawImage(moving,-width*.5,-height,width,height);ctx.restore();
      // Fingers curl over the front lip after the first upward pull.
      const grip=smooth((pull-.35)/.4);
      if(grip>0){ctx.save();ctx.globalAlpha=grip;ctx.filter='brightness(.68) saturate(.7)';
        const handWidth=width*.23,handHeight=height*.25;
        for(const u of [.04,.49]){
          const curl=still()?0:Math.sin(t*1.4+i+u)*.7;
          ctx.drawImage(im,im.naturalWidth*u,im.naturalHeight*.75,im.naturalWidth*.23,im.naturalHeight*.25,
            bodyX-width*.5+width*u,bodyY-height*.25+curl,handWidth,handHeight);
        }ctx.restore();}
    });
    const golem=images.bridgeGolem,rise=smooth((progress-1.05)/3.5);
    if(!golem?.naturalWidth||rise<=0)return;
    const turn=smooth((progress-4.4)/2.1),scale=.34;
    ctx.save();bridgeEdge();ctx.clip();
    // The upper hand stays fixed to the lantern while the torso swings up.
    ctx.translate(1374,585);ctx.rotate(-.92*(1-rise));ctx.scale(scale,scale);ctx.translate(-720,-75);
    ctx.filter='brightness(.68) saturate(.72)';
    ctx.drawImage(golem,0,0,768,512,0,0,768,512);
    ctx.save();ctx.translate(377,145);ctx.rotate((1-turn)*.10+(still()?0:Math.sin(t*.53)*.012));
    ctx.scale(.84+.16*turn,1);ctx.translate(-257,-339);
    // Three aligned views give a real change of gaze, with a slight neck roll.
    const poses=[[768,0,1-smooth(turn*2),false,0],[0,512,Math.sin(turn*Math.PI),true,48],[768,512,smooth((turn-.5)*2),false,0]];
    const total=poses.reduce((sum,p)=>sum+p[2],0);
    poses.forEach(([sx,sy,weight,flip,inset])=>{if(weight<=0)return;ctx.save();ctx.globalAlpha=weight/total;
      if(flip){ctx.translate(514,0);ctx.scale(-1,1);}ctx.drawImage(golem,sx,sy+inset,768,512-inset,0,inset*342/512,514,(512-inset)*342/512);ctx.restore();});
    ctx.restore();ctx.restore();
    // Restore the photographed post over the grip; fingertips remain around it.
    if(floorImage.naturalWidth){ctx.save();ctx.globalAlpha=rise;ctx.drawImage(floorImage,1368,574,12,64,1368,574,12,64);ctx.restore();}
    ctx.save();ctx.globalCompositeOperation='screen';gradient(1374,548,36,58,'177,107,244',presence*(.16+.12*Math.sin(t*.7)**2));ctx.restore();
  }
  function tunnelLights(){
    const im=backgrounds.between;if(!im?.naturalWidth)return;
    const light=window.Manifestations?.render(im,{time:still()?0:clock,kind:8,opacity:smooth(progress/2.1)});
    ctx.save();ctx.globalCompositeOperation='screen';
    if(light)ctx.drawImage(light,0,0,1536,1024);
    else {
      ctx.beginPath();ctx.moveTo(600,0);ctx.lineTo(1150,0);ctx.lineTo(1090,475);ctx.lineTo(760,470);ctx.closePath();ctx.clip();
      for(let i=0;i<7;i++)gradient(750+i*41,100+i*49,110,75,i%2?'115,66,193':'44,159,174',smooth(progress/2)*(.05+.10*Math.sin(clock*.0007+i)**2));
    }ctx.restore();
  }
  function goldenPhoenix(){
    const im=images.phoenix;if(!im?.naturalWidth)return;
    const t=still()?0:clock*.001,lampX=746,lampY=487;
    const kindle=smooth(progress/1.4),form=smooth((progress-1.25)/3.9);
    const lift=smooth((progress-3.5)/3);
    const flare=kindle*(1-form*.69),breath=.84+.16*Math.sin(t*1.1)**2;
    ctx.save();ctx.globalCompositeOperation='screen';
    gradient(lampX,lampY,48+flare*35,62+flare*32,'255,179,57',flare*.67*breath);
    gradient(lampX,lampY,12+flare*11,18+flare*16,'255,232,161',kindle*.81);
    gradient(lampX,623,48,8,'255,184,73',kindle*.19*breath);
    // Keep the forming chest inside the lantern's bright core, then lift away.
    const size=14+form*110,cx=lampX-size*.08*(1-lift)+lift*(Math.sin(t*.73)*2.7+Math.sin(t*1.13)*1.1),cy=lampY+size*.04*(1-lift)-lift*44+lift*(Math.sin(t*1.3)*1.6+Math.sin(t*2.1)*.5);
    ctx.shadowBlur=0;gradient(cx,cy-size*.06,size*.64,size*.68,'255,191,74',form*.14*breath);
    ctx.restore();if(form<=0)return;
    const light=window.Manifestations?.render(im,{time:still()?0:clock,reveal:form,kind:6});
    const source=light||(form<1?materialization(im,form,'smoke').layer:im);
    const wings=[[[0,0],[.43,0],[.43,.20],[.49,.33],[.55,.43],[.52,.55],[.46,.63],[0,.63]],[[.85,0],[1,0],[1,.64],[.70,.62],[.65,.52],[.65,.435],[.78,.33],[.83,.27]]];
    const trace=points=>{ctx.moveTo(...points[0]);for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);ctx.closePath();};
    ctx.save();ctx.translate(cx,cy);ctx.rotate(still()?0:Math.sin(t*1.4)*.035+Math.sin(t*3.1)*.014);ctx.scale(size,size);ctx.translate(-.5,-.5);ctx.globalAlpha=.96*kindle;
    // Short exposure samples soften fast figure-eight strokes; the small body
    // hovers steadily instead of bouncing once for each wingbeat.
    const exposures=still()?[[0,1]]:[[0,.54],[-.7,.24],[-1.4,.14],[-2.1,.08]];
    wings.forEach((points,i)=>{
      const root=i===0?.54:.65,side=i===0?-1:1;
      for(const [lag,weight] of exposures){
        const phase=t*55+Math.sin(t*.7)*.4+lag+i*.08;
        const beat=still()?0:Math.sin(phase),fold=still()?1:.60+.34*Math.cos(phase);
        ctx.save();ctx.globalAlpha=.96*kindle*weight;ctx.translate(root,.445);ctx.rotate(side*beat*.42);
        ctx.transform(1,side*beat*.08,still()?0:side*Math.sin(phase*2)*.12,fold,0,0);ctx.translate(-root,-.445);
        ctx.beginPath();trace(points);ctx.clip();ctx.drawImage(source,0,0,1,1);ctx.restore();
      }
    });
    const head=[[.42,.14],[.56,.13],[.68,.23],[.80,.25],[.80,.31],[.67,.32],[.66,.40],[.53,.43],[.49,.30]];
    const tail=[[.47,.61],[.62,.62],[.68,1],[.18,1],[.18,.71],[.39,.69]];
    ctx.save();ctx.beginPath();ctx.rect(0,0,1,1);[...wings,head,tail].forEach(trace);ctx.clip('evenodd');ctx.drawImage(source,0,0,1,1);ctx.restore();
    const glance=still()?0:Math.sin(t*.83+.6*Math.sin(t*.31))*.11;
    ctx.save();ctx.translate(.585,.37);ctx.rotate(glance);ctx.scale(1-Math.abs(glance)*1.1,1);ctx.translate(-.585,-.37);
    ctx.beginPath();trace(head);ctx.clip();ctx.drawImage(source,0,0,1,1);ctx.restore();
    const twitch=still()?0:Math.sin(t*17)*Math.max(0,Math.sin(t*1.23+.5))**8*.055;
    ctx.save();ctx.translate(.52,.63);ctx.rotate(twitch+(still()?0:Math.sin(t*2.1)*.014));ctx.translate(-.52,-.63);
    ctx.beginPath();trace(tail);ctx.clip();ctx.drawImage(source,0,0,1,1);ctx.restore();ctx.restore();
  }
  function entwinedFog(x,foot,height,strength,cloud=false){
    if(strength<=0)return;
    ctx.save();ctx.globalCompositeOperation='screen';
    const gather=smooth(progress/5.5);
    for(let arm=0;arm<5;arm++){
      const angle=clock*.00024+arm*Math.PI*2/5;
      for(let j=0;j<17;j++){
        const v=j/16,orbit=height*(.2+v*.2)*(1-gather*.72),theta=angle+v*6.5;
        const xx=x+Math.cos(theta)*orbit,yy=foot-height*.45+Math.sin(theta)*orbit*.65-v*height*.1;
        const radius=height*(.075+.05*Math.sin(v*Math.PI));
        gradient(xx,yy,radius,radius*.66,cloud?'161,187,190':'172,91,219',strength*(.035+.045*v)*(1-gather*.45));
      }
    }
    ctx.restore();
  }
  function mist(x, foot, size, strength) {
    for (let i = 0; i < 5; i++) {
      const drift = Math.sin(clock * .00015 + i * 1.7);
      gradient(x + drift * size * .35, foot - size * (.08 + i * .045), size * (.5 + i * .09), size * .085,
        '115,128,147', strength * (.085 + i * .012));
    }
    if(progress<duration)for(let i=0;i<7;i++){
      const phase=clock*.0005+i*2.1;
      const xx=x+Math.sin(phase)*size*.19,yy=foot-size*(.1+i*.12);
      gradient(xx,yy,size*.25,size*.07,'157,149,178',strength*.1*Math.sin(Math.PI*clamp(progress/duration)));
    }
  }
  function revealWave(){
    if(still()||progress>=2.25)return;
    const p=clamp(progress/2.25),radius=p*Math.hypot(w,h)*1.12,alpha=Math.sin(p*Math.PI)*.19;
    const im=backgrounds[activeScene.id];
    ctx.save();ctx.beginPath();ctx.arc(waveOrigin.x,waveOrigin.y,radius+24,0,Math.PI*2);
    ctx.arc(waveOrigin.x,waveOrigin.y,Math.max(0,radius-24),0,Math.PI*2,true);ctx.clip('evenodd');
    if(im?.naturalWidth){
      const terrace=w<600&&activeScene.id==='marble',tunnel=w<600&&activeScene.id==='between',courtyard=w<600&&activeScene.id==='fates',s=terrace?h*.62/im.height:tunnel?h*.44/im.height:courtyard?h*.52/im.height:Math.max(w/im.width,h/im.height);
      const position=terrace?.75:tunnel?.83:courtyard?.72:activeScene.id==='blade'?(w<600?.74:.66):activeScene.id==='fates'?.75:activeScene.id==='prologue'&&w<600?.67:.5;
      ctx.globalAlpha=alpha;ctx.filter='blur(2px) saturate(.5)';
      ctx.drawImage(im,(w-im.width*s)*position-3,terrace?0:(tunnel||courtyard)?h*.12:(h-im.height*s)*.5,im.width*s+6,im.height*s+6);
    }
    ctx.filter='none';ctx.globalAlpha=1;ctx.strokeStyle=`rgba(202,183,222,${alpha})`;ctx.lineWidth=1.3;
    ctx.beginPath();ctx.arc(waveOrigin.x,waveOrigin.y,radius,0,Math.PI*2);ctx.stroke();ctx.restore();
  }
  function render() {
    ctx.clearRect(0, 0, w, h);
    if (!activeScene || !progress) return;
    const presence = smooth(progress / 1.5), id = activeScene.id;
    const courtyard=w<600&&id==='fates';
    const scale = courtyard?h*.52/1024:Math.max(w / 1536, h / 1024);
    const position = id === 'blade' ? (w < 600 ? .74 : .66) : id === 'fates' ? (courtyard?.72:.75) : id === 'prologue' && w < 600 ? .67 : .5;
    const ox = (w - 1536 * scale) * position, oy = courtyard?h*.12:(h - 1024 * scale) * .5;
    ctx.save(); ctx.translate(ox, oy); ctx.scale(scale, scale);
    const mobile = w < 600;
    const stageX = mobile ? (w * .74 - ox) / scale : 1140;
    const stageFoot = mobile ? (h * (id === 'marble' ? .46 : .51) - oy) / scale : 757;
    const stageHeight = mobile ? h * (id === 'marble' ? .32 : .37) / scale : 505;
    if (id === 'marble') {
      ctx.save();
      if(mobile){const s=h*.62/1024/scale;ctx.translate(((w-1536*s*scale)*.75-ox)/scale,-oy/scale);ctx.scale(s,s);}
      bridgeEncounter();ctx.restore();
    } else if (id === 'city') {
      const x = mobile ? stageX : 1200, foot = mobile ? stageFoot : 780;
      const height = mobile ? stageHeight : 495;
      gradient(x, foot - height * .5, height * .48, height * .65, '4,10,17', presence * .5);
      shadow(images.djinn,x+18,foot-20,height*.95,presence*.36*(1-smooth((progress-2)/2)));
      entwinedFog(x,foot,height,presence,true);
      const floatingFoot=foot+(still()?0:Math.sin(clock*.0004)*3);
      figure(images.djinn, x, floatingFoot, height, .85);
      djinnOrb(x,floatingFoot,height);
      mist(x, foot, height, presence);
    } else if (id === 'prologue') {
      entwinedFog(889,628,225,presence);
      figure(images.golemsha, 889, 628, 225, .96, false, true);
      mist(889, 628, 220, presence);
    } else if (id === 'between') {
      ctx.save();
      if(mobile){const s=h*.44/1024/scale;ctx.translate(((w-1536*s*scale)*.83-ox)/scale,(h*.12-oy)/scale);ctx.scale(s,s);}
      tunnelLights();ctx.restore();
    } else if (id === 'fates') {
      goldenPhoenix();
    } else if (id === 'blade') {
      // A breath of vapor hangs close to the metal, without drawing a new line.
      mist(830, 705, 190, presence*.7);
    } else if (id === 'read') {
      gradient(450, 560, 420, 420, '115,65,153', presence * .12);
    }
    ctx.restore();
    // A slow peripheral darkening leaves the text untouched and readable.
    const shade = ctx.createLinearGradient(w * .55, 0, w, 0);
    shade.addColorStop(0, 'rgba(4,7,14,0)'); shade.addColorStop(1, `rgba(4,7,14,${presence * .19})`);
    ctx.fillStyle = shade; ctx.fillRect(0, 0, w, h);
    revealWave();
  }

  const portraits = [...document.querySelectorAll('.guide-avatar')].map((host, index) => {
    host.classList.add('living-portrait');
    const c = document.createElement('canvas'); c.width = c.height = 512; host.append(c);
    const p = {host, canvas:c, ctx:c.getContext('2d'), base:new Image(), blink:new Image(), eyelids:null, hair:null, chest:null, nextBlink:1400 + index * 400, blinkAt:-1000, clock:0};
    const name = host.closest('.farewell') ? 'warm' : 'cool';
    p.warm=name==='warm';
    const eyes = name === 'warm' ? [[164,185,27,23,-.2],[246,163,31,24,-.32]] : [[150,175,26,21,-.16],[224,158,30,23,-.22]];
    p.blink.onload = () => {
      p.eyelids = document.createElement('canvas'); p.eyelids.width = p.eyelids.height = 512;
      const x = p.eyelids.getContext('2d');
      for (const [cx,cy,rx,ry,angle] of eyes) {
        x.save(); x.translate(cx,cy); x.rotate(angle); x.scale(rx,ry);
        const g = x.createRadialGradient(0,0,.55,0,0,1); g.addColorStop(0,'#fff'); g.addColorStop(1,'#fff0');
        x.fillStyle=g; x.fillRect(-1,-1,2,2); x.restore();
      }
      x.globalCompositeOperation='source-in'; x.drawImage(p.blink,0,0,512,512);
    };
    p.base.onload = () => { drawPortrait(p,0); };
    p.base.src = `assets/krishenka-${name}.webp`; p.blink.src = `assets/krishenka-${name}-blink.webp`;
    return p;
  });
  function drawPortrait(p, dt) {
    if (!p.base.naturalWidth) return;
    p.clock += dt; const x = p.ctx;
    x.clearRect(0,0,512,512);x.save();
    if(!still()){
      // A slow, very small head inclination keeps the eyelids and features
      // together, rather than sliding individual parts of her face.
      x.translate(256,280+Math.sin(p.clock*.0008)*1.8);x.rotate(Math.sin(p.clock*.00043)*.009);x.scale(1.015,1.015);x.translate(-256,-280);
    }
    const wind=!still()?window.Manifestations?.render(p.base,{time:p.clock+(p.warm?1900:0),kind:7,reach:p.warm?1:0}):null;
    x.drawImage(wind||p.base,0,0,512,512);
    if (still()){x.restore();return;}
    // Feathered layers move only the hair and shoulders; the facial features stay registered.
    if (!p.hair) {
      for (const key of ['hair','chest']) {
        const layer = document.createElement('canvas'); layer.width = layer.height = 512;
        const lx = layer.getContext('2d'); lx.drawImage(p.base,0,0,512,512); lx.globalCompositeOperation='destination-in';
        const g = key === 'hair' ? lx.createLinearGradient(300,0,455,0) : lx.createLinearGradient(0,325,0,480);
        g.addColorStop(0,'#0000'); g.addColorStop(1,'#000'); lx.fillStyle=g; lx.fillRect(0,0,512,512); p[key]=layer;
      }
    }
    x.save(); x.translate(0,Math.sin(p.clock*.00125)*3.2); x.drawImage(p.chest,0,0); x.restore();
    if(!wind){
      const time=p.clock*.001,gust=.12+.88*Math.max(0,Math.sin(time*.63+.65*Math.sin(time*.22)))**3;
      for(let row=0;row<32;row++){
        const y=row*16,flex=smooth(y/512),shift=(2+12*flex)*gust*Math.sin(time*2.9-y*.01);
        x.drawImage(p.hair,0,y,512,17,shift,y+gust*Math.sin(time*2.1-y*.012),512,17);
      }
    }
    if (p.clock >= p.nextBlink && p.eyelids) {p.blinkAt=p.clock; p.nextBlink=p.clock+2800+Math.random()*2300;}
    const age = p.clock-p.blinkAt;
    if (age>=0 && age<340 && p.eyelids) {
      const opacity = age<90 ? smooth(age/90) : age<175 ? 1 : 1-smooth((age-175)/165);
      x.globalAlpha=opacity; x.drawImage(p.eyelids,0,0); x.globalAlpha=1;
    }
    x.save(); x.globalCompositeOperation='screen';
    const light=x.createLinearGradient(0,0,512,512); light.addColorStop(0,`rgba(188,132,230,${.025+.025*Math.sin(p.clock*.0006)})`); light.addColorStop(1,'rgba(0,0,0,0)');
    x.fillStyle=light; x.fillRect(0,0,512,512); x.restore();
    x.restore();
  }
  function frame(t) {
    if (!document.hidden && t-last>=32) {
      const dt=last ? Math.min(t-last,250) : 0; last=t;
      if (still()) { const target=open?duration:0; if(progress!==target){progress=target;render();} }
      else {
        clock+=dt;
        const turning=document.querySelector('#page-turn').style.display==='block';
        if(open&&!turning)encounterTime+=dt/1000;
        const next=turning?progress:open?Math.min(duration,progress+dt/1000):Math.max(0,progress-dt/650);
        if(next!==progress || progress>0){progress=next;render();}
      }
      for(const p of portraits) if(p.host.closest('.scene')===activeScene) drawPortrait(p,still()||document.querySelector('#page-turn').style.display==='block'?0:dt);
    } else if(document.hidden) last=t;
    requestAnimationFrame(frame);
  }
  // Existing page turning copies this layer onto the departing parchment.
  window.Inaya = {sceneChanged, resize, paintTo(destination){destination.drawImage(canvas,0,0,w,h);}};
  new MutationObserver(() => {
    if(still()) {progress=open?duration:0; for(const p of portraits){p.blinkAt=-1000;drawPortrait(p,0);}render();}
  }).observe(document.body,{attributes:true,attributeFilter:['class']});
  addEventListener('resize',resize);
  floorImage.onload=render;
  sceneChanged(); resize(); requestAnimationFrame(frame);
})();
