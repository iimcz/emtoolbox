import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackageSelectionDialogComponent } from './package-selection-dialog.component';

describe('PackageSelectionDialogComponent', () => {
  let component: PackageSelectionDialogComponent;
  let fixture: ComponentFixture<PackageSelectionDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PackageSelectionDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PackageSelectionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
