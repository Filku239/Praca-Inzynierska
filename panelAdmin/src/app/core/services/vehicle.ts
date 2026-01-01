import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

export interface VehicleModel {
  _id: string;
  name?: string;
  make?: string;
  model?: string;
  type: string;
  available: boolean;
  accepted: boolean;
  color?: string;
  mileage?: number;
  rentalPricePerDay?: number;
  year?: number;
  image?: string;
  location?: string;
  user?: string;
}


@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  private apiUrl = 'http://localhost:3000/vehicles';

  constructor(private http: HttpClient) {}

  getAll(): Observable<VehicleModel[]> {
    return this.http.get<VehicleModel | VehicleModel[]>(this.apiUrl).pipe(
      map(data => Array.isArray(data) ? data : [data]),
      tap((data: VehicleModel[]) => console.log('Serwis otrzymał dane:', data))
    );
  }

  getById(id: string): Observable<VehicleModel> {
    return this.http.get<VehicleModel>(`${this.apiUrl}/${id}`);
  }

  update(id: string, data: Partial<VehicleModel>): Observable<VehicleModel> {
    return this.http.put<VehicleModel>(`${this.apiUrl}/${id}`, data);
  }

  delete(id: string): Observable<VehicleModel> {
    return this.http.delete<VehicleModel>(`${this.apiUrl}/${id}`);
  }

  accept(id: string): Observable<VehicleModel> {
    return this.http.post<VehicleModel>(`${this.apiUrl}/${id}/rental`, {});
  }
}
