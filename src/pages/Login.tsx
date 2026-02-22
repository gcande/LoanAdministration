import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, ChevronRight, AlertCircle } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('Credenciales inválidas. Por favor intenta de nuevo.');
      setLoading(false);
    } else {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="login-page">
      <div className="login-card animate-fade">
        <div className="login-header">
          <div className="login-logo">
            <div className="logo-icon">
              <Lock size={24} />
            </div>
            <h1>Presta<span>Ya</span></h1>
          </div>
          <p>Gestión Integral de Cartera</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && (
            <div className="login-error animate-pulse">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label>Correo Electrónico</label>
            <div className="input-with-icon">
              <Mail size={18} />
              <input 
                type="email" 
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-login" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Entrar al Sistema'}
            <ChevronRight size={18} />
          </button>
        </form>

        <div className="login-footer">
          <p>&copy; 2024 PrestaYa Digital. Todos los derechos reservados.</p>
        </div>
      </div>

      <style>{`
        .login-page {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 20px;
        }

        .login-card {
          background: white;
          width: 100%;
          max-width: 400px;
          padding: 40px;
          border-radius: 24px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 1px solid white;
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .logo-icon {
          width: 44px;
          height: 44px;
          background: var(--primary);
          color: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(30, 58, 138, 0.2);
        }

        .login-logo h1 {
          font-size: 28px;
          font-weight: 800;
          color: var(--primary);
          margin: 0;
          letter-spacing: -0.5px;
        }

        .login-logo h1 span {
          color: var(--secondary);
        }

        .login-header p {
          color: var(--text-muted);
          font-size: 14px;
        }

        .login-error {
          background: #fef2f2;
          color: #dc2626;
          padding: 12px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          margin-bottom: 20px;
          border: 1px solid #fee2e2;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-with-icon svg {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
        }

        .input-with-icon input {
          width: 100%;
          padding: 12px 12px 12px 40px;
          border: 1px solid var(--border);
          border-radius: 12px;
          font-size: 14px;
          transition: var(--transition);
        }

        .input-with-icon input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(30, 58, 138, 0.05);
          outline: none;
        }

        .btn-login {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 14px;
          font-size: 16px;
          margin-top: 24px;
        }

        .login-footer {
          margin-top: 40px;
          text-align: center;
          font-size: 11px;
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};

export default Login;
