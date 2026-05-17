import { useState } from 'react';
import { calcularArmaduraCompleto, calcularArmaduraSimples, NH_OPTIONS, PHI_OPTIONS } from '../calculos/estacaArmada';
import { getCalculosArmada, setCalculosArmada } from '../storage';
import { Save, Info } from 'lucide-react';

const S = {
  h2: { fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, fontWeight:700, color:'var(--text-primary)', margin:'0 0 20px' },
  card: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:20, marginBottom:16 },
  label: { display:'block', fontSize:12, color:'var(--text-secondary)', marginBottom:4, fontWeight:500, textTransform:'uppercase', letterSpacing:0.5 },
  field: { marginBottom:14 },
  row: { display:'grid', gap:12, marginBottom:14 },
  btn: (c) => ({ padding:'8px 18px', borderRadius:8, border:`1px solid ${c||'var(--border)'}`, background: c==='accent' ? 'var(--accent)' : 'transparent', color: c==='accent' ? '#0f1923' : (c||'var(--text-primary)'), fontWeight:600, fontSize:13, display:'flex', alignItems:'center', gap:6 }),
  tab: (active) => ({ padding:'8px 20px', border:'none', borderRadius:'6px 6px 0 0', background: active ? 'var(--bg-card)' : 'var(--bg-secondary)', color: active ? 'var(--accent)' : 'var(--text-muted)', fontWeight: active ? 700 : 400, fontFamily:"'IBM Plex Sans',sans-serif", fontSize:14, cursor:'pointer', borderBottom: active ? '2px solid var(--accent)' : 'none' }),
  th: { background:'var(--bg-secondary)', padding:'8px 12px', fontSize:12, color:'var(--text-secondary)', fontWeight:600, textAlign:'left' },
  td: { padding:'8px 12px', fontSize:13, borderBottom:'1px solid rgba(45,74,107,0.3)', color:'var(--text-primary)', fontFamily:"'IBM Plex Mono',monospace" },
  tdl: { padding:'8px 12px', fontSize:13, borderBottom:'1px solid rgba(45,74,107,0.3)', color:'var(--text-secondary)' },
  ok: { color:'var(--success)', fontWeight:700 },
  warn: { color:'var(--error)', fontWeight:700 },
};

const Field = ({ label, k, type='number', value, onChange, children, unit }) => (
  <div style={S.field}>
    <label style={S.label}>{label}{unit && <span style={{textTransform:'none',marginLeft:4,color:'var(--text-muted)'}}>({unit})</span>}</label>
    {children || <input type={type} value={value} onChange={e => onChange(k, e.target.value)} />}
  </div>
);

// ── ABA A ─────────────────────────────────────────────────────────
function AbaA({ session, obraAtiva }) {
  const [f, setF] = useState({
    da:35, db:45, comprimento:12, Nc:50, atrito_lat:0, Nt:0, M:100, H:2,
    fck:250, phi_long:10, n_barras:8, phi_est:8, cobrimento:5,
    tipo_solo:'Areia medianamente (Seca)', nome:'',
  });
  const [res, setRes] = useState(null);

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const calcular = () => {
    const r = calcularArmaduraCompleto({ ...f, ...Object.fromEntries(Object.entries(f).map(([k,v]) => [k, isNaN(v) ? v : Number(v)])) });
    setRes(r);
  };

  const salvar = () => {
    if (!obraAtiva) return alert('Selecione uma obra ativa.');
    if (!res) return alert('Calcule primeiro.');
    const lista = getCalculosArmada(obraAtiva.id);
    const entry = { id: Date.now().toString(), nome: f.nome || `Estaca Ø${f.db}cm`, data: new Date().toISOString(), entrada: f, resultados: res };
    setCalculosArmada(obraAtiva.id, [...lista, entry]);
    alert('Salvo!');
  };

  const Row = ({ label, calc, min, usado, adotado }) => {
    const ok = adotado !== undefined ? adotado >= usado : true;
    return (
      <tr>
        <td style={S.tdl}>{label}</td>
        <td style={S.td}>{calc?.toFixed(2)}</td>
        <td style={S.td}>{min?.toFixed(2)}</td>
        <td style={{...S.td, fontWeight:700, color:'var(--accent)'}}>{usado?.toFixed(2)}</td>
        {adotado !== undefined && <td style={{...S.td, ...(ok ? S.ok : S.warn)}}>{adotado?.toFixed(2)} {ok ? '✓' : '✗'}</td>}
      </tr>
    );
  };

  return (
    <div>
      <div style={S.card}>
        <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,margin:'0 0 16px',color:'var(--accent)'}}>Dados de entrada</h3>
        <div style={{...S.row, gridTemplateColumns:'1fr 1fr 1fr'}}>
          <Field label="Nome" k="nome" type="text" value={f.nome} onChange={set}/>
          <Field label="Diâmetro da estaca (db)" k="db" unit="cm" value={f.db} onChange={set}/>
          <Field label="Cobrimento ao centro (da)" k="da" unit="cm" value={f.da} onChange={set}/>
        </div>
        <div style={{...S.row, gridTemplateColumns:'1fr 1fr 1fr 1fr'}}>
          <Field label="Comprimento" k="comprimento" unit="m" value={f.comprimento} onChange={set}/>
          <Field label="Carga Nc" k="Nc" unit="tf" value={f.Nc} onChange={set}/>
          <Field label="Carga Nt (tração)" k="Nt" unit="tf" value={f.Nt} onChange={set}/>
          <Field label="Atrito lateral" k="atrito_lat" unit="tf" value={f.atrito_lat} onChange={set}/>
        </div>
        <div style={{...S.row, gridTemplateColumns:'1fr 1fr 1fr'}}>
          <Field label="Momento M" k="M" unit="kg.m" value={f.M} onChange={set}/>
          <Field label="Carga horiz. H" k="H" unit="tf" value={f.H} onChange={set}/>
          <Field label="fck" k="fck" unit="kg/cm²" value={f.fck} onChange={set}/>
        </div>
        <div style={{...S.row, gridTemplateColumns:'1fr 1fr 1fr 1fr 1fr'}}>
          <div style={S.field}>
            <label style={S.label}>Ø long. (mm)</label>
            <select value={f.phi_long} onChange={e => set('phi_long', e.target.value)}>
              {PHI_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <Field label="Nº barras" k="n_barras" value={f.n_barras} onChange={set}/>
          <div style={S.field}>
            <label style={S.label}>Ø estribo (mm)</label>
            <select value={f.phi_est} onChange={e => set('phi_est', e.target.value)}>
              {PHI_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <Field label="Cobrimento" k="cobrimento" unit="cm" value={f.cobrimento} onChange={set}/>
        </div>
        <div style={S.field}>
          <label style={S.label}>Tipo de solo (Miche)</label>
          <select value={f.tipo_solo} onChange={e => set('tipo_solo', e.target.value)}>
            {NH_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
        <div style={{display:'flex',gap:10,marginTop:4}}>
          <button style={{...S.btn('accent'), background:'var(--accent)', color:'#0f1923', border:'none', padding:'10px 28px'}} onClick={calcular}>Calcular</button>
          {res && <button style={{...S.btn('var(--success)'), border:'1px solid var(--success)'}} onClick={salvar}><Save size={14}/>Salvar</button>}
        </div>
      </div>

      {res && (
        <>
          <div style={S.card}>
            <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,margin:'0 0 12px',color:'var(--text-primary)'}}>Armaduras</h3>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                <th style={S.th}>Tipo</th>
                <th style={S.th}>As calc. (cm²)</th>
                <th style={S.th}>As mín. (cm²)</th>
                <th style={S.th}>As usado (cm²)</th>
                <th style={S.th}>As adotado (cm²)</th>
              </tr></thead>
              <tbody>
                <Row label="Compressão" calc={res.As_comp} min={res.As_min_comp} usado={res.As_comp} adotado={res.As_adotada}/>
                <Row label="Tração" calc={res.As_trac} min={res.As_min_trac} usado={res.As_trac}/>
                <Row label="Momento" calc={res.As_mom} min={res.As_min_mom} usado={res.As_mom}/>
                <Row label="Cortante (estribos)" calc={res.As_cort_min} min={res.As_cort_min} usado={res.As_cort_min}/>
              </tbody>
            </table>
          </div>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16}}>
            <div style={S.card}>
              <h4 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:17,margin:'0 0 12px',color:'var(--text-secondary)'}}>Método Miche — Estaca Longa</h4>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <tbody>
                  {[
                    ['nh (MN/m³)', res.nh],
                    ['λ (m⁻¹)', res.lambda],
                    ['M máx (ton.m)', res.M_max],
                    ['Prof. M máx (m)', res.z_Mmax],
                    ['Desl. horiz. topo (cm)', res.delta_h],
                    ['Espaç. estribos (cm)', res.espacamento_est],
                  ].map(([l, v]) => (
                    <tr key={l}>
                      <td style={S.tdl}>{l}</td>
                      <td style={S.td}>{v?.toFixed ? v.toFixed(3) : v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={S.card}>
              <h4 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:17,margin:'0 0 12px',color:'var(--text-secondary)'}}>Quantitativos</h4>
              <table style={{width:'100%',borderCollapse:'collapse'}}>
                <tbody>
                  {[
                    ['Volume concreto (m³)', res.vol_concreto],
                    ['Aço longitudinal (kg)', res.peso_aco_long],
                    ['Aço transversal (kg)', res.peso_aco_trans],
                  ].map(([l, v]) => (
                    <tr key={l}>
                      <td style={S.tdl}>{l}</td>
                      <td style={{...S.td, color:'var(--accent)', fontWeight:700}}>{v?.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{marginTop:12,padding:10,background:'var(--bg-secondary)',borderRadius:6,fontSize:12,color:'var(--text-muted)'}}>
                <Info size={12} style={{display:'inline',marginRight:4}}/>
                Seção: Ac = {res.Ac} cm²
              </div>
            </div>
          </div>

          <div style={{background:'rgba(245,158,11,0.08)',border:'1px solid var(--accent)',borderRadius:8,padding:'10px 16px',fontSize:12,color:'var(--text-muted)',marginBottom:16}}>
            ⚠️ Este aplicativo é ferramenta de auxílio. Resultados devem ser verificados por engenheiro responsável.
          </div>
        </>
      )}
    </div>
  );
}

// ── ABA B ─────────────────────────────────────────────────────────
function AbaB() {
  const [f, setF] = useState({ carga:50000, D:45, atrito_lateral:0, comprimento:12 });
  const [res, setRes] = useState(null);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  return (
    <div>
      <div style={S.card}>
        <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,margin:'0 0 16px',color:'var(--accent)'}}>Compressão simplificada</h3>
        <div style={{...S.row, gridTemplateColumns:'1fr 1fr'}}>
          <Field label="Carga de compressão" k="carga" unit="kg" value={f.carga} onChange={set}/>
          <Field label="Diâmetro da estaca" k="D" unit="cm" value={f.D} onChange={set}/>
          <Field label="Carga adm lateral (atrito)" k="atrito_lateral" unit="kg" value={f.atrito_lateral} onChange={set}/>
          <Field label="Comprimento total" k="comprimento" unit="m" value={f.comprimento} onChange={set}/>
        </div>
        <button style={{...S.btn('accent'), background:'var(--accent)', color:'#0f1923', border:'none', padding:'10px 24px'}} onClick={() => setRes(calcularArmaduraSimples({ ...f, ...Object.fromEntries(Object.entries(f).map(([k,v])=>[k,Number(v)])) }))}>
          Calcular
        </button>
      </div>

      {res && (
        <div style={S.card}>
          <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,margin:'0 0 12px',color:'var(--text-primary)'}}>Resultado</h3>
          <table style={{width:'100%',borderCollapse:'collapse',maxWidth:420}}>
            <tbody>
              <tr><td style={S.tdl}>Área da seção</td><td style={S.td}>{res.area} cm²</td></tr>
              <tr><td style={S.tdl}>Tensão na seção</td><td style={S.td}>{res.tensao} kg/cm²</td></tr>
              <tr>
                <td style={S.tdl}>Necessita armação?</td>
                <td style={{...S.td, ...(res.necessita ? S.warn : S.ok)}}>{res.necessita ? 'Sim' : 'Não — tensão ≤ 50 kg/cm²'}</td>
              </tr>
              {res.necessita && (
                <tr>
                  <td style={S.tdl}>Comprimento mínimo a armar</td>
                  <td style={{...S.td, color:'var(--accent)', fontWeight:700}}>{res.comp_armar} m
                    {res.aviso_excede && <span style={{color:'var(--error)',fontSize:12,marginLeft:8}}>⚠️ Excede comprimento total!</span>}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function EstacaArmada({ session, obraAtiva }) {
  const [aba, setAba] = useState('A');
  return (
    <div style={{padding:28}}>
      <h2 style={S.h2}>Dimensionamento de Estaca Armada</h2>
      <div style={{display:'flex',gap:2,marginBottom:0,borderBottom:'1px solid var(--border)'}}>
        <button style={S.tab(aba==='A')} onClick={() => setAba('A')}>A — Completo</button>
        <button style={S.tab(aba==='B')} onClick={() => setAba('B')}>B — Compressão simplificada</button>
      </div>
      <div style={{paddingTop:20}}>
        {aba === 'A' ? <AbaA session={session} obraAtiva={obraAtiva}/> : <AbaB/>}
      </div>
    </div>
  );
}
