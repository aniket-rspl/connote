import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AlertComponent } from '../../shared/alert/alert.component';
import { ApiError } from '../../core/models/api-error';
import { CarrierSummary } from '../../core/models/carrier-summary.model';
import { CarrierRefreshService } from '../../core/services/carrier-refresh.service';
import { ConnoteApiService } from '../../core/services/connote-api.service';

@Component({
  selector: 'app-generate-id',
  imports: [ReactiveFormsModule, AlertComponent, RouterLink],
  templateUrl: './generate-id.component.html',
})
export class GenerateIdComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ConnoteApiService);
  private readonly carrierRefresh = inject(CarrierRefreshService);

  readonly carriers = signal<CarrierSummary[]>([]);
  readonly loading = signal(true);
  readonly generating = signal(false);
  readonly errorMessage = signal('');
  readonly trackingId = signal('');
  readonly copied = signal(false);

  readonly carrierQuery = signal('');
  readonly selectedCarrierName = signal('');
  readonly dropdownOpen = signal(false);
  readonly carrierTouched = signal(false);
  readonly activeOptionIndex = signal<number | null>(null);

  readonly filteredCarriers = computed(() =>
    this.filterCarriers(this.carrierQuery(), this.carriers()),
  );

  readonly activeCarrier = computed(() => {
    const options = this.filteredCarriers();
    if (options.length === 0) {
      return null;
    }

    const index = this.activeOptionIndex();
    if (index !== null && index >= 0 && index < options.length) {
      return options[index];
    }

    return this.pickBestMatch(this.carrierQuery(), options);
  });

  readonly hasNoMatch = computed(
    () => this.carrierQuery().trim().length > 0 && this.filteredCarriers().length === 0,
  );

  readonly hasValidCarrier = computed(() => {
    const name = this.selectedCarrierName();
    if (!name) {
      return false;
    }
    return this.carriers().some(
      (c) => c.carrierName.toLowerCase() === name.toLowerCase(),
    );
  });

  readonly carrierFieldError = computed(() => {
    if (!this.carrierTouched()) {
      return '';
    }
    if (this.hasNoMatch()) {
      return 'No matching carrier found.';
    }
    if (!this.hasValidCarrier()) {
      return 'Select a valid carrier from the list.';
    }
    return '';
  });

  readonly canGenerate = computed(() => this.hasValidCarrier() && !this.generating());

  readonly form = this.fb.nonNullable.group({
    carrierName: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loadCarriers();
    this.carrierRefresh.refresh$.subscribe(() => this.loadCarriers());
  }

  loadCarriers(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.api.getCarriers().subscribe({
      next: (carriers) => {
        this.carriers.set(carriers);
        this.loading.set(false);
        this.syncSelectionAfterReload(carriers);
      },
      error: (err: unknown) => {
        this.errorMessage.set(
          err instanceof ApiError ? err.message : 'Failed to load carriers.',
        );
        this.loading.set(false);
      },
    });
  }

  onCarrierInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.carrierQuery.set(value);
    this.carrierTouched.set(true);
    this.dropdownOpen.set(true);
    this.activeOptionIndex.set(null);
    this.applyBestMatch(value);
  }

  onCarrierFocus(): void {
    this.dropdownOpen.set(true);
  }

  onCarrierBlur(): void {
    this.carrierTouched.set(true);
    setTimeout(() => {
      this.dropdownOpen.set(false);
      this.activeOptionIndex.set(null);
    }, 150);
  }

  onCarrierKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveActiveOption(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveActiveOption(-1);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.dropdownOpen.set(false);
      this.activeOptionIndex.set(null);
      return;
    }

    if (event.key !== 'Enter') {
      return;
    }

    event.preventDefault();

    if (this.hasNoMatch()) {
      return;
    }

    if (this.isCarrierConfirmed() && this.canGenerate() && this.activeOptionIndex() === null) {
      this.generate();
      return;
    }

    const active = this.activeCarrier();
    if (active) {
      this.selectCarrier(active);
      this.activeOptionIndex.set(null);
    }
  }

  onCarrierOptionMouseDown(event: MouseEvent, carrier: CarrierSummary): void {
    event.preventDefault();
    const index = this.filteredCarriers().findIndex(
      (c) => c.carrierName.toLowerCase() === carrier.carrierName.toLowerCase(),
    );
    if (index >= 0) {
      this.activeOptionIndex.set(index);
    }
    this.selectCarrier(carrier);
  }

  onCarrierOptionMouseEnter(carrier: CarrierSummary): void {
    const index = this.filteredCarriers().findIndex(
      (c) => c.carrierName.toLowerCase() === carrier.carrierName.toLowerCase(),
    );
    if (index >= 0) {
      this.activeOptionIndex.set(index);
    }
  }

  selectCarrier(carrier: CarrierSummary): void {
    this.carrierQuery.set(carrier.carrierName);
    this.selectedCarrierName.set(carrier.carrierName);
    this.form.controls.carrierName.setValue(carrier.carrierName);
    this.carrierTouched.set(true);
    this.dropdownOpen.set(false);
    this.activeOptionIndex.set(null);
  }

  isActiveOption(_carrier: CarrierSummary, index: number): boolean {
    const options = this.filteredCarriers();
    const active = this.activeCarrier();
    if (!active || !options[index]) {
      return false;
    }
    return (
      options[index].carrierName.toLowerCase() === active.carrierName.toLowerCase()
    );
  }

  generate(): void {
    this.carrierTouched.set(true);
    this.errorMessage.set('');
    this.trackingId.set('');
    this.copied.set(false);

    if (!this.hasValidCarrier() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.generating.set(true);
    const carrierName = this.selectedCarrierName();
    this.api.generateId(carrierName).subscribe({
      next: (response) => {
        this.trackingId.set(response.trackingId);
        this.generating.set(false);
        this.loadCarriers();
      },
      error: (err: unknown) => {
        this.errorMessage.set(
          err instanceof ApiError ? err.message : 'Failed to generate tracking ID.',
        );
        this.generating.set(false);
      },
    });
  }

  async copyTrackingId(): Promise<void> {
    const id = this.trackingId();
    if (!id) {
      return;
    }
    try {
      await navigator.clipboard.writeText(id);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      this.errorMessage.set('Could not copy to clipboard.');
    }
  }

  private moveActiveOption(delta: number): void {
    const options = this.filteredCarriers();
    if (options.length === 0 || this.hasNoMatch()) {
      return;
    }

    this.dropdownOpen.set(true);

    let current = this.activeOptionIndex();
    if (current === null) {
      const best = this.pickBestMatch(this.carrierQuery(), options);
      current = best
        ? options.findIndex(
            (c) => c.carrierName.toLowerCase() === best.carrierName.toLowerCase(),
          )
        : 0;
      if (current < 0) {
        current = 0;
      }
    }

    const next = (current + delta + options.length) % options.length;
    this.activeOptionIndex.set(next);
    this.scrollActiveOptionIntoView(next);
  }

  private scrollActiveOptionIntoView(index: number): void {
    setTimeout(() => {
      document.getElementById(`carrier-option-${index}`)?.scrollIntoView({ block: 'nearest' });
    }, 0);
  }

  private isCarrierConfirmed(): boolean {
    if (!this.hasValidCarrier()) {
      return false;
    }
    return (
      this.carrierQuery().trim().toLowerCase() ===
      this.selectedCarrierName().trim().toLowerCase()
    );
  }

  private applyBestMatch(query: string): void {
    const filtered = this.filterCarriers(query, this.carriers());
    const best = this.pickBestMatch(query, filtered);
    if (best) {
      this.selectedCarrierName.set(best.carrierName);
      this.form.controls.carrierName.setValue(best.carrierName);
    } else {
      this.selectedCarrierName.set('');
      this.form.controls.carrierName.setValue('');
    }
  }

  private syncSelectionAfterReload(carriers: CarrierSummary[]): void {
    const current = this.selectedCarrierName();
    if (!current) {
      return;
    }
    const stillValid = carriers.find(
      (c) => c.carrierName.toLowerCase() === current.toLowerCase(),
    );
    if (stillValid) {
      this.carrierQuery.set(stillValid.carrierName);
      this.selectedCarrierName.set(stillValid.carrierName);
      this.form.controls.carrierName.setValue(stillValid.carrierName);
    } else {
      this.carrierQuery.set('');
      this.selectedCarrierName.set('');
      this.form.controls.carrierName.setValue('');
    }
  }

  private filterCarriers(query: string, carriers: CarrierSummary[]): CarrierSummary[] {
    const trimmed = query.trim();
    if (!trimmed) {
      return carriers;
    }
    const q = trimmed.toLowerCase();
    return carriers.filter((c) => c.carrierName.toLowerCase().includes(q));
  }

  private pickBestMatch(
    query: string,
    filtered: CarrierSummary[],
  ): CarrierSummary | null {
    const trimmed = query.trim();
    if (!trimmed || filtered.length === 0) {
      return null;
    }

    const q = trimmed.toLowerCase();

    const exact = filtered.find((c) => c.carrierName.toLowerCase() === q);
    if (exact) {
      return exact;
    }

    const startsWith = filtered.filter((c) =>
      c.carrierName.toLowerCase().startsWith(q),
    );
    if (startsWith.length > 0) {
      return this.sortByName(startsWith)[0];
    }

    return this.sortByName(filtered)[0];
  }

  private sortByName(carriers: CarrierSummary[]): CarrierSummary[] {
    return [...carriers].sort((a, b) =>
      a.carrierName.localeCompare(b.carrierName, undefined, { sensitivity: 'base' }),
    );
  }
}
