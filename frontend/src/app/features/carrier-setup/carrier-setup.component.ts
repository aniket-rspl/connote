import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AlertComponent } from '../../shared/alert/alert.component';
import { SuccessDialogComponent } from '../../shared/success-dialog/success-dialog.component';
import { ApiError } from '../../core/models/api-error';
import {
  carrierRangeGroupValidator,
  InitialIdxRangeError,
  initialIdxRangeErrorMessage,
} from '../../core/validators/carrier-range.validator';
import { CarrierRefreshService } from '../../core/services/carrier-refresh.service';
import { ConnoteApiService } from '../../core/services/connote-api.service';

@Component({
  selector: 'app-carrier-setup',
  imports: [ReactiveFormsModule, AlertComponent, SuccessDialogComponent],
  templateUrl: './carrier-setup.component.html',
})
export class CarrierSetupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ConnoteApiService);
  private readonly carrierRefresh = inject(CarrierRefreshService);

  readonly submitting = signal(false);
  readonly showSuccessDialog = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group(
    {
      carrierName: ['', Validators.required],
      accountNumber: ['', Validators.required],
      digits: [7, [Validators.required, Validators.min(1)]],
      initialIdx: [1000000, Validators.required],
      rangeStart: [1000000, Validators.required],
      rangeEnd: [9999999, Validators.required],
    },
    { validators: [carrierRangeGroupValidator] },
  );

  submit(): void {
    this.errorMessage.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.api.setupCarrier(this.form.getRawValue()).subscribe({
      next: () => {
        this.showSuccessDialog.set(true);
        this.form.reset({
          carrierName: '',
          accountNumber: '',
          digits: 7,
          initialIdx: 1000000,
          rangeStart: 1000000,
          rangeEnd: 9999999,
        });
        this.carrierRefresh.notifyRefresh();
        this.submitting.set(false);
      },
      error: (err: unknown) => {
        this.errorMessage.set(
          err instanceof ApiError ? err.message : 'Failed to register carrier.',
        );
        this.submitting.set(false);
      },
    });
  }

  hasRangeOrderError(): boolean {
    if (!this.form.errors?.['rangeOrder']) {
      return false;
    }
    const { rangeStart, rangeEnd } = this.form.controls;
    return rangeStart.touched || rangeEnd.touched;
  }

  initialIdxRangeError(): string {
    const error = this.form.errors?.['initialIdxRange'] as InitialIdxRangeError | undefined;
    if (!error) {
      return '';
    }
    return initialIdxRangeErrorMessage(error);
  }

  hasInitialIdxRangeError(): boolean {
    if (!this.form.errors?.['initialIdxRange']) {
      return false;
    }
    return this.form.controls.initialIdx.touched;
  }

  closeSuccessDialog(): void {
    this.showSuccessDialog.set(false);
  }
}
