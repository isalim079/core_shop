export const ERROR_MESSAGES = {
  BAD_REQUEST: ['The request is invalid.', 'অনুরোধটি সঠিক নয়।'],
  VALIDATION_FAILED: ['Some fields are invalid.', 'কিছু তথ্য সঠিক নয়।'],
  UNAUTHENTICATED: ['Authentication is required.', 'পরিচয় যাচাই প্রয়োজন।'],
  FORBIDDEN: ['You do not have permission for this action.', 'এই কাজের অনুমতি আপনার নেই।'],
  NOT_FOUND: ['The requested resource was not found.', 'অনুরোধ করা তথ্য পাওয়া যায়নি।'],
  METHOD_NOT_ALLOWED: ['This method is not allowed.', 'এই পদ্ধতি অনুমোদিত নয়।'],
  OWNER_TRANSFER_REQUIRED: ['Transfer ownership before changing an owner membership.', 'মালিকের সদস্যপদ পরিবর্তনের আগে মালিকানা হস্তান্তর করুন।'],
  LAST_BRANCH_REQUIRED: ['An active organization must retain an active branch.', 'সক্রিয় প্রতিষ্ঠানে অন্তত একটি সক্রিয় শাখা থাকতে হবে।'],
  INVITATION_UNAVAILABLE: ['This invitation cannot be accepted.', 'এই আমন্ত্রণ গ্রহণ করা যাচ্ছে না।'],
  CONFLICT: ['The request conflicts with the current state.', 'অনুরোধটি বর্তমান অবস্থার সঙ্গে সাংঘর্ষিক।'],
  PAYLOAD_TOO_LARGE: ['The request is too large.', 'অনুরোধের আকার অত্যধিক বড়।'],
  UNSUPPORTED_MEDIA_TYPE: ['This content type is not supported.', 'এই ধরনের তথ্য সমর্থিত নয়।'],
  BUSINESS_RULE_VIOLATION: ['The requested operation is not permitted.', 'অনুরোধ করা কাজটি অনুমোদিত নয়।'],
  RATE_LIMITED: ['Too many requests. Please try again later.', 'অতিরিক্ত অনুরোধ। কিছুক্ষণ পরে আবার চেষ্টা করুন।'],
  SERVICE_UNAVAILABLE: ['The service is temporarily unavailable.', 'সেবাটি সাময়িকভাবে অনুপলব্ধ।'],
  INTERNAL_ERROR: ['An unexpected error occurred.', 'অপ্রত্যাশিত একটি ত্রুটি হয়েছে।'],
  IDEMPOTENCY_PAYLOAD_MISMATCH: ['This command key was already used with different data.', 'এই নির্দেশের চাবি আগে ভিন্ন তথ্যের জন্য ব্যবহার হয়েছে।'],
  COMMAND_RETRY_REQUIRED: ['Please retry the same command.', 'অনুগ্রহ করে একই নির্দেশ আবার চেষ্টা করুন।'],
  PAYMENT_EXCEEDS_OUTSTANDING: ['The payment exceeds the outstanding amount.', 'পরিশোধের পরিমাণ বকেয়ার চেয়ে বেশি।'],
  LEDGER_ALREADY_REVERSED: ['This ledger entry has already been reversed.', 'এই হিসাবের এন্ট্রি ইতিমধ্যে বিপরীত এন্ট্রি দিয়ে সংশোধিত হয়েছে।'],
} as const;

export type ErrorCode = keyof typeof ERROR_MESSAGES;
export type Locale = 'en' | 'bn';

export function negotiateLocale(header: unknown): Locale {
  if (typeof header !== 'string') return 'en';
  const candidates = header.slice(0, 256).split(',').map((part, index) => {
    const [tag, quality] = part.trim().toLowerCase().split(';');
    const q = quality ? Number(quality.trim().replace(/^q=/, '')) : 1;
    return { tag: tag.split('-')[0], q, index };
  }).filter(({ q }) => Number.isFinite(q) && q > 0 && q <= 1)
    .sort((a, b) => b.q - a.q || a.index - b.index);
  return candidates.find(({ tag }) => tag === 'bn' || tag === 'en')?.tag === 'bn' ? 'bn' : 'en';
}

export function errorMessage(code: ErrorCode, locale: Locale) {
  return ERROR_MESSAGES[code][locale === 'bn' ? 1 : 0];
}
