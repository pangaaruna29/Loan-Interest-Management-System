import { Component } from '@angular/core';
import { MaterialModule } from '../../material/material-module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ClientData {
  clientName: string;
  phoneNumber: string;
  principalAmount: number;
  interestRate: number;
  interestFrequency: 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
  startDate: string;
  dueDate: string;
  paymentStatus: 'Paid' | 'Upcoming' | 'Overdue' | 'Partially Paid';
  amountPaid?: number;
}

@Component({
  imports: [MaterialModule, CommonModule, FormsModule],
  selector: 'app-client-details',
  styleUrl: './client-details.scss',
  templateUrl: './client-details.html',
})
export class ClientDetails {
  readonly storageKey = 'loanManagerClientDetails';
  searchText = '';
  statusFilter = 'All';
  frequencyFilter = 'All';
  sortBy = 'dueDate';
  selectedClient: ClientData | null = null;
  isDetailsOpen = false;

  columnDefs = [
    { key: 'clientName', label: 'Client Name' },
    { key: 'phoneNumber', label: 'Phone Number' },
    { key: 'principalAmount', label: 'Principal Amount' },
    { key: 'interestRate', label: 'Interest Rate' },
    { key: 'interestFrequency', label: 'Interest Frequency' },
    { key: 'startDate', label: 'Start Date' },
    { key: 'dueDate', label: 'Due Date' },
    { key: 'paymentStatus', label: 'Status' },
    { key: 'actions', label: 'Actions' },
  ];

  clientData: ClientData[] = this.loadClients();

  get displayedColumns(): string[] {
    return this.columnDefs.map((column) => column.key);
  }

  get filteredClients(): ClientData[] {
    const searchValue = this.searchText.trim().toLowerCase();

    let filtered = this.clientData.filter((client) => {
      const matchesSearch = !searchValue || client.clientName.toLowerCase().includes(searchValue);
      const matchesStatus = this.statusFilter === 'All' || client.paymentStatus === this.statusFilter;
      const matchesFrequency = this.frequencyFilter === 'All' || client.interestFrequency === this.frequencyFilter;

      return matchesSearch && matchesStatus && matchesFrequency;
    });

    filtered = filtered.sort((a, b) => {
      if (this.sortBy === 'dueDate') {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }

      if (this.sortBy === 'principalAmount') {
        return b.principalAmount - a.principalAmount;
      }

      return 0;
    });

    return filtered;
  }

  get summaryCards() {
    const totalClients = this.clientData.length;
    const totalPrincipal = this.clientData.reduce((sum, client) => sum + client.principalAmount, 0);
    const totalInterest = this.clientData.reduce((sum, client) => sum + this.getClientCalculation(client).totalInterest, 0);
    const totalDue = this.clientData.reduce((sum, client) => sum + this.getClientCalculation(client).totalDue, 0);
    const upcoming = this.clientData.filter((client) => client.paymentStatus === 'Upcoming').length;
    const overdue = this.clientData.filter((client) => client.paymentStatus === 'Overdue').length;

    return [
      { label: 'Total Clients', value: totalClients, icon: 'groups', accent: 'blue' },
      { label: 'Total Principal', value: this.formatCurrency(totalPrincipal), icon: 'currency_rupee', accent: 'navy' },
      { label: 'Total Interest', value: this.formatCurrency(totalInterest), icon: 'trending_up', accent: 'green' },
      { label: 'Total Amount Due', value: this.formatCurrency(totalDue), icon: 'receipt_long', accent: 'violet' },
      { label: 'Upcoming Payments', value: upcoming, icon: 'schedule', accent: 'orange' },
      { label: 'Overdue Payments', value: overdue, icon: 'warning', accent: 'red' },
    ];
  }

  viewClient(client: ClientData): void {
    this.selectedClient = client;
    this.isDetailsOpen = true;
  }

  editClient(client: ClientData): void {
    this.selectedClient = client;
    this.isDetailsOpen = true;
  }

  deleteClient(clientName: string): void {
    this.clientData = this.clientData.filter((client) => client.clientName !== clientName);
    this.saveClients();

    if (this.selectedClient?.clientName === clientName) {
      this.closeDetails();
    }
  }

  closeDetails(): void {
    this.selectedClient = null;
    this.isDetailsOpen = false;
  }

  getClientCalculation(client: ClientData) {
    const periods = this.getInterestPeriods(client.startDate, client.dueDate, client.interestFrequency);
    const interestPerPeriod = (client.principalAmount * client.interestRate) / 100;
    const totalInterest = interestPerPeriod * periods;
    const totalDue = client.principalAmount + totalInterest;
    const amountPaid = client.amountPaid ?? 0;
    const remaining = Math.max(totalDue - amountPaid, 0);

    return {
      periods,
      interestPerPeriod,
      totalInterest,
      totalDue,
      amountPaid,
      remaining,
    };
  }

  getDueSummary(client: ClientData) {
    const today = new Date();
    const dueDate = new Date(client.dueDate);
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (client.paymentStatus === 'Paid') {
      return 'Paid';
    }

    if (diffDays > 0) {
      return `Due in ${diffDays} days`;
    }

    if (diffDays === 0) {
      return 'Due Today';
    }

    return `Overdue by ${Math.abs(diffDays)} days`;
  }

  getInterestPeriods(startDate: string, endDate: string, frequency: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    if (diffDays <= 0) {
      return 0;
    }

    switch (frequency) {
      case 'Daily':
        return diffDays;
      case 'Weekly':
        return Math.floor(diffDays / 7);
      case 'Monthly': {
        const monthDiff = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        return monthDiff > 0 ? monthDiff : 0;
      }
      case 'Yearly':
        return end.getFullYear() - start.getFullYear();
      default:
        return 0;
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Paid':
        return 'status-paid';
      case 'Upcoming':
        return 'status-upcoming';
      case 'Overdue':
        return 'status-overdue';
      case 'Partially Paid':
        return 'status-partial';
      default:
        return 'status-upcoming';
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  }

  formatRate(value: number): string {
    return `${value}%`;
  }

  formatDate(value: string): string {
    return value ? new Date(value).toLocaleDateString() : '';
  }

  private loadClients(): ClientData[] {
    const defaultClients: ClientData[] = [
      {
        clientName: 'John Smith',
        phoneNumber: '+1 555 0101',
        principalAmount: 50000,
        interestRate: 2,
        interestFrequency: 'Monthly',
        startDate: '2026-09-01',
        dueDate: '2026-12-01',
        paymentStatus: 'Upcoming',
        amountPaid: 12000,
      },
      {
        clientName: 'Aisha Khan',
        phoneNumber: '+1 555 0145',
        principalAmount: 75000,
        interestRate: 3,
        interestFrequency: 'Monthly',
        startDate: '2026-08-10',
        dueDate: '2026-09-22',
        paymentStatus: 'Overdue',
        amountPaid: 15000,
      },
      {
        clientName: 'Michael Lee',
        phoneNumber: '+1 555 0167',
        principalAmount: 30000,
        interestRate: 1.5,
        interestFrequency: 'Weekly',
        startDate: '2026-09-05',
        dueDate: '2026-09-28',
        paymentStatus: 'Partially Paid',
        amountPaid: 15000,
      },
      {
        clientName: 'Priya Nair',
        phoneNumber: '+1 555 0182',
        principalAmount: 120000,
        interestRate: 4,
        interestFrequency: 'Yearly',
        startDate: '2025-12-01',
        dueDate: '2026-12-01',
        paymentStatus: 'Paid',
        amountPaid: 123000,
      },
      {
        clientName: 'David Clark',
        phoneNumber: '+1 555 0198',
        principalAmount: 22000,
        interestRate: 2.5,
        interestFrequency: 'Daily',
        startDate: '2026-09-12',
        dueDate: '2026-09-30',
        paymentStatus: 'Upcoming',
        amountPaid: 5000,
      },
    ];

    if (typeof window === 'undefined') {
      return defaultClients;
    }

    const savedClients = window.localStorage.getItem(this.storageKey);

    if (!savedClients) {
      return defaultClients;
    }

    try {
      const parsedClients = JSON.parse(savedClients);
      return Array.isArray(parsedClients) && parsedClients.length ? parsedClients : defaultClients;
    } catch {
      return defaultClients;
    }
  }

  private saveClients(): void {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(this.storageKey, JSON.stringify(this.clientData));
    }
  }
}
