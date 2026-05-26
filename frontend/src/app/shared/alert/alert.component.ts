import { Component, input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-alert',
  imports: [NgClass],
  template: `
    @if (message()) {
      <div
        class="rounded-lg border px-4 py-3 text-sm"
        [ngClass]="
          type() === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-red-200 bg-red-50 text-red-800'
        "
        role="alert"
      >
        {{ message() }}
      </div>
    }
  `,
})
export class AlertComponent {
  readonly message = input('');
  readonly type = input<'success' | 'error'>('error');
}
