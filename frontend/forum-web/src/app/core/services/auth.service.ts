import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserResponse,
} from '../models/forum.models';

export const AUTH_TOKEN_KEY = 'forum.accessToken';
const AUTH_USER_KEY = 'forum.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly userState = signal<UserResponse | null>(this.readStoredUser());

  readonly user = this.userState.asReadonly();
  readonly isAuthenticated = computed(() => this.user() !== null && this.hasToken());
  readonly isModerator = computed(() => this.user()?.roles.includes('Moderator') ?? false);

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/auth/register`, request)
      .pipe(tap((response) => this.saveSession(response)));
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiBaseUrl}/auth/login`, request)
      .pipe(tap((response) => this.saveSession(response)));
  }

  logout(): void {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
    this.userState.set(null);
  }

  private saveSession(response: AuthResponse): void {
    sessionStorage.setItem(AUTH_TOKEN_KEY, response.accessToken);
    sessionStorage.setItem(AUTH_USER_KEY, JSON.stringify(response.user));
    this.userState.set(response.user);
  }

  private hasToken(): boolean {
    return sessionStorage.getItem(AUTH_TOKEN_KEY) !== null;
  }

  private readStoredUser(): UserResponse | null {
    const rawUser = sessionStorage.getItem(AUTH_USER_KEY);
    if (!rawUser || !this.hasToken()) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as UserResponse;
    } catch {
      sessionStorage.removeItem(AUTH_USER_KEY);
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      return null;
    }
  }
}

