import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AccountListItem } from 'src/app/core/models/account';
import { LoanConstants } from 'src/app/core/models/loanModels/loan-constants.model';
import { LoanForeclosureRequest } from 'src/app/core/models/loanModels/loan-request.model';
import { LoanResponse } from 'src/app/core/models/loanModels/loan-response.model';
import { AccountService } from 'src/app/core/services/account.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { LoanCalculationService } from 'src/app/core/services/loan/loan-calculation.service';
import { LoanService } from 'src/app/core/services/loan/loan.service';

@Component({
  selector: 'app-loan-foreclose',
  templateUrl: './loan-foreclose.component.html',
  styleUrls: ['./loan-foreclose.component.scss']
})
export class LoanForecloseComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  foreclosureForm!: FormGroup;
  loan: LoanResponse | null = null;
  loanId: string = '';
  window = window;
  
  // Data
  accounts: AccountListItem[] = [];
  
  // UI state
  loading = false;
  loadingLoan = false;
  errorMessage = '';
  successMessage = '';
  confirmationStep = false;
  
  // Calculation
  outstandingBalance: number = 0;
  foreclosurePenalty: number = 0;
  totalForeclosureAmount: number = 0;
  penaltyPercentage = LoanConstants.FORECLOSURE_PENALTY_RATE;
  
  // Warnings
  showWarning = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private loanService: LoanService,
    private calculationService: LoanCalculationService,
    private accountService: AccountService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        this.loanId = params['id'];
        if (this.loanId) {
          this.initializeForm();
          this.loadLoanDetails();
          this.loadAccounts();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize form
   */
  initializeForm(): void {
    this.foreclosureForm = this.fb.group({
      loanId: [this.loanId, Validators.required],
      foreclosureDate: [new Date().toISOString().split('T')[0], Validators.required],
      settlementAccountNumber: ['', Validators.required]
    });
  }

  /**
   * Load loan details
   */
  loadLoanDetails(): void {
    this.loadingLoan = true;
    this.errorMessage = '';

    this.loanService.getLoanById(this.loanId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.loan = response.data;
            
            // Check if loan can be foreclosed
            if (this.loan.loanStatus !== 'ACTIVE') {
              this.errorMessage = 'Only active loans can be foreclosed';
            } else if (this.loan.outstandingBalance <= 0) {
              this.errorMessage = 'This loan has been fully paid';
            } else {
              // Calculate foreclosure amount
              this.calculateForeclosureAmount();
            }
          }
          this.loadingLoan = false;
        },
        error: (error) => {
          this.loadingLoan = false;
          this.errorMessage = error.message || 'Failed to load loan details';
          console.error('Error loading loan:', error);
        }
      });
  }

  /**
   * Load customer accounts
   */
  loadAccounts(): void {
    const customerId = this.authService.getCustomerId();
    if (!customerId) return;

    this.accountService.getAccountsByCustomerId(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.accounts = response.data.filter(acc => acc.status === 'active');
          }
        },
        error: (error) => {
          console.error('Error loading accounts:', error);
        }
      });
  }

  /**
   * Calculate foreclosure amount
   */
  calculateForeclosureAmount(): void {
    if (!this.loan) return;

    const result = this.calculationService.calculateForeclosureAmount(
      this.loan.outstandingBalance,
      this.penaltyPercentage
    );

    this.outstandingBalance = result.outstandingBalance;
    this.foreclosurePenalty = result.penalty;
    this.totalForeclosureAmount = result.totalAmount;
  }

  /**
   * Handle account selection
   */
  onAccountSelect(): void {
    const accountNumber = this.foreclosureForm.get('settlementAccountNumber')?.value;
    const selectedAccount = this.accounts.find(acc => acc.accountNumber === accountNumber);

    if (selectedAccount && selectedAccount.balance < this.totalForeclosureAmount) {
      this.showWarning = true;
      this.errorMessage = `Insufficient balance. Required: ${this.formatCurrency(this.totalForeclosureAmount)}, Available: ${this.formatCurrency(selectedAccount.balance)}`;
    } else {
      this.showWarning = false;
      this.errorMessage = '';
    }
  }

  /**
   * Proceed to confirmation
   */
  proceedToConfirmation(): void {
    if (this.foreclosureForm.invalid) {
      this.foreclosureForm.markAllAsTouched();
      this.errorMessage = 'Please fill all required fields correctly';
      return;
    }

    const accountNumber = this.foreclosureForm.get('settlementAccountNumber')?.value;
    const selectedAccount = this.accounts.find(acc => acc.accountNumber === accountNumber);

    if (selectedAccount && selectedAccount.balance < this.totalForeclosureAmount) {
      this.errorMessage = 'Insufficient balance in selected account';
      return;
    }

    this.confirmationStep = true;
    this.errorMessage = '';
  }

  /**
   * Go back to form
   */
  backToForm(): void {
    this.confirmationStep = false;
  }

  /**
   * Submit foreclosure
   */
  submitForeclosure(): void {
    if (this.foreclosureForm.invalid) {
      this.errorMessage = 'Invalid form data';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request: LoanForeclosureRequest = this.foreclosureForm.value;

    this.loanService.foreCloseLoan(this.loanId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = 'Loan foreclosed successfully!';
            this.loading = false;
            
            // Navigate to loan details after 2 seconds
            setTimeout(() => {
              this.router.navigate(['/loans/details', this.loanId]);
            }, 2000);
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.message || 'Failed to foreclose loan. Please try again.';
          console.error('Foreclosure error:', error);
          this.confirmationStep = false;
        }
      });
  }

  /**
   * Cancel and go back
   */
  cancel(): void {
    this.router.navigate(['/loans/details', this.loanId]);
  }

  /**
   * Get selected account
   */
  getSelectedAccount(): AccountListItem | undefined {
    const accountNumber = this.foreclosureForm.get('settlementAccountNumber')?.value;
    return this.accounts.find(acc => acc.accountNumber === accountNumber);
  }

  /**
   * Get form control
   */
  getControl(name: string) {
    return this.foreclosureForm.get(name);
  }

  /**
   * Check if field is invalid
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.foreclosureForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
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
   * Get savings amount
   */
  getSavingsAmount(): number {
    if (!this.loan) return 0;
    const remainingInterest = this.loan.totalAmount - this.loan.principal - 
                             (this.loan.principal - this.loan.outstandingBalance);
    return Math.max(0, remainingInterest - this.foreclosurePenalty);
  }
}



// export class LoanForecloseComponent implements OnInit, OnDestroy {
//   private destroy$ = new Subject<void>();

//   foreclosureForm!: FormGroup;
//   loan: LoanResponse | null = null;
//   loanId: string = '';
  
//   // Data
//   accounts: AccountListItem[] = [];
  
//   // UI state
//   loading = false;
//   loadingLoan = false;
//   errorMessage = '';
//   successMessage = '';
//   confirmationStep = false;
  
//   // Calculation
//   outstandingBalance: number = 0;
//   foreclosurePenalty: number = 0;
//   totalForeclosureAmount: number = 0;
//   penaltyPercentage = LoanConstants.FORECLOSURE_PENALTY_RATE;
  
//   // Warnings
//   showWarning = false;

//   constructor(
//     private fb: FormBuilder,
//     private route: ActivatedRoute,
//     private router: Router,
//     private loanService: LoanService,
//     private calculationService: LoanCalculationService,
//     private accountService: AccountService,
//     private authService: AuthService
//   ) { }

//   ngOnInit(): void {
//     this.route.params
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(params => {
//         this.loanId = params['id'];
//         if (this.loanId) {
//           this.initializeForm();
//           this.loadLoanDetails();
//           this.loadAccounts();
//         }
//       });
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   /**
//    * Initialize form
//    */
//   initializeForm(): void {
//     this.foreclosureForm = this.fb.group({
//       loanId: [this.loanId, Validators.required],
//       foreclosureDate: [new Date().toISOString().split('T')[0], Validators.required],
//       settlementAccountNumber: ['', Validators.required]
//     });
//   }

//   /**
//    * Load loan details
//    */
//   loadLoanDetails(): void {
//     this.loadingLoan = true;
//     this.errorMessage = '';

//     this.loanService.getLoanById(this.loanId)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (response) => {
//           if (response.success) {
//             this.loan = response.data;
            
//             // Check if loan can be foreclosed
//             if (this.loan.loanStatus !== 'ACTIVE') {
//               this.errorMessage = 'Only active loans can be foreclosed';
//             } else if (this.loan.outstandingBalance <= 0) {
//               this.errorMessage = 'This loan has been fully paid';
//             } else {
//               // Calculate foreclosure amount
//               this.calculateForeclosureAmount();
//             }
//           }
//           this.loadingLoan = false;
//         },
//         error: (error) => {
//           this.loadingLoan = false;
//           this.errorMessage = error.message || 'Failed to load loan details';
//           console.error('Error loading loan:', error);
//         }
//       });
//   }

//   /**
//    * Load customer accounts
//    */
//   loadAccounts(): void {
//     const customerId = this.authService.getCustomerId();
//     if (!customerId) return;

//     this.accountService.getAccountsByCustomerId(customerId)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (response) => {
//           if (response.success) {
//             this.accounts = response.data.filter(acc => acc.status === 'active');
//           }
//         },
//         error: (error) => {
//           console.error('Error loading accounts:', error);
//         }
//       });
//   }

//   /**
//    * Calculate foreclosure amount
//    */
//   calculateForeclosureAmount(): void {
//     if (!this.loan) return;

//     const result = this.calculationService.calculateForeclosureAmount(
//       this.loan.outstandingBalance,
//       this.penaltyPercentage
//     );

//     this.outstandingBalance = result.outstandingBalance;
//     this.foreclosurePenalty = result.penalty;
//     this.totalForeclosureAmount = result.totalAmount;
//   }

//   /**
//    * Handle account selection
//    */
//   onAccountSelect(): void {
//     const accountNumber = this.foreclosureForm.get('settlementAccountNumber')?.value;
//     const selectedAccount = this.accounts.find(acc => acc.accountNumber === accountNumber);

//     if (selectedAccount && selectedAccount.balance < this.totalForeclosureAmount) {
//       this.showWarning = true;
//       this.errorMessage = `Insufficient balance. Required: ${this.formatCurrency(this.totalForeclosureAmount)}, Available: ${this.formatCurrency(selectedAccount.balance)}`;
//     } else {
//       this.showWarning = false;
//       this.errorMessage = '';
//     }
//   }

//   /**
//    * Proceed to confirmation
//    */
//   proceedToConfirmation(): void {
//     if (this.foreclosureForm.invalid) {
//       this.foreclosureForm.markAllAsTouched();
//       this.errorMessage = 'Please fill all required fields correctly';
//       return;
//     }

//     const accountNumber = this.foreclosureForm.get('settlementAccountNumber')?.value;
//     const selectedAccount = this.accounts.find(acc => acc.accountNumber === accountNumber);

//     if (selectedAccount && selectedAccount.balance < this.totalForeclosureAmount) {
//       this.errorMessage = 'Insufficient balance in selected account';
//       return;
//     }

//     this.confirmationStep = true;
//     this.errorMessage = '';
//   }

//   /**
//    * Go back to form
//    */
//   backToForm(): void {
//     this.confirmationStep = false;
//   }

//   /**
//    * Submit foreclosure
//    */
//   submitForeclosure(): void {
//     if (this.foreclosureForm.invalid) {
//       this.errorMessage = 'Invalid form data';
//       return;
//     }

//     this.loading = true;
//     this.errorMessage = '';
//     this.successMessage = '';

//     const request: LoanForeclosureRequest = this.foreclosureForm.value;

//     this.loanService.foreCloseLoan(this.loanId, request)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (response) => {
//           if (response.success) {
//             this.successMessage = 'Loan foreclosed successfully!';
//             this.loading = false;
            
//             // Navigate to loan details after 2 seconds
//             setTimeout(() => {
//               this.router.navigate(['/loans/details', this.loanId]);
//             }, 2000);
//           }
//         },
//         error: (error) => {
//           this.loading = false;
//           this.errorMessage = error.message || 'Failed to foreclose loan. Please try again.';
//           console.error('Foreclosure error:', error);
//           this.confirmationStep = false;
//         }
//       });
//   }

//   /**
//    * Cancel and go back
//    */
//   cancel(): void {
//     this.router.navigate(['/loans/details', this.loanId]);
//   }

//   /**
//    * Get selected account
//    */
//   getSelectedAccount(): AccountListItem | undefined {
//     const accountNumber = this.foreclosureForm.get('settlementAccountNumber')?.value;
//     return this.accounts.find(acc => acc.accountNumber === accountNumber);
//   }

//   /**
//    * Get form control
//    */
//   getControl(name: string) {
//     return this.foreclosureForm.get(name);
//   }

//   /**
//    * Check if field is invalid
//    */
//   isFieldInvalid(fieldName: string): boolean {
//     const field = this.foreclosureForm.get(fieldName);
//     return !!(field && field.invalid && (field.dirty || field.touched));
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
//    * Get savings amount
//    */
//   getSavingsAmount(): number {
//     if (!this.loan) return 0;
//     const remainingInterest = this.loan.totalAmount - this.loan.principal - 
//                              (this.loan.principal - this.loan.outstandingBalance);
//     return Math.max(0, remainingInterest - this.foreclosurePenalty);
//   }

//   window = window;
//   printInvoice(): void {
//   window.print();
// }
// }

