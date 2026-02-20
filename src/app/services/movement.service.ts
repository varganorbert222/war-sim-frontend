import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { MovementSnapshot } from '../models/movement-snapshot';

const CACHE_KEY = 'movement-snapshot-cache';

@Injectable({ providedIn: 'root' })
export class MovementService {
  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  getSnapshot(): Observable<MovementSnapshot> {
    return this.http
      .get<MovementSnapshot>(`${this.baseUrl}/movement/snapshot`)
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
