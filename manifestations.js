'use strict';
// A living material, not an opacity transition over a finished photograph.
// The image supplies anatomy; procedural flow supplies the visible material.
window.Manifestations = (() => {
 function createMaterialRenderer(){
  const canvas=document.createElement('canvas');
  let gl;
  try{gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false,preserveDrawingBuffer:true});}catch{}
  if(!gl)return null;
  const vertex=`attribute vec2 position;varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
  const fragment=`
    precision highp float;
    varying vec2 uv;
    uniform sampler2D anatomy;
    uniform sampler2D marble;
    uniform float time, reveal, kind, opacity, reach, orbPower, fracture, originX, originY, spread;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
    float fbm(vec2 p){float a=.5,n=0.;for(int i=0;i<4;i++){n+=a*noise(p);p=mat2(1.62,1.17,-1.17,1.62)*p+vec2(3.1,7.4);a*=.5;}return n;}
    void main(){
      float t=time;
      if(kind>4.5){
        // Work in the original illustration's coordinates so the smoke stays
        // behind the blade and the light remains inside the actual gemstones.
        vec2 p=vec2(uv.x,1.-uv.y)*vec2(1536.,1024.);
        vec2 drift=vec2(fbm(p*.005+vec2(t*.09,-t*.12)),fbm(p*.007+vec2(-t*.07,t*.1)))-.5;
        float cloud=fbm(p*.012+drift*2.6+vec2(t*.1,-t*.2));
        vec3 original=texture2D(anatomy,uv).rgb;
        vec3 advected=texture2D(anatomy,uv+drift*vec2(.012,.021)).rgb;
        float violet=smoothstep(.01,.105,max(original.b-original.g,advected.b-advected.g));
        violet*=smoothstep(.0,.065,max(original.r-original.g,advected.r-advected.g));
        float leftCloud=exp(-dot((p-vec2(900.,365.))/vec2(100.,190.),(p-vec2(900.,365.))/vec2(100.,190.)));
        float rightCloud=exp(-dot((p-vec2(1035.,651.))/vec2(111.,194.),(p-vec2(1035.,651.))/vec2(111.,194.)));
        float lowCloud=exp(-dot((p-vec2(1390.,849.))/vec2(133.,110.),(p-vec2(1390.,849.))/vec2(133.,110.)));
        float metalBand=smoothstep(1330.,1385.,p.x+p.y)*(1.-smoothstep(1535.,1615.,p.x+p.y));
        float smoke=clamp(leftCloud+rightCloud+lowCloud,0.,1.)*violet*(1.-metalBand);
        float current=pow(.5+.5*sin(cloud*13.+t*.43+drift.y*3.),2.);
        vec3 mistColor=mix(vec3(.28,.10,.47),vec3(.69,.43,.87),cloud);
        float smokeAlpha=smoke*(.10+.45*current);
        vec3 result=mistColor;float coverage=smokeAlpha;
        // Both purple insets belong to the hilt; the larger gem is the focus.
        for(int i=0;i<2;i++){
          vec2 center=i==0?vec2(1189.,299.):vec2(1442.,74.);
          vec2 size=i==0?vec2(30.,31.):vec2(18.,20.);
          vec2 local=(p-center)/size;float radius=length(local);
          float power=.34+.66*pow(.5+.5*sin(t*.91+.48*sin(t*.37)+float(i)*.65),2.);
          float interior=(1.-smoothstep(.84,1.,radius));
          float facet=fbm(local*2.5+drift+vec2(t*.22,-t*.17));
          float stream=pow(.5+.5*sin(facet*17.-t*.58),7.);
          float core=exp(-dot(local-vec2(-.2,-.23),local-vec2(-.2,-.23))*3.1);
          vec3 gem=mix(vec3(.20,.035,.40),vec3(.64,.32,.92),facet);
          gem+=vec3(.38,.25,.47)*core+vec3(.27,.15,.35)*stream;
          float glow=interior*(.35+.57*power)*(i==0?1.:.7);
          float halo=exp(-radius*1.7)*power*.17;
          float nextAlpha=glow+halo*(1.-glow);
          vec3 contribution=mix(vec3(.42,.12,.72),gem,glow/max(.001,nextAlpha));
          result=(result*coverage*(1.-nextAlpha)+contribution*nextAlpha)/max(.001,coverage*(1.-nextAlpha)+nextAlpha);
          coverage=coverage*(1.-nextAlpha)+nextAlpha;
        }
        gl_FragColor=vec4(result,coverage*opacity);return;
      }
      vec2 q=uv*vec2(4.2,6.5);
      vec2 flow=vec2(fbm(q+vec2(t*.13,-t*.09)),fbm(q+vec2(-t*.11,t*.16)+4.7))-.5;
      vec2 gathered=uv;
      if(kind<1.5)gathered.x=.5+(uv.x-.5)/(1.+(1.-reveal)*.75);
      vec2 warped=gathered+flow*(kind>1.5?.012:.07)+flow*(1.-reveal)*.08;
      if(reach>=0.){
        vec2 palm=vec2(.343,.738)+vec2(.075,-.04)*(1.-reach);
        float hand=1.-smoothstep(.3,1.,length((uv-palm)/vec2(.19,.14)));
        vec2 posed=uv-vec2(.075,-.04)*(1.-reach)*hand;
        warped=mix(warped,posed+flow*.006,hand*smoothstep(.3,.7,reveal));
      }
      if(kind>1.5&&kind<2.5){
        // Advected upward folds distort the assembling edge, then settle into
        // the creature's anatomy without freezing the translucent surface.
        vec2 flameFlow=vec2(fbm(q*1.8+vec2(0.,-t*.5))-.5,fbm(q*.9+vec2(t*.1,-t*.38))-.5);
        warped=uv+flow*.004+flameFlow*vec2(.045,.035)*(1.-reveal);
      }
      vec4 shape=texture2D(anatomy,warped);
      float soft=shape.a*.36;
      soft+=texture2D(anatomy,warped+vec2(.022,.015)).a*.16;
      soft+=texture2D(anatomy,warped-vec2(.022,.015)).a*.16;
      soft+=texture2D(anatomy,warped+vec2(-.018,.025)).a*.16;
      soft+=texture2D(anatomy,warped+vec2(.018,-.025)).a*.16;
      float n=fbm(q+flow*3.+vec2(-t*.17,t*.23));
      float fine=fbm(q*2.4+flow*2.+t*.06);
      float alpha;
      vec3 color;
      if(kind>3.5){
        // Spectral fire is its own continuously advected volume. The anatomy
        // guides where folds join, rather than supplying a photograph's color.
        vec2 fireQ=uv*vec2(10.2,3.7);
        vec2 eddy=vec2(fbm(fireQ+vec2(0.,-t*.55)),fbm(fireQ*.73+vec2(t*.12,-t*.4)))-.5;
        float fireNoise=fbm(fireQ+eddy*2.8+vec2(0.,-t*.64));
        float slowFold=fbm(uv*vec2(4.,5.)+vec2(t*.09,-t*.31));
        vec2 fireUV=uv+vec2(eddy.x*.065,eddy.y*.023-.032);
        float core=texture2D(anatomy,fireUV).a;
        float halo=texture2D(anatomy,fireUV+vec2(.029,.028)).a;
        halo+=texture2D(anatomy,fireUV+vec2(-.029,.028)).a;
        halo+=texture2D(anatomy,fireUV+vec2(.017,-.04)).a;
        halo+=texture2D(anatomy,fireUV+vec2(-.017,-.04)).a;
        halo*=.25;
        float volume=core*.53+halo*.47;
        float rise=.07+smoothstep(0.,.94,reveal)*1.08;
        float front=smoothstep(-.075,.13,rise-uv.y+(slowFold-.5)*.26);
        float veil=smoothstep(.26,.65,fireNoise);
        float filament=1.-smoothstep(.025,.115,abs(fireNoise-.51));
        float edgeFlame=max(0.,halo-core*.6);
        float pulse=.82+.18*sin(slowFold*7.+t*.73);
        alpha=volume*front*(.11+veil*.43+filament*.2)*pulse;
        alpha+=edgeFlame*front*filament*.32;
        alpha*=smoothstep(0.,.035,reveal)*opacity;
        // A single silver/violet range shimmers through sheets of cold fire.
        color=mix(vec3(.10,.065,.17),vec3(.54,.40,.66),pow(veil,.7));
        color+=vec3(.16,.135,.18)*filament*(.4+edgeFlame);
        // Keep the completed face legible while fire still moves over the body.
        alpha*=1.-smoothstep(.8,.96,uv.y)*smoothstep(.78,1.,reveal)*.72;
      }else if(kind>2.5){
        // Broad shadows travel along the photographed floor's veins. Their
        // cool, nearly neutral glints stay subordinate to the dark current.
        vec3 stone=texture2D(anatomy,uv).rgb;
        float floorMask=1.-smoothstep(.41,.53,uv.y);
        vec2 center=vec2(.742,.262);
        float distance=length((uv-center)*vec2(1.,.65));
        float vein=clamp((max(stone.g,stone.b)-stone.r)*5.+dot(stone,vec3(.21,.72,.07))*.24,0.,1.);
        float flowPhase=fbm(uv*14.+flow*.7+vec2(t*.025,0.))*12.-t*.9-distance*24.;
        float crawling=pow(.5+.5*sin(flowPhase),3.);
        float gathering=exp(-distance*(3.+reveal*9.));
        float lip=pow(.5+.5*sin(flowPhase+.38),14.)*(1.-crawling*.6);
        color=vec3(.028,.022,.044)+vec3(.15,.145,.17)*lip;
        alpha=vein*floorMask*crawling*(.19+gathering*.64)*opacity*(1.-smoothstep(.82,1.,reveal));
        if(fracture>=0.){
          float age=mod(fracture,9.8);
          float burst=smoothstep(0.,.45,age)*(1.-smoothstep(3.8,5.1,age));
          float cracks=0.,halo=0.;
          for(int i=0;i<2;i++){
            vec2 root=vec2(originX+(i==0?-spread:spread),originY);
            vec2 delta=(uv-root)*vec2(1.,1.65);
            float radius=length(delta);
            float angle=atan(delta.y,delta.x);
            // Fine branching paths bend with the photographed marble's veins.
            float grain=fbm(uv*23.+stone.gb*1.8);
            float branch=abs(sin(angle*5.+grain*3.7+radius*12.+float(i)*2.4));
            float offshoot=abs(sin(angle*11.-radius*25.+grain*5.));
            float line=min(branch,offshoot+.018);
            float front=max(0.,age-float(i)*.23)*.155;
            float arrive=smoothstep(-.016,.016,front-radius);
            float trail=exp(-max(0.,front-radius)*7.);
            float limit=1.-smoothstep(.43,.64,radius);
            float mineral=.48+.52*smoothstep(.04,.35,vein);
            float shimmer=.66+.34*sin(radius*74.-t*2.1+grain*6.);
            cracks+=(1.-smoothstep(.012,.047,line))*arrive*trail*limit*mineral*shimmer;
            halo+=(1.-smoothstep(.025,.13,line))*arrive*trail*limit*mineral;
          }
          float gleam=clamp(cracks,0.,1.);
          color=mix(vec3(.25,.18,.39),vec3(.81,.75,.91),gleam);
          alpha=(gleam*.88+halo*.15)*burst*floorMask*opacity;
        }
      }else if(kind<1.5){
        // Wisps entwine, drift through the silhouette and unravel at its edges.
        float gather=smoothstep(.0,.55,reveal);
        float weaving=smoothstep(-.06,.14,n+reveal*.82-.88);
        float veil=smoothstep(.14,.6,soft)*(.48+.44*n);
        float detail=dot(shape.rgb,vec3(.21,.72,.07));
        alpha=(soft*weaving*.84+veil*.12*reveal)*gather*opacity;
        alpha*=.8+.2*sin(n*8.+t*.38);
        vec3 dark=kind<.5?vec3(.16,.055,.28):vec3(.11,.19,.21);
        vec3 light=kind<.5?vec3(.8,.48,.98):vec3(.63,.71,.68);
        color=mix(dark,light,pow(smoothstep(.22,.77,n+detail*.16),1.9));
        color*=.58+detail*.63;
        color+=pow(fine,5.)*.34;
        if(reach>=0.){
          vec2 palm=vec2(.343,.738)+vec2(.075,-.04)*(1.-reach);
          float lightFalloff=exp(-length((uv-palm)/vec2(.10,.065))*1.6);
          float hand=1.-smoothstep(.3,1.,length((uv-palm)/vec2(.14,.095)));
          color=mix(color,vec3(.23,.27,.30)+detail*.31,hand*.7*smoothstep(.6,1.,reveal));
          color+=vec3(.49,.14,.85)*lightFalloff*orbPower;
          alpha=min(.86,alpha*1.25);
          alpha=mix(alpha,max(alpha,shape.a*.82*reveal),hand*smoothstep(.6,1.,reveal));
        }
      }else{
        // A wavering flame contour arrives before the dense body. Both are
        // continuous fields: no glitter, confetti or straight reveal band.
        float flame=fbm(uv*vec2(10.,5.)+flow*2.+vec2(0.,-t*.53));
        float front=reveal*1.36-uv.y*.84-(1.-flame)*.35;
        float matter=smoothstep(-.02,.19,front)*smoothstep(.12,.63,reveal);
        vec2 plumeUV=warped+vec2((flame-.5)*.018,-.035-(1.-reveal)*.035);
        float plume=texture2D(anatomy,plumeUV).a;
        float contour=clamp(soft-shape.a*.55,0.,1.);
        float tongue=contour*.8+max(0.,plume-shape.a)*.8;
        // The translucent contour gathers first; the dense anatomical detail
        // catches up later, so the guest emerges from volume rather than dots.
        float flameHeight=smoothstep(0.,.32,reveal)*1.18;
        float tongueFront=smoothstep(-.12,.18,flameHeight-uv.y+(flame-.5)*.22);
        float flameDensity=smoothstep(.21,.67,flame)*(.4+.6*n);
        float vapor=(tongue+soft*.13)*tongueFront*flameDensity*(1.-smoothstep(.88,1.,reveal));
        vec2 stoneUV=vec2(fract(.18+uv.x*.59+flow.x*.05+t*.004),.015+uv.y*.43+flow.y*.02);
        vec3 stone=texture2D(marble,stoneUV).rgb;
        float stoneLum=dot(stone,vec3(.21,.72,.07));
        float veins=clamp(abs(stone.g-stone.r)*2.+abs(stone.b-stone.r)*1.4,0.,1.);
        float crawl=pow(.5+.5*sin(fbm(q*.85+flow)*17.-t*.62),12.);
        float gleam=veins*crawl*smoothstep(.34,.69,fine);
        float sourceLum=dot(shape.rgb,vec3(.21,.72,.07));
        float lum=min(sourceLum,.43);
        color=vec3(.035,.031,.042)+vec3(.4,.385,.415)*lum;
        // Desaturate the borrowed marble: isolated pearly reflections glide
        // over charcoal skin instead of coloring the entire body.
        color+=vec3(.29,.30,.32)*gleam*(.28+stoneLum*.38);
        float face=smoothstep(.82,.93,uv.y);
        // Preserve photographed light and hollows of the peeling prosthetics;
        // flattening their luminance would turn the face back into a drawing.
        vec3 facialLight=vec3(.029,.025,.034)+vec3(.62,.59,.635)*sourceLum;
        color=mix(color,facialLight,face*.78);
        // Retain the photographed oxide on the iron while the cloth stays dark.
        float rust=smoothstep(.012,.08,shape.r-shape.g*1.3)*smoothstep(.004,.04,shape.g-shape.b*1.12);
        color=mix(color,shape.rgb*.63+vec3(.014,.009,.006),rust*.78);
        float leftHand=1.-smoothstep(.6,1.,length((uv-vec2(.300,.443))/vec2(.067,.11)));
        float scrollHand=1.-smoothstep(.55,1.,length((uv-vec2(.587,.694))/vec2(.086,.057)));
        float vascular=fbm(uv*vec2(37.,52.)+flow*.3);
        float veinLine=1.-smoothstep(.009,.036,abs(vascular-.49));
        float handVeins=max(leftHand,scrollHand)*veinLine*shape.a*smoothstep(.57,.88,reveal);
        color+=vec3(.45,.10,.72)*handVeins*(.65+.22*sin(t*.74+n*6.));
        // The generated purple tracery identifies the actual remaining skin.
        // Its slow shimmer stays registered to the peeling face and neck.
        float headSkin=1.-smoothstep(.65,1.,length((uv-vec2(.392,.923))/vec2(.072,.058)));
        float neckSkin=1.-smoothstep(.55,1.,length((uv-vec2(.464,.81))/vec2(.064,.098)));
        float violetInk=smoothstep(.023,.115,shape.b-max(shape.r*.97,shape.g*1.22));
        float skinVeins=max(max(headSkin,neckSkin)*violetInk,headSkin*veinLine*.22)*smoothstep(.60,.94,reveal);
        float venousShimmer=.42+.58*pow(.5+.5*sin(t*1.1+uv.y*17.+n*2.),2.);
        color+=vec3(.47,.11,.72)*skinVeins*venousShimmer;
        // Violet lights flicker softly within the skeletal orbital hollows.
        float eyes=exp(-dot((uv-vec2(.359,.902))/vec2(.012,.005),(uv-vec2(.359,.902))/vec2(.012,.005)));
        eyes+=exp(-dot((uv-vec2(.410,.914))/vec2(.012,.005),(uv-vec2(.410,.914))/vec2(.012,.005)));
        float eyeShimmer=.7+.3*sin(t*1.27+2.)*sin(t*.61+1.);
        color=mix(color,vec3(.56,.17,.84)*eyeShimmer,clamp(eyes*.95,0.,1.)*smoothstep(.62,.9,reveal));
        color+=vec3(.15,.135,.18)*vapor;
        alpha=(shape.a*matter*(.89+.07*n)+vapor)*opacity;
      }
      alpha*=smoothstep(0.,.035,uv.x)*smoothstep(0.,.035,1.-uv.x);
      gl_FragColor=vec4(color,alpha);
    }`;
  function compile(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){console.warn('Material shader could not compile:',gl.getShaderInfoLog(shader));return null;}return shader;}
  const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
  if(!vs||!fs)return null;
  const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))return null;
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  const uniforms=Object.fromEntries(['anatomy','marble','time','reveal','kind','opacity','reach','orbPower','fracture','originX','originY','spread'].map(n=>[n,gl.getUniformLocation(program,n)]));
  gl.uniform1i(uniforms.anatomy,0);gl.uniform1i(uniforms.marble,1);
  const textures=new WeakMap();
  function texture(im,unit){
    if(!im?.naturalWidth)return false;
    gl.activeTexture(gl.TEXTURE0+unit);
    let tex=textures.get(im);
    if(!tex){
      tex=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,tex);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,im);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);textures.set(im,tex);
    }else gl.bindTexture(gl.TEXTURE_2D,tex);
    return true;
  }
  let lost=false,previous=null;canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;});
  return {render(im,{time=0,reveal=1,kind=0,opacity=1,floor=null,reach=-1,orbPower=0,fracture=-1,originX=.742,originY=.262,spread=.044}={}){
    if(lost||!im?.naturalWidth)return null;
    const floorReady=Boolean(floor?.naturalWidth);
    if(previous&&previous.im===im&&previous.time===time&&previous.reveal===reveal&&previous.kind===kind&&previous.opacity===opacity&&previous.floor===floor&&previous.floorReady===floorReady&&previous.reach===reach&&previous.orbPower===orbPower&&previous.fracture===fracture&&previous.originX===originX&&previous.originY===originY&&previous.spread===spread)return canvas;
    const height=kind===5?768:kind===3?512:448,width=Math.round(height*im.naturalWidth/im.naturalHeight);
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;gl.viewport(0,0,width,height);}
    if(!texture(im,0)||!texture(floor?.naturalWidth?floor:im,1))return null;
    gl.uniform1f(uniforms.time,time/1000);gl.uniform1f(uniforms.reveal,reveal);gl.uniform1f(uniforms.kind,kind);gl.uniform1f(uniforms.opacity,opacity);
    gl.uniform1f(uniforms.reach,reach);gl.uniform1f(uniforms.orbPower,orbPower);
    gl.uniform1f(uniforms.fracture,fracture);gl.uniform1f(uniforms.originX,originX);gl.uniform1f(uniforms.originY,originY);gl.uniform1f(uniforms.spread,spread);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    previous={im,time,reveal,kind,opacity,floor,floorReady,reach,orbPower,fracture,originX,originY,spread};
    return canvas;
  }};
 }
 // Separate buffers avoid rebuilding the GPU drawing surface every time the
 // floor and the figure, which have different aspect ratios, are sampled.
 const figure=createMaterialRenderer(),floor=createMaterialRenderer(),fire=createMaterialRenderer();
 let blade;
 if(!figure)return null;
 return {render(im,options={}){if(options.kind===5){if(blade===undefined)blade=createMaterialRenderer();return blade?.render(im,options)||null;}return (options.kind===4?fire:options.kind===3?floor:figure)?.render(im,options)||null;}};
})();
