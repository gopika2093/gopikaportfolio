export function blocked(x,z,solids,padding=.58) {
 if(x< -26 || x>26 || z< -23 || z>23)return true;
 return solids.some(s=>Math.abs(x-s.x)<s.w/2+padding && Math.abs(z-s.z)<s.d/2+padding);
}
export function nearestWalkable(x,z,solids) {
 x=Math.max(-25,Math.min(25,Math.round(x)));z=Math.max(-22,Math.min(22,Math.round(z)));
 if(!blocked(x,z,solids))return {x,z};
 let best=null,distance=Infinity;
 for(let radius=1;radius<=12;radius++){
  for(let dx=-radius;dx<=radius;dx++)for(let dz=-radius;dz<=radius;dz++){
   if(Math.abs(dx)!==radius && Math.abs(dz)!==radius)continue;
   if(!blocked(x+dx,z+dz,solids)&&dx*dx+dz*dz<distance){best={x:x+dx,z:z+dz};distance=dx*dx+dz*dz;}
  }
  if(best)return best;
 }
 return null;
}
export function findCursorPath(from,to,solids){
 const path=findPath(from,to,solids);
 // Replanning must not send the avatar back to a rounded grid origin.
 // Join the next visible segment, checking the full line for collisions.
 for(let i=Math.min(4,path.length-1);i>0;i--){
  const next=path[i],samples=Math.ceil(Math.hypot(next.x-from.x,next.z-from.z)/.1);
  let clear=true;
  for(let step=1;step<=samples;step++){
   const t=step/samples;
   if(blocked(from.x+(next.x-from.x)*t,from.z+(next.z-from.z)*t,solids,.48)){clear=false;break;}
  }
  if(clear)return path.slice(i);
 }
 return path;
}
export function findPath(from,to,solids) {
 const start=nearestWalkable(from.x,from.z,solids),end=nearestWalkable(to.x,to.z,solids);
 if(!start||!end)return [];
 const key=p=>`${p.x},${p.z}`,heuristic=p=>Math.hypot(p.x-end.x,p.z-end.z);
 const open=[{...start,g:0,f:heuristic(start)}],scores=new Map([[key(start),0]]),parents=new Map(),closed=new Set();
 let iterations=0;
 while(open.length && iterations++<4000){
  open.sort((a,b)=>a.f-b.f);const p=open.shift(),pk=key(p);
  if(closed.has(pk))continue;
  if(p.x===end.x && p.z===end.z){
   const result=[{x:end.x,z:end.z}];let k=pk;
   while(parents.has(k)){const previous=parents.get(k);result.push({x:previous.x,z:previous.z});k=key(previous);}
   return result.reverse();
  }
  closed.add(pk);
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
   const q={x:p.x+dx,z:p.z+dz},qk=key(q);
   if(closed.has(qk)||blocked(q.x,q.z,solids))continue;
   if(dx&&dz&&(blocked(p.x+dx,p.z,solids)||blocked(p.x,p.z+dz,solids)))continue;
   const g=p.g+Math.hypot(dx,dz);
   if(g<(scores.get(qk)??Infinity)){scores.set(qk,g);parents.set(qk,p);open.push({...q,g,f:g+heuristic(q)});}
  }
 }
 return [];
}
