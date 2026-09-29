import { Injectable } from '@angular/core';

export interface LoanTerms {
  principal: number;
  rate: number;
  type: string;
  frequency: string;
  startDate: string | Date;
}

export interface PaymentHistoryEntry {
  paymentAmount: number;
  principalPaid?: number;
  interestPaid?: number;
}

export interface PaymentAllocation {
  paymentAmount: number;
  principalPaid: number;
  interestPaid: number;
  totalPaid: number;
  remainingPrincipal: number;
  remainingInterest: number;
  outstanding: number;
}

@Injectable({ providedIn: 'root' })
export class LoanInterestService {
  calculateInterest(loan: LoanTerms, endDate: string | Date): number {
    const start = this.parseDate(loan.startDate);
    const end = this.parseDate(endDate);
    if (!start || !end || end <= start || loan.principal <= 0 || loan.rate <= 0) return 0;

    const periods = this.periodCount(start, end, loan.frequency);
    const compound = loan.type.toLowerCase().includes('compound');
    const amount = compound
      ? this.calculateCompoundInterest(loan.principal, loan.rate, periods)
      : this.calculateSimpleInterest(loan.principal, loan.rate, periods);
    return Number.isFinite(amount) ? amount : 0;
  }

  calculateSimpleInterest(principal: number, rate: number, periods: number): number {
    return principal * (rate / 100) * periods;
  }

  calculateCompoundInterest(principal: number, rate: number, periods: number): number {
    return principal * (Math.pow(1 + rate / 100, periods) - 1);
  }

  calculateDailyInterest(principal: number, rate: number, days: number, compound = false): number {
    return compound
      ? this.calculateCompoundInterest(principal, rate, days)
      : this.calculateSimpleInterest(principal, rate, days);
  }

  calculateOverdueInterest(loan: Omit<LoanTerms, 'startDate'>, dueDate: string | Date, paymentDate: string | Date): number {
    return this.calculateInterest({ ...loan, startDate: dueDate }, paymentDate);
  }

  calculateOutstandingBalance(principal: number, interest: number, paid: number): number {
    return Math.max(0, principal + interest - paid);
  }

  calculatePaymentAllocation(
    paymentAmount: number,
    principal: number,
    interestDue: number,
    previousPayments: PaymentHistoryEntry[] = [],
    legacyAmountPaid = 0,
  ): PaymentAllocation {
    const loanPrincipal = Math.max(0, this.toNumber(principal));
    const loanInterest = Math.max(0, this.toNumber(interestDue));
    let paidPrincipal = 0;
    let paidInterest = 0;
    let totalPaid = 0;
    const history = previousPayments.length > 0
      ? previousPayments
      : legacyAmountPaid > 0 ? [{ paymentAmount: legacyAmountPaid }] : [];

    for (const payment of history) {
      const amount = Math.max(0, this.toNumber(payment.paymentAmount));
      let interestPart = Math.min(amount, Math.max(0, this.toNumber(payment.interestPaid)));
      let principalPart = Math.min(amount - interestPart, Math.max(0, this.toNumber(payment.principalPaid)));
      let unallocated = amount - interestPart - principalPart;

      const interestRemainder = Math.max(0, loanInterest - paidInterest - interestPart);
      const additionalInterest = Math.min(unallocated, interestRemainder);
      interestPart += additionalInterest;
      unallocated -= additionalInterest;
      const principalRemainder = Math.max(0, loanPrincipal - paidPrincipal - principalPart);
      principalPart += Math.min(unallocated, principalRemainder);

      paidInterest += interestPart;
      paidPrincipal += principalPart;
      totalPaid += Math.min(amount, Math.max(0, loanPrincipal + loanInterest - totalPaid));
    }

    const acceptedPayment = Math.min(
      Math.max(0, this.toNumber(paymentAmount)),
      Math.max(0, loanPrincipal + loanInterest - totalPaid),
    );
    const interestPaid = Math.min(acceptedPayment, Math.max(0, loanInterest - paidInterest));
    const principalPaid = Math.min(acceptedPayment - interestPaid, Math.max(0, loanPrincipal - paidPrincipal));
    paidInterest += interestPaid;
    paidPrincipal += principalPaid;
    totalPaid += interestPaid + principalPaid;

    const remainingPrincipal = Math.max(0, loanPrincipal - paidPrincipal);
    const remainingInterest = Math.max(0, loanInterest - paidInterest);
    return {
      paymentAmount: interestPaid + principalPaid,
      principalPaid,
      interestPaid,
      totalPaid,
      remainingPrincipal,
      remainingInterest,
      outstanding: remainingPrincipal + remainingInterest,
    };
  }

  calculatePaymentStatus(outstanding: number, dueDate: string | Date, throughDate: string | Date, totalPaid: number): string {
    if (outstanding <= 0) return 'Paid';
    if (this.elapsedDays(dueDate, throughDate) > 0) return 'Overdue';
    if (totalPaid > 0) return 'Partially Paid';
    return 'Pending';
  }

  elapsedDays(startDate: string | Date, endDate: string | Date): number {
    const start = this.parseDate(startDate);
    const end = this.parseDate(endDate);
    if (!start || !end) return 0;
    return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000));
  }

  elapsedMonths(startDate: string | Date, endDate: string | Date): number {
    const start = this.parseDate(startDate);
    const end = this.parseDate(endDate);
    return start && end ? this.calendarPeriods(start, end, 'month') : 0;
  }

  elapsedPeriod(startDate: string | Date, endDate: string | Date): { years: number; months: number; days: number } {
    const start = this.parseDate(startDate);
    const end = this.parseDate(endDate);
    if (!start || !end || end < start) return { years: 0, months: 0, days: 0 };

    let totalMonths = (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + end.getUTCMonth() - start.getUTCMonth();
    let anchor = this.addPeriod(start, 'month', totalMonths);
    if (anchor > end) {
      totalMonths -= 1;
      anchor = this.addPeriod(start, 'month', totalMonths);
    }

    return {
      years: Math.floor(totalMonths / 12),
      months: totalMonths % 12,
      days: Math.floor((end.getTime() - anchor.getTime()) / 86400000),
    };
  }

  private periodCount(start: Date, end: Date, frequency: string): number {
    const days = this.elapsedDays(start, end);
    switch (frequency.toLowerCase()) {
      case 'daily': return days;
      case 'weekly': return days / 7;
      case 'yearly': return this.calendarPeriods(start, end, 'year');
      case 'monthly': return this.calendarPeriods(start, end, 'month');
      default: return this.calendarPeriods(start, end, 'month');
    }
  }

  private calendarPeriods(start: Date, end: Date, unit: 'month' | 'year'): number {
    let anchor = start;
    let wholePeriods = 0;
    let next = this.addPeriod(anchor, unit);

    while (next <= end) {
      anchor = next;
      wholePeriods += 1;
      next = this.addPeriod(start, unit, wholePeriods + 1);
    }

    const remainder = end.getTime() - anchor.getTime();
    const periodLength = next.getTime() - anchor.getTime();
    return wholePeriods + (periodLength > 0 ? remainder / periodLength : 0);
  }

  private addPeriod(date: Date, unit: 'month' | 'year', count = 1): Date {
    const months = (unit === 'year' ? 12 : 1) * count;
    const targetMonth = date.getUTCMonth() + months;
    const targetYear = date.getUTCFullYear() + Math.floor(targetMonth / 12);
    const month = targetMonth % 12;
    const finalDay = new Date(Date.UTC(targetYear, month + 1, 0)).getUTCDate();
    return new Date(Date.UTC(targetYear, month, Math.min(date.getUTCDate(), finalDay)));
  }

  private parseDate(value: string | Date): Date | null {
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
    }
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
    if (match) return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()));
  }

  private toNumber(value: unknown): number {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }
}