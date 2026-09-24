import { Component } from '@angular/core';
import { MaterialModule } from '../../material/material-module';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
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

  isLoggedIn = false;
  userName = '';
  userInitial = 'U';

  constructor(private rt: Router, private authService: AuthService) {
    this.rt.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.refreshUserState();
      }
    });

    this.authService.currentUser$.subscribe(() => {
      this.refreshUserState();
    });

    this.refreshUserState();
  }

  refreshUserState(): void {
    const savedUser = this.authService.getCurrentUserName();

    if (savedUser && savedUser.trim()) {
      this.userName = savedUser.trim();
      this.isLoggedIn = true;
      this.userInitial = this.userName.charAt(0).toUpperCase();
      return;
    }

    this.userName = '';
    this.isLoggedIn = false;
    this.userInitial = 'U';
  }

  navigateToLogin(): void {
    this.rt.navigate(['/login']);
  }
}
