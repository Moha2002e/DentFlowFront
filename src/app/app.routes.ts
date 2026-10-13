import { Routes } from '@angular/router';
import { adminGuard, authGuard, staffGuard } from './core/auth.guard';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { AdminUser } from './pages/admin/alluser/admin.user';
import { Patients } from './pages/patients/patients';
import { PatientRecordPage } from './pages/patients/patient-record';
import { Dentists } from './pages/dentists/dentists';
import { Appointments } from './pages/appointments/appointments';

export const routes: Routes = [
  { path: 'login', component: Login, title: 'Connexion - DentFlow' },
  { path: 'register', component: Register, title: 'Inscription - DentFlow' },
  { path: 'home', component: Home, canActivate: [authGuard], title: 'Accueil - DentFlow' },
  {
    path: 'patients',
    component: Patients,
    canActivate: [staffGuard],
    title: 'Patients - DentFlow',
  },
  {
    path: 'patients/:id',
    component: PatientRecordPage,
    canActivate: [staffGuard],
    title: 'Dossier patient - DentFlow',
  },
  {
    path: 'dentists',
    component: Dentists,
    canActivate: [authGuard],
    title: 'Dentistes - DentFlow',
  },
  {
    path: 'appointments',
    component: Appointments,
    canActivate: [staffGuard],
    title: 'Rendez-vous - DentFlow',
  },
  { path: 'alluser', component: AdminUser, canActivate: [adminGuard], title: 'Utilisateurs - DentFlow' },
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: '**', redirectTo: 'home' },
];
