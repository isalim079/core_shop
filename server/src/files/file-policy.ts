import { randomUUID } from 'node:crypto';
import { z } from 'zod';

const imageTypes = ['image/jpeg', 'image/png', 'image/webp'] as const;
const imagePolicy = (maxBytes: number) => ({ maxBytes, mimeTypes: [...imageTypes] as readonly string[] });
const attachmentPolicy = { maxBytes: 20 * 1024 * 1024, mimeTypes: [...imageTypes, 'application/pdf'] as readonly string[] };

// Metadata admission only. Actual bytes must be independently decoded and scanned.
export const FILE_POLICIES = {
  USER_AVATAR: imagePolicy(5 * 1024 * 1024),
  ORGANIZATION_LOGO: imagePolicy(5 * 1024 * 1024),
  ORGANIZATION_COVER: imagePolicy(10 * 1024 * 1024),
  PRODUCT_IMAGE: imagePolicy(10 * 1024 * 1024),
  SALE_ATTACHMENT: attachmentPolicy,
  PURCHASE_ATTACHMENT: attachmentPolicy,
  DOCUMENT: attachmentPolicy,
} as const;

export type UploadPurpose = keyof typeof FILE_POLICIES;
export type FileOwner = { userId: string; organizationId?: never } | { organizationId: string; userId?: never };

export function createUploadMetadata(owner: FileOwner, purpose: UploadPurpose, mimeType: string, bytes: number) {
  const userId = owner.userId;
  const organizationId = owner.organizationId;
  if (Boolean(userId) === Boolean(organizationId)) throw new Error('Exactly one file owner is required.');
  const id = z.uuid().parse(userId || organizationId);
  if ((purpose === 'USER_AVATAR') !== Boolean(userId)) throw new Error('File purpose does not match its owner scope.');
  const policy = FILE_POLICIES[purpose];
  if (!policy || !policy.mimeTypes.includes(mimeType)) throw new Error('Unsupported file type.');
  if (!Number.isSafeInteger(bytes) || bytes < 1 || bytes > policy.maxBytes) throw new Error('Invalid file size.');
  return {
    objectKey: `${userId ? 'users' : 'organizations'}/${id}/${randomUUID()}/original`,
    expectedBytes: BigInt(bytes),
    declaredMimeType: mimeType,
    purpose,
    // Maximum reservation lifetime; a signed upload URL must be shorter-lived.
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  };
}
