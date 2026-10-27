import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Header } from './pages/header/header';
import { AuthService } from './services/auth.service';

@Component({
  imports: [RouterOutlet,Header],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App implements OnInit {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);
  protected readonly title = signal('loan-interest-management-system-ui');

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.authService.restoreSession().subscribe({
      error: (error) => console.error('Unable to restore authentication session:', error)
    });
  }
}
