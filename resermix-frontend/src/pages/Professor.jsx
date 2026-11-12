import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/ConfiguracoesContext';
import { useToast } from '../components/Toast';
import Toast from '../components/Toast';
import { salasApi, reservasApi } from '../services/api';
import Dashboard from '../components/Dashboard';
import AbaConfiguracoes from '../components/AbaConfiguracoes';
import RecursosSala from '../components/RecursosSala';
import {
  statusInfo, formatarData, formatarHora,
  HORARIO_ABERTURA, HORARIO_FECHAMENTO, horarioForaDoFuncionamento,
  SEM_CAMPUS, campusDaSala, agruparPorCampus, hojeISO, reservaNoPassado,
} from '../utils/reserva';

const RESERVA_VAZIA = { salaId: '', data: '', horarioInicio: '', horarioFim: '', observacao: '' };

export default function Professor() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const t = useT();
  const { toast, mostrarToast } = useToast();
  const [abaAtiva, setAbaAtiva] = useState('dashboard');

  const [salas, setSalas] = useState([]);
  const [estadoSalas, setEstadoSalas] = useState('aguardando'); // aguardando | carregando | ok | erro
  const [reserva, setReserva] = useState(RESERVA_VAZIA);
  const [campusSelecionado, setCampusSelecionado] = useState('');
  const [enviando, setEnviando] = useState(false);

  const [minhasReservas, setMinhasReservas] = useState([]);
  const [estadoReservas, setEstadoReservas] = useState('carregando');
  const [cancelandoId, setCancelandoId] = useState(null);

  // Só buscamos salas quando o período (data + início + fim) está completo e válido,
  // porque a lista de salas livres depende desse período.
  const ordemInvalida =
    !!reserva.horarioInicio && !!reserva.horarioFim && reserva.horarioInicio >= reserva.horarioFim;
  const foraDoHorario = horarioForaDoFuncionamento(reserva.horarioInicio, reserva.horarioFim);
  const periodoValido =
    !!reserva.data && !!reserva.horarioInicio && !!reserva.horarioFim &&
    !ordemInvalida && !foraDoHorario;

  // Evita que uma resposta antiga sobrescreva uma mais nova se o usuário mexer rápido nos campos
  const ultimaBusca = useRef(0);

  const carregarSalas = useCallback(async () => {
    if (!periodoValido) {
      ultimaBusca.current += 1;
      setSalas([]);
      setEstadoSalas('aguardando');
      return;
    }
    const idBusca = ++ultimaBusca.current;
    setEstadoSalas('carregando');
    try {
      const dados = await salasApi.listarDisponiveisNoPeriodo(
        reserva.data, reserva.horarioInicio, reserva.horarioFim
      );
      if (idBusca !== ultimaBusca.current) return;
      setSalas(dados);
      setEstadoSalas('ok');
    } catch {
      if (idBusca !== ultimaBusca.current) return;
      setEstadoSalas('erro');
    }
  }, [periodoValido, reserva.data, reserva.horarioInicio, reserva.horarioFim]);

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
    if (abaAtiva === 'reservar') carregarSalas();
    if (abaAtiva === 'minhas-reservas') carregarMinhasReservas();
  }, [abaAtiva, carregarSalas, carregarMinhasReservas]);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  // Campus primeiro, sala depois: assim a lista de salas nunca fica enorme
  const campi = agruparPorCampus(salas);
  const salasDoCampus = campusSelecionado
    ? salas.filter((s) => campusDaSala(s) === campusSelecionado)
    : [];
  const salaSelecionada = salasDoCampus.find((s) => String(s.id) === String(reserva.salaId));
  const nomeCampus = (c) => (c === SEM_CAMPUS ? t('reserva.semCampus') : c);

  // Mantém campus e sala coerentes com a lista de salas livres mais recente
  useEffect(() => {
    if (estadoSalas !== 'ok') return;
    const existe = campi.some((c) => c.campus === campusSelecionado);
    if (!existe) {
      // Se só há um campus com salas livres, já deixa selecionado
      setCampusSelecionado(campi.length === 1 ? campi[0].campus : '');
    }
  }, [estadoSalas, salas]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const aindaNoCampus = salasDoCampus.some((s) => String(s.id) === String(reserva.salaId));
    if (!aindaNoCampus) {
      const primeira = salasDoCampus[0] ? String(salasDoCampus[0].id) : '';
      if (primeira !== reserva.salaId) setReserva((atual) => ({ ...atual, salaId: primeira }));
    }
  }, [campusSelecionado, salas]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleReservar() {
    if (!reserva.salaId || !reserva.data || !reserva.horarioInicio || !reserva.horarioFim) {
      mostrarToast(t('reserva.preenchaCampos'), 'error');
      return;
    }
    if (reserva.horarioInicio >= reserva.horarioFim) {
      mostrarToast(t('reserva.horarioInvalido'), 'error');
      return;
    }
    if (horarioForaDoFuncionamento(reserva.horarioInicio, reserva.horarioFim)) {
      mostrarToast(t('reserva.foraHorario'), 'error');
      return;
    }
    if (reservaNoPassado(reserva.data, reserva.horarioInicio)) {
      mostrarToast(t('reserva.dataPassada'), 'error');
      return;
    }
    setEnviando(true);
    try {
      await reservasApi.criar({
        usuarioId: usuario.id,
        salaId: Number(reserva.salaId),
        data: reserva.data,
        horarioInicio: reserva.horarioInicio,
        horarioFim: reserva.horarioFim,
        observacao: reserva.observacao || null,
      });
      mostrarToast(t('reserva.sucesso'));
      // Mantém data/horário para o professor ver a sala recém-reservada sumir da lista
      setReserva((atual) => ({ ...atual, observacao: '' }));
      await carregarSalas();
    } catch (e) {
      mostrarToast(t('reserva.falhou') + e.message, 'error');
    } finally {
      setEnviando(false);
    }
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

      {abaAtiva === 'reservar' && (
        <div>
          <div className="metrics">
            <div className="metric">
              <div className="metric-label">{t('reserva.salasLivresPeriodo')}</div>
              <div className="metric-value orange">{periodoValido && estadoSalas === 'ok' ? salas.length : '—'}</div>
            </div>
            <div className="metric">
              <div className="metric-label">{t('reserva.capacidadeTotal')}</div>
              <div className="metric-value">
                {periodoValido && estadoSalas === 'ok'
                  ? salas.reduce((acc, s) => acc + Number(s.capacidade || 0), 0)
                  : '—'}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title"><span className="dot"></span>{t('aba.reservar')}</div>

            {/* 1) Período primeiro: a lista de salas livres depende dele */}
            <div className="form-row-3">
              <div className="form-group">
                <label htmlFor="res-data">{t('reserva.data')}<span className="required-mark">*</span></label>
                <input
                  id="res-data"
                  type="date"
                  min={hojeISO()}
value={reserva.data}
                  onChange={(e) => setReserva({ ...reserva, data: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="res-ini">{t('reserva.horarioInicio')}<span className="required-mark">*</span></label>
                <input
                  id="res-ini"
                  type="time"
                  min={HORARIO_ABERTURA}
                  max={HORARIO_FECHAMENTO}
                  step="300"
                  value={reserva.horarioInicio}
                  onChange={(e) => setReserva({ ...reserva, horarioInicio: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label htmlFor="res-fim">{t('reserva.horarioFim')}<span className="required-mark">*</span></label>
                <input
                  id="res-fim"
                  type="time"
                  min={HORARIO_ABERTURA}
                  max={HORARIO_FECHAMENTO}
                  step="300"
                  value={reserva.horarioFim}
                  onChange={(e) => setReserva({ ...reserva, horarioFim: e.target.value })}
                />
              </div>
            </div>

            <div className="dica-campo">{t('reserva.horarioFuncionamento')}</div>

            {ordemInvalida && (
              <div className="error-msg">{t('reserva.horarioInvalido')}</div>
            )}
            {!ordemInvalida && foraDoHorario && (
              <div className="error-msg">{t('reserva.foraHorario')}</div>
            )}

            {/* 2) Estados da lista de salas */}
            {estadoSalas === 'aguardando' && !ordemInvalida && !foraDoHorario && (
              <div className="empty">{t('reserva.escolhaPeriodo')}</div>
            )}
            {estadoSalas === 'carregando' && (
              <div className="loading"><span className="spinner"></span>{t('geral.carregando')}</div>
            )}
            {estadoSalas === 'erro' && (
              <div className="error-msg">{t('reserva.erroApi')}</div>
            )}
            {estadoSalas === 'ok' && salas.length === 0 && (
              <div className="empty">{t('reserva.semSalasPeriodo')}</div>
            )}

            {/* 3) Só aparecem salas realmente livres nesse período */}
            {estadoSalas === 'ok' && salas.length > 0 && (
              <>
                <div className="select-sala-row">
                  <div className="form-group campo-campus">
                    <label htmlFor="res-campus">{t('reserva.campus')}</label>
                    <select
                      id="res-campus"
                      value={campusSelecionado}
                      onChange={(e) => setCampusSelecionado(e.target.value)}
                    >
                      <option value="" disabled>{t('reserva.selecioneCampus')}</option>
                      {campi.map(({ campus, total }) => (
                        <option key={campus} value={campus}>
                          {nomeCampus(campus)} ({total} {total === 1 ? t('reserva.salaLivre') : t('reserva.salasLivres')})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="res-sala">{t('reserva.sala')}</label>
                    <select
                      id="res-sala"
                      value={reserva.salaId}
                      disabled={!campusSelecionado}
                      onChange={(e) => setReserva({ ...reserva, salaId: e.target.value })}
                    >
                      {!campusSelecionado && <option value="">—</option>}
                      {salasDoCampus.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} — {s.capacidade} {t('reserva.pessoas')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button className="btn-sm" onClick={carregarSalas}>{t('reserva.recarregar')}</button>
                </div>

                {!campusSelecionado && (
                  <div className="empty">{t('reserva.escolhaCampus')}</div>
                )}

                {salaSelecionada && (
                  <div className="sala-detalhe" style={{ marginBottom: 14 }}>
                    <div className="sala-detalhe-info">
                      <div className="sala-nome">{salaSelecionada.name}</div>
                      <div className="sala-cap">
                        {salaSelecionada.capacidade} {t('reserva.pessoas')}
                        {salaSelecionada.campus ? ` · ${salaSelecionada.campus}` : ''}
                      </div>
                      <RecursosSala sala={salaSelecionada} />
                    </div>
                    <span className="badge sim"><i className="badge-ico" aria-hidden="true"></i>{t('sala.livrePeriodo')}</span>
                  </div>
                )}

                {salaSelecionada && (
                <>
                <div className="form-group form-row-full campo-compacto">
                  <label htmlFor="res-obs">{t('reserva.observacoes')}</label>
                  <input
                    id="res-obs"
                    placeholder={t('reserva.observacaoPlaceholder')}
                    value={reserva.observacao}
                    onChange={(e) => setReserva({ ...reserva, observacao: e.target.value })}
                  />
                </div>

                <div className="btn-row">
                  <button className="btn btn-primary" disabled={enviando} onClick={handleReservar}>
                    {enviando ? t('reserva.reservando') : t('aba.reservar')}
                  </button>
                </div>
                </>
                )}
              </>
            )}
          </div>
        </div>
      )}

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
