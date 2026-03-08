import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import { Search, UserPlus, Filter, MoreVertical, Phone, Mail, Edit, Trash, Eye, TrendingUp, Clock, CheckCircle, AlertCircle, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { calculatePunctuality, countLateInstallments, getTodayIsoDate } from '../utils/loanMetrics';

interface Cliente {
  id: string;
  nombre: string;
  identificacion: string;
  telefono: string;
  email: string;
  estado: string;
  direccion: string;
}

interface ClientStats {
  totalLoans: number;
  totalBorrowed: number;
  activeLoansCount: number;
  punctuality: number;
  punctualityHasHistory: boolean;
  paidInstallmentsCount: number;
  onTimeInstallmentsCount: number;
  lateInstallmentsCount: number;
  avgDelayDays: number;
  maxDelayDays: number;
  riskScore: number;
  riskLevel: 'Bajo' | 'Medio' | 'Alto';
  riskFactors: string[];
  suggestedMaxAmount: number;
  balance: number;
  loans: any[];
}

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const normalizeIsoDate = (value?: string | null): string | null =>
  value ? value.slice(0, 10) : null;

const getDaysBetweenIsoDates = (fromIso: string, toIso: string): number => {
  const [fromY, fromM, fromD] = fromIso.split('-').map(Number);
  const [toY, toM, toD] = toIso.split('-').map(Number);
  const from = Date.UTC(fromY, fromM - 1, fromD);
  const to = Date.UTC(toY, toM - 1, toD);
  return Math.round((to - from) / 86400000);
};

const Clients = () => {
  const { profile } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newClient, setNewClient] = useState({
    nombre: '',
    identificacion: '',
    telefono: '',
    email: '',
    direccion: ''
  });
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [clientStats, setClientStats] = useState<ClientStats | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Pagination & Search states
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('clientes')
        .select('*', { count: 'exact' })
        .is('deleted_at', null);

      if (searchTerm) {
        query = query.or(`nombre.ilike.%${searchTerm}%,identificacion.ilike.%${searchTerm}%`);
      }

      const { data, error, count } = await query
        .order('nombre', { ascending: true })
        .range((page - 1) * pageSize, page * pageSize - 1);
      
      if (error) throw error;
      setClientes(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientDetails = async (cliente: Cliente) => {
    setSelectedClient(cliente);
    setShowDetailsModal(true);
    setActiveMenu(null);
    setLoadingDetails(true);
    
    try {
      // Global settings (e.g. grace days for delinquency logic)
      const { data: graceSetting } = await supabase
        .from('configuracion')
        .select('valor')
        .eq('clave', 'dias_gracia')
        .maybeSingle();
      const graceDays = Number(graceSetting?.valor || 0);

      // Fetch loans
      const { data: loans, error: loansError } = await supabase
        .from('prestamos')
        .select(`
          *,
          planes_prestamo(nombre_plan)
        `)
        .eq('cliente_id', cliente.id)
        .order('created_at', { ascending: false });

      if (loansError) throw loansError;

      const loanIds = loans?.map(l => l.id) || [];
      let installments: any[] = [];
      if (loanIds.length > 0) {
        const { data: instData, error: instError } = await supabase
          .from('cuotas')
          .select('*')
          .in('prestamo_id', loanIds);
        if (instError) throw instError;
        installments = instData || [];
      }

      // Calculate stats
      const totalBorrowed = loans?.reduce((sum, l) => sum + Number(l.monto_prestado), 0) || 0;
      const activeLoans = loans?.filter(l => ['activo', 'al_dia', 'en_mora'].includes(l.estado)) || [];
      const totalLoans = loans?.length || 0;
      
      const todayIso = getTodayIsoDate();
      const paidInstallments = installments.filter((i) => i.estado === 'pagado');
      const punctualityHasHistory = paidInstallments.length > 0;
      const punctuality = punctualityHasHistory ? calculatePunctuality(installments) : 0;
      const onTimeInstallmentsCount = paidInstallments.filter((i) => {
        const dueDate = normalizeIsoDate(i.fecha_vencimiento);
        const paidDate = normalizeIsoDate(i.fecha_pago);
        if (!dueDate || !paidDate) return false;
        return paidDate <= dueDate;
      }).length;

      const delayDays = paidInstallments
        .map((i) => {
          const dueDate = normalizeIsoDate(i.fecha_vencimiento);
          const paidDate = normalizeIsoDate(i.fecha_pago);
          if (!dueDate || !paidDate) return 0;
          return Math.max(0, getDaysBetweenIsoDates(dueDate, paidDate));
        })
        .filter((d) => d > 0);

      const avgDelayDays = delayDays.length > 0
        ? Math.round(delayDays.reduce((sum, d) => sum + d, 0) / delayDays.length)
        : 0;
      const maxDelayDays = delayDays.length > 0 ? Math.max(...delayDays) : 0;
      const lateInstallmentsCount = countLateInstallments(installments, todayIso, graceDays);

      const balance = activeLoans.reduce((sum, l) => sum + Number(l.saldo_pendiente), 0);
      const balanceRatio = totalBorrowed > 0 ? balance / totalBorrowed : (balance > 0 ? 1 : 0);

      let riskScore = 100;
      if (!punctualityHasHistory) riskScore -= 20;
      riskScore -= Math.min(lateInstallmentsCount * 12, 36);
      if (punctualityHasHistory) riskScore -= Math.max(0, 85 - punctuality) * 0.7;
      riskScore -= Math.min(avgDelayDays * 2, 20);
      if (balanceRatio > 0.6) riskScore -= 15;
      else if (balanceRatio > 0.35) riskScore -= 8;
      if (totalLoans >= 8 && punctuality >= 90 && lateInstallmentsCount === 0) riskScore += 8;
      riskScore = Math.round(clamp(riskScore, 0, 100));

      const riskLevel: 'Bajo' | 'Medio' | 'Alto' = riskScore >= 75 ? 'Bajo' : riskScore >= 50 ? 'Medio' : 'Alto';

      const averageLoanAmount = totalLoans > 0 ? totalBorrowed / totalLoans : 500000;
      const riskMultiplier = riskLevel === 'Bajo' ? 1.25 : riskLevel === 'Medio' ? 0.9 : 0.6;
      const punctualityMultiplier = punctualityHasHistory ? 0.8 + (punctuality / 100) * 0.3 : 0.75;
      const delinquencyMultiplier = Math.max(0.6, 1 - lateInstallmentsCount * 0.08);
      const suggestedMaxAmount = Math.round(clamp(
        averageLoanAmount * riskMultiplier * punctualityMultiplier * delinquencyMultiplier,
        250000,
        Math.max(averageLoanAmount * 1.8, 800000)
      ));

      const riskFactors: string[] = [];
      if (!punctualityHasHistory) riskFactors.push('Sin historial de cuotas pagadas para medir puntualidad.');
      else riskFactors.push(`Puntualidad historica: ${punctuality}% (${onTimeInstallmentsCount}/${paidInstallments.length}).`);
      if (lateInstallmentsCount > 0) riskFactors.push(`Tiene ${lateInstallmentsCount} cuota(s) en mora activa.`);
      if (maxDelayDays > 0) riskFactors.push(`Atraso promedio ${avgDelayDays} dia(s), maximo ${maxDelayDays} dia(s).`);
      if (balanceRatio > 0.35) riskFactors.push(`Saldo activo elevado (${Math.round(balanceRatio * 100)}% del total prestado).`);
      if (totalLoans >= 6 && lateInstallmentsCount === 0) riskFactors.push('Historial amplio sin mora activa reciente.');
      if (riskFactors.length === 0) riskFactors.push('Comportamiento estable en los indicadores evaluados.');
      
      setClientStats({
        loans: loans || [],
        totalBorrowed,
        activeLoansCount: activeLoans.length,
        totalLoans,
        punctuality,
        punctualityHasHistory,
        paidInstallmentsCount: paidInstallments.length,
        onTimeInstallmentsCount,
        lateInstallmentsCount,
        avgDelayDays,
        maxDelayDays,
        riskScore,
        riskLevel,
        riskFactors,
        suggestedMaxAmount,
        balance
      });

    } catch (error) {
      console.error('Error fetching client details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, [page, searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.from('clientes').insert([newClient]).select();
      if (error) throw error;
      if (data) {
        setClientes([...clientes, data[0]]);
      }
      setShowCreateModal(false);
      setNewClient({ nombre: '', identificacion: '', telefono: '', email: '', direccion: '' });
    } catch {
      alert('Error al crear cliente');
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    try {
      const { data, error } = await supabase
        .from('clientes')
        .update({ 
          nombre: editingClient.nombre,
          identificacion: editingClient.identificacion,
          telefono: editingClient.telefono,
          email: editingClient.email,
          direccion: editingClient.direccion
        })
        .eq('id', editingClient.id)
        .select();

      if (error) throw error;
      if (data) {
        setClientes(clientes.map(c => c.id === editingClient.id ? data[0] : c));
      }
      setShowEditModal(false);
      setEditingClient(null);
    } catch {
      alert('Error al actualizar cliente');
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      try {
        const { error } = await supabase
          .from('clientes')
          .update({ deleted_at: new Date().toISOString() })
          .eq('id', id);
        if (error) throw error;
        setClientes(clientes.filter(c => c.id !== id));
      } catch {
        alert('Error al eliminar cliente');
      }
    }
    setActiveMenu(null);
  };

  const openEditModal = (cliente: Cliente) => {
    setEditingClient(cliente);
    setShowEditModal(true);
    setActiveMenu(null);
  };

  return (
    <Layout title="Clientes">
      <div className="clients-toolbar card animate-fade">
        <div className="search-bar clients-search-bar">
          <div className="search-input clients-search-input">
            <Search size={20} />
            <input
              type="text"
              placeholder="Buscar por nombre o cedula..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <button className="btn-filter clients-filter-btn" aria-label="Filtrar clientes">
            <Filter size={20} />
          </button>
        </div>

        <div className="actions-header clients-actions-header">
          {profile?.rol === 'admin' && (
            <button className="btn btn-primary clients-new-btn" onClick={() => setShowCreateModal(true)}>
              <UserPlus size={20} />
              <span>Nuevo Cliente</span>
            </button>
          )}
          <p className="clients-count">
            {totalCount} clientes registrados
          </p>
        </div>
      </div>

      <div className="clients-list">
        {loading ? (
          <p className="empty-state">Cargando clientes...</p>
        ) : clientes.length === 0 ? (
          <p className="empty-state">No se encontraron clientes</p>
        ) : (
          <>
            {clientes.map(cliente => (
              <div key={cliente.id} className="card client-card">
                <div className="client-main-content">
                  <div className="client-avatar">
                    {cliente.nombre.charAt(0)}
                  </div>
                  <div className="client-info">
                    <h4>{cliente.nombre}</h4>
                    <p className="text-secondary">CC: {cliente.identificacion}</p>
                    <div className="client-quick-actions">
                      <span><Phone size={14} /> {cliente.telefono || 'Sin telefono'}</span>
                      <span><Mail size={14} /> {cliente.email || 'Sin email'}</span>
                    </div>
                  </div>
                </div>
                <div className="client-status">
                  <span className={`badge ${cliente.estado === 'activo' ? 'badge-success' : 'badge-danger'}`}>
                    {cliente.estado}
                  </span>
                  <div className="dropdown-container">
                    <button className="btn-icon text-primary" onClick={() => fetchClientDetails(cliente)} title="Ver detalles" aria-label={`Ver detalles de ${cliente.nombre}`}>
                      <Eye size={20} />
                    </button>
                    <button className="btn-icon" onClick={() => setActiveMenu(activeMenu === cliente.id ? null : cliente.id)} aria-label={`Abrir acciones de ${cliente.nombre}`}>
                      <MoreVertical size={20} />
                    </button>
                    {activeMenu === cliente.id && (
                      <div className="dropdown-menu animate-fade">
                        <button onClick={() => fetchClientDetails(cliente)}>
                          <Eye size={16}/> Ver Detalles
                        </button>
                        {profile?.rol === 'admin' && (
                          <>
                            <button onClick={() => openEditModal(cliente)}>
                              <Edit size={16}/> Editar
                            </button>
                            <button onClick={() => handleDeleteClient(cliente.id)} className="text-danger">
                              <Trash size={16}/> Eliminar
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
                        <Modal
              isOpen={showDetailsModal}
              onClose={() => setShowDetailsModal(false)}
              title="Perfil del Cliente"
            >
              {loadingDetails ? (
                <div className="loading-state">
                  <div className="skeleton" style={{ height: '80px', marginBottom: '20px' }}></div>
                  <div className="grid-2">
                    <div className="skeleton" style={{ height: '60px' }}></div>
                    <div className="skeleton" style={{ height: '60px' }}></div>
                  </div>
                  <div className="skeleton" style={{ height: '150px', marginTop: '20px' }}></div>
                </div>
              ) : selectedClient && (
                <div className="client-details-shell animate-fade">
                  <div className="client-details-hero">
                    <div className="client-avatar-large">
                      {selectedClient.nombre.charAt(0)}
                    </div>
                    <div className="client-hero-info">
                      <h3>{selectedClient.nombre}</h3>
                      <p>{selectedClient.identificacion}</p>
                      <div className="client-hero-badges">
                        <span className={`badge ${selectedClient.estado === 'activo' ? 'badge-success' : 'badge-danger'}`}>
                          {selectedClient.estado}
                        </span>
                        {clientStats && clientStats.punctualityHasHistory && clientStats.punctuality >= 90 && clientStats.lateInstallmentsCount === 0 && (
                          <span className="badge badge-info">Buen Pagador</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="client-kpi-grid">
                    <div className="client-kpi-card">
                      <span className="client-kpi-label"><DollarSign size={14}/> Total prestado</span>
                      <span className="client-kpi-value">${clientStats?.totalBorrowed.toLocaleString()}</span>
                    </div>
                    <div className="client-kpi-card">
                      <span className="client-kpi-label"><Clock size={14}/> Saldo actual</span>
                      <span className="client-kpi-value text-primary">${clientStats?.balance.toLocaleString()}</span>
                    </div>
                    <div className="client-kpi-card">
                      <span className="client-kpi-label"><CheckCircle size={14}/> Puntualidad</span>
                      <span className={`client-kpi-value ${clientStats?.punctualityHasHistory ? 'text-success' : 'text-secondary'}`}>
                        {clientStats?.punctualityHasHistory ? `${clientStats?.punctuality}%` : 'N/A'}
                      </span>
                      <span className="client-kpi-note">
                        {clientStats?.punctualityHasHistory
                          ? `${clientStats?.onTimeInstallmentsCount}/${clientStats?.paidInstallmentsCount} cuotas pagadas a tiempo`
                          : 'Sin historial de cuotas pagadas'}
                      </span>
                    </div>
                    <div className="client-kpi-card">
                      <span className="client-kpi-label"><AlertCircle size={14}/> Moras</span>
                      <span className="client-kpi-value text-danger">{clientStats?.lateInstallmentsCount} cuotas</span>
                    </div>
                  </div>

                  <div className="client-insight-card">
                    <h4>
                      <TrendingUp size={18} className="text-primary"/>
                      Analisis para proximos prestamos
                    </h4>
                    <div className="client-insight-row">
                      <span>Nivel de riesgo</span>
                      <strong className={clientStats?.riskLevel === 'Bajo' ? 'text-success' : clientStats?.riskLevel === 'Medio' ? 'text-warning' : 'text-danger'}>
                        {clientStats?.riskLevel} ({clientStats?.riskScore}/100)
                      </strong>
                    </div>
                    <div className="client-insight-row">
                      <span>Monto maximo sugerido</span>
                      <strong>
                        ${(clientStats?.suggestedMaxAmount || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </strong>
                    </div>
                    <div className="client-insight-row">
                      <span>Atraso de pago</span>
                      <strong>
                        {clientStats?.maxDelayDays ? `${clientStats?.avgDelayDays}d prom / ${clientStats?.maxDelayDays}d max` : 'Sin atrasos registrados'}
                      </strong>
                    </div>
                    <div className="client-insight-row">
                      <span>Historial</span>
                      <strong>{clientStats?.totalLoans} prestamos otorgados</strong>
                    </div>
                    <div className="client-risk-factors">
                      {clientStats?.riskFactors.map((factor, idx) => (
                        <p key={`${factor}-${idx}`}>{factor}</p>
                      ))}
                    </div>
                  </div>

                  <div className="client-loans-card">
                    <h4>
                      <Calendar size={18} className="text-secondary"/>
                      Prestamos recientes
                    </h4>
                    <div className="loans-tiny-list">
                      {clientStats?.loans.length === 0 ? (
                        <p className="client-loans-empty">Sin historial de prestamos</p>
                      ) : (
                        clientStats?.loans.map(loan => (
                          <div key={loan.id} className="loan-tiny-card">
                            <div className="loan-tiny-info">
                              <span className="loan-tiny-plan">{loan.planes_prestamo?.nombre_plan || 'Plan sin nombre'}</span>
                              <span className="loan-tiny-date">{new Date(loan.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="loan-tiny-amount">
                              <span className="amount">${loan.monto_prestado.toLocaleString()}</span>
                              <span className={`badge-dot ${loan.estado}`} title={loan.estado}></span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="modal-actions client-details-actions">
                    <button className="btn btn-primary w-full client-close-btn" onClick={() => setShowDetailsModal(false)}>Cerrar</button>
                  </div>
                </div>
              )}
            </Modal>

      <Pagination 
              currentPage={page}
              pageSize={pageSize}
              totalCount={totalCount}
              onPageChange={(p) => setPage(p)}
            />
          </>
        )}
      </div>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Registro de Cliente"
      >
        <form onSubmit={handleCreateClient}>
          <div className="form-group">
            <label>Nombre Completo</label>
            <input required type="text" value={newClient.nombre} onChange={e => setNewClient({...newClient, nombre: e.target.value})} />
          </div>
          <div className="form-group">
            <label>Identificación</label>
            <input required type="text" value={newClient.identificacion} onChange={e => setNewClient({...newClient, identificacion: e.target.value})} />
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Teléfono</label>
              <input type="tel" value={newClient.telefono} onChange={e => setNewClient({...newClient, telefono: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
            </div>
          </div>
          <div className="form-group">
            <label>Dirección</label>
            <input type="text" value={newClient.direccion} onChange={e => setNewClient({...newClient, direccion: e.target.value})} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-neutral" onClick={() => setShowCreateModal(false)}>Cancelar</button>
            <button type="submit" className="btn btn-primary">Registrar</button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showEditModal && !!editingClient}
        onClose={() => setShowEditModal(false)}
        title="Editar Cliente"
      >
        <form onSubmit={handleUpdateClient}>
          {editingClient && (
            <>
              <div className="form-group">
                <label>Nombre Completo</label>
                <input required type="text" value={editingClient.nombre} onChange={e => setEditingClient({...editingClient, nombre: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Identificación</label>
                <input required type="text" value={editingClient.identificacion} onChange={e => setEditingClient({...editingClient, identificacion: e.target.value})} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Teléfono</label>
                  <input type="tel" value={editingClient.telefono} onChange={e => setEditingClient({...editingClient, telefono: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={editingClient.email} onChange={e => setEditingClient({...editingClient, email: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Dirección</label>
                <input type="text" value={editingClient.direccion} onChange={e => setEditingClient({...editingClient, direccion: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-neutral" onClick={() => setShowEditModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Cambios</button>
              </div>
            </>
          )}
        </form>
      </Modal>


    </Layout>
  );
};

export default Clients;


