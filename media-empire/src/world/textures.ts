import type Phaser from 'phaser';

// Transparent sprite import: restore edge RGB from the adjacent opaque foreground.
export function normaliseAtlasPixels(pixels:Uint8ClampedArray,width:number,height:number){
  const result=new Uint8ClampedArray(pixels);
  const matte=(i:number)=>pixels[i+3]>0&&pixels[i+3]<210&&
    ((pixels[i]>170&&pixels[i]>pixels[i+1]*1.8&&pixels[i]>pixels[i+2]*1.5)||
    (pixels[i+1]>170&&pixels[i+1]>pixels[i]*1.8&&pixels[i+1]>pixels[i+2]*1.8));
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const i=(y*width+x)*4;if(!matte(i))continue;
    let found=-1;
    for(let radius=1;radius<=5&&found<0;radius++){
      for(let dy=-radius;dy<=radius&&found<0;dy++)for(let dx=-radius;dx<=radius;dx++){
        if(x+dx<0||x+dx>=width||y+dy<0||y+dy>=height)continue;
        const j=((y+dy)*width+x+dx)*4;
        if(pixels[j+3]>220&&!matte(j)){found=j;break;}
      }
    }
    if(found<0)result[i+3]=0;
    else for(let channel=0;channel<3;channel++)result[i+channel]=pixels[found+channel];
  }
  return result;
}
export function prepareSpriteTexture(scene:Phaser.Scene,key:string){
  const source=scene.textures.get(key).getSourceImage();
  const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
  const context=canvas.getContext('2d',{willReadFrequently:true})!;
  context.drawImage(source as CanvasImageSource,0,0);
  const image=context.getImageData(0,0,canvas.width,canvas.height);
  image.data.set(normaliseAtlasPixels(image.data,canvas.width,canvas.height));context.putImageData(image,0,0);
  const scale=Math.min(1,1024/Math.max(canvas.width,canvas.height));
  const width=Math.round(canvas.width*scale),height=Math.round(canvas.height*scale);
  const filtered=document.createElement('canvas');
  filtered.width=2**Math.ceil(Math.log2(width));filtered.height=2**Math.ceil(Math.log2(height));
  const filteredContext=filtered.getContext('2d')!;
  filteredContext.imageSmoothingEnabled=true;filteredContext.imageSmoothingQuality='high';
  filteredContext.drawImage(canvas,0,0,width,height);
  scene.textures.remove(key);scene.textures.addCanvas(key,filtered);
  return {width,height};
}
