import { useState, useEffect } from 'react';
import { calcularEstacaArmada, calcularCompressaoSimplificada, NH_TABLE, PHI_OPTIONS } from '../calculos/estacaArmada';
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

const TIPOS_ESTACA = [
  { value: 'helice_continua',  label: 'Hélice Contínua' },
  { value: 'franki',           label: 'Franki' },
  { value: 'premoldada',       label: 'Pré-moldada (Concreto)' },
  { value: 'escavada_sem_rev', label: 'Escavada sem Revestimento' },
  { value: 'escavada_com_rev', label: 'Escavada c/ Revestimento ou Lama' },
  { value: 'raiz',             label: 'Raiz' },
  { value: 'hollow_auger',     label: 'Hollow Auger' },
];

const NH_LABELS = {
  areia_fofa:        'Areia fofa',
  areia_media:       'Areia medianamente compacta',
  areia_compacta:    'Areia compacta',
  silte_fofo:        'Silte muito fofo',
  argila_mole:       'Argila muito mole',
  argila_media:      'Argila média',
  argila_rija:       'Argila rija',
  argila_muito_rija: 'Argila muito rija',
  argila_dura:       'Argila dura',
};

const Field = ({ label, k, type='number', value, onChange, children, unit }) => (
  <div style={S.field}>
    <label style={S.label}>{label}{unit && <span style={{textTransform:'none',marginLeft:4,color:'var(--text-muted)'}}>({unit})</span>}</label>
    {children || <input type={type} value={value} onChange={e => onChange(k, e.target.value)} />}
  </div>
);

// ── ABA A ─────────────────────────────────────────────────────────
function Row({ label, calc, min, usado, nBarras, phi, asFornecido, asGov, nBarrasText }) {
  const temArmadura = nBarras !== undefined;
  const temTexto = nBarrasText !== undefined;
  const ok = temArmadura ? asFornecido >= asGov : true;
  return (
    <tr>
      <td style={S.tdl}>{label}</td>
      <td style={S.td}>{calc?.toFixed(2)}</td>
      <td style={S.td}>{min?.toFixed(2)}</td>
      <td style={{...S.td, fontWeight:700, color:'var(--accent)'}}>{usado?.toFixed(2)}</td>
      <td style={S.td}>
        {temArmadura ? `${nBarras} barras Ø${phi}mm` : temTexto ? nBarrasText : '—'}
      </td>
      <td style={temArmadura ? {...S.td, ...(ok ? S.ok : S.warn)} : S.td}>
        {temArmadura ? `${asFornecido?.toFixed(2)} cm² ${ok ? '✓' : '✗'}` : '—'}
      </td>
    </tr>
  );
}

function AbaA({ session, obraAtiva }) {
  const [f, setF] = useState({
    db:45, comprimento:12, Nc:50, atrito:0, Nt:0, M:100, H:2,
    fck:250, phi_long:10, phi_est:8, cobrimento:5,
    tipo_solo:'areia_media', situacao:'seca', tipoEstaca:'helice_continua', nome:'',
  });
  const [res, setRes] = useState(null);

  useEffect(() => {
    const dim = localStorage.getItem('estaca_dimensao');
    const tipo = localStorage.getItem('estaca_tipo_estaca');
    setF(p => ({
      ...p,
      ...(dim ? { db: Number(dim) / 10 } : {}),
      ...(tipo ? { tipoEstaca: tipo } : {}),
    }));
  }, []);

  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const calcular = () => {
    const num = Object.fromEntries(Object.entries(f).map(([k,v]) => [k, isNaN(v) ? v : Number(v)]));
    const da = num.db - 2 * num.cobrimento;
    const r = calcularEstacaArmada({ ...num, da, tipo_solo: f.tipo_solo, situacao: f.situacao });
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

  return (
    <div>
      <div style={S.card}>
        <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,margin:'0 0 16px',color:'var(--accent)'}}>Dados de entrada</h3>
        <div style={{...S.row, gridTemplateColumns:'1fr 1fr'}}>
          <Field label="Nome" k="nome" type="text" value={f.nome} onChange={set}/>
          <Field label="Diâmetro da estaca (db)" k="db" unit="cm" value={f.db} onChange={set}/>
        </div>
        <div style={{...S.row, gridTemplateColumns:'1fr 1fr 1fr 1fr'}}>
          <Field label="Comprimento" k="comprimento" unit="m" value={f.comprimento} onChange={set}/>
          <Field label="Carga Nc" k="Nc" unit="tf" value={f.Nc} onChange={set}/>
          <Field label="Carga Nt (tração)" k="Nt" unit="tf" value={f.Nt} onChange={set}/>
          <Field label="Atrito lateral" k="atrito" unit="tf" value={f.atrito} onChange={set}/>
        </div>
        <div style={{...S.row, gridTemplateColumns:'1fr 1fr 1fr'}}>
          <Field label="Momento M" k="M" unit="kg.m" value={f.M} onChange={set}/>
          <Field label="Carga horiz. H" k="H" unit="tf" value={f.H} onChange={set}/>
          <Field label="fck" k="fck" unit="kg/cm²" value={f.fck} onChange={set}/>
        </div>
        <div style={{...S.row, gridTemplateColumns:'1fr 1fr 1fr 1fr'}}>
          <div style={S.field}>
            <label style={S.label}>Ø long. (mm)</label>
            <select value={f.phi_long} onChange={e => set('phi_long', e.target.value)}>
              {PHI_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div style={S.field}>
            <label style={S.label}>Ø estribo (mm)</label>
            <select value={f.phi_est} onChange={e => set('phi_est', e.target.value)}>
              {PHI_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <Field label="Cobrimento" k="cobrimento" unit="cm" value={f.cobrimento} onChange={set}/>
        </div>
        <div style={{...S.row, gridTemplateColumns:'2fr 1fr 2fr'}}>
          <div style={S.field}>
            <label style={S.label}>Tipo de solo (Miche)</label>
            <select value={f.tipo_solo} onChange={e => set('tipo_solo', e.target.value)}>
              {Object.keys(NH_TABLE).map(k => <option key={k} value={k}>{NH_LABELS[k] ?? k}</option>)}
            </select>
          </div>
          <div style={S.field}>
            <label style={S.label}>Situação</label>
            <select value={f.situacao} onChange={e => set('situacao', e.target.value)}>
              <option value="seca">Seca</option>
              <option value="submersa">Submersa</option>
            </select>
          </div>
          <div style={S.field}>
            <label style={S.label}>Tipo de estaca</label>
            <select value={f.tipoEstaca} onChange={e => set('tipoEstaca', e.target.value)}>
              {TIPOS_ESTACA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{display:'flex',gap:10,marginTop:4}}>
          <button style={{...S.btn('accent'), background:'var(--accent)', color:'#0f1923', border:'none', padding:'10px 28px'}} onClick={calcular}>Calcular</button>
          {res && <button style={{...S.btn('var(--success)'), border:'1px solid var(--success)'}} onClick={salvar}><Save size={14}/>Salvar</button>}
        </div>
      </div>

      {res && (
        <>
          <div style={{background:'rgba(245,158,11,0.06)', border:'2px solid var(--accent)', borderRadius:10, padding:20, marginBottom:16}}>
            <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,margin:'0 0 10px',color:'var(--accent)'}}>Comprimento de Armação</h3>
            <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:10}}>{res.criterio_armacao}</div>
            <div style={{fontSize:28,fontWeight:700,fontFamily:"'Barlow Condensed',sans-serif",color:'var(--accent)'}}>
              {Math.min(res.comp_armacao, Number(f.comprimento)).toFixed(2)} m
              {res.comp_armacao > Number(f.comprimento) && <span style={{fontSize:13,color:'var(--error)',marginLeft:10}}>⚠ excede comprimento total</span>}
            </div>
          </div>

          <div style={S.card}>
            <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,margin:'0 0 12px',color:'var(--text-primary)'}}>Armaduras</h3>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                <th style={S.th}>Tipo</th>
                <th style={S.th}>As calc. (cm²)</th>
                <th style={S.th}>As mín. (cm²)</th>
                <th style={S.th}>As usado (cm²)</th>
                <th style={S.th}>Nº barras</th>
                <th style={S.th}>As fornecido</th>
              </tr></thead>
              <tbody>
                <Row label="Compressão"
                  calc={res.As_comp_calc} min={res.As_min_comp} usado={res.As_comp}
                  nBarras={res.n_barras_min} phi={f.phi_long}
                  asFornecido={res.As_fornecido} asGov={res.As_gov}/>
                <Row label="Tração"        calc={res.As_trac_calc} min={res.As_min_trac} usado={res.As_trac}/>
                <Row label="Momento"       calc={res.As_mom_calc}  min={res.As_min_mom}  usado={res.As_mom}/>
                <Row label="Cortante"      calc={res.As_cort_calc} min={res.As_min_cort} usado={res.As_cort}
                  nBarrasText={`Ø${res.phi_est}mm c/${res.espacamento_estribos?.toFixed(2)}cm — ${res.n_estribos_armacao} un.`}/>
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
                    ['Prof. do momento (m)', res.prof_momento],
                    ['M máx (ton.m)', res.M_max],
                    ['Prof. M máx (m)', res.z_Mmax],
                    ['Espaç. estribos (cm)', res.espacamento_estribos],
                  ].map(([l, v]) => (
                    <tr key={l}>
                      <td style={S.tdl}>{l}</td>
                      <td style={S.td}>{v?.toFixed ? v.toFixed(2) : v}</td>
                    </tr>
                  ))}
                  <tr>
                    <td style={S.tdl}>Desl. horiz. topo (cm)</td>
                    <td style={S.td}>
                      <span style={{fontWeight:700, color: res.deslocamento_ok ? 'var(--success)' : 'var(--error)'}}>
                        {res.delta?.toFixed(2)} cm {res.deslocamento_ok ? '✓' : '✗'}
                      </span>
                      <div style={{fontSize:11, color:'var(--text-muted)', marginTop:2}}>
                        Limite adotado: 1,0 cm (prática de projeto — verificar requisitos da obra)
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div style={{marginTop:12, padding:'8px 12px', borderRadius:6,
                background: res.As_fornecido >= res.As_gov ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                border: `1px solid ${res.As_fornecido >= res.As_gov ? 'var(--success)' : 'var(--error)'}`,
                fontSize:13, fontWeight:600,
                color: res.As_fornecido >= res.As_gov ? 'var(--success)' : 'var(--error)'}}>
                {res.As_fornecido >= res.As_gov
                  ? `✓ As fornecido (${res.As_fornecido?.toFixed(2)} cm²) ≥ As gov (${res.As_gov?.toFixed(2)} cm²)`
                  : `✗ As fornecido (${res.As_fornecido?.toFixed(2)} cm²) < As gov (${res.As_gov?.toFixed(2)} cm²) — INSUFICIENTE`}
              </div>
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
  const [f, setF] = useState({ Nc: 50, db: 45, atrito_lateral: 0, comprimento: 12 });
  const [res, setRes] = useState(null);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const calcular = () => {
    const num = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, Number(v)]));
    setRes(calcularCompressaoSimplificada(num));
  };

  return (
    <div>
      <div style={S.card}>
        <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,margin:'0 0 16px',color:'var(--accent)'}}>Compressão simplificada</h3>
        <div style={{...S.row, gridTemplateColumns:'1fr 1fr'}}>
          <Field label="Carga de compressão (Nc)" k="Nc" unit="tf" value={f.Nc} onChange={set}/>
          <Field label="Diâmetro da estaca (db)" k="db" unit="cm" value={f.db} onChange={set}/>
          <Field label="Atrito lateral admissível" k="atrito_lateral" unit="tf" value={f.atrito_lateral} onChange={set}/>
          <Field label="Comprimento total" k="comprimento" unit="m" value={f.comprimento} onChange={set}/>
        </div>
        <button style={{...S.btn('accent'), background:'var(--accent)', color:'#0f1923', border:'none', padding:'10px 24px'}} onClick={calcular}>
          Calcular
        </button>
      </div>

      {res && (
        <div style={S.card}>
          <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,margin:'0 0 12px',color:'var(--text-primary)'}}>Resultado</h3>
          <table style={{width:'100%',borderCollapse:'collapse',maxWidth:480}}>
            <tbody>
              <tr><td style={S.tdl}>Área da seção (Ac)</td><td style={S.td}>{res.Ac?.toFixed(2)} cm²</td></tr>
              <tr><td style={S.tdl}>Tensão na seção</td><td style={S.td}>{res.tensao?.toFixed(2)} kg/cm²</td></tr>
              <tr>
                <td style={S.tdl}>Necessita armação?</td>
                <td style={{...S.td, ...(res.necessita_armacao ? S.warn : S.ok)}}>
                  {res.necessita_armacao ? 'Sim' : 'Não — tensão ≤ 50 kg/cm²'}
                </td>
              </tr>
              {res.necessita_armacao && <>
                <tr>
                  <td style={S.tdl}>Carga excedente</td>
                  <td style={S.td}>{res.carga_excedente?.toFixed(2)} kg</td>
                </tr>
                <tr>
                  <td style={S.tdl}>Comprimento mínimo a armar</td>
                  <td style={{...S.td, color:'var(--accent)', fontWeight:700}}>{res.comp_armar?.toFixed(2)} m</td>
                </tr>
              </>}
              <tr>
                <td colSpan={2} style={{...S.tdl, fontStyle:'italic', paddingTop:10,
                  color: res.msg?.includes('Rever') ? 'var(--error)' : 'var(--success)'}}>
                  {res.msg}
                </td>
              </tr>
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
