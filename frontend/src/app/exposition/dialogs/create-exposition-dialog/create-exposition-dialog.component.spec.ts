import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateExpositionDialogComponent } from './create-exposition-dialog.component';

describe('CreateExpositionDialogComponent', () => {
  let component: CreateExpositionDialogComponent;
  let fixture: ComponentFixture<CreateExpositionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreateExpositionDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateExpositionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
