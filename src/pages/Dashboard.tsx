import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { 
  TrendingUp, 
  CheckCircle,
  Calendar,
  AlertCircle,
  ArrowUpRight,
  DollarSign,
  Shield,
  User
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/finance';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { useAuth } from '../contexts/AuthContext';

type GlobalAlert = {
  loanId: number;
  clientName: string;
  severity: 'red' | 'yellow';
  message: string;
  priority: number;
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Filler,
  Title,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalActiveLoans: 0,
    portfolioValue: 0,
    expectedToday: 0,
    paymentsToday: 0,
    delinquentCount: 0,
    recoveryRate: 85,
    weeklyGoal: 0,
    weeklyCollected: 0
  });
  const [assignedLoans, setAssignedLoans] = useState<any[]>([]);
  const [globalAlerts, setGlobalAlerts] = useState<GlobalAlert[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(false);
  const { user, profile } = useAuth();

  const fetchDashboardData = useCallback(async () => {
    try {
      let lQuery = supabase.from('prestamos').select('count', { count: 'exact' }).eq('estado', 'activo');
      let pQuery = supabase.from('prestamos').select('saldo_pendiente');
      let cQuery = supabase.from('cuotas').select('monto_cuota, prestamos!inner(cobrador_id)').eq('fecha_vencimiento', new Date().toISOString().split('T')[0]);
      let payQuery = supabase.from('cuotas').select('fecha_pago, prestamos!inner(cobrador_id)');
      let dQuery = supabase.from('prestamos').select('count', { count: 'exact' }).eq('estado', 'en_mora');

      if (profile?.rol === 'cobrador') {
        const uid = user?.id;
        lQuery = lQuery.eq('cobrador_id', uid);
        pQuery = pQuery.eq('cobrador_id', uid);
        cQuery = cQuery.eq('prestamos.cobrador_id', uid);
        payQuery = payQuery.eq('prestamos.cobrador_id', uid);
        dQuery = dQuery.eq('cobrador_id', uid);
      }

      const { data: loansActive } = await lQuery;
      const { data: portfolio } = await pQuery;
      const { data: todayCuotas } = await cQuery;
      const { data: paymentsToday } = await payQuery;
      const { data: delinquents } = await dQuery;

      const totalPortfolio = (portfolio as any[])?.reduce((acc: number, curr: any) => acc + Number(curr.saldo_pendiente), 0) || 0;
      const totalToday = (todayCuotas as any[])?.reduce((acc: number, curr: any) => acc + Number(curr.monto_cuota), 0) || 0;
      
      const hoyStr = new Date().toISOString().split('T')[0];
      const totalPaymentsToday = (paymentsToday as any[])?.reduce((acc: number, curr: any) => {
        if (!curr.fecha_pago) return acc;
        return curr.fecha_pago.split('T')[0] === hoyStr ? acc + 1 : acc;
      }, 0) || 0;

      setStats({
        totalActiveLoans: (loansActive as any)?.[0]?.count || 0,
        portfolioValue: totalPortfolio,
        expectedToday: totalToday,
        paymentsToday: totalPaymentsToday,
        delinquentCount: (delinquents as any)?.[0]?.count || 0,
        recoveryRate: 92,
        weeklyGoal: 0,
        weeklyCollected: 0
      });

      if (profile?.rol === 'admin') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: alertLoans } = await supabase
          .from('prestamos')
          .select(`
            id,
            estado,
            clientes (nombre),
            cuotas (fecha_vencimiento, estado)
          `)
          .in('estado', ['activo', 'en_mora'])
          .order('created_at', { ascending: false })
          .limit(200);

        const parsedAlerts = (alertLoans || []).map((loan: any) => {
          const nextCuota = (loan.cuotas || [])
            .filter((c: any) => c.estado !== 'pagado')
            .sort((a: any, b: any) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime())[0];

          if (!nextCuota?.fecha_vencimiento) return null;

          const dueDate = new Date(`${nextCuota.fecha_vencimiento}T00:00:00`);
          const diffDays = Math.floor((dueDate.getTime() - today.getTime()) / 86400000);

          if (diffDays < 0) {
            const overdueDays = Math.abs(diffDays);
            return {
              loanId: loan.id,
              clientName: loan.clientes?.nombre || 'Cliente sin nombre',
              severity: 'red' as const,
              message: `${overdueDays} ${overdueDays === 1 ? 'dia' : 'dias'} en mora`,
              priority: 300 + overdueDays
            };
          }

          if (diffDays === 0) {
            return {
              loanId: loan.id,
              clientName: loan.clientes?.nombre || 'Cliente sin nombre',
              severity: 'red' as const,
              message: 'Vence hoy',
              priority: 200
            };
          }

          if (diffDays === 1) {
            return {
              loanId: loan.id,
              clientName: loan.clientes?.nombre || 'Cliente sin nombre',
              severity: 'yellow' as const,
              message: 'Vence manana',
              priority: 100
            };
          }

          return null;
        })
        .filter(Boolean) as GlobalAlert[];

        setGlobalAlerts(
          parsedAlerts
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 5)
        );
      } else {
        setGlobalAlerts([]);
      }

      // Rango de la semana actual (Lunes a Domingo)
      const now = new Date();
      const dayOfWeek = now.getDay() || 7; // 1 (Lun) a 7 (Dom)
      const monday = new Date(now);
      monday.setDate(now.getDate() - dayOfWeek + 1);
      monday.setHours(0,0,0,0);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23,59,59,999);

      const startStr = monday.toISOString().split('T')[0];
      const endStr = sunday.toISOString().split('T')[0];

      // Fetch assigned loans details for collector table
      if (profile?.rol === 'cobrador') {
        setLoadingLoans(true);
        const uid = user?.id;

        // 1. Prestamos y Cuotas para la tabla
        const { data: aLoans } = await supabase
          .from('prestamos')
          .select(`
            id,
            monto_prestado,
            saldo_pendiente,
            estado,
            clientes (nombre, identificacion, telefono),
            cuotas (monto_cuota, fecha_vencimiento, estado)
          `)
          .eq('cobrador_id', uid)
          .neq('estado', 'pagado')
          .order('created_at', { ascending: false });

        // 2. Meta Semanal: Cuotas que vencen esta semana
        const { data: weeklyCuotas } = await supabase
          .from('cuotas')
          .select('monto_cuota, prestamos!inner(cobrador_id)')
          .eq('prestamos.cobrador_id', uid)
          .gte('fecha_vencimiento', startStr)
          .lte('fecha_vencimiento', endStr);

        // 3. Recaudado Semanal: Pagos realizados esta semana
        const { data: weeklyPayments } = await supabase
          .from('pagos')
          .select('monto_pagado, prestamos!inner(cobrador_id)')
          .eq('prestamos.cobrador_id', uid)
          .gte('fecha_pago', monday.toISOString())
          .lte('fecha_pago', sunday.toISOString());

        const goal = weeklyCuotas?.reduce((acc, c) => acc + Number(c.monto_cuota), 0) || 0;
        console.log('weeklyCuotas', weeklyCuotas);
        const collected = weeklyPayments?.reduce((acc, p) => acc + Number(p.monto_pagado), 0) || 0;
        
        // Filtrar cuotas pendientes para cada préstamo (solo la más próxima)
        const hoy = new Date().toISOString().split('T')[0];
        const processed = (aLoans || []).map(loan => {
          const nextCuota = loan.cuotas
            ?.filter((c: any) => c.estado !== 'pagado')
            ?.sort((a: any, b: any) => new Date(a.fecha_vencimiento).getTime() - new Date(b.fecha_vencimiento).getTime())[0];
          
          return {
            ...loan,
            proxima_cuota: nextCuota,
            es_para_hoy: nextCuota?.fecha_vencimiento === hoy
          };
        });

        setStats(prev => ({
          ...prev,
          weeklyGoal: goal,
          weeklyCollected: collected
        }));
        setAssignedLoans(processed);
        setLoadingLoans(false);
      }
    } catch (error) {
      console.error(error);
    }
  }, [profile, user]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const lineData = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Recaudos',
        data: [1200000, 1900000, 3000000, 500000, 2000000, 300000, 0],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.07)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        borderWidth: 2.5
      }
    ]
  };

  const lineOptions = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#94a3b8',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 10,
        callbacks: {
          label: (ctx: any) => ` ${formatCurrency(ctx.raw)}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: '#94a3b8', font: { size: 12, family: 'Inter' } }
      },
      y: {
        grid: { color: '#f1f5f9', drawBorder: false },
        border: { display: false, dash: [4, 4] },
        ticks: { 
          color: '#94a3b8',
          font: { size: 11, family: 'Inter' },
          callback: (value: any) => `$${(value / 1000000).toFixed(1)}M`
        }
      }
    }
  };

  const donutData = {
    labels: ['Al día', 'En mora', 'Pagados'],
    datasets: [
      {
        data: [65, 15, 20],
        backgroundColor: ['#2563eb', '#ef4444', '#10b981'],
        borderWidth: 0,
        borderRadius: 4
      }
    ]
  };

  const donutOptions = {
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 16,
          usePointStyle: true,
          pointStyleWidth: 8,
          color: '#64748b',
          font: { size: 12, family: 'Inter' }
        }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        bodyColor: '#fff',
        padding: 10,
        cornerRadius: 8
      }
    }
  };

  const statCards = [
    {
      label: 'Cartera Total',
      value: formatCurrency(stats.portfolioValue),
      icon: <DollarSign size={20} />,
      iconClass: 'blue',
      trend: '+8.2% este mes',
      trendUp: true
    },
    {
      label: 'Préstamos Activos',
      value: stats.totalActiveLoans,
      icon: <CheckCircle size={20} />,
      iconClass: 'green',
      trend: `${stats.recoveryRate}% recuperación`,
      trendUp: true
    },
    {
      label: 'Cobro de Hoy',
      value: formatCurrency(stats.expectedToday),
      icon: <Calendar size={20} />,
      iconClass: 'purple',
      trend: 'Cuotas pendientes',
      trendUp: true
    },
    {
      label: 'Pagos Recibidos',
      value: stats.paymentsToday,
      icon: <TrendingUp size={20} />,
      iconClass: 'teal',
      trend: 'Hoy cobrados',
      trendUp: true
    },
    {
      label: 'En Mora',
      value: stats.delinquentCount,
      icon: <AlertCircle size={20} />,
      iconClass: 'red',
      trend: 'Requieren atención',
      trendUp: false
    }
  ];



  return (
    <Layout title="Dashboard" subtitle="Resumen de tu cartera de préstamos">
      <div className="dashboard-role-row">
        <span className={`role-badge dashboard ${profile?.rol}`}>
          {profile?.rol === 'admin' ? <Shield size={12} /> : <User size={12} />}
          {profile?.rol === 'admin' ? 'Administrador' : 'Cobrador'}
        </span>
      </div>
      {/* STAT CARDS */}
      <div className="stats-row">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card animate-fade" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="stat-card-top">
              <div className={`stat-icon-wrap ${card.iconClass}`}>
                {card.icon}
              </div>
              <ArrowUpRight size={15} className={`stat-trend-icon ${card.trendUp ? 'up' : 'down'}`} />
            </div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-label">{card.label}</div>
            <div className={`stat-trend ${card.trendUp ? 'up' : 'down'}`}>
              {card.trend}
            </div>
          </div>
        ))}
      </div>

      {/* DASHBOARD CONTENT BASED ON ROLE */}
      {profile?.rol === 'admin' ? (
        <>
          {/* CHART */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-header">
              <div>
                <div className="card-title">Rendimiento Semanal</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Recaudos de los últimos 7 días</div>
              </div>
              <div className="chart-badge">Esta semana</div>
            </div>
            <div style={{ height: '210px' }}>
              <Line data={lineData} options={lineOptions as any} />
            </div>
          </div>

          {/* BOTTOM GRID */}
          <div className="grid-2">
            <div className="card">
              <div className="card-header" style={{ marginBottom: '12px' }}>
                <div className="card-title">Distribución</div>
              </div>
              <div style={{ height: '170px' }}>
                <Doughnut data={donutData} options={donutOptions} />
              </div>
            </div>

            <div className="card">
              <div className="card-header" style={{ marginBottom: '12px' }}>
                <div className="card-title">Alertas Globales</div>
                <span className="badge badge-danger">{globalAlerts.length} alertas</span>
              </div>
              <div className="alerts-list">
                {globalAlerts.length === 0 ? (
                  <div className="alert-row">
                    <div className="alert-dot yellow"></div>
                    <div className="alert-info">
                      <span className="alert-name">Sin alertas activas</span>
                      <span className="alert-meta">No hay cuotas urgentes para hoy o manana</span>
                    </div>
                  </div>
                ) : (
                  globalAlerts.map((alert) => (
                    <div className="alert-row" key={`alert-${alert.loanId}-${alert.clientName}`}>
                      <div className={`alert-dot ${alert.severity}`}></div>
                      <div className="alert-info">
                        <span className="alert-name">{alert.clientName}</span>
                        <span className="alert-meta">{alert.message}</span>
                      </div>
                      <Link to={`/pagos/${alert.loanId}`} className="alert-action-link">
                        Ver
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="collector-dashboard">
          <div className="card">
            <div className="card-header">
              <div className="card-title">Mis Cobros Pendientes</div>
              <div className="badge badge-info">{assignedLoans.length} préstamos</div>
            </div>
            
            <div className="collector-table-wrap">
              {loadingLoans ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>Cargando tus cobros...</div>
              ) : assignedLoans.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No tienes préstamos asignados con cuotas pendientes.
                </div>
              ) : (
                <table className="collector-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Cuota Próxima</th>
                      <th>Monto Cuota</th>
                      <th>Prioridad</th>
                      <th style={{ textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedLoans.map((loan) => (
                      <tr key={loan.id} className={loan.es_para_hoy ? 'row-highlight' : ''}>
                        <td>
                          <div className="collector-client-cell">
                            <strong>{loan.clientes.nombre}</strong>
                            <span>{loan.clientes.identificacion}</span>
                          </div>
                        </td>
                        <td>
                          <div className={`date-badge ${loan.es_para_hoy ? 'today' : ''}`}>
                            {loan.proxima_cuota?.fecha_vencimiento || 'N/A'}
                          </div>
                        </td>
                        <td>
                          <strong>{formatCurrency(loan.proxima_cuota?.monto_cuota || 0)}</strong>
                        </td>
                        <td>
                          {loan.estado === 'en_mora' ? (
                            <span className="badge badge-danger">Urgente</span>
                          ) : loan.es_para_hoy ? (
                            <span className="badge badge-info">Para hoy</span>
                          ) : (
                            <span className="badge badge-neutral">Programado</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link to={`/pagos/${loan.id}`} className="btn btn-primary btn-sm">
                            Ver
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Recomendaciones/Extras para Cobradores */}
          <div className="collector-extras mt-4">
            <div className="grid-2">
              <div className="card collector-promo-card teal">
                <div className="promo-content">
                  <h4>Mi Meta Semanal</h4>
                  <div className="goal-stats">
                    <div className="goal-item">
                      <span>Meta:</span>
                      <strong>{formatCurrency(stats.weeklyGoal)}</strong>
                    </div>
                    <div className="goal-item">
                      <span>Recaudado:</span>
                      <strong>{formatCurrency(stats.weeklyCollected)}</strong>
                    </div>
                  </div>
                  {stats.weeklyGoal > 0 ? (
                    <>
                      <p>Has recaudado el {Math.round((stats.weeklyCollected / stats.weeklyGoal) * 100)}% de tu meta.</p>
                      <div className="mini-progress-bar">
                        <div className="fill" style={{ width: `${Math.min(100, (stats.weeklyCollected / stats.weeklyGoal) * 100)}%` }}></div>
                      </div>
                    </>
                  ) : (
                    <p>No tienes cuotas programadas para esta semana.</p>
                  )}
                </div>
              </div>
              <div className="card collector-promo-card purple">
                <div className="promo-content">
                  <h4>Consejo del Día</h4>
                  <p>Recuerda actualizar la dirección si el cliente se ha mudado.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .dashboard-role-row {
          margin-bottom: 12px;
        }
        .dashboard-role-row .role-badge.dashboard {
          position: static;
        }
        .alert-action-link {
          margin-left: auto;
          font-size: 12px;
          font-weight: 700;
          color: var(--primary);
          text-decoration: none;
        }
        .alert-action-link:hover {
          text-decoration: underline;
        }
        .collector-table-wrap {
          overflow-x: auto;
          margin-top: 16px;
        }
        .collector-table {
          width: 100%;
          border-collapse: collapse;
        }
        .collector-table th {
          text-align: left;
          padding: 12px;
          border-bottom: 2px solid var(--border-light);
          font-size: 13px;
          color: var(--text-muted);
        }
        .collector-table td {
          padding: 14px 12px;
          border-bottom: 1px solid var(--border-light);
          font-size: 14px;
        }
        .collector-client-cell {
          display: flex;
          flex-direction: column;
        }
        .collector-client-cell span {
          font-size: 11px;
          color: var(--text-muted);
        }
        .date-badge {
          padding: 4px 8px;
          border-radius: 6px;
          background: #f1f5f9;
          font-size: 12px;
          font-weight: 600;
          display: inline-block;
        }
        .date-badge.today {
          background: #eff6ff;
          color: #2563eb;
          border: 1px solid #dbeafe;
        }
        .row-highlight {
          background: #f8fafc;
        }
        .collector-promo-card {
          padding: 20px;
          border: none;
          color: white;
        }
        .collector-promo-card.teal { background: linear-gradient(135deg, #0d9488, #14b8a6); }
        .collector-promo-card.purple { background: linear-gradient(135deg, #7c3aed, #8b5cf6); }
        .promo-content h4 { margin-bottom: 8px; font-weight: 700; }
        .promo-content p { font-size: 13px; opacity: 0.9; }
        .goal-stats {
          display: flex;
          gap: 16px;
          margin-bottom: 12px;
          background: rgba(0,0,0,0.1);
          padding: 8px 12px;
          border-radius: 8px;
        }
        .goal-item {
          display: flex;
          flex-direction: column;
        }
        .goal-item span {
          font-size: 11px;
          opacity: 0.8;
          text-transform: uppercase;
        }
        .goal-item strong {
          font-size: 14px;
        }
        .mini-progress-bar {
          height: 6px;
          background: rgba(255,255,255,0.2);
          border-radius: 3px;
          margin-top: 12px;
          overflow: hidden;
        }
        .mini-progress-bar .fill {
          height: 100%;
          background: white;
        }
        .mt-4 { margin-top: 24px; }
      `}</style>


    </Layout>
  );
};

export default Dashboard;




