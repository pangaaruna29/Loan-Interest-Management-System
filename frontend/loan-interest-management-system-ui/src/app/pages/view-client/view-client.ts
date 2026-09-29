import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { MaterialModule } from '../../material/material-module';
import { LoanInterestService } from '../../services/loan-interest.service';

export interface ClientPayment {
  paymentId?: string;
  paymentDate: string;
  paymentAmount: number;
  principalPaid?: number;
  interestPaid?: number;
  notes?: string;
}

export interface ViewClientData {
  id?: string;
  clientName: string;
  phoneNumber: string;
  principalAmount: number;
  interestRate: number;
  interestType?: string;
  interestFrequency: string;
  startDate: string;
  dueDate: string;
  paymentStatus?: string;
  amountPaid?: number;
  payments?: ClientPayment[];
  [key: string]: unknown;
}

@Component({
  imports: [CommonModule, MaterialModule],
  selector: 'app-view-client',
  styleUrl: './view-client.scss',
  templateUrl: './view-client.html',
})
export class ViewClient {
  @Input() client: ViewClientData | null = null;
  @Output() close = new EventEmitter<void>();

  private  calculationDate = new Date();

  constructor(private  loanInterest: LoanInterestService) {}

  get payments(): ClientPayment[] {
    return this.client?.payments ?? [];
  }

  get elapsedDays(): number {
    return this.client ? this.loanInterest.elapsedDays(this.client.startDate, this.calculationDate) : 0;
  }

  get elapsedPeriod(): { years: number; months: number; days: number } {
    return this.client
      ? this.loanInterest.elapsedPeriod(this.client.startDate, this.calculationDate)
      : { years: 0, months: 0, days: 0 };
  }

  get interestAmount(): number {
    if (!this.client) return 0;
    return this.loanInterest.calculateInterest({
      principal: Number(this.client.principalAmount) || 0,
      rate: Number(this.client.interestRate) || 0,
      type: this.client.interestType ?? 'Simple Interest',
      frequency: this.client.interestFrequency,
      startDate: this.client.startDate,
    }, this.calculationDate);
  }

  get totalPaid(): number {
    if (!this.client) return 0;
    if (this.payments.length > 0) {
      return Math.max(
        this.payments.reduce((total, payment) => total + (Number(payment.paymentAmount) || 0), 0),
        Number(this.client.amountPaid) || 0,
      );
    }
    return Number(this.client.amountPaid) || 0;
  }

  get principalPaid(): number | null {
    if (this.payments.length === 0 || !this.payments.some((payment) => payment.principalPaid !== undefined)) return null;
    return this.payments.reduce((total, payment) => total + (Number(payment.principalPaid) || 0), 0);
  }

  get interestPaid(): number | null {
    if (this.payments.length === 0 || !this.payments.some((payment) => payment.interestPaid !== undefined)) return null;
    return this.payments.reduce((total, payment) => total + (Number(payment.interestPaid) || 0), 0);
  }

  get totalAmountDue(): number {
    return (Number(this.client?.principalAmount) || 0) + this.interestAmount;
  }

  get outstandingAmount(): number {
    return this.loanInterest.calculateOutstandingBalance(
      Number(this.client?.principalAmount) || 0,
      this.interestAmount,
      this.totalPaid,
    );
  }

  get overdueDays(): number {
    return this.client ? this.loanInterest.elapsedDays(this.client.dueDate, this.calculationDate) : 0;
  }

  get overdueInterest(): number {
    if (!this.client || this.overdueDays === 0) return 0;
    return this.loanInterest.calculateOverdueInterest({
      principal: Number(this.client.principalAmount) || 0,
      rate: Number(this.client.interestRate) || 0,
      type: this.client.interestType ?? 'Simple Interest',
      frequency: this.client.interestFrequency,
    }, this.client.dueDate, this.calculationDate);
  }

  get status(): string {
    if (!this.client) return 'Pending';
    if (this.outstandingAmount <= 0) return 'Paid';
    if (this.overdueDays > 0) return 'Overdue';
    if (this.totalPaid > 0) return 'Partially Paid';
    return 'Pending';
  }

  get statusClass(): string {
    return this.status.toLocaleLowerCase().replace(/\s+/g, '-');
  }

  closePopup(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closePopup();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.client) this.closePopup();
  }
}
