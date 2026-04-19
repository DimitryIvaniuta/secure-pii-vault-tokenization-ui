import type { OperatorRole } from './types';

export interface RolePreset {
  role: OperatorRole;
  label: string;
  username: string;
  description: string;
  capabilities: string[];
}

export const ROLE_PRESETS: RolePreset[] = [
  {
    role: 'PII_WRITE',
    label: 'Vault writer',
    username: 'vault-writer',
    description: 'Creates encrypted vault records and returns opaque tokens.',
    capabilities: ['Create vault token'],
  },
  {
    role: 'PII_READ',
    label: 'Vault reader',
    username: 'vault-reader',
    description: 'Resolves tokens for approved operational purposes.',
    capabilities: ['Resolve token', 'Resolve customer PII'],
  },
  {
    role: 'PII_DELETE',
    label: 'Privacy admin',
    username: 'privacy-admin',
    description: 'Handles GDPR erase requests and can also read vault payloads.',
    capabilities: ['Resolve token', 'Delete token'],
  },
  {
    role: 'AUDIT_READ',
    label: 'Vault auditor',
    username: 'vault-auditor',
    description: 'Reviews audit trails and verifies audit integrity.',
    capabilities: ['List audit events', 'Verify audit signatures'],
  },
  {
    role: 'TOKEN_CLIENT',
    label: 'Token client',
    username: 'token-client',
    description: 'Creates downstream customer records that store token references only.',
    capabilities: ['Create customer', 'Read customer'],
  },
  {
    role: 'PII_OPERATIONS',
    label: 'Operations',
    username: 'vault-ops',
    description: 'Reviews key metadata, re-wraps tokens, and can resolve vault records.',
    capabilities: ['Resolve token', 'View key metadata', 'Re-wrap token'],
  },
];

export const capabilityMatrix: Record<OperatorRole, {
  canCreateVault: boolean;
  canResolveVault: boolean;
  canDeleteVault: boolean;
  canReadAudit: boolean;
  canCreateCustomer: boolean;
  canReadCustomer: boolean;
  canResolveCustomerPii: boolean;
  canOperateVault: boolean;
}> = {
  PII_WRITE: {
    canCreateVault: true,
    canResolveVault: false,
    canDeleteVault: false,
    canReadAudit: false,
    canCreateCustomer: false,
    canReadCustomer: false,
    canResolveCustomerPii: false,
    canOperateVault: false,
  },
  PII_READ: {
    canCreateVault: false,
    canResolveVault: true,
    canDeleteVault: false,
    canReadAudit: false,
    canCreateCustomer: false,
    canReadCustomer: true,
    canResolveCustomerPii: true,
    canOperateVault: false,
  },
  PII_DELETE: {
    canCreateVault: false,
    canResolveVault: true,
    canDeleteVault: true,
    canReadAudit: false,
    canCreateCustomer: false,
    canReadCustomer: true,
    canResolveCustomerPii: true,
    canOperateVault: false,
  },
  AUDIT_READ: {
    canCreateVault: false,
    canResolveVault: false,
    canDeleteVault: false,
    canReadAudit: true,
    canCreateCustomer: false,
    canReadCustomer: false,
    canResolveCustomerPii: false,
    canOperateVault: false,
  },
  TOKEN_CLIENT: {
    canCreateVault: false,
    canResolveVault: false,
    canDeleteVault: false,
    canReadAudit: false,
    canCreateCustomer: true,
    canReadCustomer: true,
    canResolveCustomerPii: false,
    canOperateVault: false,
  },
  PII_OPERATIONS: {
    canCreateVault: false,
    canResolveVault: true,
    canDeleteVault: false,
    canReadAudit: false,
    canCreateCustomer: false,
    canReadCustomer: true,
    canResolveCustomerPii: true,
    canOperateVault: true,
  },
};
