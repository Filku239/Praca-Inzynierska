import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';

interface LoginResponse {
  token: string;
  username: string;
  email: string;
  role: string;
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private userKey = 'loggedUser';
  private tokenKey = 'token';

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('http://localhost:3000/users/admin/login', { email, password })
      .pipe(
        tap(res => {
          localStorage.setItem(this.tokenKey, res.token);
          localStorage.setItem(this.userKey, JSON.stringify(res));
        })
      );
  }

  getUser() {
    return JSON.parse(localStorage.getItem(this.userKey) || 'null');
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.router.navigate(['/login']);
  }
}
