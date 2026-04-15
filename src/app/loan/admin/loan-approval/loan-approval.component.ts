import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { LoanConstants } from 'src/app/core/models/loanModels/loan-constants.model';
import { LoanHelpers } from 'src/app/core/models/loanModels/loan-helper.model';
import { LoanApprovalRequest } from 'src/app/core/models/loanModels/loan-request.model';
import { LoanResponse } from 'src/app/core/models/loanModels/loan-response.model';
import { LoanService } from 'src/app/core/services/loan/loan.service';

@Component({
  selector: 'app-loan-approval',
  templateUrl: './loan-approval.component.html',
  styleUrls: ['./loan-approval.component.scss']
})
export class LoanApprovalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loanId: string = '';
  loan: LoanResponse | null = null;
  
  approvalForm!: FormGroup;
  rejectionForm!: FormGroup;
  
  loading: boolean = false;
  submitting: boolean = false;
  error: string | null = null;
  
  showApprovalModal: boolean = false;
  showRejectionModal: boolean = false;
  
  // Constants
  readonly MIN_INTEREST_RATE = LoanConstants.MIN_INTEREST_RATE;
  readonly MAX_INTEREST_RATE = LoanConstants.MAX_INTEREST_RATE;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private loanService: LoanService
  ) { }

  ngOnInit(): void {
    this.loanId = this.route.snapshot.paramMap.get('id') || '';
    this.initForms();
    
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

  initForms(): void {
    this.approvalForm = this.fb.group({
      interestRateModification: [
        null,
        [
          Validators.min(this.MIN_INTEREST_RATE),
          Validators.max(this.MAX_INTEREST_RATE)
        ]
      ],
      approvalConditions: ['', Validators.maxLength(1000)],
      comments: ['', Validators.maxLength(1000)]
    });

    this.rejectionForm = this.fb.group({
      rejectionReason: [
        '',
        [Validators.required, Validators.maxLength(1000)]
      ],
      comments: ['', Validators.maxLength(1000)]
    });
  }

  loadLoanDetails(): void {
    this.loading = true;
    this.error = null;

    this.loanService.getLoanById(this.loanId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.loan = response.data;
            
            // Pre-fill interest rate
            this.approvalForm.patchValue({
              interestRateModification: this.loan.annualInterestRate
            });
            
            this.loading = false;
          }
        },
        error: (error) => {
          console.error('Error loading loan:', error);
          this.error = 'Failed to load loan details. Please try again.';
          this.loading = false;
        }
      });
  }

  openApprovalModal(): void {
    if (this.loan?.approvalStatus !== 'PENDING') {
      alert('Only pending loans can be approved.');
      return;
    }
    this.showApprovalModal = true;
  }

  openRejectionModal(): void {
    if (this.loan?.approvalStatus !== 'PENDING') {
      alert('Only pending loans can be rejected.');
      return;
    }
    this.showRejectionModal = true;
  }

  closeApprovalModal(): void {
    this.showApprovalModal = false;
  }

  closeRejectionModal(): void {
    this.showRejectionModal = false;
  }

  approveLoan(): void {
    if (this.approvalForm.invalid || !this.loan) {
      this.approvalForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.error = null;

    const approvalRequest: LoanApprovalRequest = {
      loanId: this.loanId,
      approvalStatus: 'APPROVED',
      comments: this.approvalForm.value.comments || undefined,
      approvalConditions: this.approvalForm.value.approvalConditions || undefined,
      interestRateModification: this.approvalForm.value.interestRateModification || undefined
    };

    this.loanService.approveLoan(this.loanId, approvalRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            alert('Loan approved successfully!');
            this.router.navigate(['/loans/pending-approvals']);
          }
        },
        error: (error) => {
          console.error('Error approving loan:', error);
          this.error = error.error?.message || 'Failed to approve loan. Please try again.';
          this.submitting = false;
        }
      });
  }

  rejectLoan(): void {
    if (this.rejectionForm.invalid || !this.loan) {
      this.rejectionForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.error = null;

    const rejectionRequest: LoanApprovalRequest = {
      loanId: this.loanId,
      approvalStatus: 'REJECTED',
      rejectionReason: this.rejectionForm.value.rejectionReason,
      comments: this.rejectionForm.value.comments || undefined
    };

    this.loanService.rejectLoan(this.loanId, rejectionRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            alert('Loan rejected successfully!');
            this.router.navigate(['/loans/pending-approvals']);
          }
        },
        error: (error) => {
          console.error('Error rejecting loan:', error);
          this.error = error.error?.message || 'Failed to reject loan. Please try again.';
          this.submitting = false;
        }
      });
  }

  formatAmount(amount: number): string {
    return LoanHelpers.formatAmount(amount, 'BDT');
  }

  canApprove(): boolean {
    return this.loan?.approvalStatus === 'PENDING' && !this.submitting;
  }

  canReject(): boolean {
    return this.loan?.approvalStatus === 'PENDING' && !this.submitting;
  }

  goBack(): void {
    this.router.navigate(['/loans/pending-approvals']);
  }
}
