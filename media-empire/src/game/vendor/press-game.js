/* Newspaper demand, sales and cash settlement. No DOM or persistent state. */
export default (() => {
  'use strict';
  const channels={
    street:{label:'Уличная продажа',description:'Без стартовой платы. Выигрывает при низкой цене и оживлённых улицах.',fee:0,unit:0},
    kiosk:{label:'Киоски',description:'Дороже в обслуживании. Увеличивают охват в дни ярмарок и наплыва пассажиров.',fee:52,unit:.006},
    subscription:{label:'Подписка',description:'Первые выпуски дороже доставлять. Постоянные читатели возвращаются, если их устраивают цена и качество.',fee:74,unit:.004}
  };
  const ads={
    standard:{label:'Обычная реклама',description:'Продажа мест разным рекламодателям по обычным ставкам.',weight:1,trust:0},
    local:{label:'Местные объявления',description:'Меньше денег за полосу, зато +2 к доверию читателей.',weight:.79,trust:2},
    exclusive:{label:'Эксклюзивный спонсор',description:'Выше ставка, если доверие от 55. Повторы снижают ставку и сильнее вредят доверию.',weight:1.48,trust:-2}
  };
  const news=[
    ['Город встречает новый век','Читатели обсуждают городские перемены. Торговцы ждут людей на улицах.',[0,6],1.05,1.02,1.00,1.00,1.00],
    ['Снегопад останавливает конку','Уличные продавцы в Белфорде доставят не больше 6 200 экземпляров. Киоски и доставка на дом работают без этого ограничения.',[0,4],.78,1.10,1.21,1.00,.98],
    ['Фабрики набирают людей','Работа, дороги и цены стали важнее городской хроники.',[1,2],1.00,1.17,1.06,1.00,1.00],
    ['Спор вокруг электростанции','Расследование может поднять спрос. Рекламодатели по-разному реагируют на публикацию.',[0,2],1.00,1.10,1.10,1.01,.94],
    ['Ярмарка у пристани','Пассажиры и гости города идут через киоски. Растёт спрос на торговые новости.',[1,3],1.03,1.28,1.00,.96,1.14],
    ['Покупатели сравнивают цены','Газеты конкурируют за семейный бюджет. Дорогой уличный выпуск сложнее продать.',[3,4],1.08,1.04,1.09,1.00,.96],
    ['Ремонт у вокзала','Часть киосков теряет поток. Спрос смещается к городским маршрутам и доставке.',[0,2],1.04,.84,1.17,1.02,.99],
    ['Рабочие обсуждают оплату','В приоритете зарплаты и семейные расходы. Ценовые предложения работают лучше.',[3,4],1.10,1.07,1.13,1.00,1.01],
    ['Бумага дорожает','Печатные расходы выше на 24%. Особенно дорого обходятся непроданные экземпляры.',[0,6],1.02,1.04,1.15,1.24,1.02],
    ['Большая городская выставка','У киосков больше покупателей, а рекламный рынок расширяется.',[1,5],1.05,1.26,1.06,1.02,1.19],
    ['Новый издатель на рынке','У читателей стало больше выбора. Особенно интересуют расследования и новости конкурентов.',[1,6],1.02,1.09,1.12,1.00,1.00],
    ['Горожане подводят итоги квартала','Читатели ищут объяснения городских решений и цены на ближайшие месяцы.',[2,3],1.04,1.16,1.09,1.03,1.05]
  ];
  const audience=[
    {id:'market',name:'Рыночный квартал',households:12600,elasticity:1.56,topics:[1,4,6],
      preferences:[.91,1.38,.36,.96],access:{street:1.18,kiosk:.83,subscription:.90}},
    {id:'station',name:'Вокзал и пристань',households:10600,elasticity:1.12,topics:[0,2,5,6],
      preferences:[1.22,1.00,.64,1.16],access:{street:1.00,kiosk:1.26,subscription:.90}},
    {id:'residential',name:'Жилые кварталы',households:6800,elasticity:.70,topics:[1,2,3,7],
      preferences:[1.00,.56,1.62,1.02],access:{street:.79,kiosk:.92,subscription:1.29}}
  ];
  const portAudience=[
    {id:'docks',name:'Доки и верфи',households:6900,elasticity:1.33,topics:[0,1,4,6],
      preferences:[1.35,.63],access:{street:1.12,kiosk:1.42,subscription:.62}},
    {id:'trade',name:'Торговые кварталы',households:5200,elasticity:.78,topics:[1,2,3,7],
      preferences:[.88,1.56],access:{street:.79,kiosk:1.28,subscription:1.03}},
    {id:'homes',name:'Дома моряков',households:5900,elasticity:1.51,topics:[0,3,4,5],
      preferences:[1.14,.65],access:{street:.90,kiosk:.61,subscription:1.52}}
  ];
  const portNews=[
    ['Первые рейсы нового века','Пассажиры и рабочие верфей покупают газеты у причалов.',[0,1,6],.96,1.22,1,1.05],
    ['Ветер закрывает внешние доки','Доставка на дом сохраняет читателей, а пассажирские киоски теряют поток.',[0,4],.82,.72,1.16,.91],
    ['На верфях открыли набор','Рабочие ищут новости о найме, мастерских и зарплате.',[1,2,4],1.14,1.15,1.04,1],
    ['Торговая палата обсуждает пошлины','В торговом квартале растёт спрос на деловые новости.',[1,2,7],.92,1.08,1.11,1.12],
    ['Пассажирская ярмарка','Посетители ярмарки поддерживают киоски и местных рекламодателей.',[0,3,6],1.12,1.29,.99,1.14],
    ['Судовладельцы меняют расписание','Читатели особенно ценят прогнозы торговли и изменения рейсов.',[1,2,7],.89,1.13,1.05,1.08],
    ['Верфи останавливают часть работ','После аварии движение у старого дока ограничено. Семьи чаще читают газету дома.',[0,1,4],.82,.77,1.22,.93],
    ['Портовые семьи обсуждают жильё','Подписка выигрывает там, где читатели ждут подробностей о ценах и жилье.',[0,3,4],.93,1.03,1.22,1],
    ['Открывается новый грузовой склад','Промышленная хроника привлекает читателей и торговые объявления.',[1,2,7],1.04,1.17,1.02,1.10],
    ['Ливень задерживает суда','Киоски теряют пассажиров. В жилых кварталах продолжается доставка.',[0,4,6],.77,.79,1.17,.95],
    ['Купцы договариваются о поставках','У торговых изданий появляется повод поднять цену.',[1,2,7],.95,1.12,1.05,1.13],
    ['Порт подводит итоги квартала','Аудитория ждёт сводку о работе верфей и городских расходах.',[0,2,3],1.01,1.14,1.10,1.08]
  ];
  const portRivalSeeds=[
    {id:'portnews',name:'Пристанские новости',price:.09,printed:6200,lastSales:4800,trust:66,cash:4300,active:true,action:'Портовая хроника и киоски'},
    {id:'dockledger',name:'Торговый бюллетень',price:.12,printed:3700,lastSales:3000,trust:73,cash:5400,active:true,action:'Грузовые сводки и объявления купцов'}
  ];
  const portAllocations=[0,1000,2500,4000,6000];
  const ids=Object.keys(channels);
  const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
  const pick=(options,key,defaultKey)=>Object.hasOwn(options,key)?options[key]:options[defaultKey];
  const change=(state,key,options,defaultKey)=>Object.hasOwn(options,state[key])?state[key]:defaultKey;
  const rand=(week,k)=>{const n=Math.sin(week*127.1+k*311.7+1900)*43758.5453;return n-Math.floor(n)};
  function bulletin(week){
    const [title,text,topics,...factors]=news[clamp(week-1,0,news.length-1)];
    return {title,text,topics,reach:ids.reduce((map,id,i)=>({...map,[id]:factors[i]}),{}),paper:factors[3],ads:factors[4]};
  }
  function portRivals(state){
    const saved=Array.isArray(state.portRivals)?state.portRivals:[];
    return portRivalSeeds.map(seed=>{
      const r=saved.find(candidate=>candidate?.id===seed.id);
      if(!r)return {...seed};
      const safe=(key,min,max)=>Number.isFinite(r[key])?clamp(r[key],min,max):seed[key];
      return {...seed,price:safe('price',.06,.20),printed:Math.round(safe('printed',0,14000)),
        trust:safe('trust',24,95),cash:safe('cash',-100000000,100000000),lastSales:Math.round(safe('lastSales',0,18000)),
        active:r.active!==false,action:typeof r.action==='string'?r.action.slice(0,150):seed.action};
    });
  }
  function portSubscribers(state){
    return Number.isFinite(state.portSubscribers)?clamp(Math.round(state.portSubscribers),0,2500):0;
  }
  function normalize(state){
    state.channel=change(state,'channel',channels,'street');
    state.adPlan=change(state,'adPlan',ads,'standard');
    state.subscribers=Number.isFinite(state.subscribers)?clamp(Math.round(state.subscribers),0,4600):0;
    state.investigation=state.investigation==='publish'||state.investigation==='hold'?state.investigation:null;
    state.portRivals=portRivals(state);
    state.portSubscribers=portSubscribers(state);
    return state;
  }
  function allocate(total,weights){
    if(total===0)return weights.map(()=>0);
    const sum=weights.reduce((a,b)=>a+b,0);
    const quotas=weights.map(w=>total*w/sum);
    const counts=quotas.map(Math.floor);
    const remaining=total-counts.reduce((a,b)=>a+b,0);
    quotas.map((n,i)=>[i,n-counts[i]]).sort((a,b)=>b[1]-a[1]).slice(0,remaining).forEach(([i])=>counts[i]++);
    return counts;
  }
  function forecastPort(state,{world,settled,adFit}){
    const {week,trust,price,printed,selected,lead}=state;
    const plan=world.port||{};
    const open=plan.open===true;
    const allocation=portAllocations.includes(plan.allocation)?plan.allocation:0;
    const shipment=open?Math.min(allocation,Math.floor(printed*.65)):0;
    const channelId=change(plan,'channel',channels,'kiosk'),channel=channels[channelId];
    const [title,text,topics,street,kiosk,subscription,adFactor]=portNews[clamp(week-1,0,portNews.length-1)];
    const current={title,text,topics,reach:{street,kiosk,subscription}};
    const rivals=portRivals(state),subscribers=portSubscribers(state);
    const localReach=(plan.reachFactor||1)*(lead===5?(plan.leisureFactor||1):1);
    const retention=clamp(.81+(trust-60)*.003-(price-.08)*1.55,.60,.94);
    const reserved=allocate(shipment&&channelId==='subscription'?Math.round(subscribers*retention):0,
      portAudience.map(d=>d.households*d.access.subscription));
    const extraDemand=portAudience.map((district,index)=>{
      const local=state.headlineEdit?.caseId==='dock'&&state.headlineEdit.week===week&&selected.includes(0);
      const pull=.75+.24*selected.filter(id=>district.topics.includes(id)).length/Math.max(1,selected.length)+
        (district.topics.includes(lead)?.11:0)+(topics.includes(lead)?.12:0)+(local?.19:0);
      const player=shipment?.56*(trust+43)*(.095/price)**district.elasticity*pull*current.reach[channelId]*
        district.access[channelId]*localReach*(settled?.96+rand(week,44)*.08:1):0;
      const competition=rivals.map((r,i)=>r.active?(r.trust+43)*(.095/r.price)**district.elasticity*district.preferences[i]:0);
      return allocate(district.households-reserved[index],[player,...competition,76]);
    });
    const renewalDemand=reserved.reduce((a,b)=>a+b,0), retailDemand=extraDemand.reduce((sum,row)=>sum+row[0],0);
    const demand=renewalDemand+retailDemand;
    const sold=Math.min(shipment,demand),renewals=Math.min(renewalDemand,sold);
    const delivery=allocate(renewals,reserved),retail=allocate(sold-renewals,extraDemand.map(row=>row[0]));
    const rivalSplits=rivals.map((r,i)=>{
      const weights=extraDemand.map(row=>row[i+1]);
      return allocate(Math.min(r.printed,weights.reduce((a,b)=>a+b,0)),weights);
    });
    const rivalSales=rivalSplits.map(row=>row.reduce((a,b)=>a+b,0));
    const districts=portAudience.map(({id,name,households},i)=>({
      id,name,households,demand:reserved[i]+extraDemand[i][0],sold:delivery[i]+retail[i],renewals:delivery[i],
      rivals:rivals.map((r,j)=>({id:r.id,name:r.name,sold:rivalSplits[j][i]}))
    }));
    const adBudget=Math.round(1450*adFactor*(settled?.96+rand(week,45)*.08:1));
    const [adRevenue,...adsByRival]=allocate(adBudget,[sold*(.78+trust/400)*adFit*(plan.adFactor||world.adFactor||1),
      ...rivalSales.map(value=>value*.85),3000]);
    const rivalStats=rivals.map((r,i)=>({...r,sold:rivalSales[i],adRevenue:adsByRival[i]}));
    const rank=shipment?1+rivalStats.filter(r=>r.active&&r.sold>=sold).length:null;
    const freight=shipment?36+Math.round(shipment*.014):0;
    const routeFee=shipment?(channelId==='subscription'&&subscribers>=600?39:channel.fee):0;
    const commission=Math.round(sold*channel.unit);
    const distribution=routeFee+freight+commission,ticket=Math.round(sold*price);
    const nextSubscribers=clamp(shipment&&channelId==='subscription'?renewals+Math.round((sold-renewals)*.13):Math.round(subscribers*.83),0,2500);
    return {open,allocation,shipment,sold,demand,households:18000,rank,channelId,current,districts,adBudget,
      rivals:rivalStats,freight,routeFee,commission,distribution,ticket,adRevenue,netRevenue:ticket+adRevenue-distribution,
      renewals,nextSubscribers};
  }
  function forecast(state,{baseCosts,trustPoints,world={},settled=false}){
    const {week,trust,price,printed,rivals,selected,lead}=state;
    const channel=pick(channels,state.channel,'street'), ad=pick(ads,state.adPlan,'standard');
    const channelId=change(state,'channel',channels,'street'), adId=change(state,'adPlan',ads,'standard');
    const current=bulletin(week), hot=current.topics.includes(lead);
    const dispatch=state.headlineEdit?.week===week&&state.headlineEdit.caseId&&selected.includes(0)?state.headlineEdit:null;
    const verified=lead===0&&state.headlineEdit?.week===week&&state.headlineEdit.verified===true;
    // Older drafts already changed trust when they entered the newsroom.
    const reportingTrust=dispatch?.settleTrust===true?(dispatch.verified?3:-2):0;
    const publishDocuments=week===4&&state.investigation==='publish';
    const subscribers=state.subscribers||0, retention=clamp(.82+(trust-60)*.004-(price-.09)*1.65,.62,.96);
    const renewals=channelId==='subscription'?Math.round(subscribers*retention):0;
    const quality=selected.reduce((sum,id)=>sum+(trustPoints[id]||0),0);
    const editorialPull=.86+quality*.035+(hot?.15:-.04)+(verified?.09:0)+(publishDocuments?.12:0);
    const priceFit=channelId==='street'?clamp(1.04+(.085-price)*2.3,.80,1.12):channelId==='kiosk'?1.04:clamp(.99+(.085-price)*.9,.88,1.04);
    const circulationShock=settled?.95+rand(week,12)*.10:1;
    const reserved=allocate(renewals,audience.map(segment=>segment.households*segment.access.subscription));
    const demandByDistrict=audience.map((segment,index)=>{
      const editorialMix=.86+.28*selected.filter(id=>segment.topics.includes(id)).length/Math.max(1,selected.length)+
        (segment.topics.includes(lead)?.10:0);
      const player=.83*Math.max(15,trust+43)*(.095/price)**segment.elasticity*editorialPull*editorialMix*priceFit*
        current.reach[channelId]*segment.access[channelId]*(world.reachFactor||1)*(lead===5?(world.leisureFactor||1):1)*circulationShock;
      const others=rivals.map((r,i)=>r.active?Math.max(15,r.trust+43)*(.095/r.price)**segment.elasticity*(segment.preferences[i]||.9):0);
      return allocate(segment.households-reserved[index],[player,...others,53]);
    });
    const extraDemand=demandByDistrict.map(d=>d[0]);
    const demand=renewals+extraDemand.reduce((a,b)=>a+b,0);
    const repeats=adId==='exclusive'?(state.history||[]).slice(-2).reverse().findIndex(issue=>issue.adPlan!=='exclusive'):-1;
    const previousExclusive=adId==='exclusive'?(repeats===-1?Math.min((state.history||[]).length,2):repeats):0;
    const adFit=adId==='exclusive'?Math.max(1.02,(trust<55?1.09:ad.weight)-previousExclusive*.13):ad.weight;
    const port=forecastPort(state,{world,settled,adFit});
    const localPrinted=printed-port.shipment;
    const routeCapacity=week===2&&channelId==='street'?6200:null;
    const sold=Math.min(localPrinted,demand,routeCapacity??localPrinted),fulfilled=Math.min(renewals,sold);
    const deliveryByDistrict=allocate(fulfilled,reserved);
    const retailByDistrict=allocate(sold-fulfilled,extraDemand);
    const rivalsByDistrict=rivals.map((r,i)=>{
      const weights=demandByDistrict.map(d=>d[i+1]);
      return allocate(Math.min(r.printed,weights.reduce((a,b)=>a+b,0)),weights);
    });
    const rivalSales=rivalsByDistrict.map(sales=>sales.reduce((a,b)=>a+b,0));
    const districts=audience.map(({id,name,households},i)=>({
      id,name,households,demand:reserved[i]+extraDemand[i],
      sold:deliveryByDistrict[i]+retailByDistrict[i],renewals:deliveryByDistrict[i],
      rivals:rivals.map((r,j)=>({id:r.id,name:r.name,sold:rivalsByDistrict[j][i]}))
    }));
    const ticket=Math.round(sold*price), adBudget=Math.round(2800*current.ads*(settled?.96+rand(week,2)*.08:1));
    const weights=[sold*(.83+trust/400)*adFit*(world.adFactor||1),...rivalSales.map(n=>n*.75),5300];
    const [grossAd,...rivalAds]=allocate(adBudget,weights);
    const lostAd=publishDocuments?(adId==='exclusive'?240:adId==='local'?35:110):0;
    const adRevenue=Math.max(0,grossAd-lostAd);
    const editorCost=selected.reduce((sum,i)=>sum+baseCosts[i]+i*week%9,0);
    const printCost=Math.round(printed*.036*current.paper*(world.printFactor||1));
    const overhead=Math.round(465*(world.overheadFactor||1)),interest=Math.round(state.loan*.009);
    const routeFee=channelId==='subscription'&&subscribers>=900?42:channel.fee;
    const commission=Math.round(sold*channel.unit),distribution=routeFee+commission;
    const expenses=printCost+editorCost+overhead+interest+distribution+port.distribution;
    const totalRouteFee=routeFee+port.routeFee+port.freight;
    const prepay=printCost+editorCost+totalRouteFee;
    const estimated=ticket+port.ticket+adRevenue+port.adRevenue-expenses;
    const newReaders=channelId==='subscription'?Math.round((sold-fulfilled)*clamp(.13+(trust-60)*.0016-(price-.08)*.8,.055,.2)):0;
    const nextSubscribers=clamp(channelId==='subscription'?fulfilled+newReaders:Math.round(subscribers*.83),0,4600);
    const trustDelta=clamp(Math.round((quality-5)/2)+(hot?1:0)+(verified?1:0)+reportingTrust+ad.trust-previousExclusive+
      (week===4?(publishDocuments?6:-3):0),-9,12);
    const rank=1+rivalSales.filter((n,i)=>rivals[i].active&&n>=sold).length;
    const belford={sold,demand,printed:localPrinted,rank,routeCapacity,districts,ticket,adBudget,adRevenue,distribution};
    return {sold:sold+port.sold,demand:demand+port.demand,rivalSales,rivalAds:rivalAds.slice(0,rivals.length),rank,
      adBudget:adBudget+(port.shipment?port.adBudget:0),adRevenue:adRevenue+port.adRevenue,ticket:ticket+port.ticket,editorCost,printCost,
      overhead,interest,expenses,estimated,prepay,distribution:distribution+port.distribution,commission:commission+port.commission,
      routeFee:totalRouteFee,lostAd:Math.min(grossAd,lostAd),hot,verified,previousExclusive,
      nextSubscribers,renewals:fulfilled,newReaders,trustDelta,reportingTrust,channelId,adId,share:sold/30000,quality,current,
      districts,belford,port};
  }
  function rivalMove(rival,index,week,sales,ad,market){
    const roll=rand(week,index+3),before=rival.price;
    const underPressure=sales<rival.printed*.70||market.rank===1&&index===1;
    const premium=index===2&&rival.trust>=70&&roll<.42;
    const cut=underPressure&&roll>.31;
    if(cut||premium)rival.price=clamp(Number((before+(cut?-.01:.01)).toFixed(2)),.06,.20);
    const costs=Math.round(rival.printed*.035*market.current.paper)+([400,385,315,340][index]||350);
    const profit=Math.round(sales*before)+ad-costs;
    rival.cash=Math.round(rival.cash+profit);
    rival.trust=clamp(rival.trust+(underPressure?-1:0)+(premium?2:0),24,95);
    rival.lastSales=sales;
    const action=cut?'Снижает цену следующего номера':premium?'Повышает цену и вкладывается в авторские материалы':underPressure?'Сокращает тираж следующего номера':'Удерживает цену и тираж';
    if(underPressure&&!cut)rival.printed=clamp(Math.round((sales*1.20+500)/100)*100,3500,13000);
    if(sales>=rival.printed*.97&&roll>.55)rival.printed=Math.min(13000,rival.printed+500);
    if(rival.cash<0){rival.active=false;rival.lastSales=0;}
    return {name:rival.name,sales,price:before,nextPrice:rival.price,profit,active:rival.active,action:rival.active?action:'Прекращает выпуск из-за долгов'};
  }
  function settlePort(state,market){
    const actions=[];
    state.portRivals=portRivals(state).map((r,i)=>{
      if(!r.active)return r;
      const result=rivalMove(r,i+4,state.week,market.port.rivals[i].sold,market.port.rivals[i].adRevenue,
        {rank:market.port.rank,current:{paper:market.current.paper}});
      r.action=result.action;
      actions.push(result);
      return r;
    });
    state.portSubscribers=market.port.nextSubscribers;
    return actions;
  }
  return {channels,ads,bulletin,normalize,forecast,rivalMove,rand,settlePort,portAllocations};
})();
