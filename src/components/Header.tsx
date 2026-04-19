import { useNavigate } from 'react-router-dom';
import { useAuth } from '../app/AuthProvider';
import { StatusBadge } from './StatusBadge';

function formatSessionCountdown(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function Header() {
  const navigate = useNavigate();
  const { state, logout, sessionWarningVisible, remainingSessionSeconds } = useAuth();

  return (
    <header className="header">
      <div>
        <p className="eyebrow">Banking-grade access surface</p>
        <strong className="header__title">Secure PII Vault Console</strong>
      </div>
      <div className="header__meta">
        {state.isAuthenticated ? (
          <span className={`session-pill${sessionWarningVisible ? ' session-pill--warning' : ''}`}>
            Session {formatSessionCountdown(remainingSessionSeconds)}
          </span>
        ) : null}
        <StatusBadge value={state.label ?? 'Guest'} tone="success" />
        <span className="muted">{state.username ?? 'Not signed in'}</span>
        <button
          type="button"
          className="button button--ghost"
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
