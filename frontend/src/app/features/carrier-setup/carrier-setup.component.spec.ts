import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../core/models/api-error';
import { CarrierRefreshService } from '../../core/services/carrier-refresh.service';
import { ConnoteApiService } from '../../core/services/connote-api.service';
import { CarrierSetupComponent } from './carrier-setup.component';

describe('CarrierSetupComponent', () => {
  let fixture: ComponentFixture<CarrierSetupComponent>;
  let component: CarrierSetupComponent;
  let api: { setupCarrier: ReturnType<typeof vi.fn> };
  let refresh: CarrierRefreshService;

  beforeEach(async () => {
    api = {
      setupCarrier: vi.fn(() =>
        of({
          carrierName: 'Acme',
          accountNumber: '99X',
          lastIdx: 999,
          rangeStart: 1000,
          rangeEnd: 5000,
        }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [CarrierSetupComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConnoteApiService, useValue: api },
        CarrierRefreshService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CarrierSetupComponent);
    component = fixture.componentInstance;
    refresh = TestBed.inject(CarrierRefreshService);
    fixture.detectChanges();
  });

  it('should create with default form values', () => {
    expect(component.form.getRawValue()).toEqual({
      carrierName: '',
      accountNumber: '',
      digits: 7,
      initialIdx: 1000000,
      rangeStart: 1000000,
      rangeEnd: 9999999,
    });
    expect(component.form.valid).toBe(false);
  });

  it('should require carrier name and account number', () => {
    component.form.patchValue({
      carrierName: '',
      accountNumber: '',
      initialIdx: 1000000,
    });
    component.form.markAllAsTouched();
    fixture.detectChanges();

    expect(component.form.controls.carrierName.invalid).toBe(true);
    expect(component.form.controls.accountNumber.invalid).toBe(true);
  });

  it('should flag invalid range order', () => {
    component.form.patchValue({
      carrierName: 'Test',
      accountNumber: '1',
      rangeStart: 9000,
      rangeEnd: 8000,
      initialIdx: 8500,
    });
    component.form.controls.rangeStart.markAsTouched();
    component.form.controls.rangeEnd.markAsTouched();
    fixture.detectChanges();

    expect(component.hasRangeOrderError()).toBe(true);
    expect(component.form.invalid).toBe(true);
  });

  it('should flag initial index outside allowed band', () => {
    component.form.patchValue({
      carrierName: 'Test',
      accountNumber: '1',
      rangeStart: 19000,
      rangeEnd: 20000,
      initialIdx: 18000,
    });
    component.form.controls.initialIdx.markAsTouched();
    fixture.detectChanges();

    expect(component.hasInitialIdxRangeError()).toBe(true);
    expect(component.initialIdxRangeError()).toContain('18999');
  });

  it('should submit a valid carrier and show success dialog', async () => {
    const refreshSpy = vi.spyOn(refresh, 'notifyRefresh');

    component.form.patchValue({
      carrierName: 'Acme',
      accountNumber: '99X',
      digits: 8,
      initialIdx: 999,
      rangeStart: 1000,
      rangeEnd: 5000,
    });
    component.submit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(api.setupCarrier).toHaveBeenCalledWith({
      carrierName: 'Acme',
      accountNumber: '99X',
      digits: 8,
      initialIdx: 999,
      rangeStart: 1000,
      rangeEnd: 5000,
    });
    expect(component.showSuccessDialog()).toBe(true);
    expect(refreshSpy).toHaveBeenCalled();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Carrier registered successfully');
  });

  it('should reset the form after successful submit', async () => {
    component.form.patchValue({
      carrierName: 'Acme',
      accountNumber: '99X',
      digits: 8,
      initialIdx: 999,
      rangeStart: 1000,
      rangeEnd: 5000,
    });
    component.submit();
    await fixture.whenStable();

    expect(component.form.getRawValue().carrierName).toBe('');
    expect(component.form.getRawValue().digits).toBe(7);
  });

  it('should display API errors on failed submit', async () => {
    api.setupCarrier.mockReturnValue(
      throwError(() => new ApiError("Carrier 'Acme' already exists.", 409)),
    );

    component.form.patchValue({
      carrierName: 'Acme',
      accountNumber: '99X',
      digits: 8,
      initialIdx: 999,
      rangeStart: 1000,
      rangeEnd: 5000,
    });
    component.submit();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.errorMessage()).toBe("Carrier 'Acme' already exists.");
    expect(component.showSuccessDialog()).toBe(false);
  });

  it('should close the success dialog', () => {
    component.showSuccessDialog.set(true);
    fixture.detectChanges();
    component.closeSuccessDialog();
    expect(component.showSuccessDialog()).toBe(false);
  });
});
