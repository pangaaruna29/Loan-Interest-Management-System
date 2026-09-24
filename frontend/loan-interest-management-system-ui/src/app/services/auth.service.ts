import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<string>(this.getStoredUserName());
  currentUser$ = this.currentUserSubject.asObservable();

  setCurrentUser(user: any): void {
    const userName = user?.username || user?.email || 'User';

    if (typeof window !== 'undefined') {
      window.localStorage.setItem('loanManagerCurrentUser', JSON.stringify(user));
      window.localStorage.setItem('loanManagerUserName', userName);
    }

    this.currentUserSubject.next(userName);
  }

  clearCurrentUser(): void {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('loanManagerCurrentUser');
      window.localStorage.removeItem('loanManagerUserName');
    }

    this.currentUserSubject.next('');
  }

  getCurrentUserName(): string {
    return this.getStoredUserName();
  }

  private getStoredUserName(): string {
    if (typeof window === 'undefined' || !window.localStorage) {
      return '';
    }

    const currentUser = window.localStorage.getItem('loanManagerCurrentUser');
    if (currentUser) {
      try {
        const parsedUser = JSON.parse(currentUser);
        const storedName = parsedUser?.username || parsedUser?.email || '';
        if (storedName) {
          return storedName;
        }
      } catch {
        // ignore malformed storage value
      }
    }

    const fallbackValue = window.localStorage.getItem('loanManagerUserName') || '';
    return fallbackValue;
  }
}
