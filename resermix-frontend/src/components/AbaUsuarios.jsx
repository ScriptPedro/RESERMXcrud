import { useState, useEffect, useCallback } from 'react';
import { usuariosApi } from '../services/api';

const USUARIO_VAZIO = { name: '', email: '', senha: '', dtype: 'PROFESSOR' };

export default function AbaUsuarios({ mostrarToast }) {
  const [usuarios, setUsuarios] = useState([]);
  const [busca, setBusca] = useState('');
  const [estado, setEstado] = useState('carregando'); // carregando | ok | erro
  const [novoUsuario, setNovoUsuario] = useState(USUARIO_VAZIO);
  const [salvandoNovo, setSalvandoNovo] = useState(false);

  const [editando, setEditando] = useState(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const carregarUsuarios = useCallback(async () => {
    setEstado('carregando');
    try {
      const dados = await usuariosApi.listar();
      setUsuarios(dados);
      setEstado('ok');
    } catch {
      setEstado('erro');
    }
  }, []);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  const filtrados = usuarios.filter(
    (u) =>
      (u.name || '').toLowerCase().includes(busca.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(busca.toLowerCase())
  );

  const totalProf = usuarios.filter((u) => u.dtype === 'PROFESSOR').length;
  const totalCord = usuarios.filter((u) => u.dtype === 'CORDENADOR').length;

  async function handleSalvarNovo() {
    const { name, email, senha, dtype } = novoUsuario;
    if (!name.trim() || !email.trim() || !senha) {
      mostrarToast('Preencha todos os campos obrigatórios!', 'error');
      return;
    }
    setSalvandoNovo(true);
    try {
      await usuariosApi.criar({ name: name.trim(), email: email.trim(), senha, dtype });
      mostrarToast('Usuário cadastrado!');
      setNovoUsuario(USUARIO_VAZIO);
      await carregarUsuarios();
    } catch (e) {
      mostrarToast('Erro: ' + e.message, 'error');
    } finally {
      setSalvandoNovo(false);
    }
  }

  async function handleExcluir(id) {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return;
    try {
      await usuariosApi.excluir(id);
      mostrarToast('Usuário excluído.');
      await carregarUsuarios();
    } catch (e) {
      mostrarToast('Erro ao excluir: ' + e.message, 'error');
    }
  }

  function abrirEdicao(usuario) {
    setEditando({ ...usuario, senha: '' });
  }

  async function handleSalvarEdicao() {
    if (!editando.name.trim() || !editando.email.trim()) {
      mostrarToast('Preencha nome e e-mail!', 'error');
      return;
    }
    setSalvandoEdicao(true);
    try {
      const body = {
        name: editando.name.trim(),
        email: editando.email.trim(),
        dtype: editando.dtype,
      };
      if (editando.senha) body.senha = editando.senha;

      await usuariosApi.atualizar(editando.id, body);
      mostrarToast('Usuário atualizado!');
      setEditando(null);
      await carregarUsuarios();
    } catch (e) {
      mostrarToast('Erro: ' + e.message, 'error');
    } finally {
      setSalvandoEdicao(false);
    }
  }

  return (
    <div>
      <div className="metrics">
        <div className="metric">
          <div className="metric-label">Total de usuários</div>
          <div className="metric-value orange">{usuarios.length}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Professores</div>
          <div className="metric-value">{totalProf}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Coordenadores</div>
          <div className="metric-value">{totalCord}</div>
        </div>
      </div>

      {/* Formulário novo usuário */}
      <div className="card">
        <div className="card-title"><span className="dot"></span>Novo usuário</div>
        <div className="section-label">Cadastrar — POST /usuarios</div>
        <div className="form-row">
          <div className="form-group">
            <label>Nome *</label>
            <input
              placeholder="Ex: João Silva"
              value={novoUsuario.name}
              onChange={(e) => setNovoUsuario({ ...novoUsuario, name: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Tipo *</label>
            <select
              value={novoUsuario.dtype}
              onChange={(e) => setNovoUsuario({ ...novoUsuario, dtype: e.target.value })}
            >
              <option value="PROFESSOR">Professor</option>
              <option value="CORDENADOR">Coordenador (Admin)</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>E-mail *</label>
            <input
              type="email"
              placeholder="Ex: joao@escola.com"
              value={novoUsuario.email}
              onChange={(e) => setNovoUsuario({ ...novoUsuario, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Senha *</label>
            <input
              type="password"
              placeholder="••••••••"
              value={novoUsuario.senha}
              onChange={(e) => setNovoUsuario({ ...novoUsuario, senha: e.target.value })}
            />
          </div>
        </div>
        <div className="btn-row">
          <button className="btn btn-primary" disabled={salvandoNovo} onClick={handleSalvarNovo}>
            {salvandoNovo ? 'Salvando...' : 'Salvar usuário'}
          </button>
          <button className="btn btn-secondary" onClick={() => setNovoUsuario(USUARIO_VAZIO)}>
            Cancelar
          </button>
        </div>
      </div>

      {/* Tabela de usuários */}
      <div className="card">
        <div className="card-title"><span className="dot"></span>Usuários cadastrados</div>
        <div className="search-row">
          <input
            placeholder="Buscar por nome ou e-mail..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <button className="btn-sm" onClick={carregarUsuarios}>Recarregar</button>
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
                <col style={{ width: 50 }} /><col style={{ width: 160 }} /><col style={{ width: 190 }} />
                <col style={{ width: 110 }} /><col style={{ width: 130 }} />
              </colgroup>
              <thead>
                <tr><th>ID</th><th>Nome</th><th>E-mail</th><th>Tipo</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {filtrados.map((u) => (
                  <tr key={u.id}>
                    <td style={{ color: '#888780', fontSize: 12 }}>{u.id}</td>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td style={{ color: '#888780', fontSize: 12 }}>{u.email}</td>
                    <td>
                      {u.dtype === 'CORDENADOR'
                        ? <span className="badge-tipo cord">Coord.</span>
                        : <span className="badge-tipo prof">Prof.</span>}
                    </td>
                    <td>
                      <div className="actions">
                        <button className="btn-icon" onClick={() => abrirEdicao(u)}>Editar</button>
                        <button className="btn-icon del" onClick={() => handleExcluir(u.id)}>Excluir</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtrados.length === 0 && <div className="empty">Nenhum usuário encontrado.</div>}
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
                <span>Editar usuário — {editando.name || `#${editando.id}`}</span>
              </div>
              <button className="modal-close" onClick={() => setEditando(null)}>×</button>
            </div>
            <div className="section-label">PUT /usuarios/{editando.id}</div>
            <div className="form-row">
              <div className="form-group">
                <label>Nome *</label>
                <input
                  value={editando.name}
                  onChange={(e) => setEditando({ ...editando, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Tipo *</label>
                <select
                  value={editando.dtype}
                  onChange={(e) => setEditando({ ...editando, dtype: e.target.value })}
                >
                  <option value="PROFESSOR">Professor</option>
                  <option value="CORDENADOR">Coordenador (Admin)</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>E-mail *</label>
                <input
                  type="email"
                  value={editando.email}
                  onChange={(e) => setEditando({ ...editando, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Nova senha <span style={{ color: '#bbb', fontSize: 11 }}>(deixe em branco para manter)</span></label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={editando.senha}
                  onChange={(e) => setEditando({ ...editando, senha: e.target.value })}
                />
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
