import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuth } from '../app/AuthProvider';
import type { CreateVaultTokenResponse, VaultTokenResponse } from '../app/types';
import { EmptyState } from '../components/EmptyState';
import { Field } from '../components/Field';
import { PageTitle } from '../components/PageTitle';
import { PiiViewer } from '../components/PiiViewer';
import { ResultCallout } from '../components/ResultCallout';
import { SectionCard } from '../components/SectionCard';
import { createVaultToken, deleteVaultToken, resolveVaultToken } from '../lib/api';
import { formatDateTime } from '../lib/date';
import { toUserMessage } from '../lib/errors';
import { safeCopy } from '../lib/security';

const createSchema = z.object({
  subjectRef: z.string().min(2, 'Subject reference is required'),
  classification: z.enum(['CONFIDENTIAL', 'RESTRICTED']),
  fullName: z.string().min(2, 'Full name is required'),
  email: z.email('Valid email is required'),
  phoneNumber: z.string().min(7, 'Phone number is required'),
  nationalId: z.string().min(2, 'National ID is required'),
  addressLine1: z.string().min(3, 'Address is required'),
  dateOfBirth: z.string().optional(),
  idempotencyKey: z.string().trim().optional(),
});

const resolveSchema = z.object({
  token: z.string().min(2, 'Token is required'),
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

const deleteSchema = z.object({
  token: z.string().min(2, 'Token is required'),
  purpose: z.enum(['gdpr-delete-request', 'gdpr-data-subject-request', 'retention-expiry']),
  breakGlassJustification: z.string().trim().optional(),
  confirmDelete: z.boolean().refine((value) => value === true, 'Deletion confirmation is required'),
});

type CreateValues = z.infer<typeof createSchema>;
type ResolveValues = z.infer<typeof resolveSchema>;
type DeleteValues = z.infer<typeof deleteSchema>;

export function VaultPage() {
  const { state, capabilities } = useAuth();
  const credentials = state.credentials;
  const createForm = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      classification: 'CONFIDENTIAL',
      dateOfBirth: '',
      idempotencyKey: '',
    },
  });
  const resolveForm = useForm<ResolveValues>({
    resolver: zodResolver(resolveSchema),
    defaultValues: { purpose: 'customer-support' },
  });
  const deleteForm = useForm<DeleteValues>({
    resolver: zodResolver(deleteSchema),
    defaultValues: { purpose: 'gdpr-delete-request', confirmDelete: false },
  });

  const createMutation = useMutation<CreateVaultTokenResponse, Error, CreateValues>({
    mutationFn: async (values) => createVaultToken(
      credentials!,
      {
        subjectRef: values.subjectRef,
        classification: values.classification,
        pii: {
          fullName: values.fullName,
          email: values.email,
          phoneNumber: values.phoneNumber,
          nationalId: values.nationalId,
          addressLine1: values.addressLine1,
          dateOfBirth: values.dateOfBirth || undefined,
        },
      },
      values.idempotencyKey || undefined,
    ),
  });

  const resolveMutation = useMutation<VaultTokenResponse, Error, ResolveValues>({
    mutationFn: async (values) => resolveVaultToken(credentials!, values.token, values.purpose, values.breakGlassJustification || undefined),
  });

  const deleteMutation = useMutation<void, Error, DeleteValues>({
    mutationFn: async (values) => deleteVaultToken(credentials!, values.token, values.purpose, values.breakGlassJustification || undefined),
  });

  return (
    <div className="page-stack">
      <PageTitle
        eyebrow="Vault workspace"
        title="Tokenize, resolve, and erase PII"
        description="Every form maps directly to the backend API and applies strict header validation before requests are sent."
      />

      <div className="content-grid content-grid--3">
        {capabilities.canCreateVault ? (
          <SectionCard title="Create vault token" subtitle="Store encrypted PII and receive an opaque token.">
            <form className="form-grid" onSubmit={createForm.handleSubmit((values) => createMutation.mutate(values))}>
              <Field label="Subject reference" error={createForm.formState.errors.subjectRef?.message}>
                <input {...createForm.register('subjectRef')} />
              </Field>
              <Field label="Classification" error={createForm.formState.errors.classification?.message}>
                <select {...createForm.register('classification')}>
                  <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                  <option value="RESTRICTED">RESTRICTED</option>
                </select>
              </Field>
              <Field label="Full name" error={createForm.formState.errors.fullName?.message}>
                <input {...createForm.register('fullName')} />
              </Field>
              <Field label="Email" error={createForm.formState.errors.email?.message}>
                <input type="email" {...createForm.register('email')} />
              </Field>
              <Field label="Phone number" error={createForm.formState.errors.phoneNumber?.message}>
                <input {...createForm.register('phoneNumber')} />
              </Field>
              <Field label="National ID" error={createForm.formState.errors.nationalId?.message}>
                <input {...createForm.register('nationalId')} />
              </Field>
              <Field label="Address line 1" error={createForm.formState.errors.addressLine1?.message}>
                <input {...createForm.register('addressLine1')} />
              </Field>
              <Field label="Date of birth" error={createForm.formState.errors.dateOfBirth?.message}>
                <input type="date" {...createForm.register('dateOfBirth')} />
              </Field>
              <Field label="Idempotency key" hint="Optional but recommended for safe retries." error={createForm.formState.errors.idempotencyKey?.message}>
                <input {...createForm.register('idempotencyKey')} />
              </Field>
              <button type="submit" className="button button--primary" disabled={createMutation.isPending}>Create token</button>
              {createMutation.isError ? <p className="error-banner" role="alert">{toUserMessage(createMutation.error)}</p> : null}
            </form>

            {createMutation.data ? (
              <ResultCallout title="Token created">
                <div className="list-stack">
                  <p><strong>Token:</strong> {createMutation.data.token}</p>
                  <p><strong>Classification:</strong> {createMutation.data.classification}</p>
                  <p><strong>Created:</strong> {formatDateTime(createMutation.data.createdAt)}</p>
                  <p><strong>Idempotent replay:</strong> {String(createMutation.data.idempotentReplay)}</p>
                  <div className="inline-actions">
                    <button
                      type="button"
                      className="button button--ghost"
                      onClick={async () => {
                        await safeCopy(createMutation.data.token);
                      }}
                    >
                      Copy token
                    </button>
                  </div>
                </div>
              </ResultCallout>
            ) : null}
          </SectionCard>
        ) : null}

        {capabilities.canResolveVault ? (
          <SectionCard title="Resolve vault token" subtitle="Requires a valid purpose-of-use header.">
            <form className="form-grid" onSubmit={resolveForm.handleSubmit((values) => resolveMutation.mutate(values))}>
              <Field label="Token" error={resolveForm.formState.errors.token?.message}>
                <input {...resolveForm.register('token')} />
              </Field>
              <Field label="Purpose of use" error={resolveForm.formState.errors.purpose?.message}>
                <select {...resolveForm.register('purpose')}>
                  <option value="customer-support">customer-support</option>
                  <option value="fraud-investigation">fraud-investigation</option>
                  <option value="regulatory-response">regulatory-response</option>
                  <option value="break-glass-emergency">break-glass-emergency</option>
                </select>
              </Field>
              <Field label="Break-glass justification" hint="Required by policy for break-glass-emergency." error={resolveForm.formState.errors.breakGlassJustification?.message}>
                <textarea rows={3} {...resolveForm.register('breakGlassJustification')} />
              </Field>
              <button type="submit" className="button button--primary" disabled={resolveMutation.isPending}>Resolve token</button>
              {resolveMutation.isError ? <p className="error-banner" role="alert">{toUserMessage(resolveMutation.error)}</p> : null}
            </form>

            {resolveMutation.data ? (
              <ResultCallout title="Decrypted record">
                <div className="list-stack">
                  <p><strong>Subject reference:</strong> {resolveMutation.data.subjectRef}</p>
                  <p><strong>Created:</strong> {formatDateTime(resolveMutation.data.createdAt)}</p>
                  <p><strong>Last accessed:</strong> {formatDateTime(resolveMutation.data.lastAccessedAt)}</p>
                  <PiiViewer pii={resolveMutation.data.pii} />
                </div>
              </ResultCallout>
            ) : null}
          </SectionCard>
        ) : null}

        {capabilities.canDeleteVault ? (
          <SectionCard title="GDPR delete token" subtitle="Deletion removes PII payload bytes while keeping the token audit trail.">
            <form className="form-grid" onSubmit={deleteForm.handleSubmit((values) => deleteMutation.mutate(values))}>
              <Field label="Token" error={deleteForm.formState.errors.token?.message}>
                <input {...deleteForm.register('token')} />
              </Field>
              <Field label="Delete purpose" error={deleteForm.formState.errors.purpose?.message}>
                <select {...deleteForm.register('purpose')}>
                  <option value="gdpr-delete-request">gdpr-delete-request</option>
                  <option value="gdpr-data-subject-request">gdpr-data-subject-request</option>
                  <option value="retention-expiry">retention-expiry</option>
                </select>
              </Field>
              <Field label="Additional notes">
                <textarea rows={3} {...deleteForm.register('breakGlassJustification')} />
              </Field>
              <label className="checkbox-field">
                <input type="checkbox" {...deleteForm.register('confirmDelete')} />
                <span>I confirm this erase request is authorized.</span>
              </label>
              {deleteForm.formState.errors.confirmDelete ? <p className="field__error">{deleteForm.formState.errors.confirmDelete.message}</p> : null}
              <button type="submit" className="button button--danger" disabled={deleteMutation.isPending}>Delete token payload</button>
              {deleteMutation.isError ? <p className="error-banner" role="alert">{toUserMessage(deleteMutation.error)}</p> : null}
            </form>

            {deleteMutation.isSuccess ? (
              <ResultCallout title="Delete completed">
                <p>The backend returned HTTP 204 and the PII payload is expected to be erased.</p>
              </ResultCallout>
            ) : null}
          </SectionCard>
        ) : null}
      </div>

      {!capabilities.canCreateVault && !capabilities.canResolveVault && !capabilities.canDeleteVault ? (
        <EmptyState title="Vault access unavailable" description="Your signed-in role does not include vault create, read, or delete permissions." />
      ) : null}
    </div>
  );
}
