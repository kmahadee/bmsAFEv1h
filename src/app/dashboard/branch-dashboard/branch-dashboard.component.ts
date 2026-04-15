import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { User } from 'src/app/core/models/user';
import { AccountService } from 'src/app/core/services/account.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { BranchService } from 'src/app/core/services/branch.service';
import { CardService } from 'src/app/core/services/card.service';
import { CustomerService } from 'src/app/core/services/customer.service';
import { DpsService } from 'src/app/core/services/dps.service';
import { LoanService } from 'src/app/core/services/loan/loan.service';

@Component({
  selector: 'app-branch-manager-dashboard',
  templateUrl: './branch-dashboard.component.html',
  styleUrls: ['./branch-dashboard.component.scss']
})
export class BranchDashboardComponent implements OnInit {
  currentUser: User | null = null;
  loading = false;
  userRole: string = '';
  
  // Visibility flags based on role
  canViewCustomers = false;
  canViewAccounts = false;
  canViewBranches = false;
  canViewDPS = false;
  canViewCards = false;
  canViewLoans = false;
  
  // Statistics
  stats = {
    totalCustomers: 0,
    totalAccounts: 0,
    totalBranches: 0,
    totalDPS: 0,
    totalCards: 0,
    totalLoans: 0,
    activeCustomers: 0,
    pendingKYC: 0,
    activeAccounts: 0,
    activeDPS: 0,
    activeCards: 0,
    blockedCards: 0,
    activeLoans: 0,
    pendingLoans: 0
  };

  // Recent data
  recentCustomers: any[] = [];
  recentAccounts: any[] = [];
  recentCards: any[] = [];
  recentLoans: any[] = [];

  constructor(
    private authService: AuthService,
    private customerService: CustomerService,
    private accountService: AccountService,
    private branchService: BranchService,
    private dpsService: DpsService,
    private cardService: CardService,
    private loanService: LoanService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.currentUser = this.authService.currentUserValue;
    
    if (!this.currentUser) {
      this.router.navigate(['/auth/login']);
      return;
    }

    this.userRole = this.currentUser.role;

    // Check if user has access to admin dashboard
    if (!this.hasAdminDashboardAccess()) {
      this.router.navigate(['/dashboard/customer-dashboard']);
      return;
    }

    // Set visibility permissions based on role
    this.setPermissions();
    
    // Load dashboard data
    this.loadDashboardData();
  }

  hasAdminDashboardAccess(): boolean {
    return ['ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'CARD_OFFICER'].includes(this.userRole);
  }

  setPermissions(): void {
    switch (this.userRole) {
      case 'ADMIN':
        this.canViewCustomers = true;
        this.canViewAccounts = true;
        this.canViewBranches = true;
        this.canViewDPS = true;
        this.canViewCards = true;
        this.canViewLoans = true;
        break;

      case 'BRANCH_MANAGER':
        this.canViewCustomers = true;
        this.canViewAccounts = true;
        this.canViewBranches = false;
        this.canViewDPS = true;
        this.canViewCards = true;
        this.canViewLoans = true;
        break;

      case 'LOAN_OFFICER':
        this.canViewLoans = true;
        break;

      case 'CARD_OFFICER':
        this.canViewCards = true;
        break;

      default:
        break;
    }
  }

  /**
   * Load dashboard data based on permissions
   * FIX: Use forkJoin to properly handle loading state
   */
  loadDashboardData(): void {
    this.loading = true;

    const requests: any[] = [];

    // Build array of observables based on permissions
    if (this.canViewCustomers) {
      requests.push(
        this.customerService.getAllCustomers().pipe(
          finalize(() => {})
        )
      );
    }

    if (this.canViewAccounts) {
      requests.push(
        this.accountService.getAllAccounts().pipe(
          finalize(() => {})
        )
      );
    }

    if (this.canViewBranches) {
      requests.push(
        this.branchService.getAllBranches().pipe(
          finalize(() => {})
        )
      );
    }

    if (this.canViewDPS) {
      requests.push(
        this.dpsService.getAllDPS().pipe(
          finalize(() => {})
        )
      );
    }

    if (this.canViewCards) {
      requests.push(
        this.cardService.getAllCards().pipe(
          finalize(() => {})
        )
      );
    }

    if (this.canViewLoans) {
      requests.push(
        this.loanService.getAllLoans(1, 100).pipe(
          finalize(() => {})
        )
      );
    }

    // If no requests, just set loading to false
    if (requests.length === 0) {
      this.loading = false;
      return;
    }

    // Execute all requests in parallel and handle completion
    forkJoin(requests).subscribe({
      next: (responses) => {
        let index = 0;

        // Process responses in order
        if (this.canViewCustomers) {
          this.processCustomerData(responses[index++]);
        }
        if (this.canViewAccounts) {
          this.processAccountData(responses[index++]);
        }
        if (this.canViewBranches) {
          this.processBranchData(responses[index++]);
        }
        if (this.canViewDPS) {
          this.processDPSData(responses[index++]);
        }
        if (this.canViewCards) {
          this.processCardData(responses[index++]);
        }
        if (this.canViewLoans) {
          this.processLoanData(responses[index++]);
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data', error);
        this.loading = false;
      }
    });
  }

  private processCustomerData(response: any): void {
    if (response?.data) {
      this.stats.totalCustomers = response.data.length;
      this.stats.activeCustomers = response.data.filter((c: any) => c.status === 'ACTIVE').length;
      this.stats.pendingKYC = response.data.filter((c: any) => c.kycStatus === 'PENDING').length;
      this.recentCustomers = response.data.slice(0, 5);
    }
  }

  private processAccountData(response: any): void {
    if (response?.data) {
      this.stats.totalAccounts = response.data.length;
      this.stats.activeAccounts = response.data.filter((a: any) => a.status === 'ACTIVE').length;
      this.recentAccounts = response.data.slice(0, 5);
    }
  }

  private processBranchData(response: any): void {
    if (response?.data) {
      this.stats.totalBranches = response.data.length;
    }
  }

  private processDPSData(response: any): void {
    if (response?.data) {
      this.stats.totalDPS = response.data.length;
      this.stats.activeDPS = response.data.filter((d: any) => d.status === 'ACTIVE').length;
    }
  }

  private processCardData(response: any): void {
    if (response?.data) {
      this.stats.totalCards = response.data.length;
      this.stats.activeCards = response.data.filter((c: any) => c.status === 'ACTIVE').length;
      this.stats.blockedCards = response.data.filter((c: any) => c.status === 'BLOCKED').length;
      this.recentCards = response.data.slice(0, 5);
    }
  }

  private processLoanData(response: any): void {
    if (response?.data) {
      this.stats.totalLoans = response.data.totalCount || response.data.loans.length;
      this.stats.activeLoans = response.data.loans.filter((l: any) => l.loanStatus === 'ACTIVE').length;
      this.stats.pendingLoans = response.data.loans.filter((l: any) => l.approvalStatus === 'PENDING').length;
      this.recentLoans = response.data.loans.slice(0, 5);
    }
  }

  navigateTo(route: string): void {
    const routePermissions: { [key: string]: boolean } = {
      '/dashboard/customers': this.canViewCustomers,
      '/dashboard/accounts': this.canViewAccounts,
      '/dashboard/branches': this.canViewBranches,
      '/dashboard/dps': this.canViewDPS,
      '/dashboard/cards': this.canViewCards,
      '/dashboard/loans': this.canViewLoans
    };

    if (routePermissions[route] !== undefined && !routePermissions[route]) {
      console.warn('Insufficient permissions to navigate to', route);
      return;
    }

    this.router.navigate([route]);
  }

  getDashboardTitle(): string {
    switch (this.userRole) {
      case 'ADMIN':
        return 'Admin Dashboard';
      case 'BRANCH_MANAGER':
        return 'Branch Manager Dashboard';
      case 'LOAN_OFFICER':
        return 'Loan Officer Dashboard';
      case 'CARD_OFFICER':
        return 'Card Officer Dashboard';
      default:
        return 'Dashboard';
    }
  }

  isAdmin(): boolean {
    return this.userRole === 'ADMIN';
  }

  isBranchManager(): boolean {
    return this.userRole === 'BRANCH_MANAGER';
  }

  isLoanOfficer(): boolean {
    return this.userRole === 'LOAN_OFFICER';
  }

  isCardOfficer(): boolean {
    return this.userRole === 'CARD_OFFICER';
  }
}








// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { Router } from '@angular/router';
// import { Subject, forkJoin } from 'rxjs';
// import { takeUntil } from 'rxjs/operators';
// import { AccountListItem } from 'src/app/core/models/account';
// import { Branch } from 'src/app/core/models/branch';
// import { CardListItem } from 'src/app/core/models/card.model';
// import { CustomerListItem } from 'src/app/core/models/customer';
// import { DPS } from 'src/app/core/models/dps';
// import { LoanListItem } from 'src/app/core/models/loanModels/loan-response.model';
// import { User } from 'src/app/core/models/user';
// import { AccountService } from 'src/app/core/services/account.service';
// import { AuthService } from 'src/app/core/services/auth.service';
// import { BranchService } from 'src/app/core/services/branch.service';
// import { CardService } from 'src/app/core/services/card.service';
// import { CustomerService } from 'src/app/core/services/customer.service';
// import { DpsService } from 'src/app/core/services/dps.service';
// import { LoanService } from 'src/app/core/services/loan/loan.service';

// interface DashboardStats {
//   totalCustomers: number;
//   totalAccounts: number;
//   totalLoans: number;
//   totalCards: number;
//   totalDPS: number;
//   activeAccounts: number;
//   pendingLoans: number;
//   activeLoans: number;
//   totalDeposits: number;
// }

// @Component({
//   selector: 'app-branch-manager-dashboard',
//   templateUrl: './branch-dashboard.component.html',
//   styleUrls: ['./branch-dashboard.component.scss']
// })

// export class BranchDashboardComponent implements OnInit {
//   currentUser: User | null = null;
//   loading = false;
//   userRole: string = '';
  
//   // Visibility flags based on role
//   canViewCustomers = false;
//   canViewAccounts = false;
//   canViewBranches = false;
//   canViewDPS = false;
//   canViewCards = false;
//   canViewLoans = false;
  
//   // Statistics
//   stats = {
//     totalCustomers: 0,
//     totalAccounts: 0,
//     totalBranches: 0,
//     totalDPS: 0,
//     totalCards: 0,
//     totalLoans: 0,
//     activeCustomers: 0,
//     pendingKYC: 0,
//     activeAccounts: 0,
//     activeDPS: 0,
//     activeCards: 0,
//     blockedCards: 0,
//     activeLoans: 0,
//     pendingLoans: 0
//   };

//   // Recent data
//   recentCustomers: any[] = [];
//   recentAccounts: any[] = [];
//   recentCards: any[] = [];
//   recentLoans: any[] = [];

//   constructor(
//     private authService: AuthService,
//     private customerService: CustomerService,
//     private accountService: AccountService,
//     private branchService: BranchService,
//     private dpsService: DpsService,
//     private cardService: CardService,
//     private loanService: LoanService,
//     private router: Router
//   ) { }

//   ngOnInit(): void {
//     this.currentUser = this.authService.currentUserValue;
    
//     if (!this.currentUser) {
//       this.router.navigate(['/auth/login']);
//       return;
//     }

//     this.userRole = this.currentUser.role;

//     // Check if user has access to admin dashboard
//     if (!this.hasAdminDashboardAccess()) {
//       this.router.navigate(['/dashboard/customer-dashboard']);
//       return;
//     }

//     // Set visibility permissions based on role
//     this.setPermissions();
    
//     // Load dashboard data
//     this.loadDashboardData();
//   }

//   /**
//    * Check if user has access to admin dashboard
//    */
//   hasAdminDashboardAccess(): boolean {
//     return ['ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'CARD_OFFICER'].includes(this.userRole);
//   }

//   /**
//    * Set permissions based on user role
//    */
//   setPermissions(): void {
//     switch (this.userRole) {
//       case 'ADMIN':
//         // Admin can see everything
//         this.canViewCustomers = true;
//         this.canViewAccounts = true;
//         this.canViewBranches = true;
//         this.canViewDPS = true;
//         this.canViewCards = true;
//         this.canViewLoans = true;
//         break;

//       case 'BRANCH_MANAGER':
//         // Branch Manager can see customers, accounts, cards, DPS, and loans in their branch
//         this.canViewCustomers = true;
//         this.canViewAccounts = true;
//         this.canViewBranches = false; // Can only see their own branch
//         this.canViewDPS = true;
//         this.canViewCards = true;
//         this.canViewLoans = true;
//         break;

//       case 'LOAN_OFFICER':
//         // Loan Officer can only see loans in their branch
//         this.canViewCustomers = false;
//         this.canViewAccounts = false;
//         this.canViewBranches = false;
//         this.canViewDPS = false;
//         this.canViewCards = false;
//         this.canViewLoans = true;
//         break;

//       case 'CARD_OFFICER':
//         // Card Officer can only see cards in their branch
//         this.canViewCustomers = false;
//         this.canViewAccounts = false;
//         this.canViewBranches = false;
//         this.canViewDPS = false;
//         this.canViewCards = true;
//         this.canViewLoans = false;
//         break;

//       default:
//         // No permissions for other roles
//         this.canViewCustomers = false;
//         this.canViewAccounts = false;
//         this.canViewBranches = false;
//         this.canViewDPS = false;
//         this.canViewCards = false;
//         this.canViewLoans = false;
//         break;
//     }
//   }

//   /**
//    * Load dashboard data based on permissions
//    */
//   loadDashboardData(): void {
//     this.loading = true;

//     // Load customers (ADMIN and BRANCH_MANAGER only)
//     if (this.canViewCustomers) {
//       this.loadCustomers();
//     }

//     // Load accounts (ADMIN and BRANCH_MANAGER only)
//     if (this.canViewAccounts) {
//       this.loadAccounts();
//     }

//     // Load branches (ADMIN only)
//     if (this.canViewBranches) {
//       this.loadBranches();
//     }

//     // Load DPS (ADMIN and BRANCH_MANAGER only)
//     if (this.canViewDPS) {
//       this.loadDPS();
//     }

//     // Load cards (ADMIN, BRANCH_MANAGER, and CARD_OFFICER)
//     if (this.canViewCards) {
//       this.loadCards();
//     }

//     // Load loans (ADMIN, BRANCH_MANAGER, and LOAN_OFFICER)
//     if (this.canViewLoans) {
//       this.loadLoans();
//     }

//     // If nothing is loaded, set loading to false
//     if (!this.canViewCustomers && !this.canViewAccounts && !this.canViewBranches && 
//         !this.canViewDPS && !this.canViewCards && !this.canViewLoans) {
//       this.loading = false;
//     }
//   }

//   /**
//    * Load customers data
//    */
//   loadCustomers(): void {
//     this.customerService.getAllCustomers().subscribe({
//       next: (response) => {
//         this.stats.totalCustomers = response.data.length;
//         this.stats.activeCustomers = response.data.filter((c: any) => c.status === 'ACTIVE').length;
//         this.stats.pendingKYC = response.data.filter((c: any) => c.kycStatus === 'PENDING').length;
//         this.recentCustomers = response.data.slice(0, 5);
//       },
//       error: (error) => {
//         console.error('Error loading customers', error);
//         // If unauthorized, show appropriate message
//         if (error.status === 403 || error.status === 401) {
//           console.warn('Insufficient permissions to view customers');
//         }
//       }
//     });
//   }

//   /**
//    * Load accounts data
//    */
//   loadAccounts(): void {
//     this.accountService.getAllAccounts().subscribe({
//       next: (response) => {
//         this.stats.totalAccounts = response.data.length;
//         this.stats.activeAccounts = response.data.filter((a: any) => a.status === 'ACTIVE').length;
//         this.recentAccounts = response.data.slice(0, 5);
//       },
//       error: (error) => {
//         console.error('Error loading accounts', error);
//         if (error.status === 403 || error.status === 401) {
//           console.warn('Insufficient permissions to view accounts');
//         }
//       }
//     });
//   }

//   /**
//    * Load branches data (ADMIN only)
//    */
//   loadBranches(): void {
//     this.branchService.getAllBranches().subscribe({
//       next: (response) => {
//         this.stats.totalBranches = response.data.length;
//         this.loading = false;
//       },
//       error: (error) => {
//         console.error('Error loading branches', error);
//         if (error.status === 403 || error.status === 401) {
//           console.warn('Insufficient permissions to view branches');
//         }
//         this.loading = false;
//       }
//     });
//   }

//   /**
//    * Load DPS data
//    */
//   loadDPS(): void {
//     this.dpsService.getAllDPS().subscribe({
//       next: (response) => {
//         this.stats.totalDPS = response.data.length;
//         this.stats.activeDPS = response.data.filter((d: any) => d.status === 'ACTIVE').length;
//       },
//       error: (error) => {
//         console.error('Error loading DPS', error);
//         if (error.status === 403 || error.status === 401) {
//           console.warn('Insufficient permissions to view DPS');
//         }
//       }
//     });
//   }

//   /**
//    * Load cards data
//    */
//   loadCards(): void {
//     this.cardService.getAllCards().subscribe({
//       next: (response) => {
//         this.stats.totalCards = response.data.length;
//         this.stats.activeCards = response.data.filter((c: any) => c.status === 'ACTIVE').length;
//         this.stats.blockedCards = response.data.filter((c: any) => c.status === 'BLOCKED').length;
//         this.recentCards = response.data.slice(0, 5);
//       },
//       error: (error) => {
//         console.error('Error loading cards', error);
//         if (error.status === 403 || error.status === 401) {
//           console.warn('Insufficient permissions to view cards');
//         }
//       }
//     });
//   }

//   /**
//    * Load loans data
//    */
//   loadLoans(): void {
//     this.loanService.getAllLoans(1, 100).subscribe({
//       next: (response) => {
//         this.stats.totalLoans = response.data.totalCount || response.data.loans.length;
//         this.stats.activeLoans = response.data.loans.filter((l: any) => l.loanStatus === 'ACTIVE').length;
//         this.stats.pendingLoans = response.data.loans.filter((l: any) => l.approvalStatus === 'PENDING').length;
//         this.recentLoans = response.data.loans.slice(0, 5);
//       },
//       error: (error) => {
//         console.error('Error loading loans', error);
//         if (error.status === 403 || error.status === 401) {
//           console.warn('Insufficient permissions to view loans');
//         }
//       }
//     });
//   }

//   /**
//    * Navigate to route if user has permission
//    */
//   navigateTo(route: string): void {
//     // Check permissions before navigation
//     const routePermissions: { [key: string]: boolean } = {
//       '/dashboard/customers': this.canViewCustomers,
//       '/dashboard/accounts': this.canViewAccounts,
//       '/dashboard/branches': this.canViewBranches,
//       '/dashboard/dps': this.canViewDPS,
//       '/dashboard/cards': this.canViewCards,
//       '/dashboard/loans': this.canViewLoans
//     };

//     if (routePermissions[route] !== undefined && !routePermissions[route]) {
//       console.warn('Insufficient permissions to navigate to', route);
//       return;
//     }

//     this.router.navigate([route]);
//   }

//   /**
//    * Get dashboard title based on role
//    */
//   getDashboardTitle(): string {
//     switch (this.userRole) {
//       case 'ADMIN':
//         return 'Admin Dashboard';
//       case 'BRANCH_MANAGER':
//         return 'Branch Manager Dashboard';
//       case 'LOAN_OFFICER':
//         return 'Loan Officer Dashboard';
//       case 'CARD_OFFICER':
//         return 'Card Officer Dashboard';
//       default:
//         return 'Dashboard';
//     }
//   }

//   /**
//    * Check if user is admin
//    */
//   isAdmin(): boolean {
//     return this.userRole === 'ADMIN';
//   }

//   /**
//    * Check if user is branch manager
//    */
//   isBranchManager(): boolean {
//     return this.userRole === 'BRANCH_MANAGER';
//   }

//   /**
//    * Check if user is loan officer
//    */
//   isLoanOfficer(): boolean {
//     return this.userRole === 'LOAN_OFFICER';
//   }

//   /**
//    * Check if user is card officer
//    */
//   isCardOfficer(): boolean {
//     return this.userRole === 'CARD_OFFICER';
//   }
// }




// // export class BranchDashboardComponent implements OnInit, OnDestroy {
// //   private destroy$ = new Subject<void>();

// //   // Branch Info
// //   branchInfo: Branch | null = null;
// //   branchCode: string = '';
// //   branchId: number = 0;

// //   // Dashboard Statistics
// //   stats: DashboardStats = {
// //     totalCustomers: 0,
// //     totalAccounts: 0,
// //     totalLoans: 0,
// //     totalCards: 0,
// //     totalDPS: 0,
// //     activeAccounts: 0,
// //     pendingLoans: 0,
// //     activeLoans: 0,
// //     totalDeposits: 0
// //   };

// //   // Data Collections
// //   customers: CustomerListItem[] = [];
// //   accounts: AccountListItem[] = [];
// //   loans: LoanListItem[] = [];
// //   cards: CardListItem[] = [];
// //   dpsList: DPS[] = [];

// //   // Filtered Data for Branch
// //   branchCustomers: CustomerListItem[] = [];
// //   branchAccounts: AccountListItem[] = [];
// //   branchLoans: LoanListItem[] = [];
// //   branchCards: CardListItem[] = [];
// //   branchDPS: DPS[] = [];

// //   // Loading States
// //   isLoading = true;
// //   isLoadingBranch = true;
// //   isLoadingStats = true;

// //   // Error Handling
// //   errorMessage = '';

// //   // UI States
// //   selectedTab = 'overview';

// //   // Manager Info
// //   managerName: string = '';
// //   managerEmail: string = '';

// //   constructor(
// //     private accountService: AccountService,
// //     private customerService: CustomerService,
// //     private branchService: BranchService,
// //     private loanService: LoanService,
// //     private cardService: CardService,
// //     private dpsService: DpsService,
// //     private authService: AuthService
// //   ) {}

// //   ngOnInit(): void {
// //     this.loadManagerInfo();
// //     this.loadBranchInfo();
// //   }

// //   ngOnDestroy(): void {
// //     this.destroy$.next();
// //     this.destroy$.complete();
// //   }

// //   /**
// //    * Load manager information from auth service
// //    */
// //   loadManagerInfo(): void {
// //     this.managerName = this.authService.getFullName() || this.authService.getUsername() || 'Manager';
// //     this.managerEmail = this.authService.getEmail() || '';
// //   }

// //   /**
// //    * Load branch information
// //    * Note: This assumes the branch manager's branch info is stored in localStorage
// //    * or you need to fetch it from the backend
// //    */
// //   loadBranchInfo(): void {
// //     this.isLoadingBranch = true;
    
// //     // Get branch code from localStorage or API
// //     // For now, assuming it's stored when manager logs in
// //     this.branchCode = localStorage.getItem('managerBranchCode') || '';
    
// //     if (!this.branchCode) {
// //       this.errorMessage = 'Branch information not found. Please contact administrator.';
// //       this.isLoadingBranch = false;
// //       return;
// //     }

// //     this.branchService.getBranchByCode(this.branchCode)
// //       .pipe(takeUntil(this.destroy$))
// //       .subscribe({
// //         next: (response) => {
// //           if (response.success && response.data) {
// //             this.branchInfo = response.data;
// //             this.branchId = response.data.id;
// //             this.loadDashboardData();
// //           }
// //         },
// //         error: (error) => {
// //           console.error('Error loading branch info:', error);
// //           this.errorMessage = 'Failed to load branch information';
// //           this.isLoadingBranch = false;
// //         }
// //       });
// //   }

// //   /**
// //    * Load all dashboard data
// //    */
// //   loadDashboardData(): void {
// //     this.isLoading = true;
// //     this.isLoadingStats = true;

// //     forkJoin({
// //       accounts: this.accountService.getAllAccounts(),
// //       customers: this.customerService.getAllCustomers(),
// //       loans: this.loanService.getAllLoans(),
// //       cards: this.cardService.getAllCards(),
// //       dps: this.dpsService.getAllDPS()
// //     }).pipe(takeUntil(this.destroy$))
// //       .subscribe({
// //         next: (results) => {
// //           // Store all data
// //           this.accounts = results.accounts.success ? results.accounts.data : [];
// //           this.customers = results.customers.success ? results.customers.data : [];
// //           this.loans = results.loans.success ? results.loans.data.loans || [] : [];
// //           this.cards = results.cards.success ? results.cards.data : [];
// //           this.dpsList = results.dps.success ? results.dps.data : [];

// //           // Filter data by branch
// //           this.filterDataByBranch();

// //           // Calculate statistics
// //           this.calculateStatistics();

// //           this.isLoading = false;
// //           this.isLoadingStats = false;
// //           this.isLoadingBranch = false;
// //         },
// //         error: (error) => {
// //           console.error('Error loading dashboard data:', error);
// //           this.errorMessage = 'Failed to load dashboard data';
// //           this.isLoading = false;
// //           this.isLoadingStats = false;
// //           this.isLoadingBranch = false;
// //         }
// //       });
// //   }

// //   /**
// //    * Filter all data to show only items from manager's branch
// //    */
// //   filterDataByBranch(): void {
// //     // Filter accounts by branch
// //     this.branchAccounts = this.accounts.filter(account => 
// //       account.branchCode === this.branchCode
// //     );

// //     // Get customer IDs from branch accounts
// //     const branchCustomerIds = new Set(
// //       this.branchAccounts.map(account => account.customerId)
// //     );

// //     // Filter customers who have accounts in this branch
// //     this.branchCustomers = this.customers.filter(customer =>
// //       branchCustomerIds.has(customer.customerId)
// //     );

// //     // Filter loans by customers in this branch
// //     this.branchLoans = this.loans.filter(loan =>
// //       branchCustomerIds.has(loan.customerId)
// //     );

// //     // Filter cards by customers in this branch
// //     this.branchCards = this.cards.filter(card =>
// //       branchCustomerIds.has(card.customerId)
// //     );

// //     // Filter DPS by branch
// //     this.branchDPS = this.dpsList.filter(dps =>
// //       dps.branchName === this.branchInfo?.branchName
// //     );
// //   }

// //   /**
// //    * Calculate dashboard statistics
// //    */
// //   calculateStatistics(): void {
// //     this.stats.totalCustomers = this.branchCustomers.length;
// //     this.stats.totalAccounts = this.branchAccounts.length;
// //     this.stats.totalLoans = this.branchLoans.length;
// //     this.stats.totalCards = this.branchCards.length;
// //     this.stats.totalDPS = this.branchDPS.length;

// //     // Active accounts
// //     this.stats.activeAccounts = this.branchAccounts.filter(
// //       account => account.status.toLowerCase() === 'active'
// //     ).length;

// //     // Pending loans
// //     this.stats.pendingLoans = this.branchLoans.filter(
// //       loan => loan.approvalStatus.toUpperCase() === 'PENDING'
// //     ).length;

// //     // Active loans
// //     this.stats.activeLoans = this.branchLoans.filter(
// //       loan => loan.loanStatus.toUpperCase() === 'ACTIVE'
// //     ).length;

// //     // Total deposits
// //     this.stats.totalDeposits = this.branchAccounts.reduce(
// //       (sum, account) => sum + account.balance, 0
// //     );
// //   }

// //   /**
// //    * Refresh dashboard data
// //    */
// //   refreshDashboard(): void {
// //     this.loadDashboardData();
// //   }

// //   /**
// //    * Change selected tab
// //    */
// //   selectTab(tab: string): void {
// //     this.selectedTab = tab;
// //   }

// //   /**
// //    * Get status badge class
// //    */
// //   getStatusBadgeClass(status: string): string {
// //     const statusLower = status.toLowerCase();
// //     switch (statusLower) {
// //       case 'active':
// //         return 'badge bg-success';
// //       case 'inactive':
// //         return 'badge bg-warning';
// //       case 'pending':
// //         return 'badge bg-info';
// //       case 'closed':
// //       case 'suspended':
// //         return 'badge bg-secondary';
// //       default:
// //         return 'badge bg-secondary';
// //     }
// //   }

// //   /**
// //    * Format currency
// //    */
// //   formatCurrency(amount: number): string {
// //     return new Intl.NumberFormat('en-BD', {
// //       style: 'currency',
// //       currency: 'BDT',
// //       minimumFractionDigits: 2
// //     }).format(amount);
// //   }

// //   /**
// //    * Format date
// //    */
// //   formatDate(dateString: string): string {
// //     return new Date(dateString).toLocaleDateString('en-US', {
// //       year: 'numeric',
// //       month: 'short',
// //       day: 'numeric'
// //     });
// //   }

// //   /**
// //    * Get recent accounts (last 5)
// //    */
// //   getRecentAccounts(): AccountListItem[] {
// //     return this.branchAccounts
// //       .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
// //       .slice(0, 5);
// //   }

// //   /**
// //    * Get recent customers (last 5)
// //    */
// //   getRecentCustomers(): CustomerListItem[] {
// //     return this.branchCustomers
// //       .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())
// //       .slice(0, 5);
// //   }

// //   /**
// //    * Get pending loans
// //    */
// //   getPendingLoans(): LoanListItem[] {
// //     return this.branchLoans
// //       .filter(loan => loan.approvalStatus.toUpperCase() === 'PENDING')
// //       .slice(0, 5);
// //   }
// // }



// // import { Component } from '@angular/core';

// // @Component({
// //   selector: 'app-branch-dashboard',
// //   templateUrl: './branch-dashboard.component.html',
// //   styleUrls: ['./branch-dashboard.component.scss']
// // })
// // export class BranchDashboardComponent {

// // }
