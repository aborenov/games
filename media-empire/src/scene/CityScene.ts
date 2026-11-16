import Phaser from 'phaser';
import type {BuildingId,GameState} from '../game/types';
import type {CityDefinition} from '../world/types';
import {CityActors} from '../world/actors';
import {hitBuilding} from '../world/motion';
export interface Transform {zoom:number;x:number;y:number;width:number;height:number;worldWidth:number;worldHeight:number}
export interface Callbacks {ready:()=>void;transform:(t:Transform)=>void;building:(id:BuildingId)=>void;place:(id:string)=>void;fail:(message:string)=>void}

export class CityScene extends Phaser.Scene {
  private worldWidth=1;
  private worldHeight=1;
  private baseZoom=1;
  private lastPointer:{x:number;y:number}|null=null;
  private moved=0;
  private pinchDistance=0;
  private lastTransform='';
  private actors:CityActors|null=null;
  constructor(private city:CityDefinition,private state:GameState,private callbacks:Callbacks){super({key:'CityWorld'});}
  preload(){
    this.load.image('world-map',this.city.background);
    for(const key of ['tram','walker','boat'])this.load.image(key,'/assets/actors/'+key+'.webp');
    this.load.json('walker-meta','/assets/actors/walker.json');
    for(const key of ['steam','kiosk'])this.load.image(key,'/assets/'+key+'.webp');
    this.load.on('loaderror',()=>this.callbacks.fail('Не удалось загрузить город. Проверьте соединение и обновите игру.'));
  }
  create(){
    if(!this.textures.exists('world-map'))return;
    const image=this.textures.get('world-map').getSourceImage();this.worldWidth=image.width;this.worldHeight=image.height;
    this.add.image(0,0,'world-map').setOrigin(0).setDepth(-1);
    this.actors=new CityActors(this,this.city,this.worldWidth,this.worldHeight,this.state);
    this.input.addPointer(1);
    this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{
      this.cameras.main.panEffect.reset();this.lastPointer={x:p.x,y:p.y};this.moved=0;this.pinchDistance=0;
    });
    this.input.on('pointermove',(p:Phaser.Input.Pointer)=>{
      const first=this.input.pointer1,second=this.input.pointer2;
      if(first?.isDown&&second?.isDown){
        const distance=Phaser.Math.Distance.Between(first.x,first.y,second.x,second.y);
        if(this.pinchDistance>0)this.zoom(this.cameras.main.zoom*distance/this.pinchDistance);
        this.pinchDistance=distance;this.moved=100;return;
      }
      if(!p.isDown||!this.lastPointer)return;
      const dx=p.x-this.lastPointer.x,dy=p.y-this.lastPointer.y;this.moved+=Math.abs(dx)+Math.abs(dy);
      this.cameras.main.scrollX-=dx/this.cameras.main.zoom;this.cameras.main.scrollY-=dy/this.cameras.main.zoom;
      this.lastPointer={x:p.x,y:p.y};this.clampCamera();this.reportTransform();
    });
    this.input.on('pointerup',(p:Phaser.Input.Pointer)=>{
      this.pinchDistance=0;
      if(this.moved<12){
        const point=this.cameras.main.getWorldPoint(p.x,p.y),nx=point.x/this.worldWidth,ny=point.y/this.worldHeight;
        const building=hitBuilding(this.city,{x:nx,y:ny});
        if(building)this.callbacks.building(building);
        else {
          const place=this.city.places.find(place=>Math.hypot((place.position.x-nx)*this.worldWidth,(place.position.y-ny)*this.worldHeight)<28/this.cameras.main.zoom);
          if(place)this.callbacks.place(place.id);
        }
      }
      this.lastPointer=null;
    });
    this.input.on('wheel',(_p:Phaser.Input.Pointer,_over:unknown,_dx:number,dy:number)=>this.zoom(this.cameras.main.zoom*(dy>0?.92:1.08)));
    this.scale.on('resize',()=>this.fit());this.fit();this.callbacks.ready();
  }
  private fit(){
    const camera=this.cameras.main;camera.panEffect.reset();camera.setViewport(0,0,this.scale.width,this.scale.height);
    this.baseZoom=Math.max(this.scale.width/this.worldWidth,this.scale.height/this.worldHeight);
    camera.setZoom(this.baseZoom*this.city.camera.zoom);
    camera.centerOn(this.worldWidth*this.city.camera.center.x,this.worldHeight*this.city.camera.center.y);
    this.clampCamera();this.reportTransform();
  }
  private clampCamera(){
    const c=this.cameras.main,viewWidth=c.width/c.zoom,viewHeight=c.height/c.zoom;
    const pivotX=(viewWidth-c.width)*c.originX,pivotY=(viewHeight-c.height)*c.originY;
    c.scrollX=Phaser.Math.Clamp(c.scrollX-pivotX,0,Math.max(0,this.worldWidth-viewWidth))+pivotX;
    c.scrollY=Phaser.Math.Clamp(c.scrollY-pivotY,0,Math.max(0,this.worldHeight-viewHeight))+pivotY;
  }
  private reportTransform(){
    const c=this.cameras.main,key=[c.zoom,c.scrollX,c.scrollY,c.width,c.height].join(',');
    if(key===this.lastTransform)return;this.lastTransform=key;
    this.callbacks.transform({zoom:c.zoom,x:c.scrollX-(c.width/c.zoom-c.width)*c.originX,y:c.scrollY-(c.height/c.zoom-c.height)*c.originY,width:c.width,height:c.height,worldWidth:this.worldWidth,worldHeight:this.worldHeight});
  }
  zoom(value:number){
    if(!this.cameras?.main)return;
    this.cameras.main.panEffect.reset();
    const c=this.cameras.main,center=c.getWorldPoint(c.width/2,c.height/2);
    c.setZoom(Phaser.Math.Clamp(value,this.baseZoom*this.city.camera.minZoom,this.baseZoom*this.city.camera.maxZoom));
    c.centerOn(center.x,center.y);this.clampCamera();this.reportTransform();
  }
  zoomBy(factor:number){if(this.cameras?.main)this.zoom(this.cameras.main.zoom*factor);}
  resetView(){if(this.cameras?.main)this.fit();}
  syncState(next:GameState){if(!next.settings.motion)this.cameras?.main?.panEffect.reset();this.state=next;this.actors?.sync(next);}
  focusPlace(id:string){
    const point=this.city.landmarks[id as BuildingId]?.position??this.city.places.find(p=>p.id===id)?.position;
    if(point){this.cameras.main.panEffect.reset();this.cameras.main.pan(point.x*this.worldWidth,point.y*this.worldHeight,this.state.settings.motion?550:0,'Sine.easeInOut',true);}
  }
  update(_time:number,delta:number){if(!this.actors)return;this.actors.update(delta);this.clampCamera();this.reportTransform();}
}
