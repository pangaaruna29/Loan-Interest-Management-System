import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
export interface user {

}
@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private currentUserSubject = new BehaviorSubject<string>(this.getStoredUserName());
  currentUser$ = this.currentUserSubject.asObservable();
constructor(private http:HttpClient){}
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
      window.localStorage.removeItem('currentUser');
      window.localStorage.removeItem('isLoggedIn');
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
  createUsers(payload: any): Observable<any> {
    // https://urban-zebra-77vxpw6j6j4ghrxj4-3000.app.github.dev http://localhost:3000
    return this.http.post('https://urban-zebra-77vxpw6j6j4ghrxj4-3000.app.github.dev/api/signup', payload).pipe(map((res) => {
      return res
    }),
      catchError((error) => {
        return error
      })
    )

  }
}
