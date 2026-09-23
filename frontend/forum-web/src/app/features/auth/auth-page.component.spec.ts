import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthResponse } from '../../core/models/forum.models';
import { AuthService } from '../../core/services/auth.service';
import { AuthPageComponent } from './auth-page.component';

describe('AuthPageComponent', () => {
  let fixture: ComponentFixture<AuthPageComponent>;
  let component: AuthPageComponent;
  const login = vi.fn();

  beforeEach(async () => {
    login.mockReset();
    await TestBed.configureTestingModule({
      imports: [AuthPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: { mode: 'login' },
              queryParamMap: convertToParamMap({ returnUrl: '/posts/new' }),
            },
          },
        },
        { provide: AuthService, useValue: { login, register: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('rejects an invalid login form before calling the API', () => {
    component.submit();
    fixture.detectChanges();

    expect(login).not.toHaveBeenCalled();
    expect(component.form.touched).toBe(true);
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Please complete all required fields correctly.',
    );
  });

  it('submits valid credentials and returns to the requested page', () => {
    const response: AuthResponse = {
      accessToken: 'token',
      expiresAt: '2030-01-01T00:00:00Z',
      user: {
        id: 'user-id',
        displayName: 'Amina Patel',
        email: 'user@demo.local',
        roles: ['User'],
      },
    };
    const router = TestBed.inject(Router);
    const navigation = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    login.mockReturnValue(of(response));
    component.form.patchValue({
      email: 'user@demo.local',
      password: 'Password123!',
    });

    component.submit();

    expect(login).toHaveBeenCalledWith({
      email: 'user@demo.local',
      password: 'Password123!',
    });
    expect(navigation).toHaveBeenCalledWith('/posts/new');
  });
});
