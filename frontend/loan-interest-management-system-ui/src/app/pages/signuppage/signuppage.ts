import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../material/material-module';

@Component({
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, RouterModule],
  selector: 'app-signuppage',
  styleUrl: './signuppage.scss',
  templateUrl: './signuppage.html',
})
export class Signuppage {
  signupForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;

  constructor(private fb: FormBuilder, private router: Router) {
    this.signupForm = this.fb.group({
      username: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, this.matchPasswordValidator()]],
    });
  }

  get usernameControl() {
    return this.signupForm.get('username');
  }

  get phoneNumberControl() {
    return this.signupForm.get('phoneNumber');
  }

  get emailControl() {
    return this.signupForm.get('email');
  }

  get passwordControl() {
    return this.signupForm.get('password');
  }

  get confirmPasswordControl() {
    return this.signupForm.get('confirmPassword');
  }

  matchPasswordValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const parent = control.parent;
      if (!parent) {
        return null;
      }

      const password = parent.get('password')?.value;
      const confirmPassword = control.value;

      if (password !== confirmPassword) {
        return { passwordMismatch: true };
      }

      return null;
    };
  }

  getUsernameErrorMessage(): string {
    if (this.usernameControl?.hasError('required')) {
      return 'Username is required';
    }
    return '';
  }

  getPhoneErrorMessage(): string {
    if (this.phoneNumberControl?.hasError('required')) {
      return 'Phone number is required';
    }
    if (this.phoneNumberControl?.hasError('pattern')) {
      return 'Phone number must be 10 digits';
    }
    return '';
  }

  getEmailErrorMessage(): string {
    if (this.emailControl?.hasError('required')) {
      return 'Email is required';
    }
    if (this.emailControl?.hasError('email')) {
      return 'Please enter a valid email';
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

  getConfirmPasswordErrorMessage(): string {
    if (this.confirmPasswordControl?.hasError('required')) {
      return 'Please confirm your password';
    }
    if (this.confirmPasswordControl?.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    return '';
  }

  onSubmit(): void {
    if (this.signupForm.invalid) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const newUser = {
      username: this.signupForm.value.username,
      phoneNumber: this.signupForm.value.phoneNumber,
      email: this.signupForm.value.email,
      password: this.signupForm.value.password,
    };

    const users = this.getStoredUsers();
    const alreadyExists = users.some((user: any) => user.email?.toLowerCase() === newUser.email.toLowerCase());

    if (!alreadyExists) {
      users.push(newUser);
      localStorage.setItem('loanManagerUsers', JSON.stringify(users));
    }

    localStorage.removeItem('loanManagerCurrentUser');
    this.router.navigate(['/login']);
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
