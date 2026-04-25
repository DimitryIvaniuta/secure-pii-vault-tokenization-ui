import { expect, test } from '@playwright/test';

async function mockHealth(page: import('@playwright/test').Page) {
  await page.route('**/actuator/health', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'UP' }),
    });
  });
}

async function login(page: import('@playwright/test').Page, roleLabel: string, username: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Operator role').selectOption({ label: roleLabel });
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Enter console' }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test('writer can sign in, see dashboard, and create a vault token', async ({ page }) => {
  await mockHealth(page);

  await page.route('**/api/v1/vault/tokens', async (route) => {
    const request = route.request();
    expect(request.method()).toBe('POST');
    expect(request.headers()['authorization']).toContain('Basic ');
    expect(request.headers()['x-idempotency-key']).toBe('idem-001');

    const body = request.postDataJSON() as { subjectRef: string; pii: { fullName: string } };
    expect(body.subjectRef).toBe('cust-001');
    expect(body.pii.fullName).toBe('Anna Nowak');

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'tok_123456',
        classification: 'CONFIDENTIAL',
        createdAt: '2026-04-18T12:00:00Z',
        idempotentReplay: false,
      }),
    });
  });

  await login(page, 'Vault writer', 'vault-writer', 'changeit-writer');
  await page.getByRole('link', { name: 'Open vault workspace' }).click();

  await page.getByLabel('Subject reference').fill('cust-001');
  await page.getByLabel('Full name').fill('Anna Nowak');
  await page.getByLabel('Email').fill('anna@example.com');
  await page.getByLabel('Phone number').fill('+48123456789');
  await page.getByLabel('National ID').fill('AB123456');
  await page.getByLabel('Address line 1').fill('Main Street 1');
  await page.getByLabel('Idempotency key').fill('idem-001');
  await page.getByRole('button', { name: 'Create token' }).click();

  await expect(page.getByText('Token created')).toBeVisible();
  await expect(page.getByText('tok_123456')).toBeVisible();
});

test('reader must provide break-glass justification before emergency resolve is sent', async ({ page }) => {
  await mockHealth(page);
  let requestCount = 0;

  await page.route('**/api/v1/vault/tokens/**', async (route) => {
    requestCount += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'tok_123456',
        classification: 'CONFIDENTIAL',
        subjectRef: 'cust-001',
        createdAt: '2026-04-18T12:00:00Z',
        pii: {
          fullName: 'Anna Nowak',
          email: 'anna@example.com',
          phoneNumber: '+48123456789',
          nationalId: 'AB123456',
          addressLine1: 'Main Street 1',
        },
      }),
    });
  });

  await login(page, 'Vault reader', 'vault-reader', 'changeit-reader');
  await page.getByRole('link', { name: 'Open vault workspace' }).click();
  await page.getByLabel('Token').first().fill('tok_123456');
  await page.getByLabel('Purpose of use').selectOption('break-glass-emergency');
  await page.getByRole('button', { name: 'Resolve token' }).click();

  await expect(page.getByText('Break-glass justification is required for emergency access.')).toBeVisible();
  expect(requestCount).toBe(0);
});

test('reader can resolve a vault token and sees masked PII first', async ({ page }) => {
  await mockHealth(page);

  await page.route('**/api/v1/vault/tokens/tok_123456', async (route) => {
    expect(route.request().headers()['x-purpose-of-use']).toBe('customer-support');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'tok_123456',
        classification: 'CONFIDENTIAL',
        subjectRef: 'cust-001',
        createdAt: '2026-04-18T12:00:00Z',
        lastAccessedAt: '2026-04-18T12:05:00Z',
        pii: {
          fullName: 'Anna Nowak',
          email: 'anna@example.com',
          phoneNumber: '+48123456789',
          nationalId: 'AB123456',
          addressLine1: 'Main Street 1',
          dateOfBirth: '1990-01-01',
        },
      }),
    });
  });

  await login(page, 'Vault reader', 'vault-reader', 'changeit-reader');
  await page.getByRole('link', { name: 'Open vault workspace' }).click();
  await page.getByLabel('Token').first().fill('tok_123456');
  await page.getByRole('button', { name: 'Resolve token' }).click();

  await expect(page.getByText('Decrypted record')).toBeVisible();
  await expect(page.getByText('An••••ak')).toBeVisible();
  await page.getByRole('button', { name: 'Reveal PII for 30s' }).click();
  await expect(page.getByText('Anna Nowak')).toBeVisible();
  await expect(page.getByText(/Auto-remasking in/)).toBeVisible();
});

test('token client can create and read a token-only customer record', async ({ page }) => {
  await mockHealth(page);

  await page.route('**/api/v1/customers', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '11111111-1111-1111-1111-111111111111',
          externalRef: 'bank-customer-77',
          piiToken: 'tok_123456',
          customerStatus: 'ACTIVE',
          createdAt: '2026-04-18T12:00:00Z',
        }),
      });
      return;
    }
    await route.fallback();
  });

  await page.route('**/api/v1/customers/11111111-1111-1111-1111-111111111111', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: '11111111-1111-1111-1111-111111111111',
        externalRef: 'bank-customer-77',
        piiToken: 'tok_123456',
        customerStatus: 'ACTIVE',
        createdAt: '2026-04-18T12:00:00Z',
      }),
    });
  });

  await login(page, 'Token client', 'token-client', 'changeit-client');
  await page.getByRole('link', { name: 'Customers' }).click();
  await page.getByLabel('External reference').fill('bank-customer-77');
  await page.getByLabel('PII token').fill('tok_123456');
  await page.getByRole('button', { name: 'Create customer' }).click();
  await expect(page.getByText('Customer created')).toBeVisible();
  await page.getByRole('button', { name: 'Get customer' }).click();
  await expect(page.getByText('Customer profile')).toBeVisible();
  await expect(page.getByText('tok_123456')).toBeVisible();
});

test('auditor can verify audit integrity and operations can inspect keys', async ({ browser }) => {
  const auditPage = await browser.newPage();
  await mockHealth(auditPage);
  await auditPage.route('**/api/v1/audit/verify', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        checkedEvents: 7,
        validEvents: 7,
        invalidEvents: 0,
        invalidEventIds: [],
      }),
    });
  });

  await login(auditPage, 'Vault auditor', 'vault-auditor', 'changeit-auditor');
  await auditPage.getByRole('link', { name: 'Audit' }).click();
  await auditPage.getByRole('button', { name: 'Verify all events' }).click();
  await expect(auditPage.getByText('Verification result')).toBeVisible();
  await expect(auditPage.getByText('7')).toBeVisible();
  await auditPage.close();

  const opsPage = await browser.newPage();
  await mockHealth(opsPage);
  await opsPage.route('**/api/v1/vault/admin/keys', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        activeKeyId: 'k2',
        availableKeyIds: ['k1', 'k2'],
        keyLengthsBits: { k1: 256, k2: 256 },
        envelopeEncryption: true,
      }),
    });
  });

  await login(opsPage, 'Operations', 'vault-ops', 'changeit-ops');
  await opsPage.getByRole('link', { name: 'Operations' }).click();
  await expect(opsPage.getByText('k2')).toBeVisible();
  await expect(opsPage.getByText('k1, k2')).toBeVisible();
  await opsPage.close();
});
