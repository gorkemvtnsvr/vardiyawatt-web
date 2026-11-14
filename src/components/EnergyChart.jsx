import { useState } from 'react';
import { format } from '../lib/model.mjs';

const series = [
  { key: 'actual', label: 'Gerçek tüketim', color: '#315d4d' },
  { key: 'prediction', label: 'Model tahmini', color: '#91ad65' },
  { key: 'baseline', label: 'Son ölçüm referansı', color: '#c69a62' },
];

export default function EnergyChart({ data }) {
  const [hours, setHours] = useState(48);
  const [visible, setVisible] = useState(['actual', 'prediction']);
  const [active, setActive] = useState(null);
  const n = hours * 4;
  const w = 900, h = 282, left = 43, right = 13, top = 12, bottom = 32;
  const x = i => left + i / (n - 1) * (w - left - right);
  const y = v => h - bottom - Math.min(v, 120) / 120 * (h - top - bottom);
  const path = key => data[key].slice(0, n).map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(' ');
  const toggle = key => setVisible(current => current.includes(key) ? (current.length > 1 ? current.filter(k => k !== key) : current) : [...current, key]);
  return <section className="chart-panel panel" aria-labelledby="chart-title">
    <div className="panel-heading"><div><h2 id="chart-title">Tüketimin ritmi</h2><p>Modelin ayrılmış test verisindeki davranışı</p></div>
      <div className="segmented" aria-label="Grafik süresi">{[24, 48].map(value => <button key={value} aria-pressed={hours === value} onClick={() => {setHours(value); setActive(null);}}>{value} saat</button>)}</div>
    </div>
    <div className="chart-legend">{series.map(s => <button key={s.key} onClick={() => toggle(s.key)} aria-pressed={visible.includes(s.key)} style={{ opacity: visible.includes(s.key) ? 1 : .4 }}><i style={{background:s.color}} />{s.label}</button>)}</div>
    <div className="chart-wrap" onMouseLeave={() => setActive(null)}>
      <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`Testin ilk ${hours} saatinde gerçek ve tahmini 15 dakikalık enerji tüketimi, kWh`} onMouseMove={event => {const rect=event.currentTarget.getBoundingClientRect(); const svgX=(event.clientX-rect.left)/rect.width*w;setActive(Math.max(0,Math.min(n-1,Math.round((svgX-left)/(w-left-right)*(n-1)))));}}>
        <defs><linearGradient id="energy-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#9bb88b" stopOpacity=".25"/><stop offset="100%" stopColor="#9bb88b" stopOpacity="0"/></linearGradient></defs>
        {[0,30,60,90,120].map(tick => <g key={tick}><line x1={left} x2={w-right} y1={y(tick)} y2={y(tick)} stroke="#e9ece7" strokeDasharray="3 5"/><text x={left-12} y={y(tick)+4} textAnchor="end">{tick}</text></g>)}
        {visible.includes('actual') && <path d={`${path('actual')}L${x(n-1)},${y(0)}L${x(0)},${y(0)}Z`} fill="url(#energy-fill)"/>}
        {series.filter(s=>visible.includes(s.key)).map(s=><path key={s.key} d={path(s.key)} fill="none" stroke={s.color} strokeWidth={s.key==='actual'?2.5:2} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.key==='baseline'?'4 4':undefined}/>)}
        {Array.from({length:7},(_,i)=>Math.round(i*hours/6)).map(hour=><text key={hour} x={left+hour/hours*(w-left-right)} y={h-8} textAnchor="middle">{hour} sa</text>)}
        {active!==null&&<g><line x1={x(active)} x2={x(active)} y1={top} y2={h-bottom} stroke="#7b8a80" strokeDasharray="3 3"/>{series.filter(s=>visible.includes(s.key)).map(s=><circle key={s.key} cx={x(active)} cy={y(data[s.key][active])} r="4" fill={s.color} stroke="white" strokeWidth="2"/>)}</g>}
      </svg>
      {active!==null&&<div className="chart-tooltip"><strong>{format(active/4,2)} saat sonrası</strong>{series.filter(s=>visible.includes(s.key)).map(s=><span key={s.key}><i style={{background:s.color}}/>{s.label}<b>{format(data[s.key][active])} kWh</b></span>)}</div>}
    </div>
    <div className="chart-caption"><span>Enerji · kWh / 15 dk</span><span>Test başlangıcı: 20 Ekim 2018, 05.00</span></div>
  </section>;
}
