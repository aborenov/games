from pathlib import Path
from playwright.sync_api import sync_playwright
import os,json,re
out=Path(os.environ.get('QA_OUTPUT_DIR','test-results/offline'));out.mkdir(parents=True,exist_ok=True)
url=os.environ.get('GAME_URL','http://127.0.0.1:4174/');errors=[];result={}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--no-proxy-server','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],env={**os.environ,'XDG_CONFIG_HOME':str(out/'config'),'XDG_CACHE_HOME':str(out/'cache')})
 c=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=1);page=c.new_page();page.set_default_timeout(20000);page.on('pageerror',lambda e:errors.append(str(e)))
 def ready():page.locator('[data-testid=city-canvas][data-city-ready=true]').wait_for()
 def tap(name):
  page.locator('body').aria_snapshot();scope=page.get_by_role('navigation',name='Разделы игры') if isinstance(name,str) and name in ['Город','Темы','Редакция','Газета'] else page;scope.get_by_role('button',name=name,exact=True).tap();page.locator('body').aria_snapshot()
 page.goto(url,wait_until='networkidle');ready();page.evaluate('navigator.serviceWorker.ready');page.wait_for_function('navigator.serviceWorker.controller!==null')
 c.set_offline(True);page.reload(wait_until='networkidle');ready();result['offline_world']=True
 tap('Темы');page.get_by_role('button',name=re.compile('^Тема:')).first.tap();tap('Проверить факты');page.get_by_role('heading',name='Материал готов',exact=True).wait_for();tap('Закрыть');tap('Редакция');tap('Напечатать номер');page.get_by_role('heading',name='Номер в городе',exact=True).wait_for();result['offline_publication']=True
 tap('Читать газету');page.locator('.paper-page img').wait_for();assert page.locator('.paper-page img').evaluate('el=>el.complete&&el.naturalWidth>0');page.screenshot(path=str(out/'offline-paper.png'),animations='disabled');result['offline_illustrations_and_paper']=True
 page.reload(wait_until='networkidle');ready();state=page.evaluate('JSON.parse(localStorage.getItem("first-page-v2"))');assert state['day']==2 and len(state['history'])==1 and state['world']['factory']=='closed';result['offline_party_restore']=True
 page.screenshot(path=str(out/'offline-city.png'),animations='disabled');result['errors']=errors;(out/'results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False));c.close();b.close();assert not errors,errors
