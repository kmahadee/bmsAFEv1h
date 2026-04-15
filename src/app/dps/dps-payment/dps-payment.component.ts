import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DPS, DPSPaymentRequest } from 'src/app/core/models/dps';
import { DpsService } from 'src/app/core/services/dps.service';


@Component({
  selector: 'app-dps-payment',
  templateUrl: './dps-payment.component.html',
  styleUrls: ['./dps-payment.component.scss']
})
export default class DpsPaymentComponent implements OnInit {
  paymentForm!: FormGroup;
  dps: DPS | null = null;
  loading = false;
  error = '';
  success = '';
  dpsNumber = '';
  showConfirmModal = false;

  paymentModes = ['CASH', 'CARD', 'AUTO_DEBIT', 'CHEQUE', 'UPI'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private dpsService: DpsService
  ) { }

  ngOnInit(): void {
    this.dpsNumber = this.route.snapshot.params['dpsNumber'];
    this.initializeForm();
    if (this.dpsNumber) {
      this.loadDPSDetails();
    }
  }

  initializeForm(): void {
    this.paymentForm = this.fb.group({
      dpsNumber: [this.dpsNumber, Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
      paymentMode: ['CASH', Validators.required],
      remarks: ['']
    });
  }

  loadDPSDetails(): void {
    this.loading = true;
    this.error = '';

    this.dpsService.getDPSByNumber(this.dpsNumber).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.dps = response.data;
          // Pre-fill amount with monthly installment
          this.paymentForm.patchValue({
            amount: this.dps.monthlyInstallment
          });
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = 'Failed to load DPS details';
        this.loading = false;
        console.error('Error loading DPS:', err);
      }
    });
  }

  setInstallmentAmount(): void {
    if (this.dps) {
      this.paymentForm.patchValue({
        amount: this.dps.monthlyInstallment
      });
    }
  }

  openConfirmModal(): void {
    if (this.paymentForm.valid) {
      this.showConfirmModal = true;
    } else {
      this.markFormGroupTouched(this.paymentForm);
    }
  }

  closeModal(): void {
    this.showConfirmModal = false;
  }

  confirmPayment(): void {
    if (this.paymentForm.valid) {
      this.loading = true;
      this.error = '';
      this.success = '';

      const paymentRequest: DPSPaymentRequest = this.paymentForm.value;

      this.dpsService.payInstallment(paymentRequest).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.success = 'Payment processed successfully!';
            this.loading = false;
            this.closeModal();
            
            // Show success message for 2 seconds, then navigate
            setTimeout(() => {
              this.router.navigate(['/dps/detail', this.dpsNumber]);
            }, 2000);
          }
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to process payment';
          this.loading = false;
          this.closeModal();
          console.error('Error processing payment:', err);
        }
      });
    }
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  cancel(): void {
    this.router.navigate(['/dps/detail', this.dpsNumber]);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.paymentForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getStatusBadgeClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': 'badge bg-success',
      'matured': 'badge bg-primary',
      'closed': 'badge bg-secondary',
      'defaulted': 'badge bg-danger',
      'suspended': 'badge bg-warning text-dark'
    };
    return statusMap[status.toLowerCase()] || 'badge bg-secondary';
  }
}
