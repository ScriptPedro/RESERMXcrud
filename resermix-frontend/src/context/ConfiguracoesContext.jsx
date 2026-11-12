import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { traduzir, IDIOMA_PADRAO, IDIOMAS_DISPONIVEIS, TRADUCOES } from '../i18n/traducoes';

const ConfiguracoesContext = createContext(null);

const STORAGE_KEY = 'resermix_configuracoes';

// Três níveis de tamanho de letra. O fator multiplica todas as fontes do sistema
// (ver --escala em index.css).
export const TAMANHOS_FONTE = ['normal', 'grande', 'extra'];

const PADRAO = {
  temaEscuro: false,
  tamanhoFonte: 'normal',
  daltonico: false,
  idioma: IDIOMA_PADRAO,
};

function carregarConfigSalva() {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (!salvo) return PADRAO;
    const parsed = JSON.parse(salvo);

    // Compatibilidade: versões anteriores guardavam só "fonteGrande: true/false"
    let tamanhoFonte = parsed.tamanhoFonte;
    if (!TAMANHOS_FONTE.includes(tamanhoFonte)) {
      tamanhoFonte = parsed.fonteGrande ? 'grande' : 'normal';
    }

    return {
      temaEscuro: !!parsed.temaEscuro,
      tamanhoFonte,
      daltonico: !!parsed.daltonico,
      // só aceita idioma que realmente existe no dicionário
      idioma: TRADUCOES[parsed.idioma] ? parsed.idioma : IDIOMA_PADRAO,
    };
  } catch {
    return PADRAO;
  }
}

export function ConfiguracoesProvider({ children }) {
  const [temaEscuro, setTemaEscuro] = useState(() => carregarConfigSalva().temaEscuro);
  const [tamanhoFonte, setTamanhoFonte] = useState(() => carregarConfigSalva().tamanhoFonte);
  const [daltonico, setDaltonico] = useState(() => carregarConfigSalva().daltonico);
  const [idioma, setIdioma] = useState(() => carregarConfigSalva().idioma);

  // Aplica as classes no <html> para que o CSS global reaja às preferências
  useEffect(() => {
    const raiz = document.documentElement;
    raiz.classList.toggle('tema-escuro', temaEscuro);
    raiz.classList.toggle('daltonico', daltonico);
    raiz.classList.remove('fonte-normal', 'fonte-grande', 'fonte-extra');
    raiz.classList.add(`fonte-${tamanhoFonte}`);
  }, [temaEscuro, tamanhoFonte, daltonico]);

  // Mantém o atributo lang do documento em dia (acessibilidade / leitores de tela)
  useEffect(() => {
    document.documentElement.setAttribute('lang', idioma);
  }, [idioma]);

  // Persiste a preferência do usuário entre sessões
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ temaEscuro, tamanhoFonte, daltonico, idioma })
      );
    } catch {
      // navegador com armazenamento bloqueado: a preferência vale só nesta sessão
    }
  }, [temaEscuro, tamanhoFonte, daltonico, idioma]);

  // Função de tradução usada pelos componentes: t('aba.salas')
  const t = useCallback((chave) => traduzir(idioma, chave), [idioma]);

  function mudarTamanhoFonte(novo) {
    if (TAMANHOS_FONTE.includes(novo)) setTamanhoFonte(novo);
  }

  function mudarIdioma(novoIdioma) {
    if (TRADUCOES[novoIdioma]) setIdioma(novoIdioma);
  }

  function restaurarPadrao() {
    setTemaEscuro(PADRAO.temaEscuro);
    setTamanhoFonte(PADRAO.tamanhoFonte);
    setDaltonico(PADRAO.daltonico);
    setIdioma(PADRAO.idioma);
  }

  return (
    <ConfiguracoesContext.Provider
      value={{
        temaEscuro,
        tamanhoFonte,
        daltonico,
        idioma,
        idiomasDisponiveis: IDIOMAS_DISPONIVEIS,
        t,
        definirTemaEscuro: setTemaEscuro,
        definirDaltonico: setDaltonico,
        mudarTamanhoFonte,
        mudarIdioma,
        restaurarPadrao,
      }}
    >
      {children}
    </ConfiguracoesContext.Provider>
  );
}

export function useConfiguracoes() {
  const ctx = useContext(ConfiguracoesContext);
  if (!ctx) throw new Error('useConfiguracoes precisa estar dentro de um ConfiguracoesProvider');
  return ctx;
}

// Atalho para quem só precisa traduzir: const t = useT();
export function useT() {
  return useConfiguracoes().t;
}
