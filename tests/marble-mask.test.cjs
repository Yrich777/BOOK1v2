const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

// Use the actual cast-shadow clipping polygon, not a duplicate floor contour.
const code=fs.readFileSync(path.join(__dirname,'../otherworld.js'),'utf8');
const points=JSON.parse(code.match(/function clipBridgeFloor[\s\S]*?const points=(\[\[.*?\]\]);/)[1]);
function mask(x,y){
 let inside=false;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const [xi,yi]=points[i],[xj,yj]=points[j];
  if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
 }
 return Number(inside);
}

test('marble contour includes floor and excludes photographed architecture',()=>{
 for(const [x,y] of [[1000,800],[1200,860],[620,900],[1200,720]])assert.equal(mask(x,y),1,`floor ${x},${y}`);
 for(const [x,y] of [[200,950],[550,650],[1000,400],[1374,620],[1440,675],[650,429]])assert.equal(mask(x,y),0,`architecture ${x},${y}`);
});

test('the cast shadow never extends outside the bridge image',()=>{
 for(const [x,y] of [[-20,800],[1600,900],[1200,1100],[1200,-50]])assert.equal(mask(x,y),0);
});
