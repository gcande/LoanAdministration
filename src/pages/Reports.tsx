import { useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/finance';
import { FileDown, BarChart3, AlertTriangle, TrendingUp, ArrowUpRight, ArrowDownRight, Users } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const exportPortfolioPDF = async () => {
    setLoading(true);
    try {
      const { data: loans } = await supabase
        .from('prestamos')
        .select('*, clientes(nombre, identificacion)')
        .order('created_at', { ascending: false });

      if (!loans) return;

      const doc = new jsPDF();

      // Header
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('PrestaYa', 14, 16);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Reporte de Cartera', 14, 26);
      doc.setFontSize(10);
      doc.text(`Generado: ${new Date().toLocaleString('es-CO')}`, 14, 33);

      const tableData = loans.map(l => [
        l.clientes.nombre,
        l.clientes.identificacion,
        formatCurrency(l.monto_prestado),
        formatCurrency(l.saldo_pendiente),
        l.estado.toUpperCase().replace('_', ' ')
      ]);

      autoTable(doc, {
        startY: 48,
        head: [['Cliente', 'Identificación', 'Monto', 'Saldo Pendiente', 'Estado']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 10 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        bodyStyles: { fontSize: 9, textColor: [30, 41, 59] },
        styles: { cellPadding: 6, lineColor: [226, 232, 240], lineWidth: 0.3 }
      });

      doc.save('reporte-cartera-prestaya.pdf');
    } catch {
      alert('Error al generar PDF');
    } finally {
      setLoading(false);
    }
  };

  const metrics = [
    {
      label: 'Recaudado este mes',
      value: formatCurrency(4580000),
      trend: '+12% vs mes anterior',
      trendUp: true,
      icon: <TrendingUp size={22} />,
      color: 'blue'
    },
    {
      label: 'Total en mora',
      value: formatCurrency(1250000),
      trend: '5 préstamos afectados',
      trendUp: false,
      icon: <AlertTriangle size={22} />,
      color: 'red'
    },
    {
      label: 'Nuevos clientes',
      value: '8',
      trend: '+3 vs mes anterior',
      trendUp: true,
      icon: <Users size={22} />,
      color: 'green'
    },
    {
      label: 'Tasa de cobro',
      value: '87%',
      trend: 'Eficiencia del mes',
      trendUp: true,
      icon: <BarChart3 size={22} />,
      color: 'purple'
    }
  ];

  return (
    <Layout title="Informes" subtitle="Análisis y exportación de reportes de cartera">
      {/* METRIC CARDS */}
      <div className="report-metrics-grid">
        {metrics.map((m, i) => (
          <div key={i} className="report-metric-card animate-fade" style={{ animationDelay: `${i * 60}ms` }}>
            <div className="report-metric-top">
              <div className={`report-metric-icon ${m.color}`}>{m.icon}</div>
              {m.trendUp
                ? <ArrowUpRight size={16} className="trend-icon up" />
                : <ArrowDownRight size={16} className="trend-icon down" />
              }
            </div>
            <div className="report-metric-value">{m.value}</div>
            <div className="report-metric-label">{m.label}</div>
            <div className={`report-metric-trend ${m.trendUp ? 'up' : 'down'}`}>{m.trend}</div>
          </div>
        ))}
      </div>

      {/* EXPORT CARD */}
      <div className="card animate-fade" style={{ marginBottom: '16px' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Exportar Reporte de Cartera</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
              Descarga la lista completa de préstamos y saldos en PDF
            </div>
          </div>
          <div style={{ background: 'var(--secondary-light)', borderRadius: '10px', padding: '10px' }}>
            <FileDown size={22} color="var(--secondary)" />
          </div>
        </div>

        <div className="filter-section">
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px' }}>
            Filtrar por rango de fechas
          </div>
          <div className="grid-2">
            <div className="form-group">
              <label>Desde</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Hasta</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
          </div>
        </div>

        <button
          className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
          onClick={exportPortfolioPDF}
          disabled={loading}
          style={{ marginTop: '16px' }}
        >
          {loading ? (
            <>
              <div className="btn-spinner" />
              Generando PDF...
            </>
          ) : (
            <>
              <FileDown size={18} />
              Descargar Reporte en PDF
            </>
          )}
        </button>
      </div>

      {/* DELINQUENT CARD */}
      <div className="card animate-fade">
        <div className="card-header">
          <div>
            <div className="card-title">Clientes en Mora</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
              Préstamos que requieren gestión de cobro
            </div>
          </div>
          <span className="badge badge-danger">5 casos</span>
        </div>

        <div className="mora-summary">
          <div className="mora-stat">
            <span className="mora-stat-value" style={{ color: 'var(--danger)' }}>{formatCurrency(1250000)}</span>
            <span className="mora-stat-label">Monto total en mora</span>
          </div>
          <div className="mora-divider" />
          <div className="mora-stat">
            <span className="mora-stat-value">5</span>
            <span className="mora-stat-label">Préstamos afectados</span>
          </div>
          <div className="mora-divider" />
          <div className="mora-stat">
            <span className="mora-stat-value">12%</span>
            <span className="mora-stat-label">Del total de cartera</span>
          </div>
        </div>

        <button className="btn btn-danger w-full" style={{ marginTop: '16px' }}>
          <AlertTriangle size={16} />
          Ver Listado de Morosos
        </button>
      </div>

      <style>{`
        /* METRIC CARDS */
        .report-metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .report-metric-card {
          background: white;
          border: 1px solid var(--card-border);
          border-radius: var(--radius);
          padding: 18px;
          box-shadow: var(--card-shadow);
          transition: var(--transition);
        }

        .report-metric-card:hover {
          box-shadow: var(--card-shadow-hover);
          transform: translateY(-1px);
        }

        .report-metric-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .report-metric-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .report-metric-icon.blue { background: #eff6ff; color: #2563eb; }
        .report-metric-icon.red { background: #fef2f2; color: #dc2626; }
        .report-metric-icon.green { background: #f0fdf4; color: #16a34a; }
        .report-metric-icon.purple { background: #f5f3ff; color: #7c3aed; }

        .trend-icon.up { color: var(--success); }
        .trend-icon.down { color: var(--danger); }

        .report-metric-value {
          font-size: 22px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.03em;
        }

        .report-metric-label {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
          font-weight: 500;
        }

        .report-metric-trend {
          font-size: 11px;
          font-weight: 600;
          margin-top: 8px;
          padding: 3px 8px;
          border-radius: 999px;
          display: inline-block;
        }

        .report-metric-trend.up {
          background: var(--success-light);
          color: #059669;
        }

        .report-metric-trend.down {
          background: var(--danger-light);
          color: var(--danger);
        }

        /* FILTER */
        .filter-section {
          background: var(--bg-app);
          border-radius: 10px;
          padding: 14px;
          border: 1px solid var(--border-light);
        }

        /* LOADING BUTTON */
        .btn-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* MORA SUMMARY */
        .mora-summary {
          display: flex;
          background: var(--bg-app);
          border-radius: 10px;
          padding: 16px;
          border: 1px solid var(--border-light);
          gap: 0;
        }

        .mora-stat {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .mora-stat-value {
          font-size: 18px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .mora-stat-label {
          font-size: 10.5px;
          color: var(--text-muted);
          text-align: center;
          line-height: 1.4;
        }

        .mora-divider {
          width: 1px;
          background: var(--border);
          margin: 0 8px;
        }

        @media (min-width: 600px) {
          .report-metrics-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 14px;
          }
        }

        @media (max-width: 380px) {
          .report-metric-value { font-size: 18px; }
          .mora-summary { flex-direction: column; gap: 12px; }
          .mora-divider { height: 1px; width: 100%; margin: 0; }
        }
      `}</style>
    </Layout>
  );
};

export default Reports;
