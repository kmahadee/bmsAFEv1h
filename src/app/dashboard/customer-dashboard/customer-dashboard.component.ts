import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'src/app/core/models/user';
import { AccountService } from 'src/app/core/services/account.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { DpsService } from 'src/app/core/services/dps.service';
import { CardService } from 'src/app/core/services/card.service';

@Component({
  selector: 'app-customer-dashboard',
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['./customer-dashboard.component.scss']
})
export class CustomerDashboardComponent implements OnInit {
  currentUser: User | null = null;
  customerId: string | null = null;
  loading = false;

  // Account summary
  accounts: any[] = [];
  totalBalance = 0;
  activeAccounts = 0;

  // DPS summary
  dpsAccounts: any[] = [];
  totalDPSDeposited = 0;
  activeDPS = 0;

  // Cards summary
  cards: any[] = [];
  totalCards = 0;
  activeCards = 0;

  // Recent transactions (mock for now)
  recentTransactions: any[] = [];

  constructor(
    private authService: AuthService,
    private accountService: AccountService,
    private dpsService: DpsService,
    private cardService: CardService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    
    if (!this.authService.isCustomer()) {
      this.router.navigate(['/dashboard/admin-dashboard']);
      return;
    }

    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;

    const custId = this.authService.getCustomerId();

    if (custId) {
      this.customerId = custId;
      this.loadAccounts(custId);
      this.loadDPS(custId);
      this.loadCards(custId);
    } else {
      console.error('No customer ID found in session.');
      this.loading = false;
    }
  }

  loadAccounts(customerId: string): void {
    this.accountService.getAccountsByCustomerId(customerId).subscribe({
      next: (response) => {
        this.accounts = response.data;
        this.totalBalance = this.accounts.reduce((sum, acc) => sum + acc.balance, 0);
        this.activeAccounts = this.accounts.filter(acc => acc.status === 'active').length;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading accounts', error);
        this.loading = false;
      }
    });
  }

  loadDPS(customerId: string): void {
    this.dpsService.getDPSByCustomerId(customerId).subscribe({
      next: (response) => {
        this.dpsAccounts = response.data;
        this.totalDPSDeposited = this.dpsAccounts.reduce((sum, dps) => sum + dps.totalDeposited, 0);
        this.activeDPS = this.dpsAccounts.filter(dps => dps.status === 'active').length;
      },
      error: (error) => console.error('Error loading DPS', error)
    });
  }

  loadCards(customerId: string): void {
    this.cardService.getCardsByCustomerId(customerId).subscribe({
      next: (response) => {
        this.cards = response.data;
        this.totalCards = this.cards.length;
        this.activeCards = this.cards.filter(c => c.status === 'active').length;
      },
      error: (error) => console.error('Error loading cards', error)
    });
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  viewAccountDetails(accountId: number): void {
    this.router.navigate(['/account/detail', accountId]);
  }

  viewDPSDetails(dpsId: number): void {
    this.router.navigate(['/dps/detail', dpsId]);
  }

  viewCardDetails(cardId: number): void {
    this.router.navigate(['/customer/cards/detail', cardId]);
  }
}













// import { Component, OnInit } from '@angular/core';
// import { Router } from '@angular/router';
// import { User } from 'src/app/core/models/user';
// import { AccountService } from 'src/app/core/services/account.service';
// import { AuthService } from 'src/app/core/services/auth.service';
// import { DpsService } from 'src/app/core/services/dps.service';

// @Component({
//   selector: 'app-customer-dashboard',
//   templateUrl: './customer-dashboard.component.html',
//   styleUrls: ['./customer-dashboard.component.scss']
// })
// export class CustomerDashboardComponent implements OnInit {
//   currentUser: User | null = null;
//   customerId: string | null = null;
//   loading = false;

//   // Account summary
//   accounts: any[] = [];
//   totalBalance = 0;
//   activeAccounts = 0;

//   // DPS summary
//   dpsAccounts: any[] = [];
//   totalDPSDeposited = 0;
//   activeDPS = 0;

//   // Recent transactions (mock for now)
//   recentTransactions: any[] = [];

//   constructor(
//     private authService: AuthService,
//     private accountService: AccountService,
//     private dpsService: DpsService,
//     private router: Router
//   ) { }

//   ngOnInit(): void {
//     this.currentUser = this.authService.currentUserValue;
    
//     if (!this.authService.isCustomer()) {
//       this.router.navigate(['/dashboard/admin-dashboard']);
//       return;
//     }

//     this.loadDashboardData();
//   }

//   loadDashboardData(): void {
//     this.loading = true;

//     // Get customer ID from auth service (avoids forbidden endpoint)
//     const custId = this.authService.getCustomerId();

//     if (custId) {
//       this.customerId = custId;
//       this.loadAccounts(custId);
//       this.loadDPS(custId);
//     } else {
//       console.error('No customer ID found in session. Ensure you are logged in as a Customer.');
//       this.loading = false;
//     }
//   }

//   loadAccounts(customerId: string): void {
//     this.accountService.getAccountsByCustomerId(customerId).subscribe({
//       next: (response) => {
//         this.accounts = response.data;
//         this.totalBalance = this.accounts.reduce((sum, acc) => sum + acc.balance, 0);
//         this.activeAccounts = this.accounts.filter(acc => acc.status === 'active').length;
//         this.loading = false;
//       },
//       error: (error) => {
//         console.error('Error loading accounts', error);
//         this.loading = false;
//       }
//     });
//   }

//   loadDPS(customerId: string): void {
//     this.dpsService.getDPSByCustomerId(customerId).subscribe({
//       next: (response) => {
//         this.dpsAccounts = response.data;
//         this.totalDPSDeposited = this.dpsAccounts.reduce((sum, dps) => sum + dps.totalDeposited, 0);
//         this.activeDPS = this.dpsAccounts.filter(dps => dps.status === 'active').length;
//       },
//       error: (error) => console.error('Error loading DPS', error)
//     });
//   }

//   navigateTo(route: string): void {
//     this.router.navigate([route]);
//   }

//   viewAccountDetails(accountId: number): void {
//     this.router.navigate(['/account/detail', accountId]);
//   }

//   viewDPSDetails(dpsId: number): void {
//     this.router.navigate(['/dps/detail', dpsId]);
//   }
// }