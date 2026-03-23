import { HttpErrorResponse } from '@angular/common/http';
import { describe, expect, it } from 'vitest';
import { normalizeHttpError } from './api-error';

describe('normalizeHttpError', () => {
  it('maps status 0 to NETWORK_UNREACHABLE', () => {
    const error = new HttpErrorResponse({
      status: 0,
      statusText: 'Unknown Error',
      error: null,
    });

    const normalized = normalizeHttpError(error);

    expect(normalized.code).toBe('NETWORK_UNREACHABLE');
    expect(normalized.userMessage).toBe('API indisponible. Verifiez la connexion au backend.');
  });

  it('maps timeout payload to TIMEOUT', () => {
    const error = new HttpErrorResponse({
      status: 0,
      statusText: 'Timeout',
      error: {
        code: 'TIMEOUT',
        message: 'Delai depasse apres 15000 ms',
      },
    });

    const normalized = normalizeHttpError(error);

    expect(normalized.code).toBe('TIMEOUT');
    expect(normalized.message).toBe('Delai depasse apres 15000 ms');
  });

  it('extracts validation errors from payload errors[]', () => {
    const error = new HttpErrorResponse({
      status: 400,
      error: {
        errors: [{ message: 'Le champ nom est obligatoire' }],
      },
    });

    const normalized = normalizeHttpError(error);

    expect(normalized.code).toBe('VALIDATION');
    expect(normalized.violations).toEqual(['Le champ nom est obligatoire']);
    expect(normalized.userMessage).toBe('Le champ nom est obligatoire');
  });
});
