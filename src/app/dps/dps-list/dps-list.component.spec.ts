import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DpsListComponent } from './dps-list.component';

describe('DpsListComponent', () => {
  let component: DpsListComponent;
  let fixture: ComponentFixture<DpsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DpsListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DpsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
