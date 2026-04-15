import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Branch } from 'src/app/core/models/branch';
import { BranchService } from 'src/app/core/services/branch.service';

@Component({
  selector: 'app-branch-detail',
  templateUrl: './branch-detail.component.html',
  styleUrls: ['./branch-detail.component.scss']
})
export class BranchDetailComponent implements OnInit {
  branch: Branch | null = null;
  loading = false;
  branchId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private branchService: BranchService
  ) { }

  ngOnInit(): void {
    this.branchId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadBranchDetails();
  }

  loadBranchDetails(): void {
    this.loading = true;
    this.branchService.getBranchById(this.branchId).subscribe({
      next: (response) => {
        this.branch = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading branch', error);
        this.loading = false;
      }
    });
  }

  editBranch(): void {
    this.router.navigate(['/branch/edit', this.branchId]);
  }

  deleteBranch(): void {
    if (confirm('Are you sure you want to delete this branch?')) {
      this.branchService.deleteBranch(this.branchId).subscribe({
        next: () => {
          this.router.navigate(['/branch/list']);
        },
        error: (error) => console.error('Error deleting branch', error)
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/branch/list']);
  }
}