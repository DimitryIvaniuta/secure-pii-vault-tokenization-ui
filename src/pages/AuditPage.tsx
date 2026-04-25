import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '../app/AuthProvider';
import type { AuditEventResponse, AuditVerificationResponse } from '../app/types';
import { EmptyState } from '../components/EmptyState';
import { Field } from '../components/Field';
import { JsonBlock } from '../components/JsonBlock';
import { PageTitle } from '../components/PageTitle';
import { ResultCallout } from '../components/ResultCallout';
import { SectionCard } from '../components/SectionCard';
import { StatusBadge } from '../components/StatusBadge';
import { listAuditEvents, listAuditEventsByToken, verifyAudit, verifyAuditByToken } from '../lib/api';
import { formatDateTime } from '../lib/date';
import { toUserMessage } from '../lib/errors';

const tokenSchema = z.object({
  token: z.string().min(2, 'Token is required'),
});

type TokenFormValues = z.infer<typeof tokenSchema>;

function AuditTable({ rows }: { rows: AuditEventResponse[] }) {
  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Created</th>
            <th>Event</th>
            <th>Outcome</th>
            <th>Actor</th>
            <th>Purpose</th>
            <th>Token</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{formatDateTime(row.createdAt)}</td>
              <td>{row.eventType}</td>
              <td><StatusBadge value={row.outcome} tone={row.outcome === 'SUCCESS' ? 'success' : 'danger'} /></td>
              <td>{row.actor}</td>
              <td>{row.purpose || '—'}</td>
              <td>{row.token || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuditVerificationPanel({ result }: { result: AuditVerificationResponse }) {
  return (
    <ResultCallout title="Verification result">
      <dl className="definition-list">
        <div><dt>Checked events</dt><dd>{result.checkedEvents}</dd></div>
        <div><dt>Valid signatures</dt><dd>{result.validEvents}</dd></div>
        <div><dt>Invalid signatures</dt><dd>{result.invalidEvents}</dd></div>
      </dl>
      {result.invalidEventIds.length > 0 ? <JsonBlock data={result.invalidEventIds} /> : null}
    </ResultCallout>
  );
}

export function AuditPage() {
  const { state, capabilities } = useAuth();
  const credentials = state.credentials;
  const tokenForm = useForm<TokenFormValues>({ resolver: zodResolver(tokenSchema) });

  const allEventsMutation = useMutation<AuditEventResponse[], Error>({
    mutationFn: async () => listAuditEvents(credentials!),
  });
  const tokenEventsMutation = useMutation<AuditEventResponse[], Error, TokenFormValues>({
    mutationFn: async ({ token }) => listAuditEventsByToken(credentials!, token),
  });
  const verifyAllMutation = useMutation<AuditVerificationResponse, Error>({
    mutationFn: async () => verifyAudit(credentials!),
  });
  const verifyTokenMutation = useMutation<AuditVerificationResponse, Error, TokenFormValues>({
    mutationFn: async ({ token }) => verifyAuditByToken(credentials!, token),
  });

  if (!capabilities.canReadAudit) {
    return <EmptyState title="Audit access unavailable" description="Sign in with the vault auditor role to inspect audit data." />;
  }

  return (
    <div className="page-stack">
      <PageTitle
        eyebrow="Audit workspace"
        title="Review and verify signed audit records"
        description="Query all events, isolate one token, and verify audit integrity against persisted signatures."
      />

      <div className="content-grid content-grid--2">
        <SectionCard title="Audit event queries" subtitle="Load recent events for the whole platform or a single token.">
          <div className="inline-actions inline-actions--stretch">
            <button className="button button--primary" type="button" onClick={() => allEventsMutation.mutate()} disabled={allEventsMutation.isPending}>Load all events</button>
          </div>
          <form className="form-grid" onSubmit={tokenForm.handleSubmit((values) => tokenEventsMutation.mutate(values))}>
            <Field label="Token" error={tokenForm.formState.errors.token?.message}>
              <input {...tokenForm.register('token')} />
            </Field>
            <button className="button button--secondary" type="submit" disabled={tokenEventsMutation.isPending}>Load events by token</button>
          </form>
          {allEventsMutation.isError ? <p className="error-banner">{toUserMessage(allEventsMutation.error)}</p> : null}
          {tokenEventsMutation.isError ? <p className="error-banner">{toUserMessage(tokenEventsMutation.error)}</p> : null}
          {allEventsMutation.data ? <AuditTable rows={allEventsMutation.data} /> : null}
          {tokenEventsMutation.data ? <AuditTable rows={tokenEventsMutation.data} /> : null}
        </SectionCard>

        <SectionCard title="Audit verification" subtitle="Verify HMAC signatures for all events or for one token only.">
          <div className="inline-actions inline-actions--stretch">
            <button className="button button--primary" type="button" onClick={() => verifyAllMutation.mutate()} disabled={verifyAllMutation.isPending}>Verify all events</button>
          </div>
          <form className="form-grid" onSubmit={tokenForm.handleSubmit((values) => verifyTokenMutation.mutate(values))}>
            <Field label="Token" error={tokenForm.formState.errors.token?.message}>
              <input {...tokenForm.register('token')} />
            </Field>
            <button className="button button--secondary" type="submit" disabled={verifyTokenMutation.isPending}>Verify by token</button>
          </form>
          {verifyAllMutation.isError ? <p className="error-banner">{toUserMessage(verifyAllMutation.error)}</p> : null}
          {verifyTokenMutation.isError ? <p className="error-banner">{toUserMessage(verifyTokenMutation.error)}</p> : null}
          {verifyAllMutation.data ? <AuditVerificationPanel result={verifyAllMutation.data} /> : null}
          {verifyTokenMutation.data ? <AuditVerificationPanel result={verifyTokenMutation.data} /> : null}
        </SectionCard>
      </div>
    </div>
  );
}
