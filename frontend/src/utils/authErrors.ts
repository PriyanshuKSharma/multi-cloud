type ErrorRecord = Record<string, unknown>;

type ValidationDetailItem = {
  msg?: string;
};

const asRecord = (value: unknown): ErrorRecord | null => {
  if (typeof value === 'object' && value !== null) {
    return value as ErrorRecord;
  }
  return null;
};

const getResponseRecord = (error: unknown): ErrorRecord | null => {
  const errorRecord = asRecord(error);
  return asRecord(errorRecord?.response);
};

export const getAuthErrorDetail = (error: unknown): string | null => {
  const responseRecord = getResponseRecord(error);
  const dataRecord = asRecord(responseRecord?.data);
  const detail = dataRecord?.detail;

  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail)) {
    const message = detail
      .map((item) => {
        const detailItem = asRecord(item) as ValidationDetailItem | null;
        return typeof detailItem?.msg === 'string' ? detailItem.msg : '';
      })
      .filter(Boolean)
      .join(', ');
    return message || null;
  }

  return null;
};

export const getAuthErrorCode = (error: unknown): string | null => {
  const errorRecord = asRecord(error);
  return typeof errorRecord?.code === 'string' ? errorRecord.code : null;
};

export const getAuthErrorStatus = (error: unknown): number | null => {
  const responseRecord = getResponseRecord(error);
  return typeof responseRecord?.status === 'number' ? responseRecord.status : null;
};

export const hasAuthErrorResponse = (error: unknown): boolean => getResponseRecord(error) !== null;
