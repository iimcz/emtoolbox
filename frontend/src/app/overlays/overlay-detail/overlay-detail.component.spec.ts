import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverlayDetailComponent } from './overlay-detail.component';

describe('OverlayDetailComponent', () => {
  let component: OverlayDetailComponent;
  let fixture: ComponentFixture<OverlayDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ OverlayDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OverlayDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
