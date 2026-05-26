import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../../core/models/api-error';
import { CarrierSummary } from '../../core/models/carrier-summary.model';
import { CarrierRefreshService } from '../../core/services/carrier-refresh.service';
import { ConnoteApiService } from '../../core/services/connote-api.service';
import { GenerateIdComponent } from './generate-id.component';

const mockCarriers: CarrierSummary[] = [
  {
    carrierName: 'DHL',
    accountNumber: '8899',
    lastIdx: 250000,
    rangeStart: 200000,
    rangeEnd: 300000,
  },
  {
    carrierName: 'FedEx',
    accountNumber: '12345',
    lastIdx: 1000000,
    rangeStart: 1000000,
    rangeEnd: 9999999,
  },
];

describe('GenerateIdComponent', () => {
  let fixture: ComponentFixture<GenerateIdComponent>;
  let component: GenerateIdComponent;
  let api: {
    getCarriers: ReturnType<typeof vi.fn>;
    generateId: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    api = {
      getCarriers: vi.fn(() => of([...mockCarriers])),
      generateId: vi.fn(() =>
        of({ carrierName: 'FedEx', trackingId: 'FEDE123450000001' }),
      ),
    };

    await TestBed.configureTestingModule({
      imports: [GenerateIdComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ConnoteApiService, useValue: api },
        CarrierRefreshService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GenerateIdComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create and load carriers', () => {
    expect(component).toBeTruthy();
    expect(api.getCarriers).toHaveBeenCalled();
    expect(component.carriers()).toEqual(mockCarriers);
    expect(component.loading()).toBe(false);
  });

  it('should render the generate form when carriers exist', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Generate tracking ID');
    expect(el.querySelector('#carrierName')).toBeTruthy();
  });

  it('should show empty state when no carriers are returned', async () => {
    api.getCarriers.mockReturnValue(of([]));
    component.loadCarriers();
    fixture.detectChanges();
    await fixture.whenStable();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('No carriers registered yet');
  });

  it('should filter carriers when typing in the combobox', () => {
    component.onCarrierInput({ target: { value: 'fed' } } as unknown as Event);
    expect(component.filteredCarriers().map((c) => c.carrierName)).toEqual(['FedEx']);
  });

  it('should report no match for unknown carrier query', () => {
    component.onCarrierInput({ target: { value: 'zzz' } } as unknown as Event);
    component.onCarrierBlur();
    fixture.detectChanges();

    expect(component.hasNoMatch()).toBe(true);
    expect(component.carrierFieldError()).toContain('No matching carrier');
  });

  it('should select a carrier from the list', () => {
    component.selectCarrier(mockCarriers[0]);
    expect(component.selectedCarrierName()).toBe('DHL');
    expect(component.hasValidCarrier()).toBe(true);
  });

  it('should generate a tracking id for a valid carrier', async () => {
    component.selectCarrier(mockCarriers[1]);
    component.generate();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(api.generateId).toHaveBeenCalledWith('FedEx');
    expect(component.trackingId()).toBe('FEDE123450000001');

    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('FEDE123450000001');
  });

  it('should not call generate when carrier is invalid', () => {
    component.onCarrierInput({ target: { value: 'invalid' } } as unknown as Event);
    component.onCarrierBlur();
    component.generate();

    expect(api.generateId).not.toHaveBeenCalled();
  });

  it('should display API errors', async () => {
    api.generateId.mockReturnValue(
      throwError(() => new ApiError('Consignment Index out of range.', 400)),
    );
    component.selectCarrier(mockCarriers[1]);
    component.generate();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.errorMessage()).toBe('Consignment Index out of range.');
  });

  it('should disable generate while request is in flight', () => {
    component.selectCarrier(mockCarriers[1]);
    component.generating.set(true);
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });
});
