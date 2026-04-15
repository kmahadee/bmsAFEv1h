import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DpsStatementComponent } from './dps-statement.component';

describe('DpsStatementComponent', () => {
  let component: DpsStatementComponent;
  let fixture: ComponentFixture<DpsStatementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DpsStatementComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DpsStatementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
