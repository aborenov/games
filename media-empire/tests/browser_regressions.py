from pathlib import Path
from playwright.sync_api import sync_playwright
import os,json,re
out=Path(os.environ.get('QA_OUTPUT_DIR','test-results'));out.mkdir(parents=True,exist_ok=True)
url=os.environ.get('GAME_URL','http://127.0.0.1:4174/');key='media-empire-mobile-v1';errors=[];bad=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],env={**os.environ,'XDG_CONFIG_HOME':str(out/'config-regressions'),'XDG_CACHE_HOME':str(out/'cache-regressions')})
 def new_page():
  c=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1,accept_downloads=True)
  pg=c.new_page();pg.set_default_timeout(12000);pg.on('pageerror',lambda e:errors.append(str(e)));pg.on('response',lambda r:bad.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
  return c,pg
 def load(pg):
  response=pg.goto(url,wait_until='networkidle');assert response.status==200;pg.locator('canvas').wait_for();pg.locator('.city-loading').wait_for(state='hidden')
 def tap(pg,name,role='button'):
  pg.locator('body').aria_snapshot();pg.get_by_role(role,name=name,exact=isinstance(name,str)).tap()
 def data(pg):return pg.evaluate('(k)=>JSON.parse(localStorage.getItem(k))',key)
 def publish(pg):
  tap(pg,'Выпустить номер');pg.get_by_role('heading',name='Номер вышел!',exact=True).wait_for();tap(pg,'Вернуться в город')
 def exclude(pg):
  pg.locator('body').aria_snapshot();pg.locator('.story-toggle').filter(has_text='Пожар на фабрике: город требует ответов').tap()
  pg.locator('body').aria_snapshot();pg.locator('.story-toggle[aria-pressed="false"]').filter(has_not_text='Пожар на фабрике: город требует ответов').first.tap()
 c,pg=new_page()
 pg.add_init_script('window.__reportingNow=1000000000000; Date.now=()=>window.__reportingNow;')
 load(pg)
 before=pg.locator('.newsroom-pin').evaluate('(el)=>el.getBoundingClientRect().top');session=c.new_cdp_session(pg)
 for kind,points in [('touchStart',[(190,480)]),('touchMove',[(190,520)]),('touchMove',[(190,560)]),('touchEnd',[])]:
  pg.locator('body').aria_snapshot();session.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[{'x':x,'y':y,'id':i} for i,(x,y) in enumerate(points)]})
 pg.wait_for_function('(before)=>Math.abs(document.querySelector(".newsroom-pin").getBoundingClientRect().top-before)>5',arg=before)
 tap(pg,'Вернуть камеру');tap(pg,'Пожар на фабрике Проверьте факты');tap(pg,'Отправить репортёра')
 arrival=data(pg)['reporter']['readyAt'];tap(pg,'Закрыть окно');tap(pg,'Редакция');publish(pg)
 assert data(pg)['week']==2 and data(pg)['reporter']['readyAt']==arrival
 pg.evaluate('window.__reportingNow+=5000');pg.get_by_role('button',name=re.compile('^Репортёр на месте')).wait_for()
 tap(pg,re.compile('^Репортёр на месте'));tap(pg,re.compile('^Опросить очевидца'));tap(pg,re.compile('^Осмотреть место'));tap(pg,'На первую полосу');tap(pg,'Перейти к вёрстке')
 exclude(pg);tap(pg,'Закрыть окно');tap(pg,re.compile('^Городские события'))
 pg.locator('body').aria_snapshot();pg.locator('.event-log').filter(has=pg.get_by_role('heading',name='Репортёр на месте',exact=True)).get_by_role('button',name='Открыть',exact=True).tap()
 tap(pg,'Вернуть репортаж в номер');assert 0 in data(pg)['selected']
 exclude(pg);publish(pg)
 assert data(pg)['week']==3 and data(pg)['headlineEdit']['caseId']=='fire' and data(pg)['history'][1]['dispatch'] is None
 tap(pg,'Редакция');tap(pg,'Посмотреть макет');assert pg.locator('.paper-headline').inner_text()=='Пожар на фабрике: город требует ответов'
 pg.screenshot(path=str(out/'16-carried-report.png'));tap(pg,'Закрыть окно');tap(pg,'Редакция');publish(pg)
 assert data(pg)['history'][2]['dispatch']['verified'] is True and data(pg)['cases']['fire']['published'] is True
 snapshot=data(pg);invalid=dict(snapshot);invalid['status']=['playing'];path=out/'malformed-enum.json';path.write_text(json.dumps(invalid,ensure_ascii=False))
 tap(pg,'Настройки игры')
 with pg.expect_file_chooser() as chooser:tap(pg,'Загрузить сохранение')
 chooser.value.set_files(str(path));pg.get_by_text('Этот файл не является совместимым сохранением мобильной игры.',exact=True).wait_for();assert data(pg)==snapshot
 c.close()
 c2,p2=new_page();damaged='{"format":"media-empire-mobile","broken":'
 p2.add_init_script('localStorage.setItem('+json.dumps(key)+','+json.dumps(damaged)+');')
 load(p2);assert p2.evaluate('(k)=>localStorage.getItem(k+"-recovery")',key)==damaged
 tap(p2,'Настройки игры')
 with p2.expect_download() as download:tap(p2,'Скачать исходное сохранение')
 recovered=out/'recovery.json';download.value.save_as(recovered);assert recovered.read_text()==damaged
 tap(p2,'Звук','switch');assert data(p2)['settings']['sound'] is True;assert p2.evaluate('(k)=>localStorage.getItem(k+"-recovery")',key)==damaged
 c2.close();b.close()
result={'touch_pan':True,'trip_across_publication':True,'restore_excluded_report':True,'carry_report_to_next_issue':True,'malformed_enum_preserves_party':True,'damaged_save_recovery_download':True,'errors':errors,'bad_resources':bad}
(out/'regression-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False,indent=2));assert not errors,errors;assert not bad,bad
