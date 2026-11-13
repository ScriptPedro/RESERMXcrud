import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/ConfiguracoesContext';
import { useToast } from '../components/Toast';
import Toast from '../components/Toast';
import { reservasApi } from '../services/api';
import Dashboard from '../components/Dashboard';
import AbaConfiguracoes from '../components/AbaConfiguracoes';
import AbaReservar from '../components/AbaReservar';
import { statusInfo, formatarData, formatarHora } from '../utils/reserva';

export default function Professor() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const { toast, mostrarToast } = useToast();
  const [abaAtiva, setAbaAtiva] = useState('dashboard');

  const [minhasReservas, setMinhasReservas] = useState([]);
  const [estadoReservas, setEstadoReservas] = useState('carregando');
  const [cancelandoId, setCancelandoId] = useState(null);

  const carregarMinhasReservas = useCallback(async () => {
    if (!usuario?.id) return;
    setEstadoReservas('carregando');
    try {
      const dados = await reservasApi.buscarPorUsuario(usuario.id);
      setMinhasReservas(dados);
      setEstadoReservas('ok');
    } catch {
      setEstadoReservas('erro');
    }
  }, [usuario?.id]);

  useEffect(() => {
    if (abaAtiva === 'minhas-reservas') carregarMinhasReservas();
  }, [abaAtiva, carregarMinhasReservas]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  async function handleCancelar(id) {
    if (!confirm(t('reserva.confirmarCancelamento'))) return;
    setCancelandoId(id);
    try {
      await reservasApi.cancelar(id);
      mostrarToast(t('reserva.cancelada'));
      await carregarMinhasReservas();
    } catch (e) {
      mostrarToast(t('reserva.erroCancelar') + e.message, 'error');
    } finally {
      setCancelandoId(null);
    }
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h1>{t('app.nome')}</h1>
          <p className="subtitle">{t('topbar.areaProfessor')}</p>
        </div>
        <div className="user-chip">
          <span className="badge-tipo prof">{t('topbar.professor')}</span>
          <span className="nome">{usuario?.name}</span>
          <button className="btn-logout" onClick={handleLogout}>{t('geral.sair')}</button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${abaAtiva === 'dashboard' ? 'active' : ''}`} onClick={() => setAbaAtiva('dashboard')}>
          {t('aba.dashboard')}
        </button>
        <button className={`tab ${abaAtiva === 'reservar' ? 'active' : ''}`} onClick={() => setAbaAtiva('reservar')}>
          {t('aba.reservar')}
        </button>
        <button className={`tab ${abaAtiva === 'minhas-reservas' ? 'active' : ''}`} onClick={() => setAbaAtiva('minhas-reservas')}>
          {t('aba.minhasReservas')}
        </button>
        <button className={`tab ${abaAtiva === 'configuracoes' ? 'active' : ''}`} onClick={() => setAbaAtiva('configuracoes')}>
          {t('aba.configuracoes')}
        </button>
      </div>

      {abaAtiva === 'dashboard' && <Dashboard tipo="PROFESSOR" nome={usuario?.name} />}

      {abaAtiva === 'reservar' && <AbaReservar usuario={usuario} mostrarToast={mostrarToast} />}

      {abaAtiva === 'minhas-reservas' && (
        <div className="card">
          <div className="card-header-row">
            <div className="card-title"><span className="dot"></span>{t('aba.minhasReservas')}</div>
            <button className="btn-sm" onClick={carregarMinhasReservas}>{t('reserva.recarregar')}</button>
          </div>

          {estadoReservas === 'carregando' && (
            <div className="loading"><span className="spinner"></span>{t('geral.carregando')}</div>
          )}
          {estadoReservas === 'erro' && (
            <div className="error-msg">{t('reserva.erroApi')}</div>
          )}
          {estadoReservas === 'ok' && minhasReservas.length === 0 && (
            <div className="empty">{t('reserva.semReservas')}</div>
          )}
          {estadoReservas === 'ok' && minhasReservas.length > 0 && (
            <div className="table-wrap">
              <table>
                <colgroup>
                  <col style={{ width: 160 }} /><col style={{ width: 100 }} /><col style={{ width: 130 }} />
                  <col style={{ width: 110 }} /><col /><col style={{ width: 100 }} />
                </colgroup>
                <thead>
                  <tr><th>{t('reserva.sala')}</th><th>{t('reserva.data')}</th><th>{t('reserva.horario')}</th><th>{t('reserva.status')}</th><th>{t('reserva.observacoes')}</th><th>{t('reserva.acoes')}</th></tr>
                </thead>
                <tbody>
                  {minhasReservas.map((r) => {
                    const info = statusInfo(r.status);
                    const podeCancel = r.status !== 'CANCELADA' && r.status !== 'FINALIZADA';
                    return (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 500 }}>{r.sala?.name || '—'}</td>
                        <td>{formatarData(r.data)}</td>
                        <td>{formatarHora(r.horarioInicio)} - {formatarHora(r.horarioFim)}</td>
                        <td><span className={`badge ${info.classe}`}><i className="badge-ico" aria-hidden="true"></i>{r.status ? t(`status.${r.status}`) : info.texto}</span></td>
                        <td className="txt-suave">{r.observacao || '—'}</td>
                        <td>
                          {podeCancel && (
                            <button
                              className="btn-icon del"
                              disabled={cancelandoId === r.id}
                              onClick={() => handleCancelar(r.id)}
                            >
                              {cancelandoId === r.id ? '...' : t('geral.cancelar')}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {abaAtiva === 'configuracoes' && <AbaConfiguracoes mostrarToast={mostrarToast} />}

      <Toast toast={toast} />
    </div>
  );
}
