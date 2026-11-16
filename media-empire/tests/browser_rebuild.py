from pathlib import Path
from playwright.sync_api import sync_playwright
import os,json,re
out=Path(os.environ.get('QA_OUTPUT_DIR','test-results/rebuild'));out.mkdir(parents=True,exist_ok=True)
url=os.environ.get('GAME_URL','http://127.0.0.1:4173/');errors=[];bad=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--no-proxy-server','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],env={**os.environ,'XDG_CONFIG_HOME':str(out/'config'),'XDG_CACHE_HOME':str(out/'cache')})
 c=b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=1,accept_downloads=True,record_video_dir=str(out/'video') if os.environ.get('RECORD_VIDEO')=='1' else None,record_video_size={'width':390,'height':844})
 pg=c.new_page();pg.set_default_timeout(10000);pg.on('pageerror',lambda e:errors.append(str(e)));pg.on('response',lambda r:bad.append({'url':r.url,'status':r.status}) if r.status>=400 else None)
 pg.goto(url,wait_until='networkidle')
 pg.get_by_role('heading',name='Первая полоса',exact=True).wait_for()
 pg.locator('[data-city-ready=true]').wait_for();pg.evaluate('document.fonts.ready')
 def tap(name,exact=True):
  pg.locator('body').aria_snapshot();scope=pg.get_by_role('navigation',name='Разделы игры') if isinstance(name,str) and name in ['Город','Темы','Редакция','Газета'] else pg;scope.get_by_role('button',name=name,exact=exact).tap();pg.locator('body').aria_snapshot()
 def shot(name):pg.wait_for_timeout(450);pg.screenshot(path=str(out/(name+'.png')),animations='disabled')
 shot('01-world')
 if os.environ.get('RECORD_VIDEO')=='1':
  pg.wait_for_timeout(1800);tap('Повернуть город');pg.wait_for_timeout(900);tap('Вернуть обзор');pg.wait_for_timeout(700)
 tap('Темы');pg.get_by_role('button',name=re.compile('^Тема:')).first.tap();tap('Проверить факты');pg.get_by_text('Материал готов',exact=True).wait_for();shot('02-first-story')
 tap('Закрыть');tap('Редакция');pg.get_by_role('button',name='Напечатать номер',exact=True).wait_for();shot('03-composer')
 tap('Напечатать номер');pg.get_by_role('heading',name='Номер в городе',exact=True).wait_for();shot('04-result')
 tap('Смотреть город');pg.get_by_role('button',name='Фабрика остановлена',exact=True).wait_for();shot('06-world-consequence');tap('Газета');pg.locator('.paper-page').wait_for();shot('05-paper')
 assert not errors,errors;assert not bad,bad
 result={'new_world':True,'report_to_publication':True,'errors':errors,'bad_resources':bad};(out/'results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False));video=pg.video;c.close();
 if video:video.save_as(str(out/'gameplay.webm'))
 b.close()
