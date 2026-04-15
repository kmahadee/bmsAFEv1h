import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { LOAN_STATUS_LABELS, LOAN_TYPE_LABELS } from 'src/app/core/models/loanModels/loan-constants.model';
import { DashboardStatistics, LoanTypeDistribution } from 'src/app/core/models/loanModels/loan-dashboard.model';
import { LoanHelpers } from 'src/app/core/models/loanModels/loan-helper.model';
import { LoanListItem } from 'src/app/core/models/loanModels/loan-response.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { LoanService } from 'src/app/core/services/loan/loan.service';

@Component({
  selector: 'app-loan-dashboard',
  templateUrl: './loan-dashboard.component.html',
  styleUrls: ['./loan-dashboard.component.scss']
})
export class LoanDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  isAdmin: boolean = false;
  isEmployee: boolean = false;
  isCustomer: boolean = false;

  loading: boolean = false;
  error: string | null = null;

  // Statistics
  statistics: DashboardStatistics = {
    totalLoans: 0,
    pendingApprovals: 0,
    activeLoans: 0,
    closedLoans: 0,
    defaultedLoans: 0,
    totalPrincipal: 0,
    totalOutstanding: 0,
    totalDisbursed: 0,
    monthlyEMICollection: 0
  };

  // Loan type distribution
  loanTypeDistribution: LoanTypeDistribution[] = [];

  // Recent loans
  recentLoans: LoanListItem[] = [];
  pendingApprovalLoans: LoanListItem[] = [];

  // Chart data
  statusChartData: any[] = [];
  typeChartData: any[] = [];

  // Pagination
  currentPage: number = 0;
  pageSize: number = 100;
  totalPages: number = 0;
  totalCount: number = 0;

  constructor(
    private router: Router,
    private loanService: LoanService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.checkUserRole();
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  checkUserRole(): void {
    this.isAdmin = this.authService.isAdmin();
    this.isEmployee = this.authService.isEmployee();
    this.isCustomer = this.authService.isCustomer();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.error = null;

    if (this.isCustomer) {
      this.loadCustomerDashboard();
    } else {
      this.loadAdminEmployeeDashboard();
    }
  }

  loadCustomerDashboard(): void {
    this.loanService.getMyLoans()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.processLoansData(response.data);
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Error loading dashboard:', error);
          this.error = 'Failed to load dashboard data. Please try again.';
          this.loading = false;
        }
      });
  }

  loadAdminEmployeeDashboard(): void {
    console.log('Loading admin/employee dashboard using getAllLoans...');
    
    // Use the new getAllLoans endpoint with pagination
    forkJoin({
      allLoans: this.loanService.getAllLoans(this.currentPage, this.pageSize),
      pendingLoans: this.loanService.getPendingApprovalLoans()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (results) => {
          console.log('All loans response:', results.allLoans);
          console.log('Pending loans response:', results.pendingLoans);
          
          // Process all loans data
          if (results.allLoans.success && results.allLoans.data) {
            const loans = results.allLoans.data.loans || [];
            console.log('Total loans found:', loans.length);
            console.log('Total count from API:', results.allLoans.data.totalCount);
            
            // Store pagination info
            this.totalCount = results.allLoans.data.totalCount;
            this.totalPages = results.allLoans.data.totalPages;
            this.currentPage = results.allLoans.data.pageNumber;
            
            if (loans.length > 0) {
              // Process all loans for statistics
              this.processLoansData(loans);
              
              // If there are more pages, load them all for complete statistics
              if (this.totalPages > 1) {
                this.loadAllPagesForStatistics(loans);
              }
            } else {
              console.warn('No loans found in database');
              this.error = 'No loans found in the system. Create some loan applications to see dashboard data.';
            }
          } else {
            console.error('All loans response unsuccessful:', results.allLoans);
            this.error = 'Failed to load loan data.';
          }
          
          // Process pending approvals
          if (results.pendingLoans.success && results.pendingLoans.data) {
            this.pendingApprovalLoans = results.pendingLoans.data.slice(0, 5);
            console.log('Pending approvals loaded:', this.pendingApprovalLoans.length);
            
            // Update pending count in statistics
            this.statistics.pendingApprovals = results.pendingLoans.data.length;
          } else {
            console.log('No pending approvals found');
          }
          
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading dashboard:', error);
          console.error('Error details:', error);
          this.error = 'Failed to load dashboard data. Please try again.';
          this.loading = false;
        }
      });
  }

  /**
   * Load all pages to get complete statistics when there are multiple pages
   */
  private loadAllPagesForStatistics(firstPageLoans: LoanListItem[]): void {
    console.log(`Loading all ${this.totalPages} pages for complete statistics...`);
    
    const pageRequests = [];
    
    // Start from page 2 since we already have page 1
    for (let page = 2; page <= this.totalPages; page++) {
      pageRequests.push(this.loanService.getAllLoans(page, this.pageSize));
    }
    
    if (pageRequests.length > 0) {
      forkJoin(pageRequests)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (responses) => {
            // Combine all loans from all pages
            let allLoans = [...firstPageLoans];
            
            responses.forEach(response => {
              if (response.success && response.data && response.data.loans) {
                allLoans = [...allLoans, ...response.data.loans];
              }
            });
            
            console.log(`Loaded all ${allLoans.length} loans from ${this.totalPages} pages`);
            
            // Reprocess with complete data
            this.processLoansData(allLoans);
          },
          error: (error) => {
            console.error('Error loading additional pages:', error);
            // Don't show error to user, we already have first page data
          }
        });
    }
  }

  processLoansData(loans: LoanListItem[]): void {
    // Calculate statistics
    this.statistics.totalLoans = loans.length;
    
    this.statistics.pendingApprovals = loans.filter(
      loan => loan.approvalStatus === 'PENDING'
    ).length;

    this.statistics.activeLoans = loans.filter(
      loan => loan.loanStatus === 'ACTIVE'
    ).length;

    this.statistics.closedLoans = loans.filter(
      loan => loan.loanStatus === 'CLOSED'
    ).length;

    this.statistics.defaultedLoans = loans.filter(
      loan => loan.loanStatus === 'DEFAULTED'
    ).length;

    this.statistics.totalPrincipal = loans.reduce(
      (sum, loan) => sum + loan.principal,
      0
    );

    this.statistics.totalOutstanding = loans.reduce(
      (sum, loan) => sum + loan.outstandingBalance,
      0
    );

    this.statistics.totalDisbursed = this.statistics.totalPrincipal - 
                                     this.statistics.totalOutstanding;

    this.statistics.monthlyEMICollection = loans
      .filter(loan => loan.loanStatus === 'ACTIVE')
      .reduce((sum, loan) => sum + loan.monthlyEMI, 0);

    // Calculate loan type distribution
    this.calculateLoanTypeDistribution(loans);

    // Prepare chart data
    this.prepareChartData(loans);

    // Get recent loans
    this.recentLoans = loans
      .sort((a, b) => 
        new Date(b.applicationDate).getTime() - 
        new Date(a.applicationDate).getTime()
      )
      .slice(0, 5);
      
    console.log('Dashboard statistics calculated:', this.statistics);
  }

  calculateLoanTypeDistribution(loans: LoanListItem[]): void {
    const distribution: { [key: string]: { count: number; amount: number } } = {};

    loans.forEach(loan => {
      if (!distribution[loan.loanType]) {
        distribution[loan.loanType] = { count: 0, amount: 0 };
      }
      distribution[loan.loanType].count++;
      distribution[loan.loanType].amount += loan.principal;
    });

    const total = loans.length;
    
    this.loanTypeDistribution = Object.keys(distribution).map(type => ({
      type: type,
      count: distribution[type].count,
      percentage: total > 0 ? (distribution[type].count / total) * 100 : 0,
      totalAmount: distribution[type].amount
    }));
  }

  prepareChartData(loans: LoanListItem[]): void {
    // Status distribution
    const statusCounts: { [key: string]: number } = {};
    loans.forEach(loan => {
      statusCounts[loan.loanStatus] = (statusCounts[loan.loanStatus] || 0) + 1;
    });

    this.statusChartData = Object.keys(statusCounts).map(status => ({
      name: LOAN_STATUS_LABELS[status] || status,
      value: statusCounts[status]
    }));

    // Type distribution
    const typeCounts: { [key: string]: number } = {};
    loans.forEach(loan => {
      typeCounts[loan.loanType] = (typeCounts[loan.loanType] || 0) + 1;
    });

    this.typeChartData = Object.keys(typeCounts).map(type => ({
      name: LOAN_TYPE_LABELS[type] || type,
      value: typeCounts[type]
    }));
  }

  // Navigation methods
  navigateToApplyLoan(): void {
    this.router.navigate(['/loans/apply']);
  }

  navigateToMyLoans(): void {
    this.router.navigate(['/loans/my-loans']);
  }

  navigateToPendingApprovals(): void {
    this.router.navigate(['/loans/pending-approvals']);
  }

  navigateToSearch(): void {
    this.router.navigate(['/loans/search']);
  }

  viewLoanDetails(loanId: string): void {
    this.router.navigate(['/loans/details', loanId]);
  }

  approveOrRejectLoan(loanId: string): void {
    this.router.navigate(['/loans/approval', loanId]);
  }

  // Formatting methods
  formatAmount(amount: number): string {
    return LoanHelpers.formatAmount(amount, 'BDT');
  }

  formatLoanType(type: string): string {
    return LOAN_TYPE_LABELS[type] || type;
  }

  formatLoanStatus(status: string): string {
    return LOAN_STATUS_LABELS[status] || status;
  }

  getLoanStatusBadgeClass(status: string): string {
    return LoanHelpers.getLoanStatusBadgeClass(status);
  }

  getApprovalStatusBadgeClass(status: string): string {
    return LoanHelpers.getApprovalStatusBadgeClass(status);
  }

  // Utility methods
  getStatusColor(status: string): string {
    const statusUpper = status.toUpperCase();
    switch (statusUpper) {
      case 'ACTIVE':
        return '#007bff';
      case 'APPROVED':
        return '#28a745';
      case 'CLOSED':
        return '#6c757d';
      case 'DEFAULTED':
        return '#dc3545';
      case 'PENDING':
        return '#ffc107';
      default:
        return '#6c757d';
    }
  }

  getTypeColor(type: string): string {
    const colors = [
      '#007bff', '#28a745', '#dc3545', '#ffc107', 
      '#17a2b8', '#6610f2', '#e83e8c', '#fd7e14', '#20c997'
    ];
    const index = Object.keys(LOAN_TYPE_LABELS).indexOf(type);
    return colors[index % colors.length];
  }

  calculateRepaymentProgress(loan: LoanListItem): number {
    return LoanHelpers.calculateProgress(
      loan.principal - loan.outstandingBalance,
      loan.principal
    );
  }

  getProgressBarClass(progress: number): string {
    if (progress >= 75) return 'bg-success';
    if (progress >= 50) return 'bg-info';
    if (progress >= 25) return 'bg-warning';
    return 'bg-danger';
  }

  refresh(): void {
    this.loadDashboardData();
  }
}









// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { Router } from '@angular/router';
// import { Subject, takeUntil, forkJoin } from 'rxjs';
// import { LOAN_STATUS_LABELS, LOAN_TYPE_LABELS } from 'src/app/core/models/loanModels/loan-constants.model';
// import { DashboardStatistics, LoanTypeDistribution } from 'src/app/core/models/loanModels/loan-dashboard.model';
// import { LoanHelpers } from 'src/app/core/models/loanModels/loan-helper.model';
// import { LoanListItem } from 'src/app/core/models/loanModels/loan-response.model';
// import { AuthService } from 'src/app/core/services/auth.service';
// import { LoanService } from 'src/app/core/services/loan/loan.service';
// // import { DashboardStatistics, LoanTypeDistribution, RecentActivity } from 'src/app/core/models/loanModels/loan-dashboard.model';

// @Component({
//   selector: 'app-loan-dashboard',
//   templateUrl: './loan-dashboard.component.html',
//   styleUrls: ['./loan-dashboard.component.scss']
// })
// export class LoanDashboardComponent implements OnInit, OnDestroy {
//   private destroy$ = new Subject<void>();

//   isAdmin: boolean = false;
//   isEmployee: boolean = false;
//   isCustomer: boolean = false;

//   loading: boolean = false;
//   error: string | null = null;

//   // Statistics
//   statistics: DashboardStatistics = {
//     totalLoans: 0,
//     pendingApprovals: 0,
//     activeLoans: 0,
//     closedLoans: 0,
//     defaultedLoans: 0,
//     totalPrincipal: 0,
//     totalOutstanding: 0,
//     totalDisbursed: 0,
//     monthlyEMICollection: 0
//   };

//   // Loan type distribution
//   loanTypeDistribution: LoanTypeDistribution[] = [];

//   // Recent loans
//   recentLoans: LoanListItem[] = [];
//   pendingApprovalLoans: LoanListItem[] = [];

//   // Chart data
//   statusChartData: any[] = [];
//   typeChartData: any[] = [];

//   constructor(
//     private router: Router,
//     private loanService: LoanService,
//     private authService: AuthService
//   ) { }

//   ngOnInit(): void {
//     this.checkUserRole();
//     this.loadDashboardData();
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   checkUserRole(): void {
//     this.isAdmin = this.authService.isAdmin();
//     this.isEmployee = this.authService.isEmployee();
//     this.isCustomer = this.authService.isCustomer();
//   }

//   loadDashboardData(): void {
//     this.loading = true;
//     this.error = null;

//     if (this.isCustomer) {
//       this.loadCustomerDashboard();
//     } else {
//       this.loadAdminEmployeeDashboard();
//     }
//   }

//   loadCustomerDashboard(): void {
//     this.loanService.getMyLoans()
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (response) => {
//           if (response.success && response.data) {
//             this.processLoansData(response.data);
//             this.loading = false;
//           }
//         },
//         error: (error) => {
//           console.error('Error loading dashboard:', error);
//           this.error = 'Failed to load dashboard data. Please try again.';
//           this.loading = false;
//         }
//       });
//   }

//   // loadAdminEmployeeDashboard(): void {
//   //   forkJoin({
//   //     pendingLoans: this.loanService.getPendingApprovalLoans()
//   //   })
//   //     .pipe(takeUntil(this.destroy$))
//   //     .subscribe({
//   //       next: (results) => {
//   //         if (results.pendingLoans.success && results.pendingLoans.data) {
//   //           this.pendingApprovalLoans = results.pendingLoans.data.slice(0, 5);
//   //           this.statistics.pendingApprovals = results.pendingLoans.data.length;
//   //         }

//   //         this.loading = false;
//   //       },
//   //       error: (error) => {
//   //         console.error('Error loading dashboard:', error);
//   //         this.error = 'Failed to load dashboard data. Please try again.';
//   //         this.loading = false;
//   //       }
//   //     });
//   // }

//   processLoansData(loans: LoanListItem[]): void {
//     // Calculate statistics
//     this.statistics.totalLoans = loans.length;
    
//     this.statistics.pendingApprovals = loans.filter(
//       loan => loan.approvalStatus === 'PENDING'
//     ).length;

//     this.statistics.activeLoans = loans.filter(
//       loan => loan.loanStatus === 'ACTIVE'
//     ).length;

//     this.statistics.closedLoans = loans.filter(
//       loan => loan.loanStatus === 'CLOSED'
//     ).length;

//     this.statistics.defaultedLoans = loans.filter(
//       loan => loan.loanStatus === 'DEFAULTED'
//     ).length;

//     this.statistics.totalPrincipal = loans.reduce(
//       (sum, loan) => sum + loan.principal,
//       0
//     );

//     this.statistics.totalOutstanding = loans.reduce(
//       (sum, loan) => sum + loan.outstandingBalance,
//       0
//     );

//     this.statistics.totalDisbursed = this.statistics.totalPrincipal - 
//                                      this.statistics.totalOutstanding;

//     this.statistics.monthlyEMICollection = loans
//       .filter(loan => loan.loanStatus === 'ACTIVE')
//       .reduce((sum, loan) => sum + loan.monthlyEMI, 0);

//     // Calculate loan type distribution
//     this.calculateLoanTypeDistribution(loans);

//     // Prepare chart data
//     this.prepareChartData(loans);

//     // Get recent loans
//     this.recentLoans = loans
//       .sort((a, b) => 
//         new Date(b.applicationDate).getTime() - 
//         new Date(a.applicationDate).getTime()
//       )
//       .slice(0, 5);
//   }

//   calculateLoanTypeDistribution(loans: LoanListItem[]): void {
//     const distribution: { [key: string]: { count: number; amount: number } } = {};

//     loans.forEach(loan => {
//       if (!distribution[loan.loanType]) {
//         distribution[loan.loanType] = { count: 0, amount: 0 };
//       }
//       distribution[loan.loanType].count++;
//       distribution[loan.loanType].amount += loan.principal;
//     });

//     const total = loans.length;
    
//     this.loanTypeDistribution = Object.keys(distribution).map(type => ({
//       type: type,
//       count: distribution[type].count,
//       percentage: (distribution[type].count / total) * 100,
//       totalAmount: distribution[type].amount
//     }));
//   }

//   prepareChartData(loans: LoanListItem[]): void {
//     // Status distribution
//     const statusCounts: { [key: string]: number } = {};
//     loans.forEach(loan => {
//       statusCounts[loan.loanStatus] = (statusCounts[loan.loanStatus] || 0) + 1;
//     });

//     this.statusChartData = Object.keys(statusCounts).map(status => ({
//       name: LOAN_STATUS_LABELS[status] || status,
//       value: statusCounts[status]
//     }));

//     // Type distribution
//     const typeCounts: { [key: string]: number } = {};
//     loans.forEach(loan => {
//       typeCounts[loan.loanType] = (typeCounts[loan.loanType] || 0) + 1;
//     });

//     this.typeChartData = Object.keys(typeCounts).map(type => ({
//       name: LOAN_TYPE_LABELS[type] || type,
//       value: typeCounts[type]
//     }));
//   }

//   // Navigation methods
//   navigateToApplyLoan(): void {
//     this.router.navigate(['/loans/apply']);
//   }

//   navigateToMyLoans(): void {
//     this.router.navigate(['/loans/my-loans']);
//   }

//   navigateToPendingApprovals(): void {
//     this.router.navigate(['/loans/pending-approvals']);
//   }

//   navigateToSearch(): void {
//     this.router.navigate(['/loans/search']);
//   }

//   viewLoanDetails(loanId: string): void {
//     this.router.navigate(['/loans/details', loanId]);
//   }

//   approveOrRejectLoan(loanId: string): void {
//     this.router.navigate(['/loans/approval', loanId]);
//   }

//   // Formatting methods
//   formatAmount(amount: number): string {
//     return LoanHelpers.formatAmount(amount, 'BDT');
//   }

//   formatLoanType(type: string): string {
//     return LOAN_TYPE_LABELS[type] || type;
//   }

//   formatLoanStatus(status: string): string {
//     return LOAN_STATUS_LABELS[status] || status;
//   }

//   getLoanStatusBadgeClass(status: string): string {
//     return LoanHelpers.getLoanStatusBadgeClass(status);
//   }

//   getApprovalStatusBadgeClass(status: string): string {
//     return LoanHelpers.getApprovalStatusBadgeClass(status);
//   }

//   // Utility methods
//   getStatusColor(status: string): string {
//     const statusUpper = status.toUpperCase();
//     switch (statusUpper) {
//       case 'ACTIVE':
//         return '#007bff';
//       case 'APPROVED':
//         return '#28a745';
//       case 'CLOSED':
//         return '#6c757d';
//       case 'DEFAULTED':
//         return '#dc3545';
//       case 'PENDING':
//         return '#ffc107';
//       default:
//         return '#6c757d';
//     }
//   }

//   getTypeColor(type: string): string {
//     const colors = [
//       '#007bff', '#28a745', '#dc3545', '#ffc107', 
//       '#17a2b8', '#6610f2', '#e83e8c', '#fd7e14', '#20c997'
//     ];
//     const index = Object.keys(LOAN_TYPE_LABELS).indexOf(type);
//     return colors[index % colors.length];
//   }

//   calculateRepaymentProgress(loan: LoanListItem): number {
//     return LoanHelpers.calculateProgress(
//       loan.principal - loan.outstandingBalance,
//       loan.principal
//     );
//   }

//   getProgressBarClass(progress: number): string {
//     if (progress >= 75) return 'bg-success';
//     if (progress >= 50) return 'bg-info';
//     if (progress >= 25) return 'bg-warning';
//     return 'bg-danger';
//   }

//   refresh(): void {
//     this.loadDashboardData();
//   }





//   loadAdminEmployeeDashboard(): void {
//   console.log('Loading admin/employee dashboard...');
  
//   // Backend has a max page size of 100, so we need to use that
//   this.loanService.searchLoans({
//     customerId: undefined,
//     loanStatus: undefined,
//     loanType: undefined,
//     // approvalStatus: undefined,
//     pageNumber: 0,
//     pageSize: 100  // Changed from 1000 to 100 (backend limit)
//   })
//     .pipe(takeUntil(this.destroy$))
//     .subscribe({
//       next: (response) => {
//         console.log('Search loans response:', response);
//         console.log('Response data:', JSON.stringify(response.data, null, 2));
        
//         if (response.success && response.data) {
//           const loans = response.data.loans || [];
//           console.log('Total loans found:', loans.length);
          
//           if (loans.length > 0) {
//             // Process all loans for statistics
//             this.processLoansData(loans);
//           } else {
//             console.warn('No loans found in database - try creating some test loans first');
//             // Show a message to the user
//             this.error = 'No loans found in the system. Create some loan applications to see dashboard data.';
//           }
//         } else {
//           console.error('Search response unsuccessful:', response);
//           this.error = 'Failed to load loan data.';
//         }
        
//         // Always try to load pending approvals
//         this.loadPendingApprovals();
//         this.loading = false;
//       },
//       error: (error) => {
//         console.error('Error loading dashboard:', error);
//         console.error('Error details:', JSON.stringify(error, null, 2));
        
//         // Fallback: Try to use pending approvals endpoint
//         console.log('Attempting fallback to pending approvals only...');
//         this.loadPendingApprovalsAsFallback();
//       }
//     });
// }

// private loadPendingApprovals(): void {
//   this.loanService.getPendingApprovalLoans()
//     .pipe(takeUntil(this.destroy$))
//     .subscribe({
//       next: (pendingResponse) => {
//         console.log('Pending approvals response:', pendingResponse);
        
//         if (pendingResponse.success && pendingResponse.data) {
//           this.pendingApprovalLoans = pendingResponse.data.slice(0, 5);
//           console.log('Pending approvals loaded:', this.pendingApprovalLoans.length);
          
//           // Update statistics
//           this.statistics.pendingApprovals = pendingResponse.data.length;
          
//           // If we have pending approvals, process them for statistics
//           if (pendingResponse.data.length > 0 && this.statistics.totalLoans === 0) {
//             console.log('Processing pending approvals for statistics...');
//             this.processLoansData(pendingResponse.data);
//           }
//         } else {
//           console.log('No pending approvals found');
//         }
//       },
//       error: (error) => {
//         console.error('Error loading pending approvals:', error);
//       }
//     });
// }

// private loadPendingApprovalsAsFallback(): void {
//   console.log('Using fallback approach - loading pending approvals only');
  
//   this.loanService.getPendingApprovalLoans()
//     .pipe(takeUntil(this.destroy$))
//     .subscribe({
//       next: (response) => {
//         if (response.success && response.data) {
//           console.log('Fallback successful - found loans:', response.data.length);
          
//           // Process as both recent loans and pending approvals
//           this.processLoansData(response.data);
//           this.pendingApprovalLoans = response.data.slice(0, 5);
          
//           this.error = null; // Clear any previous error
//         } else {
//           console.log('Fallback also returned no data');
//           this.error = 'No loan applications found in the system.';
//         }
//         this.loading = false;
//       },
//       error: (error) => {
//         console.error('Fallback also failed:', error);
//         this.error = 'Failed to load dashboard data. Please try again.';
//         this.loading = false;
//       }
//     });
// }

// // Also add this helper method to manually test the API
// testSearchEndpoint(): void {
//   console.log('=== TESTING SEARCH ENDPOINT ===');
  
//   this.loanService.searchLoans({
//     pageNumber: 0,
//     pageSize: 10
//   } as any)
//     .subscribe({
//       next: (response) => {
//         console.log('TEST RESULT:', response);
//         // console.log('Total elements:', response.data?.totalElements);
//         console.log('Loans:', response.data?.loans);
//       },
//       error: (error) => {
//         console.error('TEST ERROR:', error);
//       }
//     });
// }
// }

// // import { Component } from '@angular/core';

// // @Component({
// //   selector: 'app-loan-dashboard',
// //   templateUrl: './loan-dashboard.component.html',
// //   styleUrls: ['./loan-dashboard.component.scss']
// // })
// // export class LoanDashboardComponent {

// // }
