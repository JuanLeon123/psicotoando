import { HttpClient, HttpEvent, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminPost, MediaItem, MediaKind, PostInput } from './blog.models';

/** Llamadas del panel para el blog. Requieren la sesión del administrador. */
@Injectable({ providedIn: 'root' })
export class AdminBlogApiService {
  private readonly http = inject(HttpClient);

  posts(): Observable<AdminPost[]> {
    return this.http.get<AdminPost[]>('/api/admin/blog/posts');
  }

  post(id: string): Observable<AdminPost> {
    return this.http.get<AdminPost>(`/api/admin/blog/posts/${id}`);
  }

  categories(): Observable<string[]> {
    return this.http.get<string[]>('/api/admin/blog/categories');
  }

  createPost(body: PostInput): Observable<AdminPost> {
    return this.http.post<AdminPost>('/api/admin/blog/posts', body);
  }

  updatePost(id: string, body: Partial<PostInput>): Observable<AdminPost> {
    return this.http.patch<AdminPost>(`/api/admin/blog/posts/${id}`, body);
  }

  deletePost(id: string): Observable<void> {
    return this.http.delete<void>(`/api/admin/blog/posts/${id}`);
  }

  media(kind?: MediaKind): Observable<MediaItem[]> {
    const params = kind ? new HttpParams().set('kind', kind) : undefined;
    return this.http.get<MediaItem[]>('/api/admin/blog/media', { params });
  }

  /** Emite el progreso de la subida y, al final, la respuesta con el archivo. */
  uploadMedia(file: File): Observable<HttpEvent<MediaItem>> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<MediaItem>('/api/admin/blog/media', body, {
      reportProgress: true,
      observe: 'events',
    });
  }

  updateMediaAlt(id: string, alt: string): Observable<MediaItem> {
    return this.http.patch<MediaItem>(`/api/admin/blog/media/${id}`, { alt });
  }

  deleteMedia(id: string): Observable<void> {
    return this.http.delete<void>(`/api/admin/blog/media/${id}`);
  }
}
