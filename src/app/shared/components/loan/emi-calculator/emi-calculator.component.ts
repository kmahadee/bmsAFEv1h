import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { LoanConstants } from 'src/app/core/models/loanModels/loan-constants.model';
import { LoanCalculationService } from 'src/app/core/services/loan/loan-calculation.service';
import { LoanEligibilityService } from 'src/app/core/services/loan/loan-eligibility.service';

@Component({
  selector: 'app-emi-calculator',
  templateUrl: './emi-calculator.component.html',
  styleUrls: ['./emi-calculator.component.scss']
})
export class EmiCalculatorComponent implements OnInit {
  @Output() calculationResult = new EventEmitter<any>();

  calculatorForm!: FormGroup;
  showResults: boolean = false;
  
  calculatedEMI: number = 0;
  totalInterest: number = 0;
  totalAmount: number = 0;
  amortizationSchedule: any[] = [];
  showSchedule: boolean = false;

  // Constants for validation
  readonly MIN_LOAN_AMOUNT = LoanConstants.MIN_LOAN_AMOUNT;
  readonly MAX_LOAN_AMOUNT = LoanConstants.MAX_LOAN_AMOUNT;
  readonly MIN_TENURE = LoanConstants.MIN_TENURE_MONTHS;
  readonly MAX_TENURE = LoanConstants.MAX_TENURE_MONTHS;
  readonly MIN_RATE = LoanConstants.MIN_INTEREST_RATE;
  readonly MAX_RATE = LoanConstants.MAX_INTEREST_RATE;

  constructor(
    private fb: FormBuilder,
    private calculationService: LoanCalculationService,
    private eligibilityService: LoanEligibilityService
  ) { }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.calculatorForm = this.fb.group({
      loanAmount: [
        500000,
        [
          Validators.required,
          Validators.min(this.MIN_LOAN_AMOUNT),
          Validators.max(this.MAX_LOAN_AMOUNT)
        ]
      ],
      interestRate: [
        9.5,
        [
          Validators.required,
          Validators.min(this.MIN_RATE),
          Validators.max(this.MAX_RATE)
        ]
      ],
      tenureMonths: [
        120,
        [
          Validators.required,
          Validators.min(this.MIN_TENURE),
          Validators.max(this.MAX_TENURE)
        ]
      ]
    });
  }

  calculateEMI(): void {
    if (this.calculatorForm.invalid) {
      this.calculatorForm.markAllAsTouched();
      return;
    }

    const { loanAmount, interestRate, tenureMonths } = this.calculatorForm.value;

    try {
      this.calculatedEMI = this.calculationService.calculateEMI(
        loanAmount,
        interestRate,
        tenureMonths
      );

      this.totalInterest = this.calculationService.calculateTotalInterest(
        this.calculatedEMI,
        tenureMonths,
        loanAmount
      );

      this.totalAmount = this.calculationService.calculateTotalAmount(
        this.calculatedEMI,
        tenureMonths
      );

      this.showResults = true;

      // Emit result
      this.calculationResult.emit({
        emi: this.calculatedEMI,
        totalInterest: this.totalInterest,
        totalAmount: this.totalAmount,
        principal: loanAmount,
        rate: interestRate,
        tenure: tenureMonths
      });
    } catch (error) {
      console.error('EMI calculation error:', error);
    }
  }

  generateSchedule(): void {
    const { loanAmount, interestRate, tenureMonths } = this.calculatorForm.value;

    this.amortizationSchedule = this.calculationService.generateAmortizationSchedule(
      loanAmount,
      interestRate,
      tenureMonths
    );

    this.showSchedule = true;
  }

  resetCalculator(): void {
    this.calculatorForm.reset({
      loanAmount: 500000,
      interestRate: 9.5,
      tenureMonths: 120
    });
    this.showResults = false;
    this.showSchedule = false;
    this.amortizationSchedule = [];
  }

  formatCurrency(amount: number): string {
    return this.calculationService.formatCurrency(amount);
  }

  getTenureInYears(): number {
    const months = this.calculatorForm.get('tenureMonths')?.value || 0;
    return Math.floor(months / 12);
  }

  getTenureRemainingMonths(): number {
    const months = this.calculatorForm.get('tenureMonths')?.value || 0;
    return months % 12;
  }

  getInterestPercentage(): number {
    if (this.totalAmount === 0) return 0;
    return (this.totalInterest / this.totalAmount) * 100;
  }

  getPrincipalPercentage(): number {
    if (this.totalAmount === 0) return 0;
    const principal = this.calculatorForm.get('loanAmount')?.value || 0;
    return (principal / this.totalAmount) * 100;
  }
}
