  import { Injectable } from '@angular/core';
  import { HttpClient, HttpHeaders } from '@angular/common/http';
  import { Observable } from 'rxjs';

  @Injectable({ providedIn: 'root' })
  export class UserService {

    private api = 'http://localhost:3000/admin';
    constructor(private http: HttpClient) {}

    getUsers(): Observable<any> {
      return this.http.get(`${this.api}/users`, this.auth());
    }

    deleteUser(id: string): Observable<any> {
      return this.http.delete(`${this.api}/users/${id}`, this.auth());
    }

    updateRole(id: string, role: string): Observable<any> {
      return this.http.patch(`${this.api}/users/${id}/role`, { role }, this.auth());
    }

    updateUser(id: string, data: any): Observable<any> {
      return this.http.patch(`${this.api}/users/${id}`, data, this.auth());
    }

    private auth() {
      return {
        headers: new HttpHeaders({
          Authorization: 'Bearer ' + localStorage.getItem('token')
        })
      };
    }
  }
