import { useEffect, useState } from 'react';
import { Activity, ArrowDownToLine, ArrowRight, ArrowUpRight, BarChart3, BookOpen, Check, CheckCircle2, ChevronRight, CircleHelp, Database, ExternalLink, FileText, FlaskConical, Gauge, Info, Layers3, Leaf, Menu, Plus, Save, ShieldCheck, SlidersHorizontal, Trash2, TrendingUp, TriangleAlert, X, Zap } from 'lucide-react';
import model from './data/model.json';
import testData from './data/test-sample.json';
import EnergyChart from './components/EnergyChart.jsx';
import { PRESETS, format, formatTime, predict, readRecords, recordsCsv } from './lib/model.mjs';

const STORAGE_KEY = 'vardiyawatt.scenarios.v1';
const links = [
  { id: 'tahmin', label: 'Tahmin merkezi', Icon: Gauge },
  { id: 'senaryolar', label: 'Senaryolarım', Icon: Layers3 },
  { id: 'model', label: 'Model ve veri', Icon: BarChart3 },
  { id: 'rehber', label: 'Nasıl çalışır?', Icon: BookOpen },
];
const initialPage = () => links.some(link => link.id === location.hash.slice(1)) ? location.hash.slice(1) : 'tahmin';
const M = model.metrics['Doğrusal regresyon'];
const B = model.metrics['Son ölçüm referansı'];

function initialRecords() {
  try { return { records: readRecords(localStorage.getItem(STORAGE_KEY)), error: '' }; }
  catch { return { records: [], error: 'Tarayıcı kayıtları okunamadı. Yeni bir çalışma alanı açıldı.' }; }
}
function download(name, text, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = name;
  document.body.appendChild(anchor); anchor.click(); anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function Status({ over }) {
  return <span className={`status ${over ? 'status-warn' : 'status-ok'}`}>{over ? <TriangleAlert size={13}/> : <CheckCircle2 size={13}/>} {over ? 'Bütçe aşımı' : 'Bütçe altında'}</span>;
}
function Field({ label, name, value, onChange, time = false, help }) {
  return <label className={`field ${time ? 'field-full' : ''}`}><span>{label}</span><div className="input-wrap"><input name={name} value={value} onChange={event => onChange(name, event.target.value)} type={time ? 'datetime-local' : 'text'} inputMode={time ? undefined : 'decimal'} step={time ? 900 : undefined} required aria-describedby={help ? `${name}-help` : undefined}/>{!time && <span>kWh</span>}</div>{help && <small id={`${name}-help`}>{help}</small>}</label>;
}

export default function App() {
  const [page, setPage] = useState(initialPage);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [form, setForm] = useState({ ...PRESETS[1] });
  const [result, setResult] = useState(() => predict(PRESETS[1], model));
  const [formError, setFormError] = useState('');
  const [savedInitial] = useState(initialRecords);
  const [records, setRecords] = useState(savedInitial.records);
  const [toast, setToast] = useState(savedInitial.error);
  const [saveOpen, setSaveOpen] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [exportMenu, setExportMenu] = useState(false);

  useEffect(() => { const handler=()=>setPage(initialPage()); window.addEventListener('hashchange',handler); return()=>window.removeEventListener('hashchange',handler); }, []);
  useEffect(() => { if (!toast) return; const timer=setTimeout(()=>setToast(''),4500); return()=>clearTimeout(timer); }, [toast]);
  useEffect(() => { const handler=e=>{if(e.key==='Escape'){setSaveOpen(false);setMobileMenu(false);setExportMenu(false);}};document.addEventListener('keydown',handler);return()=>document.removeEventListener('keydown',handler); },[]);
  const navigate = id => { setPage(id); location.hash=id; setMobileMenu(false); window.scrollTo({top:0,behavior:'instant'}); };
  const changeField = (name, value) => { setForm(current => ({ ...current, [name]: value })); setFormError(''); };
  const calculate = event => { event?.preventDefault(); try { setResult(predict(form,model)); setFormError(''); setToast('Tahmin güncellendi.'); } catch(error) {setFormError(error.message);} };
  const preset = value => {setForm({...value});setResult(predict(value,model));setFormError('');};
  const persist = next => {
    setRecords(next);
    try {localStorage.setItem(STORAGE_KEY,JSON.stringify({version:1,scenarios:next}));return true;}
    catch {setToast('Tarayıcı kayda izin vermedi. Senaryo bu oturumda kullanılabilir.');return false;}
  };
  const openSave = () => {setScenarioName(`Senaryo ${records.length+1}`);setSaveOpen(true);};
  const saveScenario = event => {
    event.preventDefault();const name=scenarioName.trim();
    if (!name || name.length>80) return;
    if(records.length>=50){setToast('En fazla 50 senaryo saklayabilirsiniz. Önce bir kayıt silin.');setSaveOpen(false);return;}
    const ok=persist([{id:crypto.randomUUID(),name,input:result.input},...records]);
    setSaveOpen(false);if(ok)setToast('Senaryo tarayıcınıza kaydedildi.');
  };
  const exportCsv = entries => {try {download('VardiyaWatt_Senaryolar.csv',recordsCsv(entries,model));setToast('CSV dosyası hazırlandı.');} catch {setToast('Kayıt dışa aktarılamadı. Girdileri kontrol edin.');}};
  const restore = record => {setForm({...record.input});setResult(predict(record.input,model));navigate('tahmin');setToast('Senaryo tahmin merkezine yüklendi.');};
  const safeRecords = records.filter(record=>{try{predict(record.input,model);return true;}catch{return false;}});
  const displayed = safeRecords.filter(record=>{
    const r=predict(record.input,model);
    return record.name.toLocaleLowerCase('tr').includes(query.toLocaleLowerCase('tr')) && (filter==='all'||(filter==='over'?r.overBudget:!r.overBudget));
  });
  const currentLink=links.find(link=>link.id===page);
  const edited = ['time','last','hour','day','budget'].some(key=>String(form[key])!==String(result.input[key]));

  return <div className="app-shell">
    <a className="skip-link" href="#main-content">İçeriğe geç</a>
    <aside className={`sidebar ${mobileMenu?'is-open':''}`}>
      <a href="#tahmin" className="brand" onClick={()=>navigate('tahmin')}><span className="brand-mark"><Zap size={23} fill="currentColor"/></span><span>Vardiya<span className="brand-light">Watt</span><small>ENERJİ TAHMİN MERKEZİ</small></span></a>
      <div className="nav-section-label">ÇALIŞMA ALANI</div>
      <nav aria-label="Ana gezinme">{links.map(({id,label,Icon})=><a key={id} href={`#${id}`} onClick={()=>navigate(id)} className={`nav-item ${page===id?'active':''}`} aria-current={page===id?'page':undefined}><Icon size={19}/><span>{label}</span>{id==='senaryolar'&&records.length>0&&<span className="nav-count">{records.length}</span>}{page===id&&<ChevronRight size={14} className="nav-arrow"/>}</a>)}</nav>
      <div className="sidebar-bottom"><div className="local-note"><ShieldCheck size={21}/><strong>Verilerin sende kalır.</strong><p>Senaryoların yalnızca bu tarayıcıda saklanır.</p></div><div className="author"><span className="avatar">GV</span><div><strong>Görkem Vatansever</strong><small>Proje geliştiricisi</small></div></div></div>
    </aside>
    {mobileMenu&&<button className="sidebar-backdrop" aria-label="Menüyü kapat" onClick={()=>setMobileMenu(false)}/>}
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-toggle" aria-label="Menüyü aç" onClick={()=>setMobileMenu(!mobileMenu)}><Menu size={22}/></button><span>Çalışma alanı</span><ChevronRight size={13}/><strong>{currentLink.label}</strong></div><div className="topbar-right"><span className="local-badge"><i/>Tarayıcıda çalışır</span><button className="icon-button" aria-label="Kullanım rehberi" onClick={()=>navigate('rehber')}><CircleHelp size={20}/></button></div></header>
      <main id="main-content">
        {page==='tahmin'&&<>
          <div className="page-heading"><div><div className="eyebrow"><span/>ENERJİYE BİR ADIM ÖNDEN BAK</div><h1>Enerji tahmin merkezi<span>.</span></h1><p>Geçmiş tüketimden sonraki 15 dakikayı planla.</p></div><div className="export-wrap"><button className="button button-secondary" onClick={()=>setExportMenu(!exportMenu)} aria-expanded={exportMenu}><ArrowDownToLine size={16}/>Dışa aktar</button>{exportMenu&&<div className="dropdown"><button onClick={()=>{exportCsv([{id:'current',name:'Mevcut tahmin',input:result.input}]);setExportMenu(false);}}>Mevcut tahmini CSV indir</button><button disabled={!safeRecords.length} onClick={()=>{exportCsv(safeRecords);setExportMenu(false);}}>Tüm senaryoları CSV indir</button></div>}</div></div>
          <div className="stats-grid">
            <section className={`stat stat-primary ${result.overBudget?'stat-over':''}`}><div className="stat-label">SONRAKİ 15 DAKİKA<TrendingUp size={17}/></div><div className="stat-value">{format(result.prediction)}<span>kWh</span></div><div className="stat-foot"><span className="live-dot"/>Doğrusal model tahmini</div></section>
            <section className="stat"><div className="stat-label">DÖNEM BÜTÇESİ<SlidersHorizontal size={17}/></div><div className="stat-value">{format(result.budget)}<span>kWh</span></div><div className="stat-foot">Senin belirlediğin tüketim sınırı</div></section>
            <section className="stat"><div className="stat-label">{result.overBudget?'BEKLENEN AŞIM':'BÜTÇEDE KALAN PAY'}<Leaf size={17}/></div><div className={`stat-value ${result.overBudget?'text-amber':'text-green'}`}>{format(Math.abs(result.remaining))}<span>kWh</span></div><div className="stat-foot"><Status over={result.overBudget}/></div></section>
            <section className="stat"><div className="stat-label">SON ÖLÇÜM REFERANSI<Activity size={17}/></div><div className="stat-value">{format(result.baseline)}<span>kWh</span></div><div className="stat-foot">Son tüketimin devam ettiği varsayımı</div></section>
          </div>
          <div className="workspace-grid"><div className="workspace-left"><EnergyChart data={testData}/><div className="insight-row"><span className="insight-icon"><Info size={20}/></span><div><strong>İyi bir tahmin, iyi bir karşılaştırmayla başlar.</strong><p>Modelin MAE değeri <b>{format(M.MAE_kWh)} kWh</b>, son ölçüm referansınınki <b>{format(B.MAE_kWh)} kWh</b>. Bu testte referansın ortalama mutlak hatası daha düşük.</p></div><button className="text-button" onClick={()=>navigate('model')}>Sonuçları incele<ArrowUpRight size={16}/></button></div></div>
          <section className="forecast-panel panel"><div className="panel-heading"><div><h2>Yeni tahmin</h2><p>Çalışma koşullarını tanımla.</p></div><span className="small-icon"><Zap size={17}/></span></div>
            <div className="preset-label">Bir örnekle başla</div><div className="preset-row">{PRESETS.map(value=><button key={value.short} className={form.time===value.time&&String(form.last)===String(value.last)?'selected':''} onClick={()=>preset(value)}>{value.short}</button>)}</div>
            <form onSubmit={calculate} noValidate><div className="form-grid"><Field label="Hedef tarih ve saat" name="time" value={form.time} onChange={changeField} time/>
              <Field label="Son 15 dakika" name="last" value={form.last} onChange={changeField}/><Field label="1 saat önce" name="hour" value={form.hour} onChange={changeField}/><Field label="24 saat önce" name="day" value={form.day} onChange={changeField}/><Field label="Enerji bütçesi" name="budget" value={form.budget} onChange={changeField}/></div>
              {formError&&<p className="form-error" role="alert"><TriangleAlert size={15}/>{formError}</p>}
              <button type="submit" className="button button-primary calculate-button"><Zap size={16}/>Tahmini hesapla<ArrowRight size={16}/></button>
            </form><button className="button button-save" onClick={openSave} disabled={edited}><Save size={16}/>Senaryoyu kaydet</button>
            {edited&&<p className="form-hint">Kaydetmeden önce yeni girdilerle tahmini hesapla.</p>}
            {result.outside&&<p className="form-error"><TriangleAlert size={15}/>Girdiler eğitim aralığının dışında. Tahmin daha belirsiz olabilir.</p>}
            <div className="form-disclosure"><ShieldCheck size={14}/><span>Girdiler bir sunucuya gönderilmez.</span></div>
          </section></div>
          <div className="bottom-note"><FlaskConical size={15}/><span>Araştırma prototipi. Tahminler bir güven aralığı veya kanıtlanmış tasarruf vaadi içermez.</span><button className="text-button" onClick={()=>navigate('rehber')}>Nasıl çalışır?<ArrowRight size={14}/></button></div>
        </>}

        {page==='senaryolar'&&<>
          <div className="page-heading"><div><div className="eyebrow">YEREL ÇALIŞMA ALANI</div><h1>Senaryolarım<span>.</span></h1><p>Farklı koşulları kaydet, karşılaştır ve yeniden dene.</p></div><button className="button button-primary" onClick={()=>navigate('tahmin')}><Plus size={17}/>Yeni senaryo</button></div>
          <div className="scenario-toolbar"><label className="search-label"><span className="sr-only">Senaryo ara</span><input placeholder="Senaryo adıyla ara…" value={query} onChange={e=>setQuery(e.target.value)}/></label><label><span className="sr-only">Bütçe durumu</span><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Tüm durumlar</option><option value="under">Bütçe altında</option><option value="over">Bütçe aşımı</option></select></label><button className="button button-secondary" disabled={!displayed.length} onClick={()=>exportCsv(displayed)}><ArrowDownToLine size={16}/>CSV indir</button></div>
          {displayed.length?<section className="panel table-wrap"><table><thead><tr><th>Senaryo</th><th>Model</th><th>Referans</th><th>Bütçe</th><th>Durum</th><th><span className="sr-only">İşlemler</span></th></tr></thead><tbody>{displayed.map(record=>{const r=predict(record.input,model);return <tr key={record.id}><td><strong>{record.name}</strong><small>{formatTime(record.input.time)}</small></td><td className="numeric">{format(r.prediction)}<small>kWh / 15 dk</small></td><td>{format(r.baseline)} kWh</td><td>{format(r.budget)} kWh</td><td><Status over={r.overBudget}/></td><td><div className="row-actions"><button className="icon-button" aria-label={`${record.name} senaryosunu aç`} onClick={()=>restore(record)}><ArrowUpRight size={18}/></button><button className="icon-button danger" aria-label={`${record.name} senaryosunu sil`} onClick={()=>{persist(records.filter(v=>v.id!==record.id));setToast('Senaryo kaldırıldı.');}}><Trash2 size={17}/></button></div></td></tr>;})}</tbody></table></section>:<section className="panel empty-state"><span className="empty-icon"><Layers3 size={30}/></span><h2>{records.length?'Eşleşen senaryo bulunamadı':'İlk senaryon için yer hazır.'}</h2><p>{records.length?'Arama veya durum filtresini değiştirebilirsin.':'Tahmin merkezinde bir hesaplama yapıp senaryonu kaydet. Sonuçları burada karşılaştırabilirsin.'}</p><button className="button button-primary" onClick={()=>navigate('tahmin')}>Tahmin merkezine git<ArrowRight size={16}/></button></section>}
          <div className="bottom-note"><ShieldCheck size={16}/><span>Kayıtlar yalnızca bu cihaz ve tarayıcıda tutulur. Tarayıcı verileri silinirse kaybolur. Yedeklemek için CSV indir.</span></div>
        </>}

        {page==='model'&&<>
          <div className="page-heading"><div><div className="eyebrow">SONUÇLARIN ARKASINDA</div><h1>Model ve veri<span>.</span></h1><p>Ne öğrendiğini, nasıl ölçüldüğünü ve sınırlarını gör.</p></div><a className="button button-secondary" href="https://archive.ics.uci.edu/dataset/851/steel+industry+energy+consumption" target="_blank" rel="noreferrer">UCI kaynağı<ExternalLink size={16}/></a></div>
          <section className="dataset-banner"><span className="dataset-icon"><Database size={30}/></span><div><h2>Gerçek bir fabrikanın enerji kaydı.</h2><p>DAEWOO Steel · Güney Kore · 35.040 kayıt · 15 dakikalık aralık</p></div><span className="source-label">CC BY 4.0</span></section>
          <div className="model-grid"><section className="panel model-summary"><div className="panel-heading"><div><h2>Test sonuçları</h2><p>Son %20’lik zaman dilimi · 6.989 kayıt</p></div><BarChart3 size={22}/></div><table className="metrics-table"><thead><tr><th>Ölçüt</th><th>Doğrusal model</th><th>Son ölçüm referansı</th></tr></thead><tbody><tr><td>MAE <small>kWh, düşük daha iyi</small></td><td>{format(M.MAE_kWh)}</td><td className="best">{format(B.MAE_kWh)}</td></tr><tr><td>RMSE <small>kWh, düşük daha iyi</small></td><td className="best">{format(M.RMSE_kWh)}</td><td>{format(B.RMSE_kWh)}</td></tr><tr><td>R² <small>yüksek daha iyi</small></td><td className="best">{format(M.R2,3)}</td><td>{format(B.R2,3)}</td></tr></tbody></table><div className="model-explainer"><Info size={18}/><p>Model, büyük hataları ölçen RMSE’de daha iyi. Ortalama mutlak hatada ise son ölçüm referansı daha başarılı. <b>R² doğruluk yüzdesi değildir.</b></p></div></section>
          <section className="panel method-panel"><h2>Geleceğe bakmadan test.</h2><p>Veriyi tarih sırasıyla ayırdık. İlk 27.955 kayıtla modeli eğittik, sonraki 6.989 kaydı test için tuttuk.</p><div className="split-visual"><span>Eğitim %80</span><span>Test %20</span></div><p>Her adımda yalnızca daha önce gerçekleşmiş tüketim kullanılır. Tahmin, her yeni ölçüm geldiğinde 15 dakika ileriye yenilenir.</p><div className="method-pill"><Check size={14}/>Hedef dönemin CO₂ ve yük sınıfı girdilerde yok.</div></section></div>
          <section className="panel features-panel"><div className="panel-heading"><div><h2>Modelin kullandığı 6 girdi</h2><p>Basit, açıklanabilir bir doğrusal regresyon</p></div><span className="code-label">LinearRegression</span></div><div className="feature-list">{[['01','Son 15 dakika','Bir önceki dönemin tüketimi'],['02','1 saat önce','Dört dönem önceki tüketim'],['03','24 saat önce','96 dönem önceki tüketim'],['04–05','Saat döngüsü','Hedef saatin sinüs ve kosinüsü'],['06','Hafta sonu','Hedef gün cumartesi veya pazar mı?']].map(([n,name,desc])=><div key={n}><span>{n}</span><strong>{name}</strong><p>{desc}</p></div>)}</div></section>
          <div className="resource-row"><a href="./data/steel-industry.csv" download><Database size={19}/><div><strong>Kaynak veri</strong><small>CSV · 35.040 satır</small></div><ArrowDownToLine size={18}/></a><a href="./data/veri-sozlugu.csv" download><FileText size={19}/><div><strong>Veri sözlüğü</strong><small>Sütunlar ve birimler</small></div><ArrowDownToLine size={18}/></a><a href="./data/model.json" download><FlaskConical size={19}/><div><strong>Model katsayıları</strong><small>JSON · yeniden üretilebilir</small></div><ArrowDownToLine size={18}/></a></div>
          <div className="limitations"><TriangleAlert size={20}/><div><strong>Bu sonuçlar tek tesis ve tek yıla aittir.</strong><p>Ani üretim değişimleri tahmini zorlaştırabilir. Başka bir fabrikada kullanmadan önce yeni verilerle doğrulama gerekir. Bütçe uyarısının saha başarısı ve gerçek tasarruf ölçülmedi.</p></div></div>
          <p className="citation">Kaynak: V E, S., Shin, C. ve Cho, Y. (2021). Steel Industry Energy Consumption. UCI Machine Learning Repository. DOI: 10.24432/C52G8C. Zaman düzeltmesi ve model uyarlaması: Görkem Vatansever.</p>
        </>}

        {page==='rehber'&&<>
          <div className="page-heading"><div><div className="eyebrow">KISA KULLANIM REHBERİ</div><h1>Nasıl çalışır<span>?</span></h1><p>Ölçümlerini anlamlı bir tahmine dönüştür.</p></div><button className="button button-primary" onClick={()=>navigate('tahmin')}>Hemen dene<ArrowRight size={16}/></button></div>
          <section className="guide-steps">{[['01','Geçmiş ölçümleri gir.','Son 15 dakikanın, 1 saat önceki ve 24 saat önceki 15 dakikalık dönemin tüketimini kWh olarak yaz.'],['02','Hedefi ve bütçeyi belirle.','Son bilinen ölçümden 15 dakika sonraki zamanı seç. O dönem için enerji bütçeni gir. Örneklerde 50 kWh kullanıyoruz.'],['03','İki tahmini birlikte oku.','Doğrusal modelin sonucunu, son ölçümün devam edeceğini varsayan referansla karşılaştır. Bütçe uyarısı model tahminine göre oluşur.'],['04','Senaryonu kaydet.','Sonucuna bir isim ver. Farklı koşulları senaryolar ekranında karşılaştır veya CSV olarak indir.']].map(([n,title,desc])=><article className="panel guide-step" key={n}><span>{n}</span><h2>{title}</h2><p>{desc}</p></article>)}</section>
          <section className="panel faq-panel"><h2>Aklındaki sorular</h2>{[['Bu bir gerçek zamanlı sayaç mı?','Hayır. Uygulama girilen geçmiş tüketimle hesaplama yapar. Test grafiği veri setinden alınan sabit bir kesittir, bir tesisten canlı ölçüm almaz.'],['Grafik neden girdi değişince değişmiyor?','Grafik modelin ayrılmış test verisindeki davranışını gösterir. Form girdileri üstteki tahmin ve bütçe kartlarını günceller.'],['Neden bazı tarihler eski?','Test verisi 2018 dönemine ait. Örnek senaryolar aynı takvim bağlamında 2019 için kurulmuştur. Yeni senaryolarında farklı tarih seçebilirsin.'],['Senaryolarım nerede saklanıyor?','LocalStorage ile sadece bu tarayıcıya kaydedilir. Başka cihazla eşitlenmez. Tarayıcı verileri silinirse kayıtlar da silinir. CSV indirerek yedek alabilirsin.'],['Uyarı bir güvenlik alarmı mı?','Bu bir planlama prototipidir. Uyarı, model tahminiyle senin bütçenin basit karşılaştırmasıdır. Kalibre edilmiş risk olasılığı veya güvenlik garantisi vermez.']].map(([title,body])=><details key={title}><summary>{title}<Plus size={17}/></summary><p>{body}</p></details>)}</section>
          <section className="ai-note"><span className="small-icon"><FlaskConical size={23}/></span><div><h2>Yapay zeka desteğiyle geliştirildi.</h2><p>ChatGPT; fikir ve veri modeli planlamasında, React bileşenlerinin geliştirilmesinde, hata ayıklamada ve dokümantasyonda kullanıldı. Python modeliyle web hesaplamalarının tutarlılığı test edildi.</p></div></section>
        </>}
        <footer className="footer"><span className="footer-brand"><Zap size={13}/>VardiyaWatt</span><span>Görkem Vatansever tarafından geliştirildi.</span><span>Bir sonraki döneme daha hazırlıklı.</span></footer>
      </main>
    </div>
    {toast&&<div className="toast" role="status"><CheckCircle2 size={18}/>{toast}<button onClick={()=>setToast('')} aria-label="Bildirimi kapat"><X size={15}/></button></div>}
    {saveOpen&&<div className="modal-backdrop" onClick={()=>setSaveOpen(false)}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="save-title" onClick={e=>e.stopPropagation()}><div className="modal-heading"><span className="empty-icon"><Save size={24}/></span><button className="icon-button" onClick={()=>setSaveOpen(false)} aria-label="Kaydetme penceresini kapat"><X size={20}/></button></div><h2 id="save-title">Bu senaryoyu sakla.</h2><p>{format(result.prediction)} kWh tahminini daha sonra yeniden açabilirsin.</p><form onSubmit={saveScenario}><label className="field"><span>Senaryo adı</span><div className="input-wrap"><input autoFocus value={scenarioName} onChange={e=>setScenarioName(e.target.value)} maxLength={80} required placeholder="Örn. Gündüz vardiyası"/></div></label><button className="button button-primary" type="submit" disabled={!scenarioName.trim()}><Save size={16}/>Senaryoyu kaydet</button></form></section></div>}
  </div>;
}
