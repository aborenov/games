import Phaser from 'phaser';
import type { GameState } from '../game/types';
import type { CityDefinition } from './types';
import { advanceMotion, atlasFrames, compileRoute, makeReturnJourney, sampleJourney } from './motion';
import type { CompiledRoute } from './motion';
import { prepareSpriteTexture } from './textures';

export class CityActors {
  private clock=0;
  private kiosk:Phaser.GameObjects.Image;
  private boat:Phaser.GameObjects.Image;
  private tram:Phaser.GameObjects.Image;
  private tramGhost:Phaser.GameObjects.Image;
  private walkers:{sprite:Phaser.GameObjects.Image;route:CompiledRoute}[]=[];
  private smoke:Phaser.GameObjects.Image[][]=[];
  private tramRoute:CompiledRoute;
  private boatRoute:CompiledRoute;
  private facing=0;
  private facingSince=0;
  private previousFacing=0;
  private state:GameState;
  constructor(private scene:Phaser.Scene,private city:CityDefinition,private width:number,private height:number,state:GameState){
    this.state=state;
    const sizes=new Map(['tram','walker','boat','kiosk'].map(key=>[key,prepareSpriteTexture(scene,key)]));
    for(const [key,columns,rows] of [['tram',2,2],['walker',4,2]] as const){
      const source=sizes.get(key)!;
      atlasFrames(source.width,source.height,columns,rows).forEach((f,i)=>scene.textures.get(key).add('f'+i,0,f.x,f.y,f.width,f.height));
    }
    for(const key of ['boat','kiosk']){const size=sizes.get(key)!;scene.textures.get(key).add('content',0,0,0,size.width,size.height);}
    this.tramRoute=compileRoute(city.routes.tram,width,height);this.boatRoute=compileRoute(city.routes.boat,width,height);
    this.tram=scene.add.image(0,0,'tram','f0').setOrigin(.5,.84);
    this.tramGhost=scene.add.image(0,0,'tram','f0').setOrigin(.5,.84).setAlpha(0);
    this.tram.setDisplaySize(width*.046,width*.046);this.tramGhost.setDisplaySize(width*.046,width*.046);
    this.boat=scene.add.image(0,0,'boat','content').setOrigin(.5,.72);
    this.boat.setDisplaySize(width*.060,width*.060*this.boat.height/this.boat.width);
    this.kiosk=scene.add.image(width*city.kiosk.x,height*city.kiosk.y,'kiosk','content').setOrigin(.5,.88);
    this.kiosk.setDisplaySize(width*.046,width*.046);
    const metadata=scene.cache.json.get('walker-meta') as {frames:{origin:number[]}[]};
    city.routes.pedestrians.forEach((definition,i)=>{
      const route=compileRoute(makeReturnJourney(definition),width,height);
      const sprite=scene.add.image(0,0,'walker','f0').setOrigin(.5,.92);
      sprite.setDisplaySize(width*.010,width*.010);
      sprite.setData('pivots',metadata.frames.map(f=>f.origin));sprite.setData('offset',i*.37);
      this.walkers.push({sprite,route});
    });
    this.smoke=city.chimneys.map(()=>Array.from({length:4},()=>scene.add.image(0,0,'steam').setAlpha(0).setDepth(4000)));
    this.sync(state);this.update(0);
  }
  sync(state:GameState){
    const previous=this.state.city.kiosk.status;this.state=state;
    this.kiosk.setVisible(state.city.kiosk.status!=='locked').setAlpha(state.city.kiosk.status==='building'?.4:1);
    this.kiosk.setDepth(this.height*this.city.kiosk.y);
    if(!state.settings.motion)this.scene.tweens.killTweensOf(this.kiosk);
    if(previous==='building'&&state.city.kiosk.status==='open'&&state.settings.motion)
      this.scene.tweens.add({targets:this.kiosk,alpha:{from:.4,to:1},duration:600,ease:'Sine.Out'});
  }
  update(delta:number){
    this.clock=advanceMotion(this.clock,delta,this.state.settings.motion);
    const tram=sampleJourney(this.tramRoute,this.clock),boat=sampleJourney(this.boatRoute,this.clock);
    const facing=tram.angle>=0?(Math.cos(tram.angle)>=0?0:1):(Math.cos(tram.angle)<0?2:3);
    if(facing!==this.facing){this.previousFacing=this.facing;this.facing=facing;this.facingSince=this.clock;}
    const blend=Math.min(1,(this.clock-this.facingSince)/.16);
    for(const [sprite,frame,alpha] of [[this.tram,this.facing,blend],[this.tramGhost,this.previousFacing,1-blend]] as const){
      const angle=[Math.PI/6,Math.PI*5/6,-Math.PI*5/6,-Math.PI/6][frame];
      const rotation=Phaser.Math.Angle.Wrap(tram.angle-angle);
      sprite.setFrame('f'+frame).setPosition(tram.x,tram.y).setDepth(tram.y+1).setAlpha(alpha)
        .setRotation(Phaser.Math.Clamp(rotation,-.22,.22));
    }
    this.boat.setPosition(boat.x,boat.y).setDepth(boat.y).setRotation(boat.angle-.10);
    this.walkers.forEach(({sprite,route})=>{
      const point=sampleJourney(route,this.clock);
      const phase=point.stopped?0:Math.floor((this.clock+Number(sprite.getData('offset')))*6)%4;
      const frame=(point.angle>=0?0:4)+phase;
      const pivots=sprite.getData('pivots') as number[][];
      sprite.setFrame('f'+frame).setOrigin(pivots[frame][0],pivots[frame][1]).setFlipX(Math.cos(point.angle)<0)
        .setPosition(point.x,point.y).setDepth(point.y+2);
    });
    this.city.chimneys.forEach((chimney,index)=>this.smoke[index].forEach((puff,i)=>{
      const life=((this.clock+chimney.offset)/6+i/4)%1,size=this.width*(.006+life*.025)*chimney.scale;
      puff.setVisible(!chimney.requires||this.state.city.press.status==='open').setPosition(
        this.width*(chimney.position.x+life*.028),this.height*(chimney.position.y-life*.065))
        .setDisplaySize(size,size).setAlpha(Math.sin(life*Math.PI)*.24).setRotation(life*.25);
    }));
  }
}
