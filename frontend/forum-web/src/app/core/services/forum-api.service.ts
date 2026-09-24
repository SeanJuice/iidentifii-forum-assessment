import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  AuthorFilterResponse,
  CommentQuery,
  CommentResponse,
  CreatePostRequest,
  PagedResponse,
  PostDetailResponse,
  PostListItemResponse,
  PostQuery,
} from '../models/forum.models';

@Injectable({ providedIn: 'root' })
export class ForumApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/posts`;

  getPosts(query: PostQuery): Observable<PagedResponse<PostListItemResponse>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('pageSize', query.pageSize)
      .set('sortBy', query.sortBy)
      .set('sortDirection', query.sortDirection);

    if (query.topic) {
      params = params.set('topic', query.topic);
    }

    if (query.search) {
      params = params.set('search', query.search);
    }

    if (query.fromDate) {
      params = params.set('fromDate', query.fromDate);
    }

    if (query.toDate) {
      params = params.set('toDate', query.toDate);
    }

    if (query.authorId) {
      params = params.set('authorId', query.authorId);
    }

    if (query.flagged !== undefined) {
      params = params.set('flagged', query.flagged);
    }

    return this.http.get<PagedResponse<PostListItemResponse>>(this.baseUrl, { params });
  }

  getPost(postId: string): Observable<PostDetailResponse> {
    return this.http.get<PostDetailResponse>(`${this.baseUrl}/${postId}`);
  }

  getAuthors(): Observable<AuthorFilterResponse[]> {
    return this.http.get<AuthorFilterResponse[]>(`${environment.apiBaseUrl}/authors`);
  }

  getComments(
    postId: string,
    query: CommentQuery,
  ): Observable<PagedResponse<CommentResponse>> {
    let params = new HttpParams()
      .set('page', query.page)
      .set('pageSize', query.pageSize)
      .set('sortDirection', query.sortDirection);

    if (query.fromDate) {
      params = params.set('fromDate', query.fromDate);
    }

    if (query.toDate) {
      params = params.set('toDate', query.toDate);
    }

    if (query.authorId) {
      params = params.set('authorId', query.authorId);
    }

    return this.http.get<PagedResponse<CommentResponse>>(
      `${this.baseUrl}/${postId}/comments`,
      { params },
    );
  }

  createPost(request: CreatePostRequest): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(this.baseUrl, request);
  }

  addComment(postId: string, content: string): Observable<CommentResponse> {
    return this.http.post<CommentResponse>(`${this.baseUrl}/${postId}/comments`, { content });
  }

  likePost(postId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${postId}/likes`, {});
  }

  unlikePost(postId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${postId}/likes`);
  }

  moderatePost(postId: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/${postId}/moderation-tags`, {});
  }
}
