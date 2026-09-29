import * as THREE from './vendor/three.module.js';
import {createCampusKit} from './campus-kit.js';
import {createCarnival} from './campus-carnival.js';
import {createLandscape} from './campus-landscape.js';

// A miniature interpretation of Casuarina's garden campus and Danala's
// screened courtyard architecture, keeping the portfolio's existing routes.
export function createWorld(scene){
 const kit=createCampusKit(scene),{box,ellipsoid,cylinder,beam,label,contact,material,geometry,instance}=kit;
 const solids=[],moving=[],platforms=[],cameraObstacles=[];
 const V=(x,y,z)=>new THREE.Vector3(x,y,z);
 const C={cream:'#ede5d4',chalk:'#f3eee3',sand:'#ddd2bd',ochre:'#d6ac50',brick:'#b7785d',roof:'#b6bfba',metal:'#3e5756',glass:'#507e82',leaf:'#639466'};
 function solid(x,z,w,d,height=0){solids.push({x,z,w,d});if(height)obstacle(x,height/2,z,w,height,d);}
 function obstacle(x,y,z,w,h,d){cameraObstacles.push(new THREE.Box3(V(x-w/2-.16,y-h/2-.1,z-d/2-.16),V(x+w/2+.16,y+h/2+.1,z+d/2+.16)));}
 function groundPlane(w,d,color,y=0){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),material(color));m.rotation.x=-Math.PI/2;m.position.y=y;m.receiveShadow=true;scene.add(m);return m;}
 const surroundings=groundPlane(240,240,'#a9bc85',.025);
 const ground=groundPlane(55,49,'#adc28d',.066);
 // Fine, regular paving and a slim border make paths read clearly at foot level.
 const paved=new Set(),paverColors=['#e3ddcd','#e8e2d4','#ded8c9'];
 function path(x,z,w,d){
  box(w+.16,.1,d+.16,'#b8b5a3',x,.135,z,.03);
  for(let ix=Math.ceil(x-w/2+.5);ix<=x+w/2-.5;ix++)for(let iz=Math.ceil(z-d/2+.5);iz<=z+d/2-.5;iz++){
   const k=ix+':'+iz;if(paved.has(k))continue;paved.add(k);
   box(.976,.035,.976,paverColors[Math.abs(ix*17+iz*7)%3],ix,.199,iz,0);
  }
 }
 path(0,0,5,47);path(0,-4,45,5);path(0,16,45,5);path(-15,6,4,20);path(15,6,4,20);
 // Quiet planted borders remain outside all of the main walking routes.
 function shrub(x,z,s=1){
  for(let i=0;i<4;i++){const a=i*2.4;ellipsoid(x+Math.sin(a)*s*.28,.38+s*.28,z+Math.cos(a)*s*.28,s*.5,s*.4,s*.48,['#6d965a','#83a568','#5b875c','#779e62'][i]);}
 }
 const leafPositions=[],leafUvs=[];
 for(let i=0;i<=18;i++){
  const t=i/18,w=Math.sin(t*Math.PI)*(.40+.10*Math.sin(t*Math.PI*18));
  for(const side of [-1,1]){leafPositions.push(side*w,Math.sin(t*Math.PI)*.55-t*.3,3*t);leafUvs.push((side+1)/2,t);}
 }
 const leafIndices=[];for(let i=0;i<18;i++){const a=i*2;leafIndices.push(a,a+2,a+1,a+1,a+2,a+3);}
 const leafGeo=new THREE.BufferGeometry();leafGeo.setAttribute('position',new THREE.Float32BufferAttribute(leafPositions,3));leafGeo.setAttribute('uv',new THREE.Float32BufferAttribute(leafUvs,2));leafGeo.setIndex(leafIndices);leafGeo.computeVertexNormals();
 function palm(x,z,s=1){
  cylinder(x,2.2*s,z,.21*s,4.25*s,'#9e8970',.72);
  for(let i=0;i<8;i++)cylinder(x,(.6+i*.42)*s,z,.218*s,.075*s,'#b6a28a',.98);
  for(let i=0;i<9;i++){const a=i*Math.PI*2/9;instance(leafGeo,material(i%2?'#789c4e':'#4f8054',{side:THREE.DoubleSide}),x,4.36*s,z,s,s,s,.08*(i%3),a,0);}
  ellipsoid(x,4.22*s,z,.33*s,.42*s,.33*s,'#557c4c');
  contact(x,z,3.5*s,3.5*s,.35);solid(x,z,.65*s,.65*s,4.4*s);
 }
 function shadeTree(x,z,s=1,boab=false){
  cylinder(x,1.55*s,z,(boab?.69:.23)*s,3*s,boab?'#b6a18a':'#998971',boab?.56:.7);
  if(boab)ellipsoid(x,1.45*s,z,.79*s,1.35*s,.72*s,'#b6a18a');
  for(let i=0;i<5;i++){
   const a=i*2.4,px=x+Math.sin(a)*1.1*s,pz=z+Math.cos(a)*1.1*s;
   beam(V(x,2.3*s,z),V(px,3.35*s,pz),.10*s,'#a18f77');
   ellipsoid(px,3.8*s+(i%2)*.4*s,pz,1.43*s,1.06*s,1.36*s,['#69965e','#79a367','#57885d','#88ab6c','#679562'][i]);
  }
  ellipsoid(x,4.5*s,z,1.45*s,.95*s,1.35*s,'#7da46c');
  contact(x,z,6*s,6*s,.46);solid(x,z,boab?1.7*s:.8*s,boab?1.7*s:.8*s,3*s);
 }
 function planter(x,z,w=3,d=1.15){
  box(w,.52,d,'#ded4bf',x,.39,z,.13);box(w-.22,.04,d-.22,'#8e8965',x,.672,z,.04);
  for(let i=0;i<Math.max(2,Math.round(w/.65));i++){const px=x-w/2+.4+i*(w-.8)/Math.max(1,Math.round(w/.65)-1);shrub(px,z,.62);}
  contact(x,z,w+1,d+1,.45);solid(x,z,w,d);
 }
 function bench(x,z,angle=0,color='#b0916b'){
  for(const dz of [-.24,0,.24])box(2.45,.12,.19,color,x+Math.sin(angle)*dz,.78,z+Math.cos(angle)*dz,.035,angle);
  for(const side of [-1,1])box(.13,.67,.52,C.metal,x+Math.cos(angle)*side*.84,.43,z-Math.sin(angle)*side*.84,.035,angle);
  box(2.45,.41,.12,color,x-Math.sin(angle)*.35,1.09,z-Math.cos(angle)*.35,.045,angle);
  contact(x,z,3,1.6,.4);
  solid(x,z,Math.abs(Math.cos(angle))*2.5+Math.abs(Math.sin(angle))*.85,Math.abs(Math.sin(angle))*2.5+Math.abs(Math.cos(angle))*.85);
 }
 function glazing(x,y,z,w,h,rotation=0){
  box(w+.13,h+.13,.18,C.metal,x,y,z,.035,rotation);
  box(w,h,.06,C.glass,x+Math.sin(rotation)*.105,y,z+Math.cos(rotation)*.105,.02,rotation,{roughness:.2,metalness:.16});
  box(w*.43,h*.86,.012,'#87aaab',x+Math.cos(rotation)*w*.22+Math.sin(rotation)*.145,y+.02,z-Math.sin(rotation)*w*.22+Math.cos(rotation)*.145,.0,rotation,{roughness:.26});
  box(.045,h,.04,'#bfceca',x+Math.sin(rotation)*.15,y,z+Math.cos(rotation)*.15,.01,rotation);
 }
 function rail(x,y,z,w,color=C.metal){
  box(w,.08,.08,color,x,y,z,.025);
  for(let i=0;i<=Math.ceil(w/.8);i++)box(.05,.72,.05,color,x-w/2+i*w/Math.ceil(w/.8),y-.34,z,.015);
 }
 function lowCampusBlock(x,z,w,d,accent,name){
  const front=z+d/2;
  box(w+.45,.3,d+.4,C.sand,x,.3,z,.1);box(w,5.8,d,C.cream,x,3.23,z,.14);
  box(w,.85,.16,accent,x,.84,front+.12,.035);
  box(w+.65,.18,d+.7,C.roof,x,6.22,z,.045);
  box(w+.8,.13,d+.85,C.chalk,x,6.06,z,.04);
  // Open veranda: slender supports, clear glazing and deep tropical shade.
  box(w+.45,.16,2.15,C.sand,x,3.35,front+.72,.035);
  box(w+.6,.19,2.6,C.roof,x,6.1,front+.82,.045);
  for(let i=0;i<5;i++){
   const wx=x-w/2+.9+i*(w-1.8)/4;
   glazing(wx,1.95,front+.12,1.62,2.02);
   glazing(wx,4.7,front+.12,1.62,1.82);
   box(.10,5.78,.12,C.metal,wx,3.17,front+1.87,.025);
  }
  rail(x,4.17,front+1.86,w-.4);
  for(let i=0;i<8;i++)box(w-.3,.095,.14,i%2?accent:'#b69b69',x,5.4+i*.09,front+.34,.015);
  // Side glazing and a warm vertical colour panel avoid toy-house façades.
  for(const side of [-1,1]){
   for(let i=0;i<3;i++)for(const y of [2.05,4.7])glazing(x+side*(w/2+.07),y,z-d/2+1.7+i*(d-3.4)/2,1.45,1.6,side*Math.PI/2);
  }
  box(.85,5.78,.19,accent,x-w/2+.37,3.2,front+.23,.04);
  label(name,x,3.62,front+1.99,4.0,.43,C.metal);
  // Level entry paving reaches the door, with a shallow side ramp and rails.
  box(3.2,.12,2.1,'#e6dfcf',x,.20,front+1.05,.035);
  const ramp=new THREE.Mesh(new THREE.BoxGeometry(1.7,.08,2),material('#dfd8c7'));ramp.position.set(x+3,.19,front+1.8);ramp.rotation.x=-.08;ramp.receiveShadow=true;scene.add(ramp);
  for(const side of [-1,1])beam(V(x+3+side*.81,.8,front+1),V(x+3+side*.81,.65,front+2.7),.035,C.metal);
  solid(x,z,w+.35,d+.35,6.15);obstacle(x,6.1,front+.82,w+.6,.25,2.6);
  contact(x,z,w+3,d+3,.65);
  planter(x-w/2+1.5,front+2.45,2.2,.9);planter(x+w/2-1.2,front+2.5,1.7,.9);
 }
 lowCampusBlock(-15,-12,11,10,'#bf8b57','Research centre');
 lowCampusBlock(15,-12,10.5,10,'#d2ad50','Student hub');
 // Palms, low seat walls and covered outdoor spaces recall Casuarina.
 palm(-22,-6,.95);palm(-8.4,-8,.94);palm(22,-6,1.06);palm(8,-8,.98);
 bench(-21,-2.5);bench(21,-2.5);planter(-7,-13,1.2,3);planter(7,-13,1.2,3);
 for(const x of [-9,9]){box(3.7,.17,3.4,C.roof,x,3.58,-20,.05);for(const dx of [-1.5,1.5])box(.12,3.4,.12,C.metal,x+dx,1.8,-19,.025);bench(x,-20);obstacle(x,3.58,-20,3.7,.25,3.4);}
 const carnival=createCarnival(scene,kit,{solid,obstacle,moving});
 // A warm, modest campus café with a garden veranda and timber details.
 box(9.1,.3,7.3,'#c98367',16,.31,9,.13);
 // Solid walls sit at the back and sides, leaving the whole front transparent.
 box(8.8,3.55,.20,'#eee2cc',16,2.03,5.55,.06);
 for(const x of [11.70,20.30])box(.20,3.55,6.5,'#eee2cc',x,2.03,8.75,.06);
 box(8.18,.10,6.08,'#caa078',16,.47,8.75,.025);
 // Continuous glass frontage with slim mullions and a glass entrance panel.
 box(8.42,2.82,.065,'#72a2a0',16,1.95,12.10,0,0,{transparent:true,opacity:.40,roughness:.10,metalness:.08,depthWrite:false});
 box(3.15,2.58,.012,'#d8ece5',14.10,2.05,12.145,0,0,{transparent:true,opacity:.18,roughness:.12,depthWrite:false});
 for(let i=0;i<6;i++)box(.075,2.92,.12,'#385956',11.78+i*1.69,1.95,12.13,.015);
 for(const y of [.53,3.38])box(8.45,.08,.12,'#385956',16,y,12.13,.015);
 cylinder(19.48,1.78,12.23,.035,.52,'#d5bd87');
 // A warm counter and shelves remain visible through the glass.
 box(5.45,1.02,.78,'#b77754',15.25,1.02,9.35,.07);
 box(5.7,.12,.98,'#ead7b7',15.25,1.58,9.35,.035);
 for(const y of [2.10,2.68])box(5.15,.09,.35,'#aa7c56',15.45,y,5.78,.025);
 for(let i=0;i<7;i++)cylinder(13.25+i*.72,2.25+(i%2)*.58,5.99,.10,.22,i%2?'#d69c75':'#e7c98d');
 box(9.6,.22,7.6,'#728f83',16,3.95,9,.055);box(9.7,.10,.20,'#fbf0dc',16,3.82,12.81,.02);
 for(let i=0;i<25;i++)box(.045,.045,7.45,'#cdd2c9',11.4+i*.38,4.075,9,.012);
 // A shallow veranda makes the front feel like a place to pause without narrowing the path.
 box(10,.20,1.10,'#6f8e82',16,3.48,12.65,.055);
 for(let i=0;i<17;i++)box(.075,.07,.95,'#c49a6d',11.95+i*.51,3.60,12.65,.012);
 for(const x of [11.35,20.65]){box(.15,3.45,.15,'#405f59',x,1.91,13.0,.03);solid(x,13.0,.32,.32,3.6);}
 box(4.65,.91,.16,'#4e776d',16,3.38,13.24,.055);
 label('Campus café',16,3.49,13.33,4.05,.40,'#4e776d','#fff8e8');
 label('COFFEE · CONVERSATION',16,3.13,13.33,3.70,.21,'#4e776d','#f5d59d');
 // Window boxes and warm pendant lights soften the glass façade.
 for(const x of [13.55,18.45]){
  box(2.35,.48,.62,'#bd745f',x,.54,12.48,.08);
  for(const dx of [-.76,-.25,.28,.78])ellipsoid(x+dx,.91,12.48,.31,.28,.27,dx>0?'#799b63':'#668c62');
  for(const dx of [-.48,.45])ellipsoid(x+dx,1.08,12.48,.08,.07,.08,dx>0?'#e5b26d':'#d89491');
 }
 const cafeGlobe=geometry('cafe-globe',()=>new THREE.SphereGeometry(1,16,12)),cafeLight=material('#ffe0a0',{emissive:'#f3b85f',emissiveIntensity:.45});
 for(const x of [13.1,14.55,16,17.45,18.9]){box(.018,.42,.018,'#665d54',x,3.17,13.02,.002);instance(cafeGlobe,cafeLight,x,2.93,13.02,.10,.12,.10,0,0,0,false);}
 // A small menu board and water bowl give the veranda everyday character.
 box(1.15,1.42,.12,'#425852',19.78,1.18,12.45,.035,-.12);label('TODAY\'S SPECIAL',19.70,1.36,12.53,.86,.32,'#425852','#fff0cf',-.12);
 cylinder(12.25,.29,13.05,.33,.10,'#8fb3b1');
 solid(16,8.8,9,6.9,3.9);obstacle(16,3.95,9,9.7,.35,7.6);obstacle(16,3.48,12.65,10,.25,1.10);contact(16,9,12,10,.6);
 function table(x,z){
  cylinder(x,1.05,z,.77,.13,'#d7b689');cylinder(x,.6,z,.10,.90,C.metal);
  for(const dx of [-1.1,1.1]){box(.65,.12,.65,'#ac8e69',x+dx,.62,z,.08);for(const dz of [-.23,.23])box(.06,.54,.06,C.metal,x+dx,.31,z+dz,.018);box(.65,.40,.07,'#ac8e69',x+dx,.91,z-.29,.03);}
  cylinder(x+.2,1.18,z,.10,.17,C.chalk);cylinder(x-.2,1.18,z+.1,.10,.17,C.chalk);
  solid(x,z,3.0,1.7);contact(x,z,3.2,2.7,.4);
 }
 table(22,16);table(22,20);planter(20.6,14.2,1.35,1.1);palm(25,12,.82);
 // Central boab and rounded seat walls replace the ornamental fountain.
 cylinder(0,.3,4,3.15,.26,'#d5c6aa');cylinder(0,.45,4,2.78,.10,'#a9b986');
 shadeTree(0,4,1.34,true);solid(0,4,6.7,6.7);
 for(const x of [-2.15,2.15])bench(x,4,x<0?Math.PI/2:-Math.PI/2);
 bench(7,5,-Math.PI/2);bench(-7,5,Math.PI/2);
 // Keep the familiar entrance, using warm concrete and a simple timber soffit.
 for(const x of [-3.4,3.4]){box(.64,5,.75,'#dfd3bc',x,2.5,22,.11);box(.8,.2,.96,C.sand,x,5.07,22,.05);solid(x,22,.8,1,5.2);}
 box(7.5,.66,1.13,C.chalk,0,5.13,22,.09);box(5.8,.45,1.17,'#5c9480',0,5.12,22,.065);
 for(let i=0;i<14;i++)box(.25,.04,1.08,'#b99e76',-3.1+i*.47,4.78,22,.012);
 for(const side of [1,-1])label('Explore my professional journey',0,5.12,22+side*.597,5.6,.37,null,'#fffdf1',side===1?0:Math.PI);
 obstacle(0,5.13,22,7.5,.7,1.17);
 // Garden pockets frame the map instead of towering over the visitor.
 const trees=[[-25,-20,.94],[-24,-3,.95],[-24,4,.91],[-25,20,.95],[-21,22,.8],[-9,21,.75],[9,22,.85],[26,1,.92],[25,-20,1.02],[25,-4,.78],[-25,-11,.9],[26,21,.8]];
 trees.forEach(([x,z,s],i)=>i%4===0?palm(x,z,s*1.12):shadeTree(x,z,s));
 for(const x of [-5.5,5.5])for(let i=0;i<8;i++){
  const z=-17+i*2;box(.98,.13,1.2,'#cbb98e',x,.15,z,.09);shrub(x,z,.77);
  for(let j=0;j<3;j++)ellipsoid(x+(j-1)*.18,.76,z+.08,.075,.055,.075,['#dfb674','#d4a2a0','#e6d698'][i%3]);
 }
 const targetRing=new THREE.Mesh(new THREE.RingGeometry(.42,.54,40),new THREE.MeshBasicMaterial({color:'#fff5cd',side:THREE.DoubleSide,transparent:true,opacity:.95}));targetRing.rotation.x=-Math.PI/2;targetRing.position.y=.242;targetRing.visible=false;scene.add(targetRing);
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(.66,40),new THREE.MeshBasicMaterial({color:'#294d3b',transparent:true,opacity:.22,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=.235;scene.add(shadow);
 const landscape=createLandscape(scene,kit,{ground,surroundings,solids});
 const renderStats=kit.flush();scene.updateMatrixWorld(true);
 return {ground,solids,platforms,moving,targetRing,shadow,cameraObstacles,renderStats,loadCarnival:()=>Promise.allSettled([carnival.load(),landscape.load()])};
}
