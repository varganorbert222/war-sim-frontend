import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { Projectile } from '../models/projectile';
import { NotificationService } from './notification.service';

const CACHE_KEY = 'projectiles-cache';

@Injectable({ providedIn: 'root' })
export class ProjectileService {
  private baseUrl = '/api';

  constructor(
    private http: HttpClient,
    private notify: NotificationService,
  ) {}

  getProjectiles(): Observable<Projectile[]> {
    return this.http.get<Projectile[]>(`${this.baseUrl}/projectiles`).pipe(
      tap((list) => {
        localStorage.setItem(CACHE_KEY, JSON.stringify(list));
        this.notify.success('PROJECTILES_LOADED');
      }),
      catchError((err) => {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          this.notify.info('CACHED_PROJECTILES');
          return of(JSON.parse(cached));
        }
        this.notify.error('FAILED_PROJECTILES');
        return throwError(() => err);
      }),
    );
  }
}
