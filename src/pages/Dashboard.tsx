import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { 
  TrendingUp, 
  CheckCircle,
  Calendar,
  AlertCircle
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
  ArcElement
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
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
      console.log('delinquents', delinquents);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lineData = {
    labels: ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'],
    datasets: [
      {
        label: 'Recaudos',
        data: [1200000, 1900000, 3000000, 500000, 2000000, 300000, 0],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.05)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#fff',
        pointBorderWidth: 2
      }
    ]
  };

  const donutData = {
    labels: ['Al día', 'En mora', 'Pagados'],
    datasets: [
      {
        data: [65, 15, 20],
        backgroundColor: ['#2563eb', '#f1f5f9', '#94a3b8'],
        borderWidth: 0
      }
    ]
  };

  return (
    <Layout title="Dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <p>Cartera Total</p>
            <h3>{formatCurrency(stats.portfolioValue)}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <p>Préstamos Activos</p>
            <h3>{stats.totalActiveLoans}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow">
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <p>Cobro Hoy</p>
            <h3>{formatCurrency(stats.expectedToday)}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow">
            <Calendar size={24} />
          </div>
          <div className="stat-info">
            <p>Cuotas Pagadas Hoy</p>
            <h3>{stats.paymentsToday}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">
            <AlertCircle size={24} />
          </div>
          <div className="stat-info">
            <p>En Mora</p>
            <h3>{stats.delinquentCount}</h3>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h4>Rendimiento Semanal</h4>
          <span className="text-secondary">Ver más</span>
        </div>
        <div style={{ height: '200px' }}>
          <Line data={lineData} options={{ maintainAspectRatio: false }} />
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h4>Distribución</h4>
          <div style={{ height: '150px' }}>
            <Doughnut data={donutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>
        <div className="card">
          <h4>Alertas</h4>
          <div className="alerts-list">
            <div className="alert-item">
              <span className="dot red"></span>
              <p>Juan Pérez (3 días mora)</p>
            </div>
            <div className="alert-item">
              <span className="dot red"></span>
              <p>Maria Garcia (1 día mora)</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: var(--card-bg);
          padding: 16px;
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .stat-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.blue { background: #eff6ff; color: #2563eb; }
        .stat-icon.green { background: #f0fdf4; color: #16a34a; }
        .stat-icon.red { background: #fef2f2; color: #dc2626; }
        .stat-icon.yellow { background: #fffbeb; color: #ca8a04; }

        .stat-info p {
          font-size: 13px;
          color: #64748b;
          margin: 0;
          font-weight: 500;
        }

        .stat-info h3 {
          font-size: 18px;
          margin: 0;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 10px;
        }

        .alert-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .dot.red { background: var(--danger); }

        @media (min-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
      `}</style>
    </Layout>
  );
};

export default Dashboard;
