import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminNavbarComponent } from '../../admin-navbar/admin-navbar';
import { ReservationService } from '../../core/services/reservation';
import { ReservationModel } from '../../core/services/reservation';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [AdminNavbarComponent, CommonModule, FormsModule],
  templateUrl: './reservation.html',
  styleUrls: ['./reservation.css']
})
export class Reservation implements OnInit {
  sortBy: 'none' | 'cost' | 'duration' = 'none';
  sortDir: 'asc' | 'desc' = 'asc';

  reservations: ReservationModel[] = [];
  filteredReservations: ReservationModel[] = [];

  loading = true;
  error = '';

  searchTerm = '';
  editingReservation: ReservationModel | null = null;

  constructor(
    private reservationService: ReservationService,
    private ngZone: NgZone,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.loading = true;
    this.reservationService.getAll().subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.reservations = data;
          this.applyFilter();
          this.loading = false;
          this.cd.detectChanges();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.error = 'Nie udało się pobrać rezerwacji';
          this.loading = false;
          this.cd.detectChanges();
        });
      }
    });
  }

  getDurationInDays(r: ReservationModel): number {
  const start = new Date(r.startDate).getTime();
  const end = new Date(r.endDate).getTime();
  const diff = end - start;
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}


  applyFilter(): void {
  const term = this.searchTerm.toLowerCase();

  let result = this.reservations.filter(r => {
    const make = r.vehicle?.make?.toLowerCase() || '';
    const model = r.vehicle?.model?.toLowerCase() || '';

    return (
      term === '' ||
      make.includes(term) ||
      model.includes(term)
    );
  });

  // SORTOWANIE
  if (this.sortBy !== 'none') {
    result = result.sort((a, b) => {
      let aVal = 0;
      let bVal = 0;

      if (this.sortBy === 'cost') {
        aVal = a.cost;
        bVal = b.cost;
      }

      if (this.sortBy === 'duration') {
        aVal = this.getDurationInDays(a);
        bVal = this.getDurationInDays(b);
      }

      return this.sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }

  this.filteredReservations = result;
}


onSortChange(): void {
  this.applyFilter();
}

toggleSortDir(): void {
  this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
  this.applyFilter();
}



  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.applyFilter();
  }

  startEdit(reservation: ReservationModel): void {
    this.editingReservation = { ...reservation };
  }

  saveEdit(): void {
    if (!this.editingReservation) return;

    this.reservationService.update(
      this.editingReservation._id,
      {
        startDate: this.editingReservation.startDate,
        endDate: this.editingReservation.endDate
      }
    ).subscribe({
      next: (updated) => {
        this.ngZone.run(() => {
          const index = this.reservations.findIndex(r => r._id === updated._id);
          if (index > -1) this.reservations[index] = updated;
          this.applyFilter();
          this.editingReservation = null;
          this.cd.detectChanges();
        });
      },


      error: () => alert('Nie udało się zapisać zmian')
    });
  }

  cancelEdit(): void {
    this.editingReservation = null;
  }

  deleteReservation(reservation: ReservationModel): void {
    if (!confirm('Czy na pewno chcesz usunąć rezerwację?')) return;

    this.reservationService.delete(reservation._id).subscribe({
      next: () => {
        this.ngZone.run(() => {
          this.reservations = this.reservations.filter(r => r._id !== reservation._id);
          this.applyFilter();
          this.cd.detectChanges();
        });
      },
      error: () => alert('Nie udało się usunąć rezerwacji')
    });
  }
}
