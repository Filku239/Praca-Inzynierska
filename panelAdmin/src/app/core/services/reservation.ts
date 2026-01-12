import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VehicleModel } from './vehicle';

export interface ReservationModel {
  _id: string;
  vehicle: VehicleModel;
  user: string;
  startDate: string; 
  endDate: string;  
  cost: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private apiUrl = 'http://localhost:3000/reservations';

  constructor(private http: HttpClient) {}

  getAll(): Observable<ReservationModel[]> {
    return this.http.get<ReservationModel[]>(this.apiUrl);
  }  getById(id: string): Observable<ReservationModel> {
    return this.http.get<ReservationModel>(`${this.apiUrl}/${id}`);
  }

  getByUser(userId: string): Observable<ReservationModel[]> {
    return this.http.get<ReservationModel[]>(`${this.apiUrl}/user/${userId}`);
  }

  create(data: {
    vehicleId: string;
    startDate: string;
    endDate: string;
    cost: number;
  }): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }

  update(id: string, data: {
    startDate: string;
    endDate: string;
  }): Observable<ReservationModel> {
    return this.http.put<ReservationModel>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
