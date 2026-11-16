// Run: node --import tsx docs/rebuild/simulation/strategies.mjs
// Pure simulation only. No localStorage, app store, network or file writes.
import assert from 'node:assert/strict';
import {initialGame, leadsFor, forecast, publicationBlock, reduceGame} from '../../../src/simulation/model.ts';
import {encodeSave, decodeSave} from '../../../src/simulation/persistence.ts';

function run(name,plan){
  let state=initialGame(),actions=0;
  const rows=[];
  const get=()=>state;
  const act=action=>{
    const result=reduceGame(state,action);
    assert.equal(result.error,undefined,`${name}, day ${state.day}, ${JSON.stringify(action)}`);
    state=result.state;actions++;
    assert.deepEqual(decodeSave(encodeSave(state)),state);
  };
  while(state.status==='playing'){
    plan({get,act});
    assert.equal(publicationBlock(state),null,`${name}: ${publicationBlock(state)}`);
    act({type:'publish'});
    const e=state.history.at(-1);
    rows.push({day:e.day,printed:e.printed,sold:e.sold,profit:e.profit,cash:state.cash,
      trust:state.trust,readers:state.readers,factory:state.world.factory,harbour:state.world.harbour});
  }
  return {name,actions,status:state.status,editions:state.history.length,cash:state.cash,
    trust:state.trust,readers:state.readers,verified:state.history.reduce((sum,e)=>sum+e.stories.filter(s=>s.verified).length,0),
    lossMakingIssues:state.history.filter(e=>e.profit<0).length,factions:state.factions,
    contracts:state.contracts.map(c=>({id:c.id,status:c.status,progress:c.progress,target:c.target})),rows};
}
function twoVerified({get,act}){
  for(const lead of leadsFor(get()).slice(0,2))act({type:'report',leadId:lead.id,depth:'verified'});
}
const baseline=run('two-verified',twoVerified);
const press=run('early-press',ctx=>{
  if(ctx.get().day===1)ctx.act({type:'upgrade',id:'press'});
  twoVerified(ctx);
});
const independent=run('independent',ctx=>{
  const {get,act}=ctx,day=get().day;
  if(day===1){act({type:'upgrade',id:'press'});act({type:'contract',id:'tram-corridor'});}
  if(day===2)act({type:'delivery',value:'subscription'}); // Avoid snow while factory commuters are absent.
  if(day===3)act({type:'delivery',value:'street'});
  if(day===5)act({type:'contract',id:'river-pages'});
  twoVerified(ctx); // Prints safety warnings, temporarily restricting the port and losing river payment.
});
const business=run('community-business',({get,act})=>{
  const day=get().day;
  if(day===1){act({type:'upgrade',id:'kiosk'});act({type:'contract',id:'factory-patron'});}
  if(day===2){act({type:'delivery',value:'kiosk'});act({type:'upgrade',id:'desk'});}
  if(day===4)act({type:'upgrade',id:'press'});
  if(day===5)act({type:'contract',id:'river-pages'});
  act({type:'print-run',value:day<4?3000:4000});
  const leads=leadsFor(get()).slice().sort((a,b)=>Number(!!a.critical)-Number(!!b.critical));
  for(const lead of leads.slice(0,2))act({type:'report',leadId:lead.id,depth:'verified'});
  if(day>=3)act({type:'report',leadId:leads[2].id,depth:'brief'});
});
const bad=run('rush-and-overprint',({get,act})=>{
  act({type:'price',value:.24});
  act({type:'report',leadId:leadsFor(get())[0].id,depth:'brief'});
  let printed=8000;
  while(printed>1000&&forecast({...get(),printed}).prepay>get().cash)printed-=500;
  act({type:'print-run',value:printed}); // Preserve liquidity when the original policy becomes unaffordable.
});
console.log(JSON.stringify({results:[baseline,press,independent,business,bad],pressNetBenefit:Math.round((press.cash-baseline.cash)*100)/100},null,2));
