import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/posts/posts-page.component').then(
        (component) => component.PostsPageComponent,
      ),
    title: 'Discussions | iiDENTIFii Forum',
  },
  {
    path: 'posts/new',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/posts/create-post-page.component').then(
        (component) => component.CreatePostPageComponent,
      ),
    title: 'New discussion | iiDENTIFii Forum',
  },
  {
    path: 'posts/:id',
    loadComponent: () =>
      import('./features/posts/post-detail-page.component').then(
        (component) => component.PostDetailPageComponent,
      ),
    title: 'Discussion | iiDENTIFii Forum',
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/auth-page.component').then(
        (component) => component.AuthPageComponent,
      ),
    data: { mode: 'login' },
    title: 'Log in | iiDENTIFii Forum',
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/auth-page.component').then(
        (component) => component.AuthPageComponent,
      ),
    data: { mode: 'register' },
    title: 'Register | iiDENTIFii Forum',
  },
  { path: '**', redirectTo: '' },
];
