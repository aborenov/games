from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image,ImageChops
import os,json
out=Path(os.environ.get('QA_OUTPUT_DIR','test-results/world'));out.mkdir(parents=True,exist_ok=True)
url=os.environ.get('GAME_URL','http://terminal.local:4173/');errors=[];results={}
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox','--no-proxy-server','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--host-resolver-rules=MAP terminal.local 127.0.0.1'],env={**os.environ,'XDG_CONFIG_HOME':str(out/'config'),'XDG_CACHE_HOME':str(out/'cache')})
 c=b.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1,record_video_dir=str(out/'video') if os.environ.get('RECORD_VIDEO')=='1' else None,record_video_size={'width':390,'height':844})
 pg=c.new_page();pg.set_default_timeout(15000);pg.on('pageerror',lambda e:errors.append(str(e)));pg.on('console',lambda e:errors.append(e.text) if e.type=='error' else None)
 response=pg.goto(url,wait_until='networkidle');assert response.status==200;pg.locator('.city-loading').wait_for(state='hidden');pg.locator('canvas').wait_for();pg.evaluate('document.fonts.ready')
 engine=pg.locator('[data-testid="city-engine"]')
 def center():return engine.evaluate('el=>{let c=el.cityScene.cameras.main;return c.getWorldPoint(c.width/2,c.height/2).x}')
 def tap(name,role='button'):
  pg.locator('body').aria_snapshot();pg.get_by_role(role,name=name,exact=True).tap()
 home=center();engine.evaluate('el=>{el.cityScene.focusPlace("bank");el.cityScene.resetView()}');pg.wait_for_timeout(750)
 assert abs(center()-home)<1,('reset overridden by focus',home,center())
 results['focus_reset_interrupts']=True
 engine.evaluate('el=>{let s=el.cityScene;s.focusPlace("bank");s.syncState({...s.state,settings:{...s.state.settings,motion:false}})}')
 frozen=center();pg.wait_for_timeout(750);assert abs(center()-frozen)<1
 engine.evaluate('el=>{let s=el.cityScene;s.syncState({...s.state,settings:{...s.state.settings,motion:true}});s.focusPlace("bank");s.focusPlace("harbour")}')
 pg.wait_for_timeout(750);assert center()<400
 results['motion_disable_and_second_focus']=True
 tap('Вернуть камеру');pg.wait_for_timeout(650);pg.screenshot(path=str(out/'city.png'))
 # Actual frames visibly change, then every actor freezes under the user setting.
 pg.screenshot(path=str(out/'moving-a.png'));pg.wait_for_timeout(600);pg.screenshot(path=str(out/'moving-b.png'))
 assert ImageChops.difference(Image.open(out/'moving-a.png').convert('RGB'),Image.open(out/'moving-b.png').convert('RGB')).getbbox()
 tap('Настройки игры');tap('Анимация города','switch');tap('Закрыть окно');pg.wait_for_timeout(350)
 pg.screenshot(path=str(out/'still-a.png'));pg.wait_for_timeout(650);pg.screenshot(path=str(out/'still-b.png'))
 assert not ImageChops.difference(Image.open(out/'still-a.png').convert('RGB'),Image.open(out/'still-b.png').convert('RGB')).getbbox()
 results['moving_frames_and_full_pause']=True
 tap('Настройки игры');tap('Анимация города','switch');tap('Закрыть окно')
 tap('План города');pg.locator('body').aria_snapshot();pg.locator('.city-plan-row').filter(has_text='Ратуша').tap()
 pg.get_by_role('button',name='Открыть: Ратуша',exact=True).wait_for(state='visible');pg.wait_for_timeout(600);pg.screenshot(path=str(out/'townhall.png'));tap('Открыть: Ратуша')
 assert 'Мэр Виктор Ланской' in pg.locator('dialog[open]').inner_text();pg.screenshot(path=str(out/'townhall-card.png'));tap('Закрыть окно')
 tap('План города');pg.locator('body').aria_snapshot();pg.locator('.city-plan-row').filter(has_text='фабрика').tap()
 pg.get_by_role('button',name='Открыть: Текстильная фабрика',exact=True).wait_for(state='visible');pg.wait_for_timeout(600);tap('Открыть: Текстильная фабрика')
 assert 'Рабочие места' in pg.locator('dialog[open]').inner_text();pg.screenshot(path=str(out/'factory-card.png'));tap('Закрыть окно')
 tap('План города');pg.locator('body').aria_snapshot();pg.locator('.city-plan-row').filter(has_text='Набережная').tap();pg.wait_for_timeout(900);pg.screenshot(path=str(out/'river.png'))
 pg.wait_for_timeout(4500)
 results['plan_and_place_cards']=True
 results['errors']=errors
 video=pg.video;c.close();
 if video:video.save_as(str(out/'city-motion.webm'))
 b.close()
(out/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print(json.dumps(results,ensure_ascii=False));assert not errors,errors
