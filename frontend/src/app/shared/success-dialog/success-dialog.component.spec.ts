import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SuccessDialogComponent } from './success-dialog.component';

describe('SuccessDialogComponent', () => {
  let fixture: ComponentFixture<SuccessDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuccessDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SuccessDialogComponent);
  });

  it('should render the default success message', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain('Carrier registered successfully');
  });

  it('should render a custom message', () => {
    fixture.componentRef.setInput('message', 'All done');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('All done');
  });

  it('should emit closed when OK is clicked', () => {
    fixture.detectChanges();
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);

    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();

    expect(closed).toHaveBeenCalledTimes(1);
  });
});
