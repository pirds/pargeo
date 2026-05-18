import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { calcularTodos } from '../calculos/capacidadeCarga';
import { getCalculosCarga, setCalculosCarga } from '../storage';
import { Plus, Trash2, Save, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

const TIPOS_SOLO = ['ARG','ARGS','ARGA','SAG','SAR','AREA','ARS','ARE','ARP'];
const TIPO_LABEL = { ARG:'Argila Siltosa', ARGS:'Areia c/ Pedregulhos / Areia Argilosa', ARGA:'Argila Arenosa', SAG:'Silte Argiloso', SAR:'Silte Arenoso', AREA:'Areia (genérica)', ARS:'Areia Siltosa', ARE:'Areia', ARP:'Areia c/ Pedregulhos 2' };
const METODOS = ['velloso','aoki','decourt','teixeira','alonso'];
const METODO_LABEL = { velloso:'P.P.C. Velloso', aoki:'Aoki-Velloso', decourt:'Décourt-Quaresma', teixeira:'A.H. Teixeira', alonso:'U.R. Alonso' };
const CORES = ['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444'];

const S = {
  h2: { fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, fontWeight:700, color:'var(--text-primary)', margin:'0 0 20px' },
  card: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:20, marginBottom:16 },
  label: { display:'block', fontSize:12, color:'var(--text-secondary)', marginBottom:4, fontWeight:500, textTransform:'uppercase', letterSpacing:0.5 },
  row: { display:'grid', gap:12, marginBottom:14 },
  btn: (c) => ({ padding:'8px 18px', borderRadius:8, border:`1px solid ${c||'var(--border)'}`, background: c === 'var(--accent)' ? 'var(--accent)' : 'transparent', color: c === 'var(--accent)' ? '#0f1923' : (c || 'var(--text-primary)'), fontWeight:600, fontSize:13, display:'flex', alignItems:'center', gap:6, cursor:'pointer' }),
  th: { background:'var(--bg-secondary)', padding:'8px 10px', fontSize:12, color:'var(--text-secondary)', fontWeight:600, textAlign:'left', borderBottom:'1px solid var(--border)' },
  td: { padding:'6px 10px', fontSize:13, borderBottom:'1px solid rgba(45,74,107,0.4)', color:'var(--text-primary)' },
  mono: { fontFamily:"'IBM Plex Mono',monospace", fontSize:13 },
};

function CamadaRow({ cam, idx, onChange, onDel }) {
  return (
    <tr>
      <td style={S.td}><input type="number" value={cam.cota} onChange={e => onChange(idx,'cota',e.target.value)} style={{width:70,textAlign:'center'}} /></td>
      <td style={S.td}><input type="number" min="0" max="60" value={cam.spt} onChange={e => onChange(idx,'spt',e.target.value)} style={{width:70,textAlign:'center'}} /></td>
      <td style={S.td}>
        <select value={cam.tipo} onChange={e => onChange(idx,'tipo',e.target.value)} style={{width:120}}>
          <option value="">Selecione</option>
          {TIPOS_SOLO.map(t => <option key={t} value={t}>{t} — {TIPO_LABEL[t]}</option>)}
        </select>
      </td>
      <td style={S.td}>
        <button onClick={() => onDel(idx)} style={{background:'none',border:'none',color:'var(--error)',cursor:'pointer',padding:'2px 6px'}}><Trash2 size={14}/></button>
      </td>
    </tr>
  );
}

export default function CapacidadeCarga({ session, obraAtiva }) {
  const [nome, setNome] = useState('');
  const [tipoSecao, setTipoSecao] = useState('circular');
  const [dimensao, setDimensao] = useState(450);
  const [comprimento, setComprimento] = useState(10);
  const [tipoCarga, setTipoCarga] = useState('compressao');
  const [camadas, setCamadas] = useState([
    {cota:1,spt:1,tipo:'ARE'},{cota:2,spt:4,tipo:'ARE'},{cota:3,spt:9,tipo:'ARE'},{cota:4,spt:9,tipo:'ARE'},{cota:5,spt:6,tipo:'ARE'},{cota:6,spt:9,tipo:'ARE'},{cota:7,spt:9,tipo:'ARGS'},{cota:8,spt:15,tipo:'ARGS'},{cota:9,spt:18,tipo:'ARGA'},{cota:10,spt:18,tipo:'ARGA'},{cota:11,spt:25,tipo:'ARGS'},{cota:12,spt:12,tipo:'ARGS'},{cota:13,spt:12,tipo:'ARGS'},{cota:14,spt:12,tipo:'ARGS'},{cota:15,spt:15,tipo:'ARGS'},{cota:16,spt:18,tipo:'ARGS'},{cota:17,spt:12,tipo:'ARGS'},{cota:18,spt:19,tipo:'ARGS'},{cota:19,spt:12,tipo:'ARGS'},{cota:20,spt:16,tipo:'ARGS'},{cota:21,spt:18,tipo:'ARGS'},{cota:22,spt:18,tipo:'ARGS'},{cota:23,spt:18,tipo:'ARGS'},{cota:24,spt:19,tipo:'ARGS'},{cota:25,spt:18,tipo:'ARG'},{cota:26,spt:19,tipo:'ARG'},{cota:27,spt:16,tipo:'ARG'},{cota:28,spt:18,tipo:'ARG'},{cota:29,spt:18,tipo:'ARG'},{cota:30,spt:19,tipo:'ARG'},{cota:31,spt:11,tipo:'ARG'},{cota:32,spt:32,tipo:'ARG'},{cota:33,spt:43,tipo:'ARG'},
  ]);
  const [resultado, setResultado] = useState(null);
  const [showSalvos, setShowSalvos] = useState(false);
  const [salvos, setSalvos] = useState(() => obraAtiva ? getCalculosCarga(obraAtiva.id) : []);

  const addCamada = () => setCamadas(c => [...c, { cota: (c[c.length-1]?.cota||0)+1, spt:'', tipo:'' }]);
  const delCamada = (i) => setCamadas(c => c.filter((_,idx) => idx !== i));
  const updateCamada = (i, k, v) => setCamadas(c => c.map((x,idx) => idx===i ? {...x,[k]:v} : x));

  const calcular = () => {
    const res = calcularTodos(camadas, Number(comprimento), tipoSecao, Number(dimensao), tipoCarga);
    const valid = METODOS.map(m => res[m]).filter(Boolean);
    const media = valid.length ? {
      RL:   valid.reduce((s, m) => s + m.RL,   0) / valid.length,
      RP:   valid.reduce((s, m) => s + m.RP,   0) / valid.length,
      Q:    valid.reduce((s, m) => s + m.Q,    0) / valid.length,
      Qadm: valid.reduce((s, m) => s + m.Qadm, 0) / valid.length,
    } : null;
    setResultado({ ...res, media });
  };

  const salvar = () => {
    if (!obraAtiva) return alert('Selecione uma obra ativa antes de salvar.');
    if (!resultado) return alert('Calcule primeiro.');
    const entry = {
      id: Date.now().toString(), nome: nome || `Cálculo ${new Date().toLocaleDateString('pt-BR')}`,
      data: new Date().toISOString(),
      entrada: { dimensao, tipoSecao, comprimento, tipoCarga, camadas },
      resultados: { velloso: resultado.velloso, aoki: resultado.aoki, decourt: resultado.decourt, teixeira: resultado.teixeira, alonso: resultado.alonso, media: resultado.media },
    };
    const lista = [...salvos, entry];
    setCalculosCarga(obraAtiva.id, lista);
    setSalvos(lista);
    alert('Cálculo salvo!');
  };

  const alertasSPT = camadas.filter(c => c.spt === '0' || c.spt === 0).map(c => c.cota);

  const chartData = resultado ? [
    ...METODOS.filter(m => resultado[m]).map((m, i) => ({ name: METODO_LABEL[m].split(' ')[0], Qadm: resultado[m].Qadm, fill: CORES[i] })),
    ...(resultado.media ? [{ name: 'Média', Qadm: resultado.media.Qadm, fill:'#f59e0b' }] : []),
  ] : [];

  const sptChart = [...camadas].sort((a,b)=>a.cota-b.cota).filter(c=>c.spt!=='').map(c=>({ cota: c.cota, spt: Number(c.spt), tipo: c.tipo }));

  return (
    <div style={{padding:28}}>
      <h2 style={S.h2}>Capacidade de Carga — Estacas por SPT</h2>

      <div style={{...S.card}}>
        <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,margin:'0 0 16px',color:'var(--accent)'}}>Dados do Ensaio</h3>
        <div style={{...S.row, gridTemplateColumns:'1fr 1fr 1fr'}}>
          <div><label style={S.label}>Nome / identificação</label><input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Sondagem SP-01" /></div>
          <div><label style={S.label}>Tipo de seção</label>
            <select value={tipoSecao} onChange={e=>setTipoSecao(e.target.value)}>
              <option value="circular">Circular</option>
              <option value="quadrada">Quadrada</option>
            </select>
          </div>
          <div><label style={S.label}>{tipoSecao==='circular'?'Diâmetro (mm)':'Lado (mm)'}</label><input type="number" value={dimensao} onChange={e=>setDimensao(e.target.value)} /></div>
        </div>
        <div style={{...S.row, gridTemplateColumns:'1fr 1fr'}}>
          <div><label style={S.label}>Comprimento da estaca (m)</label><input type="number" value={comprimento} onChange={e=>setComprimento(e.target.value)} /></div>
          <div><label style={S.label}>Tipo de carregamento</label>
            <select value={tipoCarga} onChange={e=>setTipoCarga(e.target.value)}>
              <option value="compressao">Compressão</option>
              <option value="tracao">Tração</option>
            </select>
          </div>
        </div>
      </div>

      <div style={S.card}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,margin:0,color:'var(--accent)'}}>Perfil SPT</h3>
          <button style={S.btn()} onClick={addCamada}><Plus size={14}/>Adicionar camada</button>
        </div>
        {alertasSPT.length > 0 && (
          <div style={{background:'rgba(245,158,11,0.1)',border:'1px solid var(--accent)',borderRadius:6,padding:'8px 12px',marginBottom:12,display:'flex',alignItems:'center',gap:8,fontSize:13,color:'var(--accent-light)'}}>
            <AlertTriangle size={15}/>N-SPT = 0 nas cotas: {alertasSPT.join(', ')} m
          </div>
        )}
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead><tr>
            <th style={S.th}>Cota (m)</th>
            <th style={S.th}>N-SPT</th>
            <th style={S.th}>Tipo de solo</th>
            <th style={S.th}></th>
          </tr></thead>
          <tbody>{camadas.map((c,i) => <CamadaRow key={i} cam={c} idx={i} onChange={updateCamada} onDel={delCamada}/>)}</tbody>
        </table>
      </div>

      <div style={{display:'flex',gap:10,marginBottom:20}}>
        <button style={{...S.btn('var(--accent)'), padding:'10px 28px', fontSize:15}} onClick={calcular}>Calcular</button>
        {resultado && <button style={S.btn('var(--success)')} onClick={salvar}><Save size={14}/>Salvar cálculo</button>}
      </div>

      {resultado && (
        <>
          <div style={S.card}>
            <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,margin:'0 0 4px',color:'var(--text-primary)'}}>
              Geometria da seção
            </h3>
            <p style={{fontSize:13,color:'var(--text-secondary)',margin:'0 0 12px'}}>
              Perímetro: <span style={S.mono}>{resultado.geometria.perimetro.toFixed(4)} m</span> &nbsp;|&nbsp;
              Área da ponta: <span style={S.mono}>{resultado.geometria.areaPonta.toFixed(4)} m²</span>
            </p>

            <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,margin:'12px 0 12px',color:'var(--text-primary)'}}>Resultados por método</h3>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                <th style={S.th}>Método</th>
                <th style={{...S.th,textAlign:'right'}}>RL (tf)</th>
                <th style={{...S.th,textAlign:'right'}}>RP (tf)</th>
                <th style={{...S.th,textAlign:'right'}}>Q Total (tf)</th>
                <th style={{...S.th,textAlign:'right'}}>Q Adm CS=2 (tf)</th>
              </tr></thead>
              <tbody>
                {METODOS.map((m,i) => {
                  const r = resultado[m];
                  if (!r) return <tr key={m}><td style={S.td} colSpan={5}>{METODO_LABEL[m]} — dados insuficientes</td></tr>;
                  return (
                    <tr key={m} style={{background: i%2===0 ? 'transparent' : 'rgba(45,74,107,0.15)'}}>
                      <td style={{...S.td,color:CORES[i],fontWeight:600}}>{METODO_LABEL[m]}</td>
                      <td style={{...S.td,...S.mono,textAlign:'right'}}>{r.RL.toFixed(2)}</td>
                      <td style={{...S.td,...S.mono,textAlign:'right'}}>{r.RP.toFixed(2)}</td>
                      <td style={{...S.td,...S.mono,textAlign:'right'}}>{r.Q.toFixed(2)}</td>
                      <td style={{...S.td,...S.mono,textAlign:'right',fontWeight:700}}>{r.Qadm.toFixed(2)}</td>
                    </tr>
                  );
                })}
                {resultado.media && (
                  <tr style={{background:'rgba(245,158,11,0.08)',borderTop:'2px solid var(--accent)'}}>
                    <td style={{...S.td,color:'var(--accent)',fontWeight:700}}>Média</td>
                    <td style={{...S.td,...S.mono,textAlign:'right'}}>{resultado.media.RL.toFixed(2)}</td>
                    <td style={{...S.td,...S.mono,textAlign:'right'}}>{resultado.media.RP.toFixed(2)}</td>
                    <td style={{...S.td,...S.mono,textAlign:'right'}}>{resultado.media.Q.toFixed(2)}</td>
                    <td style={{...S.td,...S.mono,textAlign:'right',fontWeight:700,fontSize:15,color:'var(--accent)'}}>{resultado.media.Qadm.toFixed(2)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
            <div style={S.card}>
              <h4 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:17,margin:'0 0 12px',color:'var(--text-secondary)'}}>Q Adm por método (tf)</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{top:5,right:10,left:0,bottom:5}}>
                  <XAxis dataKey="name" tick={{fill:'var(--text-muted)',fontSize:11}} />
                  <YAxis tick={{fill:'var(--text-muted)',fontSize:11}} />
                  <Tooltip contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:6,color:'var(--text-primary)'}} formatter={(v)=>[`${v.toFixed(2)} tf`,'Qadm']} />
                  <Bar dataKey="Qadm" radius={[4,4,0,0]}>
                    {chartData.map((d,i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={S.card}>
              <h4 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:17,margin:'0 0 12px',color:'var(--text-secondary)'}}>Perfil SPT</h4>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={sptChart} layout="vertical" margin={{top:5,right:20,left:20,bottom:5}}>
                  <XAxis type="number" domain={[0,60]} tick={{fill:'var(--text-muted)',fontSize:10}} />
                  <YAxis type="category" dataKey="cota" tick={{fill:'var(--text-muted)',fontSize:10}} width={35} label={{value:'Cota (m)',angle:-90,position:'insideLeft',fill:'var(--text-muted)',fontSize:10}} />
                  <Tooltip contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:6,color:'var(--text-primary)'}} formatter={(v,_,p)=>[`N=${v} | ${p.payload.tipo}`,'SPT']}/>
                  <ReferenceLine x={comprimento} stroke="var(--accent)" strokeDasharray="4 2" label={{value:'ponta',fill:'var(--accent)',fontSize:10}} />
                  <Bar dataKey="spt" fill="#3b82f6" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={{background:'rgba(245,158,11,0.08)',border:'1px solid var(--accent)',borderRadius:8,padding:'10px 16px',fontSize:12,color:'var(--text-muted)',marginBottom:16}}>
            ⚠️ Este aplicativo é ferramenta de auxílio. Resultados devem ser verificados por engenheiro responsável.
          </div>
        </>
      )}

      {obraAtiva && salvos.length > 0 && (
        <div style={S.card}>
          <button style={{background:'none',border:'none',color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:8,fontSize:15,fontFamily:"'Barlow Condensed',sans-serif",fontWeight:600,cursor:'pointer'}}
            onClick={() => setShowSalvos(s => !s)}>
            {showSalvos ? <ChevronUp size={16}/> : <ChevronDown size={16}/>} Cálculos salvos ({salvos.length})
          </button>
          {showSalvos && (
            <div style={{marginTop:12}}>
              {salvos.map(s => (
                <div key={s.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid rgba(45,74,107,0.3)'}}>
                  <div>
                    <span style={{fontWeight:600}}>{s.nome}</span>
                    <span style={{fontSize:12,color:'var(--text-muted)',marginLeft:10}}>{new Date(s.data).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <span style={{...S.mono,color:'var(--accent)'}}>Qadm médio: {s.resultados.media?.Qadm?.toFixed(2)||'—'} tf</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
