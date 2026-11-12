import { useState, useEffect, useCallback } from 'react';
import { salasApi, usuariosApi } from '../services/api';

/**
 * Tela inicial exibida logo após o login, tanto para o Coordenador quanto para o Professor.
 * - Coordenador: vê visão geral de salas + usuários do sistema.
 * - Professor: vê visão geral de salas disponíveis para reserva.
 */
export default function Dashboard({ tipo, nome }) {
  const [salas, setSalas] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [estado, setEstado] = useState('carregando'); // carregando | ok | erro

  const ehCoordenador = tipo === 'CORDENADOR';

  const carregar = useCallback(async () => {
    setEstado('carregando');
    try {
      const promessas = [salasApi.listar()];
      if (ehCoordenador) promessas.push(usuariosApi.listar());

      const resultados = await Promise.all(promessas);
      setSalas(resultados[0]);
      if (ehCoordenador) setUsuarios(resultados[1]);
      setEstado('ok');
    } catch {
      setEstado('erro');
    }
  }, [ehCoordenador]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const totalSalas = salas.length;
  const salasDisponiveis = salas.filter((s) => s.disponivel).length;
  const salasIndisponiveis = totalSalas - salasDisponiveis;
  const capacidadeTotal = salas.reduce((acc, s) => acc + Number(s.capacidade || 0), 0);
  const capacidadeDisponivel = salas
    .filter((s) => s.disponivel)
    .reduce((acc, s) => acc + Number(s.capacidade || 0), 0);
  const percentualDisponivel = totalSalas > 0 ? Math.round((salasDisponiveis / totalSalas) * 100) : 0;

  const totalUsuarios = usuarios.length;
  const totalProfessores = usuarios.filter((u) => u.dtype === 'PROFESSOR').length;
  const totalCoordenadores = usuarios.filter((u) => u.dtype === 'CORDENADOR').length;

  const maioresSalas = [...salas]
    .filter((s) => s.disponivel)
    .sort((a, b) => Number(b.capacidade || 0) - Number(a.capacidade || 0))
    .slice(0, 5);

  if (estado === 'carregando') {
    return (
      <div className="card">
        <div className="loading"><span className="spinner"></span>Carregando dashboard...</div>
      </div>
    );
  }

  if (estado === 'erro') {
    return (
      <div className="card">
        <div className="error-msg">Não foi possível carregar os dados do dashboard.</div>
        <div className="btn-row">
          <button className="btn-sm" onClick={carregar}>Tentar novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-title"><span className="dot"></span>
          Bem-vindo(a){nome ? `, ${nome}` : ''}!
        </div>
        <div className="txt-suave">
          {ehCoordenador
            ? 'Aqui está um resumo geral das salas e usuários cadastrados no sistema.'
            : 'Aqui está um resumo das salas disponíveis para reserva no momento.'}
        </div>
      </div>

      <div className="metrics">
        <div className="metric">
          <div className="metric-label">Salas disponíveis</div>
          <div className="metric-value orange">{salasDisponiveis}</div>
        </div>
        <div className="metric">
          <div className="metric-label">{ehCoordenador ? 'Total de salas' : 'Capacidade disponível'}</div>
          <div className="metric-value">{ehCoordenador ? totalSalas : capacidadeDisponivel}</div>
        </div>
        <div className="metric">
          <div className="metric-label">{ehCoordenador ? 'Salas indisponíveis' : '% de salas livres'}</div>
          <div className="metric-value">{ehCoordenador ? salasIndisponiveis : `${percentualDisponivel}%`}</div>
        </div>
      </div>

      {ehCoordenador && (
        <div className="metrics">
          <div className="metric">
            <div className="metric-label">Capacidade total</div>
            <div className="metric-value">{capacidadeTotal}</div>
          </div>
          <div className="metric">
            <div className="metric-label">Total de usuários</div>
            <div className="metric-value">{totalUsuarios}</div>
          </div>
          <div className="metric">
            <div className="metric-label">Professores / Coordenadores</div>
            <div className="metric-value">{totalProfessores} / {totalCoordenadores}</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-title">
          <span className="dot"></span>
          {ehCoordenador ? 'Salas com maior capacidade disponível' : 'Melhores opções disponíveis agora'}
        </div>
        {maioresSalas.length === 0 && (
          <div className="empty">Nenhuma sala disponível no momento.</div>
        )}
        {maioresSalas.length > 0 && (
          <div className="table-wrap">
            <table>
              <colgroup>
                <col style={{ width: 160 }} /><col style={{ width: 120 }} /><col />
              </colgroup>
              <thead>
                <tr><th>Nome</th><th>Capacidade</th><th>Status</th></tr>
              </thead>
              <tbody>
                {maioresSalas.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.name}</td>
                    <td>{s.capacidade} pess.</td>
                    <td><span className="badge sim"><i className="badge-ico" aria-hidden="true"></i>Disponível</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
