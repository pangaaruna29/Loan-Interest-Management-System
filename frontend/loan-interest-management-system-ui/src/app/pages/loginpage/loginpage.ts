import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../material/material-module';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  imports: [CommonModule, FormsModule,ReactiveFormsModule, MaterialModule, RouterModule],
  selector: 'app-loginpage',
  styleUrl: './loginpage.scss',
  templateUrl: './loginpage.html',
})
export class Loginpage {
  loginForm: FormGroup;
  loginError:string='';
  user:any;
  openPopup:boolean=false;
  resetMessage = '';
  requestMail:string='';

  constructor(
     private fb: FormBuilder,
     private router: Router,
     private authService: AuthService,
    private cdr:ChangeDetectorRef) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false, Validators.requiredTrue],
    });
  }

  emailControl() {
    return this.loginForm.get('email');
  }

  passwordControl() {
    return this.loginForm.get('password');
  }

  getEmailErrorMessage(): string {
    if (this.emailControl()?.hasError('required')) {
      return 'Email is required';
    }

    if (this.emailControl()?.hasError('email')) {
      return 'Please enter a valid email address';
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

  saveClient(): void {
    this.loginError = '';

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const email = (this.loginForm.value.email || '').trim().toLowerCase();
    const password = this.loginForm.value.password || '';
    const payload = {
      email: email,
      password: password
    }
    this.authService.loginUsers(payload).subscribe({
      next: (response) => {
        this.authService.setSession(response);
        this.router.navigate(['/clientDetails']);
      },
      error: (error) => {
        this.loginError = error?.error?.message || 'Unable to sign in. Please try again.';
        this.cdr.markForCheck();
      }
    })
  }
  openResetPopup(){
    this.resetMessage = '';
    this.openPopup = true;
  }

  closeResetPopup(): void {
    this.openPopup = false;
  }

  sendResetEmail(): void {
    this.resetMessage = '';
    console.log(this.requestMail,'maill')
    this.authService.resetPassword({ email: this.requestMail }).subscribe({
      next: (response) => {
        this.resetMessage = response.message;
      },
      error: (error) => {
        this.resetMessage = error?.error?.message || 'Unable to request a password reset';
        this.cdr.markForCheck();
      }
    });
  }
}
