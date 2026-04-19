import { apiRequest, type BasicCredentials } from './http';
import type {
  AuditEventResponse,
  AuditVerificationResponse,
  CreateCustomerRequest,
  CreateVaultTokenRequest,
  CreateVaultTokenResponse,
  CryptoKeyMetadataResponse,
  CustomerResponse,
  DeletePurpose,
  HealthResponse,
  ReadPurpose,
  RewrapTokenResponse,
  VaultTokenResponse,
} from '../app/types';

export function getHealth(): Promise<HealthResponse> {
  return apiRequest<HealthResponse>('/actuator/health');
}

export function createVaultToken(
  credentials: BasicCredentials,
  request: CreateVaultTokenRequest,
  idempotencyKey?: string,
): Promise<CreateVaultTokenResponse> {
  return apiRequest<CreateVaultTokenResponse>('/api/v1/vault/tokens', {
    method: 'POST',
    auth: credentials,
    body: request,
    headers: {
      'X-Idempotency-Key': idempotencyKey,
    },
  });
}

export function resolveVaultToken(
  credentials: BasicCredentials,
  token: string,
  purpose: ReadPurpose,
  breakGlassJustification?: string,
): Promise<VaultTokenResponse> {
  return apiRequest<VaultTokenResponse>(`/api/v1/vault/tokens/${encodeURIComponent(token)}`, {
    auth: credentials,
    headers: {
      'X-Purpose-Of-Use': purpose,
      'X-Break-Glass-Justification': breakGlassJustification,
    },
  });
}

export function deleteVaultToken(
  credentials: BasicCredentials,
  token: string,
  purpose: DeletePurpose,
  breakGlassJustification?: string,
): Promise<void> {
  return apiRequest<void>(`/api/v1/vault/tokens/${encodeURIComponent(token)}`, {
    method: 'DELETE',
    auth: credentials,
    headers: {
      'X-Purpose-Of-Use': purpose,
      'X-Break-Glass-Justification': breakGlassJustification,
    },
  });
}

export function createCustomer(
  credentials: BasicCredentials,
  request: CreateCustomerRequest,
): Promise<CustomerResponse> {
  return apiRequest<CustomerResponse>('/api/v1/customers', {
    method: 'POST',
    auth: credentials,
    body: request,
  });
}

export function getCustomer(
  credentials: BasicCredentials,
  customerId: string,
): Promise<CustomerResponse> {
  return apiRequest<CustomerResponse>(`/api/v1/customers/${encodeURIComponent(customerId)}`, {
    auth: credentials,
  });
}

export function getCustomerPii(
  credentials: BasicCredentials,
  customerId: string,
  purpose: ReadPurpose,
  breakGlassJustification?: string,
): Promise<VaultTokenResponse> {
  return apiRequest<VaultTokenResponse>(`/api/v1/customers/${encodeURIComponent(customerId)}/pii`, {
    auth: credentials,
    headers: {
      'X-Purpose-Of-Use': purpose,
      'X-Break-Glass-Justification': breakGlassJustification,
    },
  });
}

export function listAuditEvents(credentials: BasicCredentials): Promise<AuditEventResponse[]> {
  return apiRequest<AuditEventResponse[]>('/api/v1/audit/events', { auth: credentials });
}

export function listAuditEventsByToken(
  credentials: BasicCredentials,
  token: string,
): Promise<AuditEventResponse[]> {
  return apiRequest<AuditEventResponse[]>(`/api/v1/audit/events/${encodeURIComponent(token)}`, {
    auth: credentials,
  });
}

export function verifyAudit(credentials: BasicCredentials): Promise<AuditVerificationResponse> {
  return apiRequest<AuditVerificationResponse>('/api/v1/audit/verify', { auth: credentials });
}

export function verifyAuditByToken(
  credentials: BasicCredentials,
  token: string,
): Promise<AuditVerificationResponse> {
  return apiRequest<AuditVerificationResponse>(`/api/v1/audit/verify/${encodeURIComponent(token)}`, {
    auth: credentials,
  });
}

export function getKeyMetadata(credentials: BasicCredentials): Promise<CryptoKeyMetadataResponse> {
  return apiRequest<CryptoKeyMetadataResponse>('/api/v1/vault/admin/keys', { auth: credentials });
}

export function rewrapToken(
  credentials: BasicCredentials,
  token: string,
): Promise<RewrapTokenResponse> {
  return apiRequest<RewrapTokenResponse>(`/api/v1/vault/admin/tokens/${encodeURIComponent(token)}/rewrap`, {
    method: 'POST',
    auth: credentials,
  });
}
