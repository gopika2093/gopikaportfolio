import * as THREE from './vendor/three.module.js';

export function createCampusView(obstacles){
 const street=new THREE.PerspectiveCamera(55,1,.08,180);
 const map=new THREE.OrthographicCamera(-30,30,20,-20,.1,180);
 const centre=new THREE.Vector3(),desired=new THREE.Vector3(),direction=new THREE.Vector3(),hit=new THREE.Vector3();
 const ray=new THREE.Ray();
 let mode='street',angle=0,targetAngle=0,effectiveAngle=0,avoidanceOffset=0,mapHeight=40,streetDistance=10,boom=10;
 let width=1,height=1,initialized=false;
 function clearBoom(heading){
  direction.set(Math.sin(heading)*streetDistance,1.4,Math.cos(heading)*streetDistance);
  let allowed=direction.length();direction.normalize();ray.set(centre,direction);
  for(const box of obstacles){
   if(box.containsPoint(centre))continue;
   if(ray.intersectBox(box,hit))allowed=Math.min(allowed,Math.max(.05,hit.distanceTo(centre)-.18));
  }
  return allowed;
 }
 function resize(w,h){
  width=Math.max(1,w);height=Math.max(1,h);const aspect=width/height;
  street.aspect=aspect;street.fov=aspect<.8?65:55;street.updateProjectionMatrix();
  const span=mapHeight*(aspect<.8?1.08:1);
  map.left=-span*aspect/2;map.right=span*aspect/2;map.top=span/2;map.bottom=-span/2;map.updateProjectionMatrix();
 }
 function update(player,floor,dt=1/60,reduced=false){
  angle=reduced?targetAngle:THREE.MathUtils.damp(angle,targetAngle,8,dt);
  if(mode==='map'){
   desired.set(player.x*.68,0,player.z*.72-2.7);
   if(!initialized||reduced)centre.copy(desired);else centre.lerp(desired,1-Math.exp(-dt*4));
   map.position.set(centre.x+Math.sin(angle)*35,34,centre.z+Math.cos(angle)*35);
   map.lookAt(centre);map.updateMatrixWorld();
  }else{
   desired.set(player.x,floor+2.35,player.z);
   if(!initialized||reduced)centre.copy(desired);else centre.lerp(desired,1-Math.exp(-dt*14));
   const preferred=clearBoom(angle);
   if(preferred>=6)avoidanceOffset=0;
   let allowed=clearBoom(angle+avoidanceOffset);
   if(allowed<5.8){
    let best=allowed,bestOffset=avoidanceOffset;
    for(const offset of [Math.PI/4,-Math.PI/4,Math.PI/2,-Math.PI/2,3*Math.PI/4,-3*Math.PI/4,Math.PI]){
     const space=clearBoom(angle+offset);
     if(space>best){best=space;bestOffset=offset;}
     if(space>=6)break;
    }
    avoidanceOffset=bestOffset;allowed=best;
   }
   effectiveAngle=angle+avoidanceOffset;
   clearBoom(effectiveAngle); // Restore the selected direction after probing.
   // Pull inward immediately at an obstruction; ease back out when clear.
   boom=!initialized||allowed<boom||reduced?allowed:THREE.MathUtils.damp(boom,allowed,7,dt);
   street.position.copy(centre).addScaledVector(direction,boom);
   street.lookAt(centre);street.updateMatrixWorld();
  }
  initialized=true;
 }
 return {
  get camera(){return mode==='street'?street:map;},get mode(){return mode;},get angle(){return mode==='street'?effectiveAngle:angle;},
  resize,update,
  visible(point){
   if(mode==='map')return true;
   direction.copy(point).sub(street.position);const length=direction.length();
   ray.set(street.position,direction.normalize());
   return !obstacles.some(box=>!box.containsPoint(point)&&ray.intersectBox(box,hit)&&hit.distanceTo(street.position)<length-.3);
  },
  toggle(){mode=mode==='street'?'map':'street';initialized=false;resize(width,height);},
  turn(amount){if(mode==='street'&&avoidanceOffset){angle=effectiveAngle;targetAngle=effectiveAngle;avoidanceOffset=0;}targetAngle+=amount;},
  zoom(amount){if(mode==='street')streetDistance=THREE.MathUtils.clamp(streetDistance+amount*1.2,6,16);else mapHeight=THREE.MathUtils.clamp(mapHeight+amount*5,25,68);resize(width,height);},
  reset(){angle=0;targetAngle=0;effectiveAngle=0;avoidanceOffset=0;mapHeight=40;streetDistance=10;initialized=false;resize(width,height);},
 };
}
