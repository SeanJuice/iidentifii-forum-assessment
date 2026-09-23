import { computed, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ForumStateService } from '../../core/services/forum-state.service';
import { PostsPageComponent } from './posts-page.component';

describe('PostsPageComponent', () => {
  let fixture: ComponentFixture<PostsPageComponent>;
  const errorMessage = signal('The forum service is unavailable.');
  const state = {
    query: signal(''),
    selectedTopic: signal<'All'>('All'),
    selectedAuthorId: signal(''),
    fromDate: signal(''),
    toDate: signal(''),
    sort: signal<'date'>('date'),
    page: signal(1),
    totalItems: signal(0),
    totalPages: signal(0),
    loading: signal(false),
    errorMessage,
    authors: signal([]),
    posts: signal([]),
    topics: ['All', 'API', 'Integration', 'Security', 'SDK', 'General'],
    hasActiveFilters: computed(() => false),
    totalContributors: computed(() => 0),
    totalAnswers: computed(() => 0),
    loadAuthors: vi.fn(),
    loadPosts: vi.fn(),
    setQuery: vi.fn(),
    setTopic: vi.fn(),
    setSort: vi.fn(),
    setAuthor: vi.fn(),
    setFromDate: vi.fn(),
    setToDate: vi.fn(),
    applyDateRange: vi.fn(),
    clearFilters: vi.fn(),
    setPage: vi.fn(),
    toggleLike: vi.fn(),
  };

  beforeEach(async () => {
    state.loadAuthors.mockClear();
    state.loadPosts.mockClear();
    await TestBed.configureTestingModule({
      imports: [PostsPageComponent],
      providers: [
        provideRouter([]),
        { provide: ForumStateService, useValue: state },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PostsPageComponent);
    fixture.detectChanges();
  });

  it('loads contributors and discussions and renders the error state', () => {
    expect(state.loadAuthors).toHaveBeenCalledOnce();
    expect(state.loadPosts).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'The forum service is unavailable.',
    );
  });
});
