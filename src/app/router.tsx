import type { ReactNode } from 'react';
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { AccessDenied } from '../components/AccessDenied';
import { useAuth } from './AuthProvider';
import { DashboardPage } from '../pages/DashboardPage';
import { LoginPage } from '../pages/LoginPage';
import { VaultPage } from '../pages/VaultPage';
import { CustomersPage } from '../pages/CustomersPage';
import { AuditPage } from '../pages/AuditPage';
import { OperationsPage } from '../pages/OperationsPage';
import { NotFoundPage } from '../pages/NotFoundPage';

function ProtectedLayout() {
  const { state } = useAuth();
  const location = useLocation();

  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <AppShell />;
}

function LoginGuard() {
  const { state } = useAuth();
  if (state.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <LoginPage />;
}

function AuthorizedRoute({
  allowed,
  title,
  description,
  children,
}: {
  allowed: boolean;
  title: string;
  description: string;
  children: ReactNode;
}) {
  if (!allowed) {
    return <AccessDenied title={title} description={description} />;
  }

  return children;
}

function VaultRoute() {
  const { capabilities } = useAuth();
  return (
    <AuthorizedRoute
      allowed={capabilities.canCreateVault || capabilities.canResolveVault || capabilities.canDeleteVault}
      title="Vault workspace is not available for this role."
      description="Use a role with vault write, read, or delete permissions to open tokenization workflows."
    >
      <VaultPage />
    </AuthorizedRoute>
  );
}

function CustomersRoute() {
  const { capabilities } = useAuth();
  return (
    <AuthorizedRoute
      allowed={capabilities.canCreateCustomer || capabilities.canReadCustomer || capabilities.canResolveCustomerPii}
      title="Customer workspace is not available for this role."
      description="Use a token-client, reader, delete, or operations role to open downstream customer workflows."
    >
      <CustomersPage />
    </AuthorizedRoute>
  );
}

function AuditRoute() {
  const { capabilities } = useAuth();
  return (
    <AuthorizedRoute
      allowed={capabilities.canReadAudit}
      title="Audit workspace is not available for this role."
      description="Use the vault auditor role to review signed audit records and verification results."
    >
      <AuditPage />
    </AuthorizedRoute>
  );
}

function OperationsRoute() {
  const { capabilities } = useAuth();
  return (
    <AuthorizedRoute
      allowed={capabilities.canOperateVault}
      title="Operations workspace is not available for this role."
      description="Use the operations role to inspect key metadata and re-wrap encrypted token payloads."
    >
      <OperationsPage />
    </AuthorizedRoute>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginGuard />,
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'vault', element: <VaultRoute /> },
      { path: 'customers', element: <CustomersRoute /> },
      { path: 'audit', element: <AuditRoute /> },
      { path: 'operations', element: <OperationsRoute /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
