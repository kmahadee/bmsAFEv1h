import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { LOAN_TYPE_LABELS, LOAN_STATUS_LABELS } from 'src/app/core/models/loanModels/loan-constants.model';
import { LoanType, LoanStatus } from 'src/app/core/models/loanModels/loan-enums.model';
import { LoanSearchRequest } from 'src/app/core/models/loanModels/loan-request.model';

@Component({
  selector: 'app-loan-filter',
  templateUrl: './loan-filter.component.html',
  styleUrls: ['./loan-filter.component.scss']
})
export class LoanFilterComponent implements OnInit {
  @Output() filterChange = new EventEmitter<LoanSearchRequest>();
  @Output() filterReset = new EventEmitter<void>();

  filterForm!: FormGroup;
  showAdvancedFilters: boolean = false;

  // Enum options
  loanTypes = Object.keys(LoanType).map(key => ({
    value: key,
    label: LOAN_TYPE_LABELS[key] || key
  }));

  loanStatuses = Object.keys(LoanStatus).map(key => ({
    value: key,
    label: LOAN_STATUS_LABELS[key] || key
  }));

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.filterForm = this.fb.group({
      customerId: [''],
      loanType: [''],
      loanStatus: [''],
      pageNumber: [0],
      pageSize: [20]
    });

    // Subscribe to form changes
    this.filterForm.valueChanges.subscribe(() => {
      this.applyFilters();
    });
  }

  applyFilters(): void {
    const filters: LoanSearchRequest = {
      ...this.filterForm.value,
      customerId: this.filterForm.value.customerId || undefined,
      loanType: this.filterForm.value.loanType || undefined,
      loanStatus: this.filterForm.value.loanStatus || undefined
    };

    this.filterChange.emit(filters);
  }

  resetFilters(): void {
    this.filterForm.reset({
      customerId: '',
      loanType: '',
      loanStatus: '',
      pageNumber: 0,
      pageSize: 20
    });
    this.showAdvancedFilters = false;
    this.filterReset.emit();
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  hasActiveFilters(): boolean {
    const values = this.filterForm.value;
    return !!(values.customerId || values.loanType || values.loanStatus);
  }
}
