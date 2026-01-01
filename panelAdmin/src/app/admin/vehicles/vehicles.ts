import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { VehicleService, VehicleModel } from '../../core/services/vehicle';
import { AdminNavbarComponent } from '../../admin-navbar/admin-navbar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-vehicles',
  templateUrl: './vehicles.html',
  standalone: true,
  imports: [AdminNavbarComponent, CommonModule, FormsModule],
  styleUrls: ['./vehicles.css']
})
export class Vehicles implements OnInit {
  vehicles: VehicleModel[] = [];
  filteredVehicles: VehicleModel[] = [];
  loading = true;
  error = '';
  searchTerm = '';
  filterStatus: 'all' | 'accepted' | 'notAccepted' = 'all';
  
  editingVehicle: VehicleModel | null = null;

  constructor(
    private vehicleService: VehicleService,
    private ngZone: NgZone,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadVehicles();
  }

  loadVehicles(): void {
    this.loading = true;
    this.vehicleService.getAll().subscribe({
      next: (data: VehicleModel[]) => {
        this.ngZone.run(() => {
          this.vehicles = Array.isArray(data) ? data : [data];
          this.applyFilter();
          this.loading = false;
          this.cd.detectChanges();
        });
      },
      error: (err) => {
        this.ngZone.run(() => {
          this.error = 'Nie udało się pobrać pojazdów';
          this.loading = false;
          this.cd.detectChanges();
        });
      }
    });
  }

  applyFilter(): void {
    this.filteredVehicles = this.vehicles.filter(v => {
      const matchesStatus =
        this.filterStatus === 'all' ||
        (this.filterStatus === 'accepted' && v.accepted) ||
        (this.filterStatus === 'notAccepted' && !v.accepted);

      const matchesSearch =
        this.searchTerm === '' ||
        (v.make && v.make.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (v.model && v.model.toLowerCase().includes(this.searchTerm.toLowerCase()));

      return matchesStatus && matchesSearch;
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.applyFilter();
  }

  onFilterChange(status: 'all' | 'accepted' | 'notAccepted'): void {
    this.filterStatus = status;
    this.applyFilter();
  }

  acceptVehicle(vehicle: VehicleModel): void {
    this.vehicleService.accept(vehicle._id).subscribe({
      next: () => {
        this.ngZone.run(() => {
          vehicle.accepted = true;
          this.applyFilter();
          this.cd.detectChanges();
        });
      },
      error: (err) => {
        console.error('Błąd akceptacji pojazdu:', err);
        alert('Nie udało się zaakceptować pojazdu');
      }
    });
  }

  deleteVehicle(vehicle: VehicleModel): void {
    if (confirm(`Czy na pewno chcesz usunąć pojazd ${vehicle.make} ${vehicle.model}?`)) {
      this.vehicleService.delete(vehicle._id).subscribe({
        next: () => {
          this.ngZone.run(() => {
            this.vehicles = this.vehicles.filter(v => v._id !== vehicle._id);
            this.applyFilter();
            this.cd.detectChanges();
          });
        },
        error: (err) => {
          console.error('Błąd usuwania pojazdu:', err);
          alert('Nie udało się usunąć pojazdu');
        }
      });
    }
  }

  startEdit(vehicle: VehicleModel): void {
    this.editingVehicle = { ...vehicle };
  }

  saveEdit(): void {
    if (!this.editingVehicle) return;

    this.vehicleService.update(this.editingVehicle._id, this.editingVehicle).subscribe({
      next: (updated: VehicleModel) => {
        this.ngZone.run(() => {
          const index = this.vehicles.findIndex(v => v._id === updated._id);
          if (index > -1) this.vehicles[index] = updated;
          this.applyFilter();
          this.editingVehicle = null;
          this.cd.detectChanges();
        });
      },
      error: (err) => {
        console.error('Błąd aktualizacji pojazdu:', err);
        alert('Nie udało się zaktualizować pojazdu');
      }
    });
  }

  cancelEdit(): void {
    this.editingVehicle = null;
  }
}
