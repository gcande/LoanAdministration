import { useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../utils/finance';
import { FileDown, Filter, BarChart3 } from 'lucide-react';
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
      doc.setFontSize(18);
      doc.text('Reporte de Cartera PrestaYa', 14, 22);
      doc.setFontSize(11);
      doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 30);

      const tableData = loans.map(l => [
        l.clientes.nombre,
        l.clientes.identificacion,
        formatCurrency(l.monto_prestado),
        formatCurrency(l.saldo_pendiente),
        l.estado.toUpperCase()
      ]);

      autoTable(doc, {
        startY: 35,
        head: [['Cliente', 'Identificación', 'Monto', 'Saldo', 'Estado']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: '#0f172a' }
      });

      doc.save('reporte-cartera.pdf');
    } catch (error) {
      alert('Error al generar PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Reportes y Análisis">
      <div className="grid gap-6">
        <div className="card">
          <h4>Generar Reporte de Cartera</h4>
          <p className="text-secondary mb-4">Exporta la lista completa de préstamos y sus saldos actuales.</p>
          
          <div className="grid-2 mb-4">
            <div className="form-group">
              <label>Desde</label>
              <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Hasta</label>
              <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} />
            </div>
          </div>

          <button className="btn btn-primary w-full" onClick={exportPortfolioPDF} disabled={loading}>
            <FileDown size={20} />
            {loading ? 'Generando...' : 'Descargar PDF de Cartera'}
          </button>
        </div>

        <div className="card">
          <h4>Ingresos Mensuales</h4>
          <div className="report-stat">
            <BarChart3 size={48} className="text-secondary opacity-20" />
            <div className="stat-content">
              <span>Recaudado este mes</span>
              <h3>{formatCurrency(4580000)}</h3>
              <p className="text-success">+12% vs mes anterior</p>
            </div>
          </div>
        </div>

        <div className="card">
          <h4>Clientes en Mora</h4>
          <div className="report-stat">
            <Filter size={48} className="text-danger opacity-20" />
            <div className="stat-content">
              <span>Total en Mora</span>
              <h3 className="text-danger">{formatCurrency(1250000)}</h3>
              <p className="text-secondary">5 préstamos afectados</p>
            </div>
          </div>
          <button className="btn btn-secondary w-full mt-4">
            Ver Listado de Morosos
          </button>
        </div>
      </div>

      <style>{`
        .mb-4 { margin-bottom: 16px; }
        .report-stat {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 16px 0;
        }
        .stat-content span {
          font-size: 13px;
          color: #64748b;
        }
        .text-success { color: var(--secondary); font-size: 12px; font-weight: 600; }
      `}</style>
    </Layout>
  );
};

export default Reports;
