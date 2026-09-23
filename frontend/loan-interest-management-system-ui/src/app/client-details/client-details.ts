import { Component } from '@angular/core';
import { MaterialModule } from '../material/material-module';
import { MatTableDataSource } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface ClientData {
  clientName: string;
  phoneNumber: string;
  principalAmount: number;
  interestRate: number;
  interestFrequency: string;
  startDate: string;
  returnDate: string;
  totalAmount: number;
  amountPaid: number;
  balanceAmount: number;
  paymentStatus: string;
}

@Component({
  imports: [MaterialModule, CommonModule, FormsModule],
  selector: 'app-client-details',
  styleUrl: './client-details.scss',
  templateUrl: './client-details.html',
})
export class ClientDetails {
  clientData: ClientData[] = [
    {
      clientName: 'John Smith',
      phoneNumber: '+1 555 0101',
      principalAmount: 25000,
      interestRate: 12,
      interestFrequency: 'Monthly',
      startDate: '2025-01-10',
      returnDate: '2025-07-10',
      totalAmount: 28000,
      amountPaid: 18000,
      balanceAmount: 10000,
      paymentStatus: 'Partial',
    },
    {
      clientName: 'Aisha Khan',
      phoneNumber: '+1 555 0145',
      principalAmount: 40000,
      interestRate: 10,
      interestFrequency: 'Weekly',
      startDate: '2025-02-12',
      returnDate: '2025-08-12',
      totalAmount: 44000,
      amountPaid: 44000,
      balanceAmount: 0,
      paymentStatus: 'Paid',
    },
  ];
  dataSource = new MatTableDataSource<ClientData>(this.clientData);
  columnDefs = [
    { key: 'clientName', label: 'Client Name' },
    { key: 'phoneNumber', label: 'Phone Number' },
    { key: 'principalAmount', label: 'Principal Amount' },
    { key: 'interestRate', label: 'Interest Rate' },
    { key: 'interestFrequency', label: 'Interest Frequency' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'returnDate', label: 'Return Date' },
    { key: 'totalAmount', label: 'Total Amount' },
    { key: 'amountPaid', label: 'Amount Paid' },
    { key: 'balanceAmount', label: 'Balance Amount' },
    { key: 'paymentStatus', label: 'Status' },
    { key: 'actions', label: 'Actions' },
  ];
constructor(private rt:Router){}
  getDisplayedColumns(): string[] {
    return this.columnDefs.map((col) => col.key);
  }
  addClient() {
    this.rt.navigate(['/clientform'])
    console.log('Add client clicked');
  }

  viewClient() {
    console.log('view client clicked');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Pending':
        return 'status-pending';
      case 'Partial':
        return 'status-partial';
      case 'Paid':
        return 'status-paid';
      case 'Overdue':
        return 'status-overdue';
      default:
        return 'status-pending';
    }
  }

  formatDate(value: string) {
    return value ? new Date(value).toLocaleDateString() : '';
  }
}
