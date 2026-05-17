import { getCalculosCarga, getCalculosArmada, getCalculosAtrito } from '../storage';
import { BarChart2, Layers, ArrowDownToLine, Building2, Calculator } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const S = {
  h2: { fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, fontWeight:700, color:'var(--text-primary)', margin:'0 0 24px' },
  card: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:20, marginBottom:16 },
  statCard: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:20 },
};

export default function Dashboard({ session, obraAtiva, onNavigate }) {
  const calcsCarga  = obraAtiva ? getCalculosCarga(obraAtiva.id)  : [];
  const calcsArmada = obraAtiva ? getCalculosArmada(obraAtiva.id) : [];
  const calcsAtrito = obraAtiva ? getCalculosAtrito(obraAtiva.id) : [];

  const total = calcsCarga.length + calcsArmada.length + calcsAtrito.length;

  const ultimos = [
    ...calcsCarga.map(c  => ({ ...c, modulo:'Capacidade de Carga', icon: BarChart2, color:'#3b82f6' })),
    ...calcsArmada.map(c => ({ ...c, modulo:'Estaca Armada',       icon: Layers,   color:'#10b981' })),
    ...calcsAtrito.map(c => ({ ...c, modulo:'Atrito Negativo',     icon: ArrowDownToLine, color:'#8b5cf6' })),
  ].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 8);

  const chartData = calcsCarga.filter(c => c.resultados?.media?.Qadm).map(c => ({
    name: c.nome.slice(0, 10),
    Qadm: c.resultados.media.Qadm,
  }));

  const modulos = [
    { id:'carga',  label:'Capacidade de Carga', desc:'SPT — 5 métodos',    icon: BarChart2,       color:'#3b82f6' },
    { id:'armada', label:'Estaca Armada',        desc:'Dim. armadura',      icon: Layers,          color:'#10b981' },
    { id:'atrito', label:'Atrito Negativo',      desc:'De Beer & Wallays',  icon: ArrowDownToLine, color:'#8b5cf6' },
  ];

  return (
    <div style={{padding:28}}>
      <h2 style={S.h2}>Dashboard</h2>

      {!obraAtiva && (
        <div style={{background:'rgba(245,158,11,0.1)', border:'1px solid var(--accent)', borderRadius:8, padding:'12px 16px', marginBottom:20, fontSize:14, color:'var(--accent-light)', display:'flex', alignItems:'center', gap:8}}>
          <Building2 size={16}/>
          Nenhuma obra ativa. Selecione ou crie uma obra na aba <strong>Obras</strong>.
        </div>
      )}

      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, marginBottom:24}}>
        <div style={S.statCard}>
          <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4,textTransform:'uppercase',letterSpacing:0.5}}>Total de cálculos</div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace", fontSize:36, color:'var(--accent)', fontWeight:700}}>{total}</div>
        </div>
        <div style={S.statCard}>
          <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4,textTransform:'uppercase',letterSpacing:0.5}}>Obra ativa</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, color:'var(--text-primary)', fontWeight:600}}>{obraAtiva?.nome || '—'}</div>
        </div>
        <div style={S.statCard}>
          <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:4,textTransform:'uppercase',letterSpacing:0.5}}>Usuário</div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif", fontSize:20, color:'var(--text-primary)', fontWeight:600}}>{session.nome}</div>
        </div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, marginBottom:24}}>
        {modulos.map(m => {
          const Icon = m.icon;
          return (
            <button key={m.id} onClick={() => onNavigate(m.id)}
              style={{background:'var(--bg-card)', border:`1px solid var(--border)`, borderRadius:10, padding:20, textAlign:'left', cursor:'pointer', transition:'border-color 0.15s'}}
              onMouseEnter={e => e.currentTarget.style.borderColor = m.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <Icon size={28} color={m.color} style={{marginBottom:10}}/>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, fontWeight:700, color:'var(--text-primary)', marginBottom:4}}>{m.label}</div>
              <div style={{fontSize:12, color:'var(--text-muted)'}}>{m.desc}</div>
            </button>
          );
        })}
      </div>

      {chartData.length > 0 && (
        <div style={{...S.card, marginBottom:24}}>
          <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,margin:'0 0 12px',color:'var(--text-secondary)'}}>Q Adm médio — Capacidade de Carga (tf)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{top:5,right:10,left:0,bottom:5}}>
              <XAxis dataKey="name" tick={{fill:'var(--text-muted)',fontSize:11}}/>
              <YAxis tick={{fill:'var(--text-muted)',fontSize:11}}/>
              <Tooltip contentStyle={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:6,color:'var(--text-primary)'}} formatter={v=>[`${v.toFixed(2)} tf`,'Qadm']}/>
              <Bar dataKey="Qadm" fill="#3b82f6" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {ultimos.length > 0 && (
        <div style={S.card}>
          <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:18,margin:'0 0 12px',color:'var(--text-secondary)'}}>Últimos cálculos</h3>
          {ultimos.map((c, i) => {
            const Icon = c.icon;
            return (
              <div key={c.id + i} style={{display:'flex',alignItems:'center',gap:12,padding:'8px 0',borderBottom:'1px solid rgba(45,74,107,0.3)'}}>
                <Icon size={16} color={c.color}/>
                <div style={{flex:1}}>
                  <span style={{fontWeight:600,fontSize:14}}>{c.nome}</span>
                  <span style={{fontSize:12,color:'var(--text-muted)',marginLeft:8}}>{c.modulo}</span>
                </div>
                <span style={{fontSize:12,color:'var(--text-muted)'}}>{new Date(c.data).toLocaleDateString('pt-BR')}</span>
              </div>
            );
          })}
        </div>
      )}

      {total === 0 && obraAtiva && (
        <div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>
          <Calculator size={48} style={{margin:'0 auto 12px',display:'block',opacity:0.3}}/>
          <p>Nenhum cálculo salvo ainda. Utilize os módulos no menu lateral.</p>
        </div>
      )}
    </div>
  );
}
