import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaymentOption } from './payment-option';

describe('PaymentOption', () => {
  let component: PaymentOption;
  let fixture: ComponentFixture<PaymentOption>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentOption],
    }).compileComponents();

    fixture = TestBed.createComponent(PaymentOption);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
