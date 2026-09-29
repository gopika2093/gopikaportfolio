'use strict';
const $ = id => document.getElementById(id);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const compactMap = window.matchMedia('(max-width: 720px)');
const colours = ['#267d81','#aa791a','#5575a0','#b85843','#756397','#267d81'];
const tints = ['#dbefec','#f9ecc7','#e2ebf8','#f9e4db','#eae4f4','#dbefec'];
const captions = ['A place to begin','Find your feet','Give the idea shape','Make it possible','Bring it to life','Pass it forward'];
const stops = [...document.querySelectorAll('.stop')];
const perspectives = [...document.querySelectorAll('.perspective')];
const route = $('route');
const routeProgress = $('route-progress');
const traveller = $('traveller');
const svg = $('road');
let current = 0;
let lens = 'gopika';
let totalLength = 0;
let currentLength = 0;
let pathSamples = [];
let stopLengths = [];
let dimensions = {width:1000,height:690};
let routeFrame = 0;
let playTimer = 0;
let playing = false;
let dragging = false;
let pointerId = null;

function nearestPathPoint(x,y) {
  let best = pathSamples[0], distance = Infinity;
  for (const sample of pathSamples) {
    const d = (sample.x-x)**2 + (sample.y-y)**2;
    if (d < distance) { distance = d; best = sample; }
  }
  return best;
}
function drawMarker(length) {
  currentLength = Math.max(0,Math.min(totalLength,length));
  const p = route.getPointAtLength(currentLength);
  traveller.style.left = `${p.x/dimensions.width*100}%`;
  traveller.style.top = `${p.y/dimensions.height*100}%`;
  routeProgress.style.strokeDasharray = `${currentLength} ${totalLength+1}`;
}
function moveMarker(target,animate=true) {
  cancelAnimationFrame(routeFrame);
  if (!animate || reduceMotion.matches) { drawMarker(target); return; }
  const from = currentLength, start = performance.now();
  const duration = Math.min(1400,450+Math.abs(target-from)*.28);
  function move(now) {
    const p = Math.min(1,(now-start)/duration);
    const eased = p < .5 ? 4*p*p*p : 1-Math.pow(-2*p+2,3)/2;
    drawMarker(from+(target-from)*eased);
    if(p<1) routeFrame = requestAnimationFrame(move);
  }
  routeFrame = requestAnimationFrame(move);
}
function configureMap() {
  cancelAnimationFrame(routeFrame);
  const compact = compactMap.matches;
  dimensions = compact ? {width:560,height:690} : {width:1000,height:690};
  const path = compact
    ? 'M100 100 L460 100 Q510 100 510 150 L510 250 Q510 300 460 300 L100 300 Q50 300 50 350 L50 450 Q50 500 100 500 L460 500'
    : 'M100 570 L100 170 Q100 90 180 90 L820 90 Q900 90 900 170 L900 535 Q900 615 820 615 L350 615 Q275 615 275 540 L275 335 Q275 275 335 275 L620 275 Q685 275 685 340 L685 445 Q685 485 645 485 L535 485';
  const points = compact ? [[100,100],[460,100],[460,300],[100,300],[100,500],[460,500]] : [[100,445],[420,90],[900,340],[555,615],[275,360],[535,485]];
  svg.setAttribute('viewBox',`0 0 ${dimensions.width} ${dimensions.height}`);
  for(const id of ['route-shadow','route','route-progress','route-dashes']) $(id).setAttribute('d',path);
  totalLength = route.getTotalLength();
  pathSamples = Array.from({length:1801},(_,i)=>{
    const length = totalLength*i/1800;
    const p = route.getPointAtLength(length);
    return {x:p.x,y:p.y,length};
  });
  stopLengths = points.map(([x,y],i)=>{
    stops[i].style.setProperty('--x',`${x/dimensions.width*100}%`);
    stops[i].style.setProperty('--y',`${y/dimensions.height*100}%`);
    return nearestPathPoint(x,y).length;
  });
  drawMarker(stopLengths[current]);
}
function refreshStory(animate=true) {
  $('story-stop').textContent = `Stop ${String(current+1).padStart(2,'0')} / 06`;
  $('stamp').textContent = String(current+1).padStart(2,'0');
  $('story-title').textContent = stages[current].title;
  $('story-kicker').textContent = captions[current];
  $('story-copy').textContent = stages[current][lens];
  $('story-contribution').textContent = stages[current].contribution;
  if(animate && !reduceMotion.matches) {
    $('story-body').classList.remove('story-enter');
    void $('story-body').offsetWidth;
    $('story-body').classList.add('story-enter');
  }
}
function selectStop(index,animate=true) {
  current = Math.max(0,Math.min(5,Number(index)));
  stops.forEach((stop,i)=>{
    stop.classList.toggle('selected',i===current);
    stop.setAttribute('aria-pressed',String(i===current));
  });
  document.documentElement.style.setProperty('--active',colours[current]);
  document.documentElement.style.setProperty('--tint',tints[current]);
  traveller.setAttribute('aria-valuenow',String(current+1));
  traveller.setAttribute('aria-valuetext',`Stop ${current+1}: ${stages[current].title}`);
  $('route-slider').value = current;
  $('route-slider').setAttribute('aria-valuetext',stages[current].title);
  $('progress-label').textContent = `Stop ${current+1} of 6`;
  $('previous').disabled = current===0;
  $('next').disabled = current===5;
  refreshStory(animate);
  moveMarker(stopLengths[current],animate);
  if(current===5 && playing) pauseRoute();
}
function pauseRoute() {
  clearTimeout(playTimer);
  playing = false;
  $('play').setAttribute('aria-pressed','false');
  $('play-symbol').textContent = '▶';
  $('play-text').textContent = current===5 ? 'Follow it again' : 'Follow the route';
}
function scheduleNext() {
  playTimer = setTimeout(()=>{
    if(!playing || document.hidden) { pauseRoute(); return; }
    selectStop(current+1);
    if(playing) scheduleNext();
  },6200);
}
function playRoute() {
  if(playing) { pauseRoute(); return; }
  if(current===5) selectStop(0,false);
  playing = true;
  $('play').setAttribute('aria-pressed','true');
  $('play-symbol').textContent = 'Ⅱ';
  $('play-text').textContent = 'Pause here';
  scheduleNext();
}
function manualSelect(index,animate=true) {
  pauseRoute();
  selectStop(index,animate);
}
stops.forEach((stop,i)=>stop.addEventListener('click',()=>manualSelect(i)));
perspectives.forEach(button=>button.addEventListener('click',()=>{
  pauseRoute();
  lens = button.dataset.lens;
  perspectives.forEach(item=>{
    item.classList.toggle('selected',item===button);
    item.setAttribute('aria-pressed',String(item===button));
  });
  refreshStory();
}));
$('previous').addEventListener('click',()=>manualSelect(current-1));
$('next').addEventListener('click',()=>manualSelect(current+1));
$('play').addEventListener('click',playRoute);
$('route-slider').addEventListener('input',event=>manualSelect(Number(event.target.value),false));
traveller.addEventListener('keydown',event=>{
  const directions = {ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1};
  if(event.key in directions) {event.preventDefault();manualSelect(current+directions[event.key]);}
  if(event.key==='Home') {event.preventDefault();manualSelect(0);}
  if(event.key==='End') {event.preventDefault();manualSelect(5);}
});
function dragMarker(event) {
  const matrix = svg.getScreenCTM();
  if(!matrix) return;
  const p = svg.createSVGPoint();p.x=event.clientX;p.y=event.clientY;
  const local = p.matrixTransform(matrix.inverse());
  drawMarker(nearestPathPoint(local.x,local.y).length);
}
traveller.addEventListener('pointerdown',event=>{
  if(event.button!==0) return;
  pauseRoute();cancelAnimationFrame(routeFrame);
  dragging=true;pointerId=event.pointerId;
  traveller.setPointerCapture(pointerId);
  traveller.classList.add('dragging');
});
traveller.addEventListener('pointermove',event=>{if(dragging && event.pointerId===pointerId)dragMarker(event);});
function releaseMarker(event) {
  if(!dragging || event.pointerId!==pointerId)return;
  dragging=false;
  traveller.classList.remove('dragging');
  if(traveller.hasPointerCapture(pointerId))traveller.releasePointerCapture(pointerId);
  pointerId=null;
  let index=0;
  for(let i=1;i<stopLengths.length;i++)if(Math.abs(stopLengths[i]-currentLength)<Math.abs(stopLengths[index]-currentLength))index=i;
  selectStop(index);
}
traveller.addEventListener('pointerup',releaseMarker);
traveller.addEventListener('pointercancel',releaseMarker);
compactMap.addEventListener('change',configureMap);
reduceMotion.addEventListener('change',()=>{pauseRoute();moveMarker(stopLengths[current],false);});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseRoute();});
$('story').addEventListener('pointerenter',()=>{if(playing)pauseRoute();});
$('story').addEventListener('focusin',()=>{if(playing)pauseRoute();});
if('IntersectionObserver' in window) {
  new IntersectionObserver(entries=>{if(!entries[0].isIntersecting && playing)pauseRoute();}).observe($('board'));
}

const impactCards=[...document.querySelectorAll('.impact-card')];
impactCards.forEach(card=>card.addEventListener('click',()=>{
  impactCards.forEach(item=>{item.classList.toggle('selected',item===card);item.setAttribute('aria-pressed',String(item===card));});
  $('impact-note').textContent=card.dataset.note;
}));

const tiles=[...document.querySelectorAll('.guide-tile')];
const offsets=[[-5,8,-8],[3,7,7],[5,-3,5],[-4,-2,-6]];
let changeFrame=0;
let changeStage=-1;
function setChange(value) {
  const v=Math.max(0,Math.min(100,Number(value))), remaining=1-v/100;
  $('change-slider').value=v;
  tiles.forEach((tile,i)=>{
    const [x,y,angle]=offsets[i];
    tile.style.transform=`translate(${x*remaining}%,${y*remaining}%) rotate(${angle*remaining}deg)`;
  });
  const phase=v<34 ? 0 : v<80 ? 1 : 2;
  if(phase!==changeStage) {
    changeStage=phase;
    $('change-label').textContent=['The starting point','Bringing the guidance together','A clearer shared system'][phase];
    $('change-story').textContent=[
      'Information and know-how could sit in different places, leaving new committees with recurring questions.',
      'Affiliation, training and practical resources became part of a more consistent approach to supporting committees.',
      'A clearer process, shared resources and common systems gave the next committee more to begin with.'
    ][phase];
    $('change-slider').setAttribute('aria-valuetext',['Guidance in separate places','Bringing the guidance together','A clearer shared system'][phase]);
  }
}
function animateChange(destination) {
  cancelAnimationFrame(changeFrame);
  if(reduceMotion.matches){setChange(destination);return;}
  const from=Number($('change-slider').value),start=performance.now();
  function frame(now){
    const p=Math.min(1,(now-start)/850),eased=1-Math.pow(1-p,3);
    setChange(from+(destination-from)*eased);
    if(p<1)changeFrame=requestAnimationFrame(frame);
  }
  changeFrame=requestAnimationFrame(frame);
}
$('change-slider').addEventListener('input',event=>{cancelAnimationFrame(changeFrame);setChange(event.target.value);});
$('change-reset').addEventListener('click',()=>animateChange(0));
$('change-bring').addEventListener('click',()=>animateChange(100));
configureMap();selectStop(0,false);setChange(0);
