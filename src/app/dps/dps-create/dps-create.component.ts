import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { DPSCreateRequest, DPSMaturityCalculation } from 'src/app/core/models/dps';
import { AccountService } from 'src/app/core/services/account.service';
import { BranchService } from 'src/app/core/services/branch.service';
import { CustomerService } from 'src/app/core/services/customer.service';
import { DpsService } from 'src/app/core/services/dps.service';



@Component({
  selector: 'app-dps-create',
  templateUrl: './dps-create.component.html',
  styleUrls: ['./dps-create.component.scss']
})

export class DpsCreateComponent implements OnInit {
  dpsForm!: FormGroup;
  loading = false;
  error = '';
  success = '';
  maturityCalculation: DPSMaturityCalculation | null = null;
  
  customers: any[] = [];
  branches: any[] = [];
  accounts: any[] = [];
  
  showMaturityCalculator = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private dpsService: DpsService,
    private customerService: CustomerService,
    private branchService: BranchService,
    private accountService: AccountService
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadCustomers();
    this.loadBranches();
  }

  initializeForm(): void {
    this.dpsForm = this.fb.group({
      customerId: ['', Validators.required],
      linkedAccountNumber: [''],
      branchCode: ['', Validators.required],
      monthlyInstallment: ['', [Validators.required, Validators.min(100)]],
      tenureMonths: ['', [Validators.required, Validators.min(6), Validators.max(120)]],
      interestRate: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      autoDebitEnabled: [false],
      nomineeFirstName: [''],
      nomineeLastName: [''],
      nomineeRelationship: [''],
      nomineePhone: [''],
      remarks: ['']
    });

    // Watch for changes to calculate maturity
    this.dpsForm.get('monthlyInstallment')?.valueChanges.subscribe(() => {
      if (this.showMaturityCalculator) {
        this.calculateMaturity();
      }
    });

    this.dpsForm.get('tenureMonths')?.valueChanges.subscribe(() => {
      if (this.showMaturityCalculator) {
        this.calculateMaturity();
      }
    });

    this.dpsForm.get('interestRate')?.valueChanges.subscribe(() => {
      if (this.showMaturityCalculator) {
        this.calculateMaturity();
      }
    });
  }

  loadCustomers(): void {
    this.customerService.getAllCustomers().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customers = response.data;
        }
      },
      error: (err) => {
        console.error('Error loading customers:', err);
      }
    });
  }

  loadBranches(): void {
    this.branchService.getAllBranches().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.branches = response.data;
        }
      },
      error: (err) => {
        console.error('Error loading branches:', err);
      }
    });
  }

  onCustomerChange(customerId: string): void {
    if (customerId) {
      this.accountService.getAccountsByCustomerId(customerId).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.accounts = response.data.filter(acc => acc.status === 'active');
          }
        },
        error: (err) => {
          console.error('Error loading customer accounts:', err);
        }
      });
    }
  }

  calculateMaturity(): void {
    const installment = this.dpsForm.get('monthlyInstallment')?.value;
    const tenure = this.dpsForm.get('tenureMonths')?.value;
    const rate = this.dpsForm.get('interestRate')?.value;

    if (installment && tenure && rate) {
      this.dpsService.calculateMaturity(installment, tenure, rate).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.maturityCalculation = response.data;
          }
        },
        error: (err) => {
          console.error('Error calculating maturity:', err);
        }
      });
    }
  }

  toggleMaturityCalculator(): void {
    this.showMaturityCalculator = !this.showMaturityCalculator;
    if (this.showMaturityCalculator) {
      this.calculateMaturity();
    }
  }

  onSubmit(): void {
    if (this.dpsForm.valid) {
      this.loading = true;
      this.error = '';
      this.success = '';

      const requestData: DPSCreateRequest = this.dpsForm.value;

      this.dpsService.createDPS(requestData).subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.success = 'DPS account created successfully!';
            this.loading = false;
            setTimeout(() => {
              this.router.navigate(['/dps/detail', response.data.dpsNumber]);
            }, 2000);
          }
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to create DPS account';
          this.loading = false;
          console.error('Error creating DPS:', err);
        }
      });
    } else {
      this.markFormGroupTouched(this.dpsForm);
    }
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  cancel(): void {
    this.router.navigate(['/dps']);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.dpsForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.dpsForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['min']) return `Minimum value is ${field.errors['min'].min}`;
      if (field.errors['max']) return `Maximum value is ${field.errors['max'].max}`;
    }
    return '';
  }
}