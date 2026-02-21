import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { MovementSnapshot } from '../models/movement-snapshot';
import { API_CONFIG, ApiConfig, buildApiUrl } from '../config/api.config';

const CACHE_KEY = 'movement-snapshot-cache';

@Injectable({ providedIn: 'root' })
export class MovementService {
  constructor(
    private http: HttpClient,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig,
  ) {}

  getSnapshot(): Observable<MovementSnapshot> {
    return this.http
      .get<MovementSnapshot>(
        buildApiUrl(this.apiConfig.apiBaseUrl, 'movement/snapshot'),
      )
      .pipe(
        tap((snapshot) => {
          localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
        }),
        catchError((err) => {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            return of(JSON.parse(cached) as MovementSnapshot);
          }

          return throwError(() => err);
        }),
      );
  }
}
