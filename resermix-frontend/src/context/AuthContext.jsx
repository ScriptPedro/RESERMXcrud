import { createContext, useContext, useState, useEffect } from 'react';
import { usuariosApi } from '../services/api';

const AuthContext = createContext(null);

const STORAGE_KEY = 'resermix_usuario_logado';

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  // Mantém o login entre recarregamentos de página (sessionStorage = some ao fechar a aba)
  useEffect(() => {
    const salvo = sessionStorage.getItem(STORAGE_KEY);
    if (salvo) {
      try {
        setUsuario(JSON.parse(salvo));
      } catch {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    }
    setCarregando(false);
  }, []);

  async function login(email, senha) {
    const todosUsuarios = await usuariosApi.listar();

    const encontrado = todosUsuarios.find(
      (u) => (u.email || '').toLowerCase() === email.trim().toLowerCase()
    );

    if (!encontrado) {
      throw new Error('E-mail não encontrado.');
    }
    if (encontrado.senha !== senha) {
      throw new Error('Senha incorreta.');
    }

    // Não guardamos a senha em memória/sessão por segurança básica
    const { senha: _senha, ...usuarioSemSenha } = encontrado;
    setUsuario(usuarioSemSenha);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(usuarioSemSenha));
    return usuarioSemSenha;
  }

  function logout() {
    setUsuario(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  return (
    <AuthContext.Provider value={{ usuario, login, logout, carregando }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de um AuthProvider');
  return ctx;
}
