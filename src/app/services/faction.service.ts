import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Faction } from '../models/faction';
import { NotificationService } from './notification.service';
import { API_CONFIG, ApiConfig, buildApiUrl } from '../config/api.config';

const CACHE_KEY = 'factions-cache';

@Injectable({ providedIn: 'root' })
export class FactionService {
  constructor(
    private http: HttpClient,
    private notify: NotificationService,
    @Inject(API_CONFIG) private readonly apiConfig: ApiConfig,
  ) {}

  getFactions(): Observable<Faction[]> {
    return this.http
      .get<Faction[]>(buildApiUrl(this.apiConfig.apiBaseUrl, 'factions'))
      .pipe(
        tap((f) => {
          localStorage.setItem(CACHE_KEY, JSON.stringify(f));
          this.notify.success('FACTIONS_LOADED');
        }),
        catchError((err) => {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            this.notify.info('CACHED_FACTIONS');
            return of(JSON.parse(cached));
          }
          this.notify.error('FAILED_FACTIONS');
          return throwError(() => err);
        }),
      );
  }
}
