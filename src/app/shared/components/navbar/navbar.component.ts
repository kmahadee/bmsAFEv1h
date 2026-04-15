import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { User } from 'src/app/core/models/user';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit {
  currentUser: User | null = null;
  isCollapsed = true;

  constructor(
    public authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
    });
  }

  logout(): void {
    this.authService.logout();
  }

  toggleNavbar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }
  isManager(): boolean {
    return this.authService.isManager();
  }
  isLoan(): boolean {
    return this.authService.isLoan();
  }
  isCard(): boolean {
    return this.authService.isCard();
  }

  isCustomer(): boolean {
    return this.authService.isCustomer();
  }
}

