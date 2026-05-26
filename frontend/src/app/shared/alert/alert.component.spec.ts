import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AlertComponent } from './alert.component';

describe('AlertComponent', () => {
  let fixture: ComponentFixture<AlertComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertComponent);
  });

  it('should render nothing when message is empty', () => {
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[role="alert"]')).toBeNull();
  });

  it('should render an error alert', () => {
    fixture.componentRef.setInput('message', 'Something failed');
    fixture.componentRef.setInput('type', 'error');
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.textContent).toContain('Something failed');
    expect(alert.className).toContain('red');
  });

  it('should render a success alert', () => {
    fixture.componentRef.setInput('message', 'Saved');
    fixture.componentRef.setInput('type', 'success');
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(alert.className).toContain('emerald');
  });
});
