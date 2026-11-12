import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useT } from '../context/ConfiguracoesContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const t = useT();

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');

    if (!email.trim() || !senha) {
      setErro(t('login.preenchaCampos'));
      return;
    }

    setCarregando(true);
    try {
      const usuarioLogado = await login(email, senha);
      if (usuarioLogado.dtype === 'CORDENADOR') {
        navigate('/coordenador');
      } else {
        navigate('/professor');
      }
    } catch (err) {
      setErro(err.message || t('login.falhou'));
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-wrap">
      <div className="login-box">
        <h1>{t('app.nome')}</h1>
        <p className="subtitle">{t('login.subtitulo')}</p>

        {erro && <div className="login-error">{erro}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>{t('login.email')}<span className="required-mark">*</span></label>
            <input
              type="email"
              placeholder={t('login.emailPlaceholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>{t('login.senha')}<span className="required-mark">*</span></label>
            <input
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />
          </div>
          <div className="btn-row">
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={carregando}
            >
              {carregando ? t('login.entrando') : t('login.entrar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
