import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AccountListItem } from 'src/app/core/models/account';
import { PaymentMode } from 'src/app/core/models/loanModels/loan-enums.model';
import { LoanRepaymentRequest } from 'src/app/core/models/loanModels/loan-request.model';
import { LoanResponse } from 'src/app/core/models/loanModels/loan-response.model';
import { AccountService } from 'src/app/core/services/account.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { LoanService } from 'src/app/core/services/loan/loan.service';

@Component({
  selector: 'app-loan-repay',
  templateUrl: './loan-repay.component.html',
  styleUrls: ['./loan-repay.component.scss']
})
export class LoanRepayComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  repaymentForm!: FormGroup;
  loan: LoanResponse | null = null;
  loanId: string = '';
  
  // Data
  accounts: AccountListItem[] = [];
  paymentModes = Object.values(PaymentMode);
  
  // UI state
  loading = false;
  loadingLoan = false;
  errorMessage = '';
  successMessage = '';
  confirmationStep = false;
  
  // Calculation
  nextEMIAmount: number = 0;
  penaltyAmount: number = 0;
  totalPayableAmount: number = 0;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private loanService: LoanService,
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
    this.repaymentForm = this.fb.group({
      loanId: [this.loanId, Validators.required],
      paymentAmount: ['', [Validators.required, Validators.min(1)]],
      paymentDate: [new Date().toISOString().split('T')[0], Validators.required],
      paymentMode: [PaymentMode.NEFT, Validators.required],
      transactionReference: ['']
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
            
            // Set default payment amount to monthly EMI
            if (this.loan.monthlyEMI) {
              this.nextEMIAmount = this.loan.monthlyEMI;
              this.repaymentForm.patchValue({
                paymentAmount: this.loan.monthlyEMI
              });
              this.calculateTotalPayable();
            }
            
            // Check if loan can be paid
            if (this.loan.loanStatus !== 'ACTIVE') {
              this.errorMessage = 'This loan is not active and cannot accept payments';
            } else if (this.loan.outstandingBalance <= 0) {
              this.errorMessage = 'This loan has been fully paid';
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
   * Calculate total payable amount (including penalty if any)
   */
  calculateTotalPayable(): void {
    const paymentAmount = this.repaymentForm.get('paymentAmount')?.value || 0;
    // In a real scenario, penalty would be calculated based on overdue days
    // For now, we'll just use the payment amount
    this.penaltyAmount = 0; // Calculate if overdue
    this.totalPayableAmount = paymentAmount + this.penaltyAmount;
  }

  /**
   * Handle payment amount change
   */
  onPaymentAmountChange(): void {
    this.calculateTotalPayable();
  }

  /**
   * Set payment amount to EMI
   */
  setAmountToEMI(): void {
    if (this.loan?.monthlyEMI) {
      this.repaymentForm.patchValue({
        paymentAmount: this.loan.monthlyEMI
      });
      this.calculateTotalPayable();
    }
  }

  /**
   * Set payment amount to full outstanding
   */
  setAmountToFullOutstanding(): void {
    if (this.loan?.outstandingBalance) {
      this.repaymentForm.patchValue({
        paymentAmount: this.loan.outstandingBalance
      });
      this.calculateTotalPayable();
    }
  }

  /**
   * Proceed to confirmation
   */
  proceedToConfirmation(): void {
    if (this.repaymentForm.invalid) {
      this.repaymentForm.markAllAsTouched();
      this.errorMessage = 'Please fill all required fields correctly';
      return;
    }

    const paymentAmount = this.repaymentForm.get('paymentAmount')?.value;
    
    if (paymentAmount <= 0) {
      this.errorMessage = 'Payment amount must be greater than zero';
      return;
    }

    if (this.loan && paymentAmount > this.loan.outstandingBalance) {
      this.errorMessage = 'Payment amount cannot exceed outstanding balance';
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
   * Submit repayment
   */
  submitRepayment(): void {
    if (this.repaymentForm.invalid) {
      this.errorMessage = 'Invalid form data';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const request: LoanRepaymentRequest = this.repaymentForm.value;

    this.loanService.repayLoan(this.loanId, request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = 'Loan repayment processed successfully!';
            this.loading = false;
            
            // Navigate to loan details after 2 seconds
            setTimeout(() => {
              this.router.navigate(['/loans/details', this.loanId]);
            }, 2000);
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.message || 'Failed to process repayment. Please try again.';
          console.error('Repayment error:', error);
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
   * Get form control
   */
  getControl(name: string) {
    return this.repaymentForm.get(name);
  }

  /**
   * Check if field is invalid
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.repaymentForm.get(fieldName);
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
}



// export class LoanRepayComponent implements OnInit, OnDestroy {
//   private destroy$ = new Subject<void>();

//   repaymentForm!: FormGroup;
//   loan: LoanResponse | null = null;
//   loanId: string = '';
  
//   // Data
//   accounts: AccountListItem[] = [];
//   paymentModes = Object.values(PaymentMode);
  
//   // UI state
//   loading = false;
//   loadingLoan = false;
//   errorMessage = '';
//   successMessage = '';
//   confirmationStep = false;
  
//   // Calculation
//   nextEMIAmount: number = 0;
//   penaltyAmount: number = 0;
//   totalPayableAmount: number = 0;

//   constructor(
//     private fb: FormBuilder,
//     private route: ActivatedRoute,
//     private router: Router,
//     private loanService: LoanService,
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
//     this.repaymentForm = this.fb.group({
//       loanId: [this.loanId, Validators.required],
//       paymentAmount: ['', [Validators.required, Validators.min(1)]],
//       paymentDate: [new Date().toISOString().split('T')[0], Validators.required],
//       paymentMode: [PaymentMode.NEFT, Validators.required],
//       transactionReference: ['']
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
            
//             // Set default payment amount to monthly EMI
//             if (this.loan.monthlyEMI) {
//               this.nextEMIAmount = this.loan.monthlyEMI;
//               this.repaymentForm.patchValue({
//                 paymentAmount: this.loan.monthlyEMI
//               });
//               this.calculateTotalPayable();
//             }
            
//             // Check if loan can be paid
//             if (this.loan.loanStatus !== 'ACTIVE') {
//               this.errorMessage = 'This loan is not active and cannot accept payments';
//             } else if (this.loan.outstandingBalance <= 0) {
//               this.errorMessage = 'This loan has been fully paid';
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
//    * Calculate total payable amount (including penalty if any)
//    */
//   calculateTotalPayable(): void {
//     const paymentAmount = this.repaymentForm.get('paymentAmount')?.value || 0;
//     // In a real scenario, penalty would be calculated based on overdue days
//     // For now, we'll just use the payment amount
//     this.penaltyAmount = 0; // Calculate if overdue
//     this.totalPayableAmount = paymentAmount + this.penaltyAmount;
//   }

//   /**
//    * Handle payment amount change
//    */
//   onPaymentAmountChange(): void {
//     this.calculateTotalPayable();
//   }

//   /**
//    * Set payment amount to EMI
//    */
//   setAmountToEMI(): void {
//     if (this.loan?.monthlyEMI) {
//       this.repaymentForm.patchValue({
//         paymentAmount: this.loan.monthlyEMI
//       });
//       this.calculateTotalPayable();
//     }
//   }

//   /**
//    * Set payment amount to full outstanding
//    */
//   setAmountToFullOutstanding(): void {
//     if (this.loan?.outstandingBalance) {
//       this.repaymentForm.patchValue({
//         paymentAmount: this.loan.outstandingBalance
//       });
//       this.calculateTotalPayable();
//     }
//   }

//   /**
//    * Proceed to confirmation
//    */
//   proceedToConfirmation(): void {
//     if (this.repaymentForm.invalid) {
//       this.repaymentForm.markAllAsTouched();
//       this.errorMessage = 'Please fill all required fields correctly';
//       return;
//     }

//     const paymentAmount = this.repaymentForm.get('paymentAmount')?.value;
    
//     if (paymentAmount <= 0) {
//       this.errorMessage = 'Payment amount must be greater than zero';
//       return;
//     }

//     if (this.loan && paymentAmount > this.loan.outstandingBalance) {
//       this.errorMessage = 'Payment amount cannot exceed outstanding balance';
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
//    * Submit repayment
//    */
//   submitRepayment(): void {
//     if (this.repaymentForm.invalid) {
//       this.errorMessage = 'Invalid form data';
//       return;
//     }

//     this.loading = true;
//     this.errorMessage = '';
//     this.successMessage = '';

//     const request: LoanRepaymentRequest = this.repaymentForm.value;

//     this.loanService.repayLoan(this.loanId, request)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (response) => {
//           if (response.success) {
//             this.successMessage = 'Loan repayment processed successfully!';
//             this.loading = false;
            
//             // Navigate to loan details after 2 seconds
//             setTimeout(() => {
//               this.router.navigate(['/loans/details', this.loanId]);
//             }, 2000);
//           }
//         },
//         error: (error) => {
//           this.loading = false;
//           this.errorMessage = error.message || 'Failed to process repayment. Please try again.';
//           console.error('Repayment error:', error);
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
//    * Get form control
//    */
//   getControl(name: string) {
//     return this.repaymentForm.get(name);
//   }

//   /**
//    * Check if field is invalid
//    */
//   isFieldInvalid(fieldName: string): boolean {
//     const field = this.repaymentForm.get(fieldName);
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
// }
