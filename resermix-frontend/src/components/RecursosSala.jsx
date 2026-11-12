import { useT } from '../context/ConfiguracoesContext';

/**
 * Mostra as tecnologias de uma sala como etiquetas: "2 TVs", "30 computadores",
 * "Ar-condicionado", "Data show". Só aparece o que a sala realmente tem.
 * Cada etiqueta tem ícone + texto (o ícone sozinho nunca carrega o significado).
 */
export function listarRecursos(sala, t) {
  if (!sala) return [];
  const itens = [];
  const tvs = Number(sala.tvs || 0);
  const pcs = Number(sala.computadores || 0);

  if (tvs > 0) {
    itens.push({ chave: 'tv', icone: '📺', texto: `${tvs} ${t(tvs === 1 ? 'recurso.tv.um' : 'recurso.tv.varios')}` });
  }
  if (pcs > 0) {
    itens.push({ chave: 'pc', icone: '💻', texto: `${pcs} ${t(pcs === 1 ? 'recurso.pc.um' : 'recurso.pc.varios')}` });
  }
  if (sala.arCondicionado) {
    itens.push({ chave: 'ar', icone: '❄️', texto: t('recurso.ar') });
  }
  if (sala.dataShow) {
    itens.push({ chave: 'ds', icone: '📽️', texto: t('recurso.datashow') });
  }
  return itens;
}

export default function RecursosSala({ sala }) {
  const t = useT();
  const itens = listarRecursos(sala, t);

  if (itens.length === 0) {
    return <div className="recursos-vazio">{t('recurso.nenhum')}</div>;
  }

  return (
    <ul className="recursos" aria-label={t('recurso.titulo')}>
      {itens.map((item) => (
        <li key={item.chave} className="recurso">
          <span className="recurso-icone" aria-hidden="true">{item.icone}</span>
          {item.texto}
        </li>
      ))}
    </ul>
  );
}
