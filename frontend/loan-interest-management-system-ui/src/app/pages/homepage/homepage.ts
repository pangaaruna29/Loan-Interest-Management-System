import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { MaterialModule } from '../../material/material-module';
import { AuthService } from '../../services/auth.service';
import { ClientService, DashboardSummary, PublicDashboardSummary } from '../../services/client.service';

interface StatCard {
  title: string;
  value: string;
  detail: string;
  icon: string;
  tone: string;
}

interface MonthlyPayment {
  label: string;
  amount: number;
}

interface MonthlyLoanCount {
  label: string;
  activeLoans: number;
  dueSoonLoans: number;
  activeHeight: number;
  dueSoonHeight: number;
}

interface OverviewMetric {
  title: string;
  value: string;
}

@Component({
  imports: [CommonModule, MaterialModule],
  selector: 'app-homepage',
  styleUrl: './homepage.scss',
  templateUrl: './homepage.html',
})
export class Homepage implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly now = new Date();

  stats: StatCard[] = [
    { title: 'Total Clients', value: '—', detail: 'Across all accounts', icon: 'groups', tone: 'blue' },
    { title: 'Active Loans', value: '—', detail: 'Due soon: —', icon: 'receipt_long', tone: 'purple' },
    { title: 'Total Amount Given', value: '—', detail: 'Across all loans', icon: 'payments', tone: 'green' },
    { title: 'Total Amount Received', value: '—', detail: 'Collected to date', icon: 'currency_rupee', tone: 'amber' },
    { title: 'Outstanding Balance', value: '—', detail: 'Current receivables', icon: 'account_balance_wallet', tone: 'mint' },
  ];
  overviewMetrics: OverviewMetric[] = [
    { title: 'Total Clients', value: '—' },
    { title: 'Amount Given', value: '—' },
    { title: 'Amount Paid', value: '—' },
    { title: 'Outstanding', value: '—' },
  ];

  chartValues: number[] = [];
  chartLabels: string[] = [];
  monthlyPayments: MonthlyPayment[] = [];
  publicLoanCounts: MonthlyLoanCount[] = [];
  hasRecentPayments = false;
  hasPublicLoanCounts = false;
  dashboardLoading = true;
  dashboardError = '';
  sessionChecked = false;
  isLoggedIn = false;

  constructor(
    private readonly authService: AuthService,
    private readonly clientService: ClientService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.authService.restoreSession().subscribe({
      next: (user) => {
        this.sessionChecked = true;
        this.isLoggedIn = Boolean(user);
        if (!user) {
          this.loadPublicDashboard();
          return;
        }
        this.loadDashboard();
      },
      error: (error) => {
        this.sessionChecked = true;
        this.dashboardLoading = false;
        this.dashboardError = error?.error?.message || 'Unable to verify your session. Please try again.';
        this.cdr.markForCheck();
      }
    });
  }

  private loadDashboard(): void {
    this.clientService.getDashboardSummary().subscribe({
      next: (summary) => {
        this.updateStats(summary);
        this.updatePaymentChart(summary);
        this.dashboardLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.dashboardError = error?.error?.message || 'Unable to load the organization-wide summary. Please try again.';
        this.dashboardLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private loadPublicDashboard(): void {
    this.clientService.getPublicDashboardSummary().subscribe({
      next: (summary) => {
        this.updatePublicStats(summary);
        this.dashboardLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.dashboardError = error?.error?.message || 'Unable to load public dashboard counts. Please try again.';
        this.dashboardLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private updatePublicStats(summary: PublicDashboardSummary): void {
    this.stats = [
      { title: 'Total Clients', value: String(summary.totalClients), detail: 'Across all accounts', icon: 'groups', tone: 'blue' },
      { title: 'Active Loans', value: String(summary.activeLoans), detail: 'Across all accounts', icon: 'receipt_long', tone: 'purple' },
      { title: 'Due Soon', value: String(summary.dueSoonLoans), detail: 'Within 30 days', icon: 'schedule', tone: 'amber' },
    ];
    this.overviewMetrics = [];
    this.updatePublicLoanChart(summary);
    this.monthlyPayments = [];
    this.chartLabels = [];
    this.chartValues = [];
    this.hasRecentPayments = false;
  }

  private updatePublicLoanChart(summary: PublicDashboardSummary): void {
    const months = Array.from({ length: 8 }, (_, offset) => {
      const date = new Date(this.now.getFullYear(), this.now.getMonth() - 7 + offset, 1);
      const entry = summary.monthlyLoanCounts.find(
        (count) => count.year === date.getFullYear() && count.month === date.getMonth() + 1,
      );
      return {
        label: date.toLocaleDateString('en', { month: 'short' }),
        activeLoans: entry?.activeLoans ?? 0,
        dueSoonLoans: entry?.dueSoonLoans ?? 0,
      };
    });
    const maximum = Math.max(...months.flatMap((month) => [month.activeLoans, month.dueSoonLoans]), 0);
    this.publicLoanCounts = months.map((month) => ({
      ...month,
      activeHeight: maximum > 0 && month.activeLoans > 0 ? Math.max(4, (month.activeLoans / maximum) * 100) : 0,
      dueSoonHeight: maximum > 0 && month.dueSoonLoans > 0 ? Math.max(4, (month.dueSoonLoans / maximum) * 100) : 0,
    }));
    this.hasPublicLoanCounts = months.some((month) => month.activeLoans > 0 || month.dueSoonLoans > 0);
  }

  private updateStats(summary: DashboardSummary): void {
    this.stats = [
      { title: 'Total Clients', value: String(summary.totalClients), detail: `+${summary.createdThisMonth} this month`, icon: 'groups', tone: 'blue' },
      { title: 'Active Loans', value: String(summary.activeLoans), detail: `${summary.dueSoonLoans} due soon`, icon: 'receipt_long', tone: 'purple' },
      { title: 'Total Amount Given', value: this.formatCurrency(summary.totalPrincipal), detail: 'Across all loans', icon: 'payments', tone: 'green' },
      { title: 'Total Amount Received', value: this.formatCurrency(summary.totalCollected), detail: 'Collected to date', icon: 'currency_rupee', tone: 'amber' },
      { title: 'Outstanding Balance', value: this.formatCurrency(summary.totalOutstanding), detail: 'Current receivables', icon: 'account_balance_wallet', tone: 'mint' },
    ];
    this.overviewMetrics = [
      { title: 'Total Clients', value: String(summary.totalClients) },
      { title: 'Amount Given', value: this.formatCurrency(summary.totalPrincipal) },
      { title: 'Amount Paid', value: this.formatCurrency(summary.totalCollected) },
      { title: 'Outstanding', value: this.formatCurrency(summary.totalOutstanding) },
    ];
  }

  private updatePaymentChart(summary: DashboardSummary): void {
    const months = Array.from({ length: 8 }, (_, offset) => {
      const date = new Date(this.now.getFullYear(), this.now.getMonth() - 7 + offset, 1);
      const entry = summary.monthlyPayments.find(
        (payment) => payment.year === date.getFullYear() && payment.month === date.getMonth() + 1,
      );
      return {
        year: date.getFullYear(),
        month: date.getMonth(),
        label: date.toLocaleDateString('en', { month: 'short' }),
        amount: entry?.amount ?? 0,
      };
    });

    const maximum = Math.max(...months.map((month) => month.amount), 0);
    this.monthlyPayments = months.map(({ label, amount }) => ({ label, amount }));
    this.hasRecentPayments = months.some((month) => month.amount > 0);
    this.chartLabels = months.map((month) => month.label);
    this.chartValues = months.map((month) => maximum > 0 && month.amount > 0
      ? Math.max(4, (month.amount / maximum) * 100)
      : 0);
  }

  chartAmount(month: MonthlyPayment): string {
    return this.formatCurrency(month.amount);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value);
  }
}
