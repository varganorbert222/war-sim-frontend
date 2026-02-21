import { Inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DetailedUnit } from '../models/detailed-unit';
import { API_CONFIG, ApiConfig, buildApiUrl } from '../config/api.config';

@Injectable({ providedIn: 'root' })
export class UnitDetailsService {
  constructor(
    private readonly http: HttpClient,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig,
  ) {}

  getUnitDetails(
    unitId: string,
    requestorFactionId?: number,
  ): Observable<DetailedUnit> {
    return this.http.get<DetailedUnit>(
      buildApiUrl(this.apiConfig.apiBaseUrl, `unitdetails/${unitId}`),
      {
        params: this.buildParams({ requestorFactionId }),
      },
    );
  }

  getAllUnitsDetails(
    factionId?: number,
    requestorFactionId?: number,
  ): Observable<DetailedUnit[]> {
    return this.http.get<DetailedUnit[]>(
      buildApiUrl(this.apiConfig.apiBaseUrl, 'unitdetails'),
      {
        params: this.buildParams({ factionId, requestorFactionId }),
      },
    );
  }

  getNearbyUnits(
    latitude: number,
    longitude: number,
    radiusMeters = 10000,
    requestorFactionId?: number,
  ): Observable<DetailedUnit[]> {
    return this.http.get<DetailedUnit[]>(
      buildApiUrl(this.apiConfig.apiBaseUrl, 'unitdetails/nearby'),
      {
        params: this.buildParams({
          latitude,
          longitude,
          radiusMeters,
          requestorFactionId,
        }),
      },
    );
  }

  getVisibleUnits(unitId: string): Observable<DetailedUnit[]> {
    return this.http.get<DetailedUnit[]>(
      buildApiUrl(this.apiConfig.apiBaseUrl, `unitdetails/${unitId}/visible`),
    );
  }

  private buildParams(values: Record<string, number | undefined>): HttpParams {
    let params = new HttpParams();

    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params = params.set(key, String(value));
      }
    });

    return params;
  }
}
