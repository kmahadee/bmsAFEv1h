import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil, forkJoin, Observable } from 'rxjs';
import { LOAN_TYPE_LABELS, LOAN_STATUS_LABELS } from 'src/app/core/models/loanModels/loan-constants.model';
import { LoanType, LoanStatus } from 'src/app/core/models/loanModels/loan-enums.model';
import { LoanHelpers } from 'src/app/core/models/loanModels/loan-helper.model';
import { LoanListItem, LoanSearchResponse } from 'src/app/core/models/loanModels/loan-response.model';
import { LoanService } from 'src/app/core/services/loan/loan.service';
import { ApiResponse } from 'src/app/core/models/api-response';

@Component({
  selector: 'app-loan-search',
  templateUrl: './loan-search.component.html',
  styleUrls: ['./loan-search.component.scss']
})
export class LoanSearchComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  Math = Math;

  searchForm!: FormGroup;
  
  loans: LoanListItem[] = [];
  filteredLoans: LoanListItem[] = [];
  allLoans: LoanListItem[] = []; // Store all loans for client-side filtering
  
  totalCount: number = 0;
  currentPage: number = 0; // Changed to 1-based for UI
  pageSize: number = 20;
  totalPages: number = 0;
  
  loading: boolean = false;
  error: string | null = null;
  
  // Enum options
  loanTypes = Object.keys(LoanType).map(key => ({
    value: key,
    label: LOAN_TYPE_LABELS[key] || key
  }));

  loanStatuses = Object.keys(LoanStatus).map(key => ({
    value: key,
    label: LOAN_STATUS_LABELS[key] || key
  }));


  constructor(
    private fb: FormBuilder,
    private router: Router,
    private loanService: LoanService
  ) { }

  ngOnInit(): void {
    this.initForm();
    // Load all loans initially
    this.loadAllLoans();
    // Setup form subscription for filtering
    this.setupSearchSubscription();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.searchForm = this.fb.group({
      customerId: [''],
      loanType: [''],
      loanStatus: [''],
      pageSize: [20]
    });
  }

  setupSearchSubscription(): void {
    this.searchForm.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1; // Reset to first page
        this.applyFilters();
      });
  }

  /**
   * Load all loans using the new getAllLoans endpoint
   */
  loadAllLoans(): void {
    this.loading = true;
    this.error = null;

    console.log('Loading all loans using getAllLoans endpoint...');

    // Load first page to get total count
    this.loanService.getAllLoans(0, 100)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('GetAllLoans response:', response);
          
          if (response.success && response.data) {
            const searchResponse: LoanSearchResponse = response.data;
            this.allLoans = searchResponse.loans || [];
            this.totalCount = searchResponse.totalCount || 0;
            this.totalPages = searchResponse.totalPages || 0;
            
            console.log('Total loans loaded:', this.allLoans.length);
            console.log('Total count from API:', this.totalCount);

            // If there are more pages, load them all
            if (this.totalPages > 1) {
              this.loadAllPages(this.allLoans);
            } else {
              // Apply filters to the loaded loans
              this.applyFilters();
              this.loading = false;
            }
          } else {
            console.warn('No loans found');
            this.allLoans = [];
            this.totalCount = 0;
            this.applyFilters();
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Error loading loans:', error);
          this.error = error.error?.message || 'Failed to load loans. Please try again.';
          this.loading = false;
        }
      });
  }

  /**
   * Load all pages if there are multiple pages
   */
  private loadAllPages(firstPageLoans: LoanListItem[]): void {
    console.log(`Loading all ${this.totalPages} pages...`);
    
    const pageRequests: Observable<ApiResponse<LoanSearchResponse>>[] = [];
    
    // Start from page 2 since we already have page 1
    for (let page = 2; page <= this.totalPages; page++) {
      pageRequests.push(this.loanService.getAllLoans(page, 100));
    }
    
    if (pageRequests.length > 0) {
      forkJoin(pageRequests)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (responses) => {
            // Combine all loans from all pages
            let combinedLoans = [...firstPageLoans];
            
            responses.forEach(response => {
              if (response.success && response.data && response.data.loans) {
                combinedLoans = [...combinedLoans, ...response.data.loans];
              }
            });
            
            console.log(`Loaded all ${combinedLoans.length} loans from ${this.totalPages} pages`);
            
            this.allLoans = combinedLoans;
            this.totalCount = combinedLoans.length;
            
            // Apply filters to all loaded loans
            this.applyFilters();
            this.loading = false;
          },
          error: (error) => {
            console.error('Error loading additional pages:', error);
            // Still show first page data
            this.allLoans = firstPageLoans;
            this.applyFilters();
            this.loading = false;
          }
        });
    } else {
      this.applyFilters();
      this.loading = false;
    }
  }

  /**
   * Apply client-side filters to all loaded loans
   */
  applyFilters(): void {
    const formValue = this.searchForm.value;
    
    // Start with all loans
    let filtered = [...this.allLoans];

    // Filter by customer ID
    if (formValue.customerId && formValue.customerId.trim()) {
      const searchTerm = formValue.customerId.trim().toLowerCase();
      filtered = filtered.filter(loan => 
        loan.customerId.toLowerCase().includes(searchTerm) ||
        loan.customerName.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by loan type
    if (formValue.loanType) {
      filtered = filtered.filter(loan => loan.loanType === formValue.loanType);
    }

    // Filter by loan status
    if (formValue.loanStatus) {
      filtered = filtered.filter(loan => loan.loanStatus === formValue.loanStatus);
    }

    // Update filtered loans
    this.filteredLoans = filtered;
    
    // Update pagination
    this.updatePagination();
    
    console.log('Filters applied:', {
      customerId: formValue.customerId,
      loanType: formValue.loanType,
      loanStatus: formValue.loanStatus,
      totalFiltered: this.filteredLoans.length
    });
  }

  /**
   * Update pagination based on filtered results
   */
  updatePagination(): void {
    this.totalCount = this.filteredLoans.length;
    this.totalPages = Math.ceil(this.totalCount / this.pageSize);
    
    // Ensure current page is valid
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = this.totalPages;
    }
    if (this.currentPage < 1) {
      this.currentPage = 1;
    }

    // Get loans for current page
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.loans = this.filteredLoans.slice(startIndex, endIndex);
  }

  /**
   * Reset all filters and reload
   */
  resetFilters(): void {
    this.searchForm.patchValue({
      customerId: '',
      loanType: '',
      loanStatus: '',
      pageSize: 20
    });
    this.currentPage = 1;
    this.applyFilters();
  }

  /**
   * Refresh all data from server
   */
  refresh(): void {
    this.loadAllLoans();
  }

  // Pagination methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  previousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  // Navigation methods
  viewLoanDetails(loanId: string): void {
    this.router.navigate(['/loans/details', loanId]);
  }

  viewLoanStatement(loanId: string): void {
    this.router.navigate(['/loans/statement', loanId]);
  }

  // Formatting methods
  formatAmount(amount: number): string {
    return LoanHelpers.formatAmount(amount, 'BDT');
  }

  formatLoanType(type: string): string {
    return LOAN_TYPE_LABELS[type] || type;
  }

  getLoanStatusBadgeClass(status: string): string {
    return LoanHelpers.getLoanStatusBadgeClass(status);
  }

  getApprovalStatusBadgeClass(status: string): string {
    return LoanHelpers.getApprovalStatusBadgeClass(status);
  }

  // Utility methods
  hasActiveFilters(): boolean {
    const values = this.searchForm.value;
    return !!(values.customerId || values.loanType || values.loanStatus);
  }

  /**
   * Export current filtered results to CSV
   */
  exportToCSV(): void {
    const headers = ['Loan ID', 'Type', 'Status', 'Approval', 'Customer', 'Principal', 'Outstanding', 'EMI', 'Date'];
    const rows = this.filteredLoans.map(loan => [
      loan.loanId,
      this.formatLoanType(loan.loanType),
      loan.loanStatus,
      loan.approvalStatus,
      loan.customerName,
      loan.principal,
      loan.outstandingBalance,
      loan.monthlyEMI,
      loan.applicationDate
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `loan-search-${new Date().getTime()}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get summary statistics for filtered results
   */
  getFilteredStatistics() {
    return {
      totalLoans: this.filteredLoans.length,
      totalPrincipal: this.filteredLoans.reduce((sum, loan) => sum + loan.principal, 0),
      totalOutstanding: this.filteredLoans.reduce((sum, loan) => sum + loan.outstandingBalance, 0),
      activeLoans: this.filteredLoans.filter(loan => loan.loanStatus === 'ACTIVE').length,
      pendingApprovals: this.filteredLoans.filter(loan => loan.approvalStatus === 'PENDING').length
    };
  }
}








// import { Component, OnDestroy, OnInit } from '@angular/core';
// import { FormGroup, FormBuilder } from '@angular/forms';
// import { Router } from '@angular/router';
// import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
// import { LOAN_TYPE_LABELS, LOAN_STATUS_LABELS } from 'src/app/core/models/loanModels/loan-constants.model';
// import { LoanType, LoanStatus } from 'src/app/core/models/loanModels/loan-enums.model';
// import { LoanHelpers } from 'src/app/core/models/loanModels/loan-helper.model';
// import { LoanSearchRequest } from 'src/app/core/models/loanModels/loan-request.model';
// import { LoanListItem, LoanSearchResponse } from 'src/app/core/models/loanModels/loan-response.model';
// import { LoanService } from 'src/app/core/services/loan/loan.service';

// @Component({
//   selector: 'app-loan-search',
//   templateUrl: './loan-search.component.html',
//   styleUrls: ['./loan-search.component.scss']
// })
// export class LoanSearchComponent implements OnInit, OnDestroy {
//   private destroy$ = new Subject<void>();

//   searchForm!: FormGroup;
  
//   loans: LoanListItem[] = [];
//   totalCount: number = 0;
//   currentPage: number = 0;
//   pageSize: number = 20;
//   totalPages: number = 0;
  
//   loading: boolean = false;
//   error: string | null = null;
  
//   // Enum options
//   loanTypes = Object.keys(LoanType).map(key => ({
//     value: key,
//     label: LOAN_TYPE_LABELS[key] || key
//   }));

//   loanStatuses = Object.keys(LoanStatus).map(key => ({
//     value: key,
//     label: LOAN_STATUS_LABELS[key] || key
//   }));

//   constructor(
//     private fb: FormBuilder,
//     private router: Router,
//     private loanService: LoanService
//   ) { }

//   // ngOnInit(): void {
//   //   this.initForm();
//   //   this.setupSearchSubscription();
//   //   this.searchLoans();
//   // }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   initForm(): void {
//     this.searchForm = this.fb.group({
//       customerId: [''],
//       loanType: [''],
//       loanStatus: [''],
//       pageSize: [20]
//     });
//   }

//   setupSearchSubscription(): void {
//     this.searchForm.valueChanges
//       .pipe(
//         debounceTime(500),
//         distinctUntilChanged(),
//         takeUntil(this.destroy$)
//       )
//       .subscribe(() => {
//         this.currentPage = 0;
//         this.searchLoans();
//       });
//   }

//   // searchLoans(): void {
//   //   this.loading = true;
//   //   this.error = null;

//   //   const searchRequest: LoanSearchRequest = {
//   //     customerId: this.searchForm.value.customerId || undefined,
//   //     loanType: this.searchForm.value.loanType || undefined,
//   //     loanStatus: this.searchForm.value.loanStatus || undefined,
//   //     pageNumber: this.currentPage,
//   //     pageSize: this.searchForm.value.pageSize || 20
//   //   };

//   //   this.loanService.searchLoans(searchRequest)
//   //     .pipe(takeUntil(this.destroy$))
//   //     .subscribe({
//   //       next: (response) => {
//   //         if (response.success && response.data) {
//   //           const searchResponse: LoanSearchResponse = response.data;
//   //           this.loans = searchResponse.loans;
//   //           this.totalCount = searchResponse.totalCount;
//   //           this.currentPage = searchResponse.pageNumber;
//   //           this.pageSize = searchResponse.pageSize;
//   //           this.totalPages = searchResponse.totalPages;
//   //           this.loading = false;
//   //         }
//   //       },
//   //       error: (error) => {
//   //         console.error('Error searching loans:', error);
//   //         this.error = 'Failed to search loans. Please try again.';
//   //         this.loading = false;
//   //       }
//   //     });
//   // }

//   // resetFilters(): void {
//   //   this.searchForm.reset({
//   //     customerId: '',
//   //     loanType: '',
//   //     loanStatus: '',
//   //     pageSize: 20
//   //   });
//   //   this.currentPage = 0;
//   // }

//   goToPage(page: number): void {
//     if (page >= 0 && page < this.totalPages) {
//       this.currentPage = page;
//       this.searchLoans();
//     }
//   }

//   nextPage(): void {
//     this.goToPage(this.currentPage + 1);
//   }

//   previousPage(): void {
//     this.goToPage(this.currentPage - 1);
//   }

//   viewLoanDetails(loanId: string): void {
//     this.router.navigate(['/loans/details', loanId]);
//   }

//   viewLoanStatement(loanId: string): void {
//     this.router.navigate(['/loans/statement', loanId]);
//   }

//   formatAmount(amount: number): string {
//     return LoanHelpers.formatAmount(amount, 'BDT');
//   }

//   formatLoanType(type: string): string {
//     return LOAN_TYPE_LABELS[type] || type;
//   }

//   getLoanStatusBadgeClass(status: string): string {
//     return LoanHelpers.getLoanStatusBadgeClass(status);
//   }

//   getApprovalStatusBadgeClass(status: string): string {
//     return LoanHelpers.getApprovalStatusBadgeClass(status);
//   }

//   hasActiveFilters(): boolean {
//     const values = this.searchForm.value;
//     return !!(values.customerId || values.loanType || values.loanStatus);
//   }

//   getPageNumbers(): number[] {
//     const pages: number[] = [];
//     const maxVisible = 5;
    
//     let start = Math.max(0, this.currentPage - Math.floor(maxVisible / 2));
//     let end = Math.min(this.totalPages - 1, start + maxVisible - 1);
    
//     if (end - start + 1 < maxVisible) {
//       start = Math.max(0, end - maxVisible + 1);
//     }
    
//     for (let i = start; i <= end; i++) {
//       pages.push(i);
//     }
    
//     return pages;
//   }

//   exportToCSV(): void {
//     const headers = ['Loan ID', 'Type', 'Status', 'Approval', 'Customer', 'Principal', 'Outstanding', 'EMI', 'Date'];
//     const rows = this.loans.map(loan => [
//       loan.loanId,
//       this.formatLoanType(loan.loanType),
//       loan.loanStatus,
//       loan.approvalStatus,
//       loan.customerName,
//       loan.principal,
//       loan.outstandingBalance,
//       loan.monthlyEMI,
//       loan.applicationDate
//     ]);

//     const csvContent = [
//       headers.join(','),
//       ...rows.map(row => row.join(','))
//     ].join('\n');

//     const blob = new Blob([csvContent], { type: 'text/csv' });
//     const url = window.URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.href = url;
//     link.download = `loan-search-${new Date().getTime()}.csv`;
//     link.click();
//     window.URL.revokeObjectURL(url);
//   }































//   // Replace your ngOnInit() method
// ngOnInit(): void {
//   this.initForm();
//   // Load all loans initially BEFORE setting up the subscription
//   this.loadAllLoans();
//   // Then setup form subscription for future changes
//   this.setupSearchSubscription();
// }

// // Add this new method to load all loans on page load
// loadAllLoans(): void {
//   this.loading = true;
//   this.error = null;

//   const searchRequest: LoanSearchRequest = {
//     customerId: undefined,
//     loanType: undefined,
//     loanStatus: undefined,
//     pageNumber: 0,
//     pageSize: 20
//   };

//   console.log('Loading all loans on initial load...');

//   this.loanService.searchLoans(searchRequest)
//     .pipe(takeUntil(this.destroy$))
//     .subscribe({
//       next: (response) => {
//         console.log('Initial load response:', response);
        
//         if (response.success && response.data) {
//           const searchResponse: LoanSearchResponse = response.data;
//           this.loans = searchResponse.loans || [];
//           this.totalCount = searchResponse.totalCount || 0;
//           this.currentPage = searchResponse.pageNumber || 0;
//           this.pageSize = searchResponse.pageSize || 20;
//           this.totalPages = searchResponse.totalPages || 0;
          
//           console.log('Total loans loaded:', this.loans.length);
//         } else {
//           console.warn('No loans found');
//           this.loans = [];
//           this.totalCount = 0;
//         }
//         this.loading = false;
//       },
//       error: (error) => {
//         console.error('Error loading loans:', error);
//         this.error = error.error?.message || 'Failed to load loans. Please try again.';
//         this.loading = false;
//       }
//     });
// }

// // Keep your existing searchLoans method
// searchLoans(): void {
//   this.loading = true;
//   this.error = null;

//   const formValue = this.searchForm.value;
  
//   // Convert empty strings to undefined for the API
//   const searchRequest: LoanSearchRequest = {
//     customerId: formValue.customerId?.trim() || undefined,
//     loanType: formValue.loanType || undefined,
//     loanStatus: formValue.loanStatus || undefined,
//     pageNumber: this.currentPage,
//     pageSize: formValue.pageSize || 20
//   };

//   console.log('Search request:', searchRequest);

//   this.loanService.searchLoans(searchRequest)
//     .pipe(takeUntil(this.destroy$))
//     .subscribe({
//       next: (response) => {
//         console.log('Search response:', response);
        
//         if (response.success && response.data) {
//           const searchResponse: LoanSearchResponse = response.data;
//           this.loans = searchResponse.loans || [];
//           this.totalCount = searchResponse.totalCount || 0;
//           this.currentPage = searchResponse.pageNumber || 0;
//           this.pageSize = searchResponse.pageSize || 20;
//           this.totalPages = searchResponse.totalPages || 0;
          
//           console.log('Loans loaded:', this.loans.length);
//         } else {
//           this.loans = [];
//           this.totalCount = 0;
//         }
//         this.loading = false;
//       },
//       error: (error) => {
//         console.error('Error searching loans:', error);
//         this.error = error.error?.message || 'Failed to search loans. Please try again.';
//         this.loading = false;
//       }
//     });
// }

// // Update resetFilters to reload all loans
// resetFilters(): void {
//   this.searchForm.patchValue({
//     customerId: '',
//     loanType: '',
//     loanStatus: '',
//     pageSize: 20
//   });
//   this.currentPage = 0;
//   this.loadAllLoans(); // Use loadAllLoans instead of searchLoans
// }
// }
