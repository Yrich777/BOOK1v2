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

test('gargoyles precede the golem and the sky darkens before the climb',()=>{
  const r=rig({living:true});r.button.click();r.advance(650);
  assert.ok(r.main.calls.some(c=>c.args[0]?.url?.includes('gargoyle-climber')));
  assert.ok(!r.main.calls.some(c=>c.args[0]?.url?.includes('golem-bridge-atlas')));
  assert.ok(r.materials.some(m=>m.kind===9&&m.reveal>0&&m.reveal<1));
  r.advance(1800);assert.ok(r.main.calls.some(c=>c.args[0]?.url?.includes('golem-bridge-atlas')));
  assert.ok(!r.materials.some(m=>[2,3,4].includes(m.kind)),'the old floor assembly and flames are gone');
});

test('the golem keeps a hand at the lantern and turns from profile to the viewer',()=>{
  const r=rig({living:true});r.button.click();r.advance(3000);
  const golem=()=>r.main.calls.filter(c=>c.args[0]?.url?.includes('golem-bridge-atlas'));
  assert.ok(golem().every(c=>c.transforms.some(v=>v[0]==='translate'&&v[1]===1374&&v[2]===585)));
  assert.ok(golem().some(c=>c.args[1]===768&&c.args[2]===0),'profile during climb');
  r.advance(4100);
  assert.ok(golem().some(c=>c.args[1]===768&&c.args[2]===512),'front gaze after climbing');
  assert.ok(!golem().some(c=>c.args[1]===768&&c.args[2]===0),'profile no longer drawn');
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

test('the gripping hand remains registered to the lantern on desktop and mobile',()=>{
  for(const [width,height] of [[1440,960],[390,844]]){
    const r=rig({living:true,width,height});r.button.click();r.advance(2300);
    const torso=r.main.calls.find(c=>c.args[0]?.url?.includes('golem-bridge-atlas')&&c.args[1]===0&&c.args[2]===0);
    let x=720,y=75;
    for(const [kind,a,b] of torso.transforms.slice().reverse()){
      if(kind==='translate'){x+=a;y+=b;}
      else if(kind==='scale'){x*=a;y*=b;}
      else if(kind==='rotate'){const nx=x*Math.cos(a)-y*Math.sin(a);y=x*Math.sin(a)+y*Math.cos(a);x=nx;}
    }
    const mobile=width<600,s=mobile?height*.62/1024:Math.max(width/1536,height/1024);
    assert.ok(Math.abs(x-((width-1536*s)*(mobile?.75:.5)+1374*s))<.001);
    assert.ok(Math.abs(y-((mobile?0:(height-1024*s)*.5)+585*s))<.001);
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
  assert.ok(r.main.calls.some(c=>c.args[0]?.url?.includes('golem-bridge-atlas')));
  r.scene('between');assert.equal(r.main.calls.length,0);r.advance(800);assert.ok(r.materials.some(m=>m.kind===8));
});

test('reduced motion and pause show the finished bridge encounter and allow return',()=>{
  for(const reduced of [true,false]){
    const r=rig({reduced,living:true});if(!reduced)r.pause();r.button.click();
    assert.ok(r.main.calls.some(c=>c.args[0]?.url?.includes('golem-bridge-atlas')&&c.args[2]===512));
    assert.equal(r.materials.filter(m=>m.kind===9).at(-1).time,0);
    r.scene('between');assert.equal(r.materials.filter(m=>m.kind===8).at(-1).time,0);
    r.button.click();assert.equal(r.main.calls.length,0);
  }
});

test('the bridge and tunnel still render without WebGL',()=>{
  const r=rig();r.button.click();r.advance(8000);
  assert.ok(r.main.calls.some(c=>c.args[0]?.url?.includes('golem-bridge-atlas')));
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
