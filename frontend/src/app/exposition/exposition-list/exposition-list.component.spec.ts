import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpositionListComponent } from './exposition-list.component';

describe('ExpositionListComponent', () => {
  let component: ExpositionListComponent;
  let fixture: ComponentFixture<ExpositionListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExpositionListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpositionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
