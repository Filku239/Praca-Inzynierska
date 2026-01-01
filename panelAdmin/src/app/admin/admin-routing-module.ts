import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Dashboard } from './dashboard/dashboard';
import { Vehicles } from './vehicles/vehicles';
import { Users } from './users/users';
import { Reservation } from './reservation/reservation';
import { AuthGuard } from '../auth/auth-guard';

const routes: Routes = [
  { path: '', component: Dashboard, canActivate: [AuthGuard] },
  { path: 'vehicles', component: Vehicles, canActivate: [AuthGuard] },
  { path: 'users', component: Users, canActivate: [AuthGuard] },
  { path: 'reservations', component: Reservation, canActivate: [AuthGuard] },
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
