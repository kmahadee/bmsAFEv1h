import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs'; // Removed unused switchMap
import { Customer } from 'src/app/core/models/customer';
import { LOAN_TYPE_LABELS, LOAN_STATUS_LABELS } from 'src/app/core/models/loanModels/loan-constants.model';
import { LoanHelpers } from 'src/app/core/models/loanModels/loan-helper.model';
import { LoanListItem } from 'src/app/core/models/loanModels/loan-response.model';
import { CustomerService } from 'src/app/core/services/customer.service';
import { LoanService } from 'src/app/core/services/loan/loan.service';


@Component({
  selector: 'app-customer-loans',
  templateUrl: './customer-loans.component.html',
  styleUrls: ['./customer-loans.component.scss']
})
export class CustomerLoansComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  customerId: string = '';
  customer: Customer | null = null;
  loans: LoanListItem[] = [];
  filteredLoans: LoanListItem[] = [];
  
  loading: boolean = false;
  loadingCustomer: boolean = false;
  error: string | null = null;
  
  // Filters
  selectedStatus: string = '';
  selectedType: string = '';
  
  // Statistics
  totalLoans: number = 0;
  activeLoans: number = 0;
  totalPrincipal: number = 0;
  totalOutstanding: number = 0;
  totalEMI: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private loanService: LoanService,
    private customerService: CustomerService
  ) { }

  ngOnInit(): void {
    this.customerId = this.route.snapshot.paramMap.get('customerId') || '';
    
    if (this.customerId) {
      this.loadCustomerInfo();
      this.loadCustomerLoans();
    } else {
      this.error = 'Invalid customer ID';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCustomerInfo(): void {
    this.loadingCustomer = true;

    this.customerService.getCustomerByCustomerId(this.customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.customer = response.data;
            this.loadingCustomer = false;
          }
        },
        error: (error) => {
          console.error('Error loading customer:', error);
          this.loadingCustomer = false;
        }
      });
  }

  loadCustomerLoans(): void {
    this.loading = true;
    this.error = null;

    this.loanService.getLoansByCustomerId(this.customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.loans = response.data;
            this.calculateStatistics();
            this.applyFilters();
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Error loading loans:', error);
          this.error = 'Failed to load customer loans. Please try again.';
          this.loading = false;
        }
      });
  }

  calculateStatistics(): void {
    this.totalLoans = this.loans.length;
    
    this.activeLoans = this.loans.filter(
      loan => loan.loanStatus === 'ACTIVE'
    ).length;

    this.totalPrincipal = this.loans.reduce(
      (sum, loan) => sum + loan.principal,
      0
    );

    this.totalOutstanding = this.loans.reduce(
      (sum, loan) => sum + loan.outstandingBalance,
      0
    );

    this.totalEMI = this.loans
      .filter(loan => loan.loanStatus === 'ACTIVE')
      .reduce((sum, loan) => sum + loan.monthlyEMI, 0);
  }

  applyFilters(): void {
    let filtered = [...this.loans];

    // Status filter
    if (this.selectedStatus) {
      filtered = filtered.filter(loan => 
        loan.loanStatus === this.selectedStatus
      );
    }

    // Type filter
    if (this.selectedType) {
      filtered = filtered.filter(loan => 
        loan.loanType === this.selectedType
      );
    }

    this.filteredLoans = filtered;
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  onTypeChange(): void {
    this.applyFilters();
  }

  resetFilters(): void {
    this.selectedStatus = '';
    this.selectedType = '';
    this.applyFilters();
  }

  viewLoanDetails(loanId: string): void {
    this.router.navigate(['/loans/details', loanId]);
  }

  viewLoanStatement(loanId: string): void {
    this.router.navigate(['/loans/statement', loanId]);
  }

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

  getUniqueLoanStatuses(): string[] {
    return [...new Set(this.loans.map(loan => loan.loanStatus))];
  }

  getUniqueLoanTypes(): string[] {
    return [...new Set(this.loans.map(loan => loan.loanType))];
  }

  getCustomerName(): string {
    if (!this.customer) return 'Customer';
    return `${this.customer.firstName} ${this.customer.lastName}`;
  }

  goBack(): void {
    this.router.navigate(['/loans/search']);
  }

  refresh(): void {
    this.loadCustomerLoans();
  }
}


// import { Component } from '@angular/core';

// @Component({
//   selector: 'app-customer-loans',
//   templateUrl: './customer-loans.component.html',
//   styleUrls: ['./customer-loans.component.scss']
// })
// export class CustomerLoansComponent {

// }
