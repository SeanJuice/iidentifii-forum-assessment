import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { HeaderComponent } from './layout/header.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-header />
    <router-outlet />
    <footer id="community" class="border-t border-slate-200 bg-white">
      <div class="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-7 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <p class="font-semibold">iiDENTIFii Integration Forum</p>
        <p>A secure knowledge exchange for engineers and partners.</p>
      </div>
    </footer>
  `,
})
export class AppComponent {}
