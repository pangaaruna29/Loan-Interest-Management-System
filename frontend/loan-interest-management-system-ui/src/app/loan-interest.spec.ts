import { TestBed } from '@angular/core/testing';
import { LoanInterest } from './loan-interest';

describe('LoanInterest', () => {
  let service: LoanInterest;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LoanInterest);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
