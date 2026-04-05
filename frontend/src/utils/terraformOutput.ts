const ANSI_ESCAPE_REGEX =
  /[\u001b\u009b][[\]()#;?]*(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-ORZcf-nqry=><])/g;

export interface TerraformOutputFormatOptions {
  omitLogsKey?: boolean;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

export const normalizeLogText = (value: unknown): string => {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(ANSI_ESCAPE_REGEX, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');
};

const sanitizeValue = (value: unknown, options: TerraformOutputFormatOptions): unknown => {
  if (typeof value === 'string') {
    return normalizeLogText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item, options));
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};

    for (const [key, raw] of Object.entries(record)) {
      if (options.omitLogsKey && key === 'logs') {
        continue;
      }
      output[key] = sanitizeValue(raw, options);
    }
    return output;
  }

  return value;
};

const extractLikelyErrorLine = (rawLogs: string): string => {
  const lines = normalizeLogText(rawLogs)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return '';
  }

  const prioritizedPatterns = [
    /invalidparametercombination/i,
    /vpcidnotspecified/i,
    /\berror:\b/i,
    /\bapi error\b/i,
    /\bfailed\b/i,
    /\bexception\b/i,
    /\bforbidden\b/i,
    /\bunauthorized\b/i,
    /\bnot found\b/i,
  ];

  for (const pattern of prioritizedPatterns) {
    const line = [...lines].reverse().find((candidate) => pattern.test(candidate));
    if (line) {
      return line;
    }
  }

  return lines[lines.length - 1];
};

export const formatTerraformOutput = (
  value: unknown,
  options: TerraformOutputFormatOptions = {}
): string => {
  if (value === null || value === undefined) {
    return 'No Terraform output available yet.';
  }

  if (typeof value === 'string') {
    const normalized = normalizeLogText(value).trim();
    if (!normalized) {
      return 'No Terraform output available yet.';
    }

    const looksLikeJson =
      (normalized.startsWith('{') && normalized.endsWith('}')) ||
      (normalized.startsWith('[') && normalized.endsWith(']'));

    if (looksLikeJson) {
      try {
        const parsed = JSON.parse(normalized);
        const sanitized = sanitizeValue(parsed, options);
        return JSON.stringify(sanitized, null, 2);
      } catch {
        return normalized;
      }
    }

    return normalized;
  }

  const sanitized = sanitizeValue(value, options);
  try {
    const serialized = JSON.stringify(sanitized, null, 2);
    if (serialized === '{}' && options.omitLogsKey) {
      return 'No structured Terraform output (logs shown below).';
    }
    return serialized;
  } catch {
    return 'Unable to format Terraform output.';
  }
};

export const extractProvisioningErrorMessage = (value: unknown, fallback: string): string => {
  const normalizedFallback = normalizeLogText(fallback).trim() || 'Request failed.';

  if (typeof value === 'string') {
    const text = normalizeLogText(value).trim();
    return text || normalizedFallback;
  }

  if (Array.isArray(value)) {
    const messages = value
      .map((item) => {
        const object = asRecord(item);
        if (typeof object.msg === 'string') {
          return normalizeLogText(object.msg).trim();
        }
        if (typeof item === 'string') {
          return normalizeLogText(item).trim();
        }
        return '';
      })
      .filter(Boolean);

    return messages.length > 0 ? messages.join(', ') : normalizedFallback;
  }

  const data = asRecord(value);
  if (Object.keys(data).length === 0) {
    return normalizedFallback;
  }

  const candidateKeys = ['detail', 'error', 'message', 'reason'] as const;
  for (const key of candidateKeys) {
    const candidate = data[key];
    if (typeof candidate === 'string') {
      const cleaned = normalizeLogText(candidate).trim();
      if (cleaned) {
        return cleaned;
      }
    }
  }

  if (typeof data.logs === 'string') {
    const likelyError = extractLikelyErrorLine(data.logs);
    if (likelyError) {
      return likelyError;
    }
  }

  const formatted = formatTerraformOutput(data, { omitLogsKey: true }).trim();
  if (formatted && !formatted.startsWith('No Terraform output available yet')) {
    return formatted;
  }

  return normalizedFallback;
};
