import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthorFilterResponse, CommentResponse, PostDetailResponse } from '../../core/models/forum.models';
import { AuthService } from '../../core/services/auth.service';
import { ForumApiService } from '../../core/services/forum-api.service';

@Component({
  selector: 'app-post-detail-page',
  imports: [DatePipe, FormsModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <a routerLink="/" class="text-sm font-bold text-violet-700 hover:text-violet-800">← Back to discussions</a>

      @if (loading()) {
        <div class="mt-5 h-96 animate-pulse rounded-3xl border border-slate-200 bg-white" aria-label="Loading discussion"></div>
      } @else if (errorMessage()) {
        <section class="mt-5 rounded-3xl border border-red-200 bg-red-50 p-8 text-center">
          <h1 class="text-2xl font-black text-slate-950">Discussion unavailable</h1>
          <p class="mt-2 text-sm text-red-700">{{ errorMessage() }}</p>
        </section>
      } @else if (post(); as discussion) {
        <article class="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-10">
          <div class="flex flex-wrap items-center gap-2">
            @for (topic of discussion.topics; track topic) {
              <span class="rounded-full bg-violet-50 px-3 py-1 text-xs font-extrabold text-violet-700">{{ topic }}</span>
            }
            @if (discussion.moderationTag) {
              <span class="rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700">
                Misleading or false information
              </span>
            }
          </div>

          <h1 class="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{{ discussion.title }}</h1>
          <div class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            <span class="font-extrabold text-slate-800">{{ discussion.author.displayName }}</span>
            <span aria-hidden="true">•</span>
            <time [dateTime]="discussion.createdAt">{{ discussion.createdAt | date: 'medium' }}</time>
            <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold">{{ discussion.author.role }}</span>
          </div>

          <div class="mt-8 whitespace-pre-wrap text-base leading-8 text-slate-700">{{ discussion.content }}</div>

          <div class="mt-9 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-6">
            <button
              type="button"
              class="rounded-xl border px-4 py-2.5 text-sm font-extrabold transition disabled:cursor-not-allowed disabled:opacity-50"
              [class.border-violet-300]="discussion.likedByCurrentUser"
              [class.bg-violet-50]="discussion.likedByCurrentUser"
              [class.text-violet-700]="discussion.likedByCurrentUser"
              [class.border-slate-200]="!discussion.likedByCurrentUser"
              [class.text-slate-600]="!discussion.likedByCurrentUser"
              [disabled]="actionLoading() || isOwnPost()"
              (click)="toggleLike()"
            >
              ▲ {{ discussion.likeCount }} {{ discussion.likedByCurrentUser ? 'Liked' : 'Like' }}
            </button>
            @if (isOwnPost()) {
              <span class="text-xs font-semibold text-slate-400">You cannot like your own post.</span>
            }
            @if (auth.isModerator() && !discussion.moderationTag) {
              <button
                type="button"
                class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-extrabold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                [disabled]="actionLoading()"
                (click)="markMisleading()"
              >
                Mark as misleading
              </button>
            }
          </div>

          @if (actionError()) {
            <p class="mt-3 text-sm font-semibold text-red-700" role="alert">{{ actionError() }}</p>
          }
        </article>

        <section class="mt-7 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
          <div class="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 class="text-2xl font-black tracking-tight text-slate-950">{{ discussion.commentCount }} answers</h2>
              <p class="mt-1 text-sm text-slate-500">Browse answers without loading the whole conversation at once.</p>
            </div>
            <label class="text-sm font-extrabold text-slate-800">
              Sort answers
              <select
                class="mt-1 block rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
                [ngModel]="commentSort()"
                (ngModelChange)="setCommentSort($event)"
              >
                <option value="desc">Newest first</option>
                <option value="asc">Oldest first</option>
              </select>
            </label>
          </div>

          @if (auth.isAuthenticated()) {
            <form class="mt-6" [formGroup]="commentForm" (ngSubmit)="addComment()">
              <label for="comment" class="text-sm font-extrabold text-slate-800">Add your answer</label>
              <textarea
                id="comment"
                rows="5"
                formControlName="content"
                maxlength="4000"
                class="mt-2 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 leading-7 focus:border-violet-400 focus:bg-white"
                placeholder="Share a clear, constructive answer."
              ></textarea>
              <div class="mt-3 flex justify-end">
                <button type="submit" class="rounded-xl bg-violet-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-violet-700 disabled:opacity-50" [disabled]="commentLoading()">
                  {{ commentLoading() ? 'Posting…' : 'Post answer' }}
                </button>
              </div>
            </form>
          } @else {
            <div class="mt-6 rounded-xl bg-slate-50 px-5 py-4 text-sm text-slate-600">
              <a [routerLink]="['/login']" [queryParams]="{ returnUrl: currentUrl }" class="font-extrabold text-violet-700">Log in</a>
              to add an answer or like this discussion.
            </div>
          }

          <div class="mt-8 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.4fr_auto] lg:items-end">
              <label class="text-xs font-bold text-slate-500">
                From
                <input
                  type="date"
                  class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  [ngModel]="commentFromDate()"
                  (ngModelChange)="commentFromDate.set($event)"
                >
              </label>
              <label class="text-xs font-bold text-slate-500">
                To
                <input
                  type="date"
                  class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  [ngModel]="commentToDate()"
                  (ngModelChange)="commentToDate.set($event)"
                >
              </label>
              <label class="text-xs font-bold text-slate-500">
                Answered by
                <select
                  class="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  [ngModel]="commentAuthorId()"
                  (ngModelChange)="commentAuthorId.set($event)"
                >
                  <option value="">All contributors</option>
                  @for (author of authors(); track author.id) {
                    <option [value]="author.id">{{ author.displayName }}</option>
                  }
                </select>
              </label>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="rounded-xl bg-violet-600 px-4 py-2 text-sm font-extrabold text-white hover:bg-violet-700"
                  (click)="applyCommentFilters()"
                >
                  Apply
                </button>
                <button
                  type="button"
                  class="rounded-xl px-3 py-2 text-sm font-extrabold text-slate-600 hover:bg-white"
                  (click)="clearCommentFilters()"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          @if (commentsError()) {
            <p class="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
              {{ commentsError() }}
            </p>
          }

          <div class="mt-8 grid gap-5" [attr.aria-busy]="commentsLoading()">
            @if (commentsLoading()) {
              @for (item of commentLoadingItems; track item) {
                <div class="h-32 animate-pulse rounded-2xl bg-slate-100"></div>
              }
            }
            @for (comment of comments(); track comment.id) {
              <article class="rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <div class="flex flex-wrap items-center gap-2 text-sm">
                  <span class="font-extrabold text-slate-900">{{ comment.author.displayName }}</span>
                  <span class="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-500">{{ comment.author.role }}</span>
                  <time class="text-xs text-slate-400" [dateTime]="comment.createdAt">{{ comment.createdAt | date: 'medium' }}</time>
                </div>
                <p class="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">{{ comment.content }}</p>
              </article>
            } @empty {
              @if (!commentsLoading()) {
              <div class="rounded-2xl border border-dashed border-slate-300 px-6 py-10 text-center text-sm text-slate-500">
                No answers match these filters yet.
              </div>
              }
            }
          </div>

          @if (commentTotalPages() > 1) {
            <nav class="mt-7 flex items-center justify-between" aria-label="Answer pagination">
              <button
                type="button"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-40"
                [disabled]="commentPage() <= 1 || commentsLoading()"
                (click)="setCommentPage(commentPage() - 1)"
              >
                Previous
              </button>
              <p class="text-sm font-semibold text-slate-500">Page {{ commentPage() }} of {{ commentTotalPages() }}</p>
              <button
                type="button"
                class="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-40"
                [disabled]="commentPage() >= commentTotalPages() || commentsLoading()"
                (click)="setCommentPage(commentPage() + 1)"
              >
                Next
              </button>
            </nav>
          }
        </section>
      }
    </main>
  `,
})
export class PostDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ForumApiService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly auth = inject(AuthService);
  readonly post = signal<PostDetailResponse | null>(null);
  readonly loading = signal(true);
  readonly actionLoading = signal(false);
  readonly commentLoading = signal(false);
  readonly errorMessage = signal('');
  readonly actionError = signal('');
  readonly comments = signal<CommentResponse[]>([]);
  readonly authors = signal<AuthorFilterResponse[]>([]);
  readonly commentsLoading = signal(false);
  readonly commentsError = signal('');
  readonly commentPage = signal(1);
  readonly commentTotalItems = signal(0);
  readonly commentTotalPages = signal(0);
  readonly commentSort = signal<'asc' | 'desc'>('desc');
  readonly commentFromDate = signal('');
  readonly commentToDate = signal('');
  readonly commentAuthorId = signal('');
  readonly commentPageSize = 10;
  readonly commentLoadingItems = [1, 2];
  readonly currentUrl = this.router.url;
  readonly isOwnPost = computed(() => this.auth.user()?.id === this.post()?.author.id);
  readonly commentForm = this.formBuilder.nonNullable.group({
    content: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(4000)]],
  });

  private postId = '';

  ngOnInit(): void {
    this.postId = this.route.snapshot.paramMap.get('id') ?? '';
    if (!this.postId) {
      this.loading.set(false);
      this.errorMessage.set('The discussion identifier is missing.');
      return;
    }

    this.loadAuthors();
    this.loadPost();
  }

  toggleLike(): void {
    const currentPost = this.post();
    if (!currentPost || this.isOwnPost()) {
      return;
    }

    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.currentUrl } });
      return;
    }

    this.actionLoading.set(true);
    this.actionError.set('');
    const request = currentPost.likedByCurrentUser
      ? this.api.unlikePost(this.postId)
      : this.api.likePost(this.postId);
    request
      .pipe(
        finalize(() => this.actionLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.post.update((post) =>
            post
              ? {
                  ...post,
                  likedByCurrentUser: !post.likedByCurrentUser,
                  likeCount: post.likeCount + (post.likedByCurrentUser ? -1 : 1),
                }
              : post,
          );
        },
        error: (error: HttpErrorResponse) => this.actionError.set(this.readError(error, 'The like could not be updated.')),
      });
  }

  addComment(): void {
    if (this.commentForm.invalid) {
      this.commentForm.markAllAsTouched();
      this.actionError.set('Please enter an answer of at least two characters.');
      return;
    }

    this.commentLoading.set(true);
    this.actionError.set('');
    this.api
      .addComment(this.postId, this.commentForm.getRawValue().content)
      .pipe(
        finalize(() => this.commentLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.post.update((post) =>
            post ? { ...post, commentCount: post.commentCount + 1 } : post,
          );
          this.commentForm.reset();
          this.commentSort.set('desc');
          this.commentPage.set(1);
          this.loadComments();
        },
        error: (error: HttpErrorResponse) => this.actionError.set(this.readError(error, 'The answer could not be posted.')),
      });
  }

  markMisleading(): void {
    this.actionLoading.set(true);
    this.actionError.set('');
    this.api
      .moderatePost(this.postId)
      .pipe(
        finalize(() => this.actionLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.loadPost(false),
        error: (error: HttpErrorResponse) => this.actionError.set(this.readError(error, 'The moderation tag could not be added.')),
      });
  }

  setCommentSort(value: 'asc' | 'desc'): void {
    this.commentSort.set(value);
    this.commentPage.set(1);
    this.loadComments();
  }

  applyCommentFilters(): void {
    this.commentPage.set(1);
    this.loadComments();
  }

  clearCommentFilters(): void {
    this.commentFromDate.set('');
    this.commentToDate.set('');
    this.commentAuthorId.set('');
    this.commentPage.set(1);
    this.loadComments();
  }

  setCommentPage(page: number): void {
    if (page < 1 || page > this.commentTotalPages()) {
      return;
    }

    this.commentPage.set(page);
    this.loadComments();
  }

  private loadComments(): void {
    this.commentsLoading.set(true);
    this.commentsError.set('');
    this.api
      .getComments(this.postId, {
        page: this.commentPage(),
        pageSize: this.commentPageSize,
        sortDirection: this.commentSort(),
        fromDate: this.toStartOfDay(this.commentFromDate()),
        toDate: this.toEndOfDay(this.commentToDate()),
        authorId: this.commentAuthorId() || undefined,
      })
      .pipe(
        finalize(() => this.commentsLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => {
          this.comments.set(response.items);
          this.commentTotalItems.set(response.totalItems);
          this.commentTotalPages.set(response.totalPages);
        },
        error: () => {
          this.comments.set([]);
          this.commentsError.set('Answers could not be loaded.');
        },
      });
  }

  private loadAuthors(): void {
    this.api
      .getAuthors()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: (authors) => this.authors.set(authors) });
  }

  private loadPost(showLoading = true): void {
    if (showLoading) {
      this.loading.set(true);
    }
    this.errorMessage.set('');
    this.api
      .getPost(this.postId)
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (post) => {
          this.post.set(post);
          this.loadComments();
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            error.status === 404
              ? 'This discussion does not exist.'
              : 'The discussion could not be loaded. Confirm that the API is running.',
          );
        },
      });
  }

  private readError(error: HttpErrorResponse, fallback: string): string {
    return typeof error.error?.detail === 'string' ? error.error.detail : fallback;
  }

  private toStartOfDay(value: string): string | undefined {
    return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : undefined;
  }

  private toEndOfDay(value: string): string | undefined {
    return value ? new Date(`${value}T23:59:59.999Z`).toISOString() : undefined;
  }
}
