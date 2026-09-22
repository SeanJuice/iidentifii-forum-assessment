import { computed, Injectable, signal } from '@angular/core';

import { ForumPost, ForumTag, PostSort } from '../models/forum.models';

const SAMPLE_POSTS: ForumPost[] = [
  {
    id: 'post-101',
    title: 'Recommended retry strategy for the verification API',
    excerpt:
      'What retry intervals work best for transient verification failures without creating duplicate requests?',
    author: { id: 'user-1', displayName: 'Amina Patel', role: 'User' },
    tags: ['API', 'Integration'],
    createdAt: '2026-09-22T08:30:00Z',
    likeCount: 24,
    commentCount: 8,
    likedByCurrentUser: false,
    isFlagged: false,
  },
  {
    id: 'post-102',
    title: 'Webhook signature validation in the Node SDK',
    excerpt:
      'A practical example of validating webhook signatures and protecting against replay attacks.',
    author: { id: 'moderator-1', displayName: 'Liam Daniels', role: 'Moderator' },
    tags: ['SDK', 'Security'],
    createdAt: '2026-09-21T14:10:00Z',
    likeCount: 41,
    commentCount: 13,
    likedByCurrentUser: true,
    isFlagged: false,
  },
  {
    id: 'post-103',
    title: 'Does the sandbox return production confidence scores?',
    excerpt:
      'Clarifying how sandbox responses differ from production and which fields partners should treat as test data.',
    author: { id: 'user-2', displayName: 'Thabo Molefe', role: 'User' },
    tags: ['Integration', 'General'],
    createdAt: '2026-09-20T09:45:00Z',
    likeCount: 16,
    commentCount: 5,
    likedByCurrentUser: false,
    isFlagged: true,
  },
];

@Injectable({ providedIn: 'root' })
export class ForumStateService {
  private readonly postsState = signal<ForumPost[]>(SAMPLE_POSTS);

  readonly query = signal('');
  readonly selectedTag = signal<ForumTag | 'All'>('All');
  readonly sort = signal<PostSort>('recent');
  readonly tags: readonly (ForumTag | 'All')[] = [
    'All',
    'API',
    'Integration',
    'Security',
    'SDK',
    'General',
  ];

  readonly filteredPosts = computed(() => {
    const query = this.query().trim().toLocaleLowerCase();
    const selectedTag = this.selectedTag();
    const sort = this.sort();

    return this.postsState()
      .filter((post) => {
        const matchesQuery =
          query.length === 0 ||
          post.title.toLocaleLowerCase().includes(query) ||
          post.excerpt.toLocaleLowerCase().includes(query) ||
          post.author.displayName.toLocaleLowerCase().includes(query);
        const matchesTag = selectedTag === 'All' || post.tags.includes(selectedTag);

        return matchesQuery && matchesTag;
      })
      .sort((left, right) => {
        if (sort === 'popular') {
          return right.likeCount - left.likeCount;
        }

        return Date.parse(right.createdAt) - Date.parse(left.createdAt);
      });
  });

  readonly totalPosts = computed(() => this.postsState().length);
  readonly totalContributors = computed(
    () => new Set(this.postsState().map((post) => post.author.id)).size,
  );
  readonly totalAnswers = computed(() =>
    this.postsState().reduce((total, post) => total + post.commentCount, 0),
  );

  setQuery(value: string): void {
    this.query.set(value);
  }

  setTag(value: ForumTag | 'All'): void {
    this.selectedTag.set(value);
  }

  setSort(value: PostSort): void {
    this.sort.set(value);
  }

  toggleLike(postId: string): void {
    this.postsState.update((posts) =>
      posts.map((post) => {
        if (post.id !== postId) {
          return post;
        }

        const likedByCurrentUser = !post.likedByCurrentUser;
        return {
          ...post,
          likedByCurrentUser,
          likeCount: post.likeCount + (likedByCurrentUser ? 1 : -1),
        };
      }),
    );
  }
}
