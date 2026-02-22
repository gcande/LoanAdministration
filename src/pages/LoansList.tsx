import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/finance';
import { Search, CreditCard, Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const LoansList = () => {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'todos' | 'activo' | 'en_mora' | 'pagado'>('todos');

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize] = useState(6);
  const [totalCount, setTotalCount] = useState(0);
  
  // Stats for tabs
  const [counts, setCounts] = useState({ todos: 0, activo: 0, en_mora: 0, pagado: 0 });

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const hoy = new Date().toISOString().split('T')[0];

      // 1. Obtener IDs globales con mora para filtrar y contar
      const { data: qMora } = await supabase
        .from('cuotas')
        .select('prestamo_id')
        .neq('estado', 'pagado')
        .lt('fecha_vencimiento', hoy);
      
      const moraIds = Array.from(new Set(qMora?.map(x => x.prestamo_id) || []));

      // 2. Obtener contadores totales para las pestañas (Diseño anterior)
      const { count: cTodos } = await supabase.from('prestamos').select('*', { count: 'exact', head: true });
      const { count: cPagado } = await supabase.from('prestamos').select('*', { count: 'exact', head: true }).eq('estado', 'pagado');
      
      // Contar cuántos de los 'activos' están realmente en mora para ajustar el contador de "Al día"
      const { data: prestamosActivos } = await supabase.from('prestamos').select('id').eq('estado', 'activo');
      const activosIds = (prestamosActivos || []).map(p => p.id);
      const enMoraEfecivos = moraIds.filter(id => activosIds.includes(id));

      setCounts({
        todos: cTodos || 0,
        activo: activosIds.length - enMoraEfecivos.length,
        en_mora: moraIds.length,
        pagado: cPagado || 0
      });

      // 3. Query Principal
      let query = supabase
        .from('prestamos')
        .select(`
          *,
          clientes!inner (nombre, identificacion),
          planes_prestamo (nombre_plan)
        `, { count: 'exact' });

      // 4. Aplicar Búsqueda y Filtros
      if (searchTerm) {
        query = query.or(`nombre.ilike.%${searchTerm}%,identificacion.ilike.%${searchTerm}%`, { foreignTable: 'clientes' });
      }

      if (filter === 'activo') {
        query = query.eq('estado', 'activo');
        if (moraIds.length > 0) {
          query = query.not('id', 'in', `(${moraIds.join(',')})`);
        }
      }
      if (filter === 'pagado') query = query.eq('estado', 'pagado');
      if (filter === 'en_mora') {
        if (moraIds.length > 0) {
          query = query.in('id', moraIds);
        } else {
          query = query.eq('id', '00000000-0000-0000-0000-000000000000');
        }
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;

      // 5. Procesar estados para la UI
      const moraSet = new Set(moraIds);
      const processed = (data || []).map(loan => {
        let uiStatus = loan.estado || 'activo';
        if (loan.estado !== 'pagado' && moraSet.has(loan.id)) {
          uiStatus = 'en_mora';
        }
        return { ...loan, estado_ui: uiStatus };
      });

      setLoans(processed);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching loans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [page, searchTerm, filter]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const progressPercent = (loan: any) => {
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
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="filter-tabs">
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            className={`filter-tab ${filter === tab.key ? 'active' : ''}`}
            onClick={() => {
              setFilter(tab.key as any);
              setPage(1);
            }}
          >
            {tab.label}
            <span className="filter-tab-count">
              {counts[tab.key as keyof typeof counts] || 0}
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
        ) : loans.length === 0 ? (
          <div className="empty-state">
            <CreditCard size={48} style={{ margin: '0 auto 16px', display: 'block', opacity: 0.2 }} />
            <p style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>No hay préstamos</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {searchTerm ? 'No se encontraron resultados para tu búsqueda' : 'Aún no hay préstamos registrados'}
            </p>
          </div>
        ) : (
          <>
            {loans.map((loan: any, i: number) => {
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
          })}
          
          <Pagination 
            currentPage={page}
            pageSize={pageSize}
            totalCount={totalCount}
            onPageChange={(p) => setPage(p)}
          />
        </>
      )}
    </div>

    </Layout>
  );
};

export default LoansList;
