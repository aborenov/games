from pathlib import Path
from playwright.sync_api import sync_playwright
import os,json
out=Path(os.environ.get('QA_OUTPUT_DIR','test-results/boundaries'));out.mkdir(parents=True,exist_ok=True);url=os.environ.get('GAME_URL','http://127.0.0.1:4173/');results={};failures={}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--no-proxy-server','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],env={**os.environ,'XDG_CONFIG_HOME':str(out/'config'),'XDG_CACHE_HOME':str(out/'cache')})
 def setup(script=None,ready=True):
  c=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=1)
  if script:c.add_init_script(script)
  pg=c.new_page();pg.set_default_timeout(10000);pg.goto(url,wait_until='networkidle');pg.get_by_role('heading',name='Первая полоса',exact=True).wait_for()
  if ready:pg.locator('[data-city-ready=true]').wait_for()
  return c,pg
 def tap(pg,name,role='button'):
  pg.locator('body').aria_snapshot();scope=pg.get_by_role('navigation',name='Разделы игры') if name in ['Город','Темы','Редакция','Газета'] else pg;scope.get_by_role(role,name=name,exact=True).tap();pg.locator('body').aria_snapshot()
 def pose(pg):return pg.evaluate('window.__cityEngine.diagnostics().camera')
 def freeze(pg):tap(pg,'Настройки');tap(pg,'Движение города',role='switch');tap(pg,'Закрыть')
 def run(name,fn):
  try:fn();results[name]=True
  except Exception as e:failures[name]=str(e)[-1300:]
  finally:
   for context in b.contexts:context.close()
 def marker_drag():
  c,pg=setup();freeze(pg);marker=pg.locator('.city-marker[data-place=newsroom]');marker.hover();r=marker.locator('.city-marker-icon').bounding_box();x=r['x']+r['width']/2;y=r['y']+r['height']/2;before=pose(pg)
  pg.mouse.move(x,y);pg.mouse.down();pg.mouse.move(x+12,y+8,steps=4);pg.mouse.up();pg.wait_for_timeout(150)
  assert pg.locator('dialog[open]').count()==0,'drag on marker selected a building'
  after=pose(pg);assert abs(after['x']-before['x'])+abs(after['z']-before['z'])>.05,'marker drag did not pan';c.close()
 def marker_pinch():
  c,pg=setup();freeze(pg);r=pg.locator('.city-marker[data-place=newsroom] .city-marker-icon').bounding_box();x=r['x']+17;y=r['y']+17;before=pose(pg)['zoom'];s=c.new_cdp_session(pg)
  s.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y,'id':1},{'x':x+70,'y':y+65,'id':2}]});s.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x-30,'y':y-20,'id':1},{'x':x+105,'y':y+95,'id':2}]});s.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});pg.wait_for_timeout(150)
  assert pose(pg)['zoom']>before*1.15,'mixed marker/canvas pinch did not zoom';assert pg.locator('dialog[open]').count()==0;c.close()
 def keyboard_marker():
  c,pg=setup();marker=pg.locator('.city-marker[data-place=newsroom]');marker.focus();pg.keyboard.press('Enter');pg.get_by_role('heading',name='Соберите завтрашний номер',exact=True).wait_for();assert pg.locator('dialog[open]').count()==1;c.close()
 def stale_reset():
  c,a=setup();bpg=c.new_page();bpg.goto(url,wait_until='networkidle');bpg.locator('[data-city-ready=true]').wait_for();tap(a,'Настройки');tap(a,'Начать новую партию');tap(bpg,'Настройки');tap(bpg,'Начать новую партию');tap(bpg,'Начать новую партию');new=bpg.evaluate('localStorage.getItem("first-page-v2")');tap(a,'Начать новую партию');assert a.evaluate('localStorage.getItem("first-page-v2")')==new,'stale confirmation overwrote newer campaign';c.close()
 def stale_import():
  c,a=setup();bpg=c.new_page();bpg.goto(url,wait_until='networkidle');bpg.locator('[data-city-ready=true]').wait_for();raw=a.evaluate('localStorage.getItem("first-page-v2")');save=out/'old-party.json';save.write_text(raw)
  a.evaluate('''()=>{const read=File.prototype.text;File.prototype.text=function(){return read.call(this).then(text=>new Promise(resolve=>{window.finishFileRead=()=>resolve(text)}))}}''')
  tap(a,'Настройки')
  with a.expect_file_chooser() as f:tap(a,'Загрузить')
  f.value.set_files(str(save));a.wait_for_function('typeof window.finishFileRead==="function"')
  tap(bpg,'Настройки');tap(bpg,'Звук',role='switch');new=bpg.evaluate('localStorage.getItem("first-page-v2")');a.evaluate('window.finishFileRead()');a.wait_for_timeout(300)
  assert a.evaluate('localStorage.getItem("first-page-v2")')==new,'pending import overwrote a newer revision';c.close()
 def storage_denied():
  c,pg=setup("const get=Storage.prototype.getItem,set=Storage.prototype.setItem;Storage.prototype.getItem=function(k){if(k.startsWith('first-page')||k==='media-empire-mobile-v1')throw new DOMException('Denied','SecurityError');return get.call(this,k)};Storage.prototype.setItem=function(k,v){if(k.startsWith('first-page')||k==='media-empire-mobile-v1')throw new DOMException('Denied','SecurityError');return set.call(this,k,v)}")
  tap(pg,'Темы');pg.locator('.lead-card').first.tap();tap(pg,'Проверить факты');pg.get_by_role('heading',name='Материал готов',exact=True).wait_for();assert pg.evaluate('window.__firstPage.stories.length')==1;assert pg.get_by_text('Сохранение изменилось. Сначала загрузите актуальную партию.',exact=True).count()==0;c.close()
 def no_webgl():
  c,pg=setup("const gc=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.includes('webgl')?null:gc.call(this,type,...args)}",False)
  pg.get_by_text('Не удалось открыть город',exact=True).wait_for();tap(pg,'Бизнес и развитие');pg.get_by_role('heading',name='Газета становится делом',exact=True).wait_for();tap(pg,'Закрыть');tap(pg,'Места в городе');pg.get_by_role('heading',name='Места в городе',exact=True).wait_for();c.close()
 def corrupt_recovery():
  c,pg=setup("if(!localStorage.getItem('boundary-seeded')){localStorage.setItem('first-page-v2','{corrupt-original');localStorage.setItem('boundary-seeded','1')}")
  tap(pg,'Настройки');tap(pg,'Начать новую партию');tap(pg,'Начать новую партию');assert pg.evaluate('JSON.parse(localStorage.getItem("first-page-v2")).day')==1;assert pg.evaluate('localStorage.getItem("first-page-v2-backup")')=='{corrupt-original';c.close()
 for name,fn in [('marker_drag',marker_drag),('marker_pinch',marker_pinch),('keyboard_marker',keyboard_marker),('stale_reset',stale_reset),('stale_import',stale_import),('storage_denied',storage_denied),('no_webgl',no_webgl),('corrupt_recovery',corrupt_recovery)]:
  if not os.environ.get('CASES') or name in os.environ['CASES'].split(','):run(name,fn)
 b.close()
(out/'results.json').write_text(json.dumps({'passed':results,'failures':failures},ensure_ascii=False,indent=2));print(json.dumps({'passed':results,'failures':failures},ensure_ascii=False));assert not failures,failures
