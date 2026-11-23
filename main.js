import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/controls/OrbitControls.js';

const mount=document.getElementById('scene');
const scene=new THREE.Scene();scene.background=new THREE.Color(0x010711);scene.fog=new THREE.FogExp2(0x010711,.028);
const camera=new THREE.PerspectiveCamera(48,innerWidth/innerHeight,.1,100);camera.position.set(0,1.3,13.7);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;mount.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.dampingFactor=.055;controls.minDistance=6;controls.maxDistance=24;controls.target.set(0,-.6,0);controls.autoRotate=true;controls.autoRotateSpeed=.32;

// Each character is drawn into a cell of a texture atlas; particles live in 3D.
const glyphs='@#$%&*+=:;~^/\\|!?0123456789ABCDEFabcdef<>[]{}';
const COLS=8,ROWS=Math.ceil(glyphs.length/COLS),CELL=64;
const atlas=document.createElement('canvas');atlas.width=COLS*CELL;atlas.height=ROWS*CELL;
const ctx=atlas.getContext('2d');ctx.clearRect(0,0,atlas.width,atlas.height);ctx.fillStyle='#fff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 46px monospace';
for(let i=0;i<glyphs.length;i++)ctx.fillText(glyphs[i],(i%COLS+.5)*CELL,(Math.floor(i/COLS)+.52)*CELL);
const tex=new THREE.CanvasTexture(atlas);tex.colorSpace=THREE.SRGBColorSpace;tex.magFilter=THREE.LinearFilter;
const vertex=`attribute float glyph; attribute float scale; attribute float alpha; varying float vGlyph; varying float vAlpha; uniform float uPixelRatio; void main(){vGlyph=glyph;vAlpha=alpha;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(scale*uPixelRatio*48.0/-mv.z,1.0,24.0);}`;
const fragment=`uniform sampler2D atlas;uniform float cols;uniform float rows;uniform vec3 tint;uniform float intensity;varying float vGlyph;varying float vAlpha;void main(){float col=mod(vGlyph,cols);float row=floor(vGlyph/cols);vec2 uv=vec2((col+gl_PointCoord.x)/cols,1.0-(row+1.0-gl_PointCoord.y)/rows);float a=texture2D(atlas,uv).a;gl_FragColor=vec4(tint*intensity,a*vAlpha);}`;
const N_CAP=6800,N_RIM=1250,N_ARMS=1900,N_TENT=7800,N_DUST=650;
const N=N_CAP+N_RIM+N_ARMS+N_TENT+N_DUST;
const pos=new Float32Array(N*3),orig=new Float32Array(N*3),glyph=new Float32Array(N),scale=new Float32Array(N),alpha=new Float32Array(N),phase=new Float32Array(N),kind=new Uint8Array(N);
let k=0;const rand=(a,b)=>a+Math.random()*(b-a);
function add(x,y,z,type,sz,opacity){const j=k++;orig.set([x,y,z],j*3);pos.set([x,y,z],j*3);kind[j]=type;glyph[j]=Math.floor(Math.random()*glyphs.length);scale[j]=sz;alpha[j]=opacity;phase[j]=rand(0,Math.PI*2);}
// Dome is an actual curved hemisphere, with denser illuminated outer rim.
for(let i=0;i<N_CAP;i++){const r=Math.sqrt(Math.random());const a=rand(0,Math.PI*2);const R=2.75*r;const h=1.55*Math.sqrt(Math.max(0,1-r*r));const thick=rand(-.12,.12);add(Math.cos(a)*R,1.05+h+thick,Math.sin(a)*R,0,rand(1.0,1.9),rand(.3,.85));}
for(let i=0;i<N_RIM;i++){const a=rand(0,Math.PI*2),r=rand(2.55,2.78);add(Math.cos(a)*r,1.03+rand(-.1,.1),Math.sin(a)*r,1,rand(1.2,2.0),rand(.6,1));}
// Frilly oral arms spiral down the center.
for(let i=0;i<N_ARMS;i++){const arm=i%16,u=Math.random(),a=arm*Math.PI*2/16+u*4.8;const r=.26+u*.55+Math.sin(u*38+arm)*.17;add(Math.cos(a)*r+rand(-.1,.1),.86-u*3.65,Math.sin(a)*r+rand(-.1,.1),2,rand(.9,1.6),rand(.4,.9));}
// Dozens of distinct filament strands, with 3D depth, curl and varied lengths.
const STRANDS=104;
for(let i=0;i<N_TENT;i++){const strand=i%STRANDS,u=Math.random();const a=strand*2.399963229728653;const ring=.65+1.95*((strand%13)/12);// Per-strand length below
const L=3.5+2.5*(.5+.5*Math.sin(strand*11.17));const wobble=.18*Math.sin(u*12+strand*1.7)*u;const r=ring+wobble;add(Math.cos(a)*r,.95-u*L,Math.sin(a)*r,3,rand(.65,1.35),rand(.3,.83));}
for(let i=0;i<N_DUST;i++)add(rand(-9,9),rand(-6,6),rand(-7,7),4,rand(.3,.8),rand(.07,.23));
const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('glyph',new THREE.BufferAttribute(glyph,1));geo.setAttribute('scale',new THREE.BufferAttribute(scale,1));geo.setAttribute('alpha',new THREE.BufferAttribute(alpha,1));
function material(tint,intensity,blending){return new THREE.ShaderMaterial({uniforms:{atlas:{value:tex},cols:{value:COLS},rows:{value:ROWS},tint:{value:new THREE.Color(tint)},intensity:{value:intensity},uPixelRatio:{value:Math.min(devicePixelRatio,2)}},vertexShader:vertex,fragmentShader:fragment,transparent:true,depthWrite:false,blending});}
const points=new THREE.Points(geo,material(0x80dfff,1.25,THREE.AdditiveBlending));scene.add(points);
// Soft cyan glow behind typography, retaining sharp readable glyphs in front.
const glowGeo=geo.clone();const glowScale=new Float32Array(scale.length);for(let i=0;i<N;i++)glowScale[i]=scale[i]*2.2;glowGeo.setAttribute('scale',new THREE.BufferAttribute(glowScale,1));const glow=new THREE.Points(glowGeo,material(0x007bff,.19,THREE.AdditiveBlending));scene.add(glow);
const mouse=new THREE.Vector2();window.addEventListener('pointermove',e=>{mouse.x=e.clientX/innerWidth*2-1;mouse.y=e.clientY/innerHeight*2-1;});
let paused=false,clock=0,last=performance.now();document.getElementById('motion').onclick=e=>{paused=!paused;e.target.textContent=paused?'Resume motion':'Pause motion';controls.autoRotate=!paused;};
function tick(now){requestAnimationFrame(tick);const dt=Math.min((now-last)/1000,.05);last=now;if(!paused)clock+=dt;const t=clock;for(let i=0;i<N;i++){const j=i*3,x=orig[j],y=orig[j+1],z=orig[j+2],p=phase[i];if(kind[i]===4)continue;const depth=Math.max(0,1.05-y);const wave=Math.sin(t*1.3+p+depth*1.15);const pulse=1+.025*Math.sin(t*1.8);pos[j]=x*pulse+(.05+depth*.095)*wave+mouse.x*depth*.04;pos[j+1]=y+(kind[i]<2?.085*Math.sin(t*1.8):.035*Math.sin(t*1.7+p));pos[j+2]=z*pulse+(.045+depth*.08)*Math.cos(t*1.1+p+depth*.8)+mouse.y*depth*.035;}
geo.attributes.position.needsUpdate = true;

glowGeo.attributes.position.array.set(pos);
glowGeo.attributes.position.needsUpdate = true;

points.rotation.y = Math.sin(t * 0.13) * 0.11;
glow.rotation.y = points.rotation.y;

// 3D生物のアニメーション
if (previewActive) {
  specimens.children.forEach((o, i) => {
    o.position.y =
      o.userData.baseY +
      Math.sin(t * previewSpeed * 0.8 + i) * 0.12;

    o.rotation.y = t * 0.15 * previewSpeed + i * 0.25;
  });
}

controls.update();
renderer.render(scene, camera);

}

// アニメーション開始
requestAnimationFrame(tick);

// ウィンドウサイズ変更
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});

// Developer-only specimen lab. This scene is independent from saved study records.
const specimens=new THREE.Group();scene.add(specimens);
let previewSpeed=1,previewActive=false;
const specMats=[];
function ellipsoid(x,y,z,rx,ry,rz,amount,out){for(let i=0;i<amount;i++){const u=Math.random()*Math.PI*2,v=Math.acos(2*Math.random()-1);out.push([x+rx*Math.sin(v)*Math.cos(u),y+ry*Math.cos(v),z+rz*Math.sin(v)*Math.sin(u)]);}}
function line(a,b,count,out,wiggle=0){for(let i=0;i<count;i++){let t=i/Math.max(1,count-1);out.push([a[0]*(1-t)+b[0]*t+Math.sin(t*10)*wiggle,a[1]*(1-t)+b[1]*t,a[2]*(1-t)+b[2]*t]);}}
function createCreature(type,idx){const cloud=[];
 if(type===1){ellipsoid(0,0,0,.75,.35,.32,1100,cloud);for(let f of [-1,1]){line([-.45,0,0],[-1.05,f*.6,0],160,cloud);line([.2,0,0],[.65,f*.48,0],110,cloud)}ellipsoid(.55,.1,-.26,.07,.07,.05,35,cloud)}
 if(type===2){ellipsoid(0,.35,0,.85,.38,.85,1300,cloud);for(let j=0;j<24;j++){const a=j*Math.PI*2/24;line([Math.cos(a)*.7,.3,Math.sin(a)*.7],[Math.cos(a)*(.75+Math.sin(j)*.2),-1.5,Math.sin(a)*(.75+Math.sin(j)*.2)],55,cloud,.1)}}
 if(type===3){ellipsoid(0,.25,0,.27,.65,.25,850,cloud);ellipsoid(.18,.95,0,.24,.22,.2,240,cloud);line([.25,1.05,0],[.7,1.08,0],120,cloud);for(let i=0;i<300;i++){const t=i/300*3.6*Math.PI,r=.45*(1-i/360);cloud.push([r*Math.cos(t),-.5-r*Math.sin(t),r*Math.sin(t)])}}
 if(type===4){ellipsoid(0,0,0,.45,.12,.5,650,cloud);for(let side of [-1,1])for(let i=0;i<800;i++){const t=Math.random(),q=Math.random();cloud.push([side*(.25+2.1*t),.05*Math.sin(t*5),(.48*(1-t))* (2*q-1)])}line([0,0,.35],[0,0,2],240,cloud)}
 if(type===5){ellipsoid(0,0,0,.65,.3,.75,1000,cloud);ellipsoid(0,0,-.85,.27,.24,.3,260,cloud);for(let side of [-1,1])for(let z of [-.55,.5])ellipsoid(side*.85,-.07,z,.48,.13,.23,250,cloud)}
 if(type===6){for(let j=0;j<5;j++){const x=(j-2)*.4;for(let i=0;i<260;i++){const t=i/260;cloud.push([x+.07*Math.sin(t*9+j),-1.15+2*t,.07*Math.cos(t*7+j)])}ellipsoid(x,.88,0,.12,.13,.12,90,cloud)}}
 if(type===7){ellipsoid(0,0,0,.28,1.05,.88,1700,cloud);ellipsoid(.1,0,-.8,.07,.07,.06,45,cloud);line([0,1,0],[0,1.45,.2],130,cloud);line([0,-1,0],[0,-1.4,.2],130,cloud)}
 if(type===8){ellipsoid(0,0,0,1.55,.6,.55,1800,cloud);ellipsoid(1.25,.06,0,.6,.46,.45,450,cloud);for(let side of [-1,1]){line([-.2,-.15,side*.3],[-.7,-.55,side*1.35],240,cloud);line([-1.5,0,0],[-2.3,.65,side*.7],250,cloud)}}
 const arr=new Float32Array(cloud.length*3);cloud.forEach((p,i)=>arr.set(p,i*3));const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(arr,3));const m=new THREE.PointsMaterial({color:0x65d6ff,size:.035,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false,sizeAttenuation:true});specMats.push(m);const obj=new THREE.Points(g,m);obj.userData={idx,type};return obj;
}
function clearSpecimens(){while(specimens.children.length){const o=specimens.children[0];specimens.remove(o);o.geometry.dispose();o.material.dispose()}specMats.length=0;previewActive=false}
window.addEventListener('jelly-dev-preview',e=>{const d=e.detail;clearSpecimens();if(d.species==='none')return;const types=d.species==='all'?[1,2,3,4,5,6,7,8]:[Number(d.species)];types.forEach((type,i)=>{const o=createCreature(type,i);const angle=i*2.39996;const radius = types.length === 1 ? 1.8 : 2.5 + (i % 2) * 0.7;o.position.set(Math.cos(angle)*radius,-.8+Math.sin(i*2)*1.5,Math.sin(angle)*radius);o.scale.setScalar(d.size*(types.length===1?1.3:.7));o.material.opacity=Math.min(1,.7*d.glow);specimens.add(o)});previewSpeed=d.speed;previewActive=true});
