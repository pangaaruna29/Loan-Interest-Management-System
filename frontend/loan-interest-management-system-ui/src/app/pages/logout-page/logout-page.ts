import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MaterialModule } from '../../material/material-module';
import { AuthService } from '../../services/auth.service';

@Component({
  imports: [CommonModule, MaterialModule],
  selector: 'app-logout-page',
  styleUrl: './logout-page.scss',
  templateUrl: './logout-page.html',
})
export class LogoutPage {
  private router = inject(Router);
  private authService = inject(AuthService);
  logoutError = '';
  isLoggingOut = false;

  confirmLogout(): void {
    if (this.isLoggingOut) return;
    this.logoutError = '';
    this.isLoggingOut = true;
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/']),
      error: (error) => {
        this.logoutError = error?.error?.message || 'Unable to log out. Please try again.';
        this.isLoggingOut = false;
      }
    });
  }

  cancelLogout(): void {
    const returnUrl = this.router.lastSuccessfulNavigation()?.extras.state?.['returnUrl'] ?? '/';
    this.router.navigateByUrl(returnUrl);
  }
}
