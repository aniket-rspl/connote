import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-success-dialog',
  template: `
    <div
      class="dialog-backdrop fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-dialog-title"
    >
      <div class="dialog-panel w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
        <div
          class="tick-circle mx-auto flex h-20 w-20 items-center justify-center overflow-visible rounded-full bg-emerald-100"
        >
          <svg
            class="success-icon h-12 w-12 overflow-visible text-emerald-600"
            viewBox="0 0 52 52"
            fill="none"
            aria-hidden="true"
          >
            <circle
              class="success-circle"
              cx="26"
              cy="26"
              r="22"
              pathLength="1"
              stroke="currentColor"
              stroke-width="2.5"
            />
            <path
              class="success-check"
              d="M15 27.5 23 35.5 38 18.5"
              pathLength="1"
              stroke="currentColor"
              stroke-width="2.5"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </svg>
        </div>

        <h2 id="success-dialog-title" class="mt-5 text-lg font-semibold text-slate-900">
          {{ message() }}
        </h2>

        <div class="mt-6 flex justify-center">
          <button
            type="button"
            class="min-w-24 rounded-lg bg-sky-600 px-8 py-2.5 text-sm font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
            (click)="close()"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './success-dialog.component.scss',
})
export class SuccessDialogComponent {
  readonly message = input('Carrier registered successfully.');
  readonly closed = output<void>();

  close(): void {
    this.closed.emit();
  }
}
