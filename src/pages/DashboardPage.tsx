import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../app/AuthProvider';
import { capabilityMatrix } from '../app/capabilities';
import { PageTitle } from '../components/PageTitle';
import { SectionCard } from '../components/SectionCard';
import { StatCard } from '../components/StatCard';
import { getHealth } from '../lib/api';
import { StatusBadge } from '../components/StatusBadge';

export function DashboardPage() {
  const { state, capabilities } = useAuth();
  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: getHealth,
  });

  const enabledCapabilities = Object.values(capabilityMatrix[state.role ?? 'PII_WRITE'] ?? capabilities).filter(Boolean).length;

  return (
    <div className="page-stack">
      <PageTitle
        eyebrow="Operations overview"
        title="Banking-style PII control dashboard"
        description="Monitor backend availability, confirm your role surface, and launch tightly-scoped vault actions."
      />

      <div className="stats-grid">
        <StatCard label="Signed-in role" value={state.label ?? 'Unknown'} tone="positive" />
        <StatCard label="Enabled action groups" value={String(enabledCapabilities)} />
        <StatCard label="Backend health" value={healthQuery.data?.status ?? (healthQuery.isLoading ? 'Checking…' : 'Unavailable')} tone={healthQuery.data?.status === 'UP' ? 'positive' : 'warning'} />
      </div>

      <div className="content-grid content-grid--2">
        <SectionCard title="Quick actions" subtitle="Only actions allowed for your selected role are shown.">
          <div className="quick-actions">
            <Link className="button button--primary" to="/vault">Open vault workspace</Link>
            {(capabilities.canCreateCustomer || capabilities.canReadCustomer) ? <Link className="button button--secondary" to="/customers">Open customer workspace</Link> : null}
            {capabilities.canReadAudit ? <Link className="button button--secondary" to="/audit">Review audit trail</Link> : null}
            {capabilities.canOperateVault ? <Link className="button button--secondary" to="/operations">Open operations</Link> : null}
          </div>
        </SectionCard>

        <SectionCard title="Availability" subtitle="The UI checks the backend health endpoint without credentials.">
          <div className="list-stack">
            <div className="inline-stat">
              <span className="muted">Spring Boot service health</span>
              <StatusBadge value={healthQuery.data?.status ?? 'Unknown'} tone={healthQuery.data?.status === 'UP' ? 'success' : 'danger'} />
            </div>
            <p className="muted">
              This frontend calls the backend using same-origin routes by default. In local development, Vite proxies `/api` and `/actuator`
              to the Spring Boot app so the browser does not hit CORS problems.
            </p>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Security design" subtitle="Frontend hardening choices used in this implementation.">
        <ul className="bullet-list">
          <li>Credentials are held in memory only and cleared on logout or full refresh.</li>
          <li>No HTML is injected into the DOM, and API errors are rendered as plain text.</li>
          <li>Every API call gets a fresh correlation ID and a request timeout.</li>
          <li>PII stays masked by default whenever a decrypted record is displayed.</li>
        </ul>
      </SectionCard>
    </div>
  );
}
