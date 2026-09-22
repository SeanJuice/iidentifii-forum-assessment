import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PostListItemResponse } from '../../core/models/forum.models';

@Component({
  selector: 'app-post-card',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <article
      class="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-xl hover:shadow-slate-900/5 sm:p-6"
    >
      <div class="flex gap-4">
        <button
          type="button"
          class="hidden h-fit min-w-15 flex-col items-center rounded-xl border px-3 py-2 transition sm:flex"
          [class.border-violet-200]="post().likedByCurrentUser"
          [class.bg-violet-50]="post().likedByCurrentUser"
          [class.text-violet-700]="post().likedByCurrentUser"
          [class.border-slate-200]="!post().likedByCurrentUser"
          [class.text-slate-500]="!post().likedByCurrentUser"
          (click)="like.emit(post())"
          [attr.aria-label]="post().likedByCurrentUser ? 'Unlike post' : 'Like post'"
        >
          <span class="text-sm" aria-hidden="true">▲</span>
          <span class="text-sm font-extrabold">{{ post().likeCount }}</span>
        </button>

        <div class="min-w-0 flex-1">
          <div class="mb-3 flex flex-wrap items-center gap-2">
            @for (tag of post().topics; track tag) {
              <span class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                {{ tag }}
              </span>
            }
            @if (post().isFlagged) {
              <span class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                <span aria-hidden="true">●</span>
                Under review
              </span>
            }
          </div>

          <a [routerLink]="['/posts', post().id]" class="block">
            <h2 class="text-lg font-extrabold tracking-tight text-slate-950 transition group-hover:text-violet-700 sm:text-xl">
              {{ post().title }}
            </h2>
          </a>
          <p class="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {{ post().excerpt }}
          </p>

          <div class="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
            <div class="flex items-center gap-3">
              <span class="grid size-9 place-items-center rounded-full bg-slate-900 text-xs font-extrabold text-white">
                {{ authorInitials() }}
              </span>
              <div>
                <p class="text-sm font-bold text-slate-800">{{ post().author.displayName }}</p>
                <p class="text-xs text-slate-500">{{ relativeDate() }}</p>
              </div>
            </div>

            <div class="flex items-center gap-4 text-sm font-semibold text-slate-500">
              <button
                type="button"
                class="flex items-center gap-1.5 transition hover:text-violet-700 sm:hidden"
                (click)="like.emit(post())"
              >
                <span aria-hidden="true">▲</span>
                {{ post().likeCount }}
              </button>
              <span class="flex items-center gap-1.5">
                <span aria-hidden="true">◯</span>
                {{ post().commentCount }} answers
              </span>
            </div>
          </div>
        </div>
      </div>
    </article>
  `,
})
export class PostCardComponent {
  readonly post = input.required<PostListItemResponse>();
  readonly like = output<PostListItemResponse>();

  readonly authorInitials = computed(() =>
    this.post()
      .author.displayName.split(' ')
      .map((part) => part.at(0))
      .join('')
      .slice(0, 2)
      .toLocaleUpperCase(),
  );

  readonly relativeDate = computed(() => {
    const difference = Date.now() - Date.parse(this.post().createdAt);
    const hours = Math.max(1, Math.floor(difference / 3_600_000));

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  });
}
