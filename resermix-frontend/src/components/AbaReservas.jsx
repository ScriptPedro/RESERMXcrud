import { useState, useEffect, useCallback } from 'react';
import { reservasApi, salasApi, usuariosApi } from '../services/api';
import { statusInfo, formatarData, formatarHora } from '../utils/reserva';

const FILTROS_VAZIOS = { salaId: '', usuarioId: '', status: '', dataInicio: '', dataFim: '' };

export default function AbaReservas({ mostrarToast }) {
  const [reservas, setReservas] = useState([]);
  const [salas, setSalas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);
  const [estado, setEstado] = useState('carregando'); // carregando | ok | erro
  const [cancelandoId, setCancelandoId] = useState(null);

  const carregarListas = useCallback(async () => {
    try {
      const [s, u] = await Promise.all([salasApi.listar(), usuariosApi.listar()]);
      setSalas(s);
      setUsuarios(u);
    } catch {
      // filtros ficam vazios se essa busca falhar; a tabela de reservas segue funcionando
    }
  }, []);

  const carregarReservas = useCallback(async () => {
    setEstado('carregando');
    try {
      const dados = await reservasApi.historico(filtros);
      setReservas(dados);
      setEstado('ok');
    } catch {
      setEstado('erro');
    }
  }, [filtros]);

  useEffect(() => {
    carregarListas();
  }, [carregarListas]);

  useEffect(() => {
    carregarReservas();
  }, [carregarReservas]);

  function limparFiltros() {
    setFiltros(FILTROS_VAZIOS);
  }

  async function handleCancelar(id) {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) return;
    setCancelandoId(id);
    try {
      await reservasApi.cancelar(id);
      mostrarToast('Reserva cancelada.');
      await carregarReservas();
    } catch (e) {
      mostrarToast('Erro ao cancelar: ' + e.message, 'error');
    } finally {
      setCancelandoId(null);
    }
  }

  const totalConfirmadas = reservas.filter((r) => r.status === 'CONFIRMADA').length;
  const totalCanceladas = reservas.filter((r) => r.status === 'CANCELADA').length;

  return (
    <div>
      <div className="metrics">
        <div className="metric">
          <div className="metric-label">Reservas no filtro atual</div>
          <div className="metric-value orange">{reservas.length}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Confirmadas</div>
          <div className="metric-value">{totalConfirmadas}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Canceladas</div>
          <div className="metric-value">{totalCanceladas}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header-row">
          <div className="card-title"><span className="dot"></span>Histórico de reservas</div>
          <button className="btn-sm" onClick={carregarReservas}>Recarregar</button>
        </div>

        <div className="filtros-row">
          <div className="form-group">
            <label>Sala</label>
            <select value={filtros.salaId} onChange={(e) => setFiltros({ ...filtros, salaId: e.target.value })}>
              <option value="">Todas</option>
              {salas.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Professor</label>
            <select value={filtros.usuarioId} onChange={(e) => setFiltros({ ...filtros, usuarioId: e.target.value })}>
              <option value="">Todos</option>
              {usuarios.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select value={filtros.status} onChange={(e) => setFiltros({ ...filtros, status: e.target.value })}>
              <option value="">Todos</option>
              <option value="PENDENTE">Pendente</option>
              <option value="CONFIRMADA">Confirmada</option>
              <option value="EM_ANDAMENTO">Em andamento</option>
              <option value="FINALIZADA">Finalizada</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </div>
          <button className="btn-sm" onClick={limparFiltros}>Limpar filtros</button>
        </div>
        <div className="filtros-row" style={{ marginTop: -6 }}>
          <div className="form-group">
            <label>De</label>
            <input type="date" value={filtros.dataInicio} onChange={(e) => setFiltros({ ...filtros, dataInicio: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Até</label>
            <input type="date" value={filtros.dataFim} onChange={(e) => setFiltros({ ...filtros, dataFim: e.target.value })} />
          </div>
        </div>

        {estado === 'carregando' && (
          <div className="loading"><span className="spinner"></span>Carregando...</div>
        )}
        {estado === 'erro' && (
          <div className="error-msg">Não foi possível conectar à API.</div>
        )}
        {estado === 'ok' && reservas.length === 0 && (
          <div className="empty">Nenhuma reserva encontrada para esse filtro.</div>
        )}
        {estado === 'ok' && reservas.length > 0 && (
          <div className="table-wrap">
            <table>
              <colgroup>
                <col style={{ width: 150 }} /><col style={{ width: 150 }} /><col style={{ width: 100 }} />
                <col style={{ width: 130 }} /><col style={{ width: 110 }} /><col /><col style={{ width: 100 }} />
              </colgroup>
              <thead>
                <tr><th>Sala</th><th>Professor</th><th>Data</th><th>Horário</th><th>Status</th><th>Observações</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {reservas.map((r) => {
                  const info = statusInfo(r.status);
                  const podeCancel = r.status !== 'CANCELADA' && r.status !== 'FINALIZADA';
                  return (
                    <tr key={r.id}>
                      <td style={{ fontWeight: 500 }}>{r.sala?.name || '—'}</td>
                      <td>{r.usuario?.name || '—'}</td>
                      <td>{formatarData(r.data)}</td>
                      <td>{formatarHora(r.horarioInicio)} - {formatarHora(r.horarioFim)}</td>
                      <td><span className={`badge ${info.classe}`}><i className="badge-ico" aria-hidden="true"></i>{info.texto}</span></td>
                      <td className="txt-suave">{r.observacao || '—'}</td>
                      <td>
                        {podeCancel && (
                          <button
                            className="btn-icon del"
                            disabled={cancelandoId === r.id}
                            onClick={() => handleCancelar(r.id)}
                          >
                            {cancelandoId === r.id ? '...' : 'Cancelar'}
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
    </div>
  );
}
