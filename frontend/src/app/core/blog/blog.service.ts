import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PostPage, PublicPost } from './blog.models';

/** Blog público: solo artículos publicados. */
@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly http = inject(HttpClient);

  list(
    options: { page?: number; pageSize?: number; category?: string | null } = {},
  ): Observable<PostPage> {
    let params = new HttpParams();
    if (options.page) params = params.set('page', options.page);
    if (options.pageSize) params = params.set('pageSize', options.pageSize);
    if (options.category) params = params.set('category', options.category);
    return this.http.get<PostPage>('/api/blog/posts', { params });
  }

  bySlug(slug: string): Observable<PublicPost> {
    return this.http.get<PublicPost>(
      `/api/blog/posts/${encodeURIComponent(slug)}`,
    );
  }
}
