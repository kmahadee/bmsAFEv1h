import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LoanStatus } from 'src/app/core/models/loanModels/loan-enums.model';
import { LoanListItem } from 'src/app/core/models/loanModels/loan-response.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { LoanService } from 'src/app/core/services/loan/loan.service';

@Component({
  selector: 'app-my-loans',
  templateUrl: './my-loans.component.html',
  styleUrls: ['./my-loans.component.scss']
})
export class MyLoansComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loans: LoanListItem[] = [];
  filteredLoans: LoanListItem[] = [];
  
  // UI state
  loading = false;
  errorMessage = '';
  
  // Filter options
  selectedStatus: string = 'ALL';
  selectedType: string = 'ALL';
  searchQuery: string = '';
  
  // Status options
  statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: LoanStatus.APPLICATION, label: 'Application' },
    { value: LoanStatus.PROCESSING, label: 'Processing' },
    { value: LoanStatus.APPROVED, label: 'Approved' },
    { value: LoanStatus.ACTIVE, label: 'Active' },
    { value: LoanStatus.CLOSED, label: 'Closed' },
    { value: LoanStatus.DEFAULTED, label: 'Defaulted' }
  ];
  
  // Statistics
  stats = {
    totalLoans: 0,
    activeLoans: 0,
    totalOutstanding: 0,
    totalMonthlyEMI: 0
  };
  
  // Current user
  isCustomer = false;
  isAdmin = false;
  isEmployee = false;

  constructor(
    private loanService: LoanService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.isCustomer = this.authService.isCustomer();
    this.isAdmin = this.authService.isAdmin();
    this.isEmployee = this.authService.isEmployee();
    
    this.loadLoans();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load loans based on user role
   */
  loadLoans(): void {
    this.loading = true;
    this.errorMessage = '';

    this.loanService.getMyLoans()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.loans = response.data;
            this.filteredLoans = [...this.loans];
            this.calculateStatistics();
            this.applyFilters();
          }
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.message || 'Failed to load loans';
          console.error('Error loading loans:', error);
        }
      });
  }

  /**
   * Calculate statistics
   */
  calculateStatistics(): void {
    this.stats.totalLoans = this.loans.length;
    this.stats.activeLoans = this.loans.filter(
      loan => loan.loanStatus === LoanStatus.ACTIVE
    ).length;
    
    this.stats.totalOutstanding = this.loans
      .filter(loan => loan.loanStatus === LoanStatus.ACTIVE)
      .reduce((sum, loan) => sum + loan.outstandingBalance, 0);
    
    this.stats.totalMonthlyEMI = this.loans
      .filter(loan => loan.loanStatus === LoanStatus.ACTIVE)
      .reduce((sum, loan) => sum + loan.monthlyEMI, 0);
  }

  /**
   * Apply filters
   */
  applyFilters(): void {
    this.filteredLoans = this.loans.filter(loan => {
      // Status filter
      const statusMatch = this.selectedStatus === 'ALL' || 
                          loan.loanStatus === this.selectedStatus;
      
      // Type filter
      const typeMatch = this.selectedType === 'ALL' || 
                        loan.loanType === this.selectedType;
      
      // Search query
      const searchMatch = !this.searchQuery ||
                          loan.loanId.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
                          loan.customerName?.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      return statusMatch && typeMatch && searchMatch;
    });
  }

  /**
   * Handle status filter change
   */
  onStatusFilterChange(): void {
    this.applyFilters();
  }

  /**
   * Handle type filter change
   */
  onTypeFilterChange(): void {
    this.applyFilters();
  }

  /**
   * Handle search
   */
  onSearch(): void {
    this.applyFilters();
  }

  /**
   * Navigate to loan details
   */
  viewLoanDetails(loanId: string): void {
    this.router.navigate(['/loans/details', loanId]);
  }

  /**
   * Navigate to loan statement
   */
  viewStatement(loanId: string): void {
    this.router.navigate(['/loans/statement', loanId]);
  }

  /**
   * Navigate to repayment page
   */
  makePayment(loanId: string): void {
    this.router.navigate(['/loans/repay', loanId]);
  }

  /**
   * Navigate to foreclose page
   */
  forecloseLoan(loanId: string): void {
    this.router.navigate(['/loans/foreclose', loanId]);
  }

  /**
   * Navigate to apply for new loan
   */
  applyForLoan(): void {
    this.router.navigate(['/loans/apply']);
  }

  /**
   * Refresh loans list
   */
  refresh(): void {
    this.loadLoans();
  }

  /**
   * Check if loan can be paid
   */
  canMakePayment(loan: LoanListItem): boolean {
    return loan.loanStatus === LoanStatus.ACTIVE && 
           loan.outstandingBalance > 0;
  }

  /**
   * Check if loan can be foreclosed
   */
  canForeclose(loan: LoanListItem): boolean {
    return loan.loanStatus === LoanStatus.ACTIVE && 
           loan.outstandingBalance > 0;
  }

  /**
   * Get progress percentage
   */
  getProgress(loan: LoanListItem): number {
    if (!loan.principal || loan.principal === 0) return 0;
    const paid = loan.principal - loan.outstandingBalance;
    return Math.round((paid / loan.principal) * 100);
  }
}









// export class MyLoansComponent implements OnInit, OnDestroy {
//   private destroy$ = new Subject<void>();

//   loans: LoanListItem[] = [];
//   filteredLoans: LoanListItem[] = [];
  
//   // UI state
//   loading = false;
//   errorMessage = '';
  
//   // Filter options
//   selectedStatus: string = 'ALL';
//   selectedType: string = 'ALL';
//   searchQuery: string = '';
  
//   // Status options
//   statusOptions = [
//     { value: 'ALL', label: 'All Statuses' },
//     { value: LoanStatus.APPLICATION, label: 'Application' },
//     { value: LoanStatus.PROCESSING, label: 'Processing' },
//     { value: LoanStatus.APPROVED, label: 'Approved' },
//     { value: LoanStatus.ACTIVE, label: 'Active' },
//     { value: LoanStatus.CLOSED, label: 'Closed' },
//     { value: LoanStatus.DEFAULTED, label: 'Defaulted' }
//   ];
  
//   // Statistics
//   stats = {
//     totalLoans: 0,
//     activeLoans: 0,
//     totalOutstanding: 0,
//     totalMonthlyEMI: 0
//   };
  
//   // Current user
//   isCustomer = false;
//   isAdmin = false;
//   isEmployee = false;

//   constructor(
//     private loanService: LoanService,
//     private authService: AuthService,
//     private router: Router
//   ) { }

//   ngOnInit(): void {
//     this.isCustomer = this.authService.isCustomer();
//     this.isAdmin = this.authService.isAdmin();
//     this.isEmployee = this.authService.isEmployee();
    
//     this.loadLoans();
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   /**
//    * Load loans based on user role
//    */
//   loadLoans(): void {
//     this.loading = true;
//     this.errorMessage = '';

//     this.loanService.getMyLoans()
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (response) => {
//           if (response.success) {
//             this.loans = response.data;
//             this.filteredLoans = [...this.loans];
//             this.calculateStatistics();
//             this.applyFilters();
//           }
//           this.loading = false;
//         },
//         error: (error) => {
//           this.loading = false;
//           this.errorMessage = error.message || 'Failed to load loans';
//           console.error('Error loading loans:', error);
//         }
//       });
//   }

//   /**
//    * Calculate statistics
//    */
//   calculateStatistics(): void {
//     this.stats.totalLoans = this.loans.length;
//     this.stats.activeLoans = this.loans.filter(
//       loan => loan.loanStatus === LoanStatus.ACTIVE
//     ).length;
    
//     this.stats.totalOutstanding = this.loans
//       .filter(loan => loan.loanStatus === LoanStatus.ACTIVE)
//       .reduce((sum, loan) => sum + loan.outstandingBalance, 0);
    
//     this.stats.totalMonthlyEMI = this.loans
//       .filter(loan => loan.loanStatus === LoanStatus.ACTIVE)
//       .reduce((sum, loan) => sum + loan.monthlyEMI, 0);
//   }

//   /**
//    * Apply filters
//    */
//   applyFilters(): void {
//     this.filteredLoans = this.loans.filter(loan => {
//       // Status filter
//       const statusMatch = this.selectedStatus === 'ALL' || 
//                           loan.loanStatus === this.selectedStatus;
      
//       // Type filter
//       const typeMatch = this.selectedType === 'ALL' || 
//                         loan.loanType === this.selectedType;
      
//       // Search query
//       const searchMatch = !this.searchQuery ||
//                           loan.loanId.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
//                           loan.customerName?.toLowerCase().includes(this.searchQuery.toLowerCase());
      
//       return statusMatch && typeMatch && searchMatch;
//     });
//   }

//   /**
//    * Handle status filter change
//    */
//   onStatusFilterChange(): void {
//     this.applyFilters();
//   }

//   /**
//    * Handle type filter change
//    */
//   onTypeFilterChange(): void {
//     this.applyFilters();
//   }

//   /**
//    * Handle search
//    */
//   onSearch(): void {
//     this.applyFilters();
//   }

//   /**
//    * Navigate to loan details
//    */
//   viewLoanDetails(loanId: string): void {
//     this.router.navigate(['/loans/details', loanId]);
//   }

//   /**
//    * Navigate to loan statement
//    */
//   viewStatement(loanId: string): void {
//     this.router.navigate(['/loans/statement', loanId]);
//   }

//   /**
//    * Navigate to repayment page
//    */
//   makePayment(loanId: string): void {
//     this.router.navigate(['/loans/repay', loanId]);
//   }

//   /**
//    * Navigate to foreclose page
//    */
//   forecloseLoan(loanId: string): void {
//     this.router.navigate(['/loans/foreclose', loanId]);
//   }

//   /**
//    * Navigate to apply for new loan
//    */
//   applyForLoan(): void {
//     this.router.navigate(['/loans/apply']);
//   }

//   /**
//    * Refresh loans list
//    */
//   refresh(): void {
//     this.loadLoans();
//   }

//   /**
//    * Check if loan can be paid
//    */
//   canMakePayment(loan: LoanListItem): boolean {
//     return loan.loanStatus === LoanStatus.ACTIVE && 
//            loan.outstandingBalance > 0;
//   }

//   /**
//    * Check if loan can be foreclosed
//    */
//   canForeclose(loan: LoanListItem): boolean {
//     return loan.loanStatus === LoanStatus.ACTIVE && 
//            loan.outstandingBalance > 0;
//   }

//   /**
//    * Get progress percentage
//    */
//   getProgress(loan: LoanListItem): number {
//     if (!loan.principal || loan.principal === 0) return 0;
//     const paid = loan.principal - loan.outstandingBalance;
//     return Math.round((paid / loan.principal) * 100);
//   }
// }
