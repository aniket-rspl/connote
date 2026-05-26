import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { CarrierRefreshService } from './carrier-refresh.service';

describe('CarrierRefreshService', () => {
  it('should emit on notifyRefresh', () => {
    TestBed.configureTestingModule({});
    const service = TestBed.inject(CarrierRefreshService);
    const listener = vi.fn();

    service.refresh$.subscribe(listener);
    service.notifyRefresh();

    expect(listener).toHaveBeenCalledTimes(1);
  });
});
