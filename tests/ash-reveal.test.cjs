const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const shader=fs.readFileSync(path.join(__dirname,'../manifestations.js'),'utf8');
// Evaluate the production dissolve with fixed turbulent samples. The boundary
// must clear edges before the center rather than fading the entire silhouette.
const body=shader.match(/float ashCover\(vec2 p,float age,float amount\)\{([\s\S]*?)\n    \}/)[1]
 .replace(/float eddy=[^;]+;/,'')
 .replace(/float radius=[^;]+;/,'const radius=Math.hypot(p.x/.53,(p.y-.50)/.65);')
 .replace(/\bfloat /g,'const ');
const smoothstep=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;
const cover=new Function('p','amount','eddy','smoothstep','mix',body);
const mask=(x,y,phase,noise=.5)=>cover({x,y},phase,noise,smoothstep,mix);
test('the ash veil clears the outside while the center still conceals the body',()=>{
 assert.equal(mask(0,.5,.4),1);
 assert.equal(mask(.44,.5,.7),0);
 assert.equal(mask(0,.5,.7),1);
 assert.equal(mask(0,.5,1),0);
});
test('every part of the ash veil clears smoothly and completely',()=>{
 for(const n of [.25,.5,.75])for(const [x,y] of [[0,.5],[.3,.2],[-.3,.8],[.45,.5]]){
  let previous=1;
  for(let i=40;i<=100;i++){
   const next=mask(x,y,i/100,n);assert.ok(Number.isFinite(next)&&next>=0&&next<=previous+1e-9);previous=next;
  }
  assert.equal(previous,0);
 }
});
