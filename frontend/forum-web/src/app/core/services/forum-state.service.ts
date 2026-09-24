import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize, Subject } from 'rxjs';

import {
  AuthorFilterResponse,
  ForumTopic,
  PostListItemResponse,
  PostSort,
} from '../models/forum.models';
import { AuthService } from './auth.service';
import { ForumApiService } from './forum-api.service';

@Injectable({ providedIn: 'root' })
export class ForumStateService {
  private readonly api = inject(ForumApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly postsState = signal<PostListItemResponse[]>([]);
  private readonly searchChanges = new Subject<string>();
  private loadSequence = 0;

  readonly query = signal('');
  readonly selectedTopic = signal<ForumTopic | 'All'>('All');
  readonly selectedAuthorId = signal('');
  readonly selectedModeration = signal<'all' | 'flagged' | 'unflagged'>('all');
  readonly fromDate = signal('');
  readonly toDate = signal('');
  readonly sort = signal<PostSort>('date');
  readonly page = signal(1);
  readonly pageSize = 10;
  readonly totalItems = signal(0);
  readonly totalPages = signal(0);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly authors = signal<AuthorFilterResponse[]>([]);
  readonly topics: readonly (ForumTopic | 'All')[] = [
    'All',
    'API',
    'Integration',
    'Security',
    'SDK',
    'General',
  ];

  readonly posts = this.postsState.asReadonly();
  readonly hasActiveFilters = computed(
    () =>
      this.query().trim().length > 0 ||
      this.selectedTopic() !== 'All' ||
      this.selectedAuthorId().length > 0 ||
      this.selectedModeration() !== 'all' ||
      this.fromDate().length > 0 ||
      this.toDate().length > 0,
  );

  readonly totalContributors = computed(() => this.authors().length);
  readonly totalAnswers = computed(() =>
    this.postsState().reduce((total, post) => total + post.commentCount, 0),
  );

  constructor() {
    this.searchChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.page.set(1);
        this.loadPosts();
      });
  }

  loadPosts(): void {
    const selectedTopic = this.selectedTopic();
    const sequence = ++this.loadSequence;
    this.loading.set(true);
    this.errorMessage.set('');
    this.api
      .getPosts({
        page: this.page(),
        pageSize: this.pageSize,
        topic: selectedTopic === 'All' ? undefined : selectedTopic,
        search: this.query().trim() || undefined,
        fromDate: this.toStartOfDay(this.fromDate()),
        toDate: this.toEndOfDay(this.toDate()),
        authorId: this.selectedAuthorId() || undefined,
        flagged:
          this.selectedModeration() === 'all'
            ? undefined
            : this.selectedModeration() === 'flagged',
        sortBy: this.sort(),
        sortDirection: 'desc',
      })
      .pipe(
        finalize(() => {
          if (sequence === this.loadSequence) {
            this.loading.set(false);
          }
        }),
      )
      .subscribe({
        next: (response) => {
          if (sequence !== this.loadSequence) {
            return;
          }
          this.postsState.set(response.items);
          this.totalItems.set(response.totalItems);
          this.totalPages.set(response.totalPages);
        },
        error: () => {
          if (sequence !== this.loadSequence) {
            return;
          }
          this.postsState.set([]);
          this.errorMessage.set(
            'Discussions could not be loaded. Confirm that the API is running on port 5080.',
          );
        },
      });
  }

  setQuery(value: string): void {
    this.query.set(value);
    this.searchChanges.next(value.trim());
  }

  loadAuthors(): void {
    this.api.getAuthors().subscribe({
      next: (authors) => this.authors.set(authors),
      error: () => this.errorMessage.set('Contributors could not be loaded.'),
    });
  }

  setTopic(value: ForumTopic | 'All'): void {
    this.selectedTopic.set(value);
    this.page.set(1);
    this.loadPosts();
  }

  setSort(value: PostSort): void {
    this.sort.set(value);
    this.page.set(1);
    this.loadPosts();
  }

  setAuthor(authorId: string): void {
    this.selectedAuthorId.set(authorId);
    this.page.set(1);
    this.loadPosts();
  }

  setModeration(value: 'all' | 'flagged' | 'unflagged'): void {
    this.selectedModeration.set(value);
    this.page.set(1);
    this.loadPosts();
  }

  setFromDate(value: string): void {
    this.fromDate.set(value);
  }

  setToDate(value: string): void {
    this.toDate.set(value);
  }

  applyDateRange(): void {
    this.page.set(1);
    this.loadPosts();
  }

  clearFilters(): void {
    this.query.set('');
    this.selectedTopic.set('All');
    this.selectedAuthorId.set('');
    this.selectedModeration.set('all');
    this.fromDate.set('');
    this.toDate.set('');
    this.page.set(1);
    this.loadPosts();
  }

  setPage(value: number): void {
    if (value < 1 || value > this.totalPages()) {
      return;
    }

    this.page.set(value);
    this.loadPosts();
  }

  toggleLike(post: PostListItemResponse): void {
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/posts/${post.id}` },
      });
      return;
    }

    const request = post.likedByCurrentUser
      ? this.api.unlikePost(post.id)
      : this.api.likePost(post.id);
    request.subscribe({
      next: () => {
        this.postsState.update((posts) =>
          posts.map((item) =>
            item.id === post.id
              ? {
                  ...item,
                  likedByCurrentUser: !item.likedByCurrentUser,
                  likeCount: item.likeCount + (item.likedByCurrentUser ? -1 : 1),
                }
              : item,
          ),
        );
      },
      error: () => this.errorMessage.set('The like could not be updated.'),
    });
  }

  private toStartOfDay(value: string): string | undefined {
    return value ? new Date(`${value}T00:00:00.000Z`).toISOString() : undefined;
  }

  private toEndOfDay(value: string): string | undefined {
    return value ? new Date(`${value}T23:59:59.999Z`).toISOString() : undefined;
  }
}
