import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '../app/AuthProvider';
import type { CryptoKeyMetadataResponse, RewrapTokenResponse } from '../app/types';
import { EmptyState } from '../components/EmptyState';
import { Field } from '../components/Field';
import { PageTitle } from '../components/PageTitle';
import { ResultCallout } from '../components/ResultCallout';
import { SectionCard } from '../components/SectionCard';
import { getKeyMetadata, rewrapToken } from '../lib/api';
import { formatDateTime } from '../lib/date';
import { toUserMessage } from '../lib/errors';

const rewrapSchema = z.object({
  token: z.string().min(2, 'Token is required'),
});

type RewrapValues = z.infer<typeof rewrapSchema>;

function KeyMetadataPanel({ data }: { data: CryptoKeyMetadataResponse }) {
  return (
    <dl className="definition-list">
      <div><dt>Active key ID</dt><dd>{data.activeKeyId}</dd></div>
      <div><dt>Envelope encryption</dt><dd>{String(data.envelopeEncryption)}</dd></div>
      <div><dt>Available keys</dt><dd>{data.availableKeyIds.join(', ')}</dd></div>
      <div><dt>Key lengths</dt><dd>{Object.entries(data.keyLengthsBits).map(([key, value]) => `${key}: ${value} bit`).join(', ')}</dd></div>
    </dl>
  );
}

export function OperationsPage() {
  const { state, capabilities } = useAuth();
  const credentials = state.credentials;
  const form = useForm<RewrapValues>({ resolver: zodResolver(rewrapSchema) });
  const keyQuery = useQuery<CryptoKeyMetadataResponse, Error>({
    queryKey: ['operations', 'keys', credentials?.username],
    queryFn: async () => getKeyMetadata(credentials!),
    enabled: capabilities.canOperateVault,
  });
  const rewrapMutation = useMutation<RewrapTokenResponse, Error, RewrapValues>({
    mutationFn: async ({ token }) => rewrapToken(credentials!, token),
  });

  if (!capabilities.canOperateVault) {
    return <EmptyState title="Operations access unavailable" description="Sign in with the operations role to view key metadata and re-wrap tokens." />;
  }

  return (
    <div className="page-stack">
      <PageTitle
        eyebrow="Crypto operations"
        title="Review key metadata and re-wrap token payloads"
        description="Operations tooling is separated from routine read access and exposed only to the vault operations role."
      />

      <div className="content-grid content-grid--2">
        <SectionCard title="Key metadata" subtitle="Safe key-ring metadata returned by the backend.">
          {keyQuery.isLoading ? <p className="muted">Loading key metadata…</p> : null}
          {keyQuery.isError ? <p className="error-banner">{toUserMessage(keyQuery.error)}</p> : null}
          {keyQuery.data ? <KeyMetadataPanel data={keyQuery.data} /> : null}
        </SectionCard>

        <SectionCard title="Re-wrap token" subtitle="Moves a token payload to the current active wrapping key.">
          <form className="form-grid" onSubmit={form.handleSubmit((values) => rewrapMutation.mutate(values))}>
            <Field label="Token" error={form.formState.errors.token?.message}>
              <input {...form.register('token')} />
            </Field>
            <button className="button button--primary" type="submit" disabled={rewrapMutation.isPending}>Re-wrap token</button>
            {rewrapMutation.isError ? <p className="error-banner">{toUserMessage(rewrapMutation.error)}</p> : null}
          </form>

          {rewrapMutation.data ? (
            <ResultCallout title="Re-wrap completed">
              <dl className="definition-list">
                <div><dt>Token</dt><dd>{rewrapMutation.data.token}</dd></div>
                <div><dt>Previous key</dt><dd>{rewrapMutation.data.previousKeyId}</dd></div>
                <div><dt>Current key</dt><dd>{rewrapMutation.data.currentKeyId}</dd></div>
                <div><dt>Rewrapped at</dt><dd>{formatDateTime(rewrapMutation.data.rewrappedAt)}</dd></div>
              </dl>
            </ResultCallout>
          ) : null}
        </SectionCard>
      </div>
    </div>
  );
}
