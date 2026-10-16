import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
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
  loginError:string='';
  user:any;

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
  ngOnInit(){
      // this.cdr.detectChanges();

this.authService.getUsers().subscribe(res=>{
  if(res){
    this.user= res
    console.log(res,'30 loginnn')
  }
})
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
    let matchedUser;
    this.authService.loginUsers(payload).subscribe({
      next: (res => {
        if (res.user) {
          matchedUser = res?.user?.users.userName
          this.authService.setCurrentUser(matchedUser);
          this.router.navigate(['']);
        }
      }),
      error: (err => {
        this.loginError = err?.error.message || 'login not successfull'
         this.cdr.markForCheck();
      })
    })
    // this.cdr.markForCheck()
  }
}
