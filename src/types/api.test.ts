import {
  hasFieldErrors,
  hasStringErrors,
  hasRecordErrors,
  getErrorMessage,
  type ApiResponse,
} from './api';

describe('hasFieldErrors', () => {
  it('returns true for array of FieldError objects', () => {
    const response: ApiResponse = {
      success: false,
      errors: [{ field: 'email', message: 'required' }],
    };
    expect(hasFieldErrors(response)).toBe(true);
  });

  it('returns false for empty array', () => {
    const response: ApiResponse = { success: false, errors: [] };
    expect(hasFieldErrors(response)).toBe(false);
  });

  it('returns false for string array', () => {
    const response: ApiResponse = { success: false, errors: ['error1'] };
    expect(hasFieldErrors(response)).toBe(false);
  });

  it('returns false for record errors', () => {
    const response: ApiResponse = {
      success: false,
      errors: { email: 'required' } as any,
    };
    expect(hasFieldErrors(response)).toBe(false);
  });

  it('returns false for undefined errors', () => {
    const response: ApiResponse = { success: false };
    expect(hasFieldErrors(response)).toBe(false);
  });
});

describe('hasStringErrors', () => {
  it('returns true for string array', () => {
    const response: ApiResponse = { success: false, errors: ['error1', 'error2'] };
    expect(hasStringErrors(response)).toBe(true);
  });

  it('returns false for empty array', () => {
    const response: ApiResponse = { success: false, errors: [] };
    expect(hasStringErrors(response)).toBe(false);
  });

  it('returns false for FieldError array', () => {
    const response: ApiResponse = {
      success: false,
      errors: [{ field: 'email', message: 'required' }],
    };
    expect(hasStringErrors(response)).toBe(false);
  });

  it('returns false for undefined errors', () => {
    const response: ApiResponse = { success: true };
    expect(hasStringErrors(response)).toBe(false);
  });
});

describe('hasRecordErrors', () => {
  it('returns true for Record<string, string>', () => {
    const response: ApiResponse = {
      success: false,
      errors: { email: 'required', name: 'too short' } as any,
    };
    expect(hasRecordErrors(response)).toBe(true);
  });

  it('returns false for array errors', () => {
    const response: ApiResponse = { success: false, errors: ['error'] };
    expect(hasRecordErrors(response)).toBe(false);
  });

  it('returns false for null errors', () => {
    const response: ApiResponse = { success: false, errors: undefined };
    expect(hasRecordErrors(response)).toBe(false);
  });
});

describe('getErrorMessage', () => {
  it('returns error_message when present', () => {
    const response: ApiResponse = {
      success: false,
      error_message: 'Something went wrong',
      errors: ['other error'],
    };
    expect(getErrorMessage(response)).toBe('Something went wrong');
  });

  it('joins string errors with comma', () => {
    const response: ApiResponse = {
      success: false,
      errors: ['invalid email', 'name required'],
    };
    expect(getErrorMessage(response)).toBe('invalid email, name required');
  });

  it('formats field errors as "field: message"', () => {
    const response: ApiResponse = {
      success: false,
      errors: [
        { field: 'email', message: 'required' },
        { field: 'name', message: 'too short' },
      ],
    };
    expect(getErrorMessage(response)).toBe('email: required, name: too short');
  });

  it('formats record errors as "key: value"', () => {
    const response: ApiResponse = {
      success: false,
      errors: { email: 'invalid', phone: 'required' } as any,
    };
    expect(getErrorMessage(response)).toBe('email: invalid, phone: required');
  });

  it('returns fallback message for unknown error shape', () => {
    const response: ApiResponse = { success: false };
    expect(getErrorMessage(response)).toBe('An unknown error occurred');
  });

  it('handles single string error', () => {
    const response: ApiResponse = { success: false, errors: ['single error'] };
    expect(getErrorMessage(response)).toBe('single error');
  });
});
