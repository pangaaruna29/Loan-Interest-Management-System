import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material/material-module';
import { FormsModule } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router, RouterModule } from '@angular/router';
import { LoanInterestService } from '../../services/loan-interest.service';
import { ViewClient, ViewClientData } from '../view-client/view-client';
import { PaymentOption } from '../payment-option/payment-option';
import { AuthService } from '../../services/auth.service';
import { ClientService } from '../../services/client.service';

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
export class ClientDetails implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly demoClients: ViewClientData[] = [
    {
      id: 'demo-client-1',
      clientName: 'client1',
      phoneNumber: '0000000001',
      principalAmount: 50000,
      interestRate: 2,
      interestType: 'Simple Interest',
      interestFrequency: 'Monthly',
      startDate: '2025-01-01',
      dueDate: '2099-12-31',
      paymentStatus: 'Pending',
      amountPaid: 0,
      payments: [],
    },
    {
      id: 'demo-client-2',
      clientName: 'client2',
      phoneNumber: '0000000002',
      principalAmount: 25000,
      interestRate: 1.5,
      interestType: 'Simple Interest',
      interestFrequency: 'Monthly',
      startDate: '2025-03-01',
      dueDate: '2099-12-31',
      paymentStatus: 'Partially Paid',
      amountPaid: 5000,
      payments: [],
    },
    {
      id: 'demo-client-3',
      clientName: 'client3',
      phoneNumber: '0000000003',
      principalAmount: 10000,
      interestRate: 2,
      interestType: 'Compound Interest',
      interestFrequency: 'Monthly',
      startDate: '2025-02-01',
      dueDate: '2025-06-30',
      paymentStatus: 'Overdue',
      amountPaid: 0,
      payments: [],
    },
  ];

   columnDefs: ClientColumn[] = [
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
  displayedColumns = this.columnDefs.filter((column) => column.key !== 'actions').map((column) => column.key);
   dataSource = new MatTableDataSource<ViewClientData>([]);
    clientsLoading = true;
    clientsError = '';
   statusOptions = ['All', 'Pending', 'Partially Paid', 'Paid', 'Overdue'];
   interestTypeOptions = ['All', 'Simple Interest', 'Compound Interest'];
   frequencyOptions = ['All', 'Daily', 'Weekly', 'Monthly', 'Yearly'];

  clients: ViewClientData[] = [];
  selectedClient: ViewClientData | null = null;
  selectedPaymentClient: ViewClientData | null = null;
  searchTerm = '';
  selectedStatus = 'All';
  selectedInterestType = 'All';
  selectedFrequency = 'All';
  today = new Date();
  userName:string='';
  isLoggedIn = false;

  @ViewChild(MatSort)
  set matSort(sort: MatSort | undefined) {
    if (sort) this.dataSource.sort = sort;
  }

  @ViewChild(MatPaginator)
  set matPaginator(paginator: MatPaginator | undefined) {
    if (paginator) this.dataSource.paginator = paginator;
  }

  constructor(
    private  router: Router,
    private  loanInterest: LoanInterestService,
    private authservice: AuthService,
    private clientService: ClientService,
    private cdr: ChangeDetectorRef,
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
    this.authservice.restoreSession().subscribe({
      next: (user) => {
        this.userName = user?.userName ?? '';
        this.isLoggedIn = Boolean(user);
        this.updateColumns();
        if (this.isLoggedIn) {
          this.loadClients();
          return;
        }
        this.showDemoClients();
      },
      error: (error) => {
        this.clientsError = error?.error?.message || 'Unable to verify your session. Please try again.';
        this.clientsLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private showDemoClients(): void {
    this.clients = this.demoClients.map((client) => ({ ...client, payments: [] }));
    this.dataSource.data = this.clients;
    this.applyFilters();
    this.clientsLoading = false;
    this.clientsError = '';
    this.cdr.markForCheck();
  }

  loadClients(): void {
    if (!this.isLoggedIn) {
      this.showDemoClients();
      return;
    }
    this.clientsLoading = true;
    this.clientsError = '';
    this.clientService.getClients().subscribe({
      next: (clients) => {
        this.clients = clients;
        this.dataSource.data = clients;
        this.applyFilters();
        this.clientsLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.clients = [];
        this.dataSource.data = [];
        this.clientsError = error?.error?.message || 'Unable to load clients. Please try again.';
        this.clientsLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  updateColumns(): void {
    this.displayedColumns = this.columnDefs
      .filter((column) => column.key !== 'actions' || this.isLoggedIn)
      .map((column) => column.key);
  }

  totalPrincipal(): number {
    return this.clients.reduce((total, client) => total + this.toNumber(client.principalAmount), 0);
  }

  totalInterest(): number {
    return this.clients.reduce((total, client) => total + this.getInterest(client), 0);
  }

  totalCollected(): number {
    return this.clients.reduce((total, client) => total + this.toNumber(client.amountPaid), 0);
  }

  totalOutstanding(): number {
    return this.clients.reduce((total, client) => total + this.getOutstanding(client), 0);
  }

  activeLoans(): number {
    return this.clients.filter((client) => this.getStatus(client) !== 'Paid').length;
  }

  overdueLoans(): number {
    return this.clients.filter((client) => this.getStatus(client) === 'Overdue').length;
  }

  summaryCards(): { label: string; value: string; icon: string; tone: string }[] {
    return [
      { label: 'Total Clients', value: String(this.clients.length), icon: 'groups', tone: 'blue' },
      { label: 'Active Loans', value: String(this.activeLoans()), icon: 'account_balance', tone: 'teal' },
      { label: 'Total Principal', value: this.formatCurrency(this.totalPrincipal()), icon: 'payments', tone: 'green' },
      { label: 'Total Interest', value: this.formatCurrency(this.totalInterest()), icon: 'trending_up', tone: 'amber' },
      { label: 'Total Collected', value: this.formatCurrency(this.totalCollected()), icon: 'savings', tone: 'slate' },
      { label: 'Total Outstanding', value: this.formatCurrency(this.totalOutstanding()), icon: 'account_balance_wallet', tone: 'coral' },
      { label: 'Overdue Loans', value: String(this.overdueLoans()), icon: 'schedule', tone: 'rose' },
    ];
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
    if (!this.isLoggedIn) return;
    const id = this.clientId(client);
    if (!id) return;
    this.clientService.getClient(id).subscribe({
      next: (record) => {
        this.selectedClient = record;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.clientsError = error?.error?.message || 'Unable to load client details.';
        this.cdr.markForCheck();
      }
    });
  }

  closeClientView(): void {
    this.selectedClient = null;
  }

  editClient(client: ViewClientData): void {
    if (!this.isLoggedIn) return;
    const id = this.clientId(client);
    if (id) this.router.navigate(['/clients/edit', id]);
  }

  deleteClient(client: ViewClientData): void {
    if (!this.isLoggedIn) return;
    const id = this.clientId(client);
    if (!id || (typeof window !== 'undefined' && !window.confirm(`Delete ${client.clientName}?`))) return;
    this.clientService.deleteClient(id).subscribe({
      next: () => this.loadClients(),
      error: (error) => {
        this.clientsError = error?.error?.message || 'Unable to delete client.';
        this.cdr.markForCheck();
      }
    });
  }

  private clientId(client: ViewClientData): string | undefined {
    const mongoId = client['_id'];
    return client.id ?? (typeof mongoId === 'string' ? mongoId : undefined);
  }

  recordPayment(client: ViewClientData): void {
    if (!this.isLoggedIn) return;
    this.selectedPaymentClient = client;
  }

  closePaymentPopup(): void {
    this.selectedPaymentClient = null;
  }

  onPaymentSaved(updatedClient: ViewClientData): void {
    const id = this.clientId(updatedClient);
    const index = this.clients.findIndex((client) => this.clientId(client) === id);
    if (index < 0) return;
    this.clients[index] = updatedClient;
    this.dataSource.data = [...this.clients];
    this.applyFilters();
    this.cdr.markForCheck();
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

   matchesFilters(client: ViewClientData, filters: { search: string; status: string; interestType: string; frequency: string }): boolean {
    const searchMatches = !filters.search || `${client.clientName} ${client.phoneNumber}`.toLocaleLowerCase().includes(filters.search);
    const statusMatches = filters.status === 'All' || this.getStatus(client) === filters.status;
    const typeMatches = filters.interestType === 'All' || (client.interestType ?? 'Simple Interest') === filters.interestType;
    const frequencyMatches = filters.frequency === 'All' || client.interestFrequency === filters.frequency;
    return searchMatches && statusMatches && typeMatches && frequencyMatches;
  }

   toNumber(value: unknown): number {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

}
