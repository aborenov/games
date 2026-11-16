import { BELFORD } from '../world/belford';
import { ArrowLeft, ArrowUpRight, CheckCircle, NewspaperClipping } from '@phosphor-icons/react';
import { money, number, price, weekDate } from '../game/content';
import type { Issue } from '../game/types';
import { Sheet } from './Sheet';

export function Newspaper({ issue, draft, onClose, onEditor }: {
  issue: Issue; draft: boolean; onClose: () => void; onEditor: () => void;
}) {
  const fire = issue.dispatch?.id === 'fire' || issue.stories[issue.lead].toLowerCase().includes('пожар');
  const others = issue.selected.filter(id => id !== issue.lead).slice(0, 3);
  return <Sheet title={draft ? 'Первая полоса' : 'Выпуск №' + String(issue.week).padStart(3, '0')}
    eyebrow={draft ? 'МАКЕТ · ЕЩЁ НЕ ОПУБЛИКОВАН' : 'ОПУБЛИКОВАННЫЙ НОМЕР'} onClose={onClose} className="paper-sheet">
    <article className="newspaper-unfold" aria-label={draft ? 'Макет первой полосы' : 'Опубликованная первая полоса'}>
      <div className="paper-topline"><span>НЕЗАВИСИМАЯ ГОРОДСКАЯ ГАЗЕТА</span><span>БЕЛФОРД · 1900</span></div>
      <h1 className="paper-masthead">Городской<br />вестник</h1>
      <div className="paper-dateline"><span>Суббота, {weekDate(issue.week)}</span><span>№{String(issue.week).padStart(3, '0')}</span><span>{price(issue.price)}</span></div>
      <h2 className="paper-headline">{issue.stories[issue.lead]}</h2>
      <p className="paper-standfirst">{issue.dispatch?.verified ? 'Два источника. Одна история, которую узнает город.' : 'Городские события, люди и решения, которые меняют нашу жизнь.'}</p>
      <figure className="paper-hero"><img src={fire ? '/assets/fire-report.webp' : BELFORD.background} alt={fire ? 'Пожарные и корреспондент у текстильной фабрики Белфорда' : 'Исторические улицы и редакция Белфорда'} /><figcaption>С места событий · корреспонденты «Городского вестника»</figcaption></figure>
      {issue.dispatch?.verified && <p className="paper-proof"><CheckCircle size={20} weight="duotone" /> Факты проверены редакцией</p>}
      <p className="paper-body">{fire ? 'Редакция сопоставила рассказы очевидцев и свидетельства с места пожара. Горожане ждут открытых ответов: что произошло на фабрике и какие меры помогут защитить людей. Мы продолжим следить за этой историей.' : 'Наши корреспонденты прошли по улицам Белфорда, поговорили с жителями и собрали главные новости недели. За каждым городским решением стоят живые люди. Мы даём им возможность быть услышанными.'}</p>
      <div className="paper-secondary">{others.map(id => <section key={id}><h3>{issue.stories[id]}</h3><p>Факты, голоса жителей и взгляд редакции на то, что происходит рядом.</p></section>)}</div>
      <p className="paper-signature">ГОРОДСКОЙ ВЕСТНИК · ЧИТАЙТЕ НАС КАЖДУЮ СУББОТУ</p>
    </article>
    <div className="paper-details"><NewspaperClipping size={24} /><div><strong>{draft ? 'План: ' : 'Напечатано: '}{number(issue.printed)} экземпляров</strong><span>{draft ? 'Перед печатью вы можете изменить материалы и тираж.' : 'Продано ' + number(issue.sold) + ' · прибыль ' + money(issue.profit)}</span></div></div>
    <button className="primary-button" onClick={draft ? onEditor : onClose}>{draft ? 'Перейти к вёрстке' : 'Вернуться в город'}{draft ? <ArrowUpRight size={20} /> : <ArrowLeft size={20} />}</button>
  </Sheet>;
}
