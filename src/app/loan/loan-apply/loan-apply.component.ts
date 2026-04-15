import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AccountListItem } from 'src/app/core/models/account';
import { Branch } from 'src/app/core/models/branch';
import { EligibilityCheckResult } from 'src/app/core/models/loanModels/EligibilityCheckResult.model';
import { LoanConstants } from 'src/app/core/models/loanModels/loan-constants.model';
import { LoanType, EmploymentType, ApplicantType } from 'src/app/core/models/loanModels/loan-enums.model';
import { LoanApplicationRequest } from 'src/app/core/models/loanModels/loan-request.model';
import { AccountService } from 'src/app/core/services/account.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { BranchService } from 'src/app/core/services/branch.service';
import { LoanCalculationService } from 'src/app/core/services/loan/loan-calculation.service';
import { LoanEligibilityService } from 'src/app/core/services/loan/loan-eligibility.service';
import { LoanService } from 'src/app/core/services/loan/loan.service';

@Component({
  selector: 'app-loan-apply',
  templateUrl: './loan-apply.component.html',
  styleUrls: ['./loan-apply.component.scss']
})

export class LoanApplyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  loanApplicationForm!: FormGroup;
  
  // Data arrays
  accounts: AccountListItem[] = [];
  branches: Branch[] = [];
  
  // Enums for dropdowns
  loanTypes = Object.values(LoanType);
  employmentTypes = Object.values(EmploymentType);
  applicantTypes = Object.values(ApplicantType);
  
  // Constants
  constants = LoanConstants;
  
  // Calculation results
  calculatedEMI: number = 0;
  totalInterest: number = 0;
  totalAmount: number = 0;
  
  // Eligibility check
  eligibilityResult: EligibilityCheckResult | null = null;
  existingEMI: number = 0;
  
  // UI state
  loading = false;
  calculating = false;
  checkingEligibility = false;
  currentStep = 1;
  totalSteps = 3;
  
  // Error/Success messages
  errorMessage = '';
  successMessage = '';
  
  // Current user
  customerId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private loanService: LoanService,
    private calculationService: LoanCalculationService,
    private eligibilityService: LoanEligibilityService,
    private accountService: AccountService,
    private branchService: BranchService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.customerId = this.authService.getCustomerId();
    
    if (!this.customerId) {
      this.errorMessage = 'Please login to apply for a loan';
      setTimeout(() => this.router.navigate(['/auth/login']), 2000);
      return;
    }

    this.initializeForm();
    this.loadAccounts();
    // Remove branch loading - not needed for loan application
    // Branch is automatically determined from the selected account
    this.loadExistingEMI();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize the loan application form
   */
  // initializeForm(): void {
  //   this.loanApplicationForm = this.fb.group({
  //     // Basic Information
  //     customerId: [this.customerId],
  //     loanType: ['', Validators.required],
  //     loanAmount: ['', [
  //       Validators.required,
  //       Validators.min(this.constants.MIN_LOAN_AMOUNT),
  //       Validators.max(this.constants.MAX_LOAN_AMOUNT)
  //     ]],
  //     tenureMonths: ['', [
  //       Validators.required,
  //       Validators.min(this.constants.MIN_TENURE_MONTHS),
  //       Validators.max(this.constants.MAX_TENURE_MONTHS)
  //     ]],
  //     annualInterestRate: ['', [
  //       Validators.required,
  //       Validators.min(this.constants.MIN_INTEREST_RATE),
  //       Validators.max(this.constants.MAX_INTEREST_RATE)
  //     ]],
  //     accountNumber: ['', Validators.required],
  //     applicantType: [ApplicantType.INDIVIDUAL, Validators.required],
      
  //     // Applicant Details
  //     applicantName: ['', Validators.required],
  //     age: ['', [
  //       Validators.required,
  //       Validators.min(this.constants.MIN_AGE),
  //       Validators.max(this.constants.MAX_AGE)
  //     ]],
  //     monthlyIncome: ['', [
  //       Validators.required,
  //       Validators.min(this.constants.MIN_MONTHLY_INCOME)
  //     ]],
  //     employmentType: ['', Validators.required],
  //     purpose: [''],
      
  //     // Collateral (for secured loans)
  //     collateralType: [''],
  //     collateralValue: [''],
  //     collateralDescription: [''],
      
  //     // Special fields for Import LC
  //     lcNumber: [''],
  //     beneficiaryName: [''],
  //     beneficiaryBank: [''],
  //     lcExpiryDate: [''],
  //     lcAmount: [''],
  //     purposeOfLC: [''],
  //     paymentTerms: [''],
      
  //     // Special fields for Industrial/Working Capital
  //     industryType: [''],
  //     businessRegistrationNumber: [''],
  //     businessTurnover: ['']
  //   });
  // }

  /**
   * Setup form value change listeners
   */
  setupFormListeners(): void {
    // Auto-calculate EMI when amount, rate, or tenure changes
    this.loanApplicationForm.get('loanAmount')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateEMI());
    
    this.loanApplicationForm.get('annualInterestRate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateEMI());
    
    this.loanApplicationForm.get('tenureMonths')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.calculateEMI());

    // Check eligibility when key fields change
    this.loanApplicationForm.get('loanType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateCollateralValidation();
        this.checkEligibility();
      });

    this.loanApplicationForm.get('monthlyIncome')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.checkEligibility());

    this.loanApplicationForm.get('age')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.checkEligibility());
  }

  /**
   * Load customer accounts
   */
  loadAccounts(): void {
    if (!this.customerId) return;

    this.accountService.getAccountsByCustomerId(this.customerId)
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
   * Load branches - NOT USED
   * Branch is automatically determined from selected account
   * Customers don't have permission to list all branches
   */
  // loadBranches(): void {
  //   // Removed - not needed for customer loan applications
  // }

  /**
   * Load existing EMI for eligibility check
   */
  loadExistingEMI(): void {
    this.eligibilityService.getExistingEMI()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (emi) => {
          this.existingEMI = emi;
          this.checkEligibility();
        },
        error: (error) => {
          console.error('Error loading existing EMI:', error);
        }
      });
  }

  /**
   * Update collateral validation based on loan type
   */
  updateCollateralValidation(): void {
    const loanType = this.loanApplicationForm.get('loanType')?.value;
    const isSecured = this.eligibilityService.isSecuredLoanType(loanType);

    if (isSecured) {
      this.loanApplicationForm.get('collateralType')?.setValidators([Validators.required]);
      this.loanApplicationForm.get('collateralValue')?.setValidators([
        Validators.required,
        Validators.min(1)
      ]);
    } else {
      this.loanApplicationForm.get('collateralType')?.clearValidators();
      this.loanApplicationForm.get('collateralValue')?.clearValidators();
    }

    this.loanApplicationForm.get('collateralType')?.updateValueAndValidity();
    this.loanApplicationForm.get('collateralValue')?.updateValueAndValidity();
  }

  /**
   * Calculate EMI
   */
  calculateEMI(): void {
    const amount = this.loanApplicationForm.get('loanAmount')?.value;
    const rate = this.loanApplicationForm.get('annualInterestRate')?.value;
    const tenure = this.loanApplicationForm.get('tenureMonths')?.value;

    if (amount && rate && tenure) {
      try {
        this.calculating = true;
        
        this.calculatedEMI = this.calculationService.calculateEMI(amount, rate, tenure);
        this.totalInterest = this.calculationService.calculateTotalInterest(
          this.calculatedEMI, tenure, amount
        );
        this.totalAmount = this.calculationService.calculateTotalAmount(
          this.calculatedEMI, tenure
        );

        // Trigger eligibility check with new EMI
        this.checkEligibility();
      } catch (error) {
        console.error('Error calculating EMI:', error);
      } finally {
        this.calculating = false;
      }
    }
  }

  /**
   * Check loan eligibility
   */
  checkEligibility(): void {
    const amount = this.loanApplicationForm.get('loanAmount')?.value;
    const income = this.loanApplicationForm.get('monthlyIncome')?.value;
    const age = this.loanApplicationForm.get('age')?.value;
    const rate = this.loanApplicationForm.get('annualInterestRate')?.value;
    const tenure = this.loanApplicationForm.get('tenureMonths')?.value;
    const loanType = this.loanApplicationForm.get('loanType')?.value;
    const collateralValue = this.loanApplicationForm.get('collateralValue')?.value;

    if (amount && income && age && rate && tenure) {
      this.checkingEligibility = true;

      try {
        this.eligibilityResult = this.eligibilityService.checkEligibilityQuick(
          amount,
          income,
          age,
          this.existingEMI,
          tenure,
          rate,
          collateralValue,
          loanType
        );
      } catch (error) {
        console.error('Error checking eligibility:', error);
      } finally {
        this.checkingEligibility = false;
      }
    }
  }

  /**
   * Check if loan type is secured
   */
  isSecuredLoan(): boolean {
    const loanType = this.loanApplicationForm.get('loanType')?.value;
    return this.eligibilityService.isSecuredLoanType(loanType);
  }

  /**
   * Check if loan type is Import LC
   */
  isImportLCLoan(): boolean {
    return this.loanApplicationForm.get('loanType')?.value === LoanType.IMPORT_LC_LOAN;
  }

  /**
   * Check if loan type is Industrial/Working Capital
   */
  isIndustrialLoan(): boolean {
    const loanType = this.loanApplicationForm.get('loanType')?.value;
    return loanType === LoanType.INDUSTRIAL_LOAN || 
           loanType === LoanType.WORKING_CAPITAL_LOAN;
  }

  /**
   * Navigate to next step
   */
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  /**
   * Navigate to previous step
   */
  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  /**
   * Submit loan application
   */
  // submitApplication(): void {
  //   if (this.loanApplicationForm.invalid) {
  //     this.loanApplicationForm.markAllAsTouched();
  //     this.errorMessage = 'Please fill all required fields correctly';
  //     return;
  //   }

  //   if (!this.eligibilityResult?.isEligible) {
  //     this.errorMessage = 'You are not eligible for this loan amount. Please review the eligibility criteria.';
  //     return;
  //   }

  //   this.loading = true;
  //   this.errorMessage = '';
  //   this.successMessage = '';

  //   const request: LoanApplicationRequest = this.loanApplicationForm.value;

  //   this.loanService.applyForLoan(request)
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next: (response) => {
  //         if (response.success) {
  //           this.successMessage = 'Loan application submitted successfully!';
  //           this.loading = false;
            
  //           // Navigate to loan details after 2 seconds
  //           setTimeout(() => {
  //             this.router.navigate(['/loans/details', response.data.loanId]);
  //           }, 2000);
  //         }
  //       },
  //       error: (error) => {
  //         this.loading = false;
  //         this.errorMessage = error.message || 'Failed to submit loan application. Please try again.';
  //         console.error('Loan application error:', error);
  //       }
  //     });
  // }

  /**
   * Reset form
   */
  resetForm(): void {
    this.loanApplicationForm.reset();
    this.currentStep = 1;
    this.calculatedEMI = 0;
    this.totalInterest = 0;
    this.totalAmount = 0;
    this.eligibilityResult = null;
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Get form control
   */
  getControl(name: string) {
    return this.loanApplicationForm.get(name);
  }

  /**
   * Check if field is invalid
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loanApplicationForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }



  initializeForm(): void {
  this.loanApplicationForm = this.fb.group({
    // Basic Information
    customerId: [this.customerId],
    loanType: ['', Validators.required],
    loanAmount: ['', [
      Validators.required,
      Validators.min(this.constants.MIN_LOAN_AMOUNT),
      Validators.max(this.constants.MAX_LOAN_AMOUNT)
    ]],
    tenureMonths: ['', [
      Validators.required,
      Validators.min(this.constants.MIN_TENURE_MONTHS),
      Validators.max(this.constants.MAX_TENURE_MONTHS)
    ]],
    annualInterestRate: ['', [
      Validators.required,
      Validators.min(this.constants.MIN_INTEREST_RATE),
      Validators.max(this.constants.MAX_INTEREST_RATE)
    ]],
    accountNumber: ['', Validators.required],
    applicantType: [ApplicantType.INDIVIDUAL, Validators.required],
    
    // Applicant Details
    applicantName: ['', Validators.required],
    age: ['', [
      Validators.required,
      Validators.min(this.constants.MIN_AGE),
      Validators.max(this.constants.MAX_AGE)
    ]],
    monthlyIncome: ['', [
      Validators.required,
      Validators.min(this.constants.MIN_MONTHLY_INCOME)
    ]],
    employmentType: ['', Validators.required],
    purpose: [''],
    
    // Collateral (for secured loans)
    collateralType: [''],
    collateralValue: [''],
    collateralDescription: [''],
    
    // Special fields for Import LC
    lcNumber: [''],
    beneficiaryName: [''],
    beneficiaryBank: [''],
    lcExpiryDate: [''],
    lcAmount: [''],
    purposeOfLC: [''],
    paymentTerms: [''],
    
    // Special fields for Industrial/Working Capital
    industryType: [''],
    businessRegistrationNumber: [''],
    businessTurnover: [''],
    
    // ADD THIS - Missing documentTypes field
    documentTypes: [[]]  // Initialize as empty array
  });
}

/**
 * Submit loan application - UPDATED VERSION
 */
submitApplication(): void {
  // Mark all fields as touched to show validation errors
  this.loanApplicationForm.markAllAsTouched();
  
  // Log form validity for debugging
  console.log('Form valid:', this.loanApplicationForm.valid);
  console.log('Form errors:', this.loanApplicationForm.errors);
  console.log('Form value:', this.loanApplicationForm.value);
  
  // Check each control for errors
  Object.keys(this.loanApplicationForm.controls).forEach(key => {
    const control = this.loanApplicationForm.get(key);
    if (control && control.invalid) {
      console.log(`Invalid field: ${key}`, control.errors);
    }
  });

  if (this.loanApplicationForm.invalid) {
    this.errorMessage = 'Please fill all required fields correctly';
    // Scroll to top to show error message
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (!this.eligibilityResult?.isEligible) {
    this.errorMessage = 'You are not eligible for this loan amount. Please review the eligibility criteria.';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  this.loading = true;
  this.errorMessage = '';
  this.successMessage = '';

  // Clean up the request - remove empty optional fields
  const formValue = this.loanApplicationForm.value;
  const request: LoanApplicationRequest = {
    ...formValue,
    // Ensure documentTypes is an array
    documentTypes: formValue.documentTypes || []
  };

  // Remove null/undefined optional fields
  Object.keys(request).forEach(key => {
    if (request[key as keyof LoanApplicationRequest] === '' || 
        request[key as keyof LoanApplicationRequest] === null || 
        request[key as keyof LoanApplicationRequest] === undefined) {
      delete request[key as keyof LoanApplicationRequest];
    }
  });

  console.log('Submitting request:', request);

  this.loanService.applyForLoan(request)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Loan application submitted successfully!';
          this.loading = false;
          
          // Navigate to loan details after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/loans/details', response.data.loanId]);
          }, 2000);
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || error.message || 'Failed to submit loan application. Please try again.';
        console.error('Loan application error:', error);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
}
}



// export class LoanApplyComponent implements OnInit, OnDestroy {
//   private destroy$ = new Subject<void>();

//   loanApplicationForm!: FormGroup;
  
//   // Data arrays
//   accounts: AccountListItem[] = [];
//   branches: Branch[] = [];
  
//   // Enums for dropdowns
//   loanTypes = Object.values(LoanType);
//   employmentTypes = Object.values(EmploymentType);
//   applicantTypes = Object.values(ApplicantType);
  
//   // Constants
//   constants = LoanConstants;
  
//   // Calculation results
//   calculatedEMI: number = 0;
//   totalInterest: number = 0;
//   totalAmount: number = 0;
  
//   // Eligibility check
//   eligibilityResult: EligibilityCheckResult | null = null;
//   existingEMI: number = 0;
  
//   // UI state
//   loading = false;
//   calculating = false;
//   checkingEligibility = false;
//   currentStep = 1;
//   totalSteps = 3;
  
//   // Error/Success messages
//   errorMessage = '';
//   successMessage = '';
  
//   // Current user
//   customerId: string | null = null;

//   constructor(
//     private fb: FormBuilder,
//     private loanService: LoanService,
//     private calculationService: LoanCalculationService,
//     private eligibilityService: LoanEligibilityService,
//     private accountService: AccountService,
//     private branchService: BranchService,
//     private authService: AuthService,
//     private router: Router
//   ) { }

//   ngOnInit(): void {
//     this.customerId = this.authService.getCustomerId();
    
//     if (!this.customerId) {
//       this.errorMessage = 'Please login to apply for a loan';
//       setTimeout(() => this.router.navigate(['/auth/login']), 2000);
//       return;
//     }

//     this.initializeForm();
//     this.loadAccounts();
//     this.loadBranches();
//     this.loadExistingEMI();
//     this.setupFormListeners();
//   }

//   ngOnDestroy(): void {
//     this.destroy$.next();
//     this.destroy$.complete();
//   }

//   /**
//    * Initialize the loan application form
//    */
//   initializeForm(): void {
//     this.loanApplicationForm = this.fb.group({
//       // Basic Information
//       customerId: [this.customerId],
//       loanType: ['', Validators.required],
//       loanAmount: ['', [
//         Validators.required,
//         Validators.min(this.constants.MIN_LOAN_AMOUNT),
//         Validators.max(this.constants.MAX_LOAN_AMOUNT)
//       ]],
//       tenureMonths: ['', [
//         Validators.required,
//         Validators.min(this.constants.MIN_TENURE_MONTHS),
//         Validators.max(this.constants.MAX_TENURE_MONTHS)
//       ]],
//       annualInterestRate: ['', [
//         Validators.required,
//         Validators.min(this.constants.MIN_INTEREST_RATE),
//         Validators.max(this.constants.MAX_INTEREST_RATE)
//       ]],
//       accountNumber: ['', Validators.required],
//       applicantType: [ApplicantType.INDIVIDUAL, Validators.required],
      
//       // Applicant Details
//       applicantName: ['', Validators.required],
//       age: ['', [
//         Validators.required,
//         Validators.min(this.constants.MIN_AGE),
//         Validators.max(this.constants.MAX_AGE)
//       ]],
//       monthlyIncome: ['', [
//         Validators.required,
//         Validators.min(this.constants.MIN_MONTHLY_INCOME)
//       ]],
//       employmentType: ['', Validators.required],
//       purpose: [''],
      
//       // Collateral (for secured loans)
//       collateralType: [''],
//       collateralValue: [''],
//       collateralDescription: [''],
      
//       // Special fields for Import LC
//       lcNumber: [''],
//       beneficiaryName: [''],
//       beneficiaryBank: [''],
//       lcExpiryDate: [''],
//       lcAmount: [''],
//       purposeOfLC: [''],
//       paymentTerms: [''],
      
//       // Special fields for Industrial/Working Capital
//       industryType: [''],
//       businessRegistrationNumber: [''],
//       businessTurnover: ['']
//     });
//   }

//   /**
//    * Setup form value change listeners
//    */
//   setupFormListeners(): void {
//     // Auto-calculate EMI when amount, rate, or tenure changes
//     this.loanApplicationForm.get('loanAmount')?.valueChanges
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(() => this.calculateEMI());
    
//     this.loanApplicationForm.get('annualInterestRate')?.valueChanges
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(() => this.calculateEMI());
    
//     this.loanApplicationForm.get('tenureMonths')?.valueChanges
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(() => this.calculateEMI());

//     // Check eligibility when key fields change
//     this.loanApplicationForm.get('loanType')?.valueChanges
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(() => {
//         this.updateCollateralValidation();
//         this.checkEligibility();
//       });

//     this.loanApplicationForm.get('monthlyIncome')?.valueChanges
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(() => this.checkEligibility());

//     this.loanApplicationForm.get('age')?.valueChanges
//       .pipe(takeUntil(this.destroy$))
//       .subscribe(() => this.checkEligibility());
//   }

//   /**
//    * Load customer accounts
//    */
//   loadAccounts(): void {
//     if (!this.customerId) return;

//     this.accountService.getAccountsByCustomerId(this.customerId)
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
//    * Load branches
//    */
//   loadBranches(): void {
//     this.branchService.getAllBranches()
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (response) => {
//           if (response.success) {
//             this.branches = response.data.filter(branch => branch.status === 'active');
//           }
//         },
//         error: (error) => {
//           console.error('Error loading branches:', error);
//         }
//       });
//   }

//   /**
//    * Load existing EMI for eligibility check
//    */
//   loadExistingEMI(): void {
//     this.eligibilityService.getExistingEMI()
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (emi) => {
//           this.existingEMI = emi;
//           this.checkEligibility();
//         },
//         error: (error) => {
//           console.error('Error loading existing EMI:', error);
//         }
//       });
//   }

//   /**
//    * Update collateral validation based on loan type
//    */
//   updateCollateralValidation(): void {
//     const loanType = this.loanApplicationForm.get('loanType')?.value;
//     const isSecured = this.eligibilityService.isSecuredLoanType(loanType);

//     if (isSecured) {
//       this.loanApplicationForm.get('collateralType')?.setValidators([Validators.required]);
//       this.loanApplicationForm.get('collateralValue')?.setValidators([
//         Validators.required,
//         Validators.min(1)
//       ]);
//     } else {
//       this.loanApplicationForm.get('collateralType')?.clearValidators();
//       this.loanApplicationForm.get('collateralValue')?.clearValidators();
//     }

//     this.loanApplicationForm.get('collateralType')?.updateValueAndValidity();
//     this.loanApplicationForm.get('collateralValue')?.updateValueAndValidity();
//   }

//   /**
//    * Calculate EMI
//    */
//   calculateEMI(): void {
//     const amount = this.loanApplicationForm.get('loanAmount')?.value;
//     const rate = this.loanApplicationForm.get('annualInterestRate')?.value;
//     const tenure = this.loanApplicationForm.get('tenureMonths')?.value;

//     if (amount && rate && tenure) {
//       try {
//         this.calculating = true;
        
//         this.calculatedEMI = this.calculationService.calculateEMI(amount, rate, tenure);
//         this.totalInterest = this.calculationService.calculateTotalInterest(
//           this.calculatedEMI, tenure, amount
//         );
//         this.totalAmount = this.calculationService.calculateTotalAmount(
//           this.calculatedEMI, tenure
//         );

//         // Trigger eligibility check with new EMI
//         this.checkEligibility();
//       } catch (error) {
//         console.error('Error calculating EMI:', error);
//       } finally {
//         this.calculating = false;
//       }
//     }
//   }

//   /**
//    * Check loan eligibility
//    */
//   checkEligibility(): void {
//     const amount = this.loanApplicationForm.get('loanAmount')?.value;
//     const income = this.loanApplicationForm.get('monthlyIncome')?.value;
//     const age = this.loanApplicationForm.get('age')?.value;
//     const rate = this.loanApplicationForm.get('annualInterestRate')?.value;
//     const tenure = this.loanApplicationForm.get('tenureMonths')?.value;
//     const loanType = this.loanApplicationForm.get('loanType')?.value;
//     const collateralValue = this.loanApplicationForm.get('collateralValue')?.value;

//     if (amount && income && age && rate && tenure) {
//       this.checkingEligibility = true;

//       try {
//         this.eligibilityResult = this.eligibilityService.checkEligibilityQuick(
//           amount,
//           income,
//           age,
//           this.existingEMI,
//           tenure,
//           rate,
//           collateralValue,
//           loanType
//         );
//       } catch (error) {
//         console.error('Error checking eligibility:', error);
//       } finally {
//         this.checkingEligibility = false;
//       }
//     }
//   }

//   /**
//    * Check if loan type is secured
//    */
//   isSecuredLoan(): boolean {
//     const loanType = this.loanApplicationForm.get('loanType')?.value;
//     return this.eligibilityService.isSecuredLoanType(loanType);
//   }

//   /**
//    * Check if loan type is Import LC
//    */
//   isImportLCLoan(): boolean {
//     return this.loanApplicationForm.get('loanType')?.value === LoanType.IMPORT_LC_LOAN;
//   }

//   /**
//    * Check if loan type is Industrial/Working Capital
//    */
//   isIndustrialLoan(): boolean {
//     const loanType = this.loanApplicationForm.get('loanType')?.value;
//     return loanType === LoanType.INDUSTRIAL_LOAN || 
//            loanType === LoanType.WORKING_CAPITAL_LOAN;
//   }

//   /**
//    * Navigate to next step
//    */
//   nextStep(): void {
//     if (this.currentStep < this.totalSteps) {
//       this.currentStep++;
//     }
//   }

//   /**
//    * Navigate to previous step
//    */
//   previousStep(): void {
//     if (this.currentStep > 1) {
//       this.currentStep--;
//     }
//   }

//   /**
//    * Submit loan application
//    */
//   submitApplication(): void {
//     if (this.loanApplicationForm.invalid) {
//       this.loanApplicationForm.markAllAsTouched();
//       this.errorMessage = 'Please fill all required fields correctly';
//       return;
//     }

//     if (!this.eligibilityResult?.isEligible) {
//       this.errorMessage = 'You are not eligible for this loan amount. Please review the eligibility criteria.';
//       return;
//     }

//     this.loading = true;
//     this.errorMessage = '';
//     this.successMessage = '';

//     const request: LoanApplicationRequest = this.loanApplicationForm.value;

//     this.loanService.applyForLoan(request)
//       .pipe(takeUntil(this.destroy$))
//       .subscribe({
//         next: (response) => {
//           if (response.success) {
//             this.successMessage = 'Loan application submitted successfully!';
//             this.loading = false;
            
//             // Navigate to loan details after 2 seconds
//             setTimeout(() => {
//               this.router.navigate(['/loans/details', response.data.loanId]);
//             }, 2000);
//           }
//         },
//         error: (error) => {
//           this.loading = false;
//           this.errorMessage = error.message || 'Failed to submit loan application. Please try again.';
//           console.error('Loan application error:', error);
//         }
//       });










      
//   }

//   /**
//    * Reset form
//    */
//   resetForm(): void {
//     this.loanApplicationForm.reset();
//     this.currentStep = 1;
//     this.calculatedEMI = 0;
//     this.totalInterest = 0;
//     this.totalAmount = 0;
//     this.eligibilityResult = null;
//     this.errorMessage = '';
//     this.successMessage = '';
//   }

//   /**
//    * Get form control
//    */
//   getControl(name: string) {
//     return this.loanApplicationForm.get(name);
//   }

//   /**
//    * Check if field is invalid
//    */
//   isFieldInvalid(fieldName: string): boolean {
//     const field = this.loanApplicationForm.get(fieldName);
//     return !!(field && field.invalid && (field.dirty || field.touched));
//   }
// }
