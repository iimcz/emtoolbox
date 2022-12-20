import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExpositionEditorComponent } from './exposition-editor.component';

describe('ExpositionEditorComponent', () => {
  let component: ExpositionEditorComponent;
  let fixture: ComponentFixture<ExpositionEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ExpositionEditorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExpositionEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
