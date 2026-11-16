import type { BuildingId } from '../game/types';
import type { CityDefinition, Point, RouteDefinition } from './types';

interface Sample extends Point {distance:number}
export interface CompiledRoute {samples:Sample[];length:number;definition:RouteDefinition;cycle:number}
export interface Journey extends Point {angle:number;stopped:boolean;progress:number}
const distance=(a:Point,b:Point)=>Math.hypot(b.x-a.x,b.y-a.y);
const mix=(a:Point,b:Point,t:number):Point=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});

export function compileRoute(definition:RouteDefinition,width:number,height:number):CompiledRoute {
  if(definition.points.length<2 || definition.seconds<=0 || !Number.isFinite(definition.seconds))throw Error('Route requires two points and a positive duration.');
  const points=definition.points.map(p=>({x:p.x*width,y:p.y*height}));
  if(points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))throw Error('Route point must be finite.');
  const smooth:Point[]=[points[0]];
  for(let i=1;i<points.length-1;i++){
    const prev=points[i-1],p=points[i],next=points[i+1],before=distance(prev,p),after=distance(p,next);
    if(before<.01||after<.01)continue;
    const trim=Math.min(before,after)*.18,enter=mix(p,prev,trim/before),leave=mix(p,next,trim/after);
    smooth.push(enter);
    for(let j=1;j<=12;j++){
      const t=j/12,a=mix(enter,p,t),b=mix(p,leave,t);
      smooth.push(mix(a,b,t));
    }
  }
  smooth.push(points.at(-1)!);
  let length=0;
  const samples=smooth.map((p,i)=>{if(i)length+=distance(smooth[i-1],p);return {...p,distance:length};});
  if(length<=0)throw Error('Route must have a non-zero length.');
  const stops=[...definition.stops].sort((a,b)=>a.at-b.at);
  if(stops.some(s=>s.at<0||s.at>1||s.seconds<0||!Number.isFinite(s.seconds)))throw Error('Invalid route stop.');
  return {samples,length,definition:{...definition,stops},cycle:definition.seconds+stops.reduce((sum,s)=>sum+s.seconds,0)};
}
export function sampleJourney(route:CompiledRoute,elapsed:number):Journey {
  let clock=((elapsed+route.definition.offset)%route.cycle+route.cycle)%route.cycle;
  let previous=0,progress=0,stopped=false,found=false;
  for(const stop of route.definition.stops){
    const travel=(stop.at-previous)*route.definition.seconds;
    if(clock<travel){progress=previous+clock/route.definition.seconds;found=true;break;}
    clock-=travel;
    if(clock<stop.seconds){progress=stop.at;stopped=true;found=true;break;}
    clock-=stop.seconds;previous=stop.at;
  }
  if(!found)progress=Math.min(1,previous+clock/route.definition.seconds);
  const target=progress*route.length, samples=route.samples;
  let low=1,high=samples.length-1;
  while(low<high){const middle=(low+high)>>1;if(samples[middle].distance<target)low=middle+1;else high=middle;}
  const a=samples[low-1],b=samples[low],span=b.distance-a.distance;
  const p=mix(a,b,span>0?(target-a.distance)/span:0);
  return {...p,angle:Math.atan2(b.y-a.y,b.x-a.x),stopped,progress};
}
export const advanceMotion=(time:number,delta:number,enabled:boolean)=>enabled?time+Math.max(0,Math.min(Number.isFinite(delta)?delta:0,100))/1000:time;
export function atlasFrames(width:number,height:number,columns:number,rows:number){
  return Array.from({length:columns*rows},(_,i)=>{
    const col=i%columns,row=Math.floor(i/columns),x=Math.round(col*width/columns),y=Math.round(row*height/rows);
    return {x,y,width:Math.round((col+1)*width/columns)-x,height:Math.round((row+1)*height/rows)-y};
  });
}
export function hitBuilding(city:CityDefinition,p:Point):BuildingId|null {
  for(const id of ['bank','press','lot','market','newsroom'] as BuildingId[]){
    const b=city.landmarks[id].bounds;
    if(p.x>=b.left&&p.x<=b.right&&p.y>=b.top&&p.y<=b.bottom)return id;
  }
  return null;
}

export function makeReturnJourney(route:RouteDefinition):RouteDefinition {
  const stops=new Map<number,number>([[.5,1.8]]);
  for(const stop of route.stops)for(const at of [stop.at/2,1-stop.at/2])
    stops.set(at,Math.max(stops.get(at)??0,stop.seconds));
  return {...route,points:[...route.points,...route.points.slice(0,-1).reverse()],seconds:route.seconds*2,
    stops:[...stops].map(([at,seconds])=>({at,seconds})).sort((a,b)=>a.at-b.at)};
}
