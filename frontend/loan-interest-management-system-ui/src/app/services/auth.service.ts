import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';

export interface AuthUser {
  id: string;
  userName: string;
  phoneNumber: string;
  email: string;
}

export interface LoginResponse {
  user: AuthUser;
  message: string;
}

export interface SignupResponse {
  user: AuthUser;
  message: string;
}

export interface SignupRequest {
  userName: string;
  phoneNumber: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  private sessionLoaded = false;
  private sessionRestoreRequest: Observable<AuthUser | null> | null = null;

  constructor(private http: HttpClient) { }

  setSession(response: LoginResponse): void {
    this.sessionLoaded = true;
    this.currentUserSubject.next(response.user);
  }

  restoreSession(): Observable<AuthUser | null> {
    if (this.sessionLoaded) return of(this.currentUserSubject.value);
    if (this.sessionRestoreRequest) return this.sessionRestoreRequest;

    this.sessionRestoreRequest = this.http.get<{ user: AuthUser | null }>('/api/session', {
      withCredentials: true
    }).pipe(
      map((response) => response.user),
      tap((user) => {
        this.sessionLoaded = true;
        this.currentUserSubject.next(user);
      }),
      catchError((error: HttpErrorResponse) => {
        if (error.status !== 401) return throwError(() => error);
        this.sessionLoaded = true;
        this.currentUserSubject.next(null);
        return of(null);
      }),
      finalize(() => this.sessionRestoreRequest = null),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.sessionRestoreRequest;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  clearCurrentUser(): void {
    this.sessionLoaded = true;
    this.currentUserSubject.next(null);
  }

  logout(): Observable<void> {
    return this.http.post('/api/logout', {}, { withCredentials: true }).pipe(
      map(() => {
        this.clearCurrentUser();
      })
    );
  }

  createUsers(payload: SignupRequest): Observable<SignupResponse> {
    return this.http.post<SignupResponse>('/api/signup', payload);
  }

  loginUsers(payload: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>('/api/login', payload, { withCredentials: true });
  }
}
