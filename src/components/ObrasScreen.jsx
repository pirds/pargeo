import { useState } from 'react';
import { getObras, setObras, getObraAtiva, setObraAtiva } from '../storage';
import { Plus, Building2, Pencil, Trash2, CheckCircle, X, Calendar } from 'lucide-react';

const S = {
  h2: { fontFamily:"'Barlow Condensed',sans-serif", fontSize:26, fontWeight:700, color:'var(--text-primary)', margin:'0 0 20px' },
  btn: (accent) => ({ padding:'8px 18px', borderRadius:8, border:'none', background: accent ? 'var(--accent)' : 'var(--bg-input)', color: accent ? '#0f1923' : 'var(--text-primary)', fontWeight:600, fontSize:14, display:'flex', alignItems:'center', gap:6 }),
  card: (active) => ({ background: active ? 'rgba(245,158,11,0.08)' : 'var(--bg-card)', border:`1px solid ${active ? 'var(--accent)' : 'var(--border)'}`, borderRadius:10, padding:20, marginBottom:12 }),
  label: { display:'block', fontSize:12, color:'var(--text-secondary)', marginBottom:4, fontWeight:500, textTransform:'uppercase', letterSpacing:0.5 },
  field: { marginBottom:14 },
  modal: { position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  mbox: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:32, width:'100%', maxWidth:520, maxHeight:'85vh', overflowY:'auto' },
};

function Field({ label, k, type='text', rows, value, onChange }) {
  return (
    <div style={S.field}>
      <label style={S.label}>{label}</label>
      {rows ? <textarea rows={rows} value={value} onChange={e => onChange(k, e.target.value)} style={{resize:'vertical'}} />
        : <input type={type} value={value} onChange={e => onChange(k, e.target.value)} />}
    </div>
  );
}

function ObraForm({ inicial, onSave, onCancel }) {
  const [f, setF] = useState(inicial || { nome:'', cliente:'', endereco:'', responsavel:'', dataInicio:'', descricao:'' });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <div style={S.modal}>
      <div style={S.mbox}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:22,margin:0,color:'var(--accent)'}}>
            {inicial?.id ? 'Editar Obra' : 'Nova Obra'}
          </h3>
          <button style={{background:'none',border:'none',color:'var(--text-muted)'}} onClick={onCancel}><X size={20}/></button>
        </div>
        <Field label="Nome da obra *" k="nome" value={f.nome} onChange={set} />
        <Field label="Cliente / Empresa" k="cliente" value={f.cliente} onChange={set} />
        <Field label="Endereço" k="endereco" value={f.endereco} onChange={set} />
        <Field label="Responsável técnico" k="responsavel" value={f.responsavel} onChange={set} />
        <Field label="Data de início" k="dataInicio" type="date" value={f.dataInicio} onChange={set} />
        <Field label="Descrição" k="descricao" rows={3} value={f.descricao} onChange={set} />
        <div style={{display:'flex',gap:10,marginTop:8}}>
          <button style={S.btn(true)} onClick={() => f.nome.trim() && onSave(f)}>Salvar</button>
          <button style={S.btn(false)} onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

export default function ObrasScreen({ session, obraAtiva, onObraChange }) {
  const [obras, setObrasState] = useState(() => getObras(session.userId));
  const [modal, setModal] = useState(null); // null | 'nova' | obra_obj

  const salvar = (dados) => {
    let lista;
    if (dados.id) {
      lista = obras.map(o => o.id === dados.id ? { ...dados } : o);
    } else {
      lista = [...obras, { ...dados, id: Date.now().toString(), criadoEm: new Date().toISOString() }];
    }
    setObrasState(lista);
    setObras(session.userId, lista);
    setModal(null);
  };

  const excluir = (id) => {
    if (!confirm('Excluir esta obra?')) return;
    const lista = obras.filter(o => o.id !== id);
    setObrasState(lista);
    setObras(session.userId, lista);
    if (obraAtiva?.id === id) { setObraAtiva(session.userId, null); onObraChange(null); }
  };

  const ativar = (obra) => {
    setObraAtiva(session.userId, { id: obra.id, nome: obra.nome });
    onObraChange({ id: obra.id, nome: obra.nome });
  };

  return (
    <div style={{padding:28}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:24}}>
        <h2 style={S.h2}>Obras</h2>
        <button style={S.btn(true)} onClick={() => setModal('nova')}><Plus size={16}/>Nova obra</button>
      </div>

      {obras.length === 0 && (
        <div style={{textAlign:'center',padding:60,color:'var(--text-muted)'}}>
          <Building2 size={48} style={{margin:'0 auto 12px',display:'block',opacity:0.3}}/>
          <p>Nenhuma obra cadastrada. Clique em "Nova obra" para começar.</p>
        </div>
      )}

      {obras.map(obra => {
        const ativa = obraAtiva?.id === obra.id;
        return (
          <div key={obra.id} style={S.card(ativa)}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                  <h3 style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:20,margin:0,color: ativa ? 'var(--accent)' : 'var(--text-primary)'}}>
                    {obra.nome}
                  </h3>
                  {ativa && <span style={{fontSize:11,background:'var(--accent)',color:'#0f1923',borderRadius:4,padding:'2px 8px',fontWeight:700}}>ATIVA</span>}
                </div>
                {obra.cliente && <p style={{margin:'0 0 4px',fontSize:13,color:'var(--text-secondary)'}}>Cliente: {obra.cliente}</p>}
                {obra.responsavel && <p style={{margin:'0 0 4px',fontSize:13,color:'var(--text-secondary)'}}>Resp.: {obra.responsavel}</p>}
                {obra.dataInicio && (
                  <p style={{margin:0,fontSize:12,color:'var(--text-muted)',display:'flex',alignItems:'center',gap:4}}>
                    <Calendar size={12}/>{new Date(obra.dataInicio + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </p>
                )}
                {obra.descricao && <p style={{margin:'6px 0 0',fontSize:13,color:'var(--text-muted)'}}>{obra.descricao}</p>}
              </div>
              <div style={{display:'flex',gap:8,marginLeft:16}}>
                {!ativa && (
                  <button style={{...S.btn(false), borderColor:'var(--success)', color:'var(--success)', border:'1px solid'}} onClick={() => ativar(obra)}>
                    <CheckCircle size={14}/> Ativar
                  </button>
                )}
                <button style={{...S.btn(false), padding:'8px 12px'}} onClick={() => setModal(obra)}>
                  <Pencil size={14}/>
                </button>
                <button style={{...S.btn(false), padding:'8px 12px', color:'var(--error)'}} onClick={() => excluir(obra.id)}>
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {modal && (
        <ObraForm
          inicial={modal === 'nova' ? null : modal}
          onSave={salvar}
          onCancel={() => setModal(null)}
        />
      )}
    </div>
  );
}
