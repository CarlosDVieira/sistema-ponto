import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Pages
import Login         from './pages/Login';
import Ponto         from './pages/Ponto';
import Relatorio     from './pages/Relatorio';
import Perfil        from './pages/Perfil';
import Departamento  from './pages/Departamento';
import AdminPainel   from './pages/admin/AdminPainel';
import AdminUsuarios from './pages/admin/AdminUsuarios';
import AdminUsuarioForm from './pages/admin/AdminUsuarioForm';
import AdminEmpresas from './pages/admin/AdminEmpresas';
import AdminEmpresaForm from './pages/admin/AdminEmpresaForm';
import AdminDepartamentos from './pages/admin/AdminDepartamentos';

// Guard de rota privada
function PrivateRoute({ children, roles }) {
  const { usuario, carregando } = useAuth();
  if (carregando) return <div className="loading-screen">Carregando...</div>;
  if (!usuario)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(usuario.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Pública */}
      <Route path="/login" element={<Login />} />

      {/* Privadas — todos os perfis */}
      <Route path="/" element={<PrivateRoute><Ponto /></PrivateRoute>} />
      <Route path="/relatorio" element={<PrivateRoute><Relatorio /></PrivateRoute>} />
      <Route path="/perfil"    element={<PrivateRoute><Perfil /></PrivateRoute>} />

      {/* Supervisor + Admin + Master */}
      <Route path="/departamento" element={
        <PrivateRoute roles={['master','admin','supervisor']}>
          <Departamento />
        </PrivateRoute>
      }/>

      {/* Admin + Master */}
      <Route path="/admin"           element={<PrivateRoute roles={['master','admin']}><AdminPainel /></PrivateRoute>} />
      <Route path="/admin/usuarios"  element={<PrivateRoute roles={['master','admin']}><AdminUsuarios /></PrivateRoute>} />
      <Route path="/admin/usuarios/novo"  element={<PrivateRoute roles={['master','admin']}><AdminUsuarioForm /></PrivateRoute>} />
      <Route path="/admin/usuarios/:id"   element={<PrivateRoute roles={['master','admin']}><AdminUsuarioForm /></PrivateRoute>} />
      <Route path="/admin/departamentos"  element={<PrivateRoute roles={['master','admin']}><AdminDepartamentos /></PrivateRoute>} />

      {/* Somente master */}
      <Route path="/admin/empresas"      element={<PrivateRoute roles={['master']}><AdminEmpresas /></PrivateRoute>} />
      <Route path="/admin/empresas/nova" element={<PrivateRoute roles={['master']}><AdminEmpresaForm /></PrivateRoute>} />
      <Route path="/admin/empresas/:id"  element={<PrivateRoute roles={['master']}><AdminEmpresaForm /></PrivateRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
