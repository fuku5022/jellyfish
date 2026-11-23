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
geo.attributes.position.needsUpdate=true;glowGeo.attributes.position.array.set(pos);glowGeo.attributes.position.needsUpdate=true;points.rotation.y=Math.sin(t*.13)*.11;glow.rotation.y=points.rotation.y;controls.update();renderer.render(scene,camera);}
requestAnimationFrame(tick);
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
