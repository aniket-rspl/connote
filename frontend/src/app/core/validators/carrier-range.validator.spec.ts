import { FormBuilder } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import {
  carrierRangeGroupValidator,
  initialIdxRangeErrorMessage,
} from './carrier-range.validator';

describe('carrierRangeGroupValidator', () => {
  const fb = new FormBuilder();

  function group(overrides: {
    initialIdx?: number | null;
    rangeStart?: number | null;
    rangeEnd?: number | null;
  }) {
    return fb.group(
      {
        initialIdx: [overrides.initialIdx ?? 19604],
        rangeStart: [overrides.rangeStart ?? 19000],
        rangeEnd: [overrides.rangeEnd ?? 20000],
      },
      { validators: [carrierRangeGroupValidator] },
    );
  }

  it('should accept a valid range configuration', () => {
    const form = group({ initialIdx: 12306, rangeStart: 12307, rangeEnd: 15000 });
    expect(form.errors).toBeNull();
  });

  it('should accept initialIdx at the lower bound (rangeStart - 1)', () => {
    const form = group({ initialIdx: 18999, rangeStart: 19000, rangeEnd: 20000 });
    expect(form.errors).toBeNull();
  });

  it('should accept initialIdx at the upper bound (rangeEnd - 1)', () => {
    const form = group({ initialIdx: 19999, rangeStart: 19000, rangeEnd: 20000 });
    expect(form.errors).toBeNull();
  });

  it('should reject when rangeStart is greater than rangeEnd', () => {
    const form = group({ rangeStart: 9000, rangeEnd: 8000 });
    expect(form.errors?.['rangeOrder']).toBe(true);
  });

  it('should reject initialIdx below rangeStart - 1', () => {
    const form = group({ initialIdx: 18998, rangeStart: 19000, rangeEnd: 20000 });
    expect(form.errors?.['initialIdxRange']).toEqual({
      min: 18999,
      max: 19999,
      rangeStart: 19000,
      rangeEnd: 20000,
    });
  });

  it('should reject initialIdx above rangeEnd - 1', () => {
    const form = group({ initialIdx: 20000, rangeStart: 19000, rangeEnd: 20000 });
    expect(form.errors?.['initialIdxRange']).toBeTruthy();
  });

  it('should return null when range fields are incomplete', () => {
    const form = fb.group(
      { initialIdx: [1000], rangeStart: [null], rangeEnd: [5000] },
      { validators: [carrierRangeGroupValidator] },
    );
    expect(form.errors).toBeNull();
  });
});

describe('initialIdxRangeErrorMessage', () => {
  it('should format min and max in the message', () => {
    const message = initialIdxRangeErrorMessage({
      min: 18999,
      max: 19999,
      rangeStart: 19000,
      rangeEnd: 20000,
    });
    expect(message).toBe('Initial index must be between 18999 and 19999 (inclusive).');
  });
});
