const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');

// Run the actual renderer with a canvas spy and a controllable animation clock.
// This verifies sequencing and cancellation without replacing the reveal logic.
function rig({reduced=false,living=false,width=1440,height=960}={}){
  const scenes=Object.fromEntries(['marble','city','fates','between'].map(id=>[id,{id,append(){}}]));
  let active=scenes.marble,raf,time=0,observer;
  const classes=new Set(),label={},status={},announcement={},page={style:{display:'none'}};
  const button={attributes:{},addEventListener(_,f){this.click=f},setAttribute(k,v){this.attributes[k]=v},querySelector(){return label},getBoundingClientRect(){return {x:1050,y:46,width:230,height:48}}};
  const contexts=[];
  function canvas(){
    const c={width:0,height:0,setAttribute(){}};
    const calls=[],paths=[],stack=[];let currentPath=[];
    const x=new Proxy({filter:'none',globalAlpha:1,globalCompositeOperation:'source-over',calls,paths,transforms:[],
      drawImage(...args){calls.push({args,filter:this.filter,alpha:this.globalAlpha,transforms:this.transforms.slice()})},
      translate(...args){this.transforms.push(['translate',...args])},rotate(...args){this.transforms.push(['rotate',...args])},scale(...args){this.transforms.push(['scale',...args])},
      clearRect(){calls.length=0;paths.length=0;currentPath=[]},
      beginPath(){currentPath=[]},arc(...args){currentPath.push({kind:'arc',args})},
      bezierCurveTo(...args){currentPath.push({kind:'bezier',args})},
      quadraticCurveTo(...args){currentPath.push({kind:'quadratic',args})},
      closePath(){currentPath.push({kind:'close'})},
      fill(){paths.push({segments:currentPath.slice(),alpha:this.globalAlpha,composite:this.globalCompositeOperation})},
      stroke(){paths.push({segments:currentPath.slice(),alpha:this.globalAlpha,composite:this.globalCompositeOperation})},
      save(){stack.push({filter:this.filter,globalAlpha:this.globalAlpha,globalCompositeOperation:this.globalCompositeOperation,transforms:this.transforms.slice()})},
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
  const window=living?{Manifestations:{render(im,options){materials.push({url:im.url,...options});return {url:im.url,width:373,height:560}}}}:{};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../otherworld.js'),'utf8'),{
    document,window,Image,innerWidth:width,innerHeight:height,devicePixelRatio:1,
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
test('the city orb waits for the reaching hand, shimmers, and disappears on return',()=>{
  const r=rig({living:true});r.scene('city');r.button.click();r.advance(3300);
  const latest=()=>r.materials.filter(m=>m.url.includes('djinn-orb')).at(-1);
  assert.ok(latest().reach>0&&latest().reach<1,'the hand reaches while clouds form');
  assert.equal(latest().orbPower,0,'the orb waits for the hand');
  r.advance(4500);assert.equal(latest().reach,1);
  const first=latest().orbPower;r.advance(1500);
  assert.ok(first>0&&latest().orbPower>0);assert.notEqual(latest().orbPower,first);
  r.button.click();r.advance(8000);assert.equal(r.main.paths.length,0);
  const staticRig=rig({reduced:true,living:true});staticRig.scene('city');staticRig.button.click();
  const still=staticRig.materials.at(-1);assert.equal(still.reach,1);assert.ok(still.orbPower>0);
});

test('marble gathering precedes the body, with no bridge creatures or storm',()=>{
 const r=rig({living:true});r.button.click();r.advance(900);
 assert.ok(r.materials.some(m=>m.kind===3&&m.reveal>0&&m.reveal<1));
 assert.ok(r.reflections.length>0);
 assert.ok(!r.materials.some(m=>m.kind===2&&m.reveal<1));
 r.advance(2600);
 assert.ok(r.materials.some(m=>m.kind===2&&m.reveal>0&&m.reveal<1));
 assert.ok(!r.materials.some(m=>[9,10].includes(m.kind)));
 assert.ok(!r.main.calls.some(c=>/bridge-atlas|gargoyle/.test(c.args[0]?.url||'')));
});

test('body and quieter flames share reveal progress, then fire extinguishes',()=>{
 const r=rig({living:true});r.button.click();r.advance(3600);
 const body=r.materials.filter(m=>m.kind===2&&m.reveal<1).at(-1);
 const flame=r.materials.filter(m=>m.kind===4).at(-1);
 assert.equal(body.reveal,flame.reveal);assert.equal(body.time,flame.time);
 assert.equal(flame.opacity,.62);
 const draw=r.main.calls.find(c=>c.args[0]?.url?.includes('golem-bombo')&&c.filter==='none'&&c.args.length===5);
 assert.equal(draw.alpha,.70);
 r.advance(5600);r.materials.length=0;r.advance(100);
 assert.ok(!r.materials.some(m=>m.kind===4));
 assert.ok(r.materials.some(m=>m.kind===3&&m.fracture>0));
});

test('the tunnel uses living wall light without a distant character',()=>{
  const r=rig({living:true});r.scene('between');r.button.click();r.advance(4500);
  const light=r.materials.filter(m=>m.kind===8).at(-1);
  assert.ok(light.url.includes('rasta-interworld-tunnel'));assert.equal(light.opacity,1);
  assert.ok(!r.materials.some(m=>m.url.includes('golem-woman')));
  r.advance(1000);assert.ok(r.materials.filter(m=>m.kind===8).at(-1).time>light.time);
  r.pause();assert.equal(r.materials.filter(m=>m.kind===8).at(-1).time,0);
  r.button.click();assert.equal(r.main.calls.length,0);
});

test('floor gathering follows the golem position on desktop and mobile',()=>{
 for(const [width,height] of [[1440,960],[390,844]]){
  const r=rig({living:true,width,height});r.button.click();r.advance(2300);
  const floor=r.materials.filter(m=>m.kind===3).at(-1);
  assert.ok(floor.originX>0&&floor.originX<1);
  assert.ok(floor.originY>0&&floor.originY<.5);
  assert.ok(floor.spread>0&&floor.spread<.1);
 }
});

test('the lantern brightens before the bird, with articulated head and tail',()=>{
  const r=rig({living:true});r.scene('fates');r.button.click();r.advance(900);
  assert.ok(!r.materials.some(m=>m.kind===6));r.advance(5500);
  assert.ok(r.materials.some(m=>m.kind===6&&m.url.includes('phoenix-filaments')));
  const draws=()=>r.main.calls.filter(c=>c.args[0]?.width===373);
  assert.equal(draws().length,11,'eight wing exposures, body, head and tail');
  const head=draws()[9].transforms,tail=draws()[10].transforms;r.advance(600);
  assert.notDeepEqual(draws()[9].transforms,head);assert.notDeepEqual(draws()[10].transforms,tail);
  assert.ok(!r.main.paths.some(p=>p.segments.some(s=>s.kind==='bezier')),'no light-line triangle before the bird');
  r.pause();assert.equal(draws().length,5);r.button.click();assert.equal(r.main.calls.length,0);
});

test('returning clears each new encounter and rapid reversals replay the entrance',()=>{
  for(const id of ['marble','between','fates']){
    const r=rig({living:true});r.scene(id);r.button.click();r.advance(9000);r.button.click();r.advance(500);
    r.button.click();assert.equal(r.main.calls.length,0);r.advance(800);r.button.click();r.advance(6000);
    assert.equal(r.main.calls.length,0);assert.equal(r.button.attributes['aria-pressed'],'false');
  }
});

test('page turning holds the entrance and moving to a new scene restarts it',()=>{
  const r=rig({living:true});r.page.style.display='block';r.button.click();r.advance(2500);
  assert.equal(r.main.calls.length,0);r.page.style.display='none';r.advance(8000);
  assert.ok(r.main.calls.some(c=>c.args[0]?.url?.includes('golem-bombo-chained')));
  r.scene('between');assert.equal(r.main.calls.length,0);r.advance(800);assert.ok(r.materials.some(m=>m.kind===8));
});

test('reduced motion and pause show the translucent golem without flames',()=>{
  for(const reduced of [true,false]){
    const r=rig({reduced,living:true});if(!reduced)r.pause();r.button.click();
    assert.ok(r.main.calls.some(c=>c.args[0]?.url?.includes('golem-bombo-chained')&&c.args.length===5));
    assert.equal(r.materials.filter(m=>m.kind===2).at(-1).time,0);
    r.scene('between');assert.equal(r.materials.filter(m=>m.kind===8).at(-1).time,0);
    r.button.click();assert.equal(r.main.calls.length,0);
  }
});

test('the golem and tunnel still render without WebGL',()=>{
  const r=rig({reduced:true});r.button.click();
  assert.ok(r.main.calls.some(c=>c.args[0]?.url?.includes('golem-bombo-chained')));
  r.scene('between');r.advance(3000);assert.ok(!r.main.calls.some(c=>c.args[0]?.url?.includes('golem-woman')));
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
