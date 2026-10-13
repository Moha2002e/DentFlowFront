import { Injectable, signal } from '@angular/core';
import { User } from '../models/auth.models';

const TOKEN_KEY = 'dentflow_access_token';
const USER_KEY = 'dentflow_user';
/** Adresse memorisee pour pre-remplir le formulaire de connexion. */
const REMEMBERED_EMAIL_KEY = 'dentflow_remembered_email';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly userState = signal<User | null>(this.readUser());

  readonly user = this.userState.asReadonly();

  /**
   * Deux stockages selon le choix de l'utilisateur :
   * - sessionStorage : la session s'arrete a la fermeture de l'onglet (defaut) ;
   * - localStorage : « se souvenir de moi », la session survit au navigateur.
   * La lecture regarde les deux, l'ecriture n'en remplit qu'un seul.
   */
  get token(): string | null {
    return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
  }

  get rememberedEmail(): string | null {
    return localStorage.getItem(REMEMBERED_EMAIL_KEY);
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

  save(token: string, user: User, remember = false): void {
    // On vide les deux avant d'ecrire : sinon un ancien jeton reste dans l'autre
    // stockage et ressort a la prochaine lecture.
    this.removeSession();

    const store = remember ? localStorage : sessionStorage;
    store.setItem(TOKEN_KEY, token);
    store.setItem(USER_KEY, JSON.stringify(user));

    if (remember) {
      localStorage.setItem(REMEMBERED_EMAIL_KEY, user.email);
    } else {
      localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    }

    this.userState.set(user);
  }

  /** Deconnexion : le jeton part, l'adresse memorisee reste pour le prochain retour. */
  clear(): void {
    this.removeSession();
    this.userState.set(null);
  }

  /** Oublie aussi l'adresse pre-remplie. */
  forgetMe(): void {
    this.clear();
    localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  }

  private removeSession(): void {
    for (const store of [sessionStorage, localStorage]) {
      store.removeItem(TOKEN_KEY);
      store.removeItem(USER_KEY);
    }
  }

  private readUser(): User | null {
    const storedUser = sessionStorage.getItem(USER_KEY) ?? localStorage.getItem(USER_KEY);
    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as User;
    } catch {
      this.removeSession();
      return null;
    }
  }
}
