import { memo, useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { Check, Hammer, LockKey, MagnifyingGlassMinus, MagnifyingGlassPlus, NewspaperClipping, Target } from '@phosphor-icons/react';
import { bankIsOpen } from '../game/model';
import type { BuildingId, GameState } from '../game/types';
import { CityScene, LANDMARKS } from '../scene/CityScene';
import type { Transform } from '../scene/CityScene';

export const CityMap = memo(function CityMap({ state, onBuilding }: {
  state: GameState; onBuilding: (id: BuildingId) => void;
}) {
  const host = useRef<HTMLDivElement>(null), scene = useRef<CityScene | null>(null);
  const initialState = useRef(state), onBuildingRef = useRef(onBuilding);
  onBuildingRef.current = onBuilding;
  const [transform, setTransform] = useState<Transform | null>(null);
  const [loaded, setLoaded] = useState(false), [error, setError] = useState('');
  useEffect(() => {
    if (!host.current) return;
    const next = new CityScene(initialState.current, { ready: () => setLoaded(true), transform: setTransform,
      building: id => onBuildingRef.current(id), fail: setError });
    scene.current = next;
    const game = new Phaser.Game({
      type: Phaser.AUTO, parent: host.current, transparent: true,
      width: host.current.clientWidth || 390, height: host.current.clientHeight || 844,
      scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.NO_CENTER },
      render: { antialias: true, roundPixels: false, powerPreference: 'low-power' },
      input: { activePointers: 3, mouse: { preventDefaultWheel: true } },
      fps: { target: 60, forceSetTimeOut: false },
      scene: [next], banner: false,
    });
    return () => { game.destroy(true); scene.current = null; };
  }, []);
  useEffect(() => { scene.current?.syncState(state); }, [state]);

  const position = (id: BuildingId) => {
    const p = LANDMARKS[id];
    if (!transform) return { left: (p.x * 100) + '%', top: (p.y * 100) + '%' };
    const left = p.x * transform.worldWidth * transform.zoom - transform.x * transform.zoom;
    const top = p.y * transform.worldHeight * transform.zoom - transform.y * transform.zoom;
    return { left: id === 'lot' ? Math.max(86, Math.min(transform.width - 86, left)) : left, top,
      visibility: left < -30 || left > transform.width + 30 || top < 35 || top > transform.height - 65 ? 'hidden' as const : 'visible' as const };
  };
  const press = state.city.press.status;
  const kiosk = state.city.kiosk.status;
  return <div className="city-layer" aria-label="Интерактивный Белфорд">
    <div className="phaser-host" ref={host} data-testid="city-engine" />
    {!loaded && <div className="city-loading"><NewspaperClipping size={32} /><span>{error || 'Белфорд просыпается…'}</span>{error && <button onClick={() => location.reload()}>Попробовать снова</button>}</div>}
    {loaded && <div className="city-hotspots">
      <button className="landmark newsroom-pin" style={position('newsroom')} onClick={() => onBuilding('newsroom')} aria-label="Открыть редакцию"><NewspaperClipping size={22} weight="duotone" /></button>
      <button className={'landmark status-pin ' + (bankIsOpen(state) ? 'open' : 'closed')} style={position('bank')} onClick={() => onBuilding('bank')} aria-label={'Банк — ' + (bankIsOpen(state) ? 'открыт' : 'закрыт')}><span className="pin-plate">{bankIsOpen(state) ? <Check size={14} /> : <LockKey size={14} />}<span>{bankIsOpen(state) ? 'Открыт' : 'Закрыт'}</span></span></button>
      <button className={'landmark status-pin ' + (press === 'open' ? 'open' : press === 'building' ? 'construction' : 'closed')} style={position('press')} onClick={() => onBuilding('press')} aria-label={'Типография — ' + (press === 'open' ? 'работает' : press === 'building' ? 'восстанавливается' : 'закрыта')}><span className="pin-plate">{press === 'open' ? <Check size={14} /> : press === 'building' ? <Hammer size={14} /> : <LockKey size={14} />}<span>{press === 'open' ? 'Работает' : press === 'building' ? 'Стройка' : 'Закрыто'}</span></span></button>
      <button className={'landmark lot-pin ' + (kiosk === 'open' ? 'open' : '')} style={position('lot')} onClick={() => onBuilding('lot')} aria-label={kiosk === 'open' ? 'Ваш газетный киоск' : 'Свободный участок — построить киоск'}><span className="pin-plate"><Hammer size={14} /><span>{kiosk === 'open' ? 'Ваш киоск' : kiosk === 'building' ? 'Строительство' : 'Свободный участок'}</span></span></button>
      <button className="landmark market-zone" style={position('market')} onClick={() => onBuilding('market')} aria-label="Центральный рынок — читатели и сбыт" />
    </div>}
    <div className="camera-tools" aria-label="Камера города">
      <button aria-label="Отдалить карту" onClick={() => scene.current?.zoomBy(.82)}><MagnifyingGlassMinus size={18} /></button>
      <button aria-label="Приблизить карту" onClick={() => scene.current?.zoomBy(1.2)}><MagnifyingGlassPlus size={18} /></button>
      <button aria-label="Вернуть камеру" onClick={() => scene.current?.resetView()}><Target size={18} /></button>
    </div>
  </div>;
});
