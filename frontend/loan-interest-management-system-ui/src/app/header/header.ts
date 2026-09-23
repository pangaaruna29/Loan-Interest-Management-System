import { Component } from '@angular/core';
import { MaterialModule } from '../material/material-module';
import { CommonModule } from '@angular/common';

@Component({
  imports: [MaterialModule, CommonModule],
  selector: 'app-header',
  styleUrl: './header.scss',
  templateUrl: './header.html',
})
export class Header {
  readonly navItems = ['Home', 'Client Details', 'New Client', 'Login'];
}
