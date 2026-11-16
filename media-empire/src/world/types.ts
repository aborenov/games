import type { BuildingId } from '../game/types';

export interface Point { x:number; y:number }
export interface Bounds { left:number; top:number; right:number; bottom:number }
export interface RouteDefinition { points:Point[]; seconds:number; offset:number; stops:{at:number;seconds:number}[] }
export interface CityPlace {
  id:string; title:string; kind:'government'|'industry'|'transport'|'trade'|'civic';
  position:Point; district:string; owner:string; role:string; media:string; advertising:string;
}
export interface CityDefinition {
  id:string; title:string; year:number; background:string;
  camera:{center:Point; zoom:number; minZoom:number; maxZoom:number};
  landmarks:Record<BuildingId,{position:Point;title:string;bounds:Bounds}>;
  places:CityPlace[];
  kiosk:Point;
  routes:{tram:RouteDefinition;boat:RouteDefinition;pedestrians:RouteDefinition[]};
  chimneys:{position:Point;requires?:'press';scale:number;offset:number}[];
}
