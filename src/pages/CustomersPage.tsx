import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '../app/AuthProvider';
import type { CustomerResponse, VaultTokenResponse } from '../app/types';
import { EmptyState } from '../components/EmptyState';
import { Field } from '../components/Field';
import { PageTitle } from '../components/PageTitle';
import { PiiViewer } from '../components/PiiViewer';
import { ResultCallout } from '../components/ResultCallout';
import { SectionCard } from '../components/SectionCard';
import { createCustomer, getCustomer, getCustomerPii } from '../lib/api';
import { formatDateTime } from '../lib/date';
import { toUserMessage } from '../lib/errors';

const createSchema = z.object({
  externalRef: z.string().min(2, 'External reference is required'),
  piiToken: z.string().min(2, 'PII token is required'),
  customerStatus: z.string().min(2, 'Customer status is required'),
});

const getSchema = z.object({
  customerId: z.string().uuid('Valid customer UUID is required'),
});

const resolveSchema = z.object({
  customerId: z.string().uuid('Valid customer UUID is required'),
  purpose: z.enum(['customer-support', 'fraud-investigation', 'regulatory-response', 'break-glass-emergency']),
  breakGlassJustification: z.string().trim().optional(),
}).superRefine((value, context) => {
  if (value.purpose === 'break-glass-emergency' && !value.breakGlassJustification) {
    context.addIssue({
      code: 'custom',
      path: ['breakGlassJustification'],
      message: 'Break-glass justification is required for emergency access.',
    });
  }
});

type CreateValues = z.infer<typeof createSchema>;
type LookupValues = z.infer<typeof getSchema>;
type ResolveValues = z.infer<typeof resolveSchema>;

export function CustomersPage() {
  const { state, capabilities } = useAuth();
  const credentials = state.credentials;
  const createForm = useForm<CreateValues>({ resolver: zodResolver(createSchema), defaultValues: { customerStatus: 'ACTIVE' } });
  const lookupForm = useForm<LookupValues>({ resolver: zodResolver(getSchema) });
  const resolveForm = useForm<ResolveValues>({ resolver: zodResolver(resolveSchema), defaultValues: { purpose: 'customer-support' } });

  const createMutation = useMutation<CustomerResponse, Error, CreateValues>({
    mutationFn: async (values) => createCustomer(credentials!, values),
    onSuccess: (data) => {
      lookupForm.setValue('customerId', data.id);
      resolveForm.setValue('customerId', data.id);
    },
  });

  const lookupMutation = useMutation<CustomerResponse, Error, LookupValues>({
    mutationFn: async (values) => getCustomer(credentials!, values.customerId),
  });

  const resolveMutation = useMutation<VaultTokenResponse, Error, ResolveValues>({
    mutationFn: async (values) => getCustomerPii(credentials!, values.customerId, values.purpose, values.breakGlassJustification || undefined),
  });

  return (
    <div className="page-stack">
      <PageTitle
        eyebrow="Downstream service workspace"
        title="Store token-only customer records"
        description="This module demonstrates that business services keep only token references, never raw PII fields."
      />

      <div className="content-grid content-grid--3">
        {capabilities.canCreateCustomer ? (
          <SectionCard title="Create customer" subtitle="Creates a downstream record using an existing vault token.">
            <form className="form-grid" onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}>
              <Field label="External reference" error={createForm.formState.errors.externalRef?.message}>
                <input {...createForm.register('externalRef')} />
              </Field>
              <Field label="PII token" error={createForm.formState.errors.piiToken?.message}>
                <input {...createForm.register('piiToken')} />
              </Field>
              <Field label="Customer status" error={createForm.formState.errors.customerStatus?.message}>
                <select {...createForm.register('customerStatus')}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="PENDING_REVIEW">PENDING_REVIEW</option>
                  <option value="LOCKED">LOCKED</option>
                </select>
              </Field>
              <button className="button button--primary" type="submit" disabled={createMutation.isPending}>Create customer</button>
              {createMutation.isError ? <p className="error-banner" role="alert">{toUserMessage(createMutation.error)}</p> : null}
            </form>

            {createMutation.data ? (
              <ResultCallout title="Customer created">
                <p><strong>Customer ID:</strong> {createMutation.data.id}</p>
                <p><strong>Stored token:</strong> {createMutation.data.piiToken}</p>
                <p><strong>Created:</strong> {formatDateTime(createMutation.data.createdAt)}</p>
              </ResultCallout>
            ) : null}
          </SectionCard>
        ) : null}

        {capabilities.canReadCustomer ? (
          <SectionCard title="Lookup customer" subtitle="Reads the token-only customer profile from the backend.">
            <form className="form-grid" onSubmit={lookupForm.handleSubmit((values) => lookupMutation.mutate(values))}>
              <Field label="Customer UUID" error={lookupForm.formState.errors.customerId?.message}>
                <input {...lookupForm.register('customerId')} />
              </Field>
              <button className="button button--secondary" type="submit" disabled={lookupMutation.isPending}>Get customer</button>
              {lookupMutation.isError ? <p className="error-banner" role="alert">{toUserMessage(lookupMutation.error)}</p> : null}
            </form>

            {lookupMutation.data ? (
              <ResultCallout title="Customer profile">
                <dl className="definition-list">
                  <div><dt>External ref</dt><dd>{lookupMutation.data.externalRef}</dd></div>
                  <div><dt>Status</dt><dd>{lookupMutation.data.customerStatus}</dd></div>
                  <div><dt>PII token</dt><dd>{lookupMutation.data.piiToken}</dd></div>
                  <div><dt>Created</dt><dd>{formatDateTime(lookupMutation.data.createdAt)}</dd></div>
                </dl>
              </ResultCallout>
            ) : null}
          </SectionCard>
        ) : null}

        {capabilities.canResolveCustomerPii ? (
          <SectionCard title="Resolve customer PII" subtitle="Reads the customer token, then resolves PII through the vault service.">
            <form className="form-grid" onSubmit={resolveForm.handleSubmit((values) => resolveMutation.mutate(values))}>
              <Field label="Customer UUID" error={resolveForm.formState.errors.customerId?.message}>
                <input {...resolveForm.register('customerId')} />
              </Field>
              <Field label="Purpose of use" error={resolveForm.formState.errors.purpose?.message}>
                <select {...resolveForm.register('purpose')}>
                  <option value="customer-support">customer-support</option>
                  <option value="fraud-investigation">fraud-investigation</option>
                  <option value="regulatory-response">regulatory-response</option>
                  <option value="break-glass-emergency">break-glass-emergency</option>
                </select>
              </Field>
              <Field label="Break-glass justification" error={resolveForm.formState.errors.breakGlassJustification?.message}>
                <textarea rows={3} {...resolveForm.register('breakGlassJustification')} />
              </Field>
              <button className="button button--primary" type="submit" disabled={resolveMutation.isPending}>Resolve customer PII</button>
              {resolveMutation.isError ? <p className="error-banner" role="alert">{toUserMessage(resolveMutation.error)}</p> : null}
            </form>

            {resolveMutation.data ? (
              <ResultCallout title="Resolved PII payload">
                <p><strong>Token:</strong> {resolveMutation.data.token}</p>
                <PiiViewer pii={resolveMutation.data.pii} />
              </ResultCallout>
            ) : null}
          </SectionCard>
        ) : null}
      </div>

      {!capabilities.canCreateCustomer && !capabilities.canReadCustomer && !capabilities.canResolveCustomerPii ? (
        <EmptyState title="Customer access unavailable" description="Your role does not include token-client or PII read capabilities." />
      ) : null}
    </div>
  );
}
