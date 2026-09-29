import * as THREE from './vendor/three.module.js';

// Complete drawn poses keep the original sprite walk without deforming limbs.
const COLUMNS=5;
const CYCLE_DISTANCE=3.5;
const SHEET_HEIGHT=3.65;
const IMAGE_HEIGHT=1122,FRAME_PIXELS=280;
// The generated rows have slightly different spacing. Measured crops prevent
// a neighbouring row's hair appearing along the edge of a walk frame.
const ROW_TOP=[0,277,550,824];
const FOOT_Y=[[274,272,272,272,274],[545,545,546,546,546],[819,816,817,816,817],[1098,1098,1098,1098,1098]];
const ROW_ANGLES=[Math.PI/2,Math.PI,-Math.PI/2,0];
const DIRECTION_ROWS=[3,0,1,2]; // front, right, back, left
export const wrapAngle=angle=>Math.atan2(Math.sin(angle),Math.cos(angle));

export function advanceHeading(heading,dx,dz,dt){
 if(Math.hypot(dx,dz)<.0001)return heading;
 const target=Math.atan2(dx,dz);
 return wrapAngle(heading+wrapAngle(target-heading)*(1-Math.exp(-18*dt)));
}

export function directionRow(heading,viewHeading,previousRow=3){
 const relative=wrapAngle(heading-viewHeading);
 // Retain the view near a diagonal to avoid flickering as the cursor moves.
 if(Math.abs(wrapAngle(relative-ROW_ANGLES[previousRow]))<=Math.PI/4+.10)return previousRow;
 const quadrant=((Math.round(relative/(Math.PI/2))%4)+4)%4;
 return DIRECTION_ROWS[quadrant];
}

export function frameUv(row,column){
 return {repeatX:1/COLUMNS,repeatY:FRAME_PIXELS/IMAGE_HEIGHT,offsetX:column/COLUMNS,offsetY:1-(ROW_TOP[row]+FRAME_PIXELS)/IMAGE_HEIGHT};
}

export async function createGopikaAvatar(){
 const texture=await new THREE.TextureLoader().loadAsync('assets/gopika-directional-walk.png');
 texture.colorSpace=THREE.SRGBColorSpace;
 texture.generateMipmaps=false;
 texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
 const material=new THREE.SpriteMaterial({map:texture,transparent:true,alphaTest:.04,depthWrite:false,depthTest:true,toneMapped:false});
 const faceRegion={value:new THREE.Vector4()};
 // Key the neutral light background at render time, keeping glasses and teeth.
 material.onBeforeCompile=shader=>{
  shader.uniforms.faceRegion=faceRegion;
  shader.fragmentShader='uniform vec4 faceRegion;\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   float lightest=max(diffuseColor.r,max(diffuseColor.g,diffuseColor.b));
   float darkest=min(diffuseColor.r,min(diffuseColor.g,diffuseColor.b));
   float neutral=1.0-smoothstep(0.02,0.10,lightest-darkest);
   float background=neutral*smoothstep(0.70,0.91,lightest);
   bool inFace=length((vMapUv-faceRegion.xy)/faceRegion.zw)<1.0;
   if(!inFace)diffuseColor.a*=1.0-background;
  `);
 };
 material.customProgramCacheKey=()=> 'gopika-directional-walk-v1';
 const sprite=new THREE.Sprite(material);
 sprite.scale.set(SHEET_HEIGHT*(texture.image.width/COLUMNS)/FRAME_PIXELS,SHEET_HEIGHT,1);
 let heading=0,row=3,phase=0,restTime=1,lastPose='',lastDx=0,lastDz=1;
 function update({distance=0,dx=0,dz=0,viewHeading=0,dt=1/60}={}){
  const moving=distance>.0001;
  if(moving){lastDx=dx;lastDz=dz;}
  heading=advanceHeading(heading,lastDx,lastDz,dt);
  row=directionRow(heading,viewHeading,row);
  if(moving){phase=(phase+distance/CYCLE_DISTANCE)%1;restTime=0;}
  else restTime+=dt;
  const column=moving||restTime<.08?1+Math.floor(phase*4):0;
  const pose=`${row}:${column}`;
  if(pose!==lastPose){
   const uv=frameUv(row,column);
   texture.repeat.set(uv.repeatX,uv.repeatY);texture.offset.set(uv.offsetX,uv.offsetY);
   sprite.center.set(.5,1-(FOOT_Y[row][column]-ROW_TOP[row])/FRAME_PIXELS);
   const faceX=[.63,-10,.39,.51][row];
   faceRegion.value.set((column+faceX)/COLUMNS,1-(ROW_TOP[row]+58)/IMAGE_HEIGHT,.065/COLUMNS,23/IMAGE_HEIGHT);
   lastPose=pose;
  }
  if(restTime>.08)phase=0;
 }
 function reset(){heading=0;row=3;phase=0;restTime=1;lastPose='';lastDx=0;lastDz=1;update();}
 reset();
 return {sprite,update,reset};
}
