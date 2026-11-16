from pathlib import Path
from playwright.sync_api import sync_playwright
import os,json,re
out=Path(os.environ.get('QA_OUTPUT_DIR','test-results'));out.mkdir(parents=True,exist_ok=True);url=os.environ.get('GAME_URL','http://terminal.local:4173/');key='media-empire-mobile-v1'
results={};errors=[];bad=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--no-proxy-server','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--host-resolver-rules=MAP terminal.local 127.0.0.1'],env={**os.environ,'XDG_CONFIG_HOME':str(out/'config-e2e'),'XDG_CACHE_HOME':str(out/'cache-e2e')})
 def context(width=390,height=844):
  c=b.new_context(viewport={'width':width,'height':height},is_mobile=True,has_touch=True,device_scale_factor=1,accept_downloads=True)
  page=c.new_page();page.set_default_timeout(12000);page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:bad.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
  response=page.goto(url,wait_until='networkidle');assert response.status==200;page.locator('canvas').wait_for(state='visible');page.locator('.city-loading').wait_for(state='hidden');page.evaluate('document.fonts.ready')
  return c,page
 def tap(pg,name,exact=True):
  pg.locator('body').aria_snapshot();pg.get_by_role('button',name=name,exact=exact).tap();return pg.locator('body').aria_snapshot()
 def data(pg):return pg.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',key)
 c,page=context()
 tap(page,'Пожар на фабрике Проверьте факты')
 tap(page,'Отправить репортёра');page.get_by_role('button',name=re.compile('^Опросить очевидца')).wait_for(state='visible')
 tap(page,re.compile('^Опросить очевидца'),False);tap(page,re.compile('^Осмотреть место'),False);tap(page,'На первую полосу')
 assert data(page)['headlineEdit']['verified'] is True
 page.screenshot(animations='disabled',path=str(out/'03-investigation.png'))
 tap(page,'Закрыть окно');page.reload(wait_until='networkidle');page.locator('.city-loading').wait_for(state='hidden')
 assert data(page)['headlineEdit']['title']=='Пожар на фабрике: город требует ответов'
 tap(page,'Развернуть макет газеты');page.locator('.paper-headline').wait_for();assert page.locator('.paper-headline').inner_text()==data(page)['headlineEdit']['title'];page.screenshot(animations='disabled',path=str(out/'04-newspaper-draft.png'))
 for _ in range(10):
  page.locator('body').aria_snapshot();page.keyboard.press('Tab');assert page.evaluate('!!document.activeElement.closest("dialog[open]")')
 page.locator('body').aria_snapshot();page.keyboard.press('Escape');assert page.locator('dialog[open]').count()==0
 results['paper_focus_restored']=page.evaluate('document.activeElement.getAttribute("aria-label")')
 assert results['paper_focus_restored']=='Развернуть макет газеты'
 tap(page,'Свободный участок — построить киоск');tap(page,'Купить участок · 500 $');tap(page,'Начать строительство · 820 $')
 assert data(page)['cash']==2680 and data(page)['city']['kiosk']['status']=='building'
 tap(page,'Закрыть окно');page.screenshot(animations='disabled',path=str(out/'05-construction.png'))
 tap(page,'Редакция');page.screenshot(animations='disabled',path=str(out/'06-editor.png'));tap(page,'Выпустить номер');page.get_by_role('heading',name='Номер вышел!',exact=True).wait_for()
 first=data(page);assert first['week']==2 and first['city']['kiosk']['status']=='open' and first['history'][0]['dispatch']['verified'] is True
 page.screenshot(animations='disabled',path=str(out/'07-issue-report.png'));tap(page,'Вернуться в город');page.screenshot(animations='disabled',path=str(out/'08-city-kiosk-open.png'))
 assert 'Ваш киоск открыт' in page.locator('.event-push').inner_text()
 tap(page,'Развернуть опубликованный выпуск №1');assert page.locator('.paper-headline').inner_text()==first['history'][0]['stories'][0]
 page.screenshot(animations='disabled',path=str(out/'09-published-newspaper.png'));tap(page,'Закрыть окно')
 tap(page,'Настройки игры')
 with page.expect_download() as d:tap(page,'Скачать сохранение')
 save=out/'mobile-save.json';d.value.save_as(save);snapshot=data(page);results['first_issue']={k:first['history'][0][k] for k in ['week','sold','profit','cash','trustAfter']}
 c2,p2=context();tap(p2,'Настройки игры')
 with p2.expect_file_chooser() as f:tap(p2,'Загрузить сохранение')
 f.value.set_files(str(save));p2.get_by_text('Партия загружена целиком.',exact=True).wait_for();assert data(p2)==snapshot
 results['full_transfer']=True
 invalid=out/'invalid.json';invalid.write_text('{"format":"media-empire-mobile","cash":999999}')
 with p2.expect_file_chooser() as f:tap(p2,'Загрузить сохранение')
 f.value.set_files(str(invalid));p2.get_by_text('Этот файл не является совместимым сохранением мобильной игры.',exact=True).wait_for();assert data(p2)==snapshot
 results['invalid_import_retains_state']=True;p2.screenshot(animations='disabled',path=str(out/'10-invalid-import-safe.png'));c2.close()
 tap(page,'Закрыть окно')
 before=page.locator('.newsroom-pin').evaluate('(el)=>el.getBoundingClientRect().top')
 tap(page,'Приблизить карту');after=page.locator('.newsroom-pin').evaluate('(el)=>el.getBoundingClientRect().top');assert abs(after-before)>10
 tap(page,'Вернуть камеру')
 session=c.new_cdp_session(page)
 for kind,points in [('touchStart',[(140,420),(250,420)]),('touchMove',[(125,425),(265,415)]),('touchMove',[(110,430),(280,410)]),('touchEnd',[])]:
  page.locator('body').aria_snapshot();session.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[{'x':x,'y':y,'id':i} for i,(x,y) in enumerate(points)]})
 pinched=page.locator('.newsroom-pin').evaluate('(el)=>el.getBoundingClientRect().top')
 assert abs(pinched-before)>10
 page.screenshot(animations='disabled',path=str(out/'11-pinch-zoom.png'));results['pinch_zoom_work']=True;results['zoom_buttons_work']=True;tap(page,'Вернуть камеру')
 while data(page)['week']<=12:
  tap(page,'Редакция')
  if data(page)['week']==4:tap(page,'Опубликовать')
  tap(page,'Выпустить номер');page.get_by_role('heading',name='Номер вышел!',exact=True).wait_for();tap(page,'Вернуться в город')
 assert data(page)['status']=='complete' and len(data(page)['history'])==12
 tap(page,'Первая глава завершена Двенадцать выпусков изменили вашу редакцию и город.')
 page.screenshot(animations='disabled',path=str(out/'12-chapter-ending.png'));results['chapter']={k:data(page)[k] for k in ['week','cash','trust','status']};c.close()
 for w,h in [(360,740),(430,932)]:
  cx,px=context(w,h);px.screenshot(animations='disabled',path=str(out/('responsive-'+str(w)+'.png')));assert px.evaluate('document.documentElement.scrollWidth===innerWidth');results['viewport-'+str(w)]=True;cx.close()
 b.close()
results['errors']=errors;results['bad_resources']=bad
(out/'playthrough-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print(json.dumps(results,ensure_ascii=False,indent=2))

assert not errors, errors
assert not bad, bad
