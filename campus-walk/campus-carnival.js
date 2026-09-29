import * as THREE from './vendor/three.module.js';

// Event dressing follows the purple/pink/orange Danala Carnival artwork.
// The people are illustrative students, not portraits of actual attendees.
export const CARNIVAL_GUESTS=[
 [0,-23,11.6],[1,-21.8,11.9],[2,-18.6,10.9],[3,-17.4,11.2],
 [5,-11.3,11.1],[9,-10.1,11.4],[6,-7.1,11.6],[11,-6,11.9],
 [8,-23.1,15.2],[9,-21.9,15.5],[10,-22.8,17.1],
 [0,-19.6,14.1],[3,-18.4,14.5],[4,-19.1,15.6],
 [5,-11.5,14.2],[1,-10.3,14.6],[7,-10.9,15.8],
 [6,-7.8,18.3],[11,-6.7,18.7],[2,-8.2,20],
 [8,-18.6,19.6],[9,-17.3,20],[10,-19.3,20.8],
 [4,-16.7,9.2],[7,-13.2,9.6],[0,-15.9,7.9],[9,-14.4,8.2],
 [11,-15,5.0,.54],[6,-23.7,19.1],[2,-22.4,19.4]
];

export function createCarnival(scene,kit,{solid,obstacle,moving}){
 const {box,cylinder,ellipsoid,beam,label,contact,material,geometry,instance}=kit;
 const V=(x,y,z)=>new THREE.Vector3(x,y,z);
 const colors=['#793ab5','#ec5793','#f29b48','#50a7a0','#deb84c','#8174c3'];
 // Keep a low, quiet university backdrop behind the event.
 box(12.5,3.5,2.1,'#dedacf',-15,1.97,3.4,.11);
 box(13,.15,2.5,'#b9c4bd',-15,3.78,3.4,.04);
 for(let i=0;i<8;i++)box(1.22,2.24,.06,'#8eaaa9',-20.4+i*1.55,1.8,4.49,.025);
 solid(-15,3.4,12.6,2.2,3.85);
 // Broad gathering floor with a clear route through its centre.
 box(20,.035,14,'#e5d8d1',-15,.205,13,.025);
 box(7.6,.028,7.4,'#c0a5da',-15,.225,10.5,.08);
 for(const [x,z,w,d,color] of [[-22,13,4,9,'#deb2ce'],[-8,13,4,9,'#edc097'],[-15,17.3,7.6,3.8,'#d7c2e5']])box(w,.025,d,color,x,.227,z,.06);
 // Compact DJ stage, speaker stacks and a recognisable event banner.
 box(7.5,.42,3.1,'#3d354b',-15,.43,5.7,.08);solid(-15,5.7,7.5,3.1);
 for(const x of [-18.4,-11.6]){
  box(.97,2.35,.8,'#292638',x,1.66,5.65,.09);
  const cone=geometry('speaker-cone',()=>new THREE.CircleGeometry(.31,28));
  for(const y of [.95,1.88])instance(cone,material('#464155',{roughness:.55}),x,y,6.064,1,1,1,0,0,0,false);
  label('●',x,2.54,6.075,.44,.23,null,'#a598b8');
 }
 box(2.7,1.0,.9,'#533078',-15,1.15,5.9,.08);box(2.85,.13,1.08,'#252c3f',-15,1.73,5.9,.035);
 for(const x of [-15.78,-14.22]){cylinder(x,1.83,5.9,.32,.05,'#42485b');cylinder(x,1.865,5.9,.11,.022,'#db79b7');}
 for(let i=0;i<6;i++)box(.05,.04,.3,i%2?'#ee7aae':'#b3aac7',-15.29+i*.115,1.82,5.91,.008);
 for(const x of [-19.4,-10.6]){box(.1,4.6,.1,'#625575',x,2.6,5.3,.02);solid(x,5.3,.22,.22);}
 box(9.15,1.12,.12,'#6630a2',-15,4.45,5.3,.04);
 label('CDU STUDENT CARNIVAL',-15,4.6,5.38,8.55,.46,'#6630a2');
 label('Food · Music · Student groups',-15,4.15,5.38,6.3,.28,'#6630a2','#ffd48d');
 obstacle(-15,4.45,5.3,9.15,1.12,.16);
 // Six lively stalls have distinct table displays and room to browse.
 function stall(x,z,color,title,kind){
  box(3.3,.95,1.55,color,x,.76,z,.075);box(3.55,.12,1.78,'#fff4df',x,1.3,z,.04);
  for(const dx of [-1.5,1.5]){box(.07,2.85,.07,'#ded6da',x+dx,1.66,z-.64,.015);box(.07,2.85,.07,'#ded6da',x+dx,1.66,z+.66,.015);}
  box(3.85,.19,2.18,color,x,3.05,z,.06);
  for(let i=0;i<6;i++)box(.26,.04,2.16,'#fff3db',x-1.64+i*.65,3.165,z,.005);
  box(3.7,.38,.09,color,x,2.85,z+1.09,.025);
  label(title,x,2.85,z+1.147,3.35,.31,color);
  label(kind==='food'?'Come and share a plate':kind==='drink'?'Take a break':'Come and say hello',x,.94,z+.788,2.7,.25,color,'#fff1cc');
  for(let i=0;i<4;i++){
   const px=x-1.1+i*.73;
   if(kind==='food'){
    cylinder(px,1.395,z,.22,.04,'#ffefd6');
    for(let j=0;j<3;j++)ellipsoid(px+(j-1)*.105,1.46,z,.1,.065,.13,['#c57947','#e0b76d','#b7954a'][j]);
   }else if(kind==='drink'){
    cylinder(px,1.51,z,.115,.3,i%2?'#f5c665':'#ee91b1');box(.018,.19,.018,'#fff3db',px+.03,1.7,z,.004);
   }else if(kind==='games'){
    box(.40,.20,.24,'#433b60',px,1.49,z,.055);box(.29,.11,.035,'#a9d6d4',px,1.48,z+.14,.025);
    const band=geometry('vr-headband',()=>new THREE.TorusGeometry(.17,.025,6,18,Math.PI));
    instance(band,material('#605776'),px,1.48,z-.12,1,1,1,-Math.PI/2,0,0);
   }else{
    box(.40,.03,.55,['#eee1a0','#9bcfc7','#e9acd2','#b6a4d2'][i],px,1.397,z,.005,.12*(i-1));
    box(.33,.23,.04,'#fff2df',px,1.53,z-.4,.008);
   }
  }
  solid(x,z,3.9,2.2);contact(x,z,4.5,3.3,.4);
 }
 stall(-23,8.9,colors[0],'Student groups','group');
 stall(-18.8,8.9,colors[1],'Meet the community','group');
 stall(-10.9,8.9,colors[2],'Food to share','food');
 stall(-6.7,8.9,colors[3],'Drinks & a chat','drink');
 stall(-24,13.5,colors[4],'Try something new','group');
 stall(-6.7,14.5,colors[5],'VR & gaming zone','games');
 // The Student Life posts also feature free ice cream at the Carnival.
 box(2.25,1.05,1.38,'#63b7af',-6.4,.84,20.3,.10);box(2.39,.14,1.5,'#fff0db',-6.4,1.44,20.3,.04);
 label('FREE ICE CREAM',-6.4,1.03,21.007,2.12,.35,'#63b7af');
 for(const x of [-7.22,-5.58]){
  const wheel=geometry('cart-wheel',()=>new THREE.TorusGeometry(.23,.065,8,24));
  instance(wheel,material('#584466'),x,.47,21.01,1,1,1,0,0,0);
 }
 for(let i=0;i<5;i++){
  const x=-7.23+i*.42;const cone=geometry('icecream-cone',()=>new THREE.ConeGeometry(.11,.31,12));
  instance(cone,material('#dfac72'),x,1.70,20.3,1,1,1,Math.PI,0,0);
  ellipsoid(x,1.9,20.3,.15,.16,.15,['#f3d4ac','#e5a2b5','#b7d298'][i%3]);
 }
 cylinder(-6.4,2.45,20.65,.045,2.0,'#aa8c73');
 const umbrella=geometry('icecream-umbrella',()=>new THREE.ConeGeometry(1.75,.55,24));
 instance(umbrella,material('#b574c7'),-6.4,3.55,20.65,1,1,1);solid(-6.4,20.3,2.4,1.65);
 // A photo corner and red carpet echo the event's other editions.
 box(3.8,3.05,.18,'#683b9c',-23,1.84,17.6,.07);solid(-23,17.6,3.8,.3);
 label('CARNIVAL MEMORIES',-23,2.91,17.71,3.35,.31,'#683b9c','#ffe2a0');
 label('You belong in the picture',-23,2.47,17.71,3.35,.29,'#683b9c');
 box(3.5,.024,3.2,'#cf427a',-23,.228,18.9,.04);
 for(const x of [-24.6,-21.4])for(const z of [17.5,19.8]){cylinder(x,.8,z,.06,1.15,'#bc9857');ellipsoid(x,1.42,z,.105,.105,.105,'#d8b16a');}
 // Keep the arrival opening generous, with poster stands at its edges.
 for(const x of [-19.9,-10.1]){
  box(.12,4.6,.12,'#71567e',x,2.5,18.4,.025);solid(x,18.4,.28,.28);
  for(let j=0;j<3;j++){
   const bx=x+(j-1)*.43,by=3.34+(j%2)*.5;
   ellipsoid(bx,by,18.4,.31,.40,.31,colors[j+(x<-15?0:2)]);
   beam(V(x,1.1,18.4),V(bx,by-.35,18.4),.008,'#c4b9bc');
  }
 }
 beam(V(-19.9,4.62,18.42),V(-10.1,4.62,18.42),.03,'#71567e');
 label('Come for the Carnival',-15,4.36,18.43,7.25,.60,'#7637a8');
 obstacle(-15,4.36,18.43,7.25,.6,.1);
 const posterPositions=[[-20.35,17.25],[-9.4,15.9]];
 for(const [x,z] of posterPositions){box(1.22,1.81,.14,'#563b70',x,1.39,z,.045);for(const dx of [-.43,.43])box(.065,1.1,.065,'#725780',x+dx,.68,z-.12,.015);solid(x,z,1.3,.7);}
 // Strings of bunting and warm festoon bulbs frame the stalls overhead.
 const flagGeo=new THREE.BufferGeometry();flagGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,.57,0,0,.285,-.63,0],3));flagGeo.computeVertexNormals();
 for(const z of [11.8,16.9]){
  let previous=null;
  for(let i=0;i<25;i++){
   const x=-25+i*.79,y=5.45-.7*Math.sin(i/24*Math.PI),p=V(x,y,z);
   if(previous)beam(previous,p,.013,'#8c738b');previous=p;
   if(i<24){const flag=new THREE.Mesh(flagGeo,material(colors[i%colors.length],{side:THREE.DoubleSide}));flag.position.copy(p);scene.add(flag);moving.push({object:flag,type:'flag',phase:i});}
   ellipsoid(x,y-.1,z,.065,.09,.065,'#ffebad',0,0,false);
  }
 }
 // People are placed in conversations and queues, leaving the main aisle open.
 for(const [cell,x,z,y=.23] of CARNIVAL_GUESTS){
  if(y<.4){solid(x,z,.62,.62);contact(x,z,1.25,1.0,.33,.247);}
 }
 async function load(){
  const loader=new THREE.TextureLoader();
  const [sheet,poster]=await Promise.all([loader.loadAsync('assets/carnival-students.png'),loader.loadAsync('assets/carnival-danala-flyer.png')]);
  for(const t of [sheet,poster]){t.colorSpace=THREE.SRGBColorSpace;t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=false;}
  for(const [x,z] of posterPositions){const p=new THREE.Mesh(new THREE.PlaneGeometry(1.08,1.53),new THREE.MeshBasicMaterial({map:poster,toneMapped:false}));p.position.set(x,1.43,z+.078);scene.add(p);}
  const feet=[348,346,346,347,341,341,341,341,339,338,337,338];
  const guestMaterials=Array.from({length:12},(_,i)=>{
   const map=sheet.clone();map.needsUpdate=true;const row=Math.floor(i/4),col=i%4;map.repeat.set(.25,1/3);map.offset.set(col/4,1-(row+1)/3);
   const m=new THREE.SpriteMaterial({map,transparent:true,alphaTest:.12,depthWrite:false,toneMapped:false});
   m.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
    float lightest=max(diffuseColor.r,max(diffuseColor.g,diffuseColor.b));
    float darkest=min(diffuseColor.r,min(diffuseColor.g,diffuseColor.b));
    float neutral=1.0-smoothstep(0.012,0.07,lightest-darkest);
    diffuseColor.a*=1.0-neutral*smoothstep(0.91,0.977,lightest);
   `);};m.customProgramCacheKey=()=> 'carnival-guests-v1';return m;
  });
  for(const [i,x,z,y=.23] of CARNIVAL_GUESTS){const p=new THREE.Sprite(guestMaterials[i]);const height=3.05+(i%3)*.10;p.scale.set(height,height,1);p.center.set(.5,1-feet[i]/362);p.position.set(x,y,z);scene.add(p);}
 }
 return {load,stallCount:6,guestCount:CARNIVAL_GUESTS.length};
}
