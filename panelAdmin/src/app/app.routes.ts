import { Routes } from '@angular/router';
import { Login } from './auth/login/login';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'admin', loadChildren: () => import('./admin/admin-module').then(m => m.AdminModule) },
  { path: '**', redirectTo: '/login' }
];
