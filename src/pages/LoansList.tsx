import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/finance';
import { Search, CreditCard, Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const LoansList = () => {
  const [loans, setLoans] = useState<any[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'todos' | 'activo' | 'en_mora' | 'pagado'>('todos');

  const fetchLoans = async () => {
    setLoading(true);
    // 1. Obtener préstamos con sus relaciones
    const { data: loansData, error } = await supabase
      .from('prestamos')
      .select(`
        *,
        clientes (nombre, identificacion),
        planes_prestamo (nombre_plan)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching loans:', error);
      setLoading(false);
      return;
    }

    // 2. Obtener IDs de préstamos que tienen al menos una cuota vencida pendiente
    const hoy = new Date().toISOString().split('T')[0];
    const { data: cuotasVencidas } = await supabase
      .from('cuotas')
      .select('prestamo_id')
      .neq('estado', 'pagado')
      .lt('fecha_vencimiento', hoy);

    const idsConMora = new Set(cuotasVencidas?.map(c => c.prestamo_id) || []);

    // 3. Procesar los préstamos para la interfaz de usuario
    const processedLoans = (loansData || []).map(loan => {
      let uiStatus = loan.estado || 'activo';
      
      // Si el préstamo no está pagado pero tiene cuotas vencidas, mostramos mora
      if (loan.estado !== 'pagado' && idsConMora.has(loan.id)) {
        uiStatus = 'en_mora';
      }
      
      return { 
        ...loan, 
        estado_ui: uiStatus 
      };
    });

    setLoans(processedLoans);
    setLoading(false);
  };

  useEffect(() => {
    fetchLoans();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredLoans = loans.filter(l => {
    const name = String(l.clientes?.nombre || '').toLowerCase();
    const idNum = String(l.clientes?.identificacion || '');
    const search = searchTerm.toLowerCase();
    
    const matchSearch = name.includes(search) || idNum.includes(search);
    const matchFilter = filter === 'todos' || l.estado_ui === filter;
    
    return matchSearch && matchFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'activo': 
        return <span className="badge badge-info shadow-sm">Al día</span>;
      case 'en_mora': 
        return <span className="badge badge-danger shadow-sm">En Mora</span>;
      case 'pagado': 
        return <span className="badge badge-success shadow-sm">Pagado</span>;
      default: 
        return <span className="badge badge-neutral shadow-sm">{status || 'Activo'}</span>;
    }
  };

  const filterTabs = [
    { key: 'todos', label: 'Todos' },
    { key: 'activo', label: 'Al día' },
    { key: 'en_mora', label: 'En mora' },
    { key: 'pagado', label: 'Pagados' }
  ];

  const progressPercent = (loan: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const total = Number(loan.monto_prestado) || 1;
    const pending = Number(loan.saldo_pendiente) || 0;
    return Math.round(((total - pending) / total) * 100);
  };

  return (
    <Layout title="Préstamos" subtitle={`${loans.length} préstamos registrados`}>
      {/* SEARCH */}
      <div className="search-bar">
        <div className="search-input">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar por nombre o identificación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="filter-tabs">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            className={`filter-tab ${filter === tab.key ? 'active' : ''}`}
            onClick={() => setFilter(tab.key as 'todos' | 'activo' | 'en_mora' | 'pagado')}
          >
            {tab.label}
            <span className="filter-tab-count">
              {tab.key === 'todos'
                ? loans.length
                : loans.filter(l => l.estado_ui === tab.key).length}
            </span>
          </button>
        ))}
      </div>

      {/* LOANS LIST */}
      <div className="loans-container">
        {loading ? (
          <div className="loans-skeleton">
            {[1, 2, 3].map(i => (
              <div key={i} className="loan-skeleton-card">
                <div className="skeleton" style={{ height: '16px', width: '60%' }} />
                <div className="skeleton" style={{ height: '12px', width: '40%', marginTop: '8px' }} />
                <div className="skeleton" style={{ height: '40px', marginTop: '16px' }} />
              </div>
            ))}
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="empty-state">
            <CreditCard size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.2 }} />
            <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No hay préstamos</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {searchTerm ? 'No se encontraron resultados para tu búsqueda' : 'Aún no hay préstamos registrados'}
            </p>
          </div>
        ) : (
          filteredLoans.map((loan, i) => {
            const progress = progressPercent(loan);
            return (
              <div
                key={loan.id}
                className="loan-card animate-fade"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {/* LOAN HEADER */}
                <div className="loan-card-header">
                  <div className="loan-client">
                    <div className="loan-avatar">
                      {String(loan.clientes.nombre).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="loan-client-name">{loan.clientes.nombre}</div>
                      <div className="loan-plan">{loan.planes_prestamo?.nombre_plan}</div>
                    </div>
                  </div>
                  {getStatusBadge(loan.estado_ui)}
                </div>

                {/* LOAN STATS */}
                <div className="loan-stats-row">
                  <div className="loan-stat-block">
                    <span className="loan-stat-label">Monto</span>
                    <span className="loan-stat-val">{formatCurrency(loan.monto_prestado)}</span>
                  </div>
                  <div className="loan-stat-divider" />
                  <div className="loan-stat-block">
                    <span className="loan-stat-label">Saldo</span>
                    <span className="loan-stat-val highlight">{formatCurrency(loan.saldo_pendiente)}</span>
                  </div>
                  <div className="loan-stat-divider" />
                  <div className="loan-stat-block">
                    <span className="loan-stat-label">Cuotas</span>
                    <span className="loan-stat-val">{loan.num_cuotas}</span>
                  </div>
                </div>

                {/* PROGRESS */}
                <div className="loan-progress-wrap">
                  <div className="loan-progress-header">
                    <span className="loan-progress-label">Progreso de pago</span>
                    <span className="loan-progress-pct">{progress}%</span>
                  </div>
                  <div className="loan-progress-bar">
                    <div
                      className="loan-progress-fill"
                      style={{
                        width: `${progress}%`,
                        background: progress > 70 ? 'var(--success)' : progress > 30 ? 'var(--secondary)' : 'var(--warning)'
                      }}
                    />
                  </div>
                </div>

                {/* LOAN FOOTER */}
                <div className="loan-card-footer">
                  <div className="loan-dates">
                    <div className="loan-date-item">
                      <Calendar size={12} />
                      <span>{loan.fecha_inicio}</span>
                    </div>
                    <span className="loan-date-sep">→</span>
                    <div className="loan-date-item">
                      <Calendar size={12} />
                      <span>{loan.fecha_fin}</span>
                    </div>
                  </div>
                  <Link to={`/pagos/${loan.id}`} className="loan-action-btn">
                    <CreditCard size={15} />
                    <span>Ver pagos</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

    </Layout>
  );
};

export default LoansList;
