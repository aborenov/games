from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image,ImageChops
import os,json,re
out=Path(os.environ.get('QA_OUTPUT_DIR','test-results/campaign'));out.mkdir(parents=True,exist_ok=True)
url=os.environ.get('GAME_URL','http://127.0.0.1:4173/');errors=[];bad=[];results={}
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--no-proxy-server','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],env={**os.environ,'XDG_CONFIG_HOME':str(out/'config'),'XDG_CACHE_HOME':str(out/'cache')})
 def context(width=390,height=844):
  c=browser.new_context(viewport={'width':width,'height':height},has_touch=True,is_mobile=True,device_scale_factor=1,accept_downloads=True)
  pg=c.new_page();pg.set_default_timeout(15000);pg.on('pageerror',lambda e:errors.append(str(e)));pg.on('console',lambda e:errors.append(e.text) if e.type=='error' else None);pg.on('response',lambda r:bad.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
  pg.goto(url,wait_until='networkidle');pg.locator('[data-testid=city-canvas][data-city-ready=true]').wait_for();pg.evaluate('document.fonts.ready');return c,pg
 def tap(pg,name,role='button',exact=True):
  pg.locator('body').aria_snapshot();scope=pg.get_by_role('navigation',name='Разделы игры') if role=='button' and isinstance(name,str) and name in ['Город','Темы','Редакция','Газета'] else pg;scope.get_by_role(role,name=name,exact=exact).tap();pg.locator('body').aria_snapshot()
 def state(pg):return pg.evaluate('JSON.parse(localStorage.getItem("first-page-v2"))')
 def shot(pg,name):pg.wait_for_timeout(450);pg.screenshot(path=str(out/(name+'.png')),animations='disabled')
 def report(pg,index):
  tap(pg,'Темы');pg.get_by_role('button',name=re.compile('^Тема:')).nth(index).tap();tap(pg,'Проверить факты');pg.get_by_role('heading',name='Материал готов',exact=True).wait_for();tap(pg,'Закрыть')
 c,pg=context();pg.evaluate('localStorage.setItem("media-empire-mobile-v1","legacy-player-party-preserved")')
 tap(pg,'Бизнес и развитие');tap(pg,'Заключить договор: Город читает в дороге');assert state(pg)['contracts'][0]['status']=='active';shot(pg,'01-contract')
 tap(pg,'Развитие');tap(pg,'Построить: Собственная печатная машина');assert state(pg)['buildings']['press']['status']=='building';tap(pg,'Закрыть')
 report(pg,0);report(pg,1);assert state(pg)['hoursLeft']==0
 tap(pg,'Темы');pg.get_by_role('button',name=re.compile('^Тема:')).nth(2).tap();assert pg.get_by_role('button',name='Проверить факты',exact=True).is_disabled();assert pg.get_by_role('button',name='Короткая заметка',exact=True).is_disabled();shot(pg,'02-scarcity');tap(pg,'Закрыть');results['real_scarcity']=True
 tap(pg,'Редакция');tap(pg,'Напечатать номер');pg.get_by_role('heading',name='Номер в городе',exact=True).wait_for();assert state(pg)['day']==2 and state(pg)['world']['factory']=='closed';shot(pg,'03-first-result');tap(pg,'Смотреть город');pg.get_by_role('button',name='Фабрика остановлена',exact=True).wait_for(timeout=1500);shot(pg,'04-factory-closed');results['printed_city_consequence']=True
 report(pg,0);report(pg,1);tap(pg,'Редакция');tap(pg,'Печать и доставка',role='tab');tap(pg,re.compile('^Подписчики'),exact=False);shot(pg,'05-adapt-delivery');tap(pg,'Напечатать номер');pg.get_by_role('heading',name='Номер в городе',exact=True).wait_for()
 s=state(pg);assert s['day']==3 and s['buildings']['press']['status']=='open';assert s['contracts'][0]['status']=='completed';results['paid_contract_and_useful_construction']={'contract':s['contracts'][0]['status'],'progress':s['contracts'][0]['progress'],'press':s['buildings']['press']['status']};shot(pg,'06-contract-paid')
 tap(pg,'Читать газету');shot(pg,'07-second-paper');tap(pg,'Закрыть');assert pg.evaluate('localStorage.getItem("media-empire-mobile-v1")')=='legacy-player-party-preserved';results['legacy_untouched']=True
 tap(pg,'Настройки');
 with pg.expect_download() as d:tap(pg,'Скачать')
 save=out/'party.json';d.value.save_as(save);tap(pg,'Закрыть')
 c2,p2=context();tap(p2,'Настройки')
 with p2.expect_file_chooser() as f:tap(p2,'Загрузить')
 f.value.set_files(str(save));p2.get_by_text('Партия загружена целиком.',exact=True).wait_for();loaded=state(p2)
 for k in ['day','cash','trust','readers','history','contracts','buildings','world','factions']:assert loaded[k]==s[k],k
 results['whole_party_transfer']=True
 invalid=out/'invalid.json';invalid.write_text('{"format":"first-page","version":2}')
 before=state(p2)
 with p2.expect_file_chooser() as f:tap(p2,'Загрузить')
 f.value.set_files(str(invalid));p2.get_by_text(re.compile('Это не совместимая партия')).wait_for();assert state(p2)==before;results['invalid_import_retains_party']=True;tap(p2,'Закрыть')
 p3=c2.new_page();p3.goto(url,wait_until='networkidle');p3.locator('[data-testid=city-canvas][data-city-ready=true]').wait_for();tap(p2,'Настройки');tap(p2,'Начать новую партию');tap(p2,'Начать новую партию');p3.get_by_text('Партия изменилась в другой вкладке.',exact=True).wait_for();tap(p3,'Обновить партию');assert state(p3)['day']==1;results['cross_tab_new_campaign_guard']=True;c2.close()
 while state(pg)['status']=='playing':
  report(pg,0);report(pg,1);tap(pg,'Редакция');tap(pg,'Напечатать номер');pg.get_by_role('heading',name='Номер в городе',exact=True).wait_for();tap(pg,'Смотреть город')
 final=state(pg);assert final['status']=='won' and len(final['history'])==12
 tap(pg,'Посмотреть итоги');shot(pg,'08-campaign-ending');results['full_twelve_edition_ui']={k:final[k] for k in ['day','cash','trust','readers','status']};tap(pg,'Читать свои номера');assert pg.locator('.archive-list>button').count()==12;results['all_editions_archived']=True;c.close()
 for width,height in [(360,780),(430,932),(1440,900)]:
  cx,px=context(width,height);assert px.evaluate('document.documentElement.scrollWidth===innerWidth');tap(px,'Настройки');tap(px,'Движение города',role='switch');tap(px,'Закрыть');px.wait_for_timeout(500);shot(px,'viewport-'+str(width));
  if width==430:
   px.screenshot(path=str(out/'frozen-a.png'));px.wait_for_timeout(650);px.screenshot(path=str(out/'frozen-b.png'));assert not ImageChops.difference(Image.open(out/'frozen-a.png').convert('RGB'),Image.open(out/'frozen-b.png').convert('RGB')).getbbox();results['all_motion_pauses']=True
   before=px.locator('canvas').screenshot();tap(px,'Приблизить');after=px.locator('canvas').screenshot();assert before!=after
   session=cx.new_cdp_session(px);session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':150,'y':420,'id':1},{'x':245,'y':445,'id':2}]});session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':100,'y':395,'id':1},{'x':290,'y':475,'id':2}]});session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});assert px.locator('dialog[open]').count()==0
   drag_before=px.locator('canvas').screenshot();session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':180,'y':480,'id':1}]});session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':250,'y':445,'id':1}]});session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});assert px.locator('dialog[open]').count()==0;assert drag_before!=px.locator('canvas').screenshot();results['touch_zoom_and_pan_without_selection']=True
  results['viewport-'+str(width)]=True;cx.close()
 results['errors']=errors;results['bad_resources']=bad;(out/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print(json.dumps(results,ensure_ascii=False));browser.close();assert not errors and not bad,results
