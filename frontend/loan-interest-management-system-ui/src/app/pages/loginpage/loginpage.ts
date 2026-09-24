import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../material/material-module';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, RouterModule],
  selector: 'app-loginpage',
  styleUrl: './loginpage.scss',
  templateUrl: './loginpage.html',
})
export class Loginpage {
  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router, private authService: AuthService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  get emailControl() {
    return this.loginForm.get('email');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }

  getEmailErrorMessage(): string {
    if (this.emailControl?.hasError('required')) {
      return 'Email is required';
    }

    if (this.emailControl?.hasError('email')) {
      return 'Please enter a valid email address';
    }

    return '';
  }

  getPasswordErrorMessage(): string {
    if (this.passwordControl?.hasError('required')) {
      return 'Password is required';
    }

    if (this.passwordControl?.hasError('minlength')) {
      return 'Password must be at least 6 characters';
    }

    return '';
  }

  saveClient(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const email = (this.loginForm.value.email || '').trim().toLowerCase();
    const password = this.loginForm.value.password || '';
    const savedUsers = this.getStoredUsers();
    const matchedUser = savedUsers.find((user: any) => {
      return user.email?.toLowerCase() === email && user.password === password;
    });

    if (!matchedUser) {
      this.loginForm.setErrors({ invalidLogin: true });
      return;
    }

    this.authService.setCurrentUser(matchedUser);
    this.router.navigate(['']);
  }

  getStoredUsers(): any[] {
    if (typeof window === 'undefined' || !window.localStorage) {
      return [];
    }

    const savedUsers = window.localStorage.getItem('loanManagerUsers');
    if (!savedUsers) {
      return [];
    }

    try {
      const parsedUsers = JSON.parse(savedUsers);
      return Array.isArray(parsedUsers) ? parsedUsers : [];
    } catch {
      return [];
    }
  }
}
