import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ForumTopic, PostSort } from '../../core/models/forum.models';
import { ForumStateService } from '../../core/services/forum-state.service';
import { PostCardComponent } from './post-card.component';

@Component({
  selector: 'app-posts-page',
  imports: [FormsModule, RouterLink, PostCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main>
      <section class="relative overflow-hidden border-b border-slate-200 bg-slate-950 text-white">
        <div class="absolute inset-0 opacity-40" aria-hidden="true">
          <div class="absolute -left-32 -top-24 size-96 rounded-full bg-violet-600 blur-3xl"></div>
          <div class="absolute -right-24 top-8 size-80 rounded-full bg-cyan-500 blur-3xl"></div>
        </div>

        <div class="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-18 lg:grid-cols-[1fr_390px] lg:px-8">
          <div>
            <span class="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-violet-100">
              Built for trusted integration knowledge
            </span>
            <h1 class="mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
              Ask better questions.<br>
              Build stronger integrations.
            </h1>
            <p class="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              A searchable, moderated space where engineers and partners can share implementation guidance and solve integration challenges together.
            </p>

            <div class="mt-8 flex flex-wrap gap-3">
              <a
                routerLink="/register"
                class="rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-slate-950 shadow-lg transition hover:-translate-y-0.5"
              >
                Join the community
              </a>
              <a
                href="#discussions"
                class="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-white/15"
              >
                Browse discussions
              </a>
            </div>
          </div>

          <aside class="grid grid-cols-3 gap-3 self-end rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-xl lg:grid-cols-1">
            <div class="rounded-xl bg-white/8 p-4">
              <p class="text-2xl font-black">{{ forum.totalItems() }}</p>
              <p class="mt-1 text-xs font-semibold text-slate-400">Discussions</p>
            </div>
            <div class="rounded-xl bg-white/8 p-4">
              <p class="text-2xl font-black">{{ forum.totalAnswers() }}</p>
              <p class="mt-1 text-xs font-semibold text-slate-400">Answers on page</p>
            </div>
            <div class="rounded-xl bg-white/8 p-4">
              <p class="text-2xl font-black">{{ forum.totalContributors() }}</p>
              <p class="mt-1 text-xs font-semibold text-slate-400">Contributors</p>
            </div>
          </aside>
        </div>
      </section>

      <section id="discussions" class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div class="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p class="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-600">Knowledge exchange</p>
            <h2 class="mt-2 text-3xl font-black tracking-tight text-slate-950">Latest discussions</h2>
            <p class="mt-2 text-sm text-slate-500">Browse publicly. Log in to post, comment or like.</p>
          </div>
          <a
            [routerLink]="forumAuthTarget"
            class="w-fit rounded-xl bg-violet-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700"
          >
            Start a discussion
          </a>
        </div>

        <div class="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside id="topics" class="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
            <label for="post-search" class="text-sm font-extrabold text-slate-900">Search</label>
            <div class="relative mt-2">
              <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">⌕</span>
              <input
                id="post-search"
                type="search"
                class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-violet-400 focus:bg-white"
                placeholder="Search all discussions"
                [ngModel]="forum.query()"
                (ngModelChange)="forum.setQuery($event)"
              >
            </div>

            <fieldset class="mt-6">
              <legend class="text-sm font-extrabold text-slate-900">Topics</legend>
              <div class="mt-2 grid gap-1">
                @for (tag of forum.topics; track tag) {
                  <button
                    type="button"
                    class="flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold transition"
                    [class.bg-violet-50]="forum.selectedTopic() === tag"
                    [class.text-violet-700]="forum.selectedTopic() === tag"
                    [class.text-slate-600]="forum.selectedTopic() !== tag"
                    [class.hover:bg-slate-50]="forum.selectedTopic() !== tag"
                    (click)="selectTopic(tag)"
                  >
                    {{ tag }}
                    @if (forum.selectedTopic() === tag) {
                      <span aria-hidden="true">✓</span>
                    }
                  </button>
                }
              </div>
            </fieldset>

            <div class="mt-6 border-t border-slate-100 pt-5">
              <label for="post-author" class="text-sm font-extrabold text-slate-900">Author</label>
              <select
                id="post-author"
                class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700"
                [ngModel]="forum.selectedAuthorId()"
                (ngModelChange)="forum.setAuthor($event)"
              >
                <option value="">All authors</option>
                @for (author of forum.authors(); track author.id) {
                  <option [value]="author.id">{{ author.displayName }} ({{ author.postCount }})</option>
                }
              </select>
            </div>

            <fieldset class="mt-6 border-t border-slate-100 pt-5">
              <legend class="text-sm font-extrabold text-slate-900">Published date</legend>
              <div class="mt-2 grid grid-cols-2 gap-2">
                <label class="text-xs font-bold text-slate-500">
                  From
                  <input
                    type="date"
                    class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-sm font-semibold text-slate-700"
                    [ngModel]="forum.fromDate()"
                    (ngModelChange)="forum.setFromDate($event)"
                  >
                </label>
                <label class="text-xs font-bold text-slate-500">
                  To
                  <input
                    type="date"
                    class="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-sm font-semibold text-slate-700"
                    [ngModel]="forum.toDate()"
                    (ngModelChange)="forum.setToDate($event)"
                  >
                </label>
              </div>
              <button
                type="button"
                class="mt-3 w-full rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-extrabold text-violet-700 hover:bg-violet-100"
                (click)="forum.applyDateRange()"
              >
                Apply date range
              </button>
            </fieldset>

            <div class="mt-6 border-t border-slate-100 pt-5">
              <label for="post-moderation" class="text-sm font-extrabold text-slate-900">Moderation status</label>
              <select
                id="post-moderation"
                class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700"
                [ngModel]="forum.selectedModeration()"
                (ngModelChange)="forum.setModeration($event)"
              >
                <option value="all">All discussions</option>
                <option value="flagged">Flagged</option>
                <option value="unflagged">Not flagged</option>
              </select>
            </div>

            <div class="mt-6 border-t border-slate-100 pt-5">
              <label for="post-sort" class="text-sm font-extrabold text-slate-900">Sort by</label>
              <select
                id="post-sort"
                class="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-700"
                [ngModel]="forum.sort()"
                (ngModelChange)="selectSort($event)"
              >
                <option value="date">Most recent</option>
                <option value="likes">Most liked</option>
              </select>
            </div>

            @if (forum.hasActiveFilters()) {
              <button
                type="button"
                class="mt-5 w-full rounded-xl px-3 py-2 text-sm font-extrabold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                (click)="forum.clearFilters()"
              >
                Clear all filters
              </button>
            }
          </aside>

          <div>
            <div class="mb-4 flex items-center justify-between">
              <p class="text-sm font-semibold text-slate-500">
                {{ forum.totalItems() }} discussions found
              </p>
              <span class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                Public access
              </span>
            </div>

            @if (forum.errorMessage()) {
              <div class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
                {{ forum.errorMessage() }}
              </div>
            }

            @if (forum.loading()) {
              <div class="grid gap-4" aria-label="Loading discussions">
                @for (item of loadingItems; track item) {
                  <div class="h-52 animate-pulse rounded-2xl border border-slate-200 bg-white"></div>
                }
              </div>
            } @else {
              <div class="grid gap-4">
                @for (post of forum.posts(); track post.id) {
                  <app-post-card [post]="post" (like)="forum.toggleLike($event)" />
                } @empty {
                  <div class="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
                    <p class="text-lg font-extrabold text-slate-900">No discussions found</p>
                    <p class="mt-2 text-sm text-slate-500">Try another search term or topic.</p>
                  </div>
                }
              </div>
            }

            <nav class="mt-7 flex items-center justify-between" aria-label="Pagination">
              <button
                type="button"
                class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                [disabled]="forum.page() <= 1 || forum.loading()"
                (click)="forum.setPage(forum.page() - 1)"
              >
                Previous
              </button>
              <p class="text-sm font-semibold text-slate-500">Page {{ forum.page() }} of {{ forum.totalPages() || 1 }}</p>
              <button
                type="button"
                class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                [disabled]="forum.page() >= forum.totalPages() || forum.loading()"
                (click)="forum.setPage(forum.page() + 1)"
              >
                Next
              </button>
            </nav>
          </div>
        </div>
      </section>
    </main>
  `,
})
export class PostsPageComponent implements OnInit {
  readonly forum = inject(ForumStateService);
  readonly loadingItems = [1, 2, 3];
  readonly forumAuthTarget = '/posts/new';

  ngOnInit(): void {
    this.forum.loadAuthors();
    this.forum.loadPosts();
  }

  selectTopic(topic: ForumTopic | 'All'): void {
    this.forum.setTopic(topic);
  }

  selectSort(sort: PostSort): void {
    this.forum.setSort(sort);
  }
}
