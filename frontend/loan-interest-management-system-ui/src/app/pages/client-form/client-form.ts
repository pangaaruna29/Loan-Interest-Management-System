import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MaterialModule } from '../../material/material-module';

export interface ClientRecord {
  clientName: string;
  phoneNumber: string;
  principalAmount: number;
  interestRate: number;
  interestFrequency: string;
  startDate: string;
  dueDate: string;
  paymentStatus: string;
}

@Component({
  imports: [MaterialModule, CommonModule, ReactiveFormsModule],
  selector: 'app-client-form',
  styleUrl: './client-form.scss',
  templateUrl: './client-form.html',
})
export class ClientForm {
  clientForm: FormGroup;
  private readonly storageKey = 'loanManagerClientDetails';

  constructor(private fb: FormBuilder, private router: Router) {
    this.clientForm = this.fb.group({
      clientName: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      principalAmount: [null, [Validators.required, Validators.min(1)]],
      interestRate: [null, [Validators.required, Validators.min(0.01)]],
      interestFrequency: ['', Validators.required],
      startDate: ['', Validators.required],
      dueDate: ['', [Validators.required, this.dueDateAfterStartValidator()]],
      status: ['', Validators.required],
    });
  }

  private dueDateAfterStartValidator(): ValidatorFn {
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
      interestFrequency: 'Interest Frequency',
      startDate: 'Start Date',
      dueDate: 'Due Date',
      status: 'Status',
    };

    return labels[fieldName] || fieldName;
  }

  cancelClient(): void {
    this.clientForm.reset();
    this.clientForm.markAsPristine();
    this.clientForm.markAsUntouched();
  }

  saveClient(): void {
    if (this.clientForm.invalid) {
      this.clientForm.markAllAsTouched();
      return;
    }

    const formValue = this.clientForm.value;
    const newClient: ClientRecord = {
      clientName: formValue.clientName.trim(),
      phoneNumber: formValue.phoneNumber.trim(),
      principalAmount: Number(formValue.principalAmount),
      interestRate: Number(formValue.interestRate),
      interestFrequency: formValue.interestFrequency,
      startDate: this.formatDateValue(formValue.startDate),
      dueDate: this.formatDateValue(formValue.dueDate),
      paymentStatus: this.mapStatus(formValue.status),
    };

    const savedClients = this.getSavedClients();
    savedClients.push(newClient);
    window.localStorage.setItem(this.storageKey, JSON.stringify(savedClients));

    this.router.navigate(['/clientDetails']);
  }

  private mapStatus(status: string): string {
    const statusMap: Record<string, string> = {
      Upcoming: 'Upcoming',
      Active: 'Upcoming',
      Paid: 'Paid',
      'Partially Paid': 'Partially Paid',
      Overdue: 'Overdue',
    };

    return statusMap[status] || 'Upcoming';
  }

  private getSavedClients(): ClientRecord[] {
    if (typeof window === 'undefined') {
      return [];
    }

    const saved = window.localStorage.getItem(this.storageKey);

    if (!saved) {
      return [];
    }

    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private formatDateValue(value: Date | string): string {
    const date = new Date(value);
    return date.toISOString().split('T')[0];
  }
}
