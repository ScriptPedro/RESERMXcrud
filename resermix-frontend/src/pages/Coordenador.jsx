import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/ConfiguracoesContext';
import { useToast } from '../components/Toast';
import Toast from '../components/Toast';
import AbaSalas from '../components/AbaSalas';
import AbaUsuarios from '../components/AbaUsuarios';
import AbaReservas from '../components/AbaReservas';
import AbaConfiguracoes from '../components/AbaConfiguracoes';
import Dashboard from '../components/Dashboard';

export default function Coordenador() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const { toast, mostrarToast } = useToast();
  const [abaAtiva, setAbaAtiva] = useState('dashboard');

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>{t('app.nome')}</h1>
          <p className="subtitle">{t('topbar.gerenciamento')}</p>
        </div>
        <div className="user-chip">
          <span className="badge-tipo cord">{t('topbar.coordenador')}</span>
          <span className="nome">{usuario?.name}</span>
          <button className="btn-logout" onClick={handleLogout}>{t('geral.sair')}</button>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${abaAtiva === 'dashboard' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('dashboard')}
        >
          {t('aba.dashboard')}
        </button>
        <button
          className={`tab ${abaAtiva === 'salas' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('salas')}
        >
          {t('aba.salas')}
        </button>
        <button
          className={`tab ${abaAtiva === 'usuarios' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('usuarios')}
        >
          {t('aba.usuarios')}
        </button>
        <button
          className={`tab ${abaAtiva === 'reservas' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('reservas')}
        >
          {t('aba.reservas')}
        </button>
        <button
          className={`tab ${abaAtiva === 'configuracoes' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('configuracoes')}
        >
          {t('aba.configuracoes')}
        </button>
      </div>

      {abaAtiva === 'dashboard' && <Dashboard tipo="CORDENADOR" nome={usuario?.name} />}
      {abaAtiva === 'salas' && <AbaSalas mostrarToast={mostrarToast} />}
      {abaAtiva === 'usuarios' && <AbaUsuarios mostrarToast={mostrarToast} />}
      {abaAtiva === 'reservas' && <AbaReservas mostrarToast={mostrarToast} />}
      {abaAtiva === 'configuracoes' && <AbaConfiguracoes mostrarToast={mostrarToast} />}

      <Toast toast={toast} />
    </div>
  );
}
