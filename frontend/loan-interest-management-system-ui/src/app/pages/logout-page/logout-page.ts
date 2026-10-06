import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MaterialModule } from '../../material/material-module';
import { AuthService } from '../../services/auth.service';

@Component({
  imports: [MaterialModule],
  selector: 'app-logout-page',
  styleUrl: './logout-page.scss',
  templateUrl: './logout-page.html',
})
export class LogoutPage {
  private router = inject(Router);
  private authService = inject(AuthService);

  confirmLogout(): void {
    this.authService.clearCurrentUser();
    this.router.navigate(['/']);
  }

  cancelLogout(): void {
    const returnUrl = this.router.lastSuccessfulNavigation()?.extras.state?.['returnUrl'] ?? '/';
    this.router.navigateByUrl(returnUrl);
  }
}
