import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldCheck } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
    } else {
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card animate-fade">
        <div className="login-header">
          <div className="logo-icon">
            <ShieldCheck size={40} />
          </div>
          <h2>PrestaYa Admin</h2>
          <p>Gestión administrativa de préstamos</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Correo Electrónico</label>
            <div className="input-with-icon">
              <Mail size={20} />
              <input 
                type="email" 
                placeholder="admin@prestaya.com" 
                required 
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <div className="input-with-icon">
              <Lock size={20} />
              <input 
                type="password" 
                placeholder="••••••••" 
                required 
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full login-btn" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Ingresar al Portal'}
          </button>
        </form>

        <div className="login-footer">
          <p>¿Olvidó su contraseña? <a href="#">Contacte a soporte</a></p>
        </div>
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--bg-dark) 0%, var(--primary) 100%);
          padding: 20px;
        }

        .login-card {
          background: var(--card-bg);
          width: 100%;
          max-width: 400px;
          padding: 40px;
          border-radius: 24px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .logo-icon {
          width: 80px;
          height: 80px;
          background: rgba(30, 58, 138, 0.1);
          color: var(--primary);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
        }

        .login-header h2 {
          color: var(--text-dark);
          margin: 0;
        }

        .login-header p {
          color: #64748b;
          font-size: 14px;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-with-icon svg {
          position: absolute;
          left: 16px;
          color: #94a3b8;
        }

        .input-with-icon input {
          padding-left: 48px;
        }

        .login-btn {
          height: 52px;
          font-size: 16px;
          margin-top: 24px;
        }

        .login-footer {
          text-align: center;
          margin-top: 24px;
          font-size: 14px;
          color: #64748b;
        }

        .login-footer a {
          color: var(--primary);
          text-decoration: none;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default Login;
