import { createHash } from 'node:crypto';
import { DomainError } from '../errors/domain-error';

export function canonicalPayload(value: unknown): string {
  let nodes = 0;
  function serialize(input: unknown, depth: number): string {
    if (++nodes > 5000 || depth > 12) throw new DomainError('BAD_REQUEST', 400);
    if (input === null || typeof input === 'boolean') return JSON.stringify(input);
    if (typeof input === 'string') {
      if (input.length > 16_384) throw new DomainError('BAD_REQUEST', 400);
      return JSON.stringify(input);
    }
    // Monetary values must be validated canonical decimal strings, never floats.
    if (typeof input === 'number' && Number.isSafeInteger(input)) return JSON.stringify(input);
    if (Array.isArray(input)) return `[${input.map((entry) => serialize(entry, depth + 1)).join(',')}]`;
    if (typeof input === 'object' && input !== null && Object.getPrototypeOf(input) === Object.prototype) {
      return `{${Object.keys(input).sort().map((key) => {
        if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new DomainError('BAD_REQUEST', 400);
        return `${JSON.stringify(key)}:${serialize((input as Record<string, unknown>)[key], depth + 1)}`;
      }).join(',')}}`;
    }
    throw new DomainError('BAD_REQUEST', 400);
  }
  const result = serialize(value, 0);
  if (Buffer.byteLength(result) > 65_536) throw new DomainError('PAYLOAD_TOO_LARGE', 413);
  return result;
}

export function payloadHash(value: unknown) {
  return createHash('sha256').update(canonicalPayload(value)).digest('hex');
}
