import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiError } from '../models/api-error';
import { CarrierSetupRequest } from '../models/carrier-setup-request.model';
import { CarrierSummary } from '../models/carrier-summary.model';
import { ErrorResponse } from '../models/error-response.model';
import { IdGenerationResponse } from '../models/id-generation-response.model';

@Injectable({ providedIn: 'root' })
export class ConnoteApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  getCarriers(): Observable<CarrierSummary[]> {
    return this.http
      .get<CarrierSummary[]>(`${this.baseUrl}/carriers`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  setupCarrier(body: CarrierSetupRequest): Observable<CarrierSummary> {
    return this.http
      .post<CarrierSummary>(`${this.baseUrl}/setup`, body)
      .pipe(catchError((error) => this.handleError(error)));
  }

  generateId(carrierName: string): Observable<IdGenerationResponse> {
    return this.http
      .post<IdGenerationResponse>(`${this.baseUrl}/generate`, { carrierName })
      .pipe(catchError((error) => this.handleError(error)));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const body = error.error as ErrorResponse | null;
    const message =
      body?.message?.trim() ||
      error.message ||
      'Something went wrong. Please try again.';
    return throwError(() => new ApiError(message, error.status));
  }
}
