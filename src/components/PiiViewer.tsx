import { useEffect, useMemo, useState } from 'react';
import { appConfig } from '../app/config';
import type { PiiPayload } from '../app/types';
import { maskEmail, maskValue } from '../lib/security';

interface PiiViewerProps {
  pii: PiiPayload;
}

export function PiiViewer({ pii }: PiiViewerProps) {
  const [revealed, setRevealed] = useState(false);
  const [remainingMs, setRemainingMs] = useState(appConfig.piiRevealWindowMs);

  useEffect(() => {
    if (!revealed) {
      setRemainingMs(appConfig.piiRevealWindowMs);
      return;
    }

    const expiresAt = Date.now() + appConfig.piiRevealWindowMs;
    const interval = window.setInterval(() => {
      const ms = expiresAt - Date.now();
      if (ms <= 0) {
        setRevealed(false);
        setRemainingMs(appConfig.piiRevealWindowMs);
        window.clearInterval(interval);
        return;
      }
      setRemainingMs(ms);
    }, 250);

    return () => window.clearInterval(interval);
  }, [revealed]);

  const remainingSeconds = useMemo(() => Math.max(1, Math.ceil(remainingMs / 1_000)), [remainingMs]);

  return (
    <div className="pii-viewer">
      <div className="pii-viewer__toolbar">
        <button type="button" className="button button--ghost" onClick={() => setRevealed((value) => !value)}>
          {revealed ? 'Mask PII now' : 'Reveal PII for 30s'}
        </button>
        <span className="muted">
          {revealed ? `Auto-remasking in ${remainingSeconds}s` : 'Masked by default to reduce screen exposure.'}
        </span>
      </div>
      <dl className="definition-list">
        <div>
          <dt>Full name</dt>
          <dd>{revealed ? pii.fullName : maskValue(pii.fullName)}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{revealed ? pii.email : maskEmail(pii.email)}</dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>{revealed ? pii.phoneNumber : maskValue(pii.phoneNumber)}</dd>
        </div>
        <div>
          <dt>National ID</dt>
          <dd>{revealed ? pii.nationalId : maskValue(pii.nationalId)}</dd>
        </div>
        <div>
          <dt>Address</dt>
          <dd>{revealed ? pii.addressLine1 : maskValue(pii.addressLine1)}</dd>
        </div>
        <div>
          <dt>Date of birth</dt>
          <dd>{revealed ? pii.dateOfBirth || '—' : maskValue(pii.dateOfBirth)}</dd>
        </div>
      </dl>
    </div>
  );
}
