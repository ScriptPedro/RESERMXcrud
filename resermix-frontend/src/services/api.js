const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const texto = await res.text();
      if (texto) msg = texto;
    } catch {
      // sem corpo na resposta de erro
    }
    throw new Error(msg);
  }

  if (res.status === 204) return null; // no content (delete)
  return res.json();
}

// ── Usuários ────────────────────────────────────────────────────────────────
export const usuariosApi = {
  listar: () => request('/usuarios'),
  buscar: (id) => request(`/usuarios/${id}`),
  criar: (dados) =>
    request('/usuarios', { method: 'POST', body: JSON.stringify(dados) }),
  atualizar: (id, dados) =>
    request(`/usuarios/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  excluir: (id) => request(`/usuarios/${id}`, { method: 'DELETE' }),
};

// ── Salas ───────────────────────────────────────────────────────────────────
export const salasApi = {
  listar: () => request('/salas'),
  listarDisponiveis: () => request('/salas/disponiveis'),
  buscar: (id) => request(`/salas/${id}`),
  criar: (dados) =>
    request('/salas', { method: 'POST', body: JSON.stringify(dados) }),
  atualizar: (id, dados) =>
    request(`/salas/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  alterarStatus: (id, disponivel) =>
    request(`/salas/${id}/status?disponivel=${disponivel}`, { method: 'PATCH' }),
  excluir: (id) => request(`/salas/${id}`, { method: 'DELETE' }),
};
