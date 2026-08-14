import assert from 'node:assert/strict';
import test from 'node:test';
import { AxiosError, AxiosHeaders } from 'axios';
import { getBackendErrorInfo, normalizeRequestError } from './error';

test('reads the backend message contract and legacy msg field', () => {
  assert.deepEqual(getBackendErrorInfo({ code: 400, message: 'validation failed' }), {
    code: '400',
    message: 'validation failed'
  });
  assert.deepEqual(getBackendErrorInfo({ code: 500, msg: 'legacy error' }), {
    code: '500',
    message: 'legacy error'
  });
});

test('uses an HTTP error response message for notifications and flat request callers', () => {
  const response = {
    data: { code: 400, message: 'knowledge base name already exists' },
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: { headers: new AxiosHeaders() }
  };
  const error = new AxiosError('Request failed with status code 400', 'ERR_BAD_REQUEST', response.config, {}, response);

  assert.deepEqual(normalizeRequestError(error), {
    code: '400',
    message: 'knowledge base name already exists'
  });
  assert.equal(error.message, 'knowledge base name already exists');
});

test('keeps the Axios message when no backend response is available', () => {
  const error = new AxiosError('Network Error', 'ERR_NETWORK');

  assert.deepEqual(normalizeRequestError(error), {
    code: '',
    message: 'Network Error'
  });
});
