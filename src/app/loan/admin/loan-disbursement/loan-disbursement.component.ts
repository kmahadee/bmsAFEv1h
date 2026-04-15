import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AccountListItem } from 'src/app/core/models/account';
import { LoanHelpers } from 'src/app/core/models/loanModels/loan-helper.model';
import { LoanDisbursementRequest } from 'src/app/core/models/loanModels/loan-request.model';
import { LoanResponse } from 'src/app/core/models/loanModels/loan-response.model';
import { AccountService } from 'src/app/core/services/account.service';
import { LoanService } from 'src/app/core/services/loan/loan.service';

@Component({
  selector: 'app-loan-disbursement',
  templateUrl: './loan-disbursement.component.html',
  styleUrls: ['./loan-disbursement.component.scss']
})
export class LoanDisbursementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loanId: string = '';
  loan: LoanResponse | null = null;
  customerAccounts: AccountListItem[] = [];
  
  disbursementForm!: FormGroup;
  
  loading: boolean = false;
  loadingAccounts: boolean = false;
  submitting: boolean = false;
  error: string | null = null;
  
  showConfirmationModal: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private loanService: LoanService,
    private accountService: AccountService
  ) { }

  ngOnInit(): void {
    this.loanId = this.route.snapshot.paramMap.get('id') || '';
    this.initForm();
    
    if (this.loanId) {
      this.loadLoanDetails();
    } else {
      this.error = 'Invalid loan ID';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.disbursementForm = this.fb.group({
      accountNumber: ['', Validators.required],
      disbursementAmount: [
        null,
        [Validators.required, Validators.min(1)]
      ],
      scheduledDate: [''],
      bankDetails: ['']
    });
  }

  loadLoanDetails(): void {
    this.loading = true;
    this.error = null;

    this.loanService.getLoanById(this.loanId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Loan details response:', response);
          
          if (response.success && response.data) {
            this.loan = response.data;
            
            // Pre-fill form
            this.disbursementForm.patchValue({
              disbursementAmount: this.loan.principal,
              accountNumber: this.loan.accountNumber
            });
            
            // Load customer accounts
            this.loadCustomerAccounts(this.loan.customerId);
          } else {
            this.error = 'Failed to load loan details.';
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Error loading loan:', error);
          this.error = error.error?.message || 'Failed to load loan details. Please try again.';
          this.loading = false;
        }
      });
  }

  loadCustomerAccounts(customerId: string): void {
    this.loadingAccounts = true;

    this.accountService.getAccountsByCustomerId(customerId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Customer accounts response:', response);
          
          if (response.success && response.data) {
            // Only show active accounts
            this.customerAccounts = response.data.filter(
              acc => acc.status === 'active' || acc.status === 'ACTIVE'
            );
            console.log('Active accounts:', this.customerAccounts);
          }
          this.loadingAccounts = false;
          this.loading = false; // Stop main loading after accounts are loaded
        },
        error: (error) => {
          console.error('Error loading accounts:', error);
          this.loadingAccounts = false;
          this.loading = false; // Stop main loading even if accounts fail
          // Don't set error here, just log it - user can still proceed with pre-filled account
        }
      });
  }

  openConfirmationModal(): void {
    if (this.disbursementForm.invalid) {
      this.disbursementForm.markAllAsTouched();
      return;
    }

    if (!this.canDisburse()) {
      this.error = 'This loan cannot be disbursed at this time. Please check the loan status.';
      return;
    }

    this.showConfirmationModal = true;
  }

  closeConfirmationModal(): void {
    this.showConfirmationModal = false;
  }

  disburseLoan(): void {
    if (this.disbursementForm.invalid || !this.loan) {
      return;
    }

    this.submitting = true;
    this.error = null;

    const disbursementRequest: LoanDisbursementRequest = {
      loanId: this.loanId,
      disbursementAmount: this.disbursementForm.value.disbursementAmount,
      accountNumber: this.disbursementForm.value.accountNumber,
      bankDetails: this.disbursementForm.value.bankDetails || undefined,
      scheduledDate: this.disbursementForm.value.scheduledDate || undefined
    };

    console.log('Disbursement request:', disbursementRequest);

    this.loanService.disburseLoan(this.loanId, disbursementRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Disbursement response:', response);
          
          if (response.success) {
            this.closeConfirmationModal();
            alert('Loan disbursed successfully!');
            this.router.navigate(['/loans/details', this.loanId]);
          } else {
            this.error = response.message || 'Failed to disburse loan.';
            this.submitting = false;
            this.closeConfirmationModal();
          }
        },
        error: (error) => {
          console.error('Error disbursing loan:', error);
          this.error = error.error?.message || 'Failed to disburse loan. Please try again.';
          this.submitting = false;
          this.closeConfirmationModal();
        }
      });
  }

  canDisburse(): boolean {
    if (!this.loan) return false;
    
    return this.loan.approvalStatus === 'APPROVED' &&
           this.loan.disbursementStatus !== 'COMPLETED' &&
           !this.submitting;
  }

  formatAmount(amount: number): string {
    return LoanHelpers.formatAmount(amount, 'BDT');
  }

  getMaxDisbursementAmount(): number {
    return this.loan?.principal || 0;
  }

  onAccountChange(): void {
    // You can add additional logic here if needed
    console.log('Selected account:', this.disbursementForm.value.accountNumber);
  }

  goBack(): void {
    this.router.navigate(['/loans/details', this.loanId]);
  }
}



// import { Component, OnDestroy, OnInit } from '@angular/core';
// import { FormGroup, FormBuilder, Validators } from '@angular/forms';
// import { ActivatedRoute, Router } from '@angular/router';
// import { Subject, takeUntil, switchMap } from 'rxjs';
// import { AccountListItem } from 'src/app/core/models/account';
// import { LoanHelpers } from 'src/app/core/models/loanModels/loan-helper.model';
// import { LoanDisbursementRequest } from 'src/app/core/models/loanModels/loan-request.model';
// import { LoanResponse } from 'src/app/core/models/loanModels/loan-response.model';
// import { AccountService } from 'src/app/core/services/account.service';
// import { LoanService } from 'src/app/core/services/loan/loan.service';

// @Component({
//   selector: 'app-loan-disbursement',
//   templateUrl: './loan-disbursement.component.html',
//   styleUrls: ['./loan-disbursement.component.scss']
// })
// export class LoanDisbursementComponent implements OnInit, OnDestroy {
//   private destroy$ = new Subject<void>();

//   loanId: string = '';
//   loan: LoanResponse | null = null;
//   customerAccounts: AccountListItem[] = [];
  
//   disbursementForm!: FormGroup;
  
//   loading: boolean = false;
//   loadingAccounts: boolean = false;
//   submitting: boolean = false;
//   error: string | null = null;
  
//   showConfirmationModal: boolean = false;

//   constructor(
//     private route: ActivatedRoute,
//     private router: Router,
//     private fb: FormBuilder,
//     private loanService: LoanService,
//     private accountService: AccountService
//   ) { }

//   ngOnInit(): void {
//     this.loanId = this.route.snapshot.paramMap.get('id') || '';
//     this.initForm();
    
//     if (this.loanId) {
//       this.loadLoanDetails();
//     } else {
//       this.error = 'Invalid loan ID';
//     }
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   initForm(): void {
//     this.disbursementForm = this.fb.group({
//       accountNumber: ['', Validators.required],
//       disbursementAmount: [
//         null,
//         [Validators.required, Validators.min(1)]
//       ],
//       scheduledDate: [''],
//       bankDetails: ['']
//     });
//   }

//   loadLoanDetails(): void {
//     this.loading = true;
//     this.error = null;

//     this.loanService.getLoanById(this.loanId)
//       .pipe(
//         takeUntil(this.destroy$),
//         switchMap((response) => {
//           if (response.success && response.data) {
//             this.loan = response.data;
            
//             // Pre-fill form
//             this.disbursementForm.patchValue({
//               disbursementAmount: this.loan.principal,
//               accountNumber: this.loan.accountNumber
//             });
            
//             // Load customer accounts
//             this.loadCustomerAccounts(this.loan.customerId);
//           }
//           return [];
//         })
//       )
//       .subscribe({
//         next: () => {
//           this.loading = false;
//         },
//         error: (error) => {
//           console.error('Error loading loan:', error);
//           this.error = 'Failed to load loan details. Please try again.';
//           this.loading = false;
//         }
//       });
//   }

//   loadCustomerAccounts(customerId: string): void {
//     this.loadingAccounts = true;

//     this.accountService.getAccountsByCustomerId(customerId)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (response) => {
//           if (response.success && response.data) {
//             // Only show active accounts
//             this.customerAccounts = response.data.filter(
//               acc => acc.status === 'active'
//             );
//             this.loadingAccounts = false;
//           }
//         },
//         error: (error) => {
//           console.error('Error loading accounts:', error);
//           this.loadingAccounts = false;
//         }
//       });
//   }

//   openConfirmationModal(): void {
//     if (this.disbursementForm.invalid) {
//       this.disbursementForm.markAllAsTouched();
//       return;
//     }

//     if (!this.canDisburse()) {
//       alert('This loan cannot be disbursed at this time.');
//       return;
//     }

//     this.showConfirmationModal = true;
//   }

//   closeConfirmationModal(): void {
//     this.showConfirmationModal = false;
//   }

//   disburseLoan(): void {
//     if (this.disbursementForm.invalid || !this.loan) {
//       return;
//     }

//     this.submitting = true;
//     this.error = null;

//     const disbursementRequest: LoanDisbursementRequest = {
//       loanId: this.loanId,
//       disbursementAmount: this.disbursementForm.value.disbursementAmount,
//       accountNumber: this.disbursementForm.value.accountNumber,
//       bankDetails: this.disbursementForm.value.bankDetails || undefined,
//       scheduledDate: this.disbursementForm.value.scheduledDate || undefined
//     };

//     this.loanService.disburseLoan(this.loanId, disbursementRequest)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (response) => {
//           if (response.success) {
//             alert('Loan disbursed successfully!');
//             this.closeConfirmationModal();
//             this.router.navigate(['/loans/details', this.loanId]);
//           }
//         },
//         error: (error) => {
//           console.error('Error disbursing loan:', error);
//           this.error = error.error?.message || 'Failed to disburse loan. Please try again.';
//           this.submitting = false;
//           this.closeConfirmationModal();
//         }
//       });
//   }

//   canDisburse(): boolean {
//     if (!this.loan) return false;
    
//     return this.loan.approvalStatus === 'APPROVED' &&
//            this.loan.disbursementStatus !== 'COMPLETED' &&
//            !this.submitting;
//   }

//   formatAmount(amount: number): string {
//     return LoanHelpers.formatAmount(amount, 'BDT');
//   }

//   getMaxDisbursementAmount(): number {
//     return this.loan?.principal || 0;
//   }

//   onAccountChange(): void {
//     // You can add additional logic here if needed
//   }

//   goBack(): void {
//     this.router.navigate(['/loans/details', this.loanId]);
//   }
// }
