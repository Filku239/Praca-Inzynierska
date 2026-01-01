import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { UserService } from '../../core/services/user';
import { AdminNavbarComponent } from '../../admin-navbar/admin-navbar';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNavbarComponent],  
  templateUrl: './users.html',
  styleUrls: ['./users.css'],
})
export class Users implements OnInit {

  users: any[] = [];
  loading = true;
  editingUser: any | null = null;
  error: string | null = null;

  constructor(
    private userService: UserService,
    private ngZone: NgZone,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getUsers().subscribe({
      next: (data: any[]) => {
        this.ngZone.run(() => {
          this.users = Array.isArray(data) ? data : [data];
          this.loading = false;
          this.cd.detectChanges();
        });
      },
      error: (err) => {
        console.error('Błąd pobierania użytkowników:', err);
        this.ngZone.run(() => {
          this.loading = false;
          this.cd.detectChanges();
        });
      }
    });
  }

  deleteUser(id: string) {
    if (!confirm("Na pewno usunąć użytkownika?")) return;
    this.userService.deleteUser(id).subscribe(() => this.loadUsers());
  }

  changeRole(id: string, role: string) {
    this.userService.updateRole(id, role).subscribe(() => this.loadUsers());
  }

  editUser(user: any) {
    this.editingUser = { ...user };
  }

  saveUser() {
    if (!this.editingUser) return;
    this.userService.updateUser(this.editingUser._id, this.editingUser).subscribe(() => {
      this.editingUser = null;
      this.loadUsers();
    });
  }

  cancelEdit() {
    this.editingUser = null;
  }
}
