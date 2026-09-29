import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MaterialModule } from '../../material/material-module';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router, RouterModule } from '@angular/router';
import { LoanInterestService } from '../../services/loan-interest.service';
import { ViewClient, ViewClientData } from '../view-client/view-client';
import { PaymentOption } from '../../payment-option/payment-option';

interface ClientColumn {
  key: string;
  label: string;
}

@Component({
  imports: [MaterialModule, CommonModule, FormsModule, RouterModule, ViewClient, PaymentOption],
  selector: 'app-client-details',
  styleUrl: './client-details.scss',
  templateUrl: './client-details.html',
})
export class ClientDetails implements OnInit, AfterViewInit {
  readonly columnDefs: ClientColumn[] = [
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
  readonly displayedColumns = this.columnDefs.map((column) => column.key);
  readonly dataSource = new MatTableDataSource<ViewClientData>([]);
  readonly storageKey = 'loanManagerClientDetails';
  readonly statusOptions = ['All', 'Pending', 'Partially Paid', 'Paid', 'Overdue'];
  readonly interestTypeOptions = ['All', 'Simple Interest', 'Compound Interest'];
  readonly frequencyOptions = ['All', 'Daily', 'Weekly', 'Monthly', 'Yearly'];

  clients: ViewClientData[] = [];
  selectedClient: ViewClientData | null = null;
  selectedPaymentClient: ViewClientData | null = null;
  selectedPaymentClientIndex: number | null = null;
  searchTerm = '';
  selectedStatus = 'All';
  selectedInterestType = 'All';
  selectedFrequency = 'All';
  private readonly today = new Date();

  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private readonly router: Router,
    private readonly loanInterest: LoanInterestService,
  ) {
    this.dataSource.filterPredicate = (client, filter) => this.matchesFilters(client, JSON.parse(filter));
    this.dataSource.sortingDataAccessor = (client, property) => {
      if (property === 'paymentStatus') return this.getStatus(client);
      const value = client[property as keyof ViewClientData];
      if (property === 'startDate' || property === 'dueDate') return new Date(String(value)).getTime();
      return typeof value === 'number' ? value : String(value ?? '').toLocaleLowerCase();
    };
  }

  ngOnInit(): void {
    this.loadClients();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  get totalPrincipal(): number {
    return this.clients.reduce((total, client) => total + this.toNumber(client.principalAmount), 0);
  }

  get totalInterest(): number {
    return this.clients.reduce((total, client) => total + this.getInterest(client), 0);
  }

  get totalCollected(): number {
    return this.clients.reduce((total, client) => total + this.toNumber(client.amountPaid), 0);
  }

  get totalOutstanding(): number {
    return this.clients.reduce((total, client) => total + this.getOutstanding(client), 0);
  }

  get activeLoans(): number {
    return this.clients.filter((client) => this.getStatus(client) !== 'Paid').length;
  }

  get overdueLoans(): number {
    return this.clients.filter((client) => this.getStatus(client) === 'Overdue').length;
  }

  get summaryCards(): { label: string; value: string; icon: string; tone: string }[] {
    return [
      { label: 'Total Clients', value: String(this.clients.length), icon: 'groups', tone: 'blue' },
      { label: 'Active Loans', value: String(this.activeLoans), icon: 'account_balance', tone: 'teal' },
      { label: 'Total Principal', value: this.formatCurrency(this.totalPrincipal), icon: 'payments', tone: 'green' },
      { label: 'Total Interest', value: this.formatCurrency(this.totalInterest), icon: 'trending_up', tone: 'amber' },
      { label: 'Total Collected', value: this.formatCurrency(this.totalCollected), icon: 'savings', tone: 'slate' },
      { label: 'Total Outstanding', value: this.formatCurrency(this.totalOutstanding), icon: 'account_balance_wallet', tone: 'coral' },
      { label: 'Overdue Loans', value: String(this.overdueLoans), icon: 'schedule', tone: 'rose' },
    ];
  }

  loadClients(): void {
    if (typeof window === 'undefined') return;

    try {
      const saved = JSON.parse(window.localStorage.getItem(this.storageKey) ?? '[]');
      this.clients = Array.isArray(saved) ? saved : [];
      let addedIds = false;
      for (const client of this.clients) {
        if (!client.id) {
          client.id = this.createClientId();
          addedIds = true;
        }
      }
      if (addedIds) window.localStorage.setItem(this.storageKey, JSON.stringify(this.clients));
    } catch {
      this.clients = [];
    }

    this.dataSource.data = this.clients;
    this.applyFilters();
  }

  applyFilters(): void {
    this.dataSource.filter = JSON.stringify({
      search: this.searchTerm.trim().toLocaleLowerCase(),
      status: this.selectedStatus,
      interestType: this.selectedInterestType,
      frequency: this.selectedFrequency,
    });
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedStatus = 'All';
    this.selectedInterestType = 'All';
    this.selectedFrequency = 'All';
    this.applyFilters();
  }

  viewClient(client: ViewClientData): void {
    this.selectedClient = this.selectedClient === client ? null : client;
  }

  closeClientView(): void {
    this.selectedClient = null;
  }

  editClient(client: ViewClientData): void {
    if (!client.id) {
      client.id = this.createClientId();
      window.localStorage.setItem(this.storageKey, JSON.stringify(this.clients));
    }
    this.router.navigate(['/clients/edit', client.id]);
  }

  recordPayment(client: ViewClientData): void {
    this.selectedPaymentClient = client;
    this.selectedPaymentClientIndex = this.clients.indexOf(client);
  }

  closePaymentPopup(): void {
    this.selectedPaymentClient = null;
    this.selectedPaymentClientIndex = null;
  }

  onPaymentSaved(updatedClient: ViewClientData): void {
    const index = this.clients.findIndex((client) => client.phoneNumber === updatedClient.phoneNumber && client.clientName === updatedClient.clientName);
    if (index >= 0) this.clients[index] = updatedClient;
    this.dataSource.data = [...this.clients];
    this.applyFilters();
  }

  getStatus(client: ViewClientData): string {
    const interest = this.getInterest(client);
    const paid = this.toNumber(client.amountPaid);
    const outstanding = Math.max(0, this.toNumber(client.principalAmount) + interest - paid);

    if (outstanding <= 0) return 'Paid';
    if (this.loanInterest.elapsedDays(client.dueDate, this.today) > 0) return 'Overdue';
    if (paid > 0) return 'Partially Paid';

    const legacyStatus = String(client.paymentStatus ?? 'Pending');
    return legacyStatus === 'Upcoming' || legacyStatus === 'Active' ? 'Pending' : legacyStatus;
  }

  getInterest(client: ViewClientData, throughDate: Date = this.today): number {
    return this.loanInterest.calculateInterest({
      principal: this.toNumber(client.principalAmount),
      rate: this.toNumber(client.interestRate),
      type: client.interestType ?? 'Simple Interest',
      frequency: client.interestFrequency,
      startDate: client.startDate,
    }, throughDate);
  }

  getOverdueDays(client: ViewClientData): number {
    return this.loanInterest.elapsedDays(client.dueDate, this.today);
  }

  getElapsedDays(client: ViewClientData): number {
    return this.loanInterest.elapsedDays(client.startDate, this.today);
  }

  getElapsedMonths(client: ViewClientData): number {
    return this.loanInterest.elapsedMonths(client.startDate, this.today);
  }

  getOverdueInterest(client: ViewClientData): number {
    const overdueDays = this.getOverdueDays(client);
    if (overdueDays <= 0) return 0;
    return this.loanInterest.calculateOverdueInterest({
      principal: this.toNumber(client.principalAmount),
      rate: this.toNumber(client.interestRate),
      type: client.interestType ?? 'Simple Interest',
      frequency: client.interestFrequency,
    }, client.dueDate, this.today);
  }

  getOutstanding(client: ViewClientData): number {
    return this.loanInterest.calculateOutstandingBalance(
      this.toNumber(client.principalAmount),
      this.getInterest(client),
      this.toNumber(client.amountPaid),
    );
  }

  getStatusClass(client: ViewClientData): string {
    return this.getStatus(client).toLocaleLowerCase().replace(/\s+/g, '-');
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);
  }

  private matchesFilters(client: ViewClientData, filters: { search: string; status: string; interestType: string; frequency: string }): boolean {
    const searchMatches = !filters.search || `${client.clientName} ${client.phoneNumber}`.toLocaleLowerCase().includes(filters.search);
    const statusMatches = filters.status === 'All' || this.getStatus(client) === filters.status;
    const typeMatches = filters.interestType === 'All' || (client.interestType ?? 'Simple Interest') === filters.interestType;
    const frequencyMatches = filters.frequency === 'All' || client.interestFrequency === filters.frequency;
    return searchMatches && statusMatches && typeMatches && frequencyMatches;
  }

  private toNumber(value: unknown): number {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  private createClientId(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}
