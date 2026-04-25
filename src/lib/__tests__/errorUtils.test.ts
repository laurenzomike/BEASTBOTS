import { describe, it, expect } from 'vitest';
import { getActionableErrorMessage } from '../errorUtils';

describe('getActionableErrorMessage', () => {
  it('identifies authentication errors', () => {
    const authErrors = [
      new Error('Request failed with status code 401'),
      new Error('Unauthorized access'),
      new Error('User is unauthenticated'),
      new Error('Token expired'),
      new Error('Invalid key provided'),
      '401 unauthorized',
      { message: 'invalid key' }
    ];

    authErrors.forEach(err => {
      const result = getActionableErrorMessage(err);
      expect(result.type).toBe('auth');
      expect(result.suggestedStatus).toBe('auth-required');
      expect(result.action).toBe('Renew Access');
      expect(result.msg).toContain('AUTH_FAILURE');
    });
  });

  it('identifies rate limiting errors', () => {
    const rateLimitErrors = [
      new Error('Error 429'),
      new Error('Too many requests, please try again later'),
      new Error('Quota exceeded'),
      new Error('Rate limit reached'),
      new Error('RATE_LIMIT_EXCEEDED'),
      '429 Too Many Requests',
      { message: 'rate_limit' }
    ];

    rateLimitErrors.forEach(err => {
      const result = getActionableErrorMessage(err);
      expect(result.type).toBe('rate-limit');
      expect(result.suggestedStatus).toBe('error');
      expect(result.action).toBe('Sync Cooldown');
      expect(result.msg).toContain('RATE_LIMIT');
    });
  });

  it('identifies permission denied errors', () => {
    const permissionErrors = [
      new Error('Error 403 Forbidden'),
      new Error('Permission denied'),
      '403',
      { message: 'Insufficient permission' }
    ];

    permissionErrors.forEach(err => {
      const result = getActionableErrorMessage(err);
      expect(result.type).toBe('permission');
      expect(result.suggestedStatus).toBe('error');
      expect(result.action).toBe('Audit Roles');
      expect(result.msg).toContain('PERMISSION_DENIED');
    });
  });

  it('identifies network errors', () => {
    const networkErrors = [
      new Error('Connection refused'),
      new Error('Network error occurred'),
      new Error('Failed to fetch'),
      new Error('fetch failed'),
      'network timeout',
      { message: 'no connection' }
    ];

    networkErrors.forEach(err => {
      const result = getActionableErrorMessage(err);
      expect(result.type).toBe('network');
      expect(result.suggestedStatus).toBe('error');
      expect(result.action).toBe('Forced Pulse');
      expect(result.msg).toContain('LINK_LOST');
    });
  });

  it('falls back to unknown type for other errors', () => {
    const unknownErrors = [
      new Error('Something went completely wrong'),
      new Error('Syntax error on line 42'),
      'Just a random string error',
      { detail: 'weird object error' },
      null,
      undefined,
      12345
    ];

    unknownErrors.forEach(err => {
      const result = getActionableErrorMessage(err);
      expect(result.type).toBe('unknown');
      expect(result.suggestedStatus).toBe('error');
      expect(result.action).toBe('Restart Node');
      expect(result.msg).toContain('SYSTEM_REJECT');
    });
  });

  it('handles empty string and missing messages gracefully', () => {
    const emptyErrors = [
      new Error(''),
      '',
      {}
    ];

    emptyErrors.forEach(err => {
      const result = getActionableErrorMessage(err);
      expect(result.type).toBe('unknown');
      expect(result.suggestedStatus).toBe('error');
      expect(result.action).toBe('Restart Node');
      expect(result.msg).toContain('SYSTEM_REJECT');
    });
  });

  it('prioritizes based on check order in function', () => {
    // If an error message contains both "401" and "rate limit",
    // it will match "401" first since Auth checks happen before Rate Limit checks.
    const mixedError = new Error('401 unauthorized and rate limit exceeded');
    const result = getActionableErrorMessage(mixedError);

    expect(result.type).toBe('auth');
    expect(result.suggestedStatus).toBe('auth-required');
  });
});
