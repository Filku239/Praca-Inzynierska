import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class Login {
  email = '';
  password = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    if (!this.email || !this.password) {
      alert('Uzupełnij wszystkie pola');
      return;
    }

    this.loading = true;

    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        // sprawdzamy czy ma uprawnienia admina
        if (res.role !== 'admin') {
          alert('Dostęp tylko dla administratora');
          this.authService.logout();
          this.loading = false;
          return;
        }
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        alert(err.error?.message || 'Błędny login lub hasło');
        this.loading = false;
      },
      complete: () => (this.loading = false),
    });
  }
}
