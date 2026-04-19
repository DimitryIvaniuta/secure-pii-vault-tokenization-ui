import { NavLink } from 'react-router-dom';
import { useAuth } from '../app/AuthProvider';

const navigation = [
  { to: '/dashboard', label: 'Overview', check: () => true },
  { to: '/vault', label: 'Vault', check: (c: ReturnType<typeof useAuth>['capabilities']) => c.canCreateVault || c.canResolveVault || c.canDeleteVault },
  { to: '/customers', label: 'Customers', check: (c: ReturnType<typeof useAuth>['capabilities']) => c.canCreateCustomer || c.canReadCustomer || c.canResolveCustomerPii },
  { to: '/audit', label: 'Audit', check: (c: ReturnType<typeof useAuth>['capabilities']) => c.canReadAudit },
  { to: '/operations', label: 'Operations', check: (c: ReturnType<typeof useAuth>['capabilities']) => c.canOperateVault },
];

export function Sidebar() {
  const { capabilities } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__brand-mark">SV</span>
        <div>
          <strong>Secure Vault</strong>
          <p className="muted">PII control console</p>
        </div>
      </div>
      <nav className="sidebar__nav" aria-label="Main navigation">
        {navigation.filter((item) => item.check(capabilities)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-link${isActive ? ' nav-link--active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
