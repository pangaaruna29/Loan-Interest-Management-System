import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
export interface user {

}
@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private currentUserSubject = new BehaviorSubject<string>('');
  currentUser$ = this.currentUserSubject.asObservable();
  constructor(private http: HttpClient) { }
  setCurrentUser(user: any): void {
    this.currentUserSubject.next(user);
  }

  clearCurrentUser(): void {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('currentUser');
      window.localStorage.removeItem('isLoggedIn');
      // window.localStorage.removeItem('loanManagerCurrentUser');
      // window.localStorage.removeItem('loanManagerUserName');
    }

    this.currentUserSubject.next('');
  }

  createUsers(payload: any): Observable<any> {
    // https://urban-zebra-77vxpw6j6j4ghrxj4-3000.app.github.dev http://localhost:3000
    return this.http.post('/api/signup', payload).pipe(map((res) => {
      return res
    }),
      catchError((error) => {
        return error
      })
    )

  }
  getUsers(): Observable<any> {
    return this.http.get('/api/users').pipe(map((res) => {
      return res
    }),
      catchError((error) => {
        return error
      })
    )
  }
  loginUsers(payload: any): Observable<any> {
    return this.http.post('/api/login', payload).pipe(map((res) => {
      return res
    }),
      catchError((error) => {
        return throwError(() => error)
      })
    )
  }
}
