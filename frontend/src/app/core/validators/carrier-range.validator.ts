import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export interface InitialIdxRangeError {
  min: number;
  max: number;
  rangeStart: number;
  rangeEnd: number;
}

export function carrierRangeGroupValidator(control: AbstractControl): ValidationErrors | null {
  const initialIdx = control.get('initialIdx')?.value;
  const rangeStart = control.get('rangeStart')?.value;
  const rangeEnd = control.get('rangeEnd')?.value;

  if (initialIdx == null || rangeStart == null || rangeEnd == null) {
    return null;
  }

  const errors: ValidationErrors = {};

  if (rangeStart > rangeEnd) {
    errors['rangeOrder'] = true;
  }

  const minInitialIdx = rangeStart + 1;
  const maxInitialIdx = rangeEnd - 1;

  if (initialIdx < minInitialIdx || initialIdx > maxInitialIdx) {
    errors['initialIdxRange'] = {
      min: minInitialIdx,
      max: maxInitialIdx,
      rangeStart,
      rangeEnd,
    } satisfies InitialIdxRangeError;
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export function initialIdxRangeErrorMessage(error: InitialIdxRangeError): string {
  return `Initial index must be between ${error.min} and ${error.max} (inclusive).`;
}
