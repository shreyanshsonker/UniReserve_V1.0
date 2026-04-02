import axios from 'axios';

import type { ApiErrorEnvelope, ValidationErrors } from '../types/api';

const isApiErrorEnvelope = (value: unknown): value is ApiErrorEnvelope => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as ApiErrorEnvelope).error?.message === 'string'
  );
};

const formatValidationErrors = (errors: ValidationErrors): string => {
  return Object.entries(errors)
    .map(([field, value]) => {
      const message = Array.isArray(value) ? value.join(', ') : value;
      return `${field}: ${message}`;
    })
    .join(' | ');
};

export const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const data = error.response?.data;

  if (!data) {
    return fallback;
  }

  if (isApiErrorEnvelope(data)) {
    return data.error.message;
  }

  if (typeof data === 'object') {
    return formatValidationErrors(data as ValidationErrors) || fallback;
  }

  return fallback;
};
