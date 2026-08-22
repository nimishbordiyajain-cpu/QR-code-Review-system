/**
 * Recursively cleans an object to strip any keys with `undefined` values.
 * Firebase Firestore strictly rejects `undefined` values with:
 * "Function setDoc() called with invalid data. Unsupported field value: undefined"
 */
export function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj as any;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) =>
        typeof item === 'object' && item !== null ? sanitizeForFirestore(item) : item
      );
  }

  const cleaned: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const value = (obj as any)[key];
    if (value === undefined) {
      continue;
    }
    if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
      cleaned[key] = sanitizeForFirestore(value);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}
