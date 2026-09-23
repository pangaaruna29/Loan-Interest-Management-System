import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MaterialModule } from '../material/material-module';

interface StatCard {
  title: string;
  value: string;
  detail: string;
  icon: string;
  tone: string;
}

interface ClientRecord {
  name: string;
  phone: string;
  amount: string;
  rate: string;
  balance: string;
  status: 'Pending' | 'Partially Paid' | 'Paid' | 'Overdue';
  statusClass: string;
}

interface QuickAction {
  label: string;
  icon: string;
  tone: string;
}

@Component({
  imports: [CommonModule, MaterialModule],
  selector: 'app-homepage',
  styleUrl: './homepage.scss',
  templateUrl: './homepage.html',
})
export class Homepage {
  readonly navItems = ['Home', 'Client Details', 'New Client', 'Login'];

  readonly stats: StatCard[] = [
    { title: 'Total Clients', value: '128', detail: '+12 this month', icon: 'groups', tone: 'blue' },
    { title: 'Active Loans', value: '86', detail: '24 due soon', icon: 'receipt_long', tone: 'purple' },
    { title: 'Total Amount Given', value: '₹12,50,000', detail: 'Across all loans', icon: 'payments', tone: 'green' },
    { title: 'Total Amount Received', value: '₹8,75,000', detail: 'Collected to date', icon: 'currency_rupee', tone: 'amber' },
    { title: 'Outstanding Balance', value: '₹3,75,000', detail: 'Current receivables', icon: 'account_balance_wallet', tone: 'mint' },
  ];

  readonly clients: ClientRecord[] = [
    { name: 'Aarav Sharma', phone: '+91 98765 43210', amount: '₹2,50,000', rate: '12%', balance: '₹1,75,000', status: 'Partially Paid', statusClass: 'status-partial' },
    { name: 'Meera Nair', phone: '+91 91234 56789', amount: '₹1,80,000', rate: '10%', balance: '₹0', status: 'Paid', statusClass: 'status-paid' },
    { name: 'Rohan Verma', phone: '+91 99876 54321', amount: '₹3,20,000', rate: '14%', balance: '₹2,40,000', status: 'Pending', statusClass: 'status-pending' },
    { name: 'Sana Khan', phone: '+91 93456 78901', amount: '₹2,10,000', rate: '13%', balance: '₹1,35,000', status: 'Overdue', statusClass: 'status-overdue' },
  ];

  readonly actions: QuickAction[] = [
    { label: 'Add New Client', icon: 'person_add', tone: 'blue' },
    { label: 'View Client Details', icon: 'visibility', tone: 'purple' },
    { label: 'Record Payment', icon: 'payments', tone: 'green' },
    { label: 'Payment History', icon: 'history', tone: 'amber' },
  ];

  readonly chartValues = [55, 68, 62, 83, 76, 96, 88, 72];
  readonly chartLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
}

