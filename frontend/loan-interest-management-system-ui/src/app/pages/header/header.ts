import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MaterialModule } from '../../material/material-module';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  imports: [MaterialModule, CommonModule, RouterModule],
  selector: 'app-header',
  styleUrl: './header.scss',
  templateUrl: './header.html',
})
export class Header {
  navItems = [
    { key: '', label: 'Home' },
    { key: 'clientDetails', label: 'Client Details' },
    { key: 'newClient', label: 'New Client' },
  ];
  private rt = inject(Router);
  private authService = inject(AuthService);
  private currentUser = toSignal(this.authService.currentUser$, {
    initialValue: this.authService.getCurrentUserName(),
  });
  userName = computed(() => this.currentUser()?.trim() ?? '');
  isLoggedIn = computed(() => !!this.userName());
  userInitial = computed(() => this.userName().charAt(0).toUpperCase() || 'U');

  navigateToLogin(): void {
    this.rt.navigate(['/login']);
  }

  navigateToLogout(): void {
    this.rt.navigate(['/logout'], {
      state: { returnUrl: this.rt.url },
    });
  }
}
