import { Component } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MaterialModule } from '../material/material-module';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

export interface ClientFormData {
  clientName: string;
  phoneNumber: string;
  principalAmount: number;
  interestRate: number;
  interestFrequency: string;
  startDate: Date | string;
  returnDate: Date | string;
  totalAmount: number;
  amountPaid: number;
  balanceAmount: number;
  status: string;
}

@Component({
  imports: [MaterialModule, CommonModule, FormsModule, ReactiveFormsModule],
  selector: 'app-client-form',
  styleUrl: './client-form.scss',
  templateUrl: './client-form.html',
})
export class ClientForm {
  clientForm!: FormGroup;

  constructor(private fb: FormBuilder, private rt: Router) {
    this.clientForm = this.fb.group({
      clientName: ['', Validators.required],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      principalAmount: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+(\.\d+)?$/)]],
      interestRate: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+(\.\d+)?$/)]],
      interestFrequency: ['', Validators.required],
      startDate: ['', [Validators.required, this.startDateValidator()]],
      returnDate: ['', [Validators.required, this.returnDateValidator(), this.returnDateAfterStartDateValidator()]],
      totalAmount: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+(\.\d+)?$/)]],
      amountPaid: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+(\.\d+)?$/)]],
      balanceAmount: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+(\.\d+)?$/)]],
      status: ['', Validators.required],
    });
  }

  ngOnInIt() {

  }

  private startDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const selectedDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        return { pastDate: true };
      }

      return null;
    };
  }

  private returnDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const selectedDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate <= today) {
        return { futureDate: true };
      }

      return null;
    };
  }

  private returnDateAfterStartDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const returnDate = new Date(control.value);
      const startDate = this.clientForm?.get('startDate')?.value;

      if (!startDate) {
        return null;
      }

      if (returnDate <= new Date(startDate)) {
        return { mustBeAfterStartDate: true };
      }

      return null;
    };
  }

  getErrorMessage(fieldName: string): string {
    const control = this.clientForm?.get(fieldName);

    if (!control || !control.errors) {
      return '';
    }

    const errorMessages: Record<string, string> = {
      required: `${this.getFieldLabel(fieldName)} is required`,
      pattern: fieldName === 'phoneNumber'
        ? 'Only 10 digits are allowed'
        : `${this.getFieldLabel(fieldName)} accepts only numbers`,
      min: `${this.getFieldLabel(fieldName)} must be greater than or equal to 0`,
      pastDate: `${this.getFieldLabel(fieldName)} cannot be in the past`,
      futureDate: `${this.getFieldLabel(fieldName)} must be a future date`,
      mustBeAfterStartDate: `${this.getFieldLabel(fieldName)} must be after the start date`,
    };

    const errorKey = Object.keys(control.errors)[0];
    return errorMessages[errorKey] || 'Invalid value';
  }

  getFieldLabel(fieldName: string): string {
    const labels: Record<string, string> = {
      clientName: 'Client Name',
      phoneNumber: 'Phone Number',
      principalAmount: 'Principal Amount',
      interestRate: 'Interest Rate',
      interestFrequency: 'Interest Frequency',
      startDate: 'Start Date',
      returnDate: 'Return Date',
      totalAmount: 'Total Amount',
      amountPaid: 'Amount Paid',
      balanceAmount: 'Balance Amount',
      status: 'Status',
    };

    return labels[fieldName] || fieldName;
  }
  cancelClient(){
this.clientForm.reset()
  }
  saveClient(){
    const client = this.clientForm.value;
  }
}
