import { useConfiguracoes, TAMANHOS_FONTE } from '../context/ConfiguracoesContext';
import Interruptor from './Interruptor';

export default function AbaConfiguracoes({ mostrarToast }) {
  const {
    temaEscuro,
    tamanhoFonte,
    daltonico,
    idioma,
    idiomasDisponiveis,
    t,
    definirTemaEscuro,
    definirDaltonico,
    mudarTamanhoFonte,
    mudarIdioma,
    restaurarPadrao,
  } = useConfiguracoes();

  function handleTema(ligado) {
    definirTemaEscuro(ligado);
    mostrarToast?.(ligado ? t('config.temaEscuroAtivado') : t('config.temaClaroAtivado'));
  }

  function handleDaltonico(ligado) {
    definirDaltonico(ligado);
    mostrarToast?.(ligado ? t('config.daltonicoAtivado') : t('config.daltonicoDesativado'));
  }

  function handleTamanho(novo) {
    mudarTamanhoFonte(novo);
    mostrarToast?.(t('config.tamanhoAlterado'));
  }

  function handleIdioma(e) {
    mudarIdioma(e.target.value);
    mostrarToast?.(t('config.idiomaAlterado'));
  }

  function handleRestaurar() {
    restaurarPadrao();
    mostrarToast?.(t('config.restaurado'));
  }

  return (
    <div>
      <div className="card">
        <div className="card-title"><span className="dot"></span>{t('config.titulo')}</div>
        <p className="config-descricao">{t('config.descricao')}</p>

        {/* Tema escuro */}
        <div className="config-opcao">
          <div className="config-opcao-texto">
            <label htmlFor="toggle-tema">{t('config.temaEscuro')}</label>
            <span className="config-opcao-ajuda">{t('config.temaEscuroAjuda')}</span>
          </div>
          <Interruptor id="toggle-tema" checked={temaEscuro} onChange={handleTema} />
        </div>

        {/* Tamanho da letra: 3 níveis */}
        <div className="config-opcao">
          <div className="config-opcao-texto">
            <span id="rotulo-tamanho" className="config-opcao-titulo">{t('config.tamanhoFonte')}</span>
            <span className="config-opcao-ajuda">{t('config.tamanhoFonteAjuda')}</span>
          </div>
          <div className="seletor-tamanho" role="radiogroup" aria-labelledby="rotulo-tamanho">
            {TAMANHOS_FONTE.map((nivel) => (
              <button
                key={nivel}
                type="button"
                role="radio"
                aria-checked={tamanhoFonte === nivel}
                className={`opcao-tamanho nivel-${nivel} ${tamanhoFonte === nivel ? 'ativo' : ''}`}
                onClick={() => handleTamanho(nivel)}
              >
                <span className="opcao-tamanho-letra" aria-hidden="true">Aa</span>
                <span className="opcao-tamanho-nome">{t(`config.tamanho.${nivel}`)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Modo daltônico */}
        <div className="config-opcao">
          <div className="config-opcao-texto">
            <label htmlFor="toggle-daltonico">{t('config.daltonico')}</label>
            <span className="config-opcao-ajuda">{t('config.daltonicoAjuda')}</span>
            <div className="paleta-previa" aria-hidden="true">
              <span className="badge confirmada"><i className="badge-ico"></i>{t('status.CONFIRMADA')}</span>
              <span className="badge cancelada"><i className="badge-ico"></i>{t('status.CANCELADA')}</span>
              <span className="badge pendente"><i className="badge-ico"></i>{t('status.PENDENTE')}</span>
            </div>
          </div>
          <Interruptor id="toggle-daltonico" checked={daltonico} onChange={handleDaltonico} />
        </div>

        {/* Idioma */}
        <div className="config-opcao">
          <div className="config-opcao-texto">
            <label htmlFor="select-idioma">{t('config.idioma')}</label>
            <span className="config-opcao-ajuda">{t('config.idiomaAjuda')}</span>
          </div>
          <div className="config-opcao-controle">
            <select id="select-idioma" value={idioma} onChange={handleIdioma}>
              {idiomasDisponiveis.map((op) => (
                <option key={op.codigo} value={op.codigo}>
                  {op.bandeira} {op.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="btn-row">
          <button className="btn btn-secondary" onClick={handleRestaurar}>
            {t('config.restaurar')}
          </button>
        </div>
      </div>
    </div>
  );
}
