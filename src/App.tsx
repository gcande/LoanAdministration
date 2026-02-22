import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import LoansList from './pages/LoansList';
import NewLoan from './pages/NewLoan';
import Payments from './pages/Payments';
import Plans from './pages/Plans';
import Login from './pages/Login';
import Reports from './pages/Reports';
import Config from './pages/Config';
import UsersPage from './pages/Users';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta Publica */}
          <Route path="/login" element={<Login />} />
          
          {/* Rutas Protegidas (Cualquier Usuario Autenticado) */}
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/clientes" element={
            <ProtectedRoute>
              <Clients />
            </ProtectedRoute>
          } />
          
          <Route path="/prestamos" element={
            <ProtectedRoute>
              <LoansList />
            </ProtectedRoute>
          } />
          
          <Route path="/nuevo-prestamo" element={
            <ProtectedRoute>
              <NewLoan />
            </ProtectedRoute>
          } />
          
          <Route path="/pagos/:id" element={
            <ProtectedRoute>
              <Payments />
            </ProtectedRoute>
          } />
          
          <Route path="/reportes" element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          } />

          {/* Rutas Solo Admin */}
          <Route path="/planes" element={
            <ProtectedRoute requiredRole="admin">
              <Plans />
            </ProtectedRoute>
          } />
          
          <Route path="/configuracion" element={
            <ProtectedRoute requiredRole="admin">
              <Config />
            </ProtectedRoute>
          } />
          
          <Route path="/usuarios" element={
            <ProtectedRoute requiredRole="admin">
              <UsersPage />
            </ProtectedRoute>
          } />

          {/* Redirección por defecto */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
