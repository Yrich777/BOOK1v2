const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const shader=fs.readFileSync(path.join(__dirname,'../manifestations.js'),'utf8');
// Evaluate the production dissolve with fixed turbulent samples. The boundary
// must clear the edges first while also thinning the central volume.
const body=shader.match(/float ashCover\(vec2 p,float age,float amount\)\{([\s\S]*?)\n    \}/)[1]
 .replace(/float eddy=[^;]+;/,'')
 .replace(/float radius=[^;]+;/,'const radius=Math.hypot(p.x/.53,(p.y-.50)/.65);')
 .replace(/\bfloat /g,'const ');
const smoothstep=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const mix=(a,b,t)=>a+(b-a)*t;
const cover=new Function('p','amount','eddy','smoothstep','mix',body);
const mask=(x,y,phase,noise=.5)=>cover({x,y},phase,noise,smoothstep,mix);
test('the ash veil thins everywhere while the outside clears first',()=>{
 assert.equal(mask(0,.5,.4),1);
 assert.ok(mask(.44,.5,.7)<mask(0,.5,.7));
 assert.ok(mask(0,.5,.7)>.1&&mask(0,.5,.7)<.6,'the center has lost density rather than becoming a dark spot');
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

test('parchment glow excludes the fingers and lights both exposed pieces',()=>{
 const code=fs.readFileSync(path.join(__dirname,'../otherworld.js'),'utf8');
 const polygons=JSON.parse(code.match(/const paper=(\[.*?\]);/)[1]);
 const inside=(x,y,points)=>{
  let hit=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
   const [xi,yi]=points[i],[xj,yj]=points[j];
   if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)hit=!hit;
  }return hit;
 };
 for(const [x,y] of [[608,364],[584,494]])assert.ok(polygons.some(p=>inside(x,y,p)),`exposed parchment ${x},${y}`);
 for(const [x,y] of [[602,408],[590,432],[584,455],[635,438]])assert.ok(!polygons.some(p=>inside(x,y,p)),`hand occludes ${x},${y}`);
});
