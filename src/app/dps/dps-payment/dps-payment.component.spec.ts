import { ComponentFixture, TestBed } from '@angular/core/testing';

import DpsPaymentComponent from './dps-payment.component';

describe('DpsPaymentComponent', () => {
  let component: DpsPaymentComponent;
  let fixture: ComponentFixture<DpsPaymentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DpsPaymentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DpsPaymentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
