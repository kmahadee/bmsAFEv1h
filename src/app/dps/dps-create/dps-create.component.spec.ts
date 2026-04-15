import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DpsCreateComponent } from './dps-create.component';

describe('DpsCreateComponent', () => {
  let component: DpsCreateComponent;
  let fixture: ComponentFixture<DpsCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DpsCreateComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DpsCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
