import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LoanStatus, ApprovalStatus, DisbursementStatus } from 'src/app/core/models/loanModels/loan-enums.model';
import { LoanResponse } from 'src/app/core/models/loanModels/loan-response.model';
import { TimelineEvent } from 'src/app/core/models/loanModels/TimelineEvent.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { LoanService } from 'src/app/core/services/loan/loan.service';

@Component({
  selector: 'app-loan-details',
  templateUrl: './loan-details.component.html',
  styleUrls: ['./loan-details.component.scss']
})
export class LoanDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loan: LoanResponse | null = null;
  loanId: string = '';
  
  // UI state
  loading = false;
  errorMessage = '';
  successMessage = '';
  
  // Timeline
  timeline: TimelineEvent[] = [];
  
  // User permissions
  isCustomer = false;
  isAdmin = false;
  isEmployee = false;
  canApprove = false;
  canDisburse = false;
  canMakePayment = false;
  
  // Enums for template
  LoanStatus = LoanStatus;
  ApprovalStatus = ApprovalStatus;
  DisbursementStatus = DisbursementStatus;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private loanService: LoanService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.isCustomer = this.authService.isCustomer();
    this.isAdmin = this.authService.isAdmin();
    this.isEmployee = this.authService.isEmployee();
    
    this.canApprove = this.isAdmin || this.isEmployee;
    
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.loanId = params['id'];
        if (this.loanId) {
          this.loadLoanDetails();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load loan details
   */
  loadLoanDetails(): void {
    this.loading = true;
    this.errorMessage = '';

    this.loanService.getLoanById(this.loanId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.loan = response.data;
            this.updatePermissions();
            this.generateTimeline();
          }
          this.loading = false;
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.message || 'Failed to load loan details';
          console.error('Error loading loan:', error);
        }
      });
  }

  /**
   * Update user permissions based on loan status
   */
  updatePermissions(): void {
    if (!this.loan) return;

    this.canDisburse = (this.isAdmin || this.isEmployee) && 
                       this.loan.approvalStatus === 'APPROVED' &&
                       this.loan.disbursementStatus === 'PENDING';
    
    this.canMakePayment = this.loan.loanStatus === 'ACTIVE' && 
                          this.loan.outstandingBalance > 0;
  }

  /**
   * Generate timeline events
   */
  generateTimeline(): void {
    if (!this.loan) return;

    this.timeline = [];

    // Application submitted
    this.timeline.push({
      date: this.loan.applicationDate,
      title: 'Application Submitted',
      description: `Loan application for ${this.formatCurrency(this.loan.principal)} submitted`,
      icon: 'bi-file-earmark-text',
      status: 'completed',
      badgeClass: 'bg-success'
    });

    // Approval
    if (this.loan.approvalStatus === 'APPROVED' && this.loan.approvedDate) {
      this.timeline.push({
        date: this.loan.approvedDate,
        title: 'Loan Approved',
        description: 'Your loan application has been approved',
        icon: 'bi-check-circle',
        status: 'completed',
        badgeClass: 'bg-success'
      });
    } else if (this.loan.approvalStatus === 'REJECTED') {
      this.timeline.push({
        date: this.loan.createdDate,
        title: 'Loan Rejected',
        description: 'Your loan application was rejected',
        icon: 'bi-x-circle',
        status: 'completed',
        badgeClass: 'bg-danger'
      });
      return; // Stop timeline if rejected
    } else {
      this.timeline.push({
        date: this.loan.createdDate,
        title: 'Pending Approval',
        description: 'Your loan is under review',
        icon: 'bi-clock-history',
        status: 'current',
        badgeClass: 'bg-warning'
      });
      return; // Stop timeline if pending
    }

    // Disbursement
    if (this.loan.disbursementStatus === 'COMPLETED' && this.loan.actualDisbursementDate) {
      this.timeline.push({
        date: this.loan.actualDisbursementDate,
        title: 'Loan Disbursed',
        description: `Amount ${this.formatCurrency(this.loan.disbursedAmount)} credited to your account`,
        icon: 'bi-cash-coin',
        status: 'completed',
        badgeClass: 'bg-success'
      });
    } else if (this.loan.approvalStatus === 'APPROVED') {
      this.timeline.push({
        date: this.loan.createdDate,
        title: 'Pending Disbursement',
        description: 'Waiting for loan disbursement',
        icon: 'bi-hourglass-split',
        status: 'current',
        badgeClass: 'bg-info'
      });
    }

    // Active/Closed status
    if (this.loan.loanStatus === 'ACTIVE') {
      this.timeline.push({
        date: this.loan.actualDisbursementDate || this.loan.createdDate,
        title: 'Loan Active',
        description: 'Regular EMI payments in progress',
        icon: 'bi-activity',
        status: 'current',
        badgeClass: 'bg-primary'
      });
    } else if (this.loan.loanStatus === 'CLOSED') {
      this.timeline.push({
        date: this.loan.createdDate,
        title: 'Loan Closed',
        description: 'Loan has been fully repaid',
        icon: 'bi-check-circle-fill',
        status: 'completed',
        badgeClass: 'bg-success'
      });
    } else if (this.loan.loanStatus === 'DEFAULTED') {
      this.timeline.push({
        date: this.loan.createdDate,
        title: 'Loan Defaulted',
        description: 'Loan has been marked as defaulted',
        icon: 'bi-exclamation-triangle',
        status: 'completed',
        badgeClass: 'bg-danger'
      });
    }
  }

  /**
   * Navigate to statement
   */
  viewStatement(): void {
    this.router.navigate(['/loans/statement', this.loanId]);
  }

  /**
   * Navigate to repayment
   */
  makePayment(): void {
    this.router.navigate(['/loans/repay', this.loanId]);
  }

  /**
   * Navigate to foreclose
   */
  forecloseLoan(): void {
    this.router.navigate(['/loans/foreclose', this.loanId]);
  }

  /**
   * Navigate to approval page (Admin/Employee only)
   */
  approveLoan(): void {
    // This would navigate to an approval modal or page
    // For now, we'll just show a message
    this.router.navigate(['/loans/approve', this.loanId]);
  }

  /**
   * Navigate to disbursement page (Admin/Employee only)
   */
  disburseLoan(): void {
    this.router.navigate(['/loans/disburse', this.loanId]);
  }

  /**
   * Go back to loans list
   */
  goBack(): void {
    this.router.navigate(['/loans/my-loans']);
  }

  /**
   * Refresh loan details
   */
  refresh(): void {
    this.loadLoanDetails();
  }

  /**
   * Get progress percentage
   */
  getProgress(): number {
    if (!this.loan || !this.loan.principal || this.loan.principal === 0) return 0;
    const paid = this.loan.principal - this.loan.outstandingBalance;
    return Math.round((paid / this.loan.principal) * 100);
  }

  /**
   * Format currency
   */
  formatCurrency(amount: number): string {
    return `৳${amount.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  /**
   * Check if loan is secured type
   */
  isSecuredLoan(): boolean {
    if (!this.loan) return false;
    const securedTypes = ['HOME_LOAN', 'CAR_LOAN', 'GOLD_LOAN', 'INDUSTRIAL_LOAN'];
    return securedTypes.includes(this.loan.loanType);
  }

  /**
   * Check if loan is Import LC
   */
  isImportLCLoan(): boolean {
    return this.loan?.loanType === 'IMPORT_LC_LOAN';
  }

  /**
   * Check if loan is Industrial/Working Capital
   */
  isIndustrialLoan(): boolean {
    const industrialTypes = ['INDUSTRIAL_LOAN', 'WORKING_CAPITAL_LOAN'];
    return this.loan ? industrialTypes.includes(this.loan.loanType) : false;
  }
}




// export class LoanDetailsComponent implements OnInit, OnDestroy {
//   private destroy$ = new Subject<void>();

//   loan: LoanResponse | null = null;
//   loanId: string = '';
  
//   // UI state
//   loading = false;
//   errorMessage = '';
//   successMessage = '';
  
//   // Timeline
//   timeline: TimelineEvent[] = [];
  
//   // User permissions
//   isCustomer = false;
//   isAdmin = false;
//   isEmployee = false;
//   canApprove = false;
//   canDisburse = false;
//   canMakePayment = false;
  
//   // Enums for template
//   LoanStatus = LoanStatus;
//   ApprovalStatus = ApprovalStatus;
//   DisbursementStatus = DisbursementStatus;

//   constructor(
//     private route: ActivatedRoute,
//     private router: Router,
//     private loanService: LoanService,
//     private authService: AuthService
//   ) { }

//   ngOnInit(): void {
//     this.isCustomer = this.authService.isCustomer();
//     this.isAdmin = this.authService.isAdmin();
//     this.isEmployee = this.authService.isEmployee();
    
//     this.canApprove = this.isAdmin || this.isEmployee;
    
//     this.route.params
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(params => {
//         this.loanId = params['id'];
//         if (this.loanId) {
//           this.loadLoanDetails();
//         }
//       });
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   /**
//    * Load loan details
//    */
//   loadLoanDetails(): void {
//     this.loading = true;
//     this.errorMessage = '';

//     this.loanService.getLoanById(this.loanId)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (response) => {
//           if (response.success) {
//             this.loan = response.data;
//             this.updatePermissions();
//             this.generateTimeline();
//           }
//           this.loading = false;
//         },
//         error: (error) => {
//           this.loading = false;
//           this.errorMessage = error.message || 'Failed to load loan details';
//           console.error('Error loading loan:', error);
//         }
//       });
//   }

//   /**
//    * Update user permissions based on loan status
//    */
//   updatePermissions(): void {
//     if (!this.loan) return;

//     this.canDisburse = (this.isAdmin || this.isEmployee) && 
//                        this.loan.approvalStatus === 'APPROVED' &&
//                        this.loan.disbursementStatus === 'PENDING';
    
//     this.canMakePayment = this.loan.loanStatus === 'ACTIVE' && 
//                           this.loan.outstandingBalance > 0;
//   }

//   /**
//    * Generate timeline events
//    */
//   generateTimeline(): void {
//     if (!this.loan) return;

//     this.timeline = [];

//     // Application submitted
//     this.timeline.push({
//       date: this.loan.applicationDate,
//       title: 'Application Submitted',
//       description: `Loan application for ${this.formatCurrency(this.loan.principal)} submitted`,
//       icon: 'bi-file-earmark-text',
//       status: 'completed',
//       badgeClass: 'bg-success'
//     });

//     // Approval
//     if (this.loan.approvalStatus === 'APPROVED' && this.loan.approvedDate) {
//       this.timeline.push({
//         date: this.loan.approvedDate,
//         title: 'Loan Approved',
//         description: 'Your loan application has been approved',
//         icon: 'bi-check-circle',
//         status: 'completed',
//         badgeClass: 'bg-success'
//       });
//     } else if (this.loan.approvalStatus === 'REJECTED') {
//       this.timeline.push({
//         date: this.loan.createdDate,
//         title: 'Loan Rejected',
//         description: 'Your loan application was rejected',
//         icon: 'bi-x-circle',
//         status: 'completed',
//         badgeClass: 'bg-danger'
//       });
//       return; // Stop timeline if rejected
//     } else {
//       this.timeline.push({
//         date: this.loan.createdDate,
//         title: 'Pending Approval',
//         description: 'Your loan is under review',
//         icon: 'bi-clock-history',
//         status: 'current',
//         badgeClass: 'bg-warning'
//       });
//       return; // Stop timeline if pending
//     }

//     // Disbursement
//     if (this.loan.disbursementStatus === 'COMPLETED' && this.loan.actualDisbursementDate) {
//       this.timeline.push({
//         date: this.loan.actualDisbursementDate,
//         title: 'Loan Disbursed',
//         description: `Amount ${this.formatCurrency(this.loan.disbursedAmount)} credited to your account`,
//         icon: 'bi-cash-coin',
//         status: 'completed',
//         badgeClass: 'bg-success'
//       });
//     } else if (this.loan.approvalStatus === 'APPROVED') {
//       this.timeline.push({
//         date: this.loan.createdDate,
//         title: 'Pending Disbursement',
//         description: 'Waiting for loan disbursement',
//         icon: 'bi-hourglass-split',
//         status: 'current',
//         badgeClass: 'bg-info'
//       });
//     }

//     // Active/Closed status
//     if (this.loan.loanStatus === 'ACTIVE') {
//       this.timeline.push({
//         date: this.loan.actualDisbursementDate || this.loan.createdDate,
//         title: 'Loan Active',
//         description: 'Regular EMI payments in progress',
//         icon: 'bi-activity',
//         status: 'current',
//         badgeClass: 'bg-primary'
//       });
//     } else if (this.loan.loanStatus === 'CLOSED') {
//       this.timeline.push({
//         date: this.loan.createdDate,
//         title: 'Loan Closed',
//         description: 'Loan has been fully repaid',
//         icon: 'bi-check-circle-fill',
//         status: 'completed',
//         badgeClass: 'bg-success'
//       });
//     } else if (this.loan.loanStatus === 'DEFAULTED') {
//       this.timeline.push({
//         date: this.loan.createdDate,
//         title: 'Loan Defaulted',
//         description: 'Loan has been marked as defaulted',
//         icon: 'bi-exclamation-triangle',
//         status: 'completed',
//         badgeClass: 'bg-danger'
//       });
//     }
//   }

//   /**
//    * Navigate to statement
//    */
//   viewStatement(): void {
//     this.router.navigate(['/loans/statement', this.loanId]);
//   }

//   /**
//    * Navigate to repayment
//    */
//   makePayment(): void {
//     this.router.navigate(['/loans/repay', this.loanId]);
//   }

//   /**
//    * Navigate to foreclose
//    */
//   forecloseLoan(): void {
//     this.router.navigate(['/loans/foreclose', this.loanId]);
//   }

//   /**
//    * Navigate to approval page (Admin/Employee only)
//    */
//   approveLoan(): void {
//     // This would navigate to an approval modal or page
//     // For now, we'll just show a message
//     this.router.navigate(['/loans/approve', this.loanId]);
//   }

//   /**
//    * Navigate to disbursement page (Admin/Employee only)
//    */
//   disburseLoan(): void {
//     this.router.navigate(['/loans/disburse', this.loanId]);
//   }

//   /**
//    * Go back to loans list
//    */
//   goBack(): void {
//     this.router.navigate(['/loans/my-loans']);
//   }

//   /**
//    * Refresh loan details
//    */
//   refresh(): void {
//     this.loadLoanDetails();
//   }

//   /**
//    * Get progress percentage
//    */
//   getProgress(): number {
//     if (!this.loan || !this.loan.principal || this.loan.principal === 0) return 0;
//     const paid = this.loan.principal - this.loan.outstandingBalance;
//     return Math.round((paid / this.loan.principal) * 100);
//   }

//   /**
//    * Format currency
//    */
//   formatCurrency(amount: number): string {
//     return `৳${amount.toLocaleString('en-IN', {
//       minimumFractionDigits: 2,
//       maximumFractionDigits: 2
//     })}`;
//   }

//   /**
//    * Check if loan is secured type
//    */
//   isSecuredLoan(): boolean {
//     if (!this.loan) return false;
//     const securedTypes = ['HOME_LOAN', 'CAR_LOAN', 'GOLD_LOAN', 'INDUSTRIAL_LOAN'];
//     return securedTypes.includes(this.loan.loanType);
//   }

//   /**
//    * Check if loan is Import LC
//    */
//   isImportLCLoan(): boolean {
//     return this.loan?.loanType === 'IMPORT_LC_LOAN';
//   }

//   /**
//    * Check if loan is Industrial/Working Capital
//    */
//   isIndustrialLoan(): boolean {
//     const industrialTypes = ['INDUSTRIAL_LOAN', 'WORKING_CAPITAL_LOAN'];
//     return this.loan ? industrialTypes.includes(this.loan.loanType) : false;
//   }
// }
