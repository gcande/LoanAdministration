import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  Users, 
  PlusCircle, 
  LogOut, 
  PieChart,
  CreditCard,
  Settings,
  Menu,
  X,
  Sliders
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="app-container">
      {/* HEADER PRINCIPAL */}
      <header className="header">
        <div className="header-left">
          <button onClick={toggleSidebar} className="btn-icon menu-trigger">
            <Menu size={24} />
          </button>
          <h1>{title}</h1>
        </div>
        <button onClick={handleLogout} className="btn-icon">
          <LogOut size={20} />
        </button>
      </header>

      {/* SIDEBAR PARA OPCIONES ADICIONALES */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'show' : ''}`} onClick={toggleSidebar}></div>
      <aside className={`sidebar-extra ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand">
            <div className="logo-box">P</div>
            <span>PrestaYa</span>
          </div>
          <button onClick={toggleSidebar} className="btn-icon">
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav-list">
          <div className="nav-group">
            <span>ADMINISTRACIÓN</span>
            <NavLink to="/planes" className="sidebar-link" onClick={toggleSidebar}>
              <Sliders size={20} />
              <span>Planes de Préstamo</span>
            </NavLink>
            <NavLink to="/configuracion" className="sidebar-link" onClick={toggleSidebar}>
              <Settings size={20} />
              <span>Ajustes del Sistema</span>
            </NavLink>
          </div>

          <div className="nav-group">
            <span>SISTEMA</span>
            <button onClick={handleLogout} className="sidebar-link text-danger">
              <LogOut size={20} />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="content animate-fade">
        {children}
      </main>

      {/* NAVEGACIÓN INFERIOR (MANTENIENDO EL DISEÑO ORIGINAL) */}
      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <Home size={24} />
          <span>Inicio</span>
        </NavLink>
        <NavLink to="/clientes" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <Users size={24} />
          <span>Clientes</span>
        </NavLink>
        <NavLink to="/nuevo-prestamo" className="nav-item-fab">
          <div className="fab">
            <PlusCircle size={32} />
          </div>
        </NavLink>
        <NavLink to="/prestamos" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <CreditCard size={24} />
          <span>Préstamos</span>
        </NavLink>
        <NavLink to="/reportes" className={({ isActive }) => isActive ? "nav-item active" : "nav-item"}>
          <PieChart size={24} />
          <span>Reportes</span>
        </NavLink>
      </nav>

      <style>{`
        .app-container {
          min-height: 100vh;
          background: var(--bg-light);
          padding-bottom: var(--nav-height);
        }

        .header {
          height: var(--header-height);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          background: var(--card-bg);
          position: sticky;
          top: 0;
          z-index: 100;
          border-bottom: 1px solid var(--border);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .header h1 {
          font-size: 1.15rem;
          margin: 0;
          font-weight: 700;
          color: var(--primary);
        }

        .btn-icon {
          background: transparent;
          color: var(--text-dark);
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .menu-trigger {
            color: var(--secondary);
        }

        .content {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }

        /* --- SIDEBAR EXTRA --- */
        .sidebar-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.4);
          z-index: 1000;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }
        .sidebar-overlay.show {
          opacity: 1;
          visibility: visible;
        }

        .sidebar-extra {
          position: fixed;
          top: 0;
          left: -280px;
          width: 280px;
          height: 100%;
          background: white;
          z-index: 1001;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          box-shadow: 10px 0 20px rgba(0,0,0,0.05);
        }

        .sidebar-extra.open {
          transform: translateX(280px);
        }

        .sidebar-header {
          padding: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border);
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 800;
          font-size: 1.2rem;
          color: var(--primary);
        }

        .logo-box {
          background: var(--secondary);
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
        }

        .sidebar-nav-list {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 25px;
        }

        .nav-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .nav-group span {
          font-size: 0.7rem;
          font-weight: 700;
          color: #94a3b8;
          letter-spacing: 1px;
          margin-bottom: 4px;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          text-decoration: none;
          color: var(--text-dark);
          border-radius: 10px;
          font-weight: 500;
          transition: background 0.2s;
        }

        .sidebar-link:hover {
          background: var(--bg-surface);
        }

        /* --- BOTTOM NAV --- */
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 500px;
          height: var(--nav-height);
          background: var(--card-bg);
          display: flex;
          justify-content: space-around;
          align-items: center;
          border-top: 1px solid var(--border);
          padding-bottom: env(safe-area-inset-bottom);
          z-index: 100;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-decoration: none;
          color: #94a3b8;
          font-size: 11px;
          gap: 4px;
        }

        .nav-item.active {
          color: var(--secondary);
        }

        .nav-item-fab {
          position: relative;
          top: -20px;
          text-decoration: none;
        }

        .fab {
          background: var(--secondary);
          color: white;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
          transition: transform 0.2s;
        }

        .fab:active {
          transform: scale(0.9);
        }

        @media (min-width: 768px) {
          .bottom-nav {
            max-width: 1000px;
            border-radius: 20px 20px 0 0;
          }
           .content {
            padding: 40px 20px;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;
