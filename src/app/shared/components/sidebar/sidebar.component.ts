import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  isCollapsed = false;

  constructor(public authService: AuthService) { }

  ngOnInit(): void {
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  isCustomer(): boolean {
    return this.authService.isCustomer();
  }
}