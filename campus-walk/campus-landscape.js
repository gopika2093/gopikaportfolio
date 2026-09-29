import * as THREE from './vendor/three.module.js';

export function createLandscape(scene,kit,{ground,surroundings,solids}){
 const {instance,material,ellipsoid,box,beam}=kit;
 // A gentle sky gradient and distant haze give the small world more depth.
 const sky=document.createElement('canvas');sky.width=2;sky.height=512;
 const ctx=sky.getContext('2d'),gradient=ctx.createLinearGradient(0,0,0,512);
 gradient.addColorStop(0,'#82afc4');gradient.addColorStop(.48,'#d3c9c0');gradient.addColorStop(.78,'#f2bb88');gradient.addColorStop(1,'#f8d29c');
 ctx.fillStyle=gradient;ctx.fillRect(0,0,2,512);
 const skyTexture=new THREE.CanvasTexture(sky);skyTexture.colorSpace=THREE.SRGBColorSpace;
 scene.background=skyTexture;scene.fog=new THREE.Fog('#d9d5c5',66,132);

 // A distant Top End beach closes the northern horizon with a warm evening.
 // It is scenery beyond the walkable campus, so it never interrupts a route.
 box(112,.08,15,'#d7b77f',0,.16,-34.5,.015);
 box(142,.07,47,'#5e9fa7',0,.17,-65.5,.01);
 for(let i=0;i<7;i++){
  const z=-42.0-i*4.4,w=102+i*5.2;
  box(w,.012,.13,i<2?'#f6e4c1':'#b9dbd6',0,.218+i*.002,z,.004);
 }
 const sun=new THREE.Mesh(new THREE.CircleGeometry(4.2,48),new THREE.MeshBasicMaterial({color:'#ffd080',transparent:true,opacity:.92,fog:false}));
 sun.position.set(26,11,-93);scene.add(sun);
 const glow=new THREE.Mesh(new THREE.CircleGeometry(7.3,48),new THREE.MeshBasicMaterial({color:'#f5a66f',transparent:true,opacity:.16,depthWrite:false,fog:false}));
 glow.position.set(26,11,-93.05);scene.add(glow);
 for(let i=0;i<9;i++){
  const z=-45-i*3.25,width=7.4-i*.46;
  box(width,.01,.16,'#efbd83',26,.225,z,.002);
 }
 // Low headlands and coastal planting keep the beach connected to the campus.
 for(const [x,z,s] of [[-46,-45,1.25],[-39,-43,.9],[-33,-45,.72],[43,-47,1.15],[49,-44,.92]])
  ellipsoid(x,2.1*s,z,7*s,2.7*s,4.2*s,'#718c72',0,0,false);
 const frond=material('#57765e',{side:THREE.DoubleSide,roughness:1});
 const frondGeo=new THREE.BufferGeometry();frondGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,2.8,.12,0,2.1,.48,.12],3));frondGeo.setIndex([0,1,2]);frondGeo.computeVertexNormals();
 for(const [x,z,s] of [[-31,-31,.75],[34,-32,.83],[-42,-37,.64]]){
  beam(new THREE.Vector3(x,.2,z),new THREE.Vector3(x+.32*s,4.9*s,z),.13*s,'#705945');
  for(let n=0;n<9;n++)instance(frondGeo,frond,x+.32*s,4.85*s,z,s,s,s,0,n*Math.PI*2/9,(-.10+(n%2)*.06),false);
 }
 // Small planted blades catch the light beside paths; keep all paths clear.
 const blade=new THREE.BufferGeometry();
 blade.setAttribute('position',new THREE.Float32BufferAttribute([-.12,0,0,.12,0,0,-.075,.58,.07,.075,.58,.07,0,1,.17],3));
 blade.setIndex([0,1,2,1,3,2,2,3,4]);blade.computeVertexNormals();
 let seed=1987;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 function path(x,z){return Math.abs(x)<2.8||Math.abs(z+4)<2.8||Math.abs(z-16)<2.8||(Math.abs(x-15)<2.35||Math.abs(x+15)<2.35)&&z>-4&&z<16||(x<-4.7&&z>2.3);}
 for(let i=0;i<4200;i++){
  const x=-27+random()*54,z=-23+random()*46;
  if(path(x,z)||solids.some(s=>Math.abs(x-s.x)<s.w/2+.22&&Math.abs(z-s.z)<s.d/2+.22))continue;
  const size=.15+random()*.20;
  for(let n=0;n<3;n++)instance(blade,material(['#709343','#8aa751','#607f42'][i%3],{side:THREE.DoubleSide}),x,.085,z,size,size,size,0,random()*Math.PI*2,0,false);
 }
 // Layer quieter vegetation around the beach while leaving the water visible.
 for(const [x,z,s] of [[-49,-28,1],[-43,-30,.78],[-36,-29,.7],[38,-29,.72],[45,-30,.84],[51,-27,1.05]])
  ellipsoid(x,2.4*s,z,6*s,3.5*s,4*s,'#91a487',0,0,false);
 async function load(){
  const source=await new THREE.TextureLoader().loadAsync('assets/tropical-lawn.png');
  source.colorSpace=THREE.SRGBColorSpace;source.wrapS=source.wrapT=THREE.MirroredRepeatWrapping;
  source.anisotropy=4;
  for(const [mesh,w,d] of [[ground,55,49],[surroundings,240,240]]){
   const map=source.clone();map.needsUpdate=true;map.repeat.set(w/5,d/5);
   mesh.material=new THREE.MeshStandardMaterial({map,color:'#d9dfbd',roughness:1});
  }
 }
 return {load};
}
