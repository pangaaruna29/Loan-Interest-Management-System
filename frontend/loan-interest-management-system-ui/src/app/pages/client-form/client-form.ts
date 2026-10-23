import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MaterialModule } from '../../material/material-module';
import { LoanInterestService, PaymentHistoryEntry } from '../../services/loan-interest.service';
import { ViewClientData } from '../view-client/view-client';
import { ClientService } from '../../services/client.service';

@Component({
  imports: [MaterialModule, CommonModule, ReactiveFormsModule],
  selector: 'app-client-form',
  styleUrl: './client-form.scss',
  templateUrl: './client-form.html',
})
export class ClientForm implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);

  clientForm: FormGroup;
  isEditMode = false;
  selectedClient: ViewClientData | null = null;
  isLoadingClient = false;
  isSaving = false;
  formError = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private loanInterest: LoanInterestService,
    private clientService: ClientService,
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
    if (!id || !isPlatformBrowser(this.platformId)) return;

    this.isEditMode = true;
    this.isLoadingClient = true;
    this.clientService.getClient(id).subscribe({
      next: (client) => {
        this.selectedClient = client;
        this.clientForm.patchValue({
          clientName: client.clientName,
          phoneNumber: client.phoneNumber,
          principalAmount: client.principalAmount,
          interestRate: client.interestRate,
          interestType: client.interestType ?? 'Simple Interest',
          interestFrequency: client.interestFrequency,
          startDate: this.parseDateValue(client.startDate),
          dueDate: this.parseDateValue(client.dueDate),
        });
        this.isLoadingClient = false;
      },
      error: (error) => {
        this.formError = error?.error?.message || 'Unable to load client. Please try again.';
        this.isLoadingClient = false;
      }
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
    if (this.clientForm.invalid || this.isSaving || this.isLoadingClient) {
      this.clientForm.markAllAsTouched();
      return;
    }
    this.formError = '';

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

    if (this.isEditMode) {
      const id = this.route.snapshot.paramMap.get('id');
      if (!id || !this.selectedClient) {
        this.formError = 'Unable to find the client to update.';
        return;
      }

      const payments = this.selectedClient.payments ?? [];
      const recordedPayments = payments.reduce((total, payment) => total + this.toNumber(payment.paymentAmount), 0);
      const legacyAmountPaid = Math.max(0, this.toNumber(this.selectedClient.amountPaid) - recordedPayments);
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

      const paymentStatus = this.loanInterest.calculatePaymentStatus(
          allocation.outstanding,
          updatedFields.dueDate,
          new Date(),
          allocation.totalPaid,
        );
      this.isSaving = true;
      this.clientService.updateClient(id, { ...updatedFields, paymentStatus }).subscribe({
        next: () => this.router.navigate(['/clientDetails']),
        error: (error) => {
          this.formError = error?.error?.message || 'Unable to update client. Please try again.';
          this.isSaving = false;
        }
      });
    } else {
      this.isSaving = true;
      this.clientService.createClient({
        ...updatedFields,
        payments: [],
        amountPaid: 0,
        paymentStatus: 'Pending',
      }).subscribe({
        next: () => this.router.navigate(['/clientDetails']),
        error: (error) => {
          this.formError = error?.error?.message || 'Unable to save client. Please try again.';
          this.isSaving = false;
        }
      });
    }
  }

   formatDateValue(value: Date | string): string {
    const date = value instanceof Date ? value : this.parseDateValue(value);
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

   parseDateValue(value: string): Date | null {
    const date = new Date(`${value.slice(0, 10)}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

   toNumber(value: unknown): number {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }
}
