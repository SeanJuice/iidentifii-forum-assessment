import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PostDetailResponse } from '../../core/models/forum.models';
import { AuthService } from '../../core/services/auth.service';
import { ForumApiService } from '../../core/services/forum-api.service';
import { PostDetailPageComponent } from './post-detail-page.component';

describe('PostDetailPageComponent', () => {
  let fixture: ComponentFixture<PostDetailPageComponent>;
  const post: PostDetailResponse = {
    id: 'post-id',
    title: 'Secure webhook validation',
    content: 'Validate every incoming signature.',
    author: { id: 'moderator-id', displayName: 'Moderator', role: 'Moderator' },
    topics: ['Security'],
    createdAt: '2026-09-20T12:00:00Z',
    updatedAt: null,
    likeCount: 3,
    likedByCurrentUser: false,
    commentCount: 0,
    moderationTag: null,
  };
  const auth = {
    user: signal({
      id: 'moderator-id',
      displayName: 'Moderator',
      email: 'moderator@demo.local',
      roles: ['Moderator'],
    }),
    isAuthenticated: signal(true),
    isModerator: signal(true),
  };
  const api = {
    getPost: vi.fn(() => of(post)),
    getAuthors: vi.fn(() => of([])),
    getComments: vi.fn(() =>
      of({ items: [], page: 1, pageSize: 10, totalItems: 0, totalPages: 0 }),
    ),
    likePost: vi.fn(),
    unlikePost: vi.fn(),
    addComment: vi.fn(),
    moderatePost: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PostDetailPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'post-id' }) } },
        },
        { provide: AuthService, useValue: auth },
        { provide: ForumApiService, useValue: api },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PostDetailPageComponent);
    fixture.detectChanges();
  });

  it('disables liking your own post while showing moderator controls', () => {
    const buttons = Array.from<HTMLButtonElement>(
      fixture.nativeElement.querySelectorAll('button'),
    );
    const likeButton = buttons.find((button) => button.textContent?.includes('Like'));
    const moderationButton = buttons.find((button) =>
      button.textContent?.includes('Mark as misleading'),
    );

    expect(likeButton?.disabled).toBe(true);
    expect(moderationButton).toBeDefined();
  });
});
