from pathlib import Path
from playwright.sync_api import sync_playwright
import os,json,re
out=Path(os.environ.get('QA_OUTPUT_DIR','test-results'));out.mkdir(parents=True,exist_ok=True);errors=[];bad=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--host-resolver-rules=MAP terminal.local 127.0.0.1'],env={**os.environ,'XDG_CONFIG_HOME':str(out/'config-offline'),'XDG_CACHE_HOME':str(out/'cache-offline')})
 c=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1)
 page=c.new_page();page.on('pageerror',lambda e:errors.append(str(e)));page.on('response',lambda r:bad.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
 response=page.goto(os.environ.get('GAME_URL','http://127.0.0.1:4174/'),wait_until='networkidle');assert response.status==200;page.locator('canvas').wait_for(state='visible');page.locator('.city-loading').wait_for(state='hidden');page.evaluate('document.fonts.ready');page.wait_for_function('navigator.serviceWorker.controller!==null')
 page.screenshot(path=str(out/'13-production-city.png'))
 print(json.dumps({'cache':page.evaluate('async()=>{const keys=await caches.keys();return {names:keys,files:(await (await caches.open(keys[0])).keys()).length}}')},ensure_ascii=False))
 c.set_offline(True);page.reload(wait_until='networkidle');page.locator('canvas').wait_for(state='visible');page.locator('.city-loading').wait_for(state='hidden');page.evaluate('document.fonts.ready');page.screenshot(path=str(out/'14-offline-city.png'))
 page.locator('body').aria_snapshot();page.get_by_role('button',name='Развернуть макет газеты',exact=True).tap();assert page.locator('.paper-headline').is_visible();page.locator('body').aria_snapshot();page.get_by_role('button',name='Закрыть окно',exact=True).tap()
 page.locator('body').aria_snapshot();page.get_by_role('button',name='Редакция',exact=True).tap();page.locator('body').aria_snapshot();page.get_by_role('button',name='Выпустить номер',exact=True).tap();page.get_by_role('heading',name='Номер вышел!',exact=True).wait_for();assert page.evaluate('JSON.parse(localStorage.getItem("media-empire-mobile-v1")).week')==2
 page.screenshot(path=str(out/'15-offline-report.png'));page.reload(wait_until='networkidle');page.locator('canvas').wait_for(state='visible');page.locator('.city-loading').wait_for(state='hidden');assert page.evaluate('JSON.parse(localStorage.getItem("media-empire-mobile-v1")).history.length')==1
 result={'offline_reload':True,'offline_paper':True,'offline_publication_and_restore':True,'errors':errors,'bad_resources':bad};(out/'offline-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False))
 b.close()

assert not errors, errors
assert not bad, bad
