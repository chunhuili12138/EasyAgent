import type { AxiosError } from 'axios';

type BackendErrorData = {
  code?: string | number;
  message?: unknown;
  msg?: unknown;
};

export function getBackendErrorInfo(data: unknown) {
  const backendData = data && typeof data === 'object' ? (data as BackendErrorData) : undefined;
  const rawMessage = backendData?.message || backendData?.msg;

  return {
    code: backendData?.code == null ? '' : String(backendData.code),
    message: typeof rawMessage === 'string' ? rawMessage : ''
  };
}

export function normalizeRequestError(error: AxiosError<unknown>) {
  const backendError = getBackendErrorInfo(error.response?.data);

  if (backendError.message) {
    error.message = backendError.message;
  }

  return {
    code: backendError.code,
    message: error.message
  };
}
