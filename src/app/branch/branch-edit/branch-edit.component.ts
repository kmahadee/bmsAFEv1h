import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BranchUpdateRequest } from 'src/app/core/models/branch';
import { BranchService } from 'src/app/core/services/branch.service';

@Component({
  selector: 'app-branch-edit',
  templateUrl: './branch-edit.component.html',
  styleUrls: ['./branch-edit.component.scss']
})
export class BranchEditComponent implements OnInit {
  branchForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  success = '';
  branchId!: number;

  constructor(
    private formBuilder: FormBuilder,
    private branchService: BranchService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.branchId = Number(this.route.snapshot.paramMap.get('id'));

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
      workingHours: [''],
      status: ['active']
    });

    this.loadBranch();
  }

  get f() {
    return this.branchForm.controls;
  }

  loadBranch(): void {
    this.loading = true;
    this.branchService.getBranchById(this.branchId).subscribe({
      next: (response) => {
        const branch = response.data;
        this.branchForm.patchValue({
          branchName: branch.branchName,
          address: branch.address,
          city: branch.city,
          state: branch.state,
          zipCode: branch.zipCode,
          phone: branch.phone,
          email: branch.email,
          managerName: branch.managerName,
          managerPhone: branch.managerPhone,
          managerEmail: branch.managerEmail,
          workingHours: branch.workingHours,
          status: branch.status
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading branch', error);
        this.error = 'Failed to load branch details';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.success = '';

    if (this.branchForm.invalid) {
      return;
    }

    this.loading = true;
    const branchData: BranchUpdateRequest = this.branchForm.value;

    this.branchService.updateBranch(this.branchId, branchData).subscribe({
      next: (response) => {
        this.success = 'Branch updated successfully!';
        setTimeout(() => {
          this.router.navigate(['/branch/detail', this.branchId]);
        }, 1500);
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to update branch. Please try again.';
        this.loading = false;
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/branch/detail', this.branchId]);
  }
}