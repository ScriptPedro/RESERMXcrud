import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { salasApi } from '../services/api';

export default function Professor() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const [salas, setSalas] = useState([]);
  const [busca, setBusca] = useState('');
  const [estado, setEstado] = useState('carregando'); // carregando | ok | erro

  const carregarSalas = useCallback(async () => {
    setEstado('carregando');
    try {
      const dados = await salasApi.listarDisponiveis();
      setSalas(dados);
      setEstado('ok');
    } catch {
      setEstado('erro');
    }
  }, []);

  useEffect(() => {
    carregarSalas();
  }, [carregarSalas]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const filtradas = salas.filter((s) =>
    (s.name || '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>ReserMix</h1>
          <p className="subtitle">Salas disponíveis para reserva</p>
        </div>
        <div className="user-chip">
          <span className="badge-tipo prof">Prof.</span>
          <span className="nome">{usuario?.name}</span>
          <button className="btn-logout" onClick={handleLogout}>Sair</button>
        </div>
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="metric-label">Salas disponíveis agora</div>
          <div className="metric-value orange">{salas.length}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Capacidade total disponível</div>
          <div className="metric-value">
            {salas.reduce((acc, s) => acc + Number(s.capacidade || 0), 0)}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title"><span className="dot"></span>Buscar sala</div>
        <div className="search-row">
          <input
            placeholder="Buscar por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <button className="btn-sm" onClick={carregarSalas}>Recarregar</button>
        </div>

        {estado === 'carregando' && (
          <div className="loading"><span className="spinner"></span>Carregando...</div>
        )}

        {estado === 'erro' && (
          <div className="error-msg">Não foi possível conectar à API.</div>
        )}

        {estado === 'ok' && filtradas.length === 0 && (
          <div className="empty">Nenhuma sala disponível encontrada.</div>
        )}

        {estado === 'ok' && filtradas.length > 0 && (
          <div className="salas-grid">
            {filtradas.map((s) => (
              <div className="sala-card" key={s.id}>
                <div className="sala-nome">{s.name}</div>
                <div className="sala-cap">{s.capacidade} pessoas</div>
                <span className="badge sim">● Disponível</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
