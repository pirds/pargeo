import { useState } from 'react';
import { getUsers, setUsers, setSession, encodePass, decodePass } from '../storage';
import { HardHat, LogIn, UserPlus, AlertCircle } from 'lucide-react';

const S = {
  wrap: { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-primary)' },
  card: { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:40, width:'100%', maxWidth:420 },
  logo: { display:'flex', alignItems:'center', gap:12, marginBottom:32, justifyContent:'center' },
  title: { fontFamily:"'Barlow Condensed',sans-serif", fontSize:28, fontWeight:700, color:'var(--accent)', margin:0 },
  sub: { fontSize:13, color:'var(--text-muted)', textAlign:'center', marginBottom:28 },
  label: { display:'block', fontSize:12, color:'var(--text-secondary)', marginBottom:4, fontWeight:500, letterSpacing:0.5, textTransform:'uppercase' },
  field: { marginBottom:16 },
  btn: { width:'100%', padding:'10px 0', borderRadius:8, border:'none', background:'var(--accent)', color:'#0f1923', fontWeight:700, fontSize:15, marginTop:8, letterSpacing:0.3 },
  link: { background:'none', border:'none', color:'var(--accent)', fontSize:13, padding:0, textDecoration:'underline', cursor:'pointer' },
  row: { textAlign:'center', marginTop:20, color:'var(--text-muted)', fontSize:13 },
  err: { background:'rgba(239,68,68,0.12)', border:'1px solid var(--error)', borderRadius:6, padding:'8px 12px', fontSize:13, color:'#fca5a5', display:'flex', alignItems:'center', gap:8, marginBottom:12 },
};

export default function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ nome:'', email:'', crea:'', senha:'', confirma:'' });
  const [err, setErr] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function login() {
    setErr('');
    if (!form.email || !form.senha) return setErr('Preencha e-mail e senha.');
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === form.email.toLowerCase());
    if (!user) return setErr('Usuário não encontrado.');
    if (decodePass(user.senha) !== form.senha) return setErr('Senha incorreta.');
    setSession({ userId: user.id, nome: user.nome, email: user.email });
    onLogin({ userId: user.id, nome: user.nome, email: user.email });
  }

  function cadastrar() {
    setErr('');
    if (!form.nome || !form.email || !form.senha) return setErr('Preencha nome, e-mail e senha.');
    if (form.senha !== form.confirma) return setErr('Senhas não coincidem.');
    const users = getUsers();
    if (users.find(u => u.email.toLowerCase() === form.email.toLowerCase())) return setErr('E-mail já cadastrado.');
    const novo = { id: Date.now().toString(), nome:form.nome, email:form.email, crea:form.crea, senha:encodePass(form.senha), criadoEm: new Date().toISOString() };
    setUsers([...users, novo]);
    setSession({ userId: novo.id, nome: novo.nome, email: novo.email });
    onLogin({ userId: novo.id, nome: novo.nome, email: novo.email });
  }

  const Field = ({ label, k, type='text', placeholder='' }) => (
    <div style={S.field}>
      <label style={S.label}>{label}</label>
      <input type={type} placeholder={placeholder} value={form[k]} onChange={e => set(k, e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') mode === 'login' ? login() : cadastrar(); }} />
    </div>
  );

  return (
    <div style={S.wrap}>
      <div style={S.card}>
        <div style={S.logo}>
          <HardHat size={36} color="var(--accent)" />
          <h1 style={S.title}>PARGEO</h1>
        </div>
        <p style={S.sub}>{mode === 'login' ? 'Sistema de Dimensionamento de Fundações' : 'Criar nova conta'}</p>

        {err && <div style={S.err}><AlertCircle size={16}/>{err}</div>}

        {mode === 'cadastro' && <Field label="Nome completo" k="nome" placeholder="Eng. João Silva" />}
        <Field label="E-mail" k="email" type="email" placeholder="email@exemplo.com" />
        {mode === 'cadastro' && <Field label="CREA (opcional)" k="crea" placeholder="CREA-SP 123456" />}
        <Field label="Senha" k="senha" type="password" placeholder="••••••••" />
        {mode === 'cadastro' && <Field label="Confirmar senha" k="confirma" type="password" placeholder="••••••••" />}

        <button style={S.btn} onClick={mode === 'login' ? login : cadastrar}>
          {mode === 'login' ? <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><LogIn size={16}/>Entrar</span>
            : <span style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}><UserPlus size={16}/>Criar conta</span>}
        </button>

        <div style={S.row}>
          {mode === 'login' ? <>Não tem conta?{' '}
            <button style={S.link} onClick={() => { setMode('cadastro'); setErr(''); }}>Criar conta</button>
          </> : <>Já tem conta?{' '}
            <button style={S.link} onClick={() => { setMode('login'); setErr(''); }}>Entrar</button>
          </>}
        </div>
      </div>
    </div>
  );
}
