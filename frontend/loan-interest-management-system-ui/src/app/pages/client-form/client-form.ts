import { Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../material/material-module';
import { LoanInterestService, PaymentHistoryEntry } from '../../services/loan-interest.service';
import { ViewClientData } from '../view-client/view-client';
import { AuthService } from '../../services/auth.service';

@Component({
  imports: [MaterialModule, CommonModule, ReactiveFormsModule],
  selector: 'app-client-form',
  styleUrl: './client-form.scss',
  templateUrl: './client-form.html',
})
export class ClientForm implements OnInit {
  clientForm: FormGroup;
    storageKey = 'loanManagerClientDetails';
  isEditMode = false;
  selectedClient: ViewClientData | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private loanInterest: LoanInterestService,
    private authService: AuthService,
  ) {
    this.clientForm = this.fb.group({
      clientName: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      principalAmount: [null, [Validators.required, Validators.min(1)]],
      interestRate: [null, [Validators.required, Validators.min(0.01)]],
      interestType: ['', Validators.required],
      interestFrequency: ['', Validators.required],
      startDate: ['', Validators.required],
      dueDate: ['', [Validators.required, this.dueDateAfterStartValidator()]],
    });

  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.isEditMode = true;
    this.selectedClient = this.getSavedClients().find((client) => client.id === id) ?? null;
    if (!this.selectedClient) {
      this.router.navigate(['/clientDetails']);
      return;
    }

    this.clientForm.patchValue({
      clientName: this.selectedClient.clientName,
      phoneNumber: this.selectedClient.phoneNumber,
      principalAmount: this.selectedClient.principalAmount,
      interestRate: this.selectedClient.interestRate,
      interestType: this.selectedClient.interestType ?? 'Simple Interest',
      interestFrequency: this.selectedClient.interestFrequency,
      startDate: this.parseDateValue(this.selectedClient.startDate),
      dueDate: this.parseDateValue(this.selectedClient.dueDate),
    });
  }

   dueDateAfterStartValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const dueDate = control.value;
      const startDate = this.clientForm?.get('startDate')?.value;

      if (!dueDate || !startDate) {
        return null;
      }

      return new Date(dueDate) > new Date(startDate) ? null : { dueDateInvalid: true };
    };
  }

  getErrorMessage(fieldName: string): string {
    const control = this.clientForm.get(fieldName);

    if (!control || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }

    if (control.errors['pattern']) {
      return fieldName === 'phoneNumber' ? 'Phone number must contain 10 digits' : `${this.getFieldLabel(fieldName)} is invalid`;
    }

    if (control.errors['min']) {
      return `${this.getFieldLabel(fieldName)} must be greater than 0`;
    }

    if (control.errors['dueDateInvalid']) {
      return 'Due date must be after the start date';
    }

    return 'Invalid value';
  }

  getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      clientName: 'Client Name',
      phoneNumber: 'Phone Number',
      principalAmount: 'Principal Amount',
      interestRate: 'Interest Rate',
      interestType: 'Interest Type',
      interestFrequency: 'Interest Frequency',
      startDate: 'Start Date',
      dueDate: 'Due Date',
    };

    return labels[fieldName] || fieldName;
  }

  cancelClient(): void {
    this.router.navigate(['/clientDetails']);
  }

  saveClient(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    const formValue = this.clientForm.value;
    const updatedFields = {
      clientName: formValue.clientName.trim(),
      phoneNumber: formValue.phoneNumber.trim(),
      principalAmount: Number(formValue.principalAmount),
      interestRate: Number(formValue.interestRate),
      interestType: formValue.interestType,
      interestFrequency: formValue.interestFrequency,
      startDate: this.formatDateValue(formValue.startDate),
      dueDate: this.formatDateValue(formValue.dueDate),
    };

    const savedClients = this.getSavedClients();
    if (this.isEditMode) {
      const index = savedClients.findIndex((client) => client.id === this.selectedClient?.id);
      if (index < 0) {
        this.router.navigate(['/clientDetails']);
        return;
      }

      const existingClient = savedClients[index];
      const payments = existingClient.payments ?? [];
      const recordedPayments = payments.reduce((total, payment) => total + this.toNumber(payment.paymentAmount), 0);
      const legacyAmountPaid = Math.max(0, this.toNumber(existingClient.amountPaid) - recordedPayments);
      const interest = this.loanInterest.calculateInterest({
        principal: updatedFields.principalAmount,
        rate: updatedFields.interestRate,
        type: updatedFields.interestType,
        frequency: updatedFields.interestFrequency,
        startDate: updatedFields.startDate,
      }, new Date());
      const allocation = this.loanInterest.calculatePaymentAllocation(
        0,
        updatedFields.principalAmount,
        interest,
        payments.map((payment) => ({
          paymentAmount: this.toNumber(payment.paymentAmount),
          principalPaid: payment.principalPaid,
          interestPaid: payment.interestPaid,
        })),
        legacyAmountPaid,
      );

      savedClients[index] = {
        ...existingClient,
        ...updatedFields,
        paymentStatus: this.loanInterest.calculatePaymentStatus(
          allocation.outstanding,
          updatedFields.dueDate,
          new Date(),
          allocation.totalPaid,
        ),
      };
    } else {
      const owner = this.authService.getCurrentUserName().trim();
      savedClients.push({
        id: this.createClientId(),
        ...(owner ? { owner } : {}),
        ...updatedFields,
        payments: [],
        amountPaid: 0,
        paymentStatus: 'Pending',
      });
    }
    window.localStorage.setItem(this.storageKey, JSON.stringify(savedClients));

    this.router.navigate(['/clientDetails']);
  }


   getSavedClients(): ViewClientData[] {
    if (typeof window === 'undefined') {
      return [];
    }

    const saved = window.localStorage.getItem(this.storageKey);

    if (!saved) {
      return [];
    }

    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed as ViewClientData[] : [];
    } catch {
      return [];
    }
  }

   formatDateValue(value: Date | string): string {
    const date = new Date(value);
    return date.toISOString().split('T')[0];
  }

   parseDateValue(value: string): Date | null {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

   createClientId(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

   toNumber(value: unknown): number {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }
}
