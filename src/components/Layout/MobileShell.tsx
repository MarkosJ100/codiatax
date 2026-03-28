import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Scroll, Wallet, Wrench, PlaneLanding, LogOut, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { format, es } from '../../utils/dateHelpers';
import Toast from '../Common/Toast';

import logo from '../../assets/logo.jpg';

const MobileShell: React.FC = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const currentDate = format(new Date(), "dd 'de' MMMM, yyyy", { locale: es });

  const navItems = [
    { to: '/', icon: Home, label: 'Inicio', end: true },
    { to: '/services', icon: PlusCircle, label: 'Servicios' },
    { to: '/history', icon: Scroll, label: 'Historico' },
    { to: '/expenses', icon: Wallet, label: 'Gastos' },
    { to: '/maintenance', icon: Wrench, label: 'Taller' },
    { to: '/invoicing', icon: FileText, label: 'Facturas' },
    { to: '/airport', icon: PlaneLanding, label: 'Aero' },
  ];

  return (
    <div className="app-shell">
      <aside className="web-sidebar glass">
        <div className="web-brand">
          <img src={logo} alt="Logo" className="web-logo" />
          <div>
            <h2 className="web-title">Codiatx Web</h2>
            <p className="web-subtitle">{user?.name || 'Conductor'}</p>
          </div>
        </div>

        <nav className="web-nav">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
              <span className="web-nav-icon">
                <Icon size={32} strokeWidth={2.05} />
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button onClick={logout} className="web-logout btn btn-ghost" type="button">
          <LogOut size={18} />
          <span>Cerrar sesion</span>
        </button>
      </aside>

      <header className="mobile-header glass">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img src={logo} alt="Logo" className="web-logo" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: '800', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
              {user?.name || 'Conductor'}
            </span>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: '600', marginTop: '2px' }}>
              {currentDate}
            </span>
          </div>
        </div>
        <button onClick={logout} className="mobile-logout" type="button">
          <LogOut size={18} />
        </button>
      </header>

      <main className="page-content web-content">
        <div key={location.pathname} className="page-fade-in" style={{ width: '100%' }}>
          <Outlet />
        </div>
      </main>

      <nav className="glass bottom-nav">
        {navItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}>
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <Toast />
    </div>
  );
};

export default MobileShell;
