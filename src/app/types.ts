export type OperatorRole =
  | 'PII_WRITE'
  | 'PII_READ'
  | 'PII_DELETE'
  | 'AUDIT_READ'
  | 'TOKEN_CLIENT'
  | 'PII_OPERATIONS';

export type Classification = 'CONFIDENTIAL' | 'RESTRICTED';

export type ReadPurpose =
  | 'customer-support'
  | 'fraud-investigation'
  | 'regulatory-response'
  | 'break-glass-emergency';

export type DeletePurpose =
  | 'gdpr-delete-request'
  | 'gdpr-data-subject-request'
  | 'retention-expiry';

export interface PiiPayload {
  fullName: string;
  email: string;
  phoneNumber: string;
  nationalId: string;
  addressLine1: string;
  dateOfBirth?: string;
}

export interface CreateVaultTokenRequest {
  subjectRef: string;
  classification: Classification;
  pii: PiiPayload;
}

export interface CreateVaultTokenResponse {
  token: string;
  classification: Classification;
  createdAt: string;
  idempotentReplay: boolean;
}

export interface VaultTokenResponse {
  token: string;
  classification: Classification;
  subjectRef: string;
  pii: PiiPayload;
  createdAt: string;
  lastAccessedAt?: string;
}

export interface CreateCustomerRequest {
  externalRef: string;
  piiToken: string;
  customerStatus: string;
}

export interface CustomerResponse {
  id: string;
  externalRef: string;
  piiToken: string;
  customerStatus: string;
  createdAt: string;
}

export interface AuditEventResponse {
  id: string;
  eventType: string;
  outcome: string;
  token?: string;
  actor: string;
  actorRoles: string;
  purpose?: string;
  correlationId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface AuditVerificationResponse {
  checkedEvents: number;
  validEvents: number;
  invalidEvents: number;
  invalidEventIds: string[];
}

export interface CryptoKeyMetadataResponse {
  activeKeyId: string;
  availableKeyIds: string[];
  keyLengthsBits: Record<string, number>;
  envelopeEncryption: boolean;
}

export interface RewrapTokenResponse {
  token: string;
  previousKeyId: string;
  currentKeyId: string;
  rewrappedAt: string;
}

export interface HealthResponse {
  status: string;
}
