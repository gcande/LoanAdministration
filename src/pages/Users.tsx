import React, { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
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
  AlertCircle,
  Briefcase,
  ClipboardList,
  Eye,
  BarChart3,
  Pencil,
  Lock,
  MoreVertical
} from 'lucide-react';
import { formatCurrency } from '../utils/finance';

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

  // Assignment states
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [availableLoans, setAvailableLoans] = useState<any[]>([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSearch, setAssignSearch] = useState('');

  // Detail states
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [collectorStats, setCollectorStats] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Edit states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPassword, setEditPassword] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

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
      .select('*', { count: 'exact' })
      .is('deleted_at', null);

    if (searchTerm) {
      query = query.ilike('email', `%${searchTerm}%`);
    }

    const { data: profiles, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (!error) {
      setUsers(profiles || []);
      setTotalCount(count || 0);
    }
    setLoading(false);
  }, [page, searchTerm, pageSize]);

  useEffect(() => {
    fetchUsers();
    // Reset active menu on search or page change
    setActiveMenu(null);
  }, [fetchUsers]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeMenu && !(event.target as Element).closest('.dropdown-container')) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenu]);

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

  const openAssignModal = async (user: UserProfile) => {
    setSelectedUser(user);
    setIsAssignModalOpen(true);
    setAssignLoading(true);
    
    // Fetch all active loans with client info
    const { data, error } = await supabase
      .from('prestamos')
      .select(`
        id, 
        monto_prestado, 
        saldo_pendiente, 
        cobrador_id,
        clientes (nombre, identificacion)
      `)
      .neq('estado', 'pagado')
      .order('created_at', { ascending: false });

    if (!error) {
      setAvailableLoans(data || []);
    }
    setAssignLoading(false);
  };

  const toggleLoanAssignment = async (loanId: string, isAssigned: boolean) => {
    if (!selectedUser) return;

    const { error } = await supabase
      .from('prestamos')
      .update({ cobrador_id: isAssigned ? null : selectedUser.id })
      .eq('id', loanId);

    if (!error) {
      setAvailableLoans(prev => 
        prev.map(l => l.id === loanId ? { ...l, cobrador_id: isAssigned ? null : selectedUser.id } : l)
      );
    }
  };

  const handleViewDetails = async (user: UserProfile) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
    setDetailLoading(true);

    try {
      // 1. Obtener préstamos asignados al cobrador
      const { data: assignedLoans } = await supabase
        .from('prestamos')
        .select('id, saldo_pendiente, monto_prestado, estado')
        .eq('cobrador_id', user.id);

      const loans = assignedLoans || [];
      const loanIds = loans.map(l => l.id);
      
      // Métricas base de préstamos
      const totalCartera = loans.reduce((acc, curr) => acc + Number(curr.saldo_pendiente), 0);
      const moraCount = loans.filter(l => l.estado === 'en_mora').length;

      // 2. Obtener datos de RECAUDO (Pagos)
      let totalRecaudado = 0;
      let totalCobros = 0;
      let recaudoHoy = 0;
      
      const hoyStart = new Date();
      hoyStart.setHours(0,0,0,0);
      const hoyEnd = new Date();
      hoyEnd.setHours(23,59,59,999);

      if (loanIds.length > 0) {
        // Todos los pagos históricos de sus préstamos
        const { data: allPayments } = await supabase
          .from('pagos')
          .select('monto_pagado, fecha_pago')
          .in('prestamo_id', loanIds);
        
        const payments = allPayments || [];
        totalRecaudado = payments.reduce((acc, curr) => acc + Number(curr.monto_pagado), 0);
        totalCobros = payments.length;

        // Recaudo específico de HOY
        recaudoHoy = payments
          .filter(p => {
            const fecha = new Date(p.fecha_pago);
            return fecha >= hoyStart && fecha <= hoyEnd;
          })
          .reduce((acc, curr) => acc + Number(curr.monto_pagado), 0);
      }

      // 3. Obtener CUOTAS PENDIENTES para hoy (Ruta del día)
      let cuotasPendientesHoy = 0;
      if (loanIds.length > 0) {
        const { count } = await supabase
          .from('cuotas')
          .select('*', { count: 'exact', head: true })
          .in('prestamo_id', loanIds)
          .eq('estado', 'pendiente')
          .eq('fecha_vencimiento', new Date().toISOString().split('T')[0]);
        
        cuotasPendientesHoy = count || 0;
      }

      setCollectorStats({
        totalLoans: loans.length,
        totalCartera,
        totalRecaudado,
        totalCobros,
        recaudoHoy,
        cuotasPendientesHoy,
        moraCount,
        email: user.email
      });
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
    setEditPassword('');
    setEditError(null);
    setEditSuccess(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !editPassword) return;
    
    setEditLoading(true);
    setEditError(null);

    // NOTA: Para cambiar la contraseña de OTRO usuario desde el frontend, 
    // usualmente se requiere usar Supabase Admin Auth (con service_role key)
    // lo cual no debe estar expuesto en el cliente por seguridad.
    // Aquí usamos la función de actualización de Auth normal por si se configura 
    // un flujo de admin o una función de base de datos/edge function externa.
    
    const { error } = await supabase.auth.admin.updateUserById(
      selectedUser.id,
      { password: editPassword }
    );

    if (error) {
      // Si falla por permisos (común en el front), mostramos error informativo
      setEditError("Error: Esta acción requiere permisos de administrador a nivel de servidor (Service Role) o una Edge Function segura.");
      setEditLoading(false);
    } else {
      setEditSuccess(true);
      setEditLoading(false);
      setTimeout(() => {
        setIsEditModalOpen(false);
      }, 2000);
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (user.rol === 'admin') {
      alert('No se puede eliminar a un administrador.');
      return;
    }

    if (window.confirm(`¿Estás seguro de que quieres eliminar al usuario ${user.email}?`)) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('perfiles')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', user.id);
        
        if (error) throw error;
        fetchUsers();
      } catch (err) {
        console.error(err);
        alert('Error al eliminar usuario');
      } finally {
        setLoading(false);
      }
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
                      <div className="dropdown-container">
                        <button 
                          className="btn-icon" 
                          onClick={() => setActiveMenu(activeMenu === u.id ? null : u.id)}
                        >
                          <MoreVertical size={20} />
                        </button>
                        
                        {activeMenu === u.id && (
                          <div className="dropdown-menu animate-fade">
                            {u.rol === 'cobrador' && (
                              <>
                                <button onClick={() => { handleViewDetails(u); setActiveMenu(null); }}>
                                  <Eye size={16} /> Ver Resumen
                                </button>
                                <button onClick={() => { openAssignModal(u); setActiveMenu(null); }}>
                                  <ClipboardList size={16} /> Asignar Cobros
                                </button>
                              </>
                            )}
                            <button onClick={() => { handleOpenEdit(u); setActiveMenu(null); }}>
                              <Pencil size={16} /> Cambiar Clave
                            </button>
                            <button onClick={() => { handleUpdateRole(u.id, u.rol); setActiveMenu(null); }}>
                              <Shield size={16} /> {u.rol === 'admin' ? 'Hacer Cobrador' : 'Hacer Admin'}
                            </button>
                            <button onClick={() => { handleDeleteUser(u); setActiveMenu(null); }} className="text-danger">
                              <Trash2 size={16} /> Eliminar
                            </button>
                          </div>
                        )}
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

      {/* MODAL EDITAR USUARIO */}
      <Modal
        isOpen={isEditModalOpen && !!selectedUser}
        onClose={() => setIsEditModalOpen(false)}
        maxWidth="450px"
        title={
          <div className="header-with-icon">
            <Pencil size={20} className="text-primary" />
            <div>
              <h2 className="modal-title">Editar Usuario</h2>
              <p className="text-muted" style={{ fontSize: '13px' }}>{selectedUser?.email}</p>
            </div>
          </div>
        }
      >
        <form onSubmit={handleUpdatePassword} className="modal-form">
          {editSuccess ? (
            <div className="success-state" style={{ padding: '20px' }}>
              <CheckCircle2 size={32} color="var(--success)" />
              <h4>Contraseña Actualizada</h4>
            </div>
          ) : (
            <>
              <div className="form-group">
                <label>ID de Usuario</label>
                <input type="text" value={selectedUser?.id || ''} disabled className="form-control-disabled" />
              </div>
              
              <div className="form-group">
                <label>Correo Electrónico</label>
                <input type="text" value={selectedUser?.email || ''} disabled className="form-control-disabled" />
              </div>

              <div className="form-group">
                <label>Nueva Contraseña</label>
                <div className="input-with-icon">
                  <Lock size={16} />
                  <input 
                    type="password" 
                    placeholder="Mínimo 6 caracteres"
                    value={editPassword}
                    onChange={(e) => setEditPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Asigna una nueva clave para este usuario.
                </p>
              </div>

              {editError && (
                <div className="modal-error">
                  <AlertCircle size={16} />
                  <span>{editError}</span>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-neutral" onClick={() => setIsEditModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={editLoading}>
                  {editLoading ? 'Guardando...' : 'Cambiar Contraseña'}
                </button>
              </div>
            </>
          )}
        </form>
      </Modal>

      {/* MODAL DETALLES COBRADOR */}
      <Modal
        isOpen={isDetailModalOpen && !!selectedUser}
        onClose={() => setIsDetailModalOpen(false)}
        maxWidth="450px"
        title={
          <div className="header-with-icon">
            <BarChart3 size={20} className="text-info" />
            <div>
              <h2 className="modal-title">Resumen de Cobrador</h2>
              <p className="text-muted" style={{ fontSize: '13px' }}>{selectedUser?.email}</p>
            </div>
          </div>
        }
      >
        <div className="collector-details-body">
          {detailLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Analizando rendimiento...</p>
            </div>
          ) : collectorStats ? (
            <div className="premium-stats-container">
              {/* Sección Principal: Dinero Recaudado */}
              <div className="main-stat-card">
                <div className="stat-icon-wrapper money">
                  <BarChart3 size={24} />
                </div>
                <div className="stat-content">
                  <span className="stat-label">Total Recaudado (Histórico)</span>
                  <h2 className="stat-value highlight">{formatCurrency(collectorStats.totalRecaudado)}</h2>
                </div>
              </div>

              {/* Grid de Actividad Operativa */}
              <div className="details-grid">
                <div className="detail-card">
                  <div className="detail-icon briefcase"><Briefcase size={18} /></div>
                  <div className="detail-info">
                    <span className="detail-label">Préstamos Asignados</span>
                    <span className="detail-value">{collectorStats.totalLoans}</span>
                  </div>
                </div>

                <div className="detail-card">
                  <div className="detail-icon check"><CheckCircle2 size={18} /></div>
                  <div className="detail-info">
                    <span className="detail-label">Cobros Realizados</span>
                    <span className="detail-value">{collectorStats.totalCobros}</span>
                  </div>
                </div>
              </div>

              {/* Sección de Actividad de Hoy */}
              <div className="today-activity-section">
                <h4 className="section-subtitle">Actividad de Hoy</h4>
                <div className="details-grid">
                  <div className="detail-card today-highlight">
                    <div className="detail-info">
                      <span className="detail-label">Recaudado Hoy</span>
                      <span className="detail-value text-success">{formatCurrency(collectorStats.recaudoHoy)}</span>
                    </div>
                  </div>
                  <div className="detail-card">
                    <div className="detail-info">
                      <span className="detail-label">Pendientes de Cobro</span>
                      <span className="detail-value text-warning">{collectorStats.cuotasPendientesHoy}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Riesgo de Cartera */}
              <div className="risk-summary mt-2">
                <div className="detail-card danger-zone w-full">
                  <div className="detail-icon alert"><AlertCircle size={18} /></div>
                  <div className="detail-info">
                    <span className="detail-label">Cartera en Mora</span>
                    <span className="detail-value text-danger">{collectorStats.moraCount} clientes</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 'auto', textAlign: 'right' }}>
                    <span className="detail-label">Saldo Pendiente</span>
                    <span className="detail-value">{formatCurrency(collectorStats.totalCartera)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">No se pudieron cargar los datos del cobrador</div>
          )}
        </div>

        <div className="modal-footer" style={{ borderTop: 'none', paddingBottom: '10px' }}>
          <button className="btn btn-neutral w-full" onClick={() => setIsDetailModalOpen(false)}>
            Cerrar
          </button>
        </div>
      </Modal>

      {/* MODAL ASIGNAR COBROS */}
      <Modal
        isOpen={isAssignModalOpen && !!selectedUser}
        onClose={() => setIsAssignModalOpen(false)}
        maxWidth="600px"
        title={
          <div className="header-with-icon">
            <Briefcase size={20} className="text-primary" />
            <div>
              <h2 className="modal-title">Asignar Cobros</h2>
              <p className="text-muted" style={{ fontSize: '13px' }}>Asignando a: {selectedUser?.email}</p>
            </div>
          </div>
        }
      >
        <div className="search-input mt-4 mb-4">
          <Search size={18} />
          <input 
            type="text" 
            placeholder="Buscar cliente o préstamo..." 
            value={assignSearch}
            onChange={(e) => setAssignSearch(e.target.value)}
          />
        </div>

        <div className="loans-assign-list">
          {assignLoading ? (
            <div className="loading-state">Cargando préstamos...</div>
          ) : availableLoans.length === 0 ? (
            <div className="empty-state">No hay préstamos activos para asignar</div>
          ) : (
            <div className="loans-scroll-area">
              {availableLoans
                .filter(l => 
                  l.clientes.nombre.toLowerCase().includes(assignSearch.toLowerCase()) ||
                  l.clientes.identificacion.includes(assignSearch)
                )
                .map(loan => {
                  const isAssignedToCurrent = loan.cobrador_id === selectedUser?.id;
                  const isAssignedToOther = loan.cobrador_id && loan.cobrador_id !== selectedUser?.id;
                  
                  return (
                    <div key={loan.id} className={`loan-assign-item ${isAssignedToCurrent ? 'selected' : ''}`}>
                      <div className="loan-assign-info">
                        <strong>{loan.clientes.nombre}</strong>
                        <span>Saldo: {formatCurrency(loan.saldo_pendiente)}</span>
                        {isAssignedToOther && (
                          <span className="other-assign-badge">Asignado a otro</span>
                        )}
                      </div>
                      <button 
                        className={`btn btn-sm ${isAssignedToCurrent ? 'btn-danger' : 'btn-primary'}`}
                        onClick={() => toggleLoanAssignment(loan.id, isAssignedToCurrent)}
                      >
                        {isAssignedToCurrent ? 'Quitar' : 'Asignar'}
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-primary w-full" onClick={() => setIsAssignModalOpen(false)}>
            Finalizar
          </button>
        </div>
      </Modal>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={<h2 className="modal-title">Añadir Nuevo Usuario</h2>}
      >
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

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
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
      </Modal>

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

        .form-control-disabled {
          width: 100%;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: #f1f5f9;
          color: var(--text-muted);
          font-size: 14px;
          cursor: not-allowed;
        }

        .stats-grid-mini {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 20px;
        }

        /* Estilos Premium para Detalle de Cobrador */
        .premium-stats-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 10px;
          margin-bottom: 10px;
        }

        .main-stat-card {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid var(--border-light);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .stat-icon-wrapper {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon-wrapper.money {
          background: #ecfdf5;
          color: #10b981;
        }

        .stat-label {
          font-size: 13px;
          color: var(--text-secondary);
          display: block;
          margin-bottom: 2px;
        }

        .stat-value {
          font-size: 24px;
          font-weight: 800;
          margin: 0;
          letter-spacing: -0.02em;
        }

        .details-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .detail-card {
          background: white;
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .detail-card.danger-zone {
          background: #fffafa;
          border-color: #fee2e2;
        }

        .detail-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .detail-icon.briefcase { background: #eff6ff; color: #3b82f6; }
        .detail-icon.check { background: #f0fdf4; color: #16a34a; }
        .detail-icon.alert { background: #fef2f2; color: #dc2626; }

        .detail-info {
          display: flex;
          flex-direction: column;
        }

        .detail-label {
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 700;
        }

        .detail-value {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .today-activity-section {
          background: #f8fafc;
          border-radius: 16px;
          padding: 16px;
          border: 1px dashed var(--border);
        }

        .section-subtitle {
          font-size: 12px;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 12px;
          letter-spacing: 0.05em;
          font-weight: 700;
        }

        .today-highlight {
          border-left: 3px solid #10b981;
        }

        .spinner {
          width: 30px;
          height: 30px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 12px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }


        .stat-box-mini {
          padding: 16px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid var(--border-light);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-box-mini .label {
          font-size: 11px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.025em;
          font-weight: 600;
        }

        .stat-box-mini .value {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-main);
        }

        .stat-box-mini .value.highlight {
          color: var(--primary);
        }

        .text-info { color: #0ea5e9; }
        .text-success { color: #10b981; }
        .text-danger { color: #ef4444; }

        .header-with-icon {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .loans-assign-list {
          max-height: 400px;
          overflow-y: auto;
          margin: 16px 0;
          border: 1px solid var(--border);
          border-radius: 12px;
        }

        .loans-scroll-area {
          padding: 8px;
        }

        .loan-assign-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          border-radius: 8px;
          border-bottom: 1px solid var(--border-light);
          transition: background 0.2s;
        }

        .loan-assign-item:last-child {
          border-bottom: none;
        }

        .loan-assign-item.selected {
          background: #f0f9ff;
          border-left: 4px solid var(--primary);
        }

        .loan-assign-info {
          display: flex;
          flex-direction: column;
        }

        .loan-assign-info strong {
          font-size: 14px;
        }

        .loan-assign-info span {
          font-size: 12px;
          color: var(--text-muted);
        }

        .other-assign-badge {
          background: #ffedd5;
          color: #9a3412;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px !important;
          margin-top: 2px;
          width: fit-content;
        }

        .loading-state, .empty-state {
          padding: 40px;
          text-align: center;
          color: var(--text-muted);
        }

        .mt-4 { margin-top: 16px; }
        .mb-4 { margin-bottom: 16px; }
        .w-full { width: 100%; }

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
