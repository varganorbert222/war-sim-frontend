import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Unit } from '../models/unit';
import { NotificationService } from './notification.service';

const CACHE_KEY = 'units-cache';

@Injectable({ providedIn: 'root' })
export class UnitService {
  private baseUrl = 'http://localhost:5000/api';

  constructor(
    private http: HttpClient,
    private notify: NotificationService,
  ) {}

  getUnits(): Observable<Unit[]> {
    return this.http.get<Unit[]>(`${this.baseUrl}/units`).pipe(
      tap((units) => {
        // cache successful result
        localStorage.setItem(CACHE_KEY, JSON.stringify(units));
        this.notify.success('UNITS_LOADED');
      }),
      catchError((err) => {
        // try to recover from cache
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          this.notify.info('CACHED_UNITS');
          return of(JSON.parse(cached));
        }
        this.notify.error('FAILED_UNITS');
        return throwError(() => err);
      }),
    );
  }
}
