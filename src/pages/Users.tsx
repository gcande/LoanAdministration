import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { 
  UserPlus, 
  Search, 
  Shield, 
  User, 
  Trash2, 
  Mail, 
  Key,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  rol: 'admin' | 'cobrador';
  created_at: string;
}

const Users = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Pagination & Search states
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Form states
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRol, setNewRol] = useState<'admin' | 'cobrador'>('cobrador');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Cliente especial para crear usuarios sin cerrar la sesión del admin
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  
  const authAdminClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    
    let query = supabase
      .from('perfiles')
      .select('*', { count: 'exact' });

    if (searchTerm) {
      query = query.ilike('email', `%${searchTerm}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (!error) {
      setUsers(data || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }, [page, searchTerm, pageSize]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);
    setFormSuccess(false);

    // 1. Crear el usuario usando el cliente especial (no afecta la sesión actual)
    const { data, error: authError } = await authAdminClient.auth.signUp({
      email: newEmail,
      password: newPassword,
    });

    if (authError) {
      setFormError(authError.message);
      setFormLoading(false);
      return;
    }

    // 2. Asegurar que el perfil tenga el rol correcto inmediatamente
    if (data.user) {
      // Usamos upsert por si el trigger tardó un poco o falló
      const { error: profileError } = await supabase
        .from('perfiles')
        .upsert({ 
          id: data.user.id, 
          email: newEmail, 
          rol: newRol 
        });
        
      if (profileError) console.error('Error al asegurar perfil:', profileError);
    }

    setFormSuccess(true);
    setFormLoading(false);
    setNewEmail('');
    setNewPassword('');
    setTimeout(() => {
      setIsModalOpen(false);
      setFormSuccess(false);
      fetchUsers();
    }, 2000);
  };

  const handleUpdateRole = async (userId: string, currentRole: string) => {
    // El admin no se le podra cambiar el rol
    if (currentRole === 'admin') return;
    // const newRole = currentRole === 'cobrador' ? 'admin' : 'cobrador';
    const newRole = currentRole;
    const { error } = await supabase
      .from('perfiles')
      .update({ rol: newRole })
      .eq('id', userId);

    if (!error) {
      fetchUsers();
    }
  };

  return (
    <Layout title="Gestión de Usuarios" subtitle={`${totalCount} cuentas registradas`}>
      <div className="users-actions">
        <div className="search-input">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Buscar por email..." 
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1); // Reset a página 1 al buscar
            }}
          />
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <UserPlus size={18} />
          <span>Nuevo Usuario</span>
        </button>
      </div>

      <div className="users-list-card">
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Fecha Registro</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px' }}>Cargando usuarios...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px' }}>No se encontraron usuarios</td></tr>
              ) : (
                users.map((u: UserProfile) => (
                  <tr key={u.id}>
                    <td>
                      <div className="user-info-cell">
                        <div className="user-avatar-mini">
                          {u.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-email-stack">
                          <span className="email-text">{u.email}</span>
                          <span className="id-text">ID: {u.id.substring(0, 8)}...</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`role-badge ${u.rol}`}>
                        {u.rol === 'admin' ? <Shield size={12} /> : <User size={12} />}
                        {u.rol === 'admin' ? 'Administrador' : 'Cobrador'}
                      </span>
                    </td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-btns-group">
                        <button 
                          className="action-btn-secondary" 
                          title="Cambiar Rol"
                          onClick={() => handleUpdateRole(u.id, u.rol)}
                        >
                          <Shield size={16} />
                        </button>
                        <button className="action-btn-danger" title="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination 
          currentPage={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* MODAL NUEVO USUARIO */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-scale">
            <div className="modal-header">
              <h2>Añadir Nuevo Usuario</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            {formSuccess ? (
              <div className="success-state animate-fade">
                <CheckCircle2 size={48} color="var(--success)" />
                <h3>¡Usuario Registrado!</h3>
                <p>El usuario ha sido creado correctamente.</p>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Nota: Si la confirmación de correo está activa, el usuario deberá revisar su bandeja de entrada para poder iniciar sesión.
                </p>
              </div>
            ) : (
              <form onSubmit={handleCreateUser} className="modal-form">
                {formError && (
                  <div className="modal-error">
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}
                
                <div className="form-group">
                  <label>Correo Electrónico</label>
                  <div className="input-with-icon">
                    <Mail size={16} />
                    <input 
                      type="email" 
                      placeholder="correo@ejemplo.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Contraseña Temporal</label>
                  <div className="input-with-icon">
                    <Key size={16} />
                    <input 
                      type="password" 
                      placeholder="Mínimo 6 caracteres"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Rol Inicial</label>
                  <select 
                    className="form-select"
                    value={newRol}
                    onChange={(e) => setNewRol(e.target.value as 'admin' | 'cobrador')}
                  >
                    <option value="cobrador">Cobrador (Acceso limitado)</option>
                    <option value="admin">Administrador (Acceso total)</option>
                  </select>
                </div>

                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-neutral" 
                    onClick={() => setIsModalOpen(false)}
                    disabled={formLoading}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={formLoading}>
                    {formLoading ? 'Creando...' : 'Crear Usuario'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <style>{`
        .users-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          gap: 16px;
        }

        .users-list-card {
          background: white;
          border-radius: 16px;
          border: 1px solid var(--border);
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
          overflow: hidden;
        }

        .users-table {
          width: 100%;
          border-collapse: collapse;
        }

        .users-table th {
          text-align: left;
          padding: 16px;
          background: #f8fafc;
          border-bottom: 1px solid var(--border);
          font-size: 13px;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .users-table td {
          padding: 14px 16px;
          border-bottom: 1px solid var(--border-light);
          font-size: 14px;
        }

        .user-info-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .user-avatar-mini {
          width: 32px;
          height: 32px;
          background: var(--bg-surface);
          color: var(--primary);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 13px;
          border: 1px solid var(--border);
        }

        .user-email-stack {
          display: flex;
          flex-direction: column;
        }

        .id-text {
          font-size: 11px;
          color: var(--text-muted);
        }

        .action-btns-group {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .action-btn-secondary, .action-btn-danger {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn-secondary:hover {
          background: #f1f5f9;
          color: var(--primary);
        }

        .action-btn-danger:hover {
          background: #fef2f2;
          color: #dc2626;
          border-color: #fecaca;
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 20px;
        }

        .modal-error {
          background: #fef2f2;
          color: #b91c1c;
          padding: 10px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
        }

        .success-state {
          padding: 40px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .form-select {
          width: 100%;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid var(--border);
          font-size: 14px;
        }

        .form-select:focus {
          border-color: var(--primary);
          outline: none;
        }
      `}</style>
    </Layout>
  );
};

export default Users;
