import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MaterialModule } from '../../material/material-module';
import { AuthService } from '../../services/auth.service';

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
  signupError: string  = '';
  isSubmitting = false;

  constructor(
     private fb: FormBuilder,
     private router: Router,
     private authService: AuthService,
     private cdr: ChangeDetectorRef) {
    this.signupForm = this.fb.group({
      username: ['', [Validators.required]],
      phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required, this.matchPasswordValidator()]],
    });
  }

  usernameControl() {
    return this.signupForm.get('username');
  }

  phoneNumberControl() {
    return this.signupForm.get('phoneNumber');
  }

  emailControl() {
    return this.signupForm.get('email');
  }

  passwordControl() {
    return this.signupForm.get('password');
  }

  confirmPasswordControl() {
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
    if (this.usernameControl()?.hasError('required')) {
      return 'Username is required';
    }
    return '';
  }

  getPhoneErrorMessage(): string {
    if (this.phoneNumberControl()?.hasError('required')) {
      return 'Phone number is required';
    }
    if (this.phoneNumberControl()?.hasError('pattern')) {
      return 'Phone number must be 10 digits';
    }
    return '';
  }

  getEmailErrorMessage(): string {
    if (this.emailControl()?.hasError('required')) {
      return 'Email is required';
    }
    if (this.emailControl()?.hasError('email')) {
      return 'Please enter a valid email';
    }
    return '';
  }

  getPasswordErrorMessage(): string {
    if (this.passwordControl()?.hasError('required')) {
      return 'Password is required';
    }
    if (this.passwordControl()?.hasError('minlength')) {
      return 'Password must be at least 6 characters';
    }
    return '';
  }

  getConfirmPasswordErrorMessage(): string {
    if (this.confirmPasswordControl()?.hasError('required')) {
      return 'Please confirm your password';
    }
    if (this.confirmPasswordControl()?.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    return '';
  }

  onSubmit(): void {
        this.signupError = '';

    if (this.signupForm.invalid || this.isSubmitting) {
      this.signupForm.markAllAsTouched();
      return;
    }

    const newUser = {
      userName: String(this.signupForm.value.username).trim(),
      phoneNumber: String(this.signupForm.value.phoneNumber).trim(),
      email: String(this.signupForm.value.email).trim().toLowerCase(),
      password: String(this.signupForm.value.password),
    };

    this.isSubmitting = true;
    this.authService.createUsers(newUser).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (error) => {
        console.log('Error creating user:', error);
        this.signupError = error?.error?.message || 'Unable to create account. Please try again.';
        this.isSubmitting = false;
         this.cdr.markForCheck();
      }
    });
  }
}
