import { useState } from 'react';
import { calcularAtritoConvencional, calcularAtritoBeer } from '../calculos/atritoNegativo';
import { getCalculosAtrito, setCalculosAtrito } from '../storage';
import { Save } from 'lucide-react';

const SOLOS_REF = [
  { tipo:'Areia muito fina',      g:1.8, phi:22.5, c:1.0 },
  { tipo:'Silte c/ areia fina',   g:1.9, phi:27.5, c:1.0 },
  { tipo:'Silte',                 g:2.0, phi:20.0, c:1.5 },
  { tipo:'Argila mole',           g:1.9, phi:15.0, c:2.5 },
  { tipo:'Argila rija',           g:2.0, phi:10.0, c:3.5 },
];

const S = {
  h2: { fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, fontWeight:700, color:'var(--text-primary)', margin:'0 0 20px' },
  card: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:20, marginBottom:16 },
  label: { display:'block', fontSize:12, color:'var(--text-secondary)', marginBottom:4, fontWeight:500, textTransform:'uppercase', letterSpacing:0.5 },
  field: { marginBottom:14 },
  row: { display:'grid', gap:12, marginBottom:14 },
  mono: { fontFamily:"'IBM Plex Mono',monospace" },
  th: { background:'var(--bg-secondary)', padding:'8px 10px', fontSize:12, color:'var(--text-secondary)', fontWeight:600 },
  td: { padding:'8px 10px', fontSize:13, borderBottom:'1px solid rgba(45,74,107,0.3)', textAlign:'center' },
};

function DiagramaSVG({ D, H_aterro, H_comp }) {
  const total = H_aterro + H_comp + 2;
  const scale = 160 / total;
  const w = 120, pad = 30;
  const h_at = H_aterro * scale;
  const h_comp = H_comp * scale;
  const h_res = 2 * scale;
  const pile_w = Math.max(8, (D / 100) * scale * 5);

  return (
    <svg width={w + pad * 2} height={200} style={{display:'block',margin:'0 auto'}}>
      {/* Aterro */}
      <rect x={pad} y={0} width={w} height={h_at} fill="#92400e" opacity={0.5}/>
      <text x={pad + w/2} y={h_at/2 + 5} textAnchor="middle" fill="#fbbf24" fontSize={11}>Aterro ({H_aterro}m)</text>
      {/* Camada compressível */}
      <rect x={pad} y={h_at} width={w} height={h_comp} fill="#1e3a5f" opacity={0.7}/>
      <text x={pad + w/2} y={h_at + h_comp/2 + 5} textAnchor="middle" fill="#94a3b8" fontSize={11}>Compressível ({H_comp}m)</text>
      {/* Resistente */}
      <rect x={pad} y={h_at + h_comp} width={w} height={h_res} fill="#1e4d2b" opacity={0.8}/>
      <text x={pad + w/2} y={h_at + h_comp + h_res/2 + 5} textAnchor="middle" fill="#10b981" fontSize={11}>Resistente</text>
      {/* Estaca */}
      <rect x={pad + w/2 - pile_w/2} y={0} width={pile_w} height={h_at + h_comp} fill="#f59e0b" opacity={0.8} rx={2}/>
      {/* Bordas */}
      <rect x={pad} y={0} width={w} height={h_at + h_comp + h_res} fill="none" stroke="var(--border)" strokeWidth={1}/>
    </svg>
  );
}

export default function AtritoNegativo({ session, obraAtiva }) {
  const [f, setF] = useState({ D:25, H_aterro:1.8, gamma_aterro:1.8, H_comp:6, gamma_comp:1.9, phi:15, c:2.5, NA:0.75, nome:'' });
  const [res, setRes] = useState(null);
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const calcular = () => {
    const p = Object.fromEntries(Object.entries(f).map(([k,v]) => [k, isNaN(v) ? v : Number(v)]));
    const conv = calcularAtritoConvencional(p);
    const beer = calcularAtritoBeer(p);
    setRes({ conv, beer });
  };

  const salvar = () => {
    if (!obraAtiva) return alert('Selecione uma obra ativa.');
    if (!res) return alert('Calcule primeiro.');
    const lista = getCalculosAtrito(obraAtiva.id);
    const entry = { id: Date.now().toString(), nome: f.nome || 'Atrito negativo', data: new Date().toISOString(), entrada: f, resultados: res };
    setCalculosAtrito(obraAtiva.id, [...lista, entry]);
    alert('Salvo!');
  };

  const preencherSolo = (solo) => setF(p => ({ ...p, gamma_comp: solo.g, phi: solo.phi, c: solo.c }));

  const Field = ({ label, k, unit }) => (
    <div style={S.field}>
      <label style={S.label}>{label}{unit && <span style={{textTransform:'none',marginLeft:4,color:'var(--text-muted)'}}>({unit})</span>}</label>
      <input type="number" step="0.01" value={f[k]} onChange={e => set(k, e.target.value)} />
    </div>
  );

  return (
    <div style={{padding:28}}>
      <h2 style={S.h2}>Atrito Negativo</h2>
      <p style={{fontSize:13,color:'var(--text-muted)',marginBottom:20}}>Método De Beer &amp; Wallays + Convencional — Ref.: Mecânica dos Solos Vol.2 — Homero Pinto Caputo</p>

      <div style={{display:'grid', gridTemplateColumns:'1fr 340px', gap:16, alignItems:'start'}}>
        <div>
          <div style={S.card}>
            <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,margin:'0 0 16px',color:'var(--accent)'}}>Dados de entrada</h3>
            <div style={{...S.row, gridTemplateColumns:'1fr 1fr'}}>
              <Field label="Diâmetro da estaca" k="D" unit="cm"/>
              <Field label="Nível d'água" k="NA" unit="m"/>
            </div>
            <div style={{...S.row, gridTemplateColumns:'1fr 1fr'}}>
              <Field label="Altura camada aterro" k="H_aterro" unit="m"/>
              <Field label="Peso esp. aterro (γ)" k="gamma_aterro" unit="t/m³"/>
            </div>
            <div style={{...S.row, gridTemplateColumns:'1fr 1fr'}}>
              <Field label="Altura camada compressível" k="H_comp" unit="m"/>
              <Field label="Peso esp. seco (γ)" k="gamma_comp" unit="t/m³"/>
            </div>
            <div style={{...S.row, gridTemplateColumns:'1fr 1fr'}}>
              <Field label="Ângulo atrito interno (φ)" k="phi" unit="°"/>
              <Field label="Coesão (c)" k="c" unit="t/m²"/>
            </div>
            <div style={{display:'flex',gap:10,marginTop:4}}>
              <button style={{padding:'10px 28px',borderRadius:8,border:'none',background:'var(--accent)',color:'#0f1923',fontWeight:700,fontSize:15}} onClick={calcular}>Calcular</button>
              {res && <button style={{padding:'8px 18px',borderRadius:8,border:'1px solid var(--success)',background:'transparent',color:'var(--success)',fontWeight:600,fontSize:13,display:'flex',alignItems:'center',gap:6}} onClick={salvar}><Save size={14}/>Salvar</button>}
            </div>
          </div>

          {res && (
            <div style={S.card}>
              <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,margin:'0 0 12px',color:'var(--text-primary)'}}>Resultados</h3>
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16}}>
                <div style={{background:'var(--bg-secondary)', borderRadius:8, padding:16, textAlign:'center'}}>
                  <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>MÉTODO CONVENCIONAL</div>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace", fontSize:28, color:'var(--text-primary)', fontWeight:700}}>{res.conv.toFixed(2)}</div>
                  <div style={{fontSize:12,color:'var(--text-secondary)'}}>toneladas-força (tf)</div>
                </div>
                <div style={{background:'var(--bg-secondary)', borderRadius:8, padding:16, textAlign:'center'}}>
                  <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4}}>DE BEER &amp; WALLAYS</div>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace", fontSize:28, color:'var(--accent)', fontWeight:700}}>{res.beer.toFixed(2)}</div>
                  <div style={{fontSize:12,color:'var(--text-secondary)'}}>toneladas-força (tf)</div>
                </div>
              </div>
              <div style={{background:'rgba(16,185,129,0.1)', border:'1px solid var(--success)', borderRadius:8, padding:'10px 14px', fontSize:13, color:'#6ee7b7'}}>
                ✔ Recomendação: usar o <strong>maior valor</strong> ({Math.max(res.conv, res.beer).toFixed(2)} tf) como acréscimo na carga da estaca.
              </div>
              <div style={{marginTop:12,background:'rgba(245,158,11,0.08)',border:'1px solid var(--accent)',borderRadius:8,padding:'10px 16px',fontSize:12,color:'var(--text-muted)'}}>
                ⚠️ Este aplicativo é ferramenta de auxílio. Resultados devem ser verificados por engenheiro responsável.
              </div>
            </div>
          )}

          <div style={S.card}>
            <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,margin:'0 0 12px',color:'var(--text-secondary)'}}>Tabela de solos de referência</h3>
            <p style={{fontSize:12,color:'var(--text-muted)',marginBottom:10}}>Clique em uma linha para preencher os parâmetros automaticamente.</p>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr>
                <th style={S.th}>Tipo de solo</th>
                <th style={S.th}>γ (t/m³)</th>
                <th style={S.th}>φ (°)</th>
                <th style={S.th}>c (t/m²)</th>
              </tr></thead>
              <tbody>
                {SOLOS_REF.map((s, i) => (
                  <tr key={i} style={{cursor:'pointer', background: i%2===0 ? 'transparent':'rgba(45,74,107,0.15)'}}
                    onClick={() => preencherSolo(s)}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(245,158,11,0.08)'}
                    onMouseLeave={e => e.currentTarget.style.background=i%2===0?'transparent':'rgba(45,74,107,0.15)'}>
                    <td style={{...S.td,textAlign:'left',color:'var(--text-primary)'}}>{s.tipo}</td>
                    <td style={S.td}>{s.g}</td>
                    <td style={S.td}>{s.phi}</td>
                    <td style={S.td}>{s.c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={S.card}>
          <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,margin:'0 0 16px',color:'var(--text-secondary)',textAlign:'center'}}>Diagrama esquemático</h3>
          <DiagramaSVG D={Number(f.D)} H_aterro={Number(f.H_aterro)} H_comp={Number(f.H_comp)}/>
          <div style={{marginTop:16,fontSize:12,color:'var(--text-muted)'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}><span style={{width:12,height:12,background:'#92400e',opacity:0.5,display:'inline-block',borderRadius:2}}/> Camada de aterro</div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}><span style={{width:12,height:12,background:'#1e3a5f',opacity:0.7,display:'inline-block',borderRadius:2}}/> Camada compressível</div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}><span style={{width:12,height:12,background:'#1e4d2b',opacity:0.8,display:'inline-block',borderRadius:2}}/> Camada resistente</div>
            <div style={{display:'flex',alignItems:'center',gap:8}}><span style={{width:12,height:12,background:'#f59e0b',opacity:0.8,display:'inline-block',borderRadius:2}}/> Estaca</div>
          </div>
        </div>
      </div>
    </div>
  );
}
