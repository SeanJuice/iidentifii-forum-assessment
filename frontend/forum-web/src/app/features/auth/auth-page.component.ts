import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth-page',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto grid min-h-[calc(100vh-72px)] max-w-7xl place-items-center px-4 py-12 sm:px-6 lg:px-8">
      <section class="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 lg:grid-cols-[0.9fr_1.1fr]">
        <div class="relative hidden overflow-hidden bg-slate-950 p-10 text-white lg:block">
          <div class="absolute -left-24 -top-24 size-72 rounded-full bg-violet-600/60 blur-3xl"></div>
          <div class="relative flex h-full flex-col justify-between">
            <div>
              <span class="grid size-11 place-items-center rounded-xl bg-violet-600 text-lg font-black">ii</span>
              <h1 class="mt-10 text-4xl font-black tracking-tight">Knowledge moves faster when we share it.</h1>
              <p class="mt-4 leading-7 text-slate-300">Join engineers and partners building secure, reliable integrations.</p>
            </div>
            <p class="text-sm font-semibold text-slate-400">Secure • Searchable • Moderated</p>
          </div>
        </div>

        <div class="p-6 sm:p-10">
          <p class="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-600">iiDENTIFii Forum</p>
          <h2 class="mt-3 text-3xl font-black tracking-tight text-slate-950">
            {{ isRegister ? 'Create your account' : 'Welcome back' }}
          </h2>
          <p class="mt-2 text-sm text-slate-500">
            {{ isRegister ? 'Start contributing to trusted integration knowledge.' : 'Log in to post, comment and like discussions.' }}
          </p>

          @if (errorMessage()) {
            <div class="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
              {{ errorMessage() }}
            </div>
          }

          <form class="mt-8 grid gap-5" [formGroup]="form" (ngSubmit)="submit()">
            @if (isRegister) {
              <label class="grid gap-2 text-sm font-bold text-slate-700">
                Display name
                <input type="text" formControlName="displayName" autocomplete="name" class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal focus:border-violet-400 focus:bg-white" placeholder="Shaun Mlangeni">
              </label>
            }

            <label class="grid gap-2 text-sm font-bold text-slate-700">
              Email address
              <input type="email" formControlName="email" autocomplete="email" class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal focus:border-violet-400 focus:bg-white" placeholder="you@example.com">
            </label>

            <label class="grid gap-2 text-sm font-bold text-slate-700">
              Password
              <input type="password" formControlName="password" [autocomplete]="isRegister ? 'new-password' : 'current-password'" class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal focus:border-violet-400 focus:bg-white" placeholder="At least 8 characters">
            </label>

            <button type="submit" class="mt-1 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60" [disabled]="loading()">
              {{ loading() ? 'Please wait…' : (isRegister ? 'Create account' : 'Log in') }}
            </button>
          </form>

          <p class="mt-7 text-center text-sm text-slate-500">
            {{ isRegister ? 'Already registered?' : 'New to the forum?' }}
            <a [routerLink]="isRegister ? '/login' : '/register'" class="font-extrabold text-violet-700 hover:text-violet-800">
              {{ isRegister ? 'Log in' : 'Create an account' }}
            </a>
          </p>
        </div>
      </section>
    </main>
  `,
})
export class AuthPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly isRegister = this.route.snapshot.data['mode'] === 'register';
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly form = this.formBuilder.nonNullable.group({
    displayName: [
      '',
      this.isRegister ? [Validators.required, Validators.minLength(2)] : [],
    ],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Please complete all required fields correctly.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();
    const request = this.isRegister
      ? this.auth.register({
          displayName: value.displayName,
          email: value.email,
          password: value.password,
        })
      : this.auth.login({ email: value.email, password: value.password });

    request
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
          void this.router.navigateByUrl(returnUrl);
        },
        error: (error: HttpErrorResponse) => {
          const detail = this.readErrorDetail(error);
          this.errorMessage.set(detail);
        },
      });
  }

  private readErrorDetail(error: HttpErrorResponse): string {
    if (typeof error.error?.detail === 'string') {
      return error.error.detail;
    }

    return 'The request could not be completed. Please check your details and try again.';
  }
}
