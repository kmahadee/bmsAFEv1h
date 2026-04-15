import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { User } from 'src/app/core/models/user';
import { BankStatistics, BranchStatistics } from 'src/app/core/models/branch';
import { AccountService } from 'src/app/core/services/account.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { BranchService } from 'src/app/core/services/branch.service';
import { CustomerService } from 'src/app/core/services/customer.service';
import { DpsService } from 'src/app/core/services/dps.service';
import { CardService } from 'src/app/core/services/card.service';
import { LoanService } from 'src/app/core/services/loan/loan.service';
import { finalize, forkJoin } from 'rxjs';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('branchBalanceChart') branchBalanceChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('accountsPerBranchChart') accountsPerBranchChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('branchPerformanceChart') branchPerformanceChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('avgBalanceChart') avgBalanceChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('entityDistributionChart') entityDistributionChartRef!: ElementRef<HTMLCanvasElement>;

  // Chart instances
  // private branchBalanceChart?: Chart;
  // private accountsPerBranchChart?: Chart;
  // private branchPerformanceChart?: Chart;
  // private avgBalanceChart?: Chart;
  // private entityDistributionChart?: Chart;

  private branchBalanceChart?: Chart<any>;
private accountsPerBranchChart?: Chart<any>;
private branchPerformanceChart?: Chart<any>;
private avgBalanceChart?: Chart<any>;
private entityDistributionChart?: Chart<any>;


  currentUser: User | null = null;
  loading = false;
  userRole: string = '';
  chartsReady = false;
  
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

  // Bank Statistics from API
  bankStatistics: BankStatistics | null = null;
  topBranches: BranchStatistics[] = [];

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

    if (!this.hasAdminDashboardAccess()) {
      this.router.navigate(['/dashboard/customer-dashboard']);
      return;
    }

    this.setPermissions();
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data is loaded
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

  loadDashboardData(): void {
    this.loading = true;

    const requests: any[] = [];

    if (this.canViewCustomers) {
      requests.push(this.customerService.getAllCustomers());
    }

    if (this.canViewAccounts) {
      requests.push(this.accountService.getAllAccounts());
    }

    if (this.canViewBranches) {
      requests.push(this.branchService.getAllBranches());
      requests.push(this.branchService.getBankStatistics());
    }

    if (this.canViewDPS) {
      requests.push(this.dpsService.getAllDPS());
    }

    if (this.canViewCards) {
      requests.push(this.cardService.getAllCards());
    }

    if (this.canViewLoans) {
      requests.push(this.loanService.getAllLoans(1, 100));
    }

    if (requests.length === 0) {
      this.loading = false;
      return;
    }

    forkJoin(requests).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (responses) => {
        let index = 0;

        if (this.canViewCustomers) {
          this.processCustomerData(responses[index++]);
        }
        if (this.canViewAccounts) {
          this.processAccountData(responses[index++]);
        }
        if (this.canViewBranches) {
          this.processBranchData(responses[index++]);
          this.processBankStatistics(responses[index++]);
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

        // Initialize charts after data is loaded
        setTimeout(() => this.initializeCharts(), 100);
      },
      error: (error) => {
        console.error('Error loading dashboard data', error);
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

  private processBankStatistics(response: any): void {
    if (response?.data) {
      this.bankStatistics = response.data;
      this.topBranches = response.data.branchStatistics
        .sort((a: BranchStatistics, b: BranchStatistics) => b.totalBalance - a.totalBalance)
        .slice(0, 5);
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

  private initializeCharts(): void {
    if (this.canViewBranches && this.bankStatistics) {
      this.createBranchBalanceChart();
      this.createAccountsPerBranchChart();
      this.createBranchPerformanceChart();
      this.createAvgBalanceChart();
    }
    
    if (this.isAdmin() || this.isBranchManager()) {
      this.createEntityDistributionChart();
    }
    
    this.chartsReady = true;
  }

  private createBranchBalanceChart(): void {
    if (!this.branchBalanceChartRef || !this.bankStatistics) return;

    const ctx = this.branchBalanceChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const branchStats = this.bankStatistics.branchStatistics;

    this.branchBalanceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: branchStats.map(b => b.branchName),
        datasets: [{
          label: 'Total Balance',
          data: branchStats.map(b => b.totalBalance),
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' },
          title: { display: true, text: 'Branch Balance Distribution' }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => '৳' + Number(value).toLocaleString()
            }
          }
        }
      }
    });
  }

  private createAccountsPerBranchChart(): void {
    if (!this.accountsPerBranchChartRef || !this.bankStatistics) return;

    const ctx = this.accountsPerBranchChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const topSixBranches = this.bankStatistics.branchStatistics.slice(0, 6);

    this.accountsPerBranchChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: topSixBranches.map(b => b.branchName),
        datasets: [{
          data: topSixBranches.map(b => b.totalAccounts),
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 159, 64, 0.7)',
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'right' },
          title: { display: true, text: 'Accounts Distribution by Branch' }
        }
      }
    });
  }

  private createBranchPerformanceChart(): void {
    if (!this.branchPerformanceChartRef || !this.bankStatistics) return;

    const ctx = this.branchPerformanceChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const branchStats = this.bankStatistics.branchStatistics;

    this.branchPerformanceChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: branchStats.map(b => b.branchName),
        datasets: [
          {
            label: 'Total Accounts',
            data: branchStats.map(b => b.totalAccounts),
            backgroundColor: 'rgba(75, 192, 192, 0.7)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1
          },
          {
            label: 'Active Accounts',
            data: branchStats.map(b => b.activeAccounts),
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' },
          title: { display: true, text: 'Branch Performance: Total vs Active Accounts' }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  private createAvgBalanceChart(): void {
    if (!this.avgBalanceChartRef || !this.bankStatistics) return;

    const ctx = this.avgBalanceChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const branchStats = this.bankStatistics.branchStatistics;

    this.avgBalanceChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: branchStats.map(b => b.branchName),
        datasets: [{
          label: 'Average Balance per Account',
          data: branchStats.map(b => b.averageBalance),
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' },
          title: { display: true, text: 'Average Account Balance by Branch' }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (value) => '৳' + Number(value).toLocaleString()
            }
          }
        }
      }
    });
  }

  private createEntityDistributionChart(): void {
    if (!this.entityDistributionChartRef) return;

    const ctx = this.entityDistributionChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.entityDistributionChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: ['Customers', 'Accounts', 'Cards', 'Loans', 'DPS'],
        datasets: [{
          data: [
            this.stats.totalCustomers,
            this.stats.totalAccounts,
            this.stats.totalCards,
            this.stats.totalLoans,
            this.stats.totalDPS
          ],
          backgroundColor: [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)',
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'bottom' },
          title: { display: true, text: 'Banking Entities Distribution' }
        }
      }
    });
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

  formatCurrency(amount: number): string {
    return '৳' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  ngOnDestroy(): void {
    // Destroy chart instances to prevent memory leaks
    this.branchBalanceChart?.destroy();
    this.accountsPerBranchChart?.destroy();
    this.branchPerformanceChart?.destroy();
    this.avgBalanceChart?.destroy();
    this.entityDistributionChart?.destroy();
  }
}











// import { Component, OnInit } from '@angular/core';
// import { Router } from '@angular/router';
// import { User } from 'src/app/core/models/user';
// import { AccountService } from 'src/app/core/services/account.service';
// import { AuthService } from 'src/app/core/services/auth.service';
// import { BranchService } from 'src/app/core/services/branch.service';
// import { CustomerService } from 'src/app/core/services/customer.service';
// import { DpsService } from 'src/app/core/services/dps.service';
// import { CardService } from 'src/app/core/services/card.service';
// import { LoanService } from 'src/app/core/services/loan/loan.service';
// import { finalize, forkJoin } from 'rxjs';


// @Component({
//   selector: 'app-admin-dashboard',
//   templateUrl: './admin-dashboard.component.html',
//   styleUrls: ['./admin-dashboard.component.scss']
// })
// export class AdminDashboardComponent implements OnInit {
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

//   hasAdminDashboardAccess(): boolean {
//     return ['ADMIN', 'BRANCH_MANAGER', 'LOAN_OFFICER', 'CARD_OFFICER'].includes(this.userRole);
//   }

//   setPermissions(): void {
//     switch (this.userRole) {
//       case 'ADMIN':
//         this.canViewCustomers = true;
//         this.canViewAccounts = true;
//         this.canViewBranches = true;
//         this.canViewDPS = true;
//         this.canViewCards = true;
//         this.canViewLoans = true;
//         break;

//       case 'BRANCH_MANAGER':
//         this.canViewCustomers = true;
//         this.canViewAccounts = true;
//         this.canViewBranches = false;
//         this.canViewDPS = true;
//         this.canViewCards = true;
//         this.canViewLoans = true;
//         break;

//       case 'LOAN_OFFICER':
//         this.canViewLoans = true;
//         break;

//       case 'CARD_OFFICER':
//         this.canViewCards = true;
//         break;

//       default:
//         break;
//     }
//   }

//   /**
//    * Load dashboard data based on permissions
//    * FIX: Use forkJoin to properly handle loading state
//    */
//   loadDashboardData(): void {
//     this.loading = true;

//     const requests: any[] = [];

//     // Build array of observables based on permissions
//     if (this.canViewCustomers) {
//       requests.push(
//         this.customerService.getAllCustomers().pipe(
//           finalize(() => {})
//         )
//       );
//     }

//     if (this.canViewAccounts) {
//       requests.push(
//         this.accountService.getAllAccounts().pipe(
//           finalize(() => {})
//         )
//       );
//     }

//     if (this.canViewBranches) {
//       requests.push(
//         this.branchService.getAllBranches().pipe(
//           finalize(() => {})
//         )
//       );
//     }

//     if (this.canViewDPS) {
//       requests.push(
//         this.dpsService.getAllDPS().pipe(
//           finalize(() => {})
//         )
//       );
//     }

//     if (this.canViewCards) {
//       requests.push(
//         this.cardService.getAllCards().pipe(
//           finalize(() => {})
//         )
//       );
//     }

//     if (this.canViewLoans) {
//       requests.push(
//         this.loanService.getAllLoans(1, 100).pipe(
//           finalize(() => {})
//         )
//       );
//     }

//     // If no requests, just set loading to false
//     if (requests.length === 0) {
//       this.loading = false;
//       return;
//     }

//     // Execute all requests in parallel and handle completion
//     forkJoin(requests).subscribe({
//       next: (responses) => {
//         let index = 0;

//         // Process responses in order
//         if (this.canViewCustomers) {
//           this.processCustomerData(responses[index++]);
//         }
//         if (this.canViewAccounts) {
//           this.processAccountData(responses[index++]);
//         }
//         if (this.canViewBranches) {
//           this.processBranchData(responses[index++]);
//         }
//         if (this.canViewDPS) {
//           this.processDPSData(responses[index++]);
//         }
//         if (this.canViewCards) {
//           this.processCardData(responses[index++]);
//         }
//         if (this.canViewLoans) {
//           this.processLoanData(responses[index++]);
//         }

//         this.loading = false;
//       },
//       error: (error) => {
//         console.error('Error loading dashboard data', error);
//         this.loading = false;
//       }
//     });
//   }

//   private processCustomerData(response: any): void {
//     if (response?.data) {
//       this.stats.totalCustomers = response.data.length;
//       this.stats.activeCustomers = response.data.filter((c: any) => c.status === 'ACTIVE').length;
//       this.stats.pendingKYC = response.data.filter((c: any) => c.kycStatus === 'PENDING').length;
//       this.recentCustomers = response.data.slice(0, 5);
//     }
//   }

//   private processAccountData(response: any): void {
//     if (response?.data) {
//       this.stats.totalAccounts = response.data.length;
//       this.stats.activeAccounts = response.data.filter((a: any) => a.status === 'ACTIVE').length;
//       this.recentAccounts = response.data.slice(0, 5);
//     }
//   }

//   private processBranchData(response: any): void {
//     if (response?.data) {
//       this.stats.totalBranches = response.data.length;
//     }
//   }

//   private processDPSData(response: any): void {
//     if (response?.data) {
//       this.stats.totalDPS = response.data.length;
//       this.stats.activeDPS = response.data.filter((d: any) => d.status === 'ACTIVE').length;
//     }
//   }

//   private processCardData(response: any): void {
//     if (response?.data) {
//       this.stats.totalCards = response.data.length;
//       this.stats.activeCards = response.data.filter((c: any) => c.status === 'ACTIVE').length;
//       this.stats.blockedCards = response.data.filter((c: any) => c.status === 'BLOCKED').length;
//       this.recentCards = response.data.slice(0, 5);
//     }
//   }

//   private processLoanData(response: any): void {
//     if (response?.data) {
//       this.stats.totalLoans = response.data.totalCount || response.data.loans.length;
//       this.stats.activeLoans = response.data.loans.filter((l: any) => l.loanStatus === 'ACTIVE').length;
//       this.stats.pendingLoans = response.data.loans.filter((l: any) => l.approvalStatus === 'PENDING').length;
//       this.recentLoans = response.data.loans.slice(0, 5);
//     }
//   }

//   navigateTo(route: string): void {
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

//   isAdmin(): boolean {
//     return this.userRole === 'ADMIN';
//   }

//   isBranchManager(): boolean {
//     return this.userRole === 'BRANCH_MANAGER';
//   }

//   isLoanOfficer(): boolean {
//     return this.userRole === 'LOAN_OFFICER';
//   }

//   isCardOfficer(): boolean {
//     return this.userRole === 'CARD_OFFICER';
//   }
// }










// import { Component, OnInit } from '@angular/core';
// import { Router } from '@angular/router';
// import { User } from 'src/app/core/models/user';
// import { AccountService } from 'src/app/core/services/account.service';
// import { AuthService } from 'src/app/core/services/auth.service';
// import { BranchService } from 'src/app/core/services/branch.service';
// import { CustomerService } from 'src/app/core/services/customer.service';
// import { DpsService } from 'src/app/core/services/dps.service';
// import { CardService } from 'src/app/core/services/card.service';
// import { LoanService } from 'src/app/core/services/loan/loan.service';


// @Component({
//   selector: 'app-admin-dashboard',
//   templateUrl: './admin-dashboard.component.html',
//   styleUrls: ['./admin-dashboard.component.scss']
// })
// export class AdminDashboardComponent implements OnInit {
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















// import { Component, OnInit } from '@angular/core';
// import { Router } from '@angular/router';
// import { User } from 'src/app/core/models/user';
// import { AccountService } from 'src/app/core/services/account.service';
// import { AuthService } from 'src/app/core/services/auth.service';
// import { BranchService } from 'src/app/core/services/branch.service';
// import { CustomerService } from 'src/app/core/services/customer.service';
// import { DpsService } from 'src/app/core/services/dps.service';
// import { CardService } from 'src/app/core/services/card.service';

// @Component({
//   selector: 'app-admin-dashboard',
//   templateUrl: './admin-dashboard.component.html',
//   styleUrls: ['./admin-dashboard.component.scss']
// })
// export class AdminDashboardComponent implements OnInit {
//   currentUser: User | null = null;
//   loading = false;
  
//   // Statistics
//   stats = {
//     totalCustomers: 0,
//     totalAccounts: 0,
//     totalBranches: 0,
//     totalDPS: 0,
//     totalCards: 0,
//     activeCustomers: 0,
//     pendingKYC: 0,
//     activeAccounts: 0,
//     activeDPS: 0,
//     activeCards: 0,
//     blockedCards: 0
//   };

//   // Recent data
//   recentCustomers: any[] = [];
//   recentAccounts: any[] = [];
//   recentCards: any[] = [];

//   constructor(
//     private authService: AuthService,
//     private customerService: CustomerService,
//     private accountService: AccountService,
//     private branchService: BranchService,
//     private dpsService: DpsService,
//     private cardService: CardService,
//     private router: Router
//   ) { }

//   ngOnInit(): void {
//     this.currentUser = this.authService.currentUserValue;
    
//     if (!this.authService.isAdmin()) {
//       this.router.navigate(['/dashboard/customer-dashboard']);
//       return;
//     }

//     this.loadDashboardData();
//   }

//   loadDashboardData(): void {
//     this.loading = true;

//     // Load customers
//     this.customerService.getAllCustomers().subscribe({
//       next: (response) => {
//         this.stats.totalCustomers = response.data.length;
//         this.stats.activeCustomers = response.data.filter(c => c.status === 'active').length;
//         this.stats.pendingKYC = response.data.filter(c => c.kycStatus === 'pending').length;
//         this.recentCustomers = response.data.slice(0, 5);
//       },
//       error: (error) => console.error('Error loading customers', error)
//     });

//     // Load accounts
//     this.accountService.getAllAccounts().subscribe({
//       next: (response) => {
//         this.stats.totalAccounts = response.data.length;
//         this.stats.activeAccounts = response.data.filter(a => a.status === 'active').length;
//         this.recentAccounts = response.data.slice(0, 5);
//       },
//       error: (error) => console.error('Error loading accounts', error)
//     });

//     // Load branches
//     this.branchService.getAllBranches().subscribe({
//       next: (response) => {
//         this.stats.totalBranches = response.data.length;
//         this.loading = false;
//       },
//       error: (error) => {
//         console.error('Error loading branches', error);
//         this.loading = false;
//       }
//     });

//     // Load DPS
//     this.dpsService.getAllDPS().subscribe({
//       next: (response) => {
//         this.stats.totalDPS = response.data.length;
//         this.stats.activeDPS = response.data.filter(d => d.status === 'active').length;
//       },
//       error: (error) => console.error('Error loading DPS', error)
//     });

//     // Load Cards
//     this.cardService.getAllCards().subscribe({
//       next: (response) => {
//         this.stats.totalCards = response.data.length;
//         this.stats.activeCards = response.data.filter(c => c.status === 'active').length;
//         this.stats.blockedCards = response.data.filter(c => c.status === 'blocked').length;
//         this.recentCards = response.data.slice(0, 5);
//       },
//       error: (error) => console.error('Error loading cards', error)
//     });
//   }

//   navigateTo(route: string): void {
//     this.router.navigate([route]);
//   }
// }













// // import { Component, OnInit } from '@angular/core';
// // import { Router } from '@angular/router';
// // import { User } from 'src/app/core/models/user';
// // import { AccountService } from 'src/app/core/services/account.service';
// // import { AuthService } from 'src/app/core/services/auth.service';
// // import { BranchService } from 'src/app/core/services/branch.service';
// // import { CustomerService } from 'src/app/core/services/customer.service';
// // import { DpsService } from 'src/app/core/services/dps.service';

// // @Component({
// //   selector: 'app-admin-dashboard',
// //   templateUrl: './admin-dashboard.component.html',
// //   styleUrls: ['./admin-dashboard.component.scss']
// // })
// // export class AdminDashboardComponent implements OnInit {
// //   currentUser: User | null = null;
// //   loading = false;
  
// //   // Statistics
// //   stats = {
// //     totalCustomers: 0,
// //     totalAccounts: 0,
// //     totalBranches: 0,
// //     totalDPS: 0,
// //     activeCustomers: 0,
// //     pendingKYC: 0,
// //     activeAccounts: 0,
// //     activeDPS: 0
// //   };

// //   // Recent data
// //   recentCustomers: any[] = [];
// //   recentAccounts: any[] = [];

// //   constructor(
// //     private authService: AuthService,
// //     private customerService: CustomerService,
// //     private accountService: AccountService,
// //     private branchService: BranchService,
// //     private dpsService: DpsService,
// //     private router: Router
// //   ) { }

// //   ngOnInit(): void {
// //     this.currentUser = this.authService.currentUserValue;
    
// //     // Check if user is admin
// //     if (!this.authService.isAdmin()) {
// //       this.router.navigate(['/dashboard/customer-dashboard']);
// //       return;
// //     }

// //     this.loadDashboardData();
// //   }

// //   loadDashboardData(): void {
// //     this.loading = true;

// //     // Load all statistics
// //     this.customerService.getAllCustomers().subscribe({
// //       next: (response) => {
// //         this.stats.totalCustomers = response.data.length;
// //         this.stats.activeCustomers = response.data.filter(c => c.status === 'active').length;
// //         this.stats.pendingKYC = response.data.filter(c => c.kycStatus === 'pending').length;
// //         this.recentCustomers = response.data.slice(0, 5);
// //       },
// //       error: (error) => console.error('Error loading customers', error)
// //     });

// //     this.accountService.getAllAccounts().subscribe({
// //       next: (response) => {
// //         this.stats.totalAccounts = response.data.length;
// //         this.stats.activeAccounts = response.data.filter(a => a.status === 'active').length;
// //         this.recentAccounts = response.data.slice(0, 5);
// //       },
// //       error: (error) => console.error('Error loading accounts', error)
// //     });

// //     this.branchService.getAllBranches().subscribe({
// //       next: (response) => {
// //         this.stats.totalBranches = response.data.length;
// //         this.loading = false;
// //       },
// //       error: (error) => {
// //         console.error('Error loading branches', error);
// //         this.loading = false;
// //       }
// //     });

// //     this.dpsService.getAllDPS().subscribe({
// //       next: (response) => {
// //         this.stats.totalDPS = response.data.length;
// //         this.stats.activeDPS = response.data.filter(d => d.status === 'active').length;
// //       },
// //       error: (error) => console.error('Error loading DPS', error)
// //     });
// //   }

// //   navigateTo(route: string): void {
// //     this.router.navigate([route]);
// //   }
// // }
