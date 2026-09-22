import { Routes } from '@angular/router';

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

