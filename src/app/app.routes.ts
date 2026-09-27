import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { Home } from './pages/home/home';
import { Login } from './pages/login/login';
import { Register } from './pages/register/register';
import { AdminUser } from './pages/admin/alluser/admin.user';
import { adminGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login, title: 'Connexion - DentFlow' },
  { path: 'register', component: Register, title: 'Inscription - DentFlow' },
  { path: 'home', component: Home, canActivate: [authGuard], title: 'Accueil - DentFlow' },
  { path: 'alluser', component: AdminUser, canActivate: [adminGuard], title: 'Utilisateurs - DentFlow' },
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  { path: '**', redirectTo: 'home' },
];
