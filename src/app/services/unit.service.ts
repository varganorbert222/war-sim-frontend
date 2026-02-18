import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Unit } from '../models/unit';

@Injectable({ providedIn: 'root' })
export class UnitService {
  private baseUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  getUnits(): Observable<Unit[]> {
    return this.http.get<Unit[]>(`${this.baseUrl}/units`);
  }
}
