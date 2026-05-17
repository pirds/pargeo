import { useState } from 'react';
import { getSession, clearSession, getObraAtiva } from './storage';
import AuthScreen from './components/AuthScreen';
import ObrasScreen from './components/ObrasScreen';
import Dashboard from './components/Dashboard';
import CapacidadeCarga from './components/CapacidadeCarga';
import EstacaArmada from './components/EstacaArmada';
import AtritoNegativo from './components/AtritoNegativo';
import {
  LayoutDashboard, Building2, BarChart2, Layers, ArrowDownToLine,
  HardHat, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';

const MODULOS = [
  { id:'dashboard', label:'Dashboard',           icon: LayoutDashboard },
  { id:'obras',     label:'Obras',               icon: Building2 },
  { id:'carga',     label:'Capacidade de Carga', icon: BarChart2 },
  { id:'armada',    label:'Estaca Armada',        icon: Layers },
  { id:'atrito',    label:'Atrito Negativo',      icon: ArrowDownToLine },
];

function Sidebar({ tela, onNav, collapsed, onToggle }) {
  return (
    <div style={{
      width: collapsed ? 60 : 220,
      background:'var(--bg-secondary)',
      borderRight:'1px solid var(--border)',
      display:'flex', flexDirection:'column',
      transition:'width 0.2s', overflow:'hidden', flexShrink:0,
    }}>
      <div style={{padding: collapsed ? '12px 14px' : '12px 16px', display:'flex', alignItems:'center', justifyContent: collapsed ? 'center' : 'space-between', borderBottom:'1px solid var(--border)', minHeight:52}}>
        {!collapsed && <div style={{display:'flex',alignItems:'center',gap:8}}>
          <HardHat size={20} color="var(--accent)"/>
          <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,fontSize:18,color:'var(--accent)'}}>PARGEO</span>
        </div>}
        <button onClick={onToggle} style={{background:'none',border:'none',color:'var(--text-muted)',cursor:'pointer',display:'flex',alignItems:'center'}}>
          {collapsed ? <ChevronRight size={18}/> : <ChevronLeft size={18}/>}
        </button>
      </div>
      <nav style={{flex:1, paddingTop:8}}>
        {MODULOS.map(m => {
          const Icon = m.icon;
          const active = tela === m.id;
          return (
            <button key={m.id} onClick={() => onNav(m.id)} style={{
              width:'100%', display:'flex', alignItems:'center', gap:10,
              padding: collapsed ? '10px 0' : '10px 16px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              background: active ? 'rgba(245,158,11,0.12)' : 'transparent',
              border:'none', borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
              color: active ? 'var(--accent)' : 'var(--text-secondary)',
              fontFamily:"'IBM Plex Sans',sans-serif", fontSize:14, cursor:'pointer',
              transition:'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { if (!active) { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.color='var(--text-primary)'; }}}
            onMouseLeave={e => { if (!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-secondary)'; }}}
            title={collapsed ? m.label : undefined}
            >
              <Icon size={18} style={{flexShrink:0}}/>
              {!collapsed && <span>{m.label}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function Header({ session, obraAtiva, onLogout }) {
  return (
    <div style={{
      height:52, background:'var(--bg-secondary)', borderBottom:'1px solid var(--border)',
      display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', flexShrink:0,
    }}>
      <div style={{display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--text-muted)'}}>
        {obraAtiva
          ? <><Building2 size={14} color="var(--accent)"/><span style={{color:'var(--text-primary)', fontWeight:600}}>{obraAtiva.nome}</span></>
          : <span>Nenhuma obra ativa</span>}
      </div>
      <div style={{display:'flex', alignItems:'center', gap:12}}>
        <span style={{fontSize:13, color:'var(--text-secondary)'}}>{session.nome}</span>
        <button onClick={onLogout} style={{background:'none', border:'1px solid var(--border)', borderRadius:6, padding:'5px 10px', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:6, fontSize:12, cursor:'pointer'}}
          onMouseEnter={e => e.currentTarget.style.color='var(--error)'}
          onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}
        ><LogOut size={14}/> Sair</button>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSessionState] = useState(() => getSession());
  const [tela, setTela] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [obraAtiva, setObraAtivaState] = useState(() => session ? getObraAtiva(session.userId) : null);

  const handleLogin = (s) => { setSessionState(s); setObraAtivaState(getObraAtiva(s.userId)); };
  const handleLogout = () => { clearSession(); setSessionState(null); setTela('dashboard'); };

  if (!session) return <AuthScreen onLogin={handleLogin}/>;

  const telas = {
    dashboard: <Dashboard session={session} obraAtiva={obraAtiva} onNavigate={setTela}/>,
    obras:     <ObrasScreen session={session} obraAtiva={obraAtiva} onObraChange={setObraAtivaState}/>,
    carga:     <CapacidadeCarga session={session} obraAtiva={obraAtiva}/>,
    armada:    <EstacaArmada session={session} obraAtiva={obraAtiva}/>,
    atrito:    <AtritoNegativo session={session} obraAtiva={obraAtiva}/>,
  };

  return (
    <div style={{display:'flex', height:'100vh', background:'var(--bg-primary)', overflow:'hidden'}}>
      <Sidebar tela={tela} onNav={setTela} collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(c => !c)}/>
      <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
        <Header session={session} obraAtiva={obraAtiva} onLogout={handleLogout}/>
        <main style={{flex:1, overflowY:'auto'}}>
          {telas[tela] || telas.dashboard}
        </main>
      </div>
    </div>
  );
}
