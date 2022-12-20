import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpositionBrowserComponent } from './exposition-browser.component';

describe('ExpositionBrowserComponent', () => {
  let component: ExpositionBrowserComponent;
  let fixture: ComponentFixture<ExpositionBrowserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExpositionBrowserComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpositionBrowserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
