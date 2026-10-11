const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

// Evaluate the production shader's scalar contour on photographed landmarks.
// The only vector expression is converted to JS; no second contour is kept.
const shader=fs.readFileSync(path.join(__dirname,'../manifestations.js'),'utf8');
const body=shader.match(/float marbleFloor\(vec2 tex\)\{([\s\S]*?)\n    \}/)[1]
 .replace(/vec2 p=[^;]+;/,'const p={x:tex.x*1536,y:(1-tex.y)*1024};')
 .replace(/\bfloat /g,'let ');
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const mix=(a,b,t)=>a+(b-a)*t;
const smoothstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const contour=new Function('tex','mix','clamp','min','smoothstep',body);
const mask=(x,y)=>contour({x:x/1536,y:1-y/1024},mix,clamp,Math.min,smoothstep);

test('marble contour includes floor and excludes photographed architecture',()=>{
 for(const [x,y] of [[1000,800],[1200,860],[620,900],[1200,720]])assert.equal(mask(x,y),1,`floor ${x},${y}`);
 for(const [x,y] of [[200,950],[550,650],[1000,400],[1374,620],[1440,675],[650,429]])assert.equal(mask(x,y),0,`architecture ${x},${y}`);
});

test('off-image texture coordinates never supply moving floor markings',()=>{
 for(const [x,y] of [[-20,800],[1600,900],[1200,1100],[1200,-50]])assert.equal(mask(x,y),0);
});
