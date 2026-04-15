import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LOAN_TYPE_LABELS } from 'src/app/core/models/loanModels/loan-constants.model';
import { LoanHelpers } from 'src/app/core/models/loanModels/loan-helper.model';
import { LoanListItem } from 'src/app/core/models/loanModels/loan-response.model';
import { LoanService } from 'src/app/core/services/loan/loan.service';

@Component({
  selector: 'app-pending-approvals',
  templateUrl: './pending-approvals.component.html',
  styleUrls: ['./pending-approvals.component.scss']
})
export class PendingApprovalsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  pendingLoans: LoanListItem[] = [];
  filteredLoans: LoanListItem[] = [];
  
  loading: boolean = false;
  error: string | null = null;
  
  // Filters
  searchTerm: string = '';
  selectedLoanType: string = '';
  sortBy: 'date' | 'amount' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 10;
  totalPages: number = 1;
  paginatedLoans: LoanListItem[] = [];

  // Statistics
  totalPendingAmount: number = 0;
  averageLoanAmount: number = 0;
  loanTypeDistribution: { [key: string]: number } = {};

  constructor(
    private loanService: LoanService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadPendingLoans();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPendingLoans(): void {
    this.loading = true;
    this.error = null;

    this.loanService.getPendingApprovalLoans()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.pendingLoans = response.data;
            this.calculateStatistics();
            this.applyFilters();
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Error loading pending loans:', error);
          this.error = 'Failed to load pending approvals. Please try again.';
          this.loading = false;
        }
      });
  }

  calculateStatistics(): void {
    this.totalPendingAmount = this.pendingLoans.reduce(
      (sum, loan) => sum + loan.principal,
      0
    );

    this.averageLoanAmount = this.pendingLoans.length > 0
      ? this.totalPendingAmount / this.pendingLoans.length
      : 0;

    // Calculate loan type distribution
    this.loanTypeDistribution = {};
    this.pendingLoans.forEach(loan => {
      this.loanTypeDistribution[loan.loanType] = 
        (this.loanTypeDistribution[loan.loanType] || 0) + 1;
    });
  }

  applyFilters(): void {
    let filtered = [...this.pendingLoans];

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(loan =>
        loan.loanId.toLowerCase().includes(term) ||
        loan.customerName.toLowerCase().includes(term) ||
        loan.customerId.toLowerCase().includes(term)
      );
    }

    // Loan type filter
    if (this.selectedLoanType) {
      filtered = filtered.filter(loan => 
        loan.loanType === this.selectedLoanType
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (this.sortBy === 'date') {
        comparison = new Date(a.applicationDate).getTime() - 
                    new Date(b.applicationDate).getTime();
      } else {
        comparison = a.principal - b.principal;
      }

      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    this.filteredLoans = filtered;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredLoans.length / this.pageSize);
    this.currentPage = Math.min(this.currentPage, this.totalPages || 1);
    
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedLoans = this.filteredLoans.slice(startIndex, endIndex);
  }

  onSearchChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onLoanTypeChange(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  onSortChange(): void {
    this.applyFilters();
  }

  toggleSortOrder(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

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

  viewLoanDetails(loanId: string): void {
    this.router.navigate(['/loans/details', loanId]);
  }

  approveOrRejectLoan(loanId: string): void {
    this.router.navigate(['/loans/approval', loanId]);
  }

  formatAmount(amount: number): string {
    return LoanHelpers.formatAmount(amount, 'BDT');
  }

  formatLoanType(type: string): string {
    return LOAN_TYPE_LABELS[type] || type;
  }

  getLoanTypeBadgeClass(type: string): string {
    return 'bg-info';
  }

  getUniqueLoanTypes(): string[] {
    return [...new Set(this.pendingLoans.map(loan => loan.loanType))];
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

  refresh(): void {
    this.loadPendingLoans();
  }
}
