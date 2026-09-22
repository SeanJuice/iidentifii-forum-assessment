import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { ForumTopic } from '../../core/models/forum.models';
import { ForumApiService } from '../../core/services/forum-api.service';

@Component({
  selector: 'app-create-post-page',
  imports: [ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <a routerLink="/" class="text-sm font-bold text-violet-700 hover:text-violet-800">← Back to discussions</a>

      <section class="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-10">
        <p class="text-xs font-extrabold uppercase tracking-[0.16em] text-violet-600">Share knowledge</p>
        <h1 class="mt-3 text-3xl font-black tracking-tight text-slate-950">Start a discussion</h1>
        <p class="mt-2 text-sm leading-6 text-slate-500">Give the community enough context to provide a useful, focused answer.</p>

        @if (errorMessage()) {
          <div class="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
            {{ errorMessage() }}
          </div>
        }

        <form class="mt-8 grid gap-6" [formGroup]="form" (ngSubmit)="submit()">
          <label class="grid gap-2 text-sm font-extrabold text-slate-800">
            Title
            <input
              type="text"
              formControlName="title"
              maxlength="180"
              class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal focus:border-violet-400 focus:bg-white"
              placeholder="What do you need help with?"
            >
            <span class="text-xs font-medium text-slate-400">Use a clear title of at least five characters.</span>
          </label>

          <label class="grid gap-2 text-sm font-extrabold text-slate-800">
            Details
            <textarea
              formControlName="content"
              rows="10"
              maxlength="10000"
              class="resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-normal leading-7 focus:border-violet-400 focus:bg-white"
              placeholder="Describe the problem, what you tried, and the expected result."
            ></textarea>
            <span class="text-xs font-medium text-slate-400">Minimum ten characters.</span>
          </label>

          <fieldset>
            <legend class="text-sm font-extrabold text-slate-800">Topics</legend>
            <p class="mt-1 text-xs font-medium text-slate-400">Choose all that apply.</p>
            <div class="mt-3 flex flex-wrap gap-2">
              @for (topic of topics; track topic) {
                <button
                  type="button"
                  class="rounded-full border px-4 py-2 text-sm font-bold transition"
                  [class.border-violet-300]="selectedTopics().includes(topic)"
                  [class.bg-violet-50]="selectedTopics().includes(topic)"
                  [class.text-violet-700]="selectedTopics().includes(topic)"
                  [class.border-slate-200]="!selectedTopics().includes(topic)"
                  [class.text-slate-600]="!selectedTopics().includes(topic)"
                  (click)="toggleTopic(topic)"
                >
                  {{ topic }}
                </button>
              }
            </div>
          </fieldset>

          <div class="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
            <a routerLink="/" class="rounded-xl px-5 py-3 text-center text-sm font-extrabold text-slate-600 hover:bg-slate-100">Cancel</a>
            <button
              type="submit"
              class="rounded-xl bg-violet-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
              [disabled]="loading()"
            >
              {{ loading() ? 'Publishing…' : 'Publish discussion' }}
            </button>
          </div>
        </form>
      </section>
    </main>
  `,
})
export class CreatePostPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly api = inject(ForumApiService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly topics: readonly ForumTopic[] = ['API', 'Integration', 'Security', 'SDK', 'General'];
  readonly selectedTopics = signal<ForumTopic[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly form = this.formBuilder.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(180)]],
    content: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10000)]],
  });

  toggleTopic(topic: ForumTopic): void {
    this.selectedTopics.update((selected) =>
      selected.includes(topic)
        ? selected.filter((item) => item !== topic)
        : [...selected, topic],
    );
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Please add a valid title and enough detail.');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.api
      .createPost({ ...this.form.getRawValue(), topics: this.selectedTopics() })
      .pipe(
        finalize(() => this.loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (response) => void this.router.navigate(['/posts', response.id]),
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(
            typeof error.error?.detail === 'string'
              ? error.error.detail
              : 'The discussion could not be published. Please try again.',
          );
        },
      });
  }
}
