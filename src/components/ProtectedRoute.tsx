import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'cobrador';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        height: '100vh', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--bg-color)'
      }}>
        <div className="animate-pulse" style={{ color: 'var(--primary)', fontWeight: 600 }}>
          Cargando seguridad...
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirigir al login si no hay sesión
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && profile?.rol !== requiredRole && profile?.rol !== 'admin') {
    // Si se requiere un rol (como admin) y no lo tiene, redirigir al dashboard
    // Nota: El admin siempre tiene acceso a todo.
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
