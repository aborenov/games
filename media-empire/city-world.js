/* MEDIA EMPIRE 0.7: cinematic city, objective-based campaign, persistent property and interactive camera. */
(() => {
  'use strict';
  const api=window.ME_BRIDGE;
  if(!api){console.error('MEDIA EMPIRE WORLD: core game bridge not found');return;}
  const core=()=>api.state();
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\"':'&quot;',"'":'&#39;'}[c]));
  const mon=n=>(Number(n)||0).toLocaleString('ru-RU',{maximumFractionDigits:0})+' $';
  const num=n=>(Number(n)||0).toLocaleString('ru-RU');
  const KEY='media-empire-world-v0.3';
  const YEARS=[1900,1925,1955,1985,2005,2025,2050,2080,2100];
  const CITIES={belford:{name:'Белфорд',desc:'Промышленный город и столица газетного рынка',households:30000,subtitle:'Старый центр · пристань · вокзал'},porthaven:{name:'Порт-Хейвен',desc:'Портовый город: торговля, фабрики и новые аудитории',households:18000,subtitle:'Морской порт · торговые кварталы · верфи'}};
  const BLD={
    newsroom:{name:'Городской вестник',type:'ours',city:'belford',x:430,y:440,w:140,d:78,h:145},
    hall:{name:'Мэрия Белфорда',type:'public',city:'belford',x:735,y:337,w:145,d:82,h:118},
    bank:{name:'Городской банк',type:'public',city:'belford',x:160,y:350,w:125,d:72,h:143},
    chrono:{name:'Городская хроника',type:'rival',city:'belford',x:1035,y:335,w:125,d:69,h:130},
    listok:{name:'Народный листок',type:'rival',city:'belford',x:236,y:637,w:129,d:72,h:101},
    courier:{name:'Деловой курьер',type:'rival',city:'belford',x:928,y:589,w:121,d:76,h:155},
    press:{name:'Городская типография',type:'business',city:'belford',x:566,y:674,w:151,d:75,h:84},
    market:{name:'Центральный рынок',type:'public',city:'belford',x:1058,y:705,w:110,d:65,h:55},
    homeA:{name:'Рабочий квартал',type:'residential',city:'belford',x:78,y:210,w:112,d:56,h:90},
    homeB:{name:'Доходный дом',type:'residential',city:'belford',x:575,y:228,w:114,d:61,h:120},
    homeC:{name:'Семейный квартал',type:'residential',city:'belford',x:730,y:694,w:102,d:58,h:67},
    portnews:{name:'Пристанские новости',type:'rival',city:'porthaven',x:920,y:368,w:130,d:70,h:119},
    porthall:{name:'Мэрия Порт-Хейвена',type:'public',city:'porthaven',x:748,y:338,w:142,d:85,h:117},
    portbank:{name:'Портовый банк',type:'public',city:'porthaven',x:184,y:342,w:133,d:74,h:135},
    shipyard:{name:'Портовые верфи',type:'business',city:'porthaven',x:495,y:582,w:161,d:92,h:91},
    phouseA:{name:'Дома моряков',type:'residential',city:'porthaven',x:80,y:230,w:112,d:57,h:75},
    phouseB:{name:'Торговые дома',type:'residential',city:'porthaven',x:1012,y:670,w:117,d:55,h:114},
    phouseC:{name:'Семейные улицы',type:'residential',city:'porthaven',x:388,y:332,w:114,d:58,h:81},
  };
  const LOTS={
    b1:{city:'belford',x:310,y:350,w:83,d:60,price:500},
    b2:{city:'belford',x:1110,y:526,w:90,d:61,price:820},
    b3:{city:'belford',x:770,y:530,w:88,d:58,price:1100},
    p1:{city:'porthaven',x:698,y:664,w:85,d:58,price:450},
    p2:{city:'porthaven',x:1160,y:524,w:86,d:56,price:760}
  };
  const TYPES={
    bureau:{name:'Редакционный филиал',cost:820,minYear:1900,time:1,desc:'Местная редакция: расширяет охват читателей и помогает собирать новости.',effect:'+8% к привлечению аудитории'},
    printing:{name:'Собственная типография',cost:1750,minYear:1900,time:2,desc:'Наши печатные машины уменьшают переменные расходы на каждый выпуск.',effect:'−19% к стоимости печати'},
    headquarters:{name:'Новая штаб-квартира',cost:2850,minYear:1900,time:3,desc:'Своя штаб-квартира объединяет редакции и снижает административные затраты.',effect:'−13% накладных расходов'},
    radio:{name:'Радиостудия',cost:2200,minYear:1925,time:2,desc:'Радио открывает новое направление компании, расширяет привлекательность рекламы.',effect:'+9% рекламной выручки'},
    tv:{name:'Телестудия',cost:3100,minYear:1955,time:3,desc:'Телевизионный павильон становится следующим этапом медиаимперии.',effect:'+13% рекламной выручки'},
    digital:{name:'Цифровая студия',cost:2250,minYear:2005,time:2,desc:'Веб-редакция, видеопроизводство и новые способы работы с аудиторией.',effect:'+11% к охвату читателей'}
  };
  const ERAS={
    1900:{title:'Век газет',transport:'Конка и паровой трамвай',house:'Доходные дома, кирпичные фабрики и деревянные улицы',paper:'Газеты, телеграф, плакаты',palette:['#9a9d86','#6f8175','#4e6258'],occupations:['типограф','фабричный рабочий','портниха','торговец','инженер','учитель'],interests:['рабочие места','цены на продукты','городские новости','условия труда','театр','жильё']},
    1925:{title:'Век радио',transport:'Трамваи и автомобили',house:'Кирпичные дома, первые многоэтажки и гаражи',paper:'Газеты, журналы, кино и радио',palette:['#9da48e','#788b7b','#566960'],occupations:['радиоинженер','водитель','магазинный служащий','врач','учитель','рабочий'],interests:['радиопередачи','кино','заработки','городская мода','жильё','музыка']},
    1955:{title:'Век телевидения',transport:'Автомобили и автобусы',house:'Пятиэтажные кварталы и современные офисные корпуса',paper:'Радио, телевидение, газеты',palette:['#929e90','#688c80','#55706d'],occupations:['механик','телеведущая','инженер','секретарь','врач','заводской мастер'],interests:['телевидение','автомобили','семейный отдых','образование','космос','город']},
    1985:{title:'Эпоха эфира',transport:'Метро, автобусы и личные автомобили',house:'Стеклянные высотки рядом с жилыми массивами',paper:'ТВ, радио, газеты, кабель',palette:['#889d95','#679394','#496f76'],occupations:['программист','бухгалтер','редактор','видеомонтажёр','продавец','учитель'],interests:['музыка','видеоигры','телесериалы','бизнес','спорт','технологии']},
    2005:{title:'Начало интернета',transport:'Автомобили и скоростной общественный транспорт',house:'Бизнес-центры, спальные районы, торговые комплексы',paper:'Сайты, ТВ, FM, печать',palette:['#8ca39a','#658e8d','#47676e'],occupations:['веб-разработчик','менеджер','дизайнер','учитель','врач','предприниматель'],interests:['интернет','мобильные телефоны','игры','спорт','недвижимость','работа']},
    2025:{title:'Платформы и стриминг',transport:'Электротранспорт, автобусы и городской рельс',house:'Смешанная застройка, стекло и обновлённые исторические дома',paper:'Социальные сети, видео, сайты, стриминг',palette:['#90a9a1','#648e91','#3a636d'],occupations:['блогер','разработчик','аналитик','курьер','предприниматель','учитель'],interests:['ИИ','новости','соцсети','игры','жильё','здоровье']},
    2050:{title:'Умный город',transport:'Автономный электротранспорт',house:'Зелёные башни, гибридные дома и объекты нового поколения',paper:'Иммерсивные медиа, платформы, персонализированный контент',palette:['#91b1a6','#60999a','#426e79'],occupations:['инженер ИИ','оператор роботов','исследователь','медиапродюсер','врач','архитектор'],interests:['климат','ИИ','роботы','образование','город','космос']},
    2080:{title:'Постцифровой мегаполис',transport:'Автоматизированные транспортные коридоры',house:'Многоуровневые башни с садами и адаптивными фасадами',paper:'Пространственные медиа, цифровые миры',palette:['#86aca6','#5e959d','#39707d'],occupations:['дизайнер миров','биоинженер','куратор ИИ','исследователь','оператор сети','педагог'],interests:['виртуальные миры','климат','роботы','путешествия','космос','общество']},
    2100:{title:'Медиа следующего века',transport:'Энергосберегающий автономный транспорт',house:'Модульные комплексы и высотные экосистемы',paper:'Персональные агентные медиа и глобальные миры',palette:['#92b9ac','#5fa3ad','#2d7186'],occupations:['архитектор симуляций','медиакуратор','инженер энергии','биодизайнер','исследователь','педагог'],interests:['будущее','межпланетные новости','новые открытия','климат','сообщества','виртуальные миры']}
  };
  const INCIDENTS=[
    {id:'fire',week:1,city:'belford',title:'Пожар на текстильной фабрике',where:'Фабричный квартал, южная улица',kind:'Пожар',lead:'Пожар на фабрике: что произошло на самом деле',icon:'🔥'},
    {id:'electric',week:4,city:'belford',title:'Отключение электростанции',where:'Энергетический квартал',kind:'Авария',lead:'Почему целый квартал остался без света',icon:'⚡'},
    {id:'dock',week:7,city:'porthaven',title:'Авария на портовых верфях',where:'Старый док, Порт-Хейвен',kind:'Происшествие',lead:'Авария в порту: версии и свидетельства',icon:'🚨'},
    {id:'flood',week:10,city:'belford',title:'Разлив реки у рабочего района',where:'Нижняя набережная',kind:'Наводнение',lead:'Большая вода угрожает домам на набережной',icon:'🌊'}
  ];

  // Mission deck: 12 newspaper issues are one complete playable chapter.
  // Future era choices remain a visual preview and do not silently advance the economy.
  const M6_DECK=[
    {id:'leader',title:'Битва за первую полосу',subtitle:'Стать самым читаемым изданием Белфорда',flavor:'Соперники уже поделили рынок. Заберите первое место честной конкуренцией.',bonus:['ownpress','verified'],crisis:'Пожар на текстильной фабрике'},
    {id:'reserve',title:'Газета для каждого',subtitle:'Создать финансово устойчивое издание',flavor:'Доступная газета должна не только нравиться городу, но и приносить деньги.',bonus:['readers','survey'],crisis:'Рост стоимости бумаги'},
    {id:'trust',title:'Голос города',subtitle:'Добиться высокого доверия аудитории',flavor:'Каждое расследование влияет на отношение людей и на будущие продажи.',bonus:['verified','profit'],crisis:'Политическое давление'},
    {id:'expansion',title:'Открыть второй город',subtitle:'Построить филиал в Порт-Хейвене',flavor:'Ваши репортёры выходят за пределы Белфорда. Освойте новый рынок.',bonus:['survey','readers'],crisis:'Конкуренция за рекламодателей'},
    {id:'printing',title:'Независимая типография',subtitle:'Печатать газету на собственном оборудовании',flavor:'Снизьте зависимость от подрядчиков и доживите до конца главы.',bonus:['reserve','verified'],crisis:'Забастовка печатников'}
  ];
  const m6mission=()=>M6_DECK[Math.abs(Number(world.missionRoll)||0)%M6_DECK.length];
  const m6clamp=(v)=>Math.max(0,Math.min(100,Math.round(v)));
  function m6metrics(){
    finalizeConstruction();const c=core(),issues=c.history?.length||0;
    const rivalSales=(c.rivals||[]).filter(r=>r.active!==false).map(r=>Number(r.lastSales)||0);
    const rivalsMax=Math.max(1,...rivalSales);
    const owned=Object.entries(world.lots).filter(([id,r])=>LOTS[id]&&r?.status==='complete');
    const print=owned.some(([,r])=>r.type==='printing');
    const port=owned.some(([id,r])=>LOTS[id].city==='porthaven');
    const verified=Object.values(world.caseNotes).filter(r=>r?.published&&r?.notes?.includes('witness')&&r?.notes?.includes('evidence')).length;
    const positive=(c.history||[]).filter(h=>h.profit>0).length;
    return {issues,sold:Number(c.readers)||0,cash:Number(c.cash)||0,trust:Number(c.trust)||0,rivalsMax,print,port,verified,positive,interviews:world.interviews.length,owned:owned.length,history:c.history||[],status:c.status};
  }
  function m6progress(id,m=m6metrics()){
    const both=(a,b)=>m6clamp(Math.min(a,b)*100);
    switch(id){
      case 'leader':return {title:'№1 по продажам',desc:'Обогнать лучшего конкурента после хотя бы трёх выпусков',value:`${num(m.sold)} / ${num(m.rivalsMax)} экз.`,percent:both(m.sold/Math.max(1,m.rivalsMax),m.issues/3),done:m.issues>=3&&m.sold>m.rivalsMax};
      case 'reserve':return {title:'Резерв компании',desc:'Не меньше 6 выпусков и 6 500 $ в кассе',value:`${mon(m.cash)} · ${m.issues}/6 вып.`,percent:both(m.cash/6500,m.issues/6),done:m.issues>=6&&m.cash>=6500};
      case 'trust':return {title:'Репутация и доверие',desc:'Доверие 75/100 после 6 выпусков',value:`${m.trust}/75 · ${m.issues}/6 вып.`,percent:both(m.trust/75,m.issues/6),done:m.issues>=6&&m.trust>=75};
      case 'expansion':return {title:'Филиал во втором городе',desc:'Постройте здание в Порт-Хейвене и выпустите 6 номеров',value:`${m.port?'Филиал есть':'Нет филиала'} · ${m.issues}/6 вып.`,percent:both(m.port?1:0,m.issues/6),done:m.port&&m.issues>=6};
      case 'printing':return {title:'Своя типография',desc:'Постройте собственную типографию и выпустите 8 номеров',value:`${m.print?'Построена':'Не построена'} · ${m.issues}/8 вып.`,percent:both(m.print?1:0,m.issues/8),done:m.print&&m.issues>=8};
      case 'ownpress':return {title:'Независимая печать',desc:'Построить свою типографию',value:m.print?'Есть типография':'Не построена',percent:m.print?100:0,done:m.print};
      case 'verified':return {title:'Проверенное расследование',desc:'Свидетель + осмотр места + публикация',value:`${m.verified}/1 репортаж`,percent:m6clamp(m.verified*100),done:m.verified>=1};
      case 'readers':return {title:'Широкая аудитория',desc:'Продать 6 500 экземпляров одного номера',value:`${num(m.sold)} / 6 500`,percent:m6clamp(m.sold/6500*100),done:m.sold>=6500};
      case 'survey':return {title:'Услышать жителей',desc:'Опросить хотя бы 4 семьи',value:`${m.interviews}/4 опроса`,percent:m6clamp(m.interviews/4*100),done:m.interviews>=4};
      case 'profit':return {title:'Прибыльные номера',desc:'Провести 4 выпуска с положительной прибылью',value:`${m.positive}/4 выпуска`,percent:m6clamp(m.positive/4*100),done:m.positive>=4};
      default:return {title:'Финансовая подушка',desc:'Иметь хотя бы 5 500 $',value:`${mon(m.cash)} / 5 500 $`,percent:m6clamp(m.cash/5500*100),done:m.cash>=5500};
    }
  }
  function m6status(){const m=m6metrics(),d=m6mission(),main=m6progress(d.id,m),bonus=d.bonus.map(id=>m6progress(id,m));
    return {deck:d,main,bonus,done:main.done,finished:m.issues>=12||m.status==='insolvent',issues:m.issues,bonusComplete:bonus.filter(x=>x.done).length};
  }
  function m6objectiveMarkup(o,primary=false){return `<article class="me6-objective ${primary?'me6-objective-main':''} ${o.done?'is-complete':''}"><div class="me6-objective-top"><span>${primary?'ОСНОВНАЯ ЦЕЛЬ':'ДОПОЛНИТЕЛЬНАЯ'}</span><b>${o.done?'✓ ВЫПОЛНЕНО':o.percent+'%'}</b></div><h3>${esc(o.title)}</h3><p>${esc(o.desc)}</p><div class="me6-track"><i style="width:${o.percent}%"></i></div><small>${esc(o.value)}</small></article>`;}
  function m6mini(){const {deck,main,issues,finished}=m6status();return `<section class="me6-goal-summary" aria-label="Цель главы"><div class="me6-goal-head"><span>ГЛАВА I · ГАЗЕТА</span><button data-mwa="missions">ЗАДАЧИ →</button></div><strong>${esc(deck.title)}</strong><div class="me6-goal-sub">${esc(main.title)}</div><div class="me6-track"><i style="width:${main.percent}%"></i></div><div class="me6-goal-foot"><span>${esc(main.value)}</span><b>${finished?(main.done?'ПОБЕДА':'ГЛАВА ЗАВЕРШЕНА'):`${issues} / 12 недель`}</b></div></section>`;}
  function missionScreen(){const {deck,main,bonus,done,finished,issues,bonusComplete}=m6status(),canReroll=issues===0;
    const outcome=finished?`<div class="me6-mission-result ${done?'won':'lost'}"><strong>${done?'МИССИЯ ВЫПОЛНЕНА':'ГЛАВА ЗАВЕРШЕНА'}</strong><span>${done?`Основная цель достигнута. Дополнительных задач: ${bonusComplete} из 2.`:'Основная цель не выполнена. Можно начать новую партию с другим набором целей.'}</span></div>`:'';
    return `<div class="mw-scene me6-mission-screen"><div class="mw-scenehead"><div><div class="mw-kicker">КАМПАНИЯ · ГЛАВА I · 1900</div><h1>Цели газетной эпохи</h1><p>Одна глава — двенадцать выпусков. После неё можно закончить партию или переиграть миссию. Следующие эпохи пока доступны как визуальный тест.</p></div><button class="mw-back" data-mwa="view" data-id="city">← На карту</button></div>
    <section class="me6-mission-banner"><div><span class="me6-banner-eyebrow">МИССИЯ ${String(world.missionRoll+1).padStart(2,'0')} / БЕЛФОРД 1900</span><h2>${esc(deck.title)}</h2><p>${esc(deck.flavor)}</p></div><div class="me6-dice-area"><button class="me6-dice" data-mwa="roll-mission" ${canReroll?'':'disabled'} title="Перебросить условия миссии до первого выпуска"><span aria-hidden="true">⚄</span> Перебросить цели</button><small>${canReroll?'Можно менять до первого выпуска':'Цели зафиксированы первым выпуском'}</small></div></section>
    ${outcome}<div class="me6-mission-columns"><div class="me6-mission-stack">${m6objectiveMarkup(main,true)}<div class="me6-mission-row">${bonus.map(x=>m6objectiveMarkup(x)).join('')}</div></div><aside class="me6-mission-sidebar"><div class="me6-overview"><span>ПРОГРЕСС ГЛАВЫ</span><strong>${issues}<small> / 12</small></strong><div class="me6-track"><i style="width:${m6clamp(issues/12*100)}%"></i></div><p>События на улицах, опросы жителей и инвестиции в здания учитываются в целях.</p></div><div class="me6-crisis"><span>ГОРОДСКОЕ ИСПЫТАНИЕ</span><strong>${esc(deck.crisis)}</strong><p>Следите за происшествиями и принимайте решения в редакции.</p><button data-mwa="news">Все события →</button></div><div class="me6-mission-actions"><button class="mw-button primary" data-mwa="desk">${issues===0?'Начать первый выпуск →':'Вернуться к выпуску →'}</button><button class="mw-button" data-mwa="property">Управлять недвижимостью</button></div></aside></div>
    <div class="mw-text-warning">Результаты рассчитываются из фактических продаж, бюджета и ваших действий. «Кубик» изменяет набор задач, но не переписывает показатели компании и не меняет город случайным образом.</div></div>`;
  }

  function defaultWorld(){return {version:3,motion:true,missionRoll:0,camera:{zoom:1,x:0,y:0},city:'belford',year:1900,view:'city',selected:'newsroom',room:'main',selectedLot:'b1',buildType:'bureau',lots:{},caseNotes:{},interviews:[],newsLog:[],visited:[],cashEvents:[],eraVisits:[1900],helpSeen:false};}
  function saved(){try{const x=JSON.parse(localStorage.getItem(KEY));if(x&&x.version===3&&typeof x.city==='string'&&x.lots&&typeof x.lots==='object')return {...defaultWorld(),...x,view:'city',selected:'newsroom'};}catch{}return defaultWorld();}
  let world=saved();
  const era=()=>ERAS[world.year]||ERAS[1900];
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(world));}catch{}}
  function ownedLot(id){return world.lots[id]||null;}
  function finalizeConstruction(){const week=core().week;let changed=false;for(const [lot,r] of Object.entries(world.lots)){if(r&&r.type&&r.status==='building'&&r.finishWeek<=week){r.status='complete';changed=true;world.newsLog.unshift(`Построено: ${TYPES[r.type].name} (${CITIES[LOTS[lot].city].name})`);}}if(changed){persist();}}
  function modifiers(){finalizeConstruction();const t=Object.values(world.lots).filter(x=>x&&x.status==='complete').map(x=>x.type);return {printFactor:Math.max(.5,1-t.filter(x=>x==='printing').length*.19),overheadFactor:Math.max(.6,1-t.filter(x=>x==='headquarters').length*.13),reachFactor:1+t.filter(x=>x==='bureau').length*.08+t.filter(x=>x==='digital').length*.11+Math.min(.06,world.interviews.length*.01),adFactor:1+t.filter(x=>x==='radio').length*.09+t.filter(x=>x==='tv').length*.13};}
  window.ME_WORLD={modifiers,year:()=>world.year};
  const tplt=(tag,cls,text)=>`<${tag} class="${cls}">${text}</${tag}>`;
  function syncBalance(){document.querySelectorAll('[data-me-balance]').forEach(x=>x.textContent=mon(core().cash));}
  function v7Icon(name){
    const d={
      city:'<path d="M3 21h18M5 21V9l5-4 5 4v12M15 21V6h5v15M8 12v2m0 3v1m4-6v2m6-5v2m0 3v2"/>',
      news:'<path d="M4 4h15v16H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm3 4h9M7 11h4M7 14h9M7 17h9M3 6v12"/>',
      goal:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
      bank:'<path d="M3 9 12 3l9 6M4 9h16M5 9v10m5-10v10m4-10v10m5-10v10M3 21h18"/>',
      home:'<path d="m3 11 9-8 9 8v10H3V11Zm7 10v-7h4v7"/>',
      land:'<path d="M3 6h18l-3 12H6L3 6Zm6 3v7m6-7v7m-6-3h6"/>',
      camera:'<path d="M4 4h5M4 4v5m16-5h-5m5 0v5M4 20h5m-5 0v-5m16 5h-5m5 0v-5"/>',
      report:'<path d="M7 3h10l4 4v14H7V3ZM17 3v5h4M10 12h8M10 16h8M3 8v13"/>',
      building:'<path d="M4 21V7l7-4 7 4v14M4 10h14M7 14h2m3 0h2m-7 4h2m3 0h2m5 3V11h3v10"/>',
      bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 8-3 9h18c0-1-3-2-3-9M10 21h4"/>',
      save:'<path d="M5 3h13l3 3v15H3V3Zm2 0v7h10V3M7 21v-8h10v8"/>',
      quill:'<path d="M3 21c0-8 6-14 17-18-1 10-7 16-17 18Zm0 0 10-11M9 16h7"/>',
      scroll:'<path d="M6 3h13v16a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Zm0 5h10M6 12h10M6 16h7"/>',
      spark:'<path d="m12 2 1.5 7.5L21 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z"/>',
      move:'<path d="m9 4 3-3 3 3m-3-3v22m-3-3 3 3 3-3M4 9l-3 3 3 3m-3-3h22m-3-3 3 3-3 3"/>',
      alert:'<path d="m12 3 10 18H2L12 3Zm0 6v5m0 4h.01"/>',
      arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
      wave:'<path d="M3 9q3-4 6 0t6 0t6 0M3 15q3-4 6 0t6 0t6 0"/>',
      gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.2 2.2m9.8 9.8 2.2 2.2M19.1 4.9l-2.2 2.2m-9.8 9.8-2.2 2.2"/>',
      time:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'
    };
    return `<svg aria-hidden="true" class="v7-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round">${d[name]||d.city}</svg>`;
  }
  function header(){
    const s=core(),n=activeIncidents().length;
    return `<header class="mw-top v7-top">
      <button class="v7-brand" data-mwa="view" data-id="city" aria-label="MEDIA EMPIRE — к карте"><span class="v7-brand-seal">${v7Icon('quill')}</span><span class="v7-brand-text">MEDIA <em>EMPIRE</em><small>ИСТОРИЯ МЕДИА</small></span></button>
      <div class="v7-head-sep"></div>
      <button class="v7-head-place" data-mwa="view" data-id="city">${v7Icon('city')}<span><b>${esc(CITIES[world.city].name)}</b><small>${world.year} год · ${esc(era().title)}</small></span></button>
      <button class="v7-top-chapter" data-mwa="missions" title="Цели миссии">${v7Icon('goal')}<span><small>ГЛАВА I / ПЕРВАЯ ГАЗЕТА</small><b>Неделя ${Math.min(s.week,12)} из 12</b></span></button>
      <div class="v7-top-metrics"><div class="v7-metric"><span>Касса</span><b data-me-balance>${mon(s.cash)}</b></div><div class="v7-metric v7-debt"><span>Кредит</span><b>${mon(s.loan)}</b></div><div class="v7-metric"><span>Доверие</span><b>${s.trust}<i>/100</i></b></div></div>
      <div class="v7-head-actions"><button class="v7-head-icon" data-mwa="save" title="Сохранить игру" aria-label="Сохранить игру">${v7Icon('save')}</button><button class="v7-head-icon ${n?'has-event':''}" data-mwa="news" title="Городские события" aria-label="События: ${n}">${v7Icon('bell')}${n?`<span class="v7-bubble">${n}</span>`:''}</button></div>
    </header>`;
  }
  function bottom(){
    const actions=[
      ['city','Город','view','city'],['news','Редакция','interior','newsroom'],['report','Выпуск','desk',''],['scroll','Газета','view','latest'],['land','Недвижимость','property',''],['goal','Миссии','missions','']
    ];
    return `<footer class="mw-bottom v7-bottom"><nav aria-label="Основное игровое меню">${actions.map(([ico,label,act,id])=>`<button class="v7-nav ${((label==='Город'&&world.view==='city')||(label==='Редакция'&&world.view==='interior'&&world.selected==='newsroom')||(label==='Газета'&&world.view==='latest')||(label==='Недвижимость'&&world.view==='property')||(label==='Миссии'&&world.view==='missions'))?'active':''} ${label==='Выпуск'?'v7-nav-cta':''}" data-mwa="${act}" ${id?`data-id="${id}"`:''} title="${label}">${v7Icon(ico)}<span>${label}</span></button>`).join('')}</nav><div class="v7-footer-status"><span class="v7-live-pulse"></span><span>Город живёт</span><b>${num(core().readers)} читателей</b></div></footer>`;
  }
  function activeIncidents(){return INCIDENTS.filter(i=>i.week<=core().week&&(!world.caseNotes[i.id]||!world.caseNotes[i.id].published));}
  function xSvg(p){return p.map(n=>Math.round(n)).join(',');}
  function coords(pts){return pts.map(xSvg).join(' ');}
  function isoBuilding(b){let {x,y,w=110,d=70,h=90}=b;const year=world.year;
    let height=h*(year>=2050?1.95:year>=1985?1.45:year>=1955?1.23:1);
    if(b.type==='residential')height=Math.min(215,height+(year>=1955?35:0));
    let roofCol=b.type==='ours'?'#9a6a3e':b.type==='public'?'#8b8675':b.type==='rival'?'#6f756a':'#887f67';
    let wall1=b.type==='ours'?'#876546':'#5c706b',wall2=b.type==='ours'?'#b09b70':'#9ba498';
    if(year>=1985){wall1=b.type==='ours'?'#476f7b':'#577a79';wall2=b.type==='ours'?'#7fa4a3':'#86a9a6';roofCol=b.type==='ours'?'#456d70':'#5c7972';}
    if(year>=2050){wall1=b.type==='ours'?'#306f73':'#397c77';wall2=b.type==='ours'?'#85d0b6':'#7ac0ac';roofCol='#578988';}
    const apex=[x,y-height],a1=[x+w,y-height-w*.27],a2=[x+w+d,y-height-w*.27+d*.36],a3=[x+d,y-height+d*.36];
    const base0=[x,y],base2=[a2[0],a2[1]+height],base3=[a3[0],a3[1]+height];
    const side1=`<polygon points="${coords([apex,a3,base3,base0])}" fill="${wall1}" stroke="#25342e" stroke-width="2"/>`;
    const side2=`<polygon points="${coords([a3,a2,base2,base3])}" fill="${wall2}" stroke="#293f38" stroke-width="2"/>`;
    const roof=`<polygon points="${coords([apex,a1,a2,a3])}" fill="${roofCol}" stroke="#24362e" stroke-width="3"/>`;
    let wins='';const nFloors=Math.min(10,Math.max(2,Math.ceil(height/27)));
    for(let floor=0;floor<nFloors;floor++)for(let col=0;col<3;col++){
      const at=.12+.29*col,wx=a3[0]+(a2[0]-a3[0])*at,wy=a3[1]+(a2[1]-a3[1])*at+((floor+.3)/nFloors)*height;
      const wid=Math.max(13,w*.13),hei=Math.min(18,height/nFloors*.55);
      wins+=`<path d="M${wx} ${wy}l${wid} ${(-wid*.27).toFixed(1)}v${hei}l${-wid} ${(wid*.27).toFixed(1)}z" fill="${year>=1985?'#a8dfdf':'#c9c4a1'}" stroke="#38554d" stroke-width="1.7" opacity=".9"/>`;
    }
    const frontDoor=`<path d="M${(a3[0]+w*.48).toFixed(1)} ${(a3[1]+height*.79).toFixed(1)}l18 -5v${(height*.21).toFixed(1)}l-18 5z" fill="#342e28" stroke="#d5bea0" stroke-width="2"/>`;
    const chimney=year<1955?`<path d="M${x+w*.6} ${y-height-w*.13}v-28l13 -4v28" stroke="#453c31" stroke-width="3" fill="#938477"/>`:year>=2050?`<path d="M${x+10} ${y-height+5}l28 -7l14 -17l12 6l-14 20" fill="#72c5a0" stroke="#244e45" stroke-width="2"/>`:'';
    const kid=b.id||'';
    const facX=a3[0]+w*.26,facY=a3[1]+height*.27;
    const eraTrim=year<1955?'#e0d1a5':year<2005?'#d0d6c4':'#b7e1d9';
    const classicalPillars=(kid.includes('bank')||kid.includes('hall'))?Array.from({length:4},(_,k)=>{
      const at=.12+k*.23,px=a3[0]+(a2[0]-a3[0])*at,py=a3[1]+(a2[1]-a3[1])*at;
      return `<path d="M${px.toFixed(1)} ${(py+height*.28).toFixed(1)}v${(height*.52).toFixed(1)}" stroke="${eraTrim}" stroke-width="${Math.max(5,w*.043).toFixed(1)}" opacity=".82"/><path d="M${(px-8).toFixed(1)} ${(py+height*.28).toFixed(1)}l16 -4M${(px-8).toFixed(1)} ${(py+height*.8).toFixed(1)}l16 -4" stroke="#efe1be" stroke-width="3"/>`;
    }).join(''):'';
    const clockTower=(kid==='hall'||kid==='porthall')?`<g><path d="M${(x+w*.52).toFixed(1)} ${(y-height-w*.18).toFixed(1)}v-57l33 -10v57" fill="#8b8c7c" stroke="#4e5c54" stroke-width="3"/><path d="M${x+w*.52-5} ${y-height-w*.18-58}l22 -24l21 12" fill="#5c655b" stroke="#34423a" stroke-width="3"/><circle cx="${(x+w*.52+16).toFixed(1)}" cy="${(y-height-w*.18-37).toFixed(1)}" r="13" fill="#e8dfc4" stroke="#47584d" stroke-width="3"/><path d="M${x+w*.52+16} ${y-height-w*.18-37}v-8m0 8l6 4" stroke="#2e3732" stroke-width="2"/></g>`:'';
    const industrial=(kid==='press'||kid==='shipyard')?`<g><path d="M${x+w*.35} ${y-height-25}v-90l21 -7v100M${x+w*.68} ${y-height-11}v-60l15 -5v70" fill="#877a64" stroke="#4e483c" stroke-width="3"/><g opacity=".25" fill="#d3d3c0"><circle cx="${x+w*.37}" cy="${y-height-150}" r="29"/><circle cx="${x+w*.45}" cy="${y-height-173}" r="21"/></g></g>`:'';
    const balcony=(b.type==='residential'&&year>=1955)?Array.from({length:3},(_,k)=>{const bx=a3[0]+(a2[0]-a3[0])*(.14+k*.27),by=a3[1]+(a2[1]-a3[1])*(.14+k*.27)+height*.63;return `<path d="M${bx} ${by}l25 -7l0 16l-25 7z" fill="#73968b" stroke="#3c6359" stroke-width="2"/><path d="M${bx} ${by}v-8m25 1v-8" stroke="#cde4d5" stroke-width="2"/>`;}).join(''):'';
    const greenRoof=year>=2050?`<g><ellipse cx="${x+w*.51}" cy="${y-height-w*.12}" rx="${w*.24}" ry="11" fill="#398b66"/><circle cx="${x+w*.35}" cy="${y-height-w*.18}" r="11" fill="#7dbc7a"/><circle cx="${x+w*.52}" cy="${y-height-w*.20}" r="14" fill="#5fa86e"/></g>`:'';
    const masthead=b.type==='ours'?`<g><path d="M${facX-10} ${facY+13}l${w*.48} ${-w*.13}v24l${-w*.48} ${w*.13}z" fill="#332c23" stroke="#dab77a" stroke-width="2"/><text x="${facX+11}" y="${facY+15}" font-size="${Math.max(9,w*.09)}" font-weight="900" fill="#f3d9aa" transform="rotate(-15 ${facX+11} ${facY+15})">ME</text></g>`:'';
    const awnings=(kid==='market'||kid==='press')?`<g><path d="M${a3[0]+14} ${a3[1]+height*.62}l57 -17l10 26l-59 16z" fill="#b98256" stroke="#f0c795" stroke-width="3"/><path d="M${a3[0]+42} ${a3[1]+height*.59}l12 26" stroke="#edcf9a" stroke-width="4"/></g>`:'';
    const idDetails=classicalPillars+clockTower+industrial+balcony+greenRoof+masthead+awnings;
    const isOwn=b.type==='ours';const name=b.label||b.name;const cap=name.length>18?12:14;
    const sx=x+(w+d)*.49,sy=Math.max(35,y-height-w*.2-41),pillWidth=Math.max(91,Math.min(270,name.length*cap*.59+22));
    const label=`<g><rect class="mw-labelbg" x="${sx-pillWidth/2}" y="${sy}" width="${pillWidth}" height="27" rx="3"/><text class="mw-buildinglabel" x="${sx}" y="${sy+18}">${esc(name.toUpperCase())}</text></g>`;
    const shadow=`<ellipse cx="${x+(w+d)*.55}" cy="${y+12}" rx="${(w+d)*.7}" ry="28" fill="#213d2d" opacity=".34"/>`;
    return `<g class="mw-building ${isOwn?'ours':''}" data-mwa="building" data-id="${esc(b.id)}" role="button" tabindex="0" aria-label="Войти: ${esc(name)}">${shadow}${side1}${side2}${wins}${frontDoor}${roof}${chimney}${idDetails}${label}</g>`;
  }
  function lotSvg(id,lot){const r=ownedLot(id);if(r&&r.status==='complete')return isoBuilding({id:'lot-'+id,name:TYPES[r.type]?.name||'Ваш объект',label:TYPES[r.type]?.name||'Наш объект',type:'ours',...lot,h:110});
    if(r&&r.status==='building')return `<g class="mw-building" data-mwa="lot" data-id="${id}" role="button" tabindex="0"><polygon points="${coords([[lot.x,lot.y],[lot.x+lot.w,lot.y-lot.w*.27],[lot.x+lot.w+lot.d,lot.y-lot.w*.27+lot.d*.36],[lot.x+lot.d,lot.y+lot.d*.36]])}" fill="#b2985b" stroke="#efdfa0" stroke-width="4" stroke-dasharray="13 6"/><path d="M${lot.x+30} ${lot.y-45}v-110l100 -35v9" stroke="#e8c78e" stroke-width="6" fill="none"/><text x="${lot.x+70}" y="${lot.y-64}" text-anchor="middle" font-size="17" font-weight="800" fill="#ffebbb">СТРОЙКА</text></g>`;
    return `<g class="mw-building" data-mwa="lot" data-id="${id}" role="button" tabindex="0" aria-label="Земельный участок ${id}"><polygon points="${coords([[lot.x,lot.y],[lot.x+lot.w,lot.y-lot.w*.27],[lot.x+lot.w+lot.d,lot.y-lot.w*.27+lot.d*.36],[lot.x+lot.d,lot.y+lot.d*.36]])}" fill="#c8b882" fill-opacity=".4" stroke="#fbe2a0" stroke-width="3" stroke-dasharray="9 6"/><text x="${lot.x+lot.w*.7}" y="${lot.y-43}" text-anchor="middle" font-size="12" fill="#fff4d7" font-weight="850">УЧАСТОК · ${mon(lot.price)}</text></g>`;
  }
  function trees(){return Array.from({length:50},(_,i)=>{const x=27+(i*157)%1290,y=100+(i*103)%690;return `<g opacity=".91"><ellipse cx="${x+8}" cy="${y+13}" rx="${15+i%4*2}" ry="6" fill="#284a36"/><path d="M${x} ${y+14}v-16" stroke="#584f40" stroke-width="5"/><circle cx="${x}" cy="${y}" r="${11+i%4*2}" fill="${i%3?'#577b60':'#6a8965'}" stroke="#9ab392" stroke-width="1.8"/></g>`;}).join('');}
  function cars(){const n=world.year<1925?2:world.year<1955?5:world.year<1985?9:14;return Array.from({length:n},(_,i)=>{const x=45+(i*83)%1300,y=454-x*.14+(i%2)*34;const color=world.year<1925?'#443f36':i%3===0?'#e0cc9d':'#4e6d76';return `<g transform="translate(${x} ${y})"><path d="M0 1l22 -7l17 8l-23 8z" fill="${color}" stroke="#293b39" stroke-width="2"/><path d="M12 -6l9 -7l12 4l5 11" stroke="#32423e" stroke-width="2" fill="#728989"/><circle cx="7" cy="8" r="3" fill="#222c2b"/><circle cx="32" cy="2" r="3" fill="#222c2b"/></g>`;}).join('');}
  function incidentMarker(i){const isPort=world.city==='porthaven';const x=isPort?588:824,y=isPort?527:548;return `<g data-mwa="incident" data-id="${i.id}" class="mw-hotspot" tabindex="0" role="button" aria-label="ЧП: ${esc(i.title)}"><circle class="mw-pulse" cx="${x}" cy="${y}" r="37" fill="#fc6d40" opacity=".55"/><circle cx="${x}" cy="${y}" r="21" fill="#802d26" stroke="#f4b099" stroke-width="3"/><text x="${x}" y="${y+7}" text-anchor="middle" font-size="23" font-weight="900" fill="#fff2d0">!</text><g><rect x="${x-122}" y="${y-79}" width="245" height="30" rx="3" fill="#722b26" stroke="#ffc18c"/><text x="${x}" y="${y-60}" fill="#fff6e9" font-size="14" font-weight="850" text-anchor="middle">ЧП · ${esc(i.kind.toUpperCase())}</text></g></g>`;}
  function mapSvg(){const port=world.city==='porthaven',colors=era().palette;
    const bounds=port?'M-15 608Q410 460 710 610T1340 545V860H-15Z':'M-15 655Q225 576 479 662T1340 590V850H-15Z';
    const roads='<g fill="none"><path d="M-40 423L1390 196M-50 492L1400 264M342 -30L1037 872" stroke="#465a52" stroke-width="83"/><path d="M-40 423L1390 196M-50 492L1400 264M342 -30L1037 872" stroke="#9d9d84" stroke-width="55"/><path d="M-40 423L1390 196M-50 492L1400 264M342 -30L1037 872" stroke="#d1c5a5" stroke-width="2" stroke-dasharray="11 17" opacity=".8"/></g>';
    const train=world.year<1955?'<g opacity=".8"><path d="M30 775L1220 -30" stroke="#4f544d" stroke-width="22"/><path d="M30 775L1220 -30" stroke="#e6d8bb" stroke-width="9" stroke-dasharray="8 17"/><path d="M30 775L1220 -30" stroke="#293f36" stroke-width="3"/></g>':'';
    const grids=Array.from({length:4},(_,r)=>Array.from({length:13},(_,c)=>{const x=(c*111+r*32)%1390,y=80+r*155+(c%3)*10;const collide=Object.values(BLD).some(b=>b.city===world.city&&Math.abs(b.x-x)<95&&Math.abs(b.y-y)<115)||Object.values(LOTS).some(l=>l.city===world.city&&Math.abs(l.x-x)<88&&Math.abs(l.y-y)<94);if(collide||c%5===2)return '';return isoBuilding({id:'ornament',name:'',x,y,w:49+(c%3)*6,d:30,h:29+((c+r)%4)*10,type:'background'}).replace(/<g class="mw-building[\s\S]*?<\/g>/,'');}).join('')).join('');
    const keyObjs=Object.entries(BLD).filter(([id,b])=>b.city===world.city).map(([id,b])=>({...b,id,label:b.type==='ours'?'ВАША РЕДАКЦИЯ':b.name}));
    const props=Object.entries(LOTS).filter(([id,l])=>l.city===world.city).map(([id,l])=>({id,...l}));
    const elems=[...keyObjs.map(b=>({y:b.y,html:isoBuilding(b)})),...props.map(l=>({y:l.y,html:lotSvg(l.id,l)}))].sort((a,b)=>a.y-b.y).map(x=>x.html).join('');
    const people=Array.from({length:18},(_,i)=>{const x=53+(i*139)%1250,y=510+(i*59)%225;return `<g opacity=".85"><ellipse cx="${x+3}" cy="${y+5}" rx="6" ry="3" fill="#2b4138"/><circle cx="${x}" cy="${y-7}" r="4" fill="#d4bb93"/><path d="M${x} ${y-2}v13m0 -8l-6 7m6-7l6 7m-6 5l-5 6m5-6l5 6" stroke="${i%2?'#423d39':'#465b58'}" stroke-width="3"/></g>`;}).join('');
    const incidents=activeIncidents().filter(i=>i.city===world.city).map(incidentMarker).join('');
    return `<svg viewBox="0 0 1320 820" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Игровой город ${esc(CITIES[world.city].name)}, жилые кварталы, редакции, банк, мэрия и участки"><defs><linearGradient id="mw-land" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${colors[0]}"/><stop offset=".55" stop-color="${colors[1]}"/><stop offset="1" stop-color="${colors[2]}"/></linearGradient><linearGradient id="mw-water" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#88a4a0"/><stop offset="1" stop-color="#3c6670"/></linearGradient><pattern id="mw-pavers" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M0 30L30 0" stroke="#e5dabc" stroke-opacity=".065"/><circle cx="15" cy="15" r="1" fill="#f3e8c8" opacity=".16"/></pattern></defs><rect width="1320" height="820" fill="url(#mw-land)"/><rect width="1320" height="820" fill="url(#mw-pavers)"/><path d="${bounds}" fill="url(#mw-water)" stroke="#c0c9a4" stroke-width="17"/>${roads}${train}<g opacity=".72">${trees()}</g>${cars()}${people}${elems}${incidents}<path d="M5 810h1310" stroke="#1f342f" stroke-width="10"/></svg>`;
  }
  function buildingInfo(id){if(id.startsWith('lot-')){const key=id.slice(4),r=world.lots[key];if(r?.status==='complete'&&LOTS[key])return {name:TYPES[r.type]?.name||'Объект компании',type:'ours',city:LOTS[key].city,lotKey:key,buildingType:r.type};return null;}const b=BLD[id];return b||{name:'Городской объект',type:'public',city:world.city};}
  // Image-backed city art is a *game scene*, not a screenshot as a substitute for the game.
  // The interactive click zones below are separate DOM elements connected to real gameplay actions.
  const MAP_HOTSPOTS={
    belford:[
      {id:'newsroom',name:'Наша редакция',icon:'✒',x:45.0,y:30.0,w:29.0,h:31.0,kind:'ours'},
      {id:'bank',name:'Городской банк',icon:'₽',x:15.0,y:22.0,w:20.8,h:30.0,kind:'public'},
      {id:'hall',name:'Мэрия Белфорда',icon:'♜',x:34.0,y:6.0,w:25.0,h:28.0,kind:'public'},
      {id:'chrono',name:'Редакция конкурента',icon:'▥',x:9.0,y:48.0,w:25.0,h:26.0,kind:'rival'},
      {id:'press',name:'Типография',icon:'⚙',x:75.0,y:25.0,w:25.0,h:32.0,kind:'business'},
      {id:'homeA',name:'Жилой квартал',icon:'⌂',x:1.5,y:68.0,w:35.0,h:29.5,kind:'residential'},
      {id:'homeB',name:'Доходные дома',icon:'⌂',x:5.0,y:12.0,w:14.0,h:21.0,kind:'residential'},
      {id:'homeC',name:'Семьи у сквера',icon:'⌂',x:69.0,y:75.0,w:18.0,h:23.0,kind:'residential'},
      {id:'market',name:'Центральный рынок',icon:'⌂',x:56.0,y:65.0,w:22.0,h:20.0,kind:'public'},
      {id:'listok',name:'«Народный листок»',icon:'▥',x:0.5,y:46.0,w:13.0,h:18.0,kind:'rival'},
      {id:'courier',name:'«Деловой курьер»',icon:'▥',x:77.0,y:52.0,w:14.0,h:18.0,kind:'rival'},
    ],
    porthaven:[
      {id:'portnews',name:'Пристанские новости',icon:'▥',x:74.0,y:45.0,w:24.0,h:24.0,kind:'rival'},
      {id:'portbank',name:'Портовый банк',icon:'₽',x:1.0,y:30.0,w:23.0,h:21.0,kind:'public'},
      {id:'porthall',name:'Мэрия Порт-Хейвена',icon:'♜',x:53.0,y:27.0,w:27.0,h:29.0,kind:'public'},
      {id:'shipyard',name:'Портовые верфи',icon:'⚙',x:7.0,y:8.0,w:30.0,h:20.0,kind:'business'},
      {id:'phouseA',name:'Дома моряков',icon:'⌂',x:8.0,y:78.0,w:34.0,h:22.0,kind:'residential'},
      {id:'phouseB',name:'Торговые дома',icon:'⌂',x:43.0,y:62.0,w:20.0,h:24.0,kind:'residential'},
      {id:'phouseC',name:'Семейные улицы',icon:'⌂',x:8.0,y:51.0,w:23.0,h:20.0,kind:'residential'},
    ]
  };
  const MAP_PINS={belford:[{id:'b1',x:17,y:56},{id:'b2',x:82,y:80},{id:'b3',x:62,y:81}],porthaven:[{id:'p1',x:40,y:71},{id:'p2',x:91,y:73}]};
  // 0.5: real browser-rendered city ambience. The image remains a static painting;
  // vehicles, steam, boats and birds below are separate SVG animation layers.
  // They do not take pointer events from building and incident hotspots.
  function cityLife(){
    if(world.motion===false)return '';
    const port=world.city==='porthaven', year=world.year;
    const modern=year>=1955, electric=year>=2005;
    const puff=(x,y,scale=1,tone='#b5bcb5',seed=0)=>{
      const dots=Array.from({length:7},(_,i)=>{
        const begin=-(i*1.55+(seed%4)*.7);
        const duration=10.5+(i%3)*1.4;
        const size=(9+(i%3)*2.9)*scale;
        const drift=28+seed%4*7;
        return `<ellipse class="me5-puff" cx="0" cy="0" rx="${size.toFixed(1)}" ry="${(size*.72).toFixed(1)}" fill="${tone}" opacity="0" filter="url(#me5-haze)">
          <animate attributeName="cy" values="0;-${(64*scale).toFixed(1)};-${(143*scale).toFixed(1)}" dur="${duration}s" begin="${begin}s" repeatCount="indefinite"/>
          <animate attributeName="cx" values="0;${(drift*.55*scale).toFixed(1)};${(drift*scale).toFixed(1)}" dur="${duration}s" begin="${begin}s" repeatCount="indefinite"/>
          <animate attributeName="rx" values="${size*.65};${size*1.15};${size*1.9}" dur="${duration}s" begin="${begin}s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0;0.37;0.23;0" keyTimes="0;.12;.55;1" dur="${duration}s" begin="${begin}s" repeatCount="indefinite"/>
        </ellipse>`;
      }).join('');
      return `<g class="me5-chimney" transform="translate(${x} ${y})">${dots}</g>`;
    };
    const smoke=port
      ? (electric?[[785,90,.52,'#d5d8d3'],[1459,492,.58,'#d9e6e3']]:[[708,57,.64,'#9c9d98'],[792,47,.63,'#979b95'],[827,37,.72,'#b2b5ae'],[1450,459,.47,'#b6b6b0'],[1378,703,.31,'#c6c8c0']])
      : (electric?[[1469,257,.45,'#d6dfdb']]:[[1476,223,.64,'#9da19a'],[1504,239,.53,'#c0c0b8'],[1400,526,.26,'#d7d4c8']]);
    const stacks=smoke.map((p,i)=>puff(...p,i)).join('');
    const carriage=`<ellipse cx="-2" cy="10" rx="33" ry="5" fill="#172723" opacity=".33"/><path d="M-21 -4L15 -6L24 7L-15 9Z" fill="#59402d" stroke="#caa66e" stroke-width="2"/><path d="M-16 -12L12 -13L18 -5L-20 -3Z" fill="#98734b" stroke="#ead0a5" stroke-width="1.5"/><circle cx="-13" cy="9" r="5" fill="#191d1b" stroke="#b78f57" stroke-width="1.2"/><circle cx="18" cy="7" r="5" fill="#191d1b" stroke="#b78f57" stroke-width="1.2"/><path d="M28 0h17" stroke="#4f3022" stroke-width="2"/><path d="M48 -4q8 -8 13 0l6 10l-5 5l-7 -8l-5 6l-6 -1z" fill="#4b3224"/><circle cx="56" cy="-10" r="5" fill="#715240"/><path d="M66 8l3 8M52 8l-1 9" stroke="#35291f" stroke-width="2"/>`;
    const tram=`<ellipse cy="14" rx="40" ry="6" fill="#112c25" opacity=".35"/><path d="M-38 -12q0 -6 7 -6h62q8 0 8 7v20h-77z" fill="#6c362a" stroke="#f4d69f" stroke-width="2"/><path d="M-33 -7h65v12h-65z" fill="#e9c185"/><path d="M-30 -6v10M-13 -6v10M3 -6v10M20 -6v10" stroke="#423a31" stroke-width="2"/><path d="M-33 8h66" stroke="#e5a64e" stroke-width="4"/><path d="M-2 -18l2 -22m-12 2h22" stroke="#564835" stroke-width="1.5"/><circle cx="-25" cy="12" r="4" fill="#1b2927"/><circle cx="25" cy="12" r="4" fill="#1b2927"/><circle cx="34" cy="1" r="2" fill="#ffe9aa"/>`;
    const auto=`<ellipse cy="10" rx="29" ry="6" fill="#172825" opacity=".35"/><path d="M-27 0l7 -13q6 -4 25 -4l12 9l10 3v14h-54z" fill="${electric?'#c3d5c5':'#294e61'}" stroke="#d6c4a3" stroke-width="2"/><path d="M-13 -12h17l9 7h-29z" fill="#91b9b2" opacity=".9"/><path d="M-27 3h54" stroke="#a7b8a7" stroke-width="2"/><circle cx="-18" cy="9" r="6" fill="#26302e" stroke="#ad9e7a"/><circle cx="17" cy="9" r="6" fill="#26302e" stroke="#ad9e7a"/><circle cx="25" cy="-2" r="2" fill="#ffeab5"/>`;
    const tiny=(kind,path,dur,delay,scale=.75)=>`<g class="me5-moving-unit" opacity=".97"><g transform="scale(${scale})">${kind==='tram'?tram:kind==='carriage'?carriage:auto}</g><animateMotion dur="${dur}s" begin="-${delay}s" path="${path}" rotate="auto" repeatCount="indefinite"/></g>`;
    const traffic=port?
      (modern?[
        tiny('car','M 420 883 Q 535 799 700 750 T 1140 685 T 1630 750',26,6,.72),
        tiny('car','M 1550 865 C 1290 745 1170 716 1010 738 S 770 830 630 935',30,12,.67),
        tiny('tram','M 600 952 C 720 842 880 763 1040 740 S 1395 770 1570 826',35,17,.64)
       ]:[
        tiny('tram','M 540 905 C 630 825 715 805 850 779 S 1140 785 1590 895',29,5,.78),
        tiny('carriage','M 1570 880 Q 1370 816 1170 799 T 700 850',35,20,.63),
        tiny('carriage','M 105 864 Q 260 820 414 841 T 810 865',38,9,.58)
       ]) :
      (modern?[
        tiny('car','M -110 752 C 130 757 345 733 570 698 S 860 615 1080 581 S 1390 591 1650 636',28,10,.72),
        tiny('car','M 1590 780 C 1340 766 1110 664 955 675 S 630 790 430 890',36,22,.59),
        tiny('tram','M 1510 558 Q 1340 523 1120 576 T 740 687 T 270 810',39,12,.67)
       ]:[
        tiny('tram','M 1540 605 Q 1350 544 1170 567 T 800 651 T 425 779',31,12,.72),
        tiny('tram','M 520 864 Q 740 720 935 633 T 1350 571 T 1580 594',36,6,.62),
        tiny('carriage','M -125 735 C 160 726 320 743 485 725 S 733 678 855 648',37,19,.60)
       ]);
    const boat=port?`<g class="me5-boat"><path d="M-50 2l107 0l-14 18h-83z" fill="#2d3433" stroke="#d4be8e" stroke-width="2"/><rect x="-23" y="-21" width="41" height="22" rx="3" fill="#e0dac5" stroke="#625a45"/><rect x="-16" y="-15" width="8" height="8" fill="#66878d"/><rect x="-3" y="-15" width="8" height="8" fill="#66878d"/><path d="M5 -20v-19" stroke="#2f3a35" stroke-width="3"/><path d="M-45 21q20 8 40 0t40 0" fill="none" stroke="#ecf2df" stroke-width="2" opacity=".6"/><animateMotion path="M -150 247 C 90 236 295 214 600 157" dur="55s" begin="-17s" rotate="auto" repeatCount="indefinite"/></g>`:
      `<g class="me5-boat"><path d="M-33 0h66l-7 10h-53z" fill="#2e403d"/><rect x="-13" y="-18" width="26" height="19" fill="#e6d4b1"/><path d="M-26 12q21 5 49 0" stroke="#eaf4e5" stroke-width="2" fill="none"/><animateMotion path="M 995 62 Q 1185 56 1590 103" dur="50s" begin="-21s" rotate="auto" repeatCount="indefinite"/></g>`;
    const birds=`<g fill="none" stroke="#283f3b" stroke-width="2.5" stroke-linecap="round" opacity=".72"><path d="M0 0q9 -8 18 0q8 -8 16 0"/><path d="M35 17q7 -6 14 0q7 -6 14 0"/><animateMotion path="M 120 145 C 540 66 940 24 1540 110" dur="40s" begin="-16s" rotate="auto" repeatCount="indefinite"/></g>`;
    // Small human-scale movement; quiet enough to preserve legibility of the painting.
    const walkingFigure=(tint='#342d24')=>`<circle cx="0" cy="-7" r="3.1" fill="#c7ad8c"/><path d="M-3 -3L3 -3L4 9L-3 9Z" fill="${tint}" stroke="#1c211b" stroke-width=".85"/><path d="M-2 8l-2 7m6 -7l3 7m-8 -15l-4 7m10 -7l4 7" fill="none" stroke="#1f2522" stroke-width="1.7" stroke-linecap="round"><animate attributeName="d" values="M-2 8l-2 7m6 -7l3 7m-8 -15l-4 7m10 -7l4 7;M-2 8l3 7m2 -7l-2 7m-8 -15l-3 7m10 -7l-4 7;M-2 8l-2 7m6 -7l3 7m-8 -15l-4 7m10 -7l4 7" dur=".65s" repeatCount="indefinite"/></path>`;
    const walkers=(port?[
      ['M 790 707 Q 860 695 956 710 T 1110 746',37,7,.79,'#374a43'],
      ['M 385 746 Q 457 762 523 750 T 650 725',33,14,.68,'#584032'],
      ['M 1000 586 Q 1060 606 1145 620',28,9,.58,'#6c5135']
    ]:[
      ['M 845 735 Q 930 717 1010 727 T 1120 747',34,11,.81,'#354a43'],
      ['M 350 755 Q 430 779 520 745 T 710 708',39,18,.68,'#493a33'],
      ['M 1160 642 Q 1220 632 1290 657',29,6,.61,'#654e3c']
    ]).map(([path,duration,offset,size,tint])=>`<g class="me5-pedestrian"><g transform="scale(${size})">${walkingFigure(tint)}</g><animateMotion dur="${duration}s" begin="-${offset}s" path="${path}" rotate="auto" repeatCount="indefinite"/></g>`).join('');
    const water=port ? `<g class="me5-water" fill="none" stroke="#e5f3de" opacity=".22" stroke-linecap="round"><path d="M 65 178q58 -12 116 -6t102 -6M 350 145q65 -10 115 -2M 900 180q45 -8 97 -2" stroke-width="2.1" stroke-dasharray="24 42"/><path d="M 40 243q55 -9 112 -4M 500 164q40 -8 73 -2" stroke-width="1.4" stroke-dasharray="12 29"/></g>`:`<g class="me5-water" fill="none" stroke="#dcece0" opacity=".14" stroke-linecap="round"><path d="M 998 45q75 -9 136 -4M 1120 68q57 -4 115 0M 1380 81q51 -5 100 0" stroke-width="1.7" stroke-dasharray="18 35"/></g>`;
    const heat=activeIncidents().some(e=>e.city===world.city&&e.kind==='Пожар')?`<ellipse cx="${port?1350:1400}" cy="${port?560:626}" rx="35" ry="18" fill="#ff8a40" opacity=".12" filter="url(#me5-haze)"><animate attributeName="opacity" values=".08;.28;.09" dur="2.6s" repeatCount="indefinite"/></ellipse>`:'';
    return `<svg class="me5-citylife" viewBox="0 0 1536 864" preserveAspectRatio="none" aria-hidden="true" focusable="false"><defs><filter id="me5-haze" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.4"/></filter></defs>${water}<g class="me5-citylife-smoke">${stacks}</g><g class="me5-citylife-traffic">${traffic.join('')}</g><g class="me5-citylife-pedestrians">${walkers}</g><g class="me5-citylife-river">${boat}</g>${birds}${heat}</svg>`;
  }

  function me6parcel(p,record){
    const id=p.id,completed=record.status==='complete',progress=record.status==='building',land=record.status==='land';
    const t=TYPES[record.type],name=completed?(t?.name||'Объект компании'):progress?'ИДЁТ СТРОИТЕЛЬСТВО':'ЗЕМЛЯ КОМПАНИИ';
    const yscale=world.year>=2005?1.12:1;
    const base=`<ellipse cx="90" cy="143" rx="62" ry="17" fill="#071a16" opacity=".46"/><path d="M29 127L104 93L157 118L82 156Z" fill="#bbaa83" stroke="#1f322c" stroke-width="3"/>`;
    const structure=land?`<path d="M38 127l65 -31l45 24l-64 30Z" fill="#423e31" stroke="#f5d6a0" stroke-width="3" stroke-dasharray="5 4"/><path d="M50 124v-28m66 -5v-24m29 52v-29" stroke="#e3d0a2" stroke-width="4"/>`:
    progress?`<g class="me6-under-construction"><path d="M45 130V53L116 25L144 41V120L80 148Z" fill="#6e6251" opacity=".52" stroke="#efcc89" stroke-dasharray="6 5" stroke-width="3"/><path d="M45 65l100 -24M45 95l100 -25M45 125l100 -25M45 53l99 88M144 41L45 130" fill="none" stroke="#f0c27a" stroke-width="3"/><path d="M26 57V10L87 -13M26 12H150" fill="none" stroke="#ffd69c" stroke-width="5"/><path d="M92 12v34" stroke="#ffe0aa" stroke-width="2"/><path d="M82 49h18l-8 11z" fill="#e6b65d"/></g>`:
    `<g class="me6-owned-building" transform="translate(0,${world.year>=2005?-12:0}) scale(1,${yscale})"><path d="M47 137V61L113 33L145 55V121L80 149Z" fill="#ad8156" stroke="#292b29" stroke-width="3"/><path d="M47 61L113 33L145 55L79 84Z" fill="#3c5451" stroke="#d9c394" stroke-width="3"/><path d="M79 84V148L145 121V55" fill="#d0a978" stroke="#353e34" stroke-width="2"/><path d="M47 86L79 99M47 111L79 124M79 104l66 -28M79 128l66 -28" stroke="#e3c495" opacity=".35" stroke-width="3"/><path d="M53 80l12 5v13l-12 -5zM53 106l12 4v13l-12 -5zM86 94l18 -8v16l-18 8zM111 83l18 -9v17l-18 8zM86 120l18 -8v16l-18 7zM111 109l18 -8v16l-18 9z" fill="#496a71" stroke="#f1e4c6" stroke-width="2"/><path d="M68 146v-20l15 -5v24" fill="#4c392c" stroke="#e8c78e" stroke-width="2"/>${record.type==='printing'?`<rect x="119" y="13" width="17" height="43" fill="#936b4f" stroke="#f3d09b" stroke-width="2"/><g><circle cx="128" cy="8" r="10" fill="#e6dcd0" opacity=".4"><animate attributeName="cy" values="8;-26;-56" dur="6s" repeatCount="indefinite"/><animate attributeName="opacity" values=".4;.24;0" dur="6s" repeatCount="indefinite"/></circle></g>`:''}${record.type==='radio'||record.type==='tv'?`<path d="M116 30l12 -75m-17 19h37m-30 10h19" stroke="#e9d0a0" stroke-width="4" fill="none"/>`:''}${record.type==='digital'?`<path d="M79 84L145 55V121L79 148Z" fill="#79afb0" opacity=".34"/>`:''}${record.type==='headquarters'?`<path d="M96 39v-35m-11 8h22" stroke="#fbe1ad" stroke-width="4"/>`:''}</g>`;
    const label=completed?t.name:name;
    return `<button type="button" class="me6-parcel ${completed?'completed':progress?'constructing':'owned-land'}" style="left:${p.x}%;top:${p.y}%" data-mwa="${completed?'enter-owned':'lot'}" data-id="${esc(id)}" title="${esc(label)}" aria-label="${esc(label)}: ${esc(id.toUpperCase())}"><svg viewBox="0 0 180 170" aria-hidden="true" focusable="false">${base}${structure}</svg><span class="me6-parcel-caption">${esc(label)}</span></button>`;
  }

  const V7_LABELS={
    belford:[
      {id:'newsroom',name:'«Городской вестник»',short:'НАША РЕДАКЦИЯ',icon:'news',x:65.5,y:55.0,featured:true},
      {id:'hall',name:'Мэрия',short:'ГОРОДСКАЯ ВЛАСТЬ',icon:'bank',x:20.0,y:43.0},
      {id:'bank',name:'Банк',short:'КРЕДИТЫ',icon:'bank',x:70.0,y:29.0},
      {id:'chrono',name:'Конкуренты',short:'ДРУГИЕ ИЗДАТЕЛИ',icon:'report',x:33.0,y:48.0},
      {id:'press',name:'Типография',short:'ПЕЧАТЬ ГАЗЕТ',icon:'gear',x:91.0,y:33.0},
      {id:'homeA',name:'Жилые дома',short:'ЖИТЕЛИ',icon:'home',x:16.0,y:81.0,small:true},
      {id:'market',name:'Рынок',short:'ГОРОДСКОЙ РЫНОК',icon:'land',x:40.0,y:82.0,small:true},
      {id:'homeB',name:'Доходный дом',short:'ЖИТЕЛИ',icon:'home',x:48.0,y:58.0,small:true},
      {id:'listok',name:'«Народный листок»',short:'КОНКУРЕНТ',icon:'report',x:11.0,y:65.0,small:true},
      {id:'courier',name:'«Деловой курьер»',short:'КОНКУРЕНТ',icon:'report',x:90.0,y:80.0,small:true},
      {id:'homeC',name:'Семейный квартал',short:'ЖИТЕЛИ',icon:'home',x:30.0,y:89.0,small:true}
    ],
    porthaven:[
      {id:'portnews',name:'«Пристанские новости»',short:'КОНКУРЕНТ',icon:'news',x:81,y:77,featured:true},
      {id:'portbank',name:'Портовый банк',short:'ФИНАНСЫ',icon:'bank',x:29,y:63},
      {id:'porthall',name:'Мэрия',short:'ГОРОДСКАЯ ВЛАСТЬ',icon:'bank',x:71,y:45},
      {id:'shipyard',name:'Портовые верфи',short:'ПРОМЫШЛЕННОСТЬ',icon:'gear',x:30,y:25},
      {id:'phouseA',name:'Дома моряков',short:'ЖИТЕЛИ',icon:'home',x:39,y:88,small:true},
      {id:'phouseB',name:'Торговые дома',short:'ЖИТЕЛИ',icon:'home',x:85,y:81,small:true},
      {id:'phouseC',name:'Семейные улицы',short:'ЖИТЕЛИ',icon:'home',x:60,y:87,small:true}
    ]
  };
  function v7Traffic(){
    if(world.motion===false)return '';
    const port=world.city==='porthaven',modern=world.year>=1985;
    const tram=`<g transform="translate(-19,-7)"><rect x="0" y="0" width="43" height="16" rx="4" fill="${modern?'#e8edf0':'#9c452e'}" stroke="#281c18" stroke-width="1.5"/><path d="M6 2h6v8H6Zm12 0h6v8h-6Zm12 0h6v8h-6Z" fill="#a2cfce"/><path d="M3 13h36" stroke="#dfbd6e" stroke-width="2.5"/><path d="M18 0v-7l13-4" stroke="#463e30" stroke-width="1.5"/><circle cx="10" cy="16" r="3" fill="#161e20"/><circle cx="34" cy="16" r="3" fill="#161e20"/></g>`;
    const carriage=`<g transform="translate(-14,-5)"><path d="M2 2h25v9H2Z" rx="2" fill="${modern?'#5b7891':'#6e4333'}" stroke="#1a2624" stroke-width="1.4"/><path d="M6 1h10v-6h-10z" fill="#c6ddd4"/><circle cx="7" cy="12" r="4" fill="#222320" stroke="#d9c4a1"/><circle cx="23" cy="12" r="4" fill="#222320" stroke="#d9c4a1"/></g>`;
    const unit=(svg,dur,delay,path,opacity=1)=>`<g opacity="${opacity}">${svg}<animateMotion path="${path}" dur="${dur}s" begin="-${delay}s" rotate="auto" repeatCount="indefinite"/></g>`;
    const routes=port ? [
      unit(tram,26,6,'M 1230 562 C 980 550 780 605 410 535 S 120 610 -60 644',.85),
      unit(carriage,31,15,'M -60 650 C 225 589 441 555 660 596 S 1070 555 1380 550',.83)
    ] : [
      unit(tram,27,4,'M -50 535 C 190 500 350 446 520 463 S 860 547 1330 587',.9),
      unit(tram,34,17,'M 1370 588 C 1070 548 830 493 610 476 S 190 505 -60 543',.75),
      unit(carriage,38,23,'M -70 605 C 270 605 435 535 685 579 S 1000 608 1365 612',.85)
    ];
    const seagull=port?`<g stroke="#edf3ea" stroke-width="2" opacity=".58" fill="none"><path d="M0 0q9 -6 18 0q9 -6 18 0"/><animateMotion path="M -20 184C300 150 620 140 1260 207" dur="41s" repeatCount="indefinite"/></g>`:'';
    const smoke=world.year>=2005?'':(port?[[785,122],[887,134]]:[[1179,156],[1242,143]]).map(([x,y],i)=>`<g><ellipse cx="${x}" cy="${y}" rx="7" ry="5" fill="#e9e6dc" opacity=".3"><animate attributeName="cy" values="${y};${y-50};${y-96}" dur="${7+i*1.7}s" repeatCount="indefinite"/><animate attributeName="rx" values="6;14;26" dur="${7+i*1.7}s" repeatCount="indefinite"/><animate attributeName="opacity" values=".2;.15;0" dur="${7+i*1.7}s" repeatCount="indefinite"/></ellipse></g>`).join('');
    return `<svg class="v7-life" viewBox="0 0 1324 636" preserveAspectRatio="none" aria-hidden="true" focusable="false">${routes.join('')}${seagull}${smoke}</svg>`;
  }
  function artCity(){
    const port=world.city==='porthaven';const current=world.camera||{zoom:1,x:0,y:0};
    const bg=port?'assets/porthaven-clean-v07.jpg':'assets/belford-clean-v07.jpg',fallback=port?'assets/porthaven-1900.webp':'assets/belford-1900.webp';
    const pins=V7_LABELS[world.city].map(z=>`<button class="v7-pin ${z.featured?'featured':''} ${z.small?'mini':''}" data-mwa="building" data-id="${z.id}" style="left:${z.x}%;top:${z.y}%" aria-label="${esc(z.name)} — войти" title="${esc(z.name)}"><span class="v7-pin-icon">${v7Icon(z.icon)}</span><span class="v7-pin-label"><small>${esc(z.short)}</small><b>${esc(z.name)}</b></span></button>`).join('');
    const plots=MAP_PINS[world.city].map(p=>{const r=world.lots[p.id];return r?me6parcel(p,r):`<button class="v7-plot" style="left:${p.x}%;top:${p.y}%" data-mwa="lot" data-id="${p.id}" title="Купить участок ${p.id.toUpperCase()}">${v7Icon('land')}<span>Участок ${p.id.toUpperCase()}</span></button>`;}).join('');
    const incident=activeIncidents().filter(i=>i.city===world.city).map((e,i)=>`<button class="v7-incident-pin" style="left:${port?81:90}%;top:${port?57:78}%" data-mwa="incident" data-id="${e.id}" aria-label="Срочное событие: ${esc(e.title)}">${v7Icon('alert')}<span>ЧП</span></button>`).join('');
    return `<div class="me6-camera" style="transform:translate(${current.x||0}%,${current.y||0}%) scale(${current.zoom||1})"><div class="v7-city-image" role="group" aria-label="Игровая карта: ${esc(CITIES[world.city].name)}"><img src="${bg}" onerror="this.onerror=null;this.src='${fallback}'" alt="Исторический город с редакциями, банком, мэрией, парками и кварталами" draggable="false"/><div class="v7-art-vignette"></div>${v7Traffic()}${pins}${plots}${incident}</div></div>`;
  }
  function cityScreen(){
    finalizeConstruction();
    const c=CITIES[world.city],incidents=activeIncidents().filter(i=>i.city===world.city),event=incidents[0];
    const {deck,main,issues}=m6status();const holdings=Object.entries(world.lots).filter(([id,x])=>LOTS[id]?.city===world.city&&x.status==='complete').length+(world.city==='belford'?1:0);
    const free=Object.entries(LOTS).filter(([id,l])=>l.city===world.city&&!world.lots[id]).length;
    const competitors=Object.values(BLD).filter(b=>b.city===world.city&&b.type==='rival').length;
    const last=core().history.at(-1);
    return `<div class="v7-city"><div class="v7-game-scene me4-game-map">
      ${artCity()}
      <div class="v7-city-heading"><span class="v7-eyebrow"><span class="v7-dot"></span>ИГРОВОЙ МИР · ${esc(era().title.toUpperCase())}</span><h1>${esc(c.name)} <em>${world.year}</em></h1><p>${esc(c.desc)}</p><div class="v7-city-switch"><button class="${world.city==='belford'?'active':''}" data-mwa="city" data-id="belford">Белфорд</button><button class="${world.city==='porthaven'?'active':''}" data-mwa="city" data-id="porthaven">Порт-Хейвен</button><select data-mws="year" aria-label="Выбрать эпоху">${YEARS.map(y=>`<option value="${y}" ${y===world.year?'selected':''}>${y} · ${esc(ERAS[y].title)}</option>`).join('')}</select></div></div>
      <button class="v7-mission-peek" data-mwa="missions" aria-label="Открыть цели главы"><span class="v7-mission-upper"><span>${v7Icon('goal')} МИССИЯ · ${issues}/12</span><span>${main.percent}%</span></span><strong>${esc(deck.title)}</strong><small>${esc(main.title)}</small><span class="v7-mission-progress"><i style="width:${main.percent}%"></i></span><span class="v7-mission-more">Все цели ${v7Icon('arrow')}</span></button>
      <div class="v7-map-controls"><button data-mwa="camera-in" title="Приблизить город" aria-label="Приблизить">+</button><span>${Math.round((world.camera?.zoom||1)*100)}%</span><button data-mwa="camera-out" title="Отдалить город" aria-label="Отдалить">−</button><button data-mwa="camera-reset" title="Центрировать камеру" aria-label="Центрировать">${v7Icon('camera')}</button><button class="v7-motion-btn" data-mwa="motion" aria-pressed="${world.motion!==false}" title="Движение города">${v7Icon('wave')}<span>${world.motion!==false?'Живой город':'Без анимации'}</span></button></div>
      ${event?`<button class="v7-breaking" data-mwa="incident" data-id="${event.id}"><span class="v7-breaking-icon">${v7Icon('alert')}</span><span class="v7-breaking-copy"><small>СРОЧНО · ${esc(CITIES[event.city].name.toUpperCase())}</small><strong>${esc(event.title)}</strong></span><span class="v7-breaking-arrow">${v7Icon('arrow')}</span></button>`:`<button class="v7-breaking quiet" data-mwa="news"><span class="v7-breaking-icon">${v7Icon('news')}</span><span class="v7-breaking-copy"><small>ДЕЖУРНАЯ РЕДАКЦИЯ</small><strong>Новости и события города</strong></span><span class="v7-breaking-arrow">${v7Icon('arrow')}</span></button>`}
      <button class="v7-newsroom-shortcut" data-mwa="building" data-id="newsroom">${v7Icon('news')}<span><small>ВАША КОМПАНИЯ</small><strong>Войти в редакцию</strong></span>${v7Icon('arrow')}</button>
      <div class="v7-corner-note">Нажмите на здание, чтобы войти внутрь · Перетаскивайте карту мышью</div>
    </div><div class="v7-statusbar"><span>${v7Icon('home')} ${num(c.households)} домохозяйств</span><span>${v7Icon('building')} Наших зданий: <b>${holdings}</b></span><span>${v7Icon('land')} Участков: <b>${free}</b></span><span>${v7Icon('news')} Конкурентов: <b>${competitors}</b></span><button data-mwa="latest">${v7Icon('report')} ${last?`Последний номер №${last.week}`:'Первый выпуск ещё готовится'} ${v7Icon('arrow')}</button></div></div>`;
  }
  function floorsArt(id){const b=BLD[id]||{};const year=world.year,isNews=id==='newsroom'||id==='press',bank=id==='bank'||id==='portbank',hall=id==='hall'||id==='porthall',rival=b.type==='rival',house=b.type==='residential';
    const rooms=house?['Прихожая','Кухня','Гостиная','Комната']:bank?['Касса','Кредитный отдел','Кабинет управляющего','Архив']:hall?['Зал совета','Кабинет мэра','Земельный отдел','Архив решений']:isNews?['Редакционный зал','Кабинет главреда','Верстка','Фотоотдел']:rival?['Приёмная','Репортёры','Типографский стол','Дирекция']:['Основной цех','Администрация','Клиенты','Склад'];
    const chosen=world.room||'0';
    const seats=Array.from({length:8},(_,i)=>{const x=80+(i%4)*198,y=185+Math.floor(i/4)*207;return `<g><path d="M${x} ${y}l68 -30l77 35l-70 33z" fill="#7e6146" stroke="#342d28" stroke-width="3"/><path d="M${x} ${y}v28m75 7v26m70 -57v26" stroke="#54412e" stroke-width="6"/><path d="M${x+30} ${y-13}l30 -12l40 18l-30 13z" fill="${year<1985?'#e4d5b1':'#728e8a'}" stroke="#cab181" stroke-width="2"/></g>`;}).join('');
    const people=Array.from({length:8},(_,i)=>{const x=140+(i%4)*192,y=208+Math.floor(i/4)*211;return `<g><ellipse cx="${x+4}" cy="${y+11}" rx="13" ry="6" fill="#423629" opacity=".5"/><circle cx="${x}" cy="${y-21}" r="9" fill="#d2ab83"/><path d="M${x-9} ${y-11}l16 -5l11 27l-25 7z" fill="${i%2?'#485957':'#695849'}" stroke="#2c322d" stroke-width="2"/></g>`;}).join('');
    const floor=Array.from({length:18},(_,i)=>`<path d="M${i*59} 170L${i*59+290} 715" stroke="#f4ddb47e" stroke-width="2" opacity=".15"/>`).join('');
    const roomAreas=rooms.map((name,i)=>{const x=32+(i%2)*470,y=55+Math.floor(i/2)*296;return `<g class="mw-room ${chosen===String(i)?'active':''}" data-mwa="room" data-id="${i}" role="button" tabindex="0"><rect x="${x}" y="${y}" width="455" height="286" rx="3" fill="${chosen===String(i)?'#8b674b1f':'#ffffff08'}" stroke="${chosen===String(i)?'#f3d39d':'#d6c09c'}" stroke-width="${chosen===String(i)?4:2}" stroke-dasharray="${chosen===String(i)?'8 5':'none'}"/><rect class="mw-room-labelbg" x="${x+13}" y="${y+10}" width="${Math.min(414,name.length*13+32)}" height="32" rx="2"/><text class="mw-room-label" x="${x+26}" y="${y+33}">${esc(name.toUpperCase())}</text></g>`;}).join('');
    return `<svg viewBox="0 0 1000 665" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Интерьер ${esc(b.name||'здания')} со входом в комнаты"><defs><linearGradient id="mw-room-floor" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#907b5f"/><stop offset="1" stop-color="#4c4636"/></linearGradient></defs><rect width="1000" height="665" fill="#3a4038"/><path d="M0 116L1000 0v665H0" fill="url(#mw-room-floor)"/><path d="M0 0h1000v114L0 235z" fill="#726c57"/><path d="M470 95v550" stroke="#504534" stroke-width="20"/>${floor}${seats}${people}${roomAreas}<path d="M0 660L999 660" stroke="#2f352b" stroke-width="12"/></svg>`;
  }
  function getRival(id){return core().rivals.find(x=>x.id===id);}
  function interiorDetails(id){const b=buildingInfo(id);const c=core();const room=Number(world.room)||0,building=b?.name||'Объект';let title='',text='',stats=[],actions=[];
    if(id==='newsroom'){const roomNames=['Редакционный зал','Кабинет главреда','Верстка','Фотоотдел'];title=roomNames[room]||roomNames[0];text=['Здесь корреспонденты выбирают темы, проверяют факты и распределяют полосы. Последний номер хранится отдельно в меню.','Главный редактор управляет репутацией, расследованиями и направлением компании.','На рабочих столах формируется следующий номер: заголовки, тираж, цена, реклама.','Иллюстрации и свидетельства помогают представить жизнь города в газете.'][room]||'';stats=[['Выпуск',String(c.week).padStart(3,'0')],['Сотрудники','6 человек'],['Доверие',c.trust+'/100']];actions=[['Открыть рабочее место','desk'],['Последний номер газеты','latest']];}
    else if(b?.lotKey){const type=TYPES[b.buildingType];title=['Рабочий зал','Кабинет управляющего','Производство','Службы'][room]||'Рабочий зал';text=type?.desc||'Собственное здание компании работает и приносит операционную пользу.';stats=[['Собственник','Наша компания'],['Город',CITIES[world.city].name],['Преимущество',type?.effect||'—']];actions=[[b.buildingType==='printing'?'Настроить печать':'К плану номера','desk'],['Другие участки','property']];}
    else if(id==='bank'||id==='portbank'){const rs=['Касса','Кредитный отдел','Управляющий','Банковский архив'];title=rs[room]||rs[0];text='Банк выдаёт кредиты под проценты. Деньги можно вложить в участок или строительство, но проценты увеличат издержки редакции.';stats=[['Деньги',mon(c.cash)],['Кредит',mon(c.loan)],['Процент','0,9% за выпуск']];actions=[['Взять кредит 500 $','borrow'],['Погасить 100 $','repay']];}
    else if(id==='hall'||id==='porthall'){const rs=['Городской совет','Кабинет мэра','Земельный отдел','Архив'];title=rs[room]||rs[0];text='Мэрия принимает решения по застройке, аренде и городским услугам. Здесь можно узнать, какие участки продаются, и получить сведения для будущих расследований.';stats=[['Город',CITIES[world.city].name],['Участки',Object.values(LOTS).filter(x=>x.city===world.city).length],['Год',world.year]];actions=[['Узнать о земле','property'],['Запросить городской документ','document']];}
    else if(id==='press'){title=['Печатный цех','Директор','График заказов','Склад бумаги'][room]||'Печатный цех';text='Чужая типография печатает «Городской вестник». Постройте собственную, чтобы уменьшить себестоимость каждого экземпляра.';stats=[['План выпуска',num(c.printed)+' экз.'],['Печать','0,036 $ / экз.'],['Владение','Аренда']];actions=[['Настроить тираж','desk'],['Купить участок','property']];}
    else if(b?.type==='rival'){const r=getRival(id);title=['Приёмная','Отдел новостей','Производство','Дирекция'][room]||'Конкурент';text='Независимая компания конкурирует за читателя и рекламные бюджеты. Здесь можно наблюдать цену, продажи и редакционную стратегию, но нельзя распоряжаться её активами.';stats=[['Компания',building],['Цена',r?(r.price*100).toFixed(0)+' центов':'—'],['Читателей',r?num(r.lastSales):'—']];actions=[['Сравнить издательства','competitors']];}
    else if(b?.type==='residential'){title='Жилой дом';text='Здесь живут люди с разными привычками и интересами. Можно поговорить с жителями и понять спрос на темы будущих выпусков.';stats=[['Тип застройки',era().house],['Период',world.year],['Район',building]];actions=[['Познакомиться с жильцами','residents']];}
    else{title=['Основной зал','Директор','Клиенты','Службы'][room]||building;text='В этом месте встречаются жители и представители бизнеса. Объект участвует в городской экономике и формирует события для прессы.';stats=[['Город',CITIES[world.city].name],['Период',world.year]];actions=[['Осмотреть квартал','city']];}
    return {title,text,stats,actions};
  }
  function interiorScreen(){const id=world.selected,b=buildingInfo(id),info=interiorDetails(id);return `<div class="mw-scene"><div class="mw-scenehead"><div><div class="mw-kicker">ВНУТРИ ЗДАНИЯ · ${esc(CITIES[world.city].name.toUpperCase())} / ${world.year}</div><h1>${esc(b?.name||'Городской объект')}</h1><p>Можно осмотреть комнаты, поговорить с людьми и перейти к действиям компании.</p></div><button class="mw-back" data-mwa="view" data-id="city">← Вернуться на улицу</button></div><div class="mw-interior-grid"><div class="mw-inside-art">${floorsArt(id)}</div><aside class="mw-detail"><div class="mw-side-eyebrow">КОМНАТА ${Number(world.room)+1} / 4</div><h2>${esc(info.title)}</h2><p>${esc(info.text)}</p><div class="stats">${info.stats.map(([k,v])=>`<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div><div class="mw-detail-actions">${info.actions.map(([label,action],i)=>`<button class="mw-button ${i===0?'primary':''}" data-mwa="${action}">${esc(label)}</button>`).join('')}<button class="mw-button" data-mwa="view" data-id="city">Выйти на улицу</button></div></aside></div></div>`;}
  function householdData(id){const base=id.includes('port')?'Портовый':'Городской';const jobs=era().occupations,interests=era().interests,seed=id.length+Math.floor(world.year/17);return [0,1,2,3].map(i=>({name:['Семья Орловых','Семья Грин','Семья Леман','Семья Лукиных'][i],job:jobs[(seed+i*2)%jobs.length],interests:[interests[(seed+i)%interests.length],interests[(seed+i+3)%interests.length]],population:[4,3,2,5][i],district:base}));}
  function housesScreen(){const id=world.selected,b=BLD[id],all=householdData(id),known=world.interviews.filter(x=>x.startsWith(id+':')).length;return `<div class="mw-scene"><div class="mw-scenehead"><div><div class="mw-kicker">ЖИЛЫЕ КВАРТАЛЫ · СОЦИАЛЬНАЯ СИМУЛЯЦИЯ</div><h1>${esc(b.name)}</h1><p>Мы знаем тип домохозяйств, занятия и примерные интересы. Это вымышленные жители игрового города.</p></div><button class="mw-back" data-mwa="view" data-id="city">← На улицу</button></div><div class="mw-housing"><div class="mw-housing-visual"><div class="mw-homeicon">⌂</div><div class="mw-house-title">Кто живёт за этими окнами?</div><div class="mw-house-sub">${esc(era().house)}. Смена эпох обновляет архитектуру, профессии, устройства и интересы, но городские районы сохраняют историю.</div><div class="mw-households">${all.map((f,i)=>`<div class="mw-household"><strong>${esc(f.name)}</strong><small>${esc(f.job)} · ${f.population} человека<br>Интересы: ${esc(f.interests.join(', '))}</small><button style="margin-top:12px" class="mw-button" data-mwa="interview" data-id="${id}:${i}" ${world.interviews.includes(id+':'+i)?'disabled':''}>${world.interviews.includes(id+':'+i)?'✓ Опрос проведён':'Спросить о газете'}</button></div>`).join('')}</div></div><aside class="mw-detail"><div class="mw-side-eyebrow">АУДИТОРИЯ РАЙОНА</div><h2>${esc(b.name)}</h2><p>Опросы дают редакции обратную связь о темах, ценах и доверии. Это не реальные персональные данные, а модель жителей.</p><div class="stats"><div><span>Город</span><b>${esc(CITIES[world.city].name)}</b></div><div><span>Проведено опросов</span><b>${known} / 4</b></div><div><span>Интересы эпохи</span><b>${esc(era().interests[0])}</b></div></div><div class="mw-detail-actions"><button class="mw-button primary" data-mwa="desk">Учесть интересы в выпуске</button><button class="mw-button" data-mwa="view" data-id="city">Вернуться в город</button></div></aside></div></div>`;}
  function caseProgress(i){return world.caseNotes[i.id]||{notes:[],published:false};}
  function incidentArt(i){const fire=i.id==='fire'||i.id==='electric',water=i.id==='flood';const scenes=[`<path d="M0 480L1000 332V650H0" fill="#646e5c"/><path d="M0 513L1000 370" stroke="#d2b995" stroke-width="70"/>`,`<path d="M0 430Q300 460 650 400T1000 445V650H0" fill="#607b7d"/>`];const building=`<g><path d="M110 405l240 -115l294 132l-243 132z" fill="#84775d" stroke="#473d32" stroke-width="5"/><path d="M110 405l291 149v-210L110 203z" fill="#626458"/><path d="M401 554l243 -132V210L401 344z" fill="#4b6258"/>${Array.from({length:6},(_,j)=>{const x=420+(j%3)*69,y=354+Math.floor(j/3)*80;return `<path d="M${x} ${y}l40 -22v45l-40 22z" fill="#a4b4aa" stroke="#2c433e" stroke-width="4"/>`;}).join('')}</g>`;
    const fireSvg=fire?Array.from({length:7},(_,j)=>{let x=120+j*81,y=240-(j%3)*31;return `<path d="M${x} ${y+105}q-33 -55 7 -104q-7 38 27 48q14 -68 25 -91q55 73 25 147z" fill="${j%2?'#fba040':'#d95031'}" opacity=".9"><animate attributeName="opacity" values=".75;1;.75" dur="1.${j+2}s" repeatCount="indefinite"/></path>`;}).join(''):'';
    const floodSvg=water?`<path d="M0 410Q330 355 640 460T1000 405V650H0Z" fill="#6d9d9c" opacity=".85"/><path d="M0 442Q260 385 650 480T1000 422" stroke="#c7e2d6" stroke-width="10" fill="none" stroke-dasharray="45 27"/>`:'';
    const smoke=fire?Array.from({length:4},(_,j)=>`<g opacity=".45"><circle cx="${272+j*53}" cy="${154-j*31}" r="${45+j*7}" fill="#737b70"><animate attributeName="cy" values="${154-j*31};${115-j*31};${154-j*31}" dur="${4+j}s" repeatCount="indefinite"/></circle></g>`).join(''):'';
    return `<svg viewBox="0 0 1000 650" aria-label="Место происшествия: ${esc(i.title)}"><defs><linearGradient id="mw-incsky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#9b9683"/><stop offset="1" stop-color="#4b645e"/></linearGradient></defs><rect width="1000" height="650" fill="url(#mw-incsky)"/>${scenes[water?1:0]}${building}${smoke}${fireSvg}${floodSvg}<g data-mwa="collect" data-id="witness" class="mw-hotspot" role="button" tabindex="0"><circle cx="780" cy="455" r="35" fill="#ae854a" stroke="#ffdfa7" stroke-width="4"/><text x="780" y="465" text-anchor="middle" font-size="33" fill="#fff2db">i</text><rect x="682" y="495" width="195" height="35" fill="#24392e" stroke="#d7b47b"/><text x="779" y="519" fill="#fbe1ae" font-size="15" text-anchor="middle" font-weight="700">ОЧЕВИДЕЦ</text></g><g data-mwa="collect" data-id="evidence" class="mw-hotspot" role="button" tabindex="0"><circle cx="585" cy="375" r="31" fill="#86603a" stroke="#ffdfa7" stroke-width="4"/><text x="585" y="387" text-anchor="middle" font-size="29" fill="#fff2db">+</text><rect x="489" y="411" width="195" height="35" fill="#24392e" stroke="#d7b47b"/><text x="586" y="434" fill="#fbe1ae" font-size="15" text-anchor="middle" font-weight="700">ОСМОТР МЕСТА</text></g></svg>`;}
  function incidentScreen(){const i=INCIDENTS.find(x=>x.id===world.selected),p=caseProgress(i);return `<div class="mw-scene"><div class="mw-scenehead"><div><div class="mw-warning">ПРОИСШЕСТВИЕ · ВЫЕЗД НА МЕСТО</div><h1>${esc(i.title)}</h1><p>${esc(i.where)} · ${esc(CITIES[i.city].name)} · редакция принимает решение о репортаже</p></div><button class="mw-back" data-mwa="view" data-id="city">← На карту города</button></div><div class="mw-incident-grid"><div class="mw-incident-art">${incidentArt(i)}</div><aside class="mw-detail"><div class="mw-side-eyebrow">ПОЛЕВОЕ РАССЛЕДОВАНИЕ</div><h2>Что случилось?</h2><p>Осмотрите место и поговорите с очевидцем, прежде чем публиковать. Непроверенное сообщение может повредить доверию.</p><div class="mw-caseprogress"><span class="${p.notes.includes('witness')?'on':''}"></span><span class="${p.notes.includes('evidence')?'on':''}"></span><span class="${p.published?'on':''}"></span></div><div class="stats"><div><span>Очевидец</span><b>${p.notes.includes('witness')?'Опрошен':'Не опрошен'}</b></div><div><span>Осмотр места</span><b>${p.notes.includes('evidence')?'Проведён':'Нет'}</b></div><div><span>Материал</span><b>${p.published?'Передан в редакцию':'В работе'}</b></div></div><div class="mw-detail-actions"><button class="mw-button" data-mwa="collect" data-id="witness" ${p.notes.includes('witness')?'disabled':''}>Опросить очевидца</button><button class="mw-button" data-mwa="collect" data-id="evidence" ${p.notes.includes('evidence')?'disabled':''}>Осмотреть место</button><button class="mw-button primary" data-mwa="file-report" ${p.published?'disabled':''}>${p.published?'Материал в редакции':'Подготовить репортаж'}</button></div></aside></div></div>`;}
  function propertyScreen(){finalizeConstruction();const lid=world.selectedLot,lot=LOTS[lid],record=world.lots[lid],isOwned=!!record,isCompleted=record?.status==='complete';const unlocked=Object.entries(TYPES).filter(([id,t])=>world.year>=t.minYear);
    return `<div class="mw-scene"><div class="mw-scenehead"><div><div class="mw-kicker">ЗЕМЛЯ · НЕДВИЖИМОСТЬ · НОВЫЕ АКТИВЫ КОМПАНИИ</div><h1>Строить собственную медиаимперию</h1><p>Выберите участок в любом городе. Купленная земля остаётся у компании, постройки дают операционные преимущества.</p></div><button class="mw-back" data-mwa="view" data-id="city">← К городу</button></div><div class="mw-property-grid"><div class="mw-property-list">${Object.entries(LOTS).map(([id,l])=>{const r=world.lots[id];return `<article class="mw-property-card ${lid===id?'chosen':''}" data-mwa="select-lot" data-id="${id}" tabindex="0" role="button"><small>${esc(CITIES[l.city].name)} · участок ${id.toUpperCase()}</small><h3>${r?.type?esc(TYPES[r.type].name):'Свободная земля'}</h3><p>${r?.status==='complete'?'Построен и работает':r?.status==='building'?'Строится · окончание после выпуска №'+(r.finishWeek-1):r?'Земля куплена, проект не выбран':'Участок доступен для покупки. Выбирайте, какой объект построить.'}</p><b>${r?'В собственности':mon(l.price)}</b></article>`;}).join('')}</div><aside class="mw-detail"><div class="mw-side-eyebrow">ВЫБРАННЫЙ ОБЪЕКТ</div><h2>${esc(CITIES[lot.city].name)} / ${esc(lid.toUpperCase())}</h2><p>${isCompleted?'Объект работает и влияет на экономику выпусков.':isOwned?'Земля оформлена на компанию. Теперь выберите объект и начните строительство.':'Покупка земли списывает средства с кассы. Строительство оплачивается отдельно.'}</p><div class="stats"><div><span>Стоимость земли</span><b>${mon(lot.price)}</b></div><div><span>Баланс</span><b>${mon(core().cash)}</b></div><div><span>Статус</span><b>${isCompleted?'Объект работает':isOwned?record.status==='building'?'Стройка':'Ваш участок':'В продаже'}</b></div></div>${!isOwned?`<div class="mw-detail-actions"><button class="mw-button primary" data-mwa="buy-lot" ${core().cash<lot.price?'disabled':''}>Купить участок за ${mon(lot.price)}</button><div class="mw-mini">Земля выкупается сразу. Для здания понадобятся дополнительные средства.</div></div>`:record.status==='land'?`<div class="mw-buildselect">${unlocked.map(([type,t])=>`<button class="${world.buildType===type?'chosen':''}" data-mwa="build-type" data-id="${type}"><strong><span>${esc(t.name)}</span><span>${mon(t.cost)}</span></strong>${esc(t.effect)}</button>`).join('')}</div><div class="mw-detail-actions"><button class="mw-button primary" data-mwa="build" ${core().cash<TYPES[world.buildType]?.cost?'disabled':''}>Начать строительство · ${mon(TYPES[world.buildType]?.cost)}</button><div class="mw-mini">${esc(TYPES[world.buildType]?.desc||'Выберите объект')}. Время стройки: ${TYPES[world.buildType]?.time||1} выпуска(ов).</div></div>`:record.status==='building'?`<div class="mw-detail-actions"><div class="mw-text-warning">Строительство завершится после выпуска №${record.finishWeek-1}. Перейдите в редакцию, чтобы продвинуть время.</div><button class="mw-button" data-mwa="desk">Выпустить номер</button></div>`:`<div class="mw-detail-actions"><div class="mw-mini">Работающее здание: ${esc(TYPES[record.type]?.effect||'')}</div><button class="mw-button" data-mwa="view" data-id="city">Увидеть на карте</button></div>`}</aside></div><div class="mw-text-warning">Демо-экономика: собственные здания влияют на печать, рекламу и аудиторию. Следующие эпохи здесь доступны для проверки архитектуры и строительства; газетная глава пока ограничена 12 неделями 1900 года.</div></div>`;
  }
  function latestScreen(){const h=core().history.at(-1);return `<div class="mw-scene"><div class="mw-scenehead"><div><div class="mw-kicker">ИЗДАТЕЛЬСКАЯ ИСТОРИЯ · АРХИВ ГАЗЕТ</div><h1>Последний номер «Городского вестника»</h1><p>Здесь всегда остаётся именно опубликованный выпуск, а не будущий макет.</p></div><button class="mw-back" data-mwa="interior" data-id="newsroom">← В редакцию</button></div>${h?`<div class="mw-latest-grid"><div class="mw-paper-frame">${api.paper(h)}</div><aside class="mw-latest-side"><div class="mw-kicker">ВЫПУСК №${String(h.week).padStart(3,'0')}</div><h2>Опубликованная первая полоса</h2><p>Этот номер был напечатан и сохранён в архиве компании. Показывает фактические материалы и цену выпуска.</p><div class="lineitem"><span>Продано</span><strong>${num(h.sold)}</strong></div><div class="lineitem"><span>Прибыль</span><strong>${mon(h.profit)}</strong></div><div class="lineitem"><span>Цена экземпляра</span><strong>${h.price.toFixed(2)} $</strong></div><div class="lineitem"><span>Касса после выпуска</span><strong>${mon(h.cash)}</strong></div><div class="mw-detail-actions"><button class="mw-button primary" data-mwa="desk">Подготовить следующий номер</button><button class="mw-button" data-mwa="archive">Открыть весь архив</button></div></aside></div>`:`<div class="mw-zero"><div style="font-size:56px">▤</div><h2>Первый номер ещё не вышел</h2><p>В редакции готовится выпуск №001. После печати его настоящая первая полоса появится здесь и останется в истории газеты.</p><button class="mw-button primary" data-mwa="desk">Перейти к вёрстке первого номера</button></div>`}</div>`;}
  function newsScreen(){const e=activeIncidents();return `<div class="mw-scene"><div class="mw-scenehead"><div><div class="mw-kicker">НОВОСТИ ГОРОДОВ · ОПЕРАТИВНЫЕ СОБЫТИЯ</div><h1>Что происходит вокруг нас</h1><p>Репортёры могут выехать на место происшествия. Реакция редакции влияет на материалы и доверие.</p></div><button class="mw-back" data-mwa="view" data-id="city">← На карту</button></div><div class="mw-property-list">${e.map(i=>`<article class="mw-property-card" data-mwa="incident" data-id="${i.id}" role="button" tabindex="0"><small style="color:#f6a38e">● ${esc(i.kind)} · ${esc(CITIES[i.city].name)}</small><h3>${esc(i.title)}</h3><p>${esc(i.where)}. Перейдите на место события, опросите свидетелей и подготовьте репортаж.</p><b>Перейти к месту →</b></article>`).join('')||'<div class="mw-zero"><h2>Срочных событий нет</h2><p>Пройдите следующий выпуск, чтобы увидеть, как меняется повестка города.</p></div>'}</div><div class="mw-property-list">${world.newsLog.slice(0,10).map(x=>`<div class="mw-property-card"><small>ЖУРНАЛ ГОРОДА</small><h3 style="font-size:18px">${esc(x)}</h3></div>`).join('')}</div></div>`;}
  function show(){finalizeConstruction();const app=document.getElementById('world-app');if(!app)return;
    const inDesk=world.view==='desk';document.getElementById('game').style.display=inDesk?'':'none';app.style.display=inDesk?'none':'flex';document.getElementById('mw-return').style.display=inDesk?'block':'none';
    if(inDesk){api.tab('editor');persist();return;}
    const main=world.view==='city'?cityScreen():world.view==='interior'?interiorScreen():world.view==='residents'?housesScreen():world.view==='incident'?incidentScreen():world.view==='property'?propertyScreen():world.view==='latest'?latestScreen():world.view==='news'?newsScreen():world.view==='missions'?missionScreen():cityScreen();
    app.innerHTML=header()+`<main class="mw-main"><div class="mw-stage">${main}</div></main>`+bottom();persist();
  }
  function openInterior(id){const b=BLD[id];world.selected=id;world.room='0';if(b?.city)world.city=b.city;world.view=b?.type==='residential'?'residents':'interior';show();}
  function openIncident(id){const i=INCIDENTS.find(x=>x.id===id);if(!i)return;world.city=i.city;world.selected=id;world.view='incident';show();}
  function toast(text){const e=document.getElementById('toast');if(!e)return;e.textContent=text;e.className='toast show';setTimeout(()=>e.className='toast',3200);}
  function noMoney(price){toast('Недостаточно средств: требуется '+mon(price)+'. В банке можно взять кредит.');}
  function transaction(amount,desc){if(!api.transact(amount,desc)){noMoney(-amount);return false;}world.cashEvents.push({week:core().week,amount,desc});return true;}
  function act(action,id){if(action==='missions'){world.view='missions';show();return;}if(action==='roll-mission'){if((core().history||[]).length===0){const n=M6_DECK.length;world.missionRoll=(world.missionRoll+1+Math.floor(Math.random()*(n-1)))%n;show();toast('Новые цели миссии выбраны.');}return;}if(action==='camera-in'||action==='camera-out'||action==='camera-reset'){const c=world.camera||{zoom:1,x:0,y:0};const next=action==='camera-reset'?1:Math.min(2.2,Math.max(1,Number((c.zoom+(action==='camera-in'?.25:-.25)).toFixed(2))));world.camera=next===1?{zoom:1,x:0,y:0}:{zoom:next,x:c.x||0,y:c.y||0};show();return;}if(action==='motion'){world.motion=!(world.motion!==false);show();return;}if(action==='city'){world.city=id;world.view='city';world.camera={zoom:1,x:0,y:0};show();return;}
    if(action==='view'){world.view=id;show();return;}
    if(action==='interior'||action==='building'){openInterior(id);return;}
    if(action==='room'){world.room=id;show();return;}
    if(action==='lot'||action==='select-lot'){world.selectedLot=id;world.city=LOTS[id].city;world.view='property';show();return;}
    if(action==='incident'){openIncident(id);return;}
    if(action==='collect'){const key=world.selected,i=INCIDENTS.find(x=>x.id===key);if(!i)return;const p=world.caseNotes[key]||{notes:[],published:false};if(!p.notes.includes(id)){p.notes.push(id);world.caseNotes[key]=p;world.newsLog.unshift(id==='witness'?'Корреспондент опросил очевидца: '+i.title:'Осмотрены следы происшествия: '+i.title);toast(id==='witness'?'Свидетель опрошен.':'Материальные свидетельства осмотрены.');}show();return;}
    if(action==='file-report'){const i=INCIDENTS.find(x=>x.id===world.selected),p=world.caseNotes[world.selected]||{notes:[],published:false};if(!i||p.published)return;const verified=p.notes.includes('witness')&&p.notes.includes('evidence');p.published=true;world.caseNotes[i.id]=p;api.breaking(i.lead);api.adjustTrust(verified?3:-2);world.newsLog.unshift(verified?'Проверенный репортаж передан в редакцию: '+i.title:'Репортаж без двух источников передан в редакцию: '+i.title);toast(verified?'Репортаж проверен и добавлен в газету.':'Номер получил непроверенный репортаж: доверие снизилось.');world.view='interior';world.selected='newsroom';world.room='0';show();return;}
    if(action==='enter-owned'){const l=world.lots[id];if(l?.status==='complete'){world.city=LOTS[id].city;world.selected='lot-'+id;world.room='0';world.view='interior';show();}return;}
    if(action==='buy-lot'){const l=LOTS[world.selectedLot];if(world.lots[world.selectedLot])return;if(!transaction(-l.price,'Покупка участка '+world.selectedLot))return;world.lots[world.selectedLot]={status:'land',boughtWeek:core().week,price:l.price};world.newsLog.unshift('Куплен участок '+world.selectedLot+' в городе '+CITIES[l.city].name);show();return;}
    if(action==='build-type'){world.buildType=id;show();return;}
    if(action==='build'){const idLot=world.selectedLot,r=world.lots[idLot],t=TYPES[world.buildType];if(!r||r.status!=='land'||!t||world.year<t.minYear)return;if(!transaction(-t.cost,'Строительство: '+t.name))return;world.lots[idLot]={...r,type:world.buildType,status:'building',finishWeek:core().week+t.time};world.newsLog.unshift('Начато строительство: '+t.name);show();return;}
    if(action==='interview'){if(!world.interviews.includes(id)){world.interviews.push(id);api.adjustTrust(1);toast('Мнение жителя учтено. Доверие +1.');}show();return;}
    if(action==='borrow'){if(api.borrow(500)){world.newsLog.unshift('Банк выдал кредит 500 $');toast('Получено 500 $. Долг и проценты увеличились.');}show();return;}
    if(action==='repay'){if(api.repay(100)){toast('Погашено 100 $ кредита.');}else toast('Недостаточно денег или кредит уже погашен.');show();return;}
    if(action==='document'){if(transaction(-30,'Запрос городских документов')){api.adjustTrust(1);world.newsLog.unshift('Получены документы мэрии для расследования.');toast('Документы получены: доверие +1.');}show();return;}
    if(action==='property'){world.view='property';show();return;}
    if(action==='residents'){world.view='residents';show();return;}
    if(action==='desk'){world.view='desk';show();return;}
    if(action==='latest'){world.view='latest';show();return;}
    if(action==='news'){world.view='news';show();return;}
    if(action==='archive'){world.view='desk';api.tab('archive');document.getElementById('game').style.display='';document.getElementById('world-app').style.display='none';document.getElementById('mw-return').style.display='block';persist();return;}
    if(action==='competitors'){world.view='desk';api.tab('market');document.getElementById('game').style.display='';document.getElementById('world-app').style.display='none';document.getElementById('mw-return').style.display='block';persist();return;}
    if(action==='save'){persist();api.save();toast('Игра и город сохранены в браузере.');return;}
  }
  const app=document.createElement('div');app.id='world-app';document.body.append(app);
  const returnButton=document.createElement('button');returnButton.id='mw-return';returnButton.className='mw-iconbtn';returnButton.textContent='← Город / здания';returnButton.style.cssText='position:fixed;z-index:12000;top:6px;right:130px;display:none;box-shadow:0 8px 22px #0008;';document.body.append(returnButton);
  returnButton.addEventListener('click',()=>{world.view='city';show();});
  app.addEventListener('click',event=>{const target=event.target.closest('[data-mwa]');if(!target)return;event.preventDefault();act(target.dataset.mwa,target.dataset.id);});
  app.addEventListener('change',event=>{const t=event.target;if(t.dataset.mws==='year'){world.year=Number(t.value)||1900;world.camera={zoom:1,x:0,y:0};world.eraVisits=[...new Set([...(world.eraVisits||[]),world.year])];world.newsLog.unshift('Городской мир перешёл в '+world.year+' год (визуальный тест эпохи).');show();}});
  app.addEventListener('keydown',event=>{if((event.key==='Enter'||event.key===' ')&&event.target.hasAttribute('data-mwa')){event.preventDefault();event.target.click();}});
  window.addEventListener('storage',e=>{if(e.key==='media-empire-studio-newspaper-0.1')show();});

  let me6drag=null;
  app.addEventListener('pointerdown',ev=>{
    if((world.camera?.zoom||1)<=1||!ev.isPrimary||ev.button!==0)return;
    const camera=ev.target.closest('.me6-camera');if(!camera)return;
    if(ev.target.closest('[data-mwa],button,.me6-parcel,.me4-landpin'))return;
    const map=ev.target.closest('.me4-game-map');if(!map)return;
    me6drag={startX:ev.clientX,startY:ev.clientY,x:world.camera.x||0,y:world.camera.y||0,el:camera,rect:map.getBoundingClientRect()};
    camera.classList.add('is-dragging');camera.setPointerCapture(ev.pointerId);
    ev.preventDefault();
  });
  app.addEventListener('pointermove',ev=>{
    if(!me6drag)return;
    const {startX,startY,x,y,el,rect}=me6drag,zoom=world.camera.zoom,limit=(zoom-1)*50;
    const nx=Math.max(-limit,Math.min(limit,x+(ev.clientX-startX)/Math.max(1,rect.width)*100));
    const ny=Math.max(-limit,Math.min(limit,y+(ev.clientY-startY)/Math.max(1,rect.height)*100));
    world.camera.x=nx;world.camera.y=ny;el.style.transform=`translate(${nx}%,${ny}%) scale(${zoom})`;
  });
  function me6stopDrag(){if(me6drag){me6drag.el.classList.remove('is-dragging');me6drag=null;persist();}}
  app.addEventListener('pointerup',me6stopDrag);app.addEventListener('pointercancel',me6stopDrag);
  app.addEventListener('wheel',ev=>{
    if(world.view!=='city'||!ev.target.closest('.me4-game-map')||ev.target.closest('.me4-event-ribbon'))return;
    ev.preventDefault();
    const c=world.camera||{zoom:1,x:0,y:0};
    const delta=ev.deltaY<0?.15:-.15;
    const zoom=Math.max(1,Math.min(2.2,Math.round((c.zoom+delta)*100)/100));
    if(zoom===c.zoom)return;
    const limit=(zoom-1)*50;
    world.camera={zoom,x:zoom===1?0:Math.max(-limit,Math.min(limit,c.x||0)),y:zoom===1?0:Math.max(-limit,Math.min(limit,c.y||0))};
    const el=app.querySelector('.me6-camera');if(el)el.style.transform=`translate(${world.camera.x}%,${world.camera.y}%) scale(${zoom})`;
    const val=app.querySelector('.me6-camera-tools span');if(val)val.textContent=Math.round(zoom*100)+'%';
    persist();
  },{passive:false});
  window.ME_WORLD.mission=()=>m6status();
  window.ME_WORLD.reset=()=>{world=defaultWorld();persist();show();};
  window.ME_WORLD.debug=()=>({world,core:core(),modifiers:modifiers()});
  show();
})();