import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SensorSelectionDialogComponent } from './sensor-selection-dialog.component';

describe('SensorSelectionDialogComponent', () => {
  let component: SensorSelectionDialogComponent;
  let fixture: ComponentFixture<SensorSelectionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SensorSelectionDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SensorSelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
