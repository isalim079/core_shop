import { strict as assert } from 'node:assert';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { createUploadMetadata } from '../src/files/file-policy';

test('upload reservations use opaque keys within their ownership scope', () => {
  const userId = randomUUID();
  const first = createUploadMetadata({ userId }, 'USER_AVATAR', 'image/jpeg', 1024);
  const second = createUploadMetadata({ userId }, 'USER_AVATAR', 'image/jpeg', 1024);
  assert.ok(first.objectKey.startsWith(`users/${userId}/`));
  assert.notEqual(first.objectKey, second.objectKey);
  assert.equal(first.expectedBytes, 1024n);
  const organizationId = randomUUID();
  assert.ok(createUploadMetadata({ organizationId }, 'ORGANIZATION_LOGO', 'image/png', 1024)
    .objectKey.startsWith(`organizations/${organizationId}/`));
});

test('upload metadata rejects wrong scopes, executable formats, oversized and invalid sizes', () => {
  const userId = randomUUID();
  const organizationId = randomUUID();
  assert.throws(() => createUploadMetadata({ userId }, 'ORGANIZATION_LOGO', 'image/png', 100));
  assert.throws(() => createUploadMetadata({ organizationId }, 'USER_AVATAR', 'image/png', 100));
  for (const mime of ['image/svg+xml', 'text/html', 'application/pdf']) {
    assert.throws(() => createUploadMetadata({ userId }, 'USER_AVATAR', mime, 100));
  }
  for (const bytes of [0, -1, 1.5, Number.NaN, 5 * 1024 * 1024 + 1]) {
    assert.throws(() => createUploadMetadata({ userId }, 'USER_AVATAR', 'image/png', bytes));
  }
  assert.doesNotThrow(() => createUploadMetadata({ organizationId }, 'DOCUMENT', 'application/pdf', 20 * 1024 * 1024));
});
