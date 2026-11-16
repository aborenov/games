import test from 'node:test';
import assert from 'node:assert/strict';
import { compileRoute, sampleJourney, advanceMotion, atlasFrames, hitBuilding } from '../src/world/motion.ts';
import { BELFORD } from '../src/world/belford.ts';

test('route motion is proportional to distance rather than number of control points', () => {
  const route = compileRoute({ points: [{ x:0,y:0 },{ x:.1,y:0 },{ x:1,y:0 }], seconds:10, offset:0, stops:[] },100,100);
  const a = sampleJourney(route,2), b=sampleJourney(route,4);
  assert.ok(Math.abs(a.x-20)<.1);
  assert.ok(Math.abs(b.x-40)<.1);
});
test('tram pauses at a stop then resumes forward without an endpoint reversal', () => {
  const route=compileRoute({ points:[{x:0,y:0},{x:1,y:0}],seconds:10,offset:0,stops:[{at:.5,seconds:2}] },100,100);
  assert.equal(sampleJourney(route,5.5).stopped,true);
  assert.equal(sampleJourney(route,6.5).x,50);
  assert.ok(sampleJourney(route,7.5).x>50);
  assert.ok(sampleJourney(route,11).x>50);
  assert.equal(sampleJourney(route,12).x,0);
});
test('disabled motion freezes world time, and returning from a suspended tab has no large jump', () => {
  assert.equal(advanceMotion(10,1000,false),10);
  assert.equal(advanceMotion(10,10000,true),10.1);
  assert.equal(advanceMotion(10,-1,true),10);
  let a=0,b=0;
  for(let i=0;i<60;i++)a=advanceMotion(a,1000/60,true);
  for(let i=0;i<30;i++)b=advanceMotion(b,1000/30,true);
  assert.ok(Math.abs(a-b)<1e-9);
});
test('odd atlas dimensions cover each pixel once without crossing cell boundaries', () => {
  const frames=atlasFrames(1774,887,4,2);
  assert.equal(frames.length,8);
  assert.equal(frames[0].x,0);
  assert.equal(frames[3].x+frames[3].width,1774);
  assert.equal(frames[4].y+frames[4].height,887);
  for(let row=0;row<2;row++)for(let col=0;col<3;col++)
    assert.equal(frames[row*4+col].x+frames[row*4+col].width,frames[row*4+col+1].x);
});
test('city data owns landmark hit regions and the separate background', () => {
  for(const [id,landmark] of Object.entries(BELFORD.landmarks)) assert.equal(hitBuilding(BELFORD,landmark.position),id);
  assert.equal(hitBuilding(BELFORD,{x:.5,y:.9}),null);
  assert.equal(BELFORD.background,'/assets/cities/belford/map.webp');
});

test('sprite import repairs translucent matte without changing opaque red bodywork', async () => {
  const {normaliseAtlasPixels}=await import('../src/world/textures.ts');
  const pixels=new Uint8ClampedArray([100,110,120,255,255,0,0,128,255,0,0,255]);
  const result=normaliseAtlasPixels(pixels,3,1);
  assert.deepEqual([...result.slice(0,4)],[100,110,120,255]);
  assert.deepEqual([...result.slice(4,8)],[100,110,120,128]);
  assert.deepEqual([...result.slice(8,12)],[255,0,0,255]);
});

test('configured pedestrian stops survive the return journey in both directions', async()=>{
 const {makeReturnJourney}=await import('../src/world/motion.ts');
 const original={points:[{x:0,y:0},{x:1,y:0}],seconds:10,offset:0,stops:[{at:.25,seconds:3}]};
 const returned=makeReturnJourney(original);
 assert.equal(returned.seconds,20);
 assert.ok(returned.stops.some(s=>s.at===.125&&s.seconds===3));
 assert.ok(returned.stops.some(s=>s.at===.875&&s.seconds===3));
 assert.equal(original.points.length,2);
});
