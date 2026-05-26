import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { environment } from '../../../environments/environment';
import { ApiError } from '../models/api-error';
import { ConnoteApiService } from './connote-api.service';

describe('ConnoteApiService', () => {
  let service: ConnoteApiService;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiBaseUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), ConnoteApiService],
    });
    service = TestBed.inject(ConnoteApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch carriers', async () => {
    const carriers = [
      {
        carrierName: 'DHL',
        accountNumber: '8899',
        lastIdx: 250000,
        rangeStart: 200000,
        rangeEnd: 300000,
      },
    ];

    const promise = firstValueFrom(service.getCarriers());
    const req = httpMock.expectOne(`${baseUrl}/carriers`);
    expect(req.request.method).toBe('GET');
    req.flush(carriers);

    await expect(promise).resolves.toEqual(carriers);
  });

  it('should setup a carrier', async () => {
    const body = {
      carrierName: 'Acme',
      accountNumber: '99X',
      digits: 8,
      initialIdx: 999,
      rangeStart: 1000,
      rangeEnd: 5000,
    };
    const response = { ...body, lastIdx: 999 };

    const promise = firstValueFrom(service.setupCarrier(body));
    const req = httpMock.expectOne(`${baseUrl}/setup`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush(response);

    await expect(promise).resolves.toEqual(response);
  });

  it('should generate a tracking id', async () => {
    const promise = firstValueFrom(service.generateId('FedEx'));
    const req = httpMock.expectOne(`${baseUrl}/generate`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ carrierName: 'FedEx' });
    req.flush({ carrierName: 'FedEx', trackingId: 'FEDE123450000001' });

    await expect(promise).resolves.toEqual({
      carrierName: 'FedEx',
      trackingId: 'FEDE123450000001',
    });
  });

  it('should map API error responses to ApiError', async () => {
    const promise = firstValueFrom(service.generateId('Unknown'));
    const req = httpMock.expectOne(`${baseUrl}/generate`);
    req.flush(
      {
        timestamp: '2026-05-26T10:00:00',
        status: 404,
        error: 'Not Found',
        message: 'Carrier not found: Unknown',
        path: '/api/v1/connote/generate',
      },
      { status: 404, statusText: 'Not Found' },
    );

    await expect(promise).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(ApiError);
      expect(err).toMatchObject({
        message: 'Carrier not found: Unknown',
        status: 404,
      });
      return true;
    });
  });

  it('should use a fallback message when the API body has no message', async () => {
    const promise = firstValueFrom(service.getCarriers());
    const req = httpMock.expectOne(`${baseUrl}/carriers`);
    req.flush(null, { status: 500, statusText: 'Server Error' });

    await expect(promise).rejects.toBeInstanceOf(ApiError);
    await expect(promise).rejects.toMatchObject({ status: 500 });
  });
});
