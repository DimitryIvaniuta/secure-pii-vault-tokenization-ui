import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../app/AuthProvider';
import { ROLE_PRESETS } from '../app/capabilities';
import { appConfig } from '../app/config';
import { Field } from '../components/Field';

const loginSchema = z.object({
  role: z.enum(['PII_WRITE', 'PII_READ', 'PII_DELETE', 'AUDIT_READ', 'TOKEN_CLIENT', 'PII_OPERATIONS']),
  username: z.string().min(3, 'Username is required'),
  password: z.string().min(3, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { login, sessionMessage, clearSessionMessage } = useAuth();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: 'PII_WRITE',
      username: 'vault-writer',
      password: '',
    },
  });

  const selectedRole = form.watch('role');

  useEffect(() => {
    const preset = ROLE_PRESETS.find((item) => item.role === selectedRole);
    if (preset) {
      form.setValue('username', preset.username, { shouldValidate: true, shouldDirty: true });
    }
  }, [form, selectedRole]);

  return (
    <div className="login-page">
      <section className="login-page__hero">
        <p className="eyebrow">Secure banking operations console</p>
        <h1>Control tokenization, privacy access, and audit verification from one hardened workspace.</h1>
        <p className="muted">
          The UI is purpose-built for the Spring Boot vault backend: token creation, downstream customer flows, audit verification,
          and crypto operations.
        </p>
        <div className="hero-card-grid">
          {ROLE_PRESETS.map((preset) => (
            <article key={preset.role} className={`hero-card${selectedRole === preset.role ? ' hero-card--active' : ''}`}>
              <strong>{preset.label}</strong>
              <p className="muted">Default username: {preset.username}</p>
              <p className="muted">{preset.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="login-panel">
        <div className="section-card">
          <div className="section-card__header">
            <div>
              <h2>Sign in</h2>
              <p className="muted">Use one of the backend's local role accounts. Passwords remain in memory only.</p>
            </div>
          </div>

          {sessionMessage ? <p className="warning-banner" role="status">{sessionMessage}</p> : null}

          <form
            className="form-grid"
            onSubmit={form.handleSubmit((values) => {
              clearSessionMessage();
              login(values);
              navigate('/dashboard');
            })}
          >
            <Field label="Operator role" error={form.formState.errors.role?.message}>
              <select
                {...form.register('role')}
                aria-label="Operator role"
                onChange={(event) => {
                  clearSessionMessage();
                  form.setValue('role', event.target.value as LoginFormValues['role'], { shouldDirty: true, shouldValidate: true });
                }}
              >
                {ROLE_PRESETS.map((preset) => (
                  <option key={preset.role} value={preset.role}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Username" error={form.formState.errors.username?.message}>
              <input autoComplete="username" {...form.register('username', { onChange: () => clearSessionMessage() })} />
            </Field>

            <Field label="Password" error={form.formState.errors.password?.message}>
              <input type="password" autoComplete="current-password" {...form.register('password', { onChange: () => clearSessionMessage() })} />
            </Field>

            <button type="submit" className="button button--primary">Enter console</button>
          </form>

          <div className="login-panel__notes">
            <p className="muted">Idle timeout: {Math.round(appConfig.sessionIdleTimeoutMs / 60_000)} minutes.</p>
            <p className="muted">PII reveal window: {Math.round(appConfig.piiRevealWindowMs / 1_000)} seconds with automatic remasking.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
