import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { TokenStorageService } from '../core/token-storage.service';
import { AdminUserCreateRequest, ApiError, AuthResponse, LoginRequest, RegisterRequest } from '../models/auth.models';
import { User } from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storage = inject(TokenStorageService);
  private readonly messageState = signal<string | null>(null);

  readonly user = this.storage.user;
  readonly message = this.messageState.asReadonly();

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/register`, request)
      .pipe(tap((response) => this.startSession(response)));
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, request)
      .pipe(tap((response) => this.startSession(response)));
  }

  logout(): void {
    this.storage.clear();
    this.messageState.set('Vous avez ete deconnecte.');
    void this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.storage.hasValidToken();
  }

  errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const apiError = error.error as Partial<ApiError> | null;
      if (apiError?.message) {
        return apiError.message;
      }
      if (error.status === 0) {
        return 'Le serveur est indisponible. Verifiez que le backend est demarre.';
      }
    }
    return "Une erreur inattendue s'est produite.";
  }

  getUserRole(): string | undefined {
    return this.storage.user()?.role;
  }
  getUserById(id: string | number): Observable<User> {
    return this.http.get<User>(`${environment.apiUrl}/users/${id}`);
  }

  private startSession(response: AuthResponse): void {
    this.storage.save(response.accessToken, response.user);
    this.messageState.set(response.message);
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${environment.apiUrl}/users`);
  }

  createUser(user: AdminUserCreateRequest): Observable<User> {
    return this.http.post<User>(`${environment.apiUrl}/users`, user);
  }

  updateUser(id: number, user: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${environment.apiUrl}/users/${id}`, user);
  }

  disableUser(id: number): Observable<User> {
    return this.http.delete<User>(`${environment.apiUrl}/users/${id}`);
  }
}
