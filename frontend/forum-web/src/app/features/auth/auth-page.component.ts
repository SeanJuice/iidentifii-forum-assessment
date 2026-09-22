import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-page',
  imports: [FormsModule, RouterLink],
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
              <p class="mt-4 leading-7 text-slate-300">
                Join engineers and partners building secure, reliable integrations.
              </p>
            </div>
            <p class="text-sm font-semibold text-slate-400">Secure • Searchable • Moderated</p>
          </div>
        </div>

        <div class="p-6 sm:p-10">
          <p class="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-600">iiDENTIFii Forum</p>
          <h2 class="mt-3 text-3xl font-black tracking-tight text-slate-950">
            {{ isRegister() ? 'Create your account' : 'Welcome back' }}
          </h2>
          <p class="mt-2 text-sm text-slate-500">
            {{ isRegister() ? 'Start contributing to trusted integration knowledge.' : 'Log in to post, comment and like discussions.' }}
          </p>

          <form class="mt-8 grid gap-5" (submit)="$event.preventDefault()">
            @if (isRegister()) {
              <label class="grid gap-2 text-sm font-bold text-slate-700">
                Display name
                <input
                  type="text"
                  name="displayName"
                  autocomplete="name"
                  class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal focus:border-violet-400 focus:bg-white"
                  placeholder="Shaun Mlangeni"
                >
              </label>
            }

            <label class="grid gap-2 text-sm font-bold text-slate-700">
              Email address
              <input
                type="email"
                name="email"
                autocomplete="email"
                class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal focus:border-violet-400 focus:bg-white"
                placeholder="you@example.com"
              >
            </label>

            <label class="grid gap-2 text-sm font-bold text-slate-700">
              Password
              <input
                type="password"
                name="password"
                [autocomplete]="isRegister() ? 'new-password' : 'current-password'"
                class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal focus:border-violet-400 focus:bg-white"
                placeholder="At least 8 characters"
              >
            </label>

            <button
              type="submit"
              class="mt-1 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700"
            >
              {{ isRegister() ? 'Create account' : 'Log in' }}
            </button>
          </form>

          <p class="mt-7 text-center text-sm text-slate-500">
            {{ isRegister() ? 'Already registered?' : 'New to the forum?' }}
            <a
              [routerLink]="isRegister() ? '/login' : '/register'"
              class="font-extrabold text-violet-700 hover:text-violet-800"
            >
              {{ isRegister() ? 'Log in' : 'Create an account' }}
            </a>
          </p>
        </div>
      </section>
    </main>
  `,
})
export class AuthPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly isRegister = computed(() => this.route.snapshot.data['mode'] === 'register');
}

