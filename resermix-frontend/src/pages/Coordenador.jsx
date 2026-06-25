import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import Toast from '../components/Toast';
import AbaSalas from '../components/AbaSalas';
import AbaUsuarios from '../components/AbaUsuarios';

export default function Coordenador() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const { toast, mostrarToast } = useToast();
  const [abaAtiva, setAbaAtiva] = useState('salas');

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>ReserMix</h1>
          <p className="subtitle">resermix.crud.estagio — Gerenciamento</p>
        </div>
        <div className="user-chip">
          <span className="badge-tipo cord">Coord.</span>
          <span className="nome">{usuario?.name}</span>
          <button className="btn-logout" onClick={handleLogout}>Sair</button>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab ${abaAtiva === 'salas' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('salas')}
        >
          Salas
        </button>
        <button
          className={`tab ${abaAtiva === 'usuarios' ? 'active' : ''}`}
          onClick={() => setAbaAtiva('usuarios')}
        >
          Usuários
        </button>
      </div>

      {abaAtiva === 'salas' && <AbaSalas mostrarToast={mostrarToast} />}
      {abaAtiva === 'usuarios' && <AbaUsuarios mostrarToast={mostrarToast} />}

      <Toast toast={toast} />
    </div>
  );
}
