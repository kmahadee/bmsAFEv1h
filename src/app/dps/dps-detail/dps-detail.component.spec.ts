import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DpsDetailComponent } from './dps-detail.component';

describe('DpsDetailComponent', () => {
  let component: DpsDetailComponent;
  let fixture: ComponentFixture<DpsDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DpsDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DpsDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
