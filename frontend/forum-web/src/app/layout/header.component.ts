import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div class="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a routerLink="/" class="group flex items-center gap-3" aria-label="iiDENTIFii Forum home">
          <span class="grid size-10 place-items-center rounded-xl bg-violet-600 text-base font-black text-white shadow-lg shadow-violet-600/20 transition group-hover:-rotate-3" aria-hidden="true">ii</span>
          <span class="leading-tight">
            <span class="block text-sm font-extrabold tracking-tight text-slate-950">iiDENTIFii</span>
            <span class="block text-xs font-medium text-slate-500">Integration Forum</span>
          </span>
        </a>

        <nav class="hidden items-center gap-7 md:flex" aria-label="Primary navigation">
          <a routerLink="/" routerLinkActive="text-violet-700" [routerLinkActiveOptions]="{ exact: true }" class="text-sm font-semibold text-slate-600 transition hover:text-violet-700">Discussions</a>
          <a href="#topics" class="text-sm font-semibold text-slate-600 transition hover:text-violet-700">Topics</a>
          <a href="#community" class="text-sm font-semibold text-slate-600 transition hover:text-violet-700">Community</a>
        </nav>

        <div class="hidden items-center gap-3 md:flex">
          @if (auth.isAuthenticated()) {
            <a routerLink="/posts/new" class="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700">New post</a>
            <span class="text-sm font-bold text-slate-700">{{ auth.user()?.displayName }}</span>
            <button type="button" class="rounded-xl px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-100" (click)="logout()">Log out</button>
          } @else {
            <a routerLink="/login" class="rounded-xl px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100">Log in</a>
            <a routerLink="/register" class="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700">Join the forum</a>
          }
        </div>

        <button type="button" class="grid size-11 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 md:hidden" (click)="mobileOpen.update(open => !open)" [attr.aria-expanded]="mobileOpen()" aria-label="Toggle navigation">
          <span class="text-xl" aria-hidden="true">{{ mobileOpen() ? '×' : '☰' }}</span>
        </button>
      </div>

      @if (mobileOpen()) {
        <div class="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <nav class="mx-auto grid max-w-7xl gap-2" aria-label="Mobile navigation">
            <a routerLink="/" class="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700">Discussions</a>
            @if (auth.isAuthenticated()) {
              <a routerLink="/posts/new" class="rounded-lg bg-violet-600 px-3 py-2 text-center text-sm font-bold text-white">New post</a>
              <button type="button" class="rounded-lg px-3 py-2 text-left text-sm font-semibold text-slate-700" (click)="logout()">Log out</button>
            } @else {
              <a routerLink="/login" class="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700">Log in</a>
              <a routerLink="/register" class="rounded-lg bg-violet-600 px-3 py-2 text-center text-sm font-bold text-white">Join the forum</a>
            }
          </nav>
        </div>
      }
    </header>
  `,
})
export class HeaderComponent {
  readonly auth = inject(AuthService);
  readonly mobileOpen = signal(false);
  private readonly router = inject(Router);

  logout(): void {
    this.auth.logout();
    this.mobileOpen.set(false);
    void this.router.navigateByUrl('/');
  }
}
