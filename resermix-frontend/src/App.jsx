import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RotaProtegida from './components/RotaProtegida';
import Login from './pages/Login';
import Coordenador from './pages/Coordenador';
import Professor from './pages/Professor';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/coordenador"
            element={
              <RotaProtegida tiposPermitidos={['CORDENADOR']}>
                <Coordenador />
              </RotaProtegida>
            }
          />

          <Route
            path="/professor"
            element={
              <RotaProtegida tiposPermitidos={['PROFESSOR']}>
                <Professor />
              </RotaProtegida>
            }
          />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
