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
    // Conservative contour of walkable marble in the original illustration.
    // It excludes the left columns, balustrades, right parapet and lanterns.
    float marbleFloor(vec2 tex){
      vec2 p=vec2(tex.x,1.-tex.y)*vec2(1536.,1024.);
      float left=mix(1000.,905.,clamp((p.y-580.)/40.,0.,1.));
      left=mix(left,760.,clamp((p.y-620.)/50.,0.,1.));
      left=mix(left,595.,clamp((p.y-670.)/50.,0.,1.));
      left=mix(left,480.,clamp((p.y-720.)/60.,0.,1.));
      left=mix(left,435.,clamp((p.y-780.)/70.,0.,1.));
      left=mix(left,475.,clamp((p.y-850.)/80.,0.,1.));
      left=mix(left,535.,clamp((p.y-930.)/94.,0.,1.));
      float inside=min(p.x-left,p.y-(p.x*.25+335.));
      inside=min(inside,min(1530.-p.x,1018.-p.y));
      return smoothstep(0.,12.,inside);
    }
    // Two crossing families of thin strands supply both the luminous weave
    // and the anatomy that accumulates behind it.
    vec3 weaveField(vec2 p,float age,float amount){
      float fold=fbm(p*vec2(5.,8.)+vec2(age*.06,-age*.13));
      float bend=sin(p.y*17.-age*.85)*2.1+sin(p.y*31.+age*.7)*.55+fold*2.;
      float a=1.-smoothstep(.08,.32,abs(sin(p.x*93.+bend)));
      float b=1.-smoothstep(.06,.26,abs(sin(p.x*131.-bend*.65+p.y*9.)));
      float rise=smoothstep(.18,.97,amount)*1.14;
      float front=smoothstep(-.035,.08,rise-p.y+(fold-.5)*.07);
      return vec3(max(a,b*.7),fold,front);
    }
    void main(){
      float t=time;
      if(kind>7.5){
        vec2 p=vec2(uv.x,1.-uv.y)*vec2(1536.,1024.);
        vec3 original=texture2D(anatomy,uv).rgb;
        vec2 q=(p-vec2(942.,433.))/vec2(490.,460.);
        float angle=atan(q.y,q.x),radius=length(q);
        float fold=abs(sin(angle*4.+t*.065));
        float facets=fbm(vec2(fold*5.,log(1.+radius*8.)*3.-t*.14));
        float current=pow(.5+.5*sin(facets*15.+radius*8.-t*.67),3.);
        float hue=.5+.5*sin(fold*4.+radius*5.-t*.24);
        float stone=smoothstep(.035,.15,max(original.b-original.r*.8,original.g-original.r*.75));
        float gold=smoothstep(.025,.16,original.r-original.b)*.55;
        float walls=smoothstep(570.,700.,p.x)*(1.-smoothstep(460.,540.,p.y));
        float personEdge=mix(1170.,1095.,smoothstep(100.,290.,p.y));
        walls*=1.-smoothstep(personEdge-20.,personEdge,p.x);
        float outer=smoothstep(1390.,1445.,p.x)*(1.-smoothstep(570.,640.,p.y));
        walls=max(walls,outer);
        vec3 color=mix(vec3(.12,.66,.64),vec3(.58,.25,.91),hue);
        color=mix(color,vec3(.93,.68,.36),gold*.65);
        float pulse=.55+.45*sin(t*.47+radius*6.)*sin(t*.47+radius*6.);
        gl_FragColor=vec4(color,walls*max(stone,gold)*(.06+.48*current)*pulse*opacity);return;
      }
      if(kind>6.5){
        vec2 p=vec2(uv.x,1.-uv.y);
        vec3 original=texture2D(anatomy,uv).rgb;
        vec2 faceCenter=reach>.5?vec2(.46,.39):vec2(.43,.36);
        float face=1.-smoothstep(.92,1.16,length((p-faceCenter)/vec2(.29,.31)));
        float left=(1.-smoothstep(.22,.36,p.x))*smoothstep(.09,.3,p.y);
        float right=smoothstep(.64,.82,p.x);
        float crown=(1.-smoothstep(.10,.23,p.y))*.24;
        float shoulder=smoothstep(.58,.78,p.y)*(1.-smoothstep(.17,.30,abs(p.x-.57)));
        float auburn=smoothstep(.015,.075,original.r-max(original.g*1.12,original.b*.92));
        float hair=max(max(left,right),crown)*(1.-face)*(1.-shoulder)*(.35+.65*auburn);
        float gust=pow(max(0.,sin(t*.63+.65*sin(t*.22))),3.);
        gust=max(gust,.62*pow(max(0.,sin(t*.91+2.4)),7.));
        float tips=smoothstep(.13,.94,p.y);
        float bend=(.10+.90*gust)*(.70*sin(t*2.9-p.y*5.+p.x*2.)+.30*sin(t*5.8-p.y*9.));
        vec2 offset=vec2((.006+.029*tips)*bend,.005*gust*sin(t*2.1-p.y*6.));
        vec2 sampleUV=uv+offset*hair;
        gl_FragColor=texture2D(anatomy,sampleUV);return;
      }
      if(kind>5.5){
        vec4 bird=texture2D(anatomy,uv);
        float strand=smoothstep(.48,.86,max(bird.g,bird.b*1.14));
        float flow=fbm(uv*vec2(6.,10.)+vec2(t*.10,-t*.16));
        float current=pow(.5+.5*sin(flow*15.-t*1.8+uv.y*7.),3.);
        float glint=.75+.25*current;
        float assemble=smoothstep((1.-reveal)*1.16,(1.-reveal)*1.16+.14,flow*.46+strand*.54);
        // Leave transparent space between the source's finest bright threads.
        float alpha=bird.a*min(1.,.12+strand*.95)*glint*assemble*opacity;
        vec3 color=mix(vec3(.90,.43,.085),vec3(1.,.88,.52),strand*.76+current*.24);
        gl_FragColor=vec4(color,alpha);return;
      }
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
        vec2 weaveFlow=vec2(fbm(q*1.8+vec2(0.,-t*.5))-.5,fbm(q*.9+vec2(t*.1,-t*.38))-.5);
        warped=uv+(flow*.003+weaveFlow*vec2(.018,.012)*(1.-reveal))*(1.-smoothstep(.80,.93,uv.y));
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
        vec3 weave=weaveField(uv,t,reveal);
        float filament=weave.x,front=weave.z;
        float silhouette=texture2D(anatomy,uv).a;
        float pulse=.55+.45*pow(.5+.5*sin(t*1.6-uv.y*19.+weave.y*4.),2.);
        alpha=silhouette*front*filament*(.28+.4*pulse)*smoothstep(.17,.28,reveal)*opacity;
        color=mix(vec3(.35,.13,.63),vec3(.80,.61,.98),pulse);
      }else if(kind>2.5){
        // Recolor the stationary green veins in place. Both geometry and
        // sampling remain fixed: no floor, wall or reflected image is moved.
        vec3 stone=texture2D(anatomy,uv).rgb;
        float floorMask=marbleFloor(uv);
        vec2 center=vec2(originX,originY);
        vec2 local=(uv-center)/vec2(.18,.095);
        float area=1.-smoothstep(.65,1.35,length(local));
        float vein=smoothstep(.012,.10,stone.g-stone.r)*smoothstep(-.025,.055,stone.g-stone.b*.82);
        float awaken=smoothstep(.0,.29,reveal);
        float radiance=smoothstep(.06,.43,reveal);
        float shimmer=.54+.46*pow(.5+.5*sin(t*1.45+uv.x*34.+uv.y*27.),2.);
        float luminance=dot(stone,vec3(.21,.72,.07));
        color=vec3(.56,.25,.85)*(.28+luminance*1.25)+vec3(.20,.12,.25)*radiance*shimmer;
        alpha=floorMask*area*vein*awaken*(.55+.39*radiance*shimmer)*opacity;
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
        // The luminous weave accumulates into porous photographic anatomy.
        vec3 field=weaveField(uv,t,reveal);
        float strands=field.x;
        float withinWeave=smoothstep(.06,.65,strands);
        float settled=smoothstep(.22,.50,reveal-uv.y*.40);
        float matter=field.z*mix(withinWeave,1.,settled)*smoothstep(.18,.34,reveal);
        vec2 stoneUV=vec2(.62+uv.x*.24+flow.x*.012,.045+uv.y*.20+flow.y*.009);
        vec3 stone=texture2D(marble,stoneUV).rgb;
        float stoneLum=dot(stone,vec3(.21,.72,.07));
        float veins=clamp(abs(stone.g-stone.r)*2.+abs(stone.b-stone.r)*1.4,0.,1.);
        float crawl=pow(.5+.5*sin(fbm(q*.85+flow)*17.-t*.62),12.);
        float gleam=veins*crawl*smoothstep(.34,.69,fine);
        float sourceLum=dot(shape.rgb,vec3(.21,.72,.07));
        color=shape.rgb*.82+vec3(.012,.01,.02);
        // Desaturate the borrowed marble: isolated pearly reflections glide
        // over charcoal skin instead of coloring the entire body.
        float pearlescence=pow(.5+.5*sin(fbm(q*.9)*9.-t*.65),8.);
        color+=vec3(.35,.36,.39)*gleam*(.28+stoneLum*.38);
        color+=vec3(.07,.065,.095)*pearlescence*(.4+sourceLum);
        float face=smoothstep(.82,.93,uv.y);
        // Preserve photographed light and hollows of the peeling prosthetics;
        // flattening their luminance would turn the face back into a drawing.
        color=mix(color,shape.rgb*.94+vec3(.008,.004,.015),face*.78);
        // Retain the photographed oxide on the iron while the cloth stays dark.
        float rust=smoothstep(.012,.08,shape.r-shape.g*1.3)*smoothstep(.004,.04,shape.g-shape.b*1.12);
        color=mix(color,shape.rgb*.63+vec3(.014,.009,.006),rust*.78);
        float leftHand=1.-smoothstep(.6,1.,length((uv-vec2(.300,.443))/vec2(.067,.11)));
        float scrollHand=1.-smoothstep(.55,1.,length((uv-vec2(.587,.694))/vec2(.086,.057)));
        float vascular=fbm(uv*vec2(37.,52.)+flow*.3);
        float veinLine=1.-smoothstep(.009,.036,abs(vascular-.49));
        float handVeins=max(leftHand,scrollHand)*veinLine*shape.a*smoothstep(.57,.88,reveal);
        float veinPulse=.35+.65*pow(.5+.5*sin(t*1.27+uv.y*16.+n*3.),2.);
        color+=vec3(.61,.15,.91)*handVeins*veinPulse;
        // The generated purple tracery identifies the actual remaining skin.
        // Its slow shimmer stays registered to the peeling face and neck.
        float headSkin=1.-smoothstep(.65,1.,length((uv-vec2(.392,.923))/vec2(.072,.058)));
        float neckSkin=1.-smoothstep(.55,1.,length((uv-vec2(.464,.81))/vec2(.064,.098)));
        float violetInk=smoothstep(.023,.115,shape.b-max(shape.r*.97,shape.g*1.22));
        float skinVeins=max(max(headSkin,neckSkin)*violetInk,headSkin*veinLine*.22)*smoothstep(.60,.94,reveal);
        float venousShimmer=.42+.58*pow(.5+.5*sin(t*1.1+uv.y*17.+n*2.),2.);
        color+=vec3(.64,.16,.95)*skinVeins*venousShimmer;
        // Violet lights flicker softly within the skeletal orbital hollows.
        float eyes=exp(-dot((uv-vec2(.359,.902))/vec2(.012,.005),(uv-vec2(.359,.902))/vec2(.012,.005)));
        eyes+=exp(-dot((uv-vec2(.410,.914))/vec2(.012,.005),(uv-vec2(.410,.914))/vec2(.012,.005)));
        float eyeShimmer=.7+.3*sin(t*1.27+2.)*sin(t*.61+1.);
        color=mix(color,vec3(.56,.17,.84)*eyeShimmer,clamp(eyes*.95,0.,1.)*smoothstep(.62,.9,reveal));
        float clothWeave=smoothstep(.35,.65,fbm(uv*vec2(21.,32.)));
        float tendonWeave=smoothstep(.08,.5,field.x)*.6+sourceLum*.8;
        float skin=max(leftHand,scrollHand);
        float density=mix(.36+.56*clothWeave,.24+.62*clamp(tendonWeave,0.,1.),skin);
        density=mix(density,.96,face);
        alpha=shape.a*matter*density*opacity;
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
    const height=kind===5?768:kind===3||kind>=6?512:448,width=Math.round(height*im.naturalWidth/im.naturalHeight);
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
 let blade,phoenix,portrait,tunnel;
 if(!figure)return null;
 return {render(im,options={}){if(options.kind===8){if(tunnel===undefined)tunnel=createMaterialRenderer();return tunnel?.render(im,options)||null;}if(options.kind===7){if(portrait===undefined)portrait=createMaterialRenderer();return portrait?.render(im,options)||null;}if(options.kind===6){if(phoenix===undefined)phoenix=createMaterialRenderer();return phoenix?.render(im,options)||null;}if(options.kind===5){if(blade===undefined)blade=createMaterialRenderer();return blade?.render(im,options)||null;}return (options.kind===4?fire:options.kind===3?floor:figure)?.render(im,options)||null;}};
})();
