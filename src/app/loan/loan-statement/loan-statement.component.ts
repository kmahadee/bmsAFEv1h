import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ScheduleStatus } from 'src/app/core/models/loanModels/loan-enums.model';
import { LoanStatementResponse, RepaymentScheduleItem } from 'src/app/core/models/loanModels/loan-statement.model';
import { LoanService } from 'src/app/core/services/loan/loan.service';

@Component({
  selector: 'app-loan-statement',
  templateUrl: './loan-statement.component.html',
  styleUrls: ['./loan-statement.component.scss']
})
export class LoanStatementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  statement: LoanStatementResponse | null = null;
  loanId: string = '';
  
  // Filtered schedules
  filteredSchedules: RepaymentScheduleItem[] = [];
  
  // UI state
  loading = false;
  errorMessage = '';
  
  // Filter options
  selectedStatus: string = 'ALL';
  
  statusOptions = [
    { value: 'ALL', label: 'All Installments' },
    { value: ScheduleStatus.PENDING, label: 'Pending' },
    { value: ScheduleStatus.PAID, label: 'Paid' },
    { value: ScheduleStatus.OVERDUE, label: 'Overdue' },
    { value: ScheduleStatus.WAIVED, label: 'Waived' }
  ];
  
  // Sort options
  sortBy: 'installment' | 'dueDate' | 'amount' = 'installment';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;
  
  // Enums for template
  ScheduleStatus = ScheduleStatus;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private loanService: LoanService
  ) { }

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.loanId = params['id'];
        if (this.loanId) {
          this.loadStatement();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load loan statement
   */
  loadStatement(): void {
    this.loading = true;
    this.errorMessage = '';

    this.loanService.getLoanStatement(this.loanId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.statement = response.data;
            // Handle null or undefined repaymentSchedule
            this.filteredSchedules = this.statement.repaymentSchedule 
              ? [...this.statement.repaymentSchedule] 
              : [];
            this.applyFiltersAndSort();
            this.calculatePagination();
          }
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.message || 'Failed to load loan statement';
          console.error('Error loading statement:', error);
        }
      });
  }

  /**
   * Apply filters and sorting
   */
  applyFiltersAndSort(): void {
    if (!this.statement) return;

    // Handle null repaymentSchedule
    const schedules = this.statement.repaymentSchedule || [];

    // Filter by status
    this.filteredSchedules = schedules.filter(schedule => {
      if (this.selectedStatus === 'ALL') return true;
      return schedule.status === this.selectedStatus;
    });

    // Sort
    this.filteredSchedules.sort((a, b) => {
      let comparison = 0;

      switch (this.sortBy) {
        case 'installment':
          comparison = a.installmentNumber - b.installmentNumber;
          break;
        case 'dueDate':
          comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'amount':
          comparison = a.totalAmount - b.totalAmount;
          break;
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    this.calculatePagination();
  }

  /**
   * Calculate pagination
   */
  calculatePagination(): void {
    this.totalPages = Math.ceil(this.filteredSchedules.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  /**
   * Get paginated schedules
   */
  getPaginatedSchedules(): RepaymentScheduleItem[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredSchedules.slice(start, end);
  }

  /**
   * Handle filter change
   */
  onFilterChange(): void {
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  /**
   * Handle sort change
   */
  onSortChange(field: 'installment' | 'dueDate' | 'amount'): void {
    if (this.sortBy === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = field;
      this.sortDirection = 'asc';
    }
    this.applyFiltersAndSort();
  }

  /**
   * Navigate to page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  /**
   * Previous page
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  /**
   * Next page
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  /**
   * Export statement to PDF (placeholder)
   */
  exportToPDF(): void {
    // This would be implemented with a PDF generation library
    alert('PDF export functionality will be implemented');
  }

  /**
   * Print statement
   */
  printStatement(): void {
    window.print();
  }

  /**
   * Navigate to loan details
   */
  viewLoanDetails(): void {
    this.router.navigate(['/loans/details', this.loanId]);
  }

  /**
   * Navigate to make payment
   */
  makePayment(): void {
    this.router.navigate(['/loans/repay', this.loanId]);
  }

  /**
   * Go back
   */
  goBack(): void {
    this.router.navigate(['/loans/my-loans']);
  }

  /**
   * Refresh statement
   */
  refresh(): void {
    this.loadStatement();
  }

  /**
   * Get page numbers for pagination
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let end = Math.min(this.totalPages, start + maxPages - 1);

    if (end - start < maxPages - 1) {
      start = Math.max(1, end - maxPages + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  /**
   * Check if installment is overdue
   */
  isOverdue(schedule: RepaymentScheduleItem): boolean {
    if (schedule.status === ScheduleStatus.PAID || 
        schedule.status === ScheduleStatus.WAIVED) {
      return false;
    }
    return new Date(schedule.dueDate) < new Date();
  }

  /**
   * Get days overdue
   */
  getDaysOverdue(schedule: RepaymentScheduleItem): number {
    if (!this.isOverdue(schedule)) return 0;
    const today = new Date().getTime();
    const dueDate = new Date(schedule.dueDate).getTime();
    return Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
  }

  /**
   * Check if repayment schedule is available
   */
  hasRepaymentSchedule(): boolean {
    return this.statement?.repaymentSchedule != null && 
           this.statement.repaymentSchedule.length > 0;
  }

   /**
   * Calculate total paid amount
   * Total Paid = Principal - Outstanding Balance
   */
  getTotalPaid(): number {
    if (!this.statement) return 0;
    return this.statement.principal - this.statement.outstandingBalance;
  }
}





// import { Component, OnDestroy, OnInit } from '@angular/core';
// import { ActivatedRoute, Router } from '@angular/router';
// import { Subject, takeUntil } from 'rxjs';
// import { ScheduleStatus } from 'src/app/core/models/loanModels/loan-enums.model';
// import { LoanStatementResponse, RepaymentScheduleItem } from 'src/app/core/models/loanModels/loan-statement.model';
// import { LoanService } from 'src/app/core/services/loan/loan.service';

// @Component({
//   selector: 'app-loan-statement',
//   templateUrl: './loan-statement.component.html',
//   styleUrls: ['./loan-statement.component.scss']
// })
// export class LoanStatementComponent implements OnInit, OnDestroy {
//   private destroy$ = new Subject<void>();

//   statement: LoanStatementResponse | null = null;
//   loanId: string = '';
  
//   // Filtered schedules
//   filteredSchedules: RepaymentScheduleItem[] = [];
  
//   // UI state
//   loading = false;
//   errorMessage = '';
  
//   // Filter options
//   selectedStatus: string = 'ALL';
  
//   statusOptions = [
//     { value: 'ALL', label: 'All Installments' },
//     { value: ScheduleStatus.PENDING, label: 'Pending' },
//     { value: ScheduleStatus.PAID, label: 'Paid' },
//     { value: ScheduleStatus.OVERDUE, label: 'Overdue' },
//     { value: ScheduleStatus.WAIVED, label: 'Waived' }
//   ];
  
//   // Sort options
//   sortBy: 'installment' | 'dueDate' | 'amount' = 'installment';
//   sortDirection: 'asc' | 'desc' = 'asc';
  
//   // Pagination
//   currentPage = 1;
//   itemsPerPage = 10;
//   totalPages = 1;
  
//   // Enums for template
//   ScheduleStatus = ScheduleStatus;

//   constructor(
//     private route: ActivatedRoute,
//     private router: Router,
//     private loanService: LoanService
//   ) { }

//   ngOnInit(): void {
//     this.route.params
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(params => {
//         this.loanId = params['id'];
//         if (this.loanId) {
//           this.loadStatement();
//         }
//       });
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   /**
//    * Load loan statement
//    */
//   loadStatement(): void {
//     this.loading = true;
//     this.errorMessage = '';

//     this.loanService.getLoanStatement(this.loanId)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (response) => {
//           if (response.success) {
//             this.statement = response.data;
//             this.filteredSchedules = [...this.statement.repaymentSchedule];
//             this.applyFiltersAndSort();
//             this.calculatePagination();
//           }
//           this.loading = false;
//         },
//         error: (error) => {
//           this.loading = false;
//           this.errorMessage = error.message || 'Failed to load loan statement';
//           console.error('Error loading statement:', error);
//         }
//       });
//   }

//   /**
//    * Apply filters and sorting
//    */
//   applyFiltersAndSort(): void {
//     if (!this.statement) return;

//     // Filter by status
//     this.filteredSchedules = this.statement.repaymentSchedule.filter(schedule => {
//       if (this.selectedStatus === 'ALL') return true;
//       return schedule.status === this.selectedStatus;
//     });

//     // Sort
//     this.filteredSchedules.sort((a, b) => {
//       let comparison = 0;

//       switch (this.sortBy) {
//         case 'installment':
//           comparison = a.installmentNumber - b.installmentNumber;
//           break;
//         case 'dueDate':
//           comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
//           break;
//         case 'amount':
//           comparison = a.totalAmount - b.totalAmount;
//           break;
//       }

//       return this.sortDirection === 'asc' ? comparison : -comparison;
//     });

//     this.calculatePagination();
//   }

//   /**
//    * Calculate pagination
//    */
//   calculatePagination(): void {
//     this.totalPages = Math.ceil(this.filteredSchedules.length / this.itemsPerPage);
//     if (this.currentPage > this.totalPages) {
//       this.currentPage = 1;
//     }
//   }

//   /**
//    * Get paginated schedules
//    */
//   getPaginatedSchedules(): RepaymentScheduleItem[] {
//     const start = (this.currentPage - 1) * this.itemsPerPage;
//     const end = start + this.itemsPerPage;
//     return this.filteredSchedules.slice(start, end);
//   }

//   /**
//    * Handle filter change
//    */
//   onFilterChange(): void {
//     this.currentPage = 1;
//     this.applyFiltersAndSort();
//   }

//   /**
//    * Handle sort change
//    */
//   onSortChange(field: 'installment' | 'dueDate' | 'amount'): void {
//     if (this.sortBy === field) {
//       this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
//     } else {
//       this.sortBy = field;
//       this.sortDirection = 'asc';
//     }
//     this.applyFiltersAndSort();
//   }

//   /**
//    * Navigate to page
//    */
//   goToPage(page: number): void {
//     if (page >= 1 && page <= this.totalPages) {
//       this.currentPage = page;
//     }
//   }

//   /**
//    * Previous page
//    */
//   previousPage(): void {
//     if (this.currentPage > 1) {
//       this.currentPage--;
//     }
//   }

//   /**
//    * Next page
//    */
//   nextPage(): void {
//     if (this.currentPage < this.totalPages) {
//       this.currentPage++;
//     }
//   }

//   /**
//    * Export statement to PDF (placeholder)
//    */
//   exportToPDF(): void {
//     // This would be implemented with a PDF generation library
//     alert('PDF export functionality will be implemented');
//   }

//   /**
//    * Print statement
//    */
//   printStatement(): void {
//     window.print();
//   }

//   /**
//    * Navigate to loan details
//    */
//   viewLoanDetails(): void {
//     this.router.navigate(['/loans/details', this.loanId]);
//   }

//   /**
//    * Navigate to make payment
//    */
//   makePayment(): void {
//     this.router.navigate(['/loans/repay', this.loanId]);
//   }

//   /**
//    * Go back
//    */
//   goBack(): void {
//     this.router.navigate(['/loans/my-loans']);
//   }

//   /**
//    * Refresh statement
//    */
//   refresh(): void {
//     this.loadStatement();
//   }

//   /**
//    * Get page numbers for pagination
//    */
//   getPageNumbers(): number[] {
//     const pages: number[] = [];
//     const maxPages = 5;
//     let start = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
//     let end = Math.min(this.totalPages, start + maxPages - 1);

//     if (end - start < maxPages - 1) {
//       start = Math.max(1, end - maxPages + 1);
//     }

//     for (let i = start; i <= end; i++) {
//       pages.push(i);
//     }

//     return pages;
//   }

//   /**
//    * Check if installment is overdue
//    */
//   isOverdue(schedule: RepaymentScheduleItem): boolean {
//     if (schedule.status === ScheduleStatus.PAID || 
//         schedule.status === ScheduleStatus.WAIVED) {
//       return false;
//     }
//     return new Date(schedule.dueDate) < new Date();
//   }

//   /**
//    * Get days overdue
//    */
//   getDaysOverdue(schedule: RepaymentScheduleItem): number {
//     if (!this.isOverdue(schedule)) return 0;
//     const today = new Date().getTime();
//     const dueDate = new Date(schedule.dueDate).getTime();
//     return Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
//   }
// }







// export class LoanStatementComponent implements OnInit, OnDestroy {
//   private destroy$ = new Subject<void>();

//   statement: LoanStatementResponse | null = null;
//   loanId: string = '';
  
//   // Filtered schedules
//   filteredSchedules: RepaymentScheduleItem[] = [];
  
//   // UI state
//   loading = false;
//   errorMessage = '';
  
//   // Filter options
//   selectedStatus: string = 'ALL';
  
//   statusOptions = [
//     { value: 'ALL', label: 'All Installments' },
//     { value: ScheduleStatus.PENDING, label: 'Pending' },
//     { value: ScheduleStatus.PAID, label: 'Paid' },
//     { value: ScheduleStatus.OVERDUE, label: 'Overdue' },
//     { value: ScheduleStatus.WAIVED, label: 'Waived' }
//   ];
  
//   // Sort options
//   sortBy: 'installment' | 'dueDate' | 'amount' = 'installment';
//   sortDirection: 'asc' | 'desc' = 'asc';
  
//   // Pagination
//   currentPage = 1;
//   itemsPerPage = 10;
//   totalPages = 1;
  
//   // Enums for template
//   ScheduleStatus = ScheduleStatus;

//   constructor(
//     private route: ActivatedRoute,
//     private router: Router,
//     private loanService: LoanService
//   ) { }

//   ngOnInit(): void {
//     this.route.params
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(params => {
//         this.loanId = params['id'];
//         if (this.loanId) {
//           this.loadStatement();
//         }
//       });
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   /**
//    * Load loan statement
//    */
//   loadStatement(): void {
//     this.loading = true;
//     this.errorMessage = '';

//     this.loanService.getLoanStatement(this.loanId)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (response) => {
//           if (response.success) {
//             this.statement = response.data;
//             this.filteredSchedules = [...this.statement.repaymentSchedule];
//             this.applyFiltersAndSort();
//             this.calculatePagination();
//           }
//           this.loading = false;
//         },
//         error: (error) => {
//           this.loading = false;
//           this.errorMessage = error.message || 'Failed to load loan statement';
//           console.error('Error loading statement:', error);
//         }
//       });
//   }

//   /**
//    * Apply filters and sorting
//    */
//   applyFiltersAndSort(): void {
//     if (!this.statement) return;

//     // Filter by status
//     this.filteredSchedules = this.statement.repaymentSchedule.filter(schedule => {
//       if (this.selectedStatus === 'ALL') return true;
//       return schedule.status === this.selectedStatus;
//     });

//     // Sort
//     this.filteredSchedules.sort((a, b) => {
//       let comparison = 0;

//       switch (this.sortBy) {
//         case 'installment':
//           comparison = a.installmentNumber - b.installmentNumber;
//           break;
//         case 'dueDate':
//           comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
//           break;
//         case 'amount':
//           comparison = a.totalAmount - b.totalAmount;
//           break;
//       }

//       return this.sortDirection === 'asc' ? comparison : -comparison;
//     });

//     this.calculatePagination();
//   }

//   /**
//    * Calculate pagination
//    */
//   calculatePagination(): void {
//     this.totalPages = Math.ceil(this.filteredSchedules.length / this.itemsPerPage);
//     if (this.currentPage > this.totalPages) {
//       this.currentPage = 1;
//     }
//   }

//   /**
//    * Get paginated schedules
//    */
//   getPaginatedSchedules(): RepaymentScheduleItem[] {
//     const start = (this.currentPage - 1) * this.itemsPerPage;
//     const end = start + this.itemsPerPage;
//     return this.filteredSchedules.slice(start, end);
//   }

//   /**
//    * Handle filter change
//    */
//   onFilterChange(): void {
//     this.currentPage = 1;
//     this.applyFiltersAndSort();
//   }

//   /**
//    * Handle sort change
//    */
//   onSortChange(field: 'installment' | 'dueDate' | 'amount'): void {
//     if (this.sortBy === field) {
//       this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
//     } else {
//       this.sortBy = field;
//       this.sortDirection = 'asc';
//     }
//     this.applyFiltersAndSort();
//   }

//   /**
//    * Navigate to page
//    */
//   goToPage(page: number): void {
//     if (page >= 1 && page <= this.totalPages) {
//       this.currentPage = page;
//     }
//   }

//   /**
//    * Previous page
//    */
//   previousPage(): void {
//     if (this.currentPage > 1) {
//       this.currentPage--;
//     }
//   }

//   /**
//    * Next page
//    */
//   nextPage(): void {
//     if (this.currentPage < this.totalPages) {
//       this.currentPage++;
//     }
//   }

//   /**
//    * Export statement to PDF (placeholder)
//    */
//   exportToPDF(): void {
//     // This would be implemented with a PDF generation library
//     alert('PDF export functionality will be implemented');
//   }

//   /**
//    * Print statement
//    */
//   printStatement(): void {
//     window.print();
//   }

//   /**
//    * Navigate to loan details
//    */
//   viewLoanDetails(): void {
//     this.router.navigate(['/loans/details', this.loanId]);
//   }

//   /**
//    * Navigate to make payment
//    */
//   makePayment(): void {
//     this.router.navigate(['/loans/repay', this.loanId]);
//   }

//   /**
//    * Go back
//    */
//   goBack(): void {
//     this.router.navigate(['/loans/my-loans']);
//   }

//   /**
//    * Refresh statement
//    */
//   refresh(): void {
//     this.loadStatement();
//   }

//   /**
//    * Get page numbers for pagination
//    */
//   getPageNumbers(): number[] {
//     const pages: number[] = [];
//     const maxPages = 5;
//     let start = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
//     let end = Math.min(this.totalPages, start + maxPages - 1);

//     if (end - start < maxPages - 1) {
//       start = Math.max(1, end - maxPages + 1);
//     }

//     for (let i = start; i <= end; i++) {
//       pages.push(i);
//     }

//     return pages;
//   }

//   /**
//    * Check if installment is overdue
//    */
//   isOverdue(schedule: RepaymentScheduleItem): boolean {
//     if (schedule.status === ScheduleStatus.PAID || 
//         schedule.status === ScheduleStatus.WAIVED) {
//       return false;
//     }
//     return new Date(schedule.dueDate) < new Date();
//   }

//   /**
//    * Get days overdue
//    */
//   getDaysOverdue(schedule: RepaymentScheduleItem): number {
//     if (!this.isOverdue(schedule)) return 0;
//     const today = new Date().getTime();
//     const dueDate = new Date(schedule.dueDate).getTime();
//     return Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
//   }
// }
