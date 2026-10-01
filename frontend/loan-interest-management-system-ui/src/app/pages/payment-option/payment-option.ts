import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../material/material-module';
import { LoanInterestService, PaymentHistoryEntry } from '../../services/loan-interest.service';
import { ClientPayment, ViewClientData } from '../view-client/view-client';


@Component({
  imports: [CommonModule, MaterialModule, ReactiveFormsModule],
  selector: 'app-payment-option',
  styleUrl: './payment-option.scss',
  templateUrl: './payment-option.html',
})
export class PaymentOption {
  @Input() client!: ViewClientData;
  @Input() clientIndex: number | null = null;
  @Output() closePopup = new EventEmitter<void>();
  @Output() paymentSaved = new EventEmitter<ViewClientData>();

  today = this.toDateInputValue(new Date());
  paymentForm;
   storageKey = 'loanManagerClientDetails';

  constructor(
    private formBuilder: FormBuilder,
    private loanInterest: LoanInterestService,
  ) {
    this.paymentForm = this.formBuilder.group({
      paymentAmount: [null as number | null, [Validators.required, Validators.min(0.01), (control) => this.amountLimitValidator(control.value)]],
      paymentDate: [this.today, [Validators.required, (control) => this.validDateValidator(control.value)]],
      notes: [''],
    });
  }

  payments(): ClientPayment[] {
    return this.client?.payments ?? [];
  }

  paymentDate(): Date {
    const value = this.paymentForm.controls.paymentDate.value;
    return this.parseDateInput(value ?? '') ?? new Date();
  }

  paymentDateText(): string {
    return this.paymentForm.controls.paymentDate.value || this.today;
  }

  calculationDate(): Date {
    return new Date();
  }

  principal(): number {
    return this.toNumber(this.client?.principalAmount);
  }

   interestDue(): number {
    return this.client ? this.calculateInterest(this.calculationDate()) : 0;
  }

   totalAmountDue(): number {
    return this.principal() + this.interestDue();
  }

   alreadyPaid(): number {
    const recorded = this.payments().reduce((sum, payment) => sum + this.toNumber(payment.paymentAmount), 0);
    return Math.max(recorded, this.toNumber(this.client?.amountPaid));
  }

   legacyAmountPaid(): number {
    return Math.max(0, this.toNumber(this.client?.amountPaid) - this.payments().reduce((sum, payment) => sum + this.toNumber(payment.paymentAmount), 0));
  }

   currentAllocation() {
    return this.allocationFor(0, this.calculationDate());
  }

   outstanding(): number {
    return this.currentAllocation().outstanding;
  }

   overdueDays(): number {
    return this.client ? this.loanInterest.elapsedDays(this.client.dueDate, this.calculationDate()) : 0;
  }

   overdueInterest(): number {
    if (!this.client || this.overdueDays() <= 0) return 0;
    return this.loanInterest.calculateOverdueInterest(this.loanTerms(), this.client.dueDate, this.calculationDate());
  }

   previewAllocation() {
    return this.allocationFor(this.toNumber(this.paymentForm.controls.paymentAmount.value), this.paymentDate());
  }

   previewStatus(): string {
    const allocation = this.previewAllocation();
    return this.loanInterest.calculatePaymentStatus(allocation.outstanding, this.client.dueDate, this.paymentDate(), allocation.totalPaid);
  }

   status(): string {
    return this.loanInterest.calculatePaymentStatus(this.outstanding(), this.client.dueDate, this.calculationDate(), this.alreadyPaid());
  }

   statusClass(): string {
    return this.status().toLocaleLowerCase().replace(/\s+/g, '-');
  }

   previewStatusClass(): string {
    return this.previewStatus().toLocaleLowerCase().replace(/\s+/g, '-');
  }

   paymentAmountError(): string {
    const control = this.paymentForm.controls.paymentAmount;
    if (control.hasError('required')) return 'Payment amount is required.';
    if (control.hasError('min')) return 'Enter an amount greater than zero.';
    if (control.hasError('exceedsOutstanding')) return 'Payment cannot exceed the outstanding amount on the payment date.';
    return '';
  }

  savePayment(): void {
    if (this.paymentForm.invalid || !this.client) {
      this.paymentForm.markAllAsTouched();
      return;
    }

    const amount = this.toNumber(this.paymentForm.controls.paymentAmount.value);
    const date = this.paymentDateText();
    const allocation = this.allocationFor(amount, this.paymentDate());
    if (allocation.paymentAmount < amount) {
      this.paymentForm.controls.paymentAmount.setErrors({ exceedsOutstanding: true });
      return;
    }

    const payment: ClientPayment = {
      paymentId: this.createPaymentId(),
      paymentDate: date,
      paymentAmount: amount,
      principalPaid: allocation.principalPaid,
      interestPaid: allocation.interestPaid,
      notes: String(this.paymentForm.controls.notes.value ?? '').trim() || undefined,
    };
    const updatedPayments = [...this.payments(), payment];
    const updatedClient: ViewClientData = {
      ...this.client,
      payments: updatedPayments,
      amountPaid: this.legacyAmountPaid() + updatedPayments.reduce((sum, item) => sum + this.toNumber(item.paymentAmount), 0),
    };
    const updatedInterest = this.calculateInterest(this.calculationDate());
    const updatedAllocation = this.loanInterest.calculatePaymentAllocation(
      0,
      this.principal(),
      updatedInterest,
      this.toHistory(updatedPayments),
      this.legacyAmountPaid(),
    );
    updatedClient.paymentStatus = this.loanInterest.calculatePaymentStatus(
      updatedAllocation.outstanding,
      updatedClient.dueDate,
      this.calculationDate(),
      updatedAllocation.totalPaid,
    );

    if (!this.persistClient(updatedClient)) return;
    this.paymentSaved.emit(updatedClient);
    this.closePopup.emit();
  }

  cancel(): void {
    this.closePopup.emit();
  }

  closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cancel();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.client) this.cancel();
  }

    loanTerms() {
    return {
      principal: this.principal(),
      rate: this.toNumber(this.client?.interestRate),
      type: this.client?.interestType ?? 'Simple Interest',
      frequency: this.client?.interestFrequency ?? 'Monthly',
      startDate: this.client?.startDate ?? this.today,
    };
  }

   calculateInterest(throughDate: Date): number {
    return this.loanInterest.calculateInterest(this.loanTerms(), throughDate);
  }

   allocationFor(amount: number, throughDate: Date) {
    if (!this.client) return this.loanInterest.calculatePaymentAllocation(0, 0, 0);
    return this.loanInterest.calculatePaymentAllocation(
      amount,
      this.principal(),
      this.calculateInterest(throughDate),
      this.toHistory(this.payments()),
      this.legacyAmountPaid(),
    );
  }

   toHistory(payments: ClientPayment[]): PaymentHistoryEntry[] {
    return payments.map((payment) => ({
      paymentAmount: this.toNumber(payment.paymentAmount),
      principalPaid: payment.principalPaid,
      interestPaid: payment.interestPaid,
    }));
  }

   amountLimitValidator(value: unknown) {
    const amount = this.toNumber(value);
    return amount > this.allocationFor(0, this.calculationDate()).outstanding + 0.000001
      ? { exceedsOutstanding: true }
      : null;
  }

   validDateValidator(value: unknown) {
    return this.parseDateInput(String(value ?? '')) ? null : { invalidDate: true };
  }

   parseDateInput(value: string): Date | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) || this.toDateInputValue(date) !== value ? null : date;
  }

   toDateInputValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

   persistClient(updatedClient: ViewClientData): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const saved: ViewClientData[] = JSON.parse(window.localStorage.getItem(this.storageKey) ?? '[]');
      if (!Array.isArray(saved)) return false;
      let index = this.clientIndex;
      if (index === null || !saved[index] || saved[index].phoneNumber !== this.client.phoneNumber) {
        index = saved.findIndex((item) => item.phoneNumber === this.client.phoneNumber && item.clientName === this.client.clientName);
      }
      if (index < 0) return false;
      saved[index] = updatedClient;
      window.localStorage.setItem(this.storageKey, JSON.stringify(saved));
      return true;
    } catch {
      return false;
    }
  }

   createPaymentId(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

   toNumber(value: unknown): number {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

}
