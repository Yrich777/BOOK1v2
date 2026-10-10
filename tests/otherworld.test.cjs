const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');

// Run the actual renderer with a canvas spy and a controllable animation clock.
// This verifies sequencing and cancellation without replacing the reveal logic.
function rig({reduced=false,living=false}={}){
  const scenes={marble:{id:'marble',append(){}},city:{id:'city',append(){}}};
  let active=scenes.marble,raf,time=0,observer;
  const classes=new Set(),label={},status={},announcement={},page={style:{display:'none'}};
  const button={attributes:{},addEventListener(_,f){this.click=f},setAttribute(k,v){this.attributes[k]=v},querySelector(){return label},getBoundingClientRect(){return {x:1050,y:46,width:230,height:48}}};
  const contexts=[];
  function canvas(){
    const c={width:0,height:0,setAttribute(){}};
    const calls=[],paths=[],stack=[];let currentPath=[];
    const x=new Proxy({filter:'none',globalAlpha:1,globalCompositeOperation:'source-over',calls,paths,
      drawImage(...args){calls.push({args,filter:this.filter,alpha:this.globalAlpha})},
      clearRect(){calls.length=0;paths.length=0;currentPath=[]},
      beginPath(){currentPath=[]},arc(...args){currentPath.push({kind:'arc',args})},
      bezierCurveTo(...args){currentPath.push({kind:'bezier',args})},
      quadraticCurveTo(...args){currentPath.push({kind:'quadratic',args})},
      closePath(){currentPath.push({kind:'close'})},
      fill(){paths.push({segments:currentPath.slice(),alpha:this.globalAlpha,composite:this.globalCompositeOperation})},
      save(){stack.push({filter:this.filter,globalAlpha:this.globalAlpha,globalCompositeOperation:this.globalCompositeOperation})},
      restore(){Object.assign(this,stack.pop())},
      createImageData(w,h){return {data:new Uint8ClampedArray(w*h*4)}},
      getImageData(_,__,w,h){return {data:new Uint8ClampedArray(w*h*4).fill(185)}},
      createLinearGradient(){return {addColorStop(){}}},createRadialGradient(){return {addColorStop(){}}}
    },{get(target,key){return key in target?target[key]:()=>{}}});
    c.getContext=()=>x;contexts.push(x);return c;
  }
  const document={hidden:false,body:{classList:{contains:n=>classes.has(n),toggle(n,on){on?classes.add(n):classes.delete(n)}}},
    querySelector(selector){return {'#world-toggle':button,'#world-status':status,'#announcement':announcement,'#page-turn':page,'.scene.active':active}[selector]},
    querySelectorAll(){return []},createElement:canvas};
  class Image{constructor(){this.naturalWidth=960;this.naturalHeight=1440;this.width=960;this.height=1440;}set src(v){this.url=v;this.onload?.()}get src(){return this.url}}
  const materials=[];
  const window=living?{Manifestations:{render(im,options){materials.push({url:im.url,...options});return {width:373,height:560}}}}:{};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../otherworld.js'),'utf8'),{
    document,window,Image,innerWidth:1440,innerHeight:960,devicePixelRatio:1,
    matchMedia:()=>({matches:reduced}),MutationObserver:class{constructor(f){observer=f}observe(){}},
    addEventListener(){},requestAnimationFrame(f){raf=f},Math,Float32Array
  });
  function advance(ms){for(let end=time+ms;time<end;){time+=33;raf(time)}}
  return {button,advance,main:contexts[0],label,page,status,window,materials,
    scene(id){active=scenes[id];window.Inaya.sceneChanged()},
    pause(){classes.add('paused');observer()},
    get body(){return contexts[0].calls.filter(c=>/^brightness\(\.(84|56)\)/.test(c.filter))},
    get reflections(){return contexts[0].calls.filter(c=>c.filter.includes('saturate(.5) brightness(.9)'))},
    get masks(){return contexts.filter(c=>c.calls.some(call=>call.args[0]?.url?.includes('golem-bombo'))).length}
  };
}
test('the golem reflection exists before any body, then stone materializes in spatial slices',()=>{
  const r=rig();r.button.click();r.advance(1400);
  assert.ok(r.reflections.length>0,'reflection should already be visible');
  assert.equal(r.body.length,0,'body must not appear during the reflection-only phase');
  r.advance(1700);
  assert.ok(r.body.length>=48,'forming body must use distorted materialization slices');
  r.advance(6000);
  assert.equal(r.body.length,1,'settled body uses one undistorted image');
});
test('floor shadows gather as continuous curved ribbons without a shower of tiny particles',()=>{
  const r=rig();r.button.click();let elapsed=0;
  for(const stage of [1400,3800]){
    r.advance(stage-elapsed);elapsed=stage;
    const paths=r.main.paths.filter(p=>p.alpha>0);
    assert.ok(paths.some(p=>p.segments.some(s=>s.kind==='close')&&p.segments.filter(s=>s.kind==='bezier'||s.kind==='quadratic').length>=2),
      `the ${stage}ms assembly must contain a filled ribbon with smooth curved edges`);
    assert.ok(!paths.some(p=>p.segments.some(s=>s.kind==='arc'&&s.args[2]<=4)),
      `the ${stage}ms assembly must not emit filled tiny circles`);
  }
});
test('returning hides the body before the reflection and eventually clears the world',()=>{
  const r=rig();r.button.click();r.advance(9000);r.button.click();r.advance(3300);
  assert.equal(r.body.length,0);assert.ok(r.reflections.length>0);
  r.advance(1500);assert.equal(r.main.calls.length,0);assert.equal(r.button.attributes['aria-pressed'],'false');
});
test('page turning holds the reveal clock, and entering a new scene restarts its appearance',()=>{
  const r=rig();r.page.style.display='block';r.button.click();r.advance(2500);
  assert.equal(r.body.length,0);assert.equal(r.reflections.length,0);
  r.page.style.display='none';r.advance(9000);assert.equal(r.body.length,1);
  r.scene('city');assert.equal(r.body.length,0);r.advance(2500);assert.ok(r.body.length>=48);
});

test('the living material assembles upwards and keeps flowing after the body has formed',()=>{
  const r=rig({living:true});r.button.click();r.advance(1400);
  assert.ok(r.materials.some(m=>m.kind===3),'the real floor should already shimmer');
  assert.ok(r.materials.filter(m=>m.kind===2).every(m=>m.reveal===1),'only the reflection can exist initially');
  r.advance(2400);
  assert.ok(r.materials.some(m=>m.kind===2&&m.reveal>0&&m.reveal<1),'the body must use a partial spatial reveal');
  r.advance(5500);const first=r.materials.at(-1);
  r.advance(800);const next=r.materials.at(-1);
  assert.equal(first.reveal,1);assert.equal(next.reveal,1);assert.ok(next.time>first.time,'the material keeps flowing once formed');
});
test('spectral flames remain active from the first floor gathering through the completed golem',()=>{
  const r=rig({living:true});r.button.click();let elapsed=0,previousTime=-1;
  for(const stage of [800,1400,6800,9000,9800]){
    r.materials.length=0;r.advance(stage-elapsed);elapsed=stage;
    const flame=r.materials.filter(m=>m.kind===4).at(-1);
    assert.ok(flame,`spectral flames should render at ${stage}ms`);
    assert.ok(flame.opacity>0,`spectral flames should remain visible at ${stage}ms`);
    assert.ok(flame.reveal>0&&flame.reveal<=1,'the flames follow the assembly progress');
    assert.ok(flame.time>previousTime,'the flame material must keep moving');previousTime=flame.time;
    if(stage>=9000)assert.equal(flame.reveal,1,'the completed silhouette retains its flame material');
  }
});
test('rapid reversals do not leave an apparition stuck on the canvas',()=>{
  const r=rig();r.button.click();r.advance(800);r.button.click();r.advance(250);r.button.click();r.advance(900);r.button.click();r.advance(2000);
  assert.equal(r.main.calls.length,0);assert.equal(r.button.attributes['aria-pressed'],'false');
});

test('opening again during return replays the complete assembly rather than restoring a finished body',()=>{
  const r=rig({living:true});r.button.click();r.advance(9000);r.button.click();r.advance(250);
  r.materials.length=0;r.button.click();assert.equal(r.main.calls.length,0);
  r.advance(1400);assert.ok(r.reflections.length>0);assert.ok(r.materials.filter(m=>m.kind===2).every(m=>m.reveal===1));
  r.advance(2900);assert.ok(r.materials.some(m=>m.kind===2&&m.reveal>0&&m.reveal<1));
});
test('reduced motion and the pause control give a complete static scene and still allow return',()=>{
  for(const reduced of [true,false]){
    const r=rig({reduced});if(!reduced)r.pause();r.button.click();
    assert.equal(r.body.length,1);assert.ok(r.reflections.length>0);
    r.scene('city');assert.equal(r.body.length,1);r.button.click();assert.equal(r.main.calls.length,0);
  }
});

test('a floor texture loaded during pause refreshes the material without advancing time',()=>{
  const contexts=[];
  function canvas(){
    const calls={draws:0,uploads:[]};
    const gl=new Proxy({
      createShader(){return {}},createProgram(){return {}},createBuffer(){return {}},createTexture(){return {}},
      getShaderParameter(){return true},getProgramParameter(){return true},getUniformLocation(_,name){return name},getAttribLocation(){return 0},
      texImage2D(...args){calls.uploads.push(args.at(-1))},drawArrays(){calls.draws++}
    },{get(target,key){return key in target?target[key]:key===key.toUpperCase()?1:()=>{}}});
    contexts.push(calls);return {width:0,height:0,getContext(){return gl},addEventListener(){}};
  }
  const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../manifestations.js'),'utf8'),{document:{createElement:canvas},window,console,Float32Array});
  const im={naturalWidth:960,naturalHeight:1440},floor={naturalWidth:0,naturalHeight:0};
  const options={time:0,reveal:1,kind:2,floor};
  window.Manifestations.render(im,options);assert.equal(contexts[0].draws,1);assert.deepEqual(contexts[0].uploads,[im]);
  floor.naturalWidth=1536;floor.naturalHeight=1024;
  window.Manifestations.render(im,options);assert.equal(contexts[0].draws,2);assert.ok(contexts[0].uploads.includes(floor));
  window.Manifestations.render(im,options);assert.equal(contexts[0].draws,2,'an unchanged reflection/body pair should reuse its completed material');
});
