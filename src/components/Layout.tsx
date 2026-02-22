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
  X,
  Sliders,
  LayoutDashboard,
  ChevronRight,
  Bell,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title, subtitle }) => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="app-shell">
      {/* HEADER */}
      <header className="app-header">
        <div className="app-header-left">
          <button onClick={toggleSidebar} className="header-menu-btn" aria-label="Abrir menú">
            <span className="menu-icon">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
          <div className="header-brand">
            <div className="header-logo">P</div>
            <span className="header-brand-name">PrestaYa</span>
          </div>
        </div>
        <div className="app-header-right">
          <button className="header-action-btn" aria-label="Notificaciones">
            <Bell size={18} />
            <span className="notif-dot"></span>
          </button>
          <button onClick={handleLogout} className="header-logout-btn" title="Cerrar sesión">
            <LogOut size={17} />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* SIDEBAR OVERLAY */}
      <div 
        className={`sidebar-backdrop ${isSidebarOpen ? 'visible' : ''}`} 
        onClick={toggleSidebar}
        aria-hidden="true"
      />

      {/* SIDEBAR */}
      <aside className={`app-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <div className="sidebar-brand">
            <div className="sidebar-logo">P</div>
            <div>
              <div className="sidebar-brand-name">PrestaYa</div>
              <div className="sidebar-brand-tag">Sistema de Cartera</div>
            </div>
          </div>
          <button onClick={toggleSidebar} className="sidebar-close-btn" aria-label="Cerrar menú">
            <X size={20} />
          </button>
        </div>

        {/* PERFIL DE USUARIO EN SIDEBAR */}
        <div className="sidebar-user-profile">
          <div className="user-avatar-small">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <span className="user-email">{user?.email}</span>
            <span className={`user-role-tag ${profile?.rol}`}>
              {profile?.rol === 'admin' ? 'Administrador' : 'Cobrador'}
            </span>
          </div>
        </div>

        <div className="sidebar-body">
          <nav className="sidebar-nav">
            <div className="sidebar-section-label">Principal</div>
            <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={toggleSidebar}>
              <div className="sidebar-link-icon"><LayoutDashboard size={18} /></div>
              <span>Dashboard</span>
              <ChevronRight size={15} className="sidebar-link-arrow" />
            </NavLink>
            <NavLink to="/clientes" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={toggleSidebar}>
              <div className="sidebar-link-icon"><Users size={18} /></div>
              <span>Clientes</span>
              <ChevronRight size={15} className="sidebar-link-arrow" />
            </NavLink>
            <NavLink to="/prestamos" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={toggleSidebar}>
              <div className="sidebar-link-icon"><CreditCard size={18} /></div>
              <span>Préstamos</span>
              <ChevronRight size={15} className="sidebar-link-arrow" />
            </NavLink>
            <NavLink to="/reportes" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={toggleSidebar}>
              <div className="sidebar-link-icon"><PieChart size={18} /></div>
              <span>Reportes</span>
              <ChevronRight size={15} className="sidebar-link-arrow" />
            </NavLink>

            {profile?.rol === 'admin' && (
              <>
                <div className="sidebar-section-label" style={{ marginTop: '16px' }}>Administración</div>
                <NavLink to="/usuarios" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={toggleSidebar}>
                  <div className="sidebar-link-icon"><UserPlus size={18} /></div>
                  <span>Gestión de Usuarios</span>
                  <ChevronRight size={15} className="sidebar-link-arrow" />
                </NavLink>
                <div className="sidebar-section-label" style={{ marginTop: '16px' }}>Configuración</div>
                <NavLink to="/planes" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={toggleSidebar}>
                  <div className="sidebar-link-icon"><Sliders size={18} /></div>
                  <span>Planes de Préstamo</span>
                  <ChevronRight size={15} className="sidebar-link-arrow" />
                </NavLink>
                <NavLink to="/configuracion" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={toggleSidebar}>
                  <div className="sidebar-link-icon"><Settings size={18} /></div>
                  <span>Ajustes</span>
                  <ChevronRight size={15} className="sidebar-link-arrow" />
                </NavLink>
              </>
            )}
          </nav>
        </div>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="sidebar-logout-btn">
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* CONTENIDO */}
      <main className="app-main animate-fade">
        <div className="page-header">
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {children}
      </main>

      {/* BOTTOM NAV */}
      <nav className="bottom-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Home size={22} />
          <span>Inicio</span>
        </NavLink>
        <NavLink
          to="/clientes"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <Users size={22} />
          <span>Clientes</span>
        </NavLink>
        <NavLink to="/nuevo-prestamo" className="nav-fab-link">
          <div className="nav-fab">
            <PlusCircle size={26} />
          </div>
        </NavLink>
        <NavLink
          to="/prestamos"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <CreditCard size={22} />
          <span>Préstamos</span>
        </NavLink>
        <NavLink
          to="/reportes"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <PieChart size={22} />
          <span>Informes</span>
        </NavLink>
      </nav>

      <style>{`
        /* ========================
           APP SHELL
        ======================== */
        .app-shell {
          min-height: 100vh;
          background: var(--bg-app);
        }

        /* ========================
           HEADER
        ======================== */
        .app-header {
          position: sticky;
          top: 0;
          z-index: 500;
          height: var(--header-height);
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
        }

        .app-header-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .app-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-menu-btn {
          background: transparent;
          border: none;
          padding: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: var(--transition);
        }

        .header-menu-btn:hover {
          background: var(--bg-surface);
        }

        .menu-icon {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 20px;
        }

        .menu-icon span {
          display: block;
          height: 2px;
          background: var(--secondary);
          border-radius: 2px;
          transition: var(--transition);
        }

        .menu-icon span:nth-child(1) { width: 20px; }
        .menu-icon span:nth-child(2) { width: 14px; }
        .menu-icon span:nth-child(3) { width: 17px; }

        .header-brand {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .header-logo {
          width: 30px;
          height: 30px;
          background: var(--secondary);
          color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
          flex-shrink: 0;
        }

        .header-brand-name {
          font-weight: 800;
          font-size: 16px;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .header-action-btn {
          position: relative;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          cursor: pointer;
          transition: var(--transition);
        }

        .header-action-btn:hover {
          background: var(--bg-app);
          color: var(--text-primary);
        }

        .notif-dot {
          position: absolute;
          top: 7px;
          right: 7px;
          width: 7px;
          height: 7px;
          background: var(--danger);
          border-radius: 50%;
          border: 1.5px solid white;
        }

        .header-logout-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-surface);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }

        .header-logout-btn:hover {
          background: var(--danger-light);
          border-color: #fecaca;
          color: var(--danger);
        }

        /* ========================
           SIDEBAR
        ======================== */
        .sidebar-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          z-index: 998;
          opacity: 0;
          visibility: hidden;
          transition: var(--transition-slow);
        }

        .sidebar-backdrop.visible {
          opacity: 1;
          visibility: visible;
        }

        .app-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          width: 288px;
          background: white;
          z-index: 999;
          display: flex;
          flex-direction: column;
          transform: translateX(-100%);
          transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 4px 0 32px rgba(0,0,0,0.08);
        }

        .app-sidebar.open {
          transform: translateX(0);
        }

        .sidebar-top {
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-light);
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .sidebar-logo {
          width: 38px;
          height: 38px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 16px;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
          flex-shrink: 0;
        }

        .sidebar-brand-name {
          font-weight: 800;
          font-size: 16px;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        .sidebar-brand-tag {
          font-size: 11px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .sidebar-close-btn {
          background: var(--bg-surface);
          border: none;
          color: var(--text-secondary);
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition);
        }

        .sidebar-close-btn:hover {
          background: var(--border);
          color: var(--text-primary);
        }

        .sidebar-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .sidebar-section-label {
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
          padding: 8px 12px 6px;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 12px;
          color: var(--text-secondary);
          border-radius: 10px;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          transition: var(--transition);
          cursor: pointer;
          border: none;
          background: transparent;
          width: 100%;
          text-align: left;
        }

        .sidebar-link:hover {
          background: var(--bg-surface);
          color: var(--text-primary);
        }

        .sidebar-link.active {
          background: var(--secondary-light);
          color: var(--secondary);
          font-weight: 600;
        }

        .sidebar-link.active .sidebar-link-icon {
          background: var(--secondary-mid);
          color: var(--secondary);
        }

        .sidebar-link-icon {
          width: 32px;
          height: 32px;
          background: var(--bg-surface);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: var(--text-muted);
          transition: var(--transition);
        }

        .sidebar-link:hover .sidebar-link-icon {
          background: var(--border);
          color: var(--text-secondary);
        }

        .sidebar-link-arrow {
          margin-left: auto;
          color: var(--text-muted);
          opacity: 0.5;
        }

        .sidebar-footer {
          padding: 16px;
          border-top: 1px solid var(--border-light);
        }

        .sidebar-logout-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          background: var(--danger-light);
          border: 1.5px solid #fecaca;
          color: var(--danger);
          border-radius: 10px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          width: 100%;
          transition: var(--transition);
        }

        .sidebar-logout-btn:hover {
          background: #fee2e2;
        }

        /* ========================
           MAIN CONTENT
        ======================== */
        .app-main {
          padding: 24px 20px;
          max-width: 860px;
          margin: 0 auto;
          padding-bottom: calc(var(--nav-height) + 24px);
        }

        .page-header {
          margin-bottom: 22px;
        }

        .page-title {
          font-size: 22px;
          font-weight: 800;
          color: var(--text-primary);
          letter-spacing: -0.03em;
          margin: 0;
        }

        .page-subtitle {
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 3px;
        }

        /* ========================
           BOTTOM NAV
        ======================== */
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 100%;
          max-width: 520px;
          height: var(--nav-height);
          background: rgba(255, 255, 255, 0.97);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-top: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-around;
          padding: 0 8px;
          padding-bottom: env(safe-area-inset-bottom, 0px);
          z-index: 400;
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-decoration: none;
          color: var(--text-muted);
          font-size: 10.5px;
          font-weight: 500;
          gap: 3px;
          padding: 8px 14px;
          border-radius: 12px;
          transition: var(--transition);
          flex: 1;
        }

        .nav-item:hover {
          color: var(--secondary);
          background: var(--secondary-light);
        }

        .nav-item.active {
          color: var(--secondary);
          font-weight: 700;
        }

        .nav-item.active svg {
          stroke-width: 2.5px;
        }

        .nav-fab-link {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          top: -16px;
          flex-shrink: 0;
        }

        .nav-fab {
          width: 58px;
          height: 58px;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.4);
          transition: var(--transition);
        }

        .nav-fab-link:hover .nav-fab {
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 8px 28px rgba(37, 99, 235, 0.5);
        }

        .nav-fab-link:active .nav-fab {
          transform: scale(0.93);
        }

        .sidebar-user-profile {
          margin: 16px;
          padding: 16px;
          background: var(--bg-surface);
          border-radius: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid var(--border-light);
        }

        .user-avatar-small {
          width: 36px;
          height: 36px;
          background: var(--primary);
          color: white;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .user-email {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* ========================
           RESPONSIVE
        ======================== */
        @media (min-width: 768px) {
          .app-main {
            padding: 32px 32px;
            padding-bottom: calc(var(--nav-height) + 32px);
          }

          .bottom-nav {
            max-width: 1100px;
            border-radius: 20px 20px 0 0;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.06);
          }

          .page-title {
            font-size: 26px;
          }
        }

        @media (max-width: 380px) {
          .header-logout-btn span {
            display: none;
          }
          .nav-item {
            padding: 8px 10px;
          }
      `}</style>
    </div>
  );
};

export default Layout;
