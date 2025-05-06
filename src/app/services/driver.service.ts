import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DriverService {
  private baseUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // Get all drivers
  getDrivers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/drivers`);
  }

  // Get all KPI history entries
  getKpiHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/kpis`);
  }

  getKpisByDriverId(driverId: number) {
    return this.http.get<any[]>(`${this.baseUrl}/kpis/driver/${driverId}`);
  }
}