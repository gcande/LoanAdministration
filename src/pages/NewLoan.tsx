import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { calculateAmortization, formatCurrency } from '../utils/finance';
import type { AmortizationRow } from '../utils/finance';
import { Save, Calculator, Info, CheckCircle2, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NewLoan = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<any[]>([]);
  const [planes, setPlanes] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    cliente_id: '',
    plan_id: '',
    monto: 0,
    fecha_inicio: new Date().toISOString().split('T')[0]
  });

  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [schedule, setSchedule] = useState<AmortizationRow[]>([]);
  const [amortSystem, setAmortSystem] = useState<'frances' | 'flat'>('frances');

  useEffect(() => {
    fetchData();
    fetchConfig();
  }, []);

  const fetchData = async () => {
    const { data: c } = await supabase.from('clientes').select('id, nombre, identificacion');
    const { data: p } = await supabase.from('planes_prestamo').select('*').eq('activo', true);
    setClientes(c || []);
    setPlanes(p || []);
  };

  const fetchConfig = async () => {
    const { data } = await supabase
      .from('configuracion')
      .select('valor')
      .eq('clave', 'sistema_amortizacion')
      .single();
    if (data) {
      setAmortSystem(data.valor as 'frances' | 'flat');
    }
  };

  const handlePlanChange = (planId: string) => {
    const plan = planes.find(p => p.id === planId);
    setSelectedPlan(plan);
    if (plan) {
      setFormData(prev => ({
        ...prev,
        plan_id: planId,
        monto: plan.monto_minimo
      }));
    }
  };

  const calculatePreview = () => {
    if (!selectedPlan || !formData.monto) return;
    const result = calculateAmortization(
      formData.monto,
      selectedPlan.tasa_interes,
      selectedPlan.num_cuotas,
      selectedPlan.frecuencia_pago,
      formData.fecha_inicio,
      amortSystem
    );
    setSchedule(result);
  };

  const handleCreateLoan = async () => {
    if (!formData.cliente_id || !formData.plan_id || schedule.length === 0) {
      alert('Complete todos los campos y calcule la tabla');
      return;
    }

    try {
      // 1. Crear Préstamo
      const { data: loan, error: loanError } = await supabase.from('prestamos').insert([{
        cliente_id: formData.cliente_id,
        plan_id: formData.plan_id,
        monto_prestado: formData.monto,
        tasa_interes: selectedPlan.tasa_interes,
        num_cuotas: selectedPlan.num_cuotas,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: schedule[schedule.length - 1].fecha_vencimiento,
        saldo_pendiente: formData.monto,
        estado: 'activo'
      }]).select().single();

      if (loanError) throw loanError;

      // 2. Crear Cuotas
      const cuotasToInsert = schedule.map(s => ({
        prestamo_id: loan.id,
        numero_cuota: s.numero_cuota,
        monto_cuota: s.monto_cuota,
        monto_capital: s.monto_capital,
        monto_interes: s.monto_interes,
        fecha_vencimiento: s.fecha_vencimiento,
        estado: 'pendiente'
      }));

      const { error: cuotasError } = await supabase.from('cuotas').insert(cuotasToInsert);
      if (cuotasError) throw cuotasError;

      alert('Préstamo creado con éxito');
      navigate('/prestamos');
    } catch (error) {
      console.error(error);
      alert('Error al crear el préstamo');
    }
  };

  return (
    <Layout title="Nuevo Préstamo">
      <div className="card">
        <h3>Configuración de Préstamo</h3>
        <div className="form-grid">
          <div className="form-group">
            <label>Cliente</label>
            <select value={formData.cliente_id} onChange={e => setFormData({...formData, cliente_id: e.target.value})}>
              <option value="">Seleccione un cliente</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} ({c.identificacion})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Plan de Préstamo</label>
            <select value={formData.plan_id} onChange={e => handlePlanChange(e.target.value)}>
              <option value="">Seleccione un plan</option>
              {planes.map(p => (
                <option key={p.id} value={p.id}>{p.nombre_plan} - {p.num_cuotas} {p.frecuencia_pago}s - {p.tasa_interes}%</option>
              ))}
            </select>
          </div>

          {selectedPlan && (
            <>
              <div className="form-group">
                <label>Monto ({formatCurrency(selectedPlan.monto_minimo)} - {formatCurrency(selectedPlan.monto_maximo)})</label>
                <input 
                  type="number" 
                  value={formData.monto} 
                  onChange={e => setFormData({...formData, monto: Number(e.target.value)})}
                  min={selectedPlan.monto_minimo}
                  max={selectedPlan.monto_maximo}
                />
              </div>
              <div className="form-group">
                <label>Fecha de Inicio</label>
                <input 
                  type="date" 
                  value={formData.fecha_inicio} 
                  onChange={e => setFormData({...formData, fecha_inicio: e.target.value})}
                />
              </div>
            </>
          )}
        </div>

        <button className="btn btn-secondary w-full" onClick={calculatePreview} disabled={!selectedPlan}>
          <Calculator size={20} />
          Calcular Tabla de Amortización
        </button>
      </div>

      {schedule.length > 0 && (
        <div className="card animate-fade">
          <div className="loan-summary-grid">
            <div className="summary-card">
              <div className="summary-icon blue">
                <Calculator size={18} />
              </div>
              <div className="summary-details">
                <span>Cuota Periódica</span>
                <strong>{formatCurrency(schedule[0].monto_cuota)}</strong>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon green">
                <CheckCircle2 size={18} />
              </div>
              <div className="summary-details">
                <span>Total a Pagar</span>
                <strong>{formatCurrency(schedule.reduce((acc, row) => acc + row.monto_cuota, 0))}</strong>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon orange">
                <TrendingUp size={18} />
              </div>
              <div className="summary-details">
                <span>Total Intereses</span>
                <strong>{formatCurrency(schedule.reduce((acc, row) => acc + row.monto_interes, 0))}</strong>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon light">
                <Info size={18} />
              </div>
              <div className="summary-details">
                <span>Tasa Aplicada</span>
                <strong>{selectedPlan.tasa_interes}%</strong>
              </div>
            </div>
          </div>
          
          <div className="table-responsive">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Fecha</th>
                  <th>Cuota</th>
                  <th>Capital</th>
                  <th>Interés</th>
                  <th>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map(row => (
                  <tr key={row.numero_cuota}>
                    <td>{row.numero_cuota}</td>
                    <td>{row.fecha_vencimiento}</td>
                    <td>{formatCurrency(row.monto_cuota)}</td>
                    <td>{formatCurrency(row.monto_capital)}</td>
                    <td>{formatCurrency(row.monto_interes)}</td>
                    <td>{formatCurrency(row.saldo_pendiente)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button className="btn btn-primary w-full mt-4" onClick={handleCreateLoan}>
            <Save size={20} />
            Confirmar y Guardar Préstamo
          </button>
        </div>
      )}

      <style>{`
        .form-grid {
          display: grid;
          gap: 16px;
          margin: 16px 0;
        }

        .w-full { width: 100%; }
        .mt-4 { margin-top: 20px; }

        .loan-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
          margin-bottom: 24px;
        }

        .summary-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: var(--bg-surface);
          border-radius: var(--radius);
          border: 1px solid var(--border);
        }

        .summary-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .summary-icon.blue { background: rgba(37, 99, 235, 0.1); color: #2563eb; }
        .summary-icon.green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        .summary-icon.orange { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .summary-icon.light { background: rgba(100, 116, 139, 0.1); color: #64748b; }

        .summary-details {
          display: flex;
          flex-direction: column;
        }

        .summary-details span {
          font-size: 11px;
          color: var(--text-secondary);
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .summary-details strong {
          font-size: 14px;
          color: var(--primary);
        }

        .table-responsive {
          overflow-x: auto;
          margin: 0 -20px;
          padding: 0 20px;
        }

        .schedule-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .schedule-table th {
          text-align: left;
          color: #64748b;
          padding: 8px;
          border-bottom: 2px solid var(--border);
        }

        .schedule-table td {
          padding: 12px 8px;
          border-bottom: 1px solid var(--border);
        }

        .schedule-table tr:last-child td {
          border-bottom: none;
        }
      `}</style>
    </Layout>
  );
};

export default NewLoan;
