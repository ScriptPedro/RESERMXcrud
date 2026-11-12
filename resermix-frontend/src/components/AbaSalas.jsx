import { useState, useEffect, useCallback } from 'react';
import Interruptor from './Interruptor';
import RecursosSala from './RecursosSala';
import { salasApi } from '../services/api';

// Recursos: TVs e computadores são quantidades (0 = não tem); ar-condicionado e data show são sim/não.
const SALA_VAZIA = {
  name: '', capacidade: '', campus: '', disponivel: true,
  tvs: '', computadores: '', arCondicionado: false, dataShow: false,
};

// Aceita vazio (para apagar e redigitar) ou número inteiro >= 0
function quantidadeValida(valor) {
  return valor === '' || /^\d+$/.test(valor);
}

// Monta o trecho de recursos que vai no corpo do POST/PUT
function recursosParaApi(sala) {
  return {
    tvs: Number(sala.tvs || 0),
    computadores: Number(sala.computadores || 0),
    arCondicionado: !!sala.arCondicionado,
    dataShow: !!sala.dataShow,
  };
}

// Bloco de campos reutilizado nos modais de cadastro e de edição
function CamposRecursos({ valor, onChange, prefixo }) {
  return (
    <div className="recursos-form">
      <div className="section-label">Recursos da sala</div>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor={`${prefixo}-tvs`}>TVs (quantidade)</label>
          <input
            id={`${prefixo}-tvs`}
            type="number" min="0" step="1" placeholder="0"
            value={valor.tvs}
            onChange={(e) => { if (quantidadeValida(e.target.value)) onChange({ ...valor, tvs: e.target.value }); }}
          />
        </div>
        <div className="form-group">
          <label htmlFor={`${prefixo}-pcs`}>Computadores (quantidade)</label>
          <input
            id={`${prefixo}-pcs`}
            type="number" min="0" step="1" placeholder="0"
            value={valor.computadores}
            onChange={(e) => { if (quantidadeValida(e.target.value)) onChange({ ...valor, computadores: e.target.value }); }}
          />
        </div>
      </div>
      <Interruptor
        id={`${prefixo}-ar`}
        checked={!!valor.arCondicionado}
        onChange={(v) => onChange({ ...valor, arCondicionado: v })}
        rotulo="Ar-condicionado"
      />
      <Interruptor
        id={`${prefixo}-datashow`}
        checked={!!valor.dataShow}
        onChange={(v) => onChange({ ...valor, dataShow: v })}
        rotulo="Data show"
      />
    </div>
  );
}

// Campo de campus com sugestões dos campi já cadastrados (evita "Centro" e "centro" virarem campi diferentes)
function CampoCampus({ valor, onChange, prefixo, campiExistentes }) {
  return (
    <div className="form-group form-row-full">
      <label htmlFor={`${prefixo}-campus`}>Campus<span className="required-mark">*</span></label>
      <input
        id={`${prefixo}-campus`}
        list={`${prefixo}-campus-lista`}
        placeholder="Ex: Campus Centro"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
      />
      <datalist id={`${prefixo}-campus-lista`}>
        {campiExistentes.map((c) => <option key={c} value={c} />)}
      </datalist>
    </div>
  );
}

// Usa a grafia já cadastrada se o usuário digitar o mesmo campus com maiúsculas/minúsculas diferentes
function normalizarCampus(texto, campiExistentes) {
  const limpo = texto.trim();
  const igual = campiExistentes.find((c) => c.toLowerCase() === limpo.toLowerCase());
  return igual || limpo;
}

// Impede a digitação de números negativos ou zero (aceita vazio, para o usuário poder apagar e redigitar)
function capacidadeValida(valor) {
  if (valor === '') return true;
  return /^\d+$/.test(valor) && Number(valor) > 0;
}

export default function AbaSalas({ mostrarToast }) {
  const [salas, setSalas] = useState([]);
  const [busca, setBusca] = useState('');
  const [estado, setEstado] = useState('carregando'); // carregando | ok | erro

  const [modalAberto, setModalAberto] = useState(false); // modal de cadastro
  const [novaSala, setNovaSala] = useState(SALA_VAZIA);
  const [salvandoNova, setSalvandoNova] = useState(false);

  const [editando, setEditando] = useState(null); // sala sendo editada no modal
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);

  const [alterandoStatusId, setAlterandoStatusId] = useState(null); // id da sala com toggle em andamento

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

  const filtradas = salas.filter((s) => {
    const termo = busca.toLowerCase();
    return (s.name || '').toLowerCase().includes(termo) ||
      (s.campus || '').toLowerCase().includes(termo);
  });

  const campiExistentes = [...new Set(salas.map((s) => (s.campus || '').trim()).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const totalCapacidade = salas.reduce((acc, s) => acc + Number(s.capacidade || 0), 0);
  const totalDisponiveis = salas.filter((s) => s.disponivel).length;

  function abrirModalCadastro() {
    setNovaSala(SALA_VAZIA);
    setModalAberto(true);
  }

  function fecharModalCadastro() {
    setModalAberto(false);
    setNovaSala(SALA_VAZIA);
  }

  async function handleSalvarNova() {
    if (!novaSala.name.trim() || !novaSala.capacidade || !novaSala.campus.trim()) {
      mostrarToast('Preencha nome, capacidade e campus!', 'error');
      return;
    }
    if (Number(novaSala.capacidade) <= 0) {
      mostrarToast('A capacidade deve ser maior que zero!', 'error');
      return;
    }
    setSalvandoNova(true);
    try {
      await salasApi.criar({
        name: novaSala.name.trim(),
        capacidade: Number(novaSala.capacidade),
        campus: normalizarCampus(novaSala.campus, campiExistentes),
        disponivel: novaSala.disponivel,
        ...recursosParaApi(novaSala),
      });
      mostrarToast('Sala cadastrada!');
      setNovaSala(SALA_VAZIA); // limpa os campos do formulário
      setModalAberto(false);
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
    setEditando({
      ...sala,
      capacidade: String(sala.capacidade ?? ''),
      campus: sala.campus || '',
      tvs: String(sala.tvs ?? 0),
      computadores: String(sala.computadores ?? 0),
      arCondicionado: !!sala.arCondicionado,
      dataShow: !!sala.dataShow,
    });
  }

  async function handleSalvarEdicao() {
    if (!editando.name.trim() || !editando.capacidade || !editando.campus.trim()) {
      mostrarToast('Preencha nome, capacidade e campus!', 'error');
      return;
    }
    if (Number(editando.capacidade) <= 0) {
      mostrarToast('A capacidade deve ser maior que zero!', 'error');
      return;
    }
    setSalvandoEdicao(true);
    try {
      await salasApi.atualizar(editando.id, {
        name: editando.name.trim(),
        capacidade: Number(editando.capacidade),
        campus: normalizarCampus(editando.campus, campiExistentes),
        disponivel: editando.disponivel,
        ...recursosParaApi(editando),
      });
      mostrarToast('Sala atualizada!');
      setEditando(null); // limpa os campos do formulário de edição
      await carregarSalas();
    } catch (e) {
      mostrarToast('Erro ao salvar: ' + e.message, 'error');
    } finally {
      setSalvandoEdicao(false);
    }
  }

  // Habilita/desabilita a sala diretamente pela lista, sem precisar abrir o modal de edição.
  async function handleAlternarStatus(sala) {
    setAlterandoStatusId(sala.id);
    try {
      await salasApi.alterarStatus(sala.id, !sala.disponivel);
      mostrarToast(!sala.disponivel ? 'Sala habilitada!' : 'Sala desabilitada!');
      await carregarSalas();
    } catch (e) {
      mostrarToast('Erro ao alterar status: ' + e.message, 'error');
    } finally {
      setAlterandoStatusId(null);
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

      {/* Tabela de salas */}
      <div className="card">
        <div className="card-header-row">
          <div className="card-title"><span className="dot"></span>Salas cadastradas</div>
          <button className="btn-add" onClick={abrirModalCadastro}>+ Nova sala</button>
        </div>
        <div className="search-row">
          <input
            placeholder="Buscar por nome ou campus..."
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
                <col style={{ width: 50 }} /><col style={{ width: 150 }} /><col style={{ width: 130 }} /><col style={{ width: 100 }} />
                <col style={{ width: 260 }} /><col style={{ width: 110 }} /><col style={{ width: 130 }} />
              </colgroup>
              <thead>
                <tr><th>ID</th><th>Nome</th><th>Campus</th><th>Capacidade</th><th>Recursos</th><th>Disponível</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {filtradas.map((s) => (
                  <tr key={s.id}>
                    <td className="txt-suave">{s.id}</td>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td className={s.campus ? '' : 'txt-suave'}>{s.campus || '—'}</td>
                    <td>{s.capacidade != null ? `${s.capacidade} pess.` : '—'}</td>
                    <td><RecursosSala sala={s} /></td>
                    <td>
                      <span
                        className={`badge clicavel ${s.disponivel ? 'sim' : 'nao'}`}
                        title="Clique para habilitar/desabilitar"
                        onClick={() => (alterandoStatusId === s.id ? null : handleAlternarStatus(s))}
                      >
                        {alterandoStatusId === s.id
                          ? '...'
                          : <><i className="badge-ico" aria-hidden="true"></i>{s.disponivel ? 'Sim' : 'Não'}</>}
                      </span>
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

      {/* Modal de cadastro */}
      {modalAberto && (
        <div className="modal-overlay open" onClick={(e) => { if (e.target === e.currentTarget) fecharModalCadastro(); }}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">
                <span className="dot"></span>
                <span>Nova sala</span>
              </div>
              <button className="modal-close" onClick={fecharModalCadastro}>×</button>
            </div>
            <div className="section-label">Cadastrar — POST /salas</div>
            <div className="form-row">
              <div className="form-group">
                <label>Nome<span className="required-mark">*</span></label>
                <input
                  placeholder="Ex: Sala A1"
                  value={novaSala.name}
                  onChange={(e) => setNovaSala({ ...novaSala, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Capacidade<span className="required-mark">*</span></label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Ex: 30"
                  value={novaSala.capacidade}
                  onChange={(e) => {
                    if (capacidadeValida(e.target.value)) {
                      setNovaSala({ ...novaSala, capacidade: e.target.value });
                    }
                  }}
                />
              </div>
            </div>
            <CampoCampus
              valor={novaSala.campus}
              onChange={(v) => setNovaSala({ ...novaSala, campus: v })}
              prefixo="nova-sala"
              campiExistentes={campiExistentes}
            />
            <div className="form-group form-row-full">
              <label>Disponível</label>
              <Interruptor
                id="nova-sala-disp"
                checked={novaSala.disponivel}
                onChange={(valor) => setNovaSala({ ...novaSala, disponivel: valor })}
                rotulo="Sala disponível para reserva"
              />
            </div>
            <CamposRecursos valor={novaSala} onChange={setNovaSala} prefixo="nova-sala" />
            <div className="btn-row">
              <button className="btn btn-primary" disabled={salvandoNova} onClick={handleSalvarNova}>
                {salvandoNova ? 'Salvando...' : 'Salvar sala'}
              </button>
              <button className="btn btn-secondary" onClick={fecharModalCadastro}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

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
                <label>Nome<span className="required-mark">*</span></label>
                <input
                  value={editando.name}
                  onChange={(e) => setEditando({ ...editando, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Capacidade<span className="required-mark">*</span></label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={editando.capacidade}
                  onChange={(e) => {
                    if (capacidadeValida(e.target.value)) {
                      setEditando({ ...editando, capacidade: e.target.value });
                    }
                  }}
                />
              </div>
            </div>
            <CampoCampus
              valor={editando.campus}
              onChange={(v) => setEditando({ ...editando, campus: v })}
              prefixo="edit-sala"
              campiExistentes={campiExistentes}
            />
            <div className="form-group form-row-full">
              <label>Disponível</label>
              <Interruptor
                id="edit-sala-disp"
                checked={!!editando.disponivel}
                onChange={(valor) => setEditando({ ...editando, disponivel: valor })}
                rotulo="Sala disponível para reserva"
              />
            </div>
            <CamposRecursos valor={editando} onChange={setEditando} prefixo="edit-sala" />
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
