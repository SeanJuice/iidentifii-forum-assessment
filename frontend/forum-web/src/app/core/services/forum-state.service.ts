import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import {
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

  readonly query = signal('');
  readonly selectedTopic = signal<ForumTopic | 'All'>('All');
  readonly sort = signal<PostSort>('date');
  readonly page = signal(1);
  readonly pageSize = 10;
  readonly totalItems = signal(0);
  readonly totalPages = signal(0);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly topics: readonly (ForumTopic | 'All')[] = [
    'All',
    'API',
    'Integration',
    'Security',
    'SDK',
    'General',
  ];

  readonly filteredPosts = computed(() => {
    const query = this.query().trim().toLocaleLowerCase();

    return this.postsState().filter(
      (post) =>
        query.length === 0 ||
        post.title.toLocaleLowerCase().includes(query) ||
        post.excerpt.toLocaleLowerCase().includes(query) ||
        post.author.displayName.toLocaleLowerCase().includes(query),
    );
  });

  readonly totalContributors = computed(
    () => new Set(this.postsState().map((post) => post.author.id)).size,
  );
  readonly totalAnswers = computed(() =>
    this.postsState().reduce((total, post) => total + post.commentCount, 0),
  );

  loadPosts(): void {
    const selectedTopic = this.selectedTopic();
    this.loading.set(true);
    this.errorMessage.set('');
    this.api
      .getPosts({
        page: this.page(),
        pageSize: this.pageSize,
        topic: selectedTopic === 'All' ? undefined : selectedTopic,
        sortBy: this.sort(),
        sortDirection: 'desc',
      })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          this.postsState.set(response.items);
          this.totalItems.set(response.totalItems);
          this.totalPages.set(response.totalPages);
        },
        error: () => {
          this.postsState.set([]);
          this.errorMessage.set(
            'Discussions could not be loaded. Confirm that the API is running on port 5080.',
          );
        },
      });
  }

  setQuery(value: string): void {
    this.query.set(value);
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
}
