import * as THREE from './vendor/three.module.js';
import {RoundedBoxGeometry} from './vendor/RoundedBoxGeometry.js';

// Repeated architectural details share geometry and are drawn in batches.
export function createCampusKit(scene){
 const materials=new Map(),geometries=new Map(),batches=new Map();
 const transform=new THREE.Object3D();
 function material(color,extra={}){
  const key=color+JSON.stringify(extra);
  if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.78,...extra}));
  return materials.get(key);
 }
 function geometry(key,make){if(!geometries.has(key))geometries.set(key,make());return geometries.get(key);}
 function instance(geo,mat,x,y,z,sx=1,sy=1,sz=1,rx=0,ry=0,rz=0,cast=true){
  const key=`${geo.uuid}:${mat.uuid}:${cast}`;
  if(!batches.has(key))batches.set(key,{geo,mat,matrices:[],cast});
  transform.position.set(x,y,z);transform.scale.set(sx,sy,sz);transform.rotation.set(rx,ry,rz);transform.updateMatrix();
  batches.get(key).matrices.push(transform.matrix.clone());
 }
 function box(w,h,d,color,x,y,z,r=.06,rotation=0,extra={}){
  const radius=Math.min(r,w*.22,h*.22,d*.22),key=`box:${w}:${h}:${d}:${radius}`;
  const geo=geometry(key,()=>radius?new RoundedBoxGeometry(w,h,d,2,radius):new THREE.BoxGeometry(w,h,d));
  instance(geo,material(color,extra),x,y,z,1,1,1,0,rotation,0,h>.08);
 }
 function ellipsoid(x,y,z,sx,sy,sz,color,ry=0,rz=0,cast=true){
  instance(geometry('sphere',()=>new THREE.SphereGeometry(1,16,12)),material(color),x,y,z,sx,sy,sz,0,ry,rz,cast);
 }
 function cylinder(x,y,z,r,h,color,topRatio=1){
  const geo=geometry('cylinder:'+topRatio,()=>new THREE.CylinderGeometry(topRatio,1,1,16));
  instance(geo,material(color),x,y,z,r,h,r);
 }
 function beam(a,b,r,color){
  const midpoint=new THREE.Vector3().addVectors(a,b).multiplyScalar(.5),direction=new THREE.Vector3().subVectors(b,a);
  const rotation=new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize()));
  instance(geometry('cylinder:1',()=>new THREE.CylinderGeometry(1,1,1,12)),material(color),midpoint.x,midpoint.y,midpoint.z,r,direction.length(),r,rotation.x,rotation.y,rotation.z);
 }
 function label(text,x,y,z,w=3.6,h=.45,bg='#315b59',ink='#fffdf2',rotation=0){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.round(1024*h/w);
  const ctx=canvas.getContext('2d');if(bg){ctx.fillStyle=bg;ctx.fillRect(0,0,canvas.width,canvas.height);}
  ctx.font=`600 ${Math.floor(canvas.height*.57)}px Arial, sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=ink;
  ctx.fillText(text,512,canvas.height*.52,950);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;
  const object=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,transparent:!bg,toneMapped:false}));
  object.position.set(x,y,z);object.rotation.y=rotation;scene.add(object);return object;
 }
 const shadeCanvas=document.createElement('canvas');shadeCanvas.width=64;shadeCanvas.height=64;
 const shadeContext=shadeCanvas.getContext('2d'),gradient=shadeContext.createRadialGradient(32,32,1,32,32,32);
 gradient.addColorStop(0,'rgba(35,56,43,.46)');gradient.addColorStop(.45,'rgba(35,56,43,.22)');gradient.addColorStop(1,'rgba(35,56,43,0)');
 shadeContext.fillStyle=gradient;shadeContext.fillRect(0,0,64,64);
 const shadeTexture=new THREE.CanvasTexture(shadeCanvas);
 function contact(x,z,w,d,opacity=.6,y=.222){
  const object=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:shadeTexture,transparent:true,opacity,depthWrite:false}));
  object.rotation.x=-Math.PI/2;object.position.set(x,y,z);scene.add(object);
 }
 function flush(){
  for(const {geo,mat,matrices,cast} of batches.values()){
   const mesh=new THREE.InstancedMesh(geo,mat,matrices.length);
   matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.castShadow=cast;mesh.receiveShadow=true;mesh.computeBoundingSphere();scene.add(mesh);
  }
  return {batches:batches.size,instances:[...batches.values()].reduce((n,b)=>n+b.matrices.length,0)};
 }
 return {box,ellipsoid,cylinder,beam,label,contact,material,geometry,instance,flush};
}
