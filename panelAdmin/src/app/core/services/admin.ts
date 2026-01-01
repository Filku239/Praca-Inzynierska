import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

interface DashboardStats {
  vehicles: number;
  users: number;
  reservations: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:3000/admin/stats';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  getDashboardStats(): Observable<DashboardStats> {
    const token = this.authService.getToken();

    if (!token) {
      console.error('Brak tokenu uwierzytelniającego.');
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<DashboardStats>(this.apiUrl, { headers: headers });
  }
}