import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpositionDetailComponent } from './exposition-detail.component';

describe('ExpositionDetailComponent', () => {
  let component: ExpositionDetailComponent;
  let fixture: ComponentFixture<ExpositionDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExpositionDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpositionDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
