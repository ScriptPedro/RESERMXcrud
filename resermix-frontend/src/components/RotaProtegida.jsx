import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RotaProtegida({ tiposPermitidos, children }) {
  const { usuario, carregando } = useAuth();

  if (carregando) return null;

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  if (tiposPermitidos && !tiposPermitidos.includes(usuario.dtype)) {
    // Usuário logado, mas tentando acessar a tela de outro perfil
    const destino = usuario.dtype === 'CORDENADOR' ? '/coordenador' : '/professor';
    return <Navigate to={destino} replace />;
  }

  return children;
}
