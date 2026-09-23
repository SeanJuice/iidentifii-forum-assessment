import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { environment } from '../../../environments/environment';
import { AuthResponse } from '../models/forum.models';
import { AUTH_TOKEN_KEY, AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('stores a moderator session after login and clears it on logout', () => {
    const response: AuthResponse = {
      accessToken: 'test-token',
      expiresAt: '2030-01-01T00:00:00Z',
      user: {
        id: 'moderator-id',
        displayName: 'Moderator',
        email: 'moderator@demo.local',
        roles: ['Moderator'],
      },
    };

    service.login({ email: response.user.email, password: 'Password123!' }).subscribe();

    const request = http.expectOne(`${environment.apiBaseUrl}/auth/login`);
    expect(request.request.method).toBe('POST');
    request.flush(response);

    expect(service.isAuthenticated()).toBe(true);
    expect(service.isModerator()).toBe(true);
    expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBe('test-token');

    service.logout();

    expect(service.isAuthenticated()).toBe(false);
    expect(service.isModerator()).toBe(false);
    expect(sessionStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
  });
});
