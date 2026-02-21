import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { Search, UserPlus, Filter, MoreVertical, Phone, Mail, Edit, Trash } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Cliente {
  id: string;
  nombre: string;
  identificacion: string;
  telefono: string;
  email: string;
  estado: string;
  direccion: string;
}

const Clients = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newClient, setNewClient] = useState({
    nombre: '',
    identificacion: '',
    telefono: '',
    email: '',
    direccion: ''
  });
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    setLoading(true);
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
      const { data, error } = await supabase.from('clientes').insert([newClient]).select();
      if (error) throw error;
      if (data) {
        setClientes([...clientes, data[0]]);
      }
      setShowCreateModal(false);
      setNewClient({ nombre: '', identificacion: '', telefono: '', email: '', direccion: '' });
    } catch (error) {
      alert('Error al crear cliente');
    }
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    try {
      const { data, error } = await supabase
        .from('clientes')
        .update({ 
          nombre: editingClient.nombre,
          identificacion: editingClient.identificacion,
          telefono: editingClient.telefono,
          email: editingClient.email,
          direccion: editingClient.direccion
        })
        .eq('id', editingClient.id)
        .select();

      if (error) throw error;
      if (data) {
        setClientes(clientes.map(c => c.id === editingClient.id ? data[0] : c));
      }
      setShowEditModal(false);
      setEditingClient(null);
    } catch (error) {
      alert('Error al actualizar cliente');
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este cliente?')) {
      try {
        const { error } = await supabase.from('clientes').delete().eq('id', id);
        if (error) throw error;
        setClientes(clientes.filter(c => c.id !== id));
      } catch (error) {
        alert('Error al eliminar cliente');
      }
    }
    setActiveMenu(null);
  };

  const openEditModal = (cliente: Cliente) => {
    setEditingClient(cliente);
    setShowEditModal(true);
    setActiveMenu(null);
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
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          <UserPlus size={20} />
          <span className="btn-text">Nuevo Cliente</span>
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
              <div className="dropdown-container">
                <button className="btn-icon" onClick={() => setActiveMenu(activeMenu === cliente.id ? null : cliente.id)}>
                  <MoreVertical size={20} />
                </button>
                {activeMenu === cliente.id && (
                  <div className="dropdown-menu animate-fade">
                    <button onClick={() => openEditModal(cliente)}>
                      <Edit size={16}/> Editar
                    </button>
                    <button onClick={() => handleDeleteClient(cliente.id)} className="text-danger">
                      <Trash size={16}/> Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content animate-fade" onClick={e => e.stopPropagation()}>
            <h3>Registro de Cliente</h3>
            <form onSubmit={handleCreateClient}>
              <div className="form-group">
                <label>Nombre Completo</label>
                <input required type="text" value={newClient.nombre} onChange={e => setNewClient({...newClient, nombre: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Identificación</label>
                <input required type="text" value={newClient.identificacion} onChange={e => setNewClient({...newClient, identificacion: e.target.value})} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Teléfono</label>
                  <input type="tel" value={newClient.telefono} onChange={e => setNewClient({...newClient, telefono: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={newClient.email} onChange={e => setNewClient({...newClient, email: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Dirección</label>
                <input type="text" value={newClient.direccion} onChange={e => setNewClient({...newClient, direccion: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Registrar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingClient && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content animate-fade" onClick={e => e.stopPropagation()}>
            <h3>Editar Cliente</h3>
            <form onSubmit={handleUpdateClient}>
              <div className="form-group">
                <label>Nombre Completo</label>
                <input required type="text" value={editingClient.nombre} onChange={e => setEditingClient({...editingClient, nombre: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Identificación</label>
                <input required type="text" value={editingClient.identificacion} onChange={e => setEditingClient({...editingClient, identificacion: e.target.value})} />
              </div>
              <div className="grid-2">
                <div className="form-group">
                  <label>Teléfono</label>
                  <input type="tel" value={editingClient.telefono} onChange={e => setEditingClient({...editingClient, telefono: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={editingClient.email} onChange={e => setEditingClient({...editingClient, email: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Dirección</label>
                <input type="text" value={editingClient.direccion} onChange={e => setEditingClient({...editingClient, direccion: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn" onClick={() => setShowEditModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}


    </Layout>
  );
};

export default Clients;

