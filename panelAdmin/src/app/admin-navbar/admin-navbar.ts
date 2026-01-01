import { Component, OnInit } from '@angular/core';
import { AuthService } from '../core/services/auth'; 
import { RouterModule, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common'; 

interface UserInfo {
  username: string;
  role: string;
}

@Component({
  selector: 'app-admin-navbar',
  templateUrl: './admin-navbar.html',
  standalone: true,
  styleUrls: ['./admin-navbar.css'],
  imports: [
    CommonModule,        
    RouterModule         
  ]
})
export class AdminNavbarComponent implements OnInit {

  userInfo: UserInfo | null = null;
  
  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    const user = this.authService.getUser();
    if (user) {
      this.userInfo = {
        username: user.username,
        role: user.role
      };
    }
  }

  onLogout(): void {
    this.authService.logout();
  }
}