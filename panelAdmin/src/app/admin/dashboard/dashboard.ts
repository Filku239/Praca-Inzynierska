import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AdminNavbarComponent } from '../../admin-navbar/admin-navbar';
import { AdminService } from '../../core/services/admin';

interface DashboardStats {
  vehicles: number;
  users: number;
  reservations: number;
}

@Component({  
  selector: 'dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule, AdminNavbarComponent, HttpClientModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {
  stats: DashboardStats = {
    vehicles: 0,
    users: 0,
    reservations: 0
  };
  isLoading: boolean = true;

  constructor(
    private router: Router,
    private adminService: AdminService,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.fetchStats();
  }

  fetchStats(): void {
    this.isLoading = true;
    this.adminService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.isLoading = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Błąd ładowania statystyk:', err);
        this.isLoading = false;
        this.cd.detectChanges();
      }
    });
  }

  goToView(path: string): void {
    this.router.navigate(['/admin', path]);
  }
}
