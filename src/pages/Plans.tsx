import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Edit, Check, X } from 'lucide-react';
import { formatCurrency } from '../utils/finance';

const Plans = () => {
  const [planes, setPlanes] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nombre_plan: '',
    monto_minimo: 100000,
    monto_maximo: 5000000,
    tasa_interes: 10,
    num_cuotas: 12,
    frecuencia_pago: 'mensual',
    activo: true
  });

  const fetchPlanes = useCallback(async () => {
    const { data } = await supabase
      .from('planes_prestamo')
      .select('*')
      .order('created_at', { ascending: false });
    setPlanes(data || []);
  }, []);

  useEffect(() => {
    fetchPlanes();
  }, [fetchPlanes]);

  const handleOpenModal = (plan?: any) => {
    if (plan) {
      setEditingId(plan.id);
      setFormData({
        nombre_plan: plan.nombre_plan,
        monto_minimo: plan.monto_minimo,
        monto_maximo: plan.monto_maximo,
        tasa_interes: plan.tasa_interes,
        num_cuotas: plan.num_cuotas,
        frecuencia_pago: plan.frecuencia_pago,
        activo: plan.activo
      });
    } else {
      setEditingId(null);
      setFormData({
        nombre_plan: '',
        monto_minimo: 100000,
        monto_maximo: 5000000,
        tasa_interes: 10,
        num_cuotas: 12,
        frecuencia_pago: 'mensual',
        activo: true
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        const { error } = await supabase
          .from('planes_prestamo')
          .update(formData)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('planes_prestamo')
          .insert([formData]);
        if (error) throw error;
      }
      
      setShowModal(false);
      fetchPlanes();
    } catch (error) {
      console.error(error);
      alert('Error al guardar el plan');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este plan? No se podrá eliminar si tiene préstamos asociados.')) {
      const { error } = await supabase
        .from('planes_prestamo')
        .delete()
        .eq('id', id);
      
      if (error) {
        alert('No se pudo eliminar el plan. Es posible que ya esté en uso.');
      } else {
        fetchPlanes();
      }
    }
  };

  return (
    <Layout title="Planes de Préstamo">
      <div className="actions-header animate-fade">
        <p className="text-secondary">Configura tus productos financieros y tasas.</p>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} />
          Nuevo Plan
        </button>
      </div>

      <div className="plans-grid mt-6">
        {planes.map(plan => (
          <div key={plan.id} className="card plan-card animate-fade">
            <div className="plan-header">
              <div>
                <h4>{plan.nombre_plan}</h4>
                <div className="plan-status">
                   {plan.activo ? 
                    <span className="badge badge-success">Activo</span> : 
                    <span className="badge badge-danger">Inactivo</span>
                   }
                </div>
              </div>
              <div className="plan-actions">
                <button className="btn-icon" onClick={() => handleOpenModal(plan)}><Edit size={18} /></button>
                <button className="btn-icon text-danger" onClick={() => handleDelete(plan.id)}><Trash2 size={18} /></button>
              </div>
            </div>
            
            <div className="plan-content">
              <div className="info-box">
                <div className="info-item">
                  <span>Interés</span>
                  <strong>{plan.tasa_interes}%</strong>
                </div>
                <div className="info-item">
                  <span>Frecuencia</span>
                  <strong className="capitalize">{plan.frecuencia_pago}</strong>
                </div>
                <div className="info-item">
                  <span>Cuotas</span>
                  <strong>{plan.num_cuotas}</strong>
                </div>
              </div>
              
              <div className="rango-box">
                <span>Rango Permitido</span>
                <p>{formatCurrency(plan.monto_minimo)} - {formatCurrency(plan.monto_maximo)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade">
            <div className="modal-header">
              <h3>{editingId ? 'Editar Plan' : 'Crear Nuevo Plan'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="mt-4">
              <div className="form-group">
                <label>Nombre del Producto</label>
                <input 
                  required 
                  type="text" 
                  value={formData.nombre_plan}
                  placeholder="Ej: Plan Microcrédito Express"
                  onChange={e => setFormData({...formData, nombre_plan: e.target.value})} 
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Tasa de Interés (%)</label>
                  <input 
                    required
                    type="number" 
                    step="0.01"
                    value={formData.tasa_interes}
                    onChange={e => setFormData({...formData, tasa_interes: Number(e.target.value)})} 
                  />
                </div>
                <div className="form-group">
                  <label>Número de Cuotas</label>
                  <input 
                    required
                    type="number" 
                    value={formData.num_cuotas}
                    onChange={e => setFormData({...formData, num_cuotas: Number(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Frecuencia de Pagos</label>
                <select 
                  value={formData.frecuencia_pago}
                  onChange={e => setFormData({...formData, frecuencia_pago: e.target.value})}
                >
                  <option value="semanal">Semanal</option>
                  <option value="quincenal">Quincenal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label>Monto Mínimo</label>
                  <input 
                    required
                    type="number" 
                    value={formData.monto_minimo}
                    onChange={e => setFormData({...formData, monto_minimo: Number(e.target.value)})} 
                  />
                </div>
                <div className="form-group">
                  <label>Monto Máximo</label>
                  <input 
                    required
                    type="number" 
                    value={formData.monto_maximo}
                    onChange={e => setFormData({...formData, monto_maximo: Number(e.target.value)})} 
                  />
                </div>
              </div>

              <div className="form-group flex-row">
                <input 
                  type="checkbox" 
                  checked={formData.activo} 
                  id="activo"
                  onChange={e => setFormData({...formData, activo: e.target.checked})} 
                />
                <label htmlFor="activo" className="mb-0">Plan Activo (disponible para nuevos préstamos)</label>
              </div>

              <div className="modal-actions mt-6">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  <Check size={18} />
                  {editingId ? 'Guardar Cambios' : 'Crear Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


    </Layout>
  );
};

export default Plans;

