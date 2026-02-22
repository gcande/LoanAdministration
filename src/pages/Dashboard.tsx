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
    recoveryRate: 85
  });

  const fetchDashboardData = useCallback(async () => {
    try {
      const { data: loansActive } = await supabase.from('prestamos').select('count', { count: 'exact' }).eq('estado', 'activo');
      const { data: portfolio } = await supabase.from('prestamos').select('saldo_pendiente');
      const { data: todayCuotas } = await supabase.from('cuotas').select('monto_cuota').eq('fecha_vencimiento', new Date().toISOString().split('T')[0]);
      const {data: paymentsToday} = await supabase.from('cuotas').select('fecha_pago');
      const { data: delinquents } = await supabase.from('prestamos').select('count', { count: 'exact' }).eq('estado', 'en_mora');

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
        recoveryRate: 92
      });
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  const { profile } = useAuth();

  return (
    <Layout title="Dashboard" subtitle="Resumen de tu cartera de préstamos">
      <span className={`role-badge dashboard ${profile?.rol}`}>
        {profile?.rol === 'admin' ? <Shield size={12} /> : <User size={12} />}
        {profile?.rol === 'admin' ? 'Administrador' : 'Cobrador'}
      </span>
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
            <div className="card-title">Alertas</div>
            <span className="badge badge-danger">{stats.delinquentCount} mora</span>
          </div>
          <div className="alerts-list">
            <div className="alert-row">
              <div className="alert-dot red"></div>
              <div className="alert-info">
                <span className="alert-name">Juan Pérez</span>
                <span className="alert-meta">3 días en mora</span>
              </div>
            </div>
            <div className="alert-row">
              <div className="alert-dot red"></div>
              <div className="alert-info">
                <span className="alert-name">Maria Garcia</span>
                <span className="alert-meta">1 día en mora</span>
              </div>
            </div>
            <div className="alert-row">
              <div className="alert-dot yellow"></div>
              <div className="alert-info">
                <span className="alert-name">Carlos Ruiz</span>
                <span className="alert-meta">Vence mañana</span>
              </div>
            </div>
          </div>
        </div>
      </div>


    </Layout>
  );
};

export default Dashboard;

