import { Injectable, signal } from '@angular/core';
import { User } from '../models/auth.models';

const TOKEN_KEY = 'dentflow_access_token';
const USER_KEY = 'dentflow_user';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly userState = signal<User | null>(this.readUser());

  readonly user = this.userState.asReadonly();

  get token(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  hasValidToken(): boolean {
    const token = this.token;
    if (!token) {
      return false;
    }

    try {
      const payloadPart = token.split('.')[1];
      const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      const payload = JSON.parse(atob(padded)) as { exp?: number };
      const isValid = typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
      if (!isValid) {
        this.clear();
      }
      return isValid;
    } catch {
      this.clear();
      return false;
    }
  }

  save(token: string, user: User): void {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
    this.userState.set(user);
  }

  clear(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    this.userState.set(null);
  }

  private readUser(): User | null {
    const storedUser = sessionStorage.getItem(USER_KEY);
    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as User;
    } catch {
      sessionStorage.removeItem(USER_KEY);
      return null;
    }
  }
}
