import { useState, useEffect, useCallback } from 'react';
import { salasApi } from '../services/api';

const SALA_VAZIA = { name: '', capacidade: '', disponivel: true };

export default function AbaSalas({ mostrarToast }) {
  const [salas, setSalas] = useState([]);
  const [busca, setBusca] = useState('');
  const [estado, setEstado] = useState('carregando'); // carregando | ok | erro
  const [novaSala, setNovaSala] = useState(SALA_VAZIA);
  const [salvandoNova, setSalvandoNova] = useState(false);

  const [editando, setEditando] = useState(null); // sala sendo editada no modal
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const carregarSalas = useCallback(async () => {
    setEstado('carregando');
    try {
      const dados = await salasApi.listar();
      setSalas(dados);
      setEstado('ok');
    } catch {
      setEstado('erro');
    }
  }, []);

  useEffect(() => {
    carregarSalas();
  }, [carregarSalas]);

  const filtradas = salas.filter((s) =>
    (s.name || '').toLowerCase().includes(busca.toLowerCase())
  );

  const totalCapacidade = salas.reduce((acc, s) => acc + Number(s.capacidade || 0), 0);
  const totalDisponiveis = salas.filter((s) => s.disponivel).length;

  async function handleSalvarNova() {
    if (!novaSala.name.trim() || !novaSala.capacidade) {
      mostrarToast('Preencha nome e capacidade!', 'error');
      return;
    }
    setSalvandoNova(true);
    try {
      await salasApi.criar({
        name: novaSala.name.trim(),
        capacidade: Number(novaSala.capacidade),
        disponivel: novaSala.disponivel,
      });
      mostrarToast('Sala cadastrada!');
      setNovaSala(SALA_VAZIA);
      await carregarSalas();
    } catch (e) {
      mostrarToast('Erro ao salvar: ' + e.message, 'error');
    } finally {
      setSalvandoNova(false);
    }
  }

  async function handleExcluir(id) {
    if (!confirm('Tem certeza que deseja excluir esta sala?')) return;
    try {
      await salasApi.excluir(id);
      mostrarToast('Sala excluída.');
      await carregarSalas();
    } catch (e) {
      mostrarToast('Erro ao excluir: ' + e.message, 'error');
    }
  }

  function abrirEdicao(sala) {
    setEditando({ ...sala, capacidade: String(sala.capacidade ?? '') });
  }

  async function handleSalvarEdicao() {
    if (!editando.name.trim() || !editando.capacidade) {
      mostrarToast('Preencha nome e capacidade!', 'error');
      return;
    }
    setSalvandoEdicao(true);
    try {
      await salasApi.atualizar(editando.id, {
        name: editando.name.trim(),
        capacidade: Number(editando.capacidade),
        disponivel: editando.disponivel,
      });
      mostrarToast('Sala atualizada!');
      setEditando(null);
      await carregarSalas();
    } catch (e) {
      mostrarToast('Erro ao salvar: ' + e.message, 'error');
    } finally {
      setSalvandoEdicao(false);
    }
  }

  return (
    <div>
      <div className="metrics">
        <div className="metric">
          <div className="metric-label">Total de salas</div>
          <div className="metric-value orange">{salas.length}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Disponíveis</div>
          <div className="metric-value">{totalDisponiveis}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Capacidade total</div>
          <div className="metric-value">{totalCapacidade}</div>
        </div>
      </div>

      {/* Formulário nova sala */}
      <div className="card">
        <div className="card-title"><span className="dot"></span>Nova sala</div>
        <div className="section-label">Cadastrar — POST /salas</div>
        <div className="form-row">
          <div className="form-group">
            <label>Nome *</label>
            <input
              placeholder="Ex: Sala A1"
              value={novaSala.name}
              onChange={(e) => setNovaSala({ ...novaSala, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Capacidade *</label>
            <input
              type="number"
              min="1"
              placeholder="Ex: 30"
              value={novaSala.capacidade}
              onChange={(e) => setNovaSala({ ...novaSala, capacidade: e.target.value })}
            />
          </div>
        </div>
        <div className="form-group form-row-full">
          <label>Disponível</label>
          <div className="toggle-wrap">
            <input
              type="checkbox"
              className="toggle"
              id="nova-sala-disp"
              checked={novaSala.disponivel}
              onChange={(e) => setNovaSala({ ...novaSala, disponivel: e.target.checked })}
            />
            <label htmlFor="nova-sala-disp">Sala disponível para reserva</label>
          </div>
        </div>
        <div className="btn-row">
          <button className="btn btn-primary" disabled={salvandoNova} onClick={handleSalvarNova}>
            {salvandoNova ? 'Salvando...' : 'Salvar sala'}
          </button>
          <button className="btn btn-secondary" onClick={() => setNovaSala(SALA_VAZIA)}>
            Cancelar
          </button>
        </div>
      </div>

      {/* Tabela de salas */}
      <div className="card">
        <div className="card-title"><span className="dot"></span>Salas cadastradas</div>
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
        {estado === 'ok' && (
          <div className="table-wrap">
            <table>
              <colgroup>
                <col style={{ width: 50 }} /><col style={{ width: 160 }} /><col style={{ width: 100 }} />
                <col style={{ width: 110 }} /><col style={{ width: 130 }} />
              </colgroup>
              <thead>
                <tr><th>ID</th><th>Nome</th><th>Capacidade</th><th>Disponível</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {filtradas.map((s) => (
                  <tr key={s.id}>
                    <td style={{ color: '#888780', fontSize: 12 }}>{s.id}</td>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td>{s.capacidade != null ? `${s.capacidade} pess.` : '—'}</td>
                    <td>
                      {s.disponivel
                        ? <span className="badge sim">● Sim</span>
                        : <span className="badge nao">● Não</span>}
                    </td>
                    <td>
                      <div className="actions">
                        <button className="btn-icon" onClick={() => abrirEdicao(s)}>Editar</button>
                        <button className="btn-icon del" onClick={() => handleExcluir(s.id)}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtradas.length === 0 && <div className="empty">Nenhuma sala encontrada.</div>}
          </div>
        )}
      </div>

      {/* Modal de edição */}
      {editando && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) setEditando(null); }}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">
                <span className="dot"></span>
                <span>Editar sala — {editando.name || `#${editando.id}`}</span>
              </div>
              <button className="modal-close" onClick={() => setEditando(null)}>×</button>
            </div>
            <div className="section-label">PUT /salas/{editando.id}</div>
            <div className="form-row">
              <div className="form-group">
                <label>Nome *</label>
                <input
                  value={editando.name}
                  onChange={(e) => setEditando({ ...editando, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Capacidade *</label>
                <input
                  type="number"
                  min="1"
                  value={editando.capacidade}
                  onChange={(e) => setEditando({ ...editando, capacidade: e.target.value })}
                />
              </div>
            </div>
            <div className="form-group form-row-full">
              <label>Disponível</label>
              <div className="toggle-wrap">
                <input
                  type="checkbox"
                  className="toggle"
                  id="edit-sala-disp"
                  checked={!!editando.disponivel}
                  onChange={(e) => setEditando({ ...editando, disponivel: e.target.checked })}
                />
                <label htmlFor="edit-sala-disp">Sala disponível para reserva</label>
              </div>
            </div>
            <div className="btn-row">
              <button className="btn btn-primary" disabled={salvandoEdicao} onClick={handleSalvarEdicao}>
                {salvandoEdicao ? 'Salvando...' : 'Salvar alterações'}
              </button>
              <button className="btn btn-secondary" onClick={() => setEditando(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
