import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { BranchCreateRequest } from 'src/app/core/models/branch';
import { BranchService } from 'src/app/core/services/branch.service';

@Component({
  selector: 'app-branch-create',
  templateUrl: './branch-create.component.html',
  styleUrls: ['./branch-create.component.scss']
})
export class BranchCreateComponent implements OnInit {
  branchForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  success = '';

  constructor(
    private formBuilder: FormBuilder,
    private branchService: BranchService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.branchForm = this.formBuilder.group({
      branchName: ['', [Validators.required, Validators.minLength(3)]],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', [Validators.required, Validators.pattern(/^\d{3,10}$/)]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
      email: ['', [Validators.required, Validators.email]],
      managerName: [''],
      managerPhone: ['', Validators.pattern(/^\+?[1-9]\d{1,14}$/)],
      managerEmail: ['', Validators.email],
      ifscCode: ['', [Validators.required, Validators.pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/)]],
      swiftCode: [''],
      workingHours: [''],
      isMainBranch: [false]
    });
  }

  get f() {
    return this.branchForm.controls;
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.success = '';

    if (this.branchForm.invalid) {
      return;
    }

    this.loading = true;
    const branchData: BranchCreateRequest = this.branchForm.value;

    this.branchService.createBranch(branchData).subscribe({
      next: (response) => {
        this.success = 'Branch created successfully!';
        setTimeout(() => {
          this.router.navigate(['/branch/detail', response.data.id]);
        }, 1500);
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to create branch. Please try again.';
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/branch/list']);
  }
}