import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { capabilityMatrix, ROLE_PRESETS } from './capabilities';
import { appConfig } from './config';
import type { OperatorRole } from './types';
import type { BasicCredentials } from '../lib/http';

interface AuthState {
  isAuthenticated: boolean;
  role?: OperatorRole;
  label?: string;
  username?: string;
  credentials?: BasicCredentials;
  sessionExpiresAt?: number;
}

interface AuthContextValue {
  state: AuthState;
  capabilities: ReturnType<typeof getCapabilities>;
  sessionWarningVisible: boolean;
  remainingSessionSeconds: number;
  sessionMessage?: string;
  login: (payload: { role: OperatorRole; username: string; password: string }) => void;
  logout: () => void;
  clearSessionMessage: () => void;
}

function getCapabilities(role?: OperatorRole) {
  if (!role) {
    return {
      canCreateVault: false,
      canResolveVault: false,
      canDeleteVault: false,
      canReadAudit: false,
      canCreateCustomer: false,
      canReadCustomer: false,
      canResolveCustomerPii: false,
      canOperateVault: false,
    };
  }

  return capabilityMatrix[role];
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const activityEvents: Array<keyof WindowEventMap> = [
  'mousemove',
  'mousedown',
  'keydown',
  'touchstart',
  'focus',
  'scroll',
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ isAuthenticated: false });
  const [sessionMessage, setSessionMessage] = useState<string | undefined>();
  const [remainingSessionSeconds, setRemainingSessionSeconds] = useState(0);
  const sessionExpiresAtRef = useRef<number | undefined>(undefined);

  const logoutInternal = (message?: string) => {
    sessionExpiresAtRef.current = undefined;
    setRemainingSessionSeconds(0);
    setState({ isAuthenticated: false });
    setSessionMessage(message);
  };

  useEffect(() => {
    if (!state.isAuthenticated || !state.sessionExpiresAt) {
      return;
    }

    sessionExpiresAtRef.current = state.sessionExpiresAt;

    const markActivity = () => {
      const nextExpiry = Date.now() + appConfig.sessionIdleTimeoutMs;
      sessionExpiresAtRef.current = nextExpiry;
      setState((current) => (current.isAuthenticated
        ? {
            ...current,
            sessionExpiresAt: nextExpiry,
          }
        : current));
    };

    const interval = window.setInterval(() => {
      const expiry = sessionExpiresAtRef.current;
      if (!expiry) {
        return;
      }

      const msRemaining = expiry - Date.now();
      if (msRemaining <= 0) {
        logoutInternal('Session locked after inactivity. Sign in again.');
        return;
      }

      setRemainingSessionSeconds(Math.ceil(msRemaining / 1_000));
    }, 1_000);

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, markActivity, { passive: true });
    });

    return () => {
      window.clearInterval(interval);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markActivity);
      });
    };
  }, [state.isAuthenticated, state.sessionExpiresAt]);

  const value = useMemo<AuthContextValue>(() => ({
    state,
    capabilities: getCapabilities(state.role),
    sessionWarningVisible: Boolean(state.isAuthenticated && state.sessionExpiresAt && (state.sessionExpiresAt - Date.now()) <= appConfig.sessionWarningMs),
    remainingSessionSeconds,
    sessionMessage,
    login: ({ role, username, password }) => {
      const preset = ROLE_PRESETS.find((item) => item.role === role);
      const nextExpiry = Date.now() + appConfig.sessionIdleTimeoutMs;
      sessionExpiresAtRef.current = nextExpiry;
      setSessionMessage(undefined);
      setRemainingSessionSeconds(Math.ceil(appConfig.sessionIdleTimeoutMs / 1_000));
      setState({
        isAuthenticated: true,
        role,
        label: preset?.label ?? role,
        username,
        credentials: { username, password },
        sessionExpiresAt: nextExpiry,
      });
    },
    logout: () => logoutInternal(undefined),
    clearSessionMessage: () => setSessionMessage(undefined),
  }), [remainingSessionSeconds, sessionMessage, state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
