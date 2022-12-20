import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PackageGraphComponent } from './package-graph.component';

describe('PackageGraphComponent', () => {
  let component: PackageGraphComponent;
  let fixture: ComponentFixture<PackageGraphComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PackageGraphComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PackageGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
