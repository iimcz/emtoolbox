import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackageAssignmentComponent } from './package-assignment.component';

describe('PackageAssignmentComponent', () => {
  let component: PackageAssignmentComponent;
  let fixture: ComponentFixture<PackageAssignmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PackageAssignmentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PackageAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
