import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Search, UserPlus, Filter, MoreVertical, Phone, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Cliente {
  id: string;
  nombre: string;
  identificacion: string;
  telefono: string;
  email: string;
  estado: string;
}

const Clients = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newClient, setNewClient] = useState({
    nombre: '',
    identificacion: '',
    telefono: '',
    email: '',
    direccion: ''
  });

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('nombre', { ascending: true });
      
      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('clientes').insert([newClient]);
      if (error) throw error;
      setShowModal(false);
      fetchClientes();
    } catch (error) {
      alert('Error al crear cliente');
    }
  };

  const filteredClientes = clientes.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.identificacion.includes(searchTerm)
  );

  return (
    <Layout title="Clientes">
      <div className="search-bar">
        <div className="search-input">
          <Search size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre o ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="btn-filter">
          <Filter size={20} />
        </button>
      </div>

      <div className="actions-header">
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <UserPlus size={20} />
          Nuevo Cliente
        </button>
        <p className="text-secondary">{filteredClientes.length} clientes encontrados</p>
      </div>

      <div className="clients-list">
        {loading ? (
          <p>Cargando...</p>
        ) : filteredClientes.map(cliente => (
          <div key={cliente.id} className="card client-card">
            <div className="client-avatar">
              {cliente.nombre.charAt(0)}
            </div>
            <div className="client-info">
              <h4>{cliente.nombre}</h4>
              <p className="text-secondary">CC: {cliente.identificacion}</p>
              <div className="client-quick-actions">
                <span><Phone size={14} /> {cliente.telefono}</span>
                <span><Mail size={14} /> {cliente.email}</span>
              </div>
            </div>
            <div className="client-status">
              <span className={`badge ${cliente.estado === 'activo' ? 'badge-success' : 'badge-danger'}`}>
                {cliente.estado}
              </span>
              <button className="btn-icon">
                <MoreVertical size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade">
            <h3>Registro de Cliente</h3>
            <form onSubmit={handleCreateClient}>
              <div className="form-group">
                <label>Nombre Completo</label>
                <input required type="text" onChange={e => setNewClient({...newClient, nombre: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Identificación</label>
                <input required type="text" onChange={e => setNewClient({...newClient, identificacion: e.target.value})} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Teléfono</label>
                  <input type="tel" onChange={e => setNewClient({...newClient, telefono: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" onChange={e => setNewClient({...newClient, email: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Dirección</label>
                <input type="text" onChange={e => setNewClient({...newClient, direccion: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .search-bar {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        .search-input {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          background: var(--card-bg);
          border-radius: var(--radius);
          padding: 0 16px;
          border: 1px solid var(--border);
        }

        .search-input input {
          border: none;
          background: transparent;
        }

        .btn-filter {
          background: var(--card-bg);
          border: 1px solid var(--border);
          padding: 12px;
          border-radius: var(--radius);
        }

        .actions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .client-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
        }

        .client-avatar {
          width: 48px;
          height: 48px;
          background: var(--primary);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 20px;
        }

        .client-info {
          flex: 1;
        }

        .client-quick-actions {
          display: flex;
          gap: 12px;
          margin-top: 4px;
          font-size: 12px;
          color: #64748b;
        }

        .client-quick-actions span {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .client-status {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 8px;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 2000;
        }

        .modal-content {
          background: var(--card-bg);
          width: 100%;
          max-width: 500px;
          padding: 24px;
          border-radius: var(--radius);
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 4px;
          font-size: 14px;
          color: #64748b;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }
      `}</style>
    </Layout>
  );
};

export default Clients;
