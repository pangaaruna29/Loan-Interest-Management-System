import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ViewClientData } from '../pages/view-client/view-client';

interface ClientResponse {
  client: ViewClientData;
}

interface ClientsResponse {
  clients: ViewClientData[];
}

export interface DashboardSummary {
  totalClients: number;
  activeLoans: number;
  dueSoonLoans: number;
  totalPrincipal: number;
  totalCollected: number;
  totalOutstanding: number;
  createdThisMonth: number;
  monthlyPayments: { year: number; month: number; amount: number }[];
  monthlyLoanCounts: { year: number; month: number; activeLoans: number; dueSoonLoans: number }[];
}

export type PublicDashboardSummary = Pick<
  DashboardSummary,
  'totalClients' | 'activeLoans' | 'dueSoonLoans' | 'monthlyLoanCounts'
>;

interface DashboardSummaryResponse {
  summary: DashboardSummary;
}

interface PublicDashboardSummaryResponse {
  summary: PublicDashboardSummary;
}

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly endpoint = '/api/clients';

  constructor(private http: HttpClient) { }

  getClients(): Observable<ViewClientData[]> {
    return this.http.get<ClientsResponse>(this.endpoint).pipe(map((response) => response.clients));
  }

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummaryResponse>(`${this.endpoint}/summary`)
      .pipe(map((response) => response.summary));
  }

  getPublicDashboardSummary(): Observable<PublicDashboardSummary> {
    return this.http.get<PublicDashboardSummaryResponse>(`${this.endpoint}/public-summary`)
      .pipe(map((response) => response.summary));
  }

  getClient(id: string): Observable<ViewClientData> {
    return this.http.get<ClientResponse>(`${this.endpoint}/${encodeURIComponent(id)}`).pipe(map((response) => response.client));
  }

  createClient(client: Partial<ViewClientData>): Observable<ViewClientData> {
    return this.http.post<ClientResponse>(this.endpoint, client).pipe(map((response) => response.client));
  }

  updateClient(id: string, client: Partial<ViewClientData>): Observable<ViewClientData> {
    return this.http.put<ClientResponse>(`${this.endpoint}/${encodeURIComponent(id)}`, client).pipe(map((response) => response.client));
  }

  deleteClient(id: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${encodeURIComponent(id)}`);
  }
}