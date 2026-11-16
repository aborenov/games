import {ArrowRight,MapPin,Buildings} from '@phosphor-icons/react';
import type {CityDefinition} from '../world/types';
export function CityPlan({city,onFocus}:{city:CityDefinition;onFocus:(id:string)=>void}){
  return <div className="city-plan"><p className="body-copy">Двигайте карту и приближайте кварталы. Выберите место — камера перенесёт вас к нужному зданию.</p>
    <h3>Газетное дело</h3>{Object.entries(city.landmarks).map(([id,p])=><button className="city-plan-row" key={id} onClick={()=>onFocus(id)}><MapPin size={22}/><span><strong>{p.title}</strong><small>Показать на карте</small></span><ArrowRight size={18}/></button>)}
    <h3>Город, бизнес и власть</h3>{city.places.map(p=><button className="city-plan-row" key={p.id} onClick={()=>onFocus(p.id)}><Buildings size={22}/><span><strong>{p.title}</strong><small>{p.district}</small></span><ArrowRight size={18}/></button>)}
  </div>;
}
export function CityPlacePanel({city,id,onEditor}:{city:CityDefinition;id:string;onEditor:()=>void}){
  const place=city.places.find(p=>p.id===id);if(!place)return null;
  return <div className="city-place-panel"><p className="eyebrow">КТО УПРАВЛЯЕТ</p><h3>{place.owner}</h3><p className="body-copy">{place.role}</p>
    <h3>Связь с редакцией</h3><p className="body-copy">{place.media}</p>
    <h3>Рекламные площадки</h3><p className="body-copy">{place.advertising}</p>
    <button className="primary-button" onClick={onEditor}>Подготовить номер<ArrowRight size={20}/></button>
  </div>;
}
