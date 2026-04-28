const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const unwrapDisplayValue = (value: unknown, depth = 0): unknown => {
  if (depth > 5) {
    return value;
  }

  if (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => unwrapDisplayValue(item, depth + 1));
  }

  if (isPlainObject(value)) {
    if ('value' in value) {
      return unwrapDisplayValue(value.value, depth + 1);
    }

    if ('text' in value) {
      return unwrapDisplayValue(value.text, depth + 1);
    }

    if ('raw' in value) {
      return unwrapDisplayValue(value.raw, depth + 1);
    }
  }

  return value;
};

export const formatDisplayValue = (value: unknown, fallback = 'N/A'): string => {
  const unwrapped = unwrapDisplayValue(value);

  if (unwrapped === null || unwrapped === undefined || unwrapped === '') {
    return fallback;
  }

  if (
    typeof unwrapped === 'string' ||
    typeof unwrapped === 'number' ||
    typeof unwrapped === 'boolean' ||
    typeof unwrapped === 'bigint'
  ) {
    return String(unwrapped);
  }

  if (unwrapped instanceof Date) {
    return unwrapped.toISOString();
  }

  if (Array.isArray(unwrapped)) {
    const rendered = unwrapped
      .map((item) => formatDisplayValue(item, ''))
      .filter(Boolean)
      .join(', ');

    return rendered || fallback;
  }

  try {
    return JSON.stringify(unwrapped);
  } catch {
    return fallback;
  }
};

