// Mapeia o enum StatusReserva do backend para rótulo e classe CSS do badge.
export const STATUS_INFO = {
  PENDENTE: { texto: 'Pendente', classe: 'pendente' },
  CONFIRMADA: { texto: 'Confirmada', classe: 'confirmada' },
  EM_ANDAMENTO: { texto: 'Em andamento', classe: 'andamento' },
  FINALIZADA: { texto: 'Finalizada', classe: 'finalizada' },
  CANCELADA: { texto: 'Cancelada', classe: 'cancelada' },
};

export function statusInfo(status) {
  return STATUS_INFO[status] || { texto: status || '—', classe: '' };
}

// dd/mm/aaaa a partir de "aaaa-mm-dd"
export function formatarData(data) {
  if (!data) return '—';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

// HH:mm a partir de "HH:mm:ss"
export function formatarHora(hora) {
  if (!hora) return '—';
  return hora.slice(0, 5);
}

// Horário de funcionamento: reservas só entre 06:00 e 23:00 (mesma regra do backend)
export const HORARIO_ABERTURA = '06:00';
export const HORARIO_FECHAMENTO = '23:00';

export function horarioForaDoFuncionamento(inicio, fim) {
  return (!!inicio && inicio < HORARIO_ABERTURA) || (!!fim && fim > HORARIO_FECHAMENTO);
}

// Salas cadastradas antes do campo "campus" ficam agrupadas aqui
export const SEM_CAMPUS = '__sem_campus__';

export function campusDaSala(sala) {
  return (sala.campus || '').trim() || SEM_CAMPUS;
}

// Lista de campi (em ordem alfabética, "sem campus" por último) com quantas salas cada um tem
export function agruparPorCampus(salas) {
  const contagem = new Map();
  salas.forEach((s) => {
    const c = campusDaSala(s);
    contagem.set(c, (contagem.get(c) || 0) + 1);
  });
  return [...contagem.entries()]
    .map(([campus, total]) => ({ campus, total }))
    .sort((a, b) => {
      if (a.campus === SEM_CAMPUS) return 1;
      if (b.campus === SEM_CAMPUS) return -1;
      return a.campus.localeCompare(b.campus, 'pt-BR');
    });
}
