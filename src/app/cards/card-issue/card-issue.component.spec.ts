import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CardIssueComponent } from './card-issue.component';

describe('CardIssueComponent', () => {
  let component: CardIssueComponent;
  let fixture: ComponentFixture<CardIssueComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CardIssueComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CardIssueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
