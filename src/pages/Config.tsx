import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import { Save, RefreshCw } from 'lucide-react';

const Config = () => {
  const [settings, setSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('configuracion').select('*').order('clave');
    setSettings(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleUpdate = async (id: string, valor: string) => {
    const { error } = await supabase
      .from('configuracion')
      .update({ valor, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      throw error;
    }
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      for (const s of settings) {
        await handleUpdate(s.id, s.valor);
      }
      alert('Configuración guardada correctamente');
    } catch (e) {
      alert('Error al guardar algunos cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout title="Ajustes">Cargando...</Layout>;

  return (
    <Layout title="Configuración del Sistema">
      <div className="card animate-fade">
        <p className="text-secondary mb-6">Ajusta los parámetros generales de operación de tu negocio.</p>
        
        <div className="settings-list">
          {settings.map((s, idx) => (
            <div key={s.id} className="setting-item">
              <div className="setting-info">
                <strong>{s.clave.replace(/_/g, ' ').toUpperCase()}</strong>
                <p>{s.descripcion}</p>
              </div>
              <div className="setting-input">
                <input 
                  type="text" 
                  value={s.valor} 
                  onChange={e => {
                    const newSettings = [...settings];
                    newSettings[idx].valor = e.target.value;
                    setSettings(newSettings);
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <button 
          className="btn btn-primary w-full mt-8" 
          onClick={saveAll} 
          disabled={saving}
        >
          {saving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
          {saving ? 'Guardando...' : 'Guardar Cambios Globales'}
        </button>
      </div>

      <style>{`
        .settings-list {
          display: flex;
          flex-direction: column;
        }
        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 0;
          border-bottom: 1px solid var(--border);
          gap: 20px;
        }
        .setting-item:last-child { border-bottom: none; }
        .setting-info { flex: 1; }
        .setting-info strong { font-size: 0.9rem; color: var(--primary); }
        .setting-info p { font-size: 0.8rem; color: var(--text-secondary); margin-top: 4px; }
        .setting-input { width: 140px; }
        .mb-6 { margin-bottom: 24px; }
        .mt-8 { margin-top: 32px; }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 480px) {
          .setting-item { flex-direction: column; align-items: flex-start; gap: 10px; }
          .setting-input { width: 100%; }
        }
      `}</style>
    </Layout>
  );
};

export default Config;
