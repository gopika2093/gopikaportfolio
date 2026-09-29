import * as THREE from './vendor/three.module.js';
import {createWorld} from './campus-world.js';
import {places} from './campus-content.js';
import {blocked,findPath,findCursorPath} from './campus-navigation.js';
import {createGopikaAvatar} from './campus-avatar.js';
import {createCampusView} from './campus-camera.js';
import {conversations} from './campus-dialogue.js';
const $=id=>document.getElementById(id);
const canvas=$('campus'),shell=$('game-shell'),room=$('room');
const welcome=$('welcome');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const keys=new Set(),touchKeys=new Set();
const BRISK_SPEED=4.5;
const WALK_ACCELERATION=14;
let renderer,scene,camera,view,world,avatar,animateAvatar,resetAvatar;
let viewport={width:1,height:1},cameraAngle=0;
let route=[],nearby=null,opened=null,time=0;
let lastFrame=0,frameId=0,ready=false;
let motionSpeed=0;
let frameDistance=0,frameDx=0,frameDz=0;
let downPoint=null,cursorGuide=false,lastGuide=0;
const player=new THREE.Vector3(0,.23,20);
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
const labels=[];
function fail(message){$('load-state').hidden=false;$('load-state').replaceChildren();const panel=document.createElement('div');panel.className='error-panel';const text=document.createElement('p');text.textContent=message;const a=document.createElement('a');a.href='https://gopika2093.github.io/gopikaportfolio/';a.textContent='Open the portfolio';panel.append(text,a);$('load-state').append(panel);}
function clearInput(){keys.clear();touchKeys.clear();motionSpeed=0;document.querySelectorAll('.dpad button').forEach(b=>b.classList.remove('active'));cancelCursorGuide();}
function floorHeight(x,z){let result=.23;for(const p of world.platforms)if(Math.abs(x-p.x)<p.w/2 && Math.abs(z-p.z)<p.d/2)result=Math.max(result,p.top);return result;}
function resize(){viewport={width:shell.clientWidth,height:shell.clientHeight};if(!renderer)return;renderer.setSize(viewport.width,viewport.height,false);view?.resize(viewport.width,viewport.height);}
function walkTo(x,z){if(!ready||room.open||welcome.open)return;clearInput();route=findPath(player,{x,z},world.solids);if(route.length){const end=route[route.length-1];world.targetRing.position.set(end.x,.25,end.z);world.targetRing.visible=true;$('announcement').textContent='Walking to the selected place.';}else{world.targetRing.visible=false;$('announcement').textContent='Try a nearby path.';}$('places').hidden=true;$('places-button').setAttribute('aria-expanded','false');canvas.focus({preventScroll:true});}
function renderStory(index=0){
 const story=opened.stories[index];$('room-story-title').textContent=story.title;$('room-story-copy').textContent=story.copy;
 $('room-period').textContent=story.period||opened.period;
 $('room-story-links').replaceChildren();
 for(const [title,url] of story.links){const a=document.createElement('a');a.href=url;a.textContent=title+' ↗';if(!url.startsWith('mailto:')){a.target='_blank';a.rel='noreferrer';}$('room-story-links').append(a);}
 [...$('room-tabs').children].forEach((b,i)=>{b.setAttribute('aria-selected',String(i===index));b.tabIndex=i===index?0:-1;});
 $('room-story').setAttribute('aria-labelledby',`room-tab-${index}`);
 const journey=$('research-journey');journey.replaceChildren();journey.hidden=!story.chapters;
 if(story.chapters){
  const stops=document.createElement('div');stops.className='journey-stops';
  const detail=document.createElement('p');detail.className='journey-detail';detail.setAttribute('aria-live','polite');
  story.chapters.forEach((chapter,i)=>{const b=document.createElement('button');b.textContent=chapter.label;b.setAttribute('aria-pressed',String(i===0));b.addEventListener('click',()=>{detail.textContent=chapter.copy;for(const other of stops.children)other.setAttribute('aria-pressed',String(other===b));});stops.append(b);});
  detail.textContent=story.chapters[0].copy;journey.append(stops,detail);
 }
}
function renderConversation(placeId,nodeId='start'){
 const node=conversations[placeId]?.[nodeId];if(!node)return;
 $('dialogue-copy').textContent=node.copy;
 const choices=$('dialogue-choices');choices.replaceChildren();
 for(const [label,next] of node.choices){const button=document.createElement('button');button.type='button';button.textContent=label;button.addEventListener('click',()=>renderConversation(placeId,next));choices.append(button);}
 const keep=document.createElement('button');keep.type='button';keep.textContent='Keep walking';keep.addEventListener('click',closeRoom);choices.append(keep);
}
function enterPlace(){
 if(!ready||!nearby||room.open||welcome.open)return;
 clearInput();route=[];world.targetRing.visible=false;opened=nearby;
 $('room-period').textContent=opened.period;$('room-tag').textContent=opened.tag;$('room-title').textContent=opened.title;$('room-intro').textContent=opened.intro;
 const timeline=$('room-timeline'),timelineImage=$('room-timeline-image');
 timeline.hidden=!opened.image;
 if(opened.image){timelineImage.src=opened.image.src;timelineImage.alt=opened.image.alt;}
 else{timelineImage.removeAttribute('src');timelineImage.alt='';}
 $('room-tabs').replaceChildren();opened.stories.forEach((story,index)=>{
  const b=document.createElement('button');b.textContent=story.label;b.id=`room-tab-${index}`;b.setAttribute('role','tab');b.setAttribute('aria-controls','room-story');b.addEventListener('click',()=>renderStory(index));
  b.addEventListener('keydown',e=>{let to=index;if(e.key==='ArrowRight')to=(index+1)%opened.stories.length;else if(e.key==='ArrowLeft')to=(index+opened.stories.length-1)%opened.stories.length;else if(e.key==='Home')to=0;else if(e.key==='End')to=opened.stories.length-1;else return;e.preventDefault();renderStory(to);$('room-tabs').children[to].focus();});
  $('room-tabs').append(b);
 });
 room.setAttribute('aria-labelledby','room-title');renderStory(0);renderConversation(opened.id);room.showModal();$('dialogue-choices').querySelector('button')?.focus();
}
function closeRoom(){room.close();}
$('enter-place').addEventListener('click',enterPlace);$('close-room').addEventListener('click',closeRoom);
room.addEventListener('close',()=>{opened=null;clearInput();canvas.focus({preventScroll:true});});
room.addEventListener('click',e=>{if(e.target!==room)return;const r=room.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeRoom();});
function beginWalk(){welcome.close();}
function returnToEntrance(){
 route=[];clearInput();player.set(0,.23,20);resetAvatar?.();avatar?.position.copy(player);view?.reset();world.targetRing.visible=false;nearby=null;$('nearby').hidden=true;resize();
 $('places').hidden=true;$('places-button').setAttribute('aria-expanded','false');
}
function endWalk(){
 if(!ready)return;
 if(room.open)room.close();
 returnToEntrance();
 $('welcome-title').textContent='Thanks for visiting.';
 $('welcome-copy').textContent='Thanks for walking with me. I hope you found something useful here.';
 $('welcome-overview').hidden=true;$('whats-here').hidden=true;
 $('begin-walk').textContent='Start another walk';$('explore-alone').textContent='Stay at the entrance';
 welcome.showModal();$('begin-walk').focus();
}
$('dismiss-welcome').addEventListener('click',beginWalk);
$('begin-walk').addEventListener('click',beginWalk);
$('explore-alone').addEventListener('click',beginWalk);
$('whats-here').addEventListener('click',()=>{$('welcome-overview').hidden=false;$('welcome-overview').scrollIntoView({block:'nearest',behavior:reduced.matches?'instant':'smooth'});});
$('end-walk').addEventListener('click',endWalk);$('end-walk-room').addEventListener('click',endWalk);
welcome.addEventListener('close',()=>{clearInput();canvas.focus({preventScroll:true});});
$('places-button').addEventListener('click',()=>{const show=$('places').hidden;$('places').hidden=!show;$('places-button').setAttribute('aria-expanded',String(show));});
for(const place of places){
 const button=document.createElement('button');button.textContent=place.title+' →';button.addEventListener('click',()=>walkTo(...place.position));$('place-buttons').append(button);
 const label=document.createElement('button');label.className='world-label';label.textContent=place.title;label.setAttribute('aria-label',`Walk towards ${place.title}`);const hint=document.createElement('span');hint.textContent=place.short;label.append(hint);label.addEventListener('click',()=>walkTo(...place.position));$('world-labels').append(label);labels.push({element:label,place});
 const destination=document.createElement('button');destination.type='button';destination.textContent=place.title;destination.addEventListener('click',()=>{beginWalk();walkTo(...place.position);});$('welcome-destinations').append(destination);
}
$('turn-left').addEventListener('click',()=>{view?.turn(-Math.PI/4);});$('turn-right').addEventListener('click',()=>{view?.turn(Math.PI/4);});
$('zoom-in').addEventListener('click',()=>{view?.zoom(-1);});$('zoom-out').addEventListener('click',()=>{view?.zoom(1);});
$('view-mode').addEventListener('click',()=>{if(!ready)return;clearInput();view.toggle();view.update(player,floorHeight(player.x,player.z));camera=view.camera;cameraAngle=view.angle;$('view-mode').textContent=view.mode==='street'?'Map view':'Street view';$('view-mode').setAttribute('aria-label',`Switch to ${view.mode==='street'?'map':'street'} view`);$('announcement').textContent=view.mode==='street'?'Walk with me at street level.':'Campus map view.';canvas.focus({preventScroll:true});});
$('home-view').addEventListener('click',()=>{if(!ready)return;returnToEntrance();canvas.focus({preventScroll:true});});
const keyMap={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right'};
window.addEventListener('keydown',e=>{
 if(room.open||welcome.open||!ready)return;
 if(e.target instanceof HTMLButtonElement && ['Space','Enter'].includes(e.code))return;
 if(e.code in keyMap){e.preventDefault();keys.add(keyMap[e.code]);route=[];world.targetRing.visible=false;}
 if(e.code==='KeyE'){e.preventDefault();if(!e.repeat)enterPlace();}
 if(e.code==='Escape'){$('places').hidden=true;$('places-button').setAttribute('aria-expanded','false');}
});
window.addEventListener('keyup',e=>{if(e.code in keyMap)keys.delete(keyMap[e.code]);});window.addEventListener('blur',clearInput);
for(const b of document.querySelectorAll('[data-move]')){
 b.addEventListener('pointerdown',e=>{if(!ready||room.open||welcome.open)return;e.preventDefault();b.setPointerCapture(e.pointerId);touchKeys.add(b.dataset.move);b.classList.add('active');route=[];world.targetRing.visible=false;});
 const up=()=>{touchKeys.delete(b.dataset.move);b.classList.remove('active');};b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);
}
function groundAt(clientX,clientY,guide=false){
 const rect=canvas.getBoundingClientRect();pointer.set((clientX-rect.left)/rect.width*2-1,-(clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
 const ground=raycaster.intersectObject(world.ground,false)[0]?.point;
 if(ground)return ground;
 if(guide&&view.mode==='street'){const heading=raycaster.ray.direction.clone();heading.y=0;if(heading.lengthSq()>.001)return player.clone().add(heading.normalize().multiplyScalar(9));}
}
function cancelCursorGuide(){
 if(cursorGuide){route=[];if(world)world.targetRing.visible=false;}
 const pointerId=downPoint?.id;downPoint=null;cursorGuide=false;canvas.classList.remove('guiding');
 if(pointerId!==undefined&&canvas.hasPointerCapture(pointerId))canvas.releasePointerCapture(pointerId);
}
function guideWithCursor(){
 if(!cursorGuide||!downPoint)return;
 const spot=groundAt(downPoint.currentX,downPoint.currentY,true);
 if(!spot){route=[];world.targetRing.visible=false;return;}
 if(Math.hypot(spot.x-player.x,spot.z-player.z)<.65){route=[];world.targetRing.visible=false;return;}
 route=findCursorPath(player,spot,world.solids);
 if(route.length){const end=route[route.length-1];world.targetRing.position.set(end.x,.25,end.z);world.targetRing.visible=true;}else world.targetRing.visible=false;
}
canvas.addEventListener('pointerdown',e=>{
 if(e.button!==0||!ready||room.open||welcome.open||downPoint)return;
 e.preventDefault();clearInput();downPoint={id:e.pointerId,x:e.clientX,y:e.clientY,currentX:e.clientX,currentY:e.clientY};canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});
});
canvas.addEventListener('pointermove',e=>{
 if(!downPoint||e.pointerId!==downPoint.id)return;
 downPoint.currentX=e.clientX;downPoint.currentY=e.clientY;
 if(!cursorGuide&&Math.hypot(e.clientX-downPoint.x,e.clientY-downPoint.y)>6){cursorGuide=true;lastGuide=0;canvas.classList.add('guiding');$('announcement').textContent='Follow your cursor. Release to stop.';}
});
canvas.addEventListener('pointerup',e=>{
 if(!ready||room.open||welcome.open||!downPoint||e.pointerId!==downPoint.id)return;
 const wasGuiding=cursorGuide;cancelCursorGuide();
 if(wasGuiding)return;
 const spot=groundAt(e.clientX,e.clientY);if(spot)walkTo(spot.x,spot.z);
});
canvas.addEventListener('pointercancel',cancelCursorGuide);
canvas.addEventListener('lostpointercapture',()=>{if(downPoint)cancelCursorGuide();});
canvas.addEventListener('wheel',e=>{if(!ready)return;e.preventDefault();view.zoom(Math.sign(e.deltaY)*.5);},{passive:false});
function updateLabels(){
 for(const {element,place} of labels){const anchor=view.mode==='street'?[place.position[0],3.4,place.position[1]]:place.anchor;const position=new THREE.Vector3(...anchor),p=position.clone().project(camera);const x=(p.x+1)*viewport.width/2,y=(1-p.y)*viewport.height/2;const visible=p.z>-1&&p.z<1&&x>55&&x<viewport.width-55&&y>30&&y<viewport.height-65&&view.visible(position);element.hidden=!visible;if(visible){element.style.left=`${x}px`;element.style.top=`${y}px`;}element.classList.toggle('near',nearby?.id===place.id);}
}
function animate(now){
 frameId=requestAnimationFrame(animate);const dt=Math.min(.045,Math.max(0,(now-lastFrame)/1000));lastFrame=now;if(document.hidden)return;time+=dt;
 frameDistance=0;frameDx=0;frameDz=0;
 if(!room.open&&!welcome.open){
  if(cursorGuide&&now-lastGuide>80){guideWithCursor();lastGuide=now;}
  let dx=0,dz=0;const active=new Set([...keys,...touchKeys]);
  if(active.size){const horizontal=Number(active.has('right'))-Number(active.has('left')),vertical=Number(active.has('up'))-Number(active.has('down'));dx=Math.cos(cameraAngle)*horizontal-Math.sin(cameraAngle)*vertical;dz=-Math.sin(cameraAngle)*horizontal-Math.cos(cameraAngle)*vertical;}
  else if(route.length){let to=route[0];let distance=Math.hypot(to.x-player.x,to.z-player.z);if(distance<.2){route.shift();if(!route.length)world.targetRing.visible=false;to=route[0];}if(to){dx=to.x-player.x;dz=to.z-player.z;}}
  const magnitude=Math.hypot(dx,dz),beforeX=player.x,beforeZ=player.z;
  if(magnitude>.02){motionSpeed=Math.min(BRISK_SPEED,motionSpeed+WALK_ACCELERATION*dt);const distance=Math.min(motionSpeed*dt,magnitude);dx=dx/magnitude*distance;dz=dz/magnitude*distance;if(!blocked(player.x+dx,player.z,world.solids,.42))player.x+=dx;if(!blocked(player.x,player.z+dz,world.solids,.42))player.z+=dz;}
  else motionSpeed=0;
  const movedX=player.x-beforeX,movedZ=player.z-beforeZ,movedDistance=Math.hypot(movedX,movedZ);
  if(movedDistance<.0001)motionSpeed=0;
  const floor=floorHeight(player.x,player.z);player.y=floor;
  frameDistance=movedDistance;frameDx=movedX;frameDz=movedZ;
  avatar.position.copy(player);
  world.shadow.visible=true;
  world.shadow.position.set(player.x,floor+.014,player.z);
  world.shadow.scale.setScalar(1);world.shadow.material.opacity=.23;
  let next=null,distance=4.1;for(const place of places){const d=Math.hypot(place.position[0]-player.x,place.position[1]-player.z);if(d<distance){next=place;distance=d;}}
  if(next?.id!==nearby?.id){nearby=next;$('nearby').hidden=!nearby;if(nearby){$('nearby-title').textContent=nearby.title;$('announcement').textContent=`Near ${nearby.title}. Enter only if you wish, using E or Step inside.`;}}
 }
 view.update(player,floorHeight(player.x,player.z),dt,reduced.matches);camera=view.camera;cameraAngle=view.angle;
 animateAvatar({distance:frameDistance,dx:frameDx,dz:frameDz,viewHeading:cameraAngle,dt});
 if(!reduced.matches&&!room.open){for(const item of world.moving){if(item.type==='flag')item.object.rotation.y=Math.sin(time*1.6+item.phase*.4)*.17;}}
 updateLabels();renderer.render(scene,camera);
}
async function start(){
 try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}catch(e){fail('This browser could not open the 3D campus. You can still explore all of my work in the portfolio.');return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.65));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.06;
 scene=new THREE.Scene();scene.background=new THREE.Color('#cfe4ed');scene.fog=new THREE.Fog('#cfe4ed',58,115);
 scene.add(new THREE.HemisphereLight('#fff4dd','#778b70',1.95));const sun=new THREE.DirectionalLight('#ffe6be',2.5);sun.position.set(-27,27,19);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-38,right:38,top:38,bottom:-38,near:.5,far:100});sun.shadow.normalBias=.035;sun.shadow.bias=-.00012;scene.add(sun);scene.add(sun.target);
 world=createWorld(scene);
 view=createCampusView(world.cameraObstacles);camera=view.camera;resize();view.update(player,floorHeight(player.x,player.z));
 const [character]=await Promise.all([createGopikaAvatar(),world.loadCarnival()]);avatar=character.sprite;animateAvatar=character.update;resetAvatar=character.reset;
 avatar.position.copy(player);scene.add(avatar);
 world.shadow.position.set(player.x,player.y+.014,player.z);world.shadow.visible=true;
 ready=true;lastFrame=performance.now();$('load-state').hidden=true;frameId=requestAnimationFrame(animate);
 welcome.showModal();
}
new ResizeObserver(resize).observe(shell);
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();cancelAnimationFrame(frameId);}else if(ready){lastFrame=performance.now();frameId=requestAnimationFrame(animate);}});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frameId);ready=false;fail('The 3D view was interrupted. Refresh the page to reopen the campus, or continue through the portfolio.');});
start().catch(error=>{console.error('Campus could not start',error);fail('The campus could not finish loading. Please refresh to try again, or explore the portfolio.');});
