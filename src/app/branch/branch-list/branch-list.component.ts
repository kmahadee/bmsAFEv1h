import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BranchService } from 'src/app/core/services/branch.service';
import { Branch } from 'src/app/core/models/branch';


@Component({
  selector: 'app-branch-list',
  templateUrl: './branch-list.component.html',
  styleUrls: ['./branch-list.component.scss']
})
export class BranchListComponent implements OnInit {
  branches: Branch[] = [];
  filteredBranches: Branch[] = [];
  loading = false;
  searchTerm = '';
  selectedStatus = 'all';
  selectedCity = 'all';
  cities: string[] = [];

  constructor(
    private branchService: BranchService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadBranches();
  }

  loadBranches(): void {
    this.loading = true;
    this.branchService.getAllBranches().subscribe({
      next: (response) => {
        this.branches = response.data;
        this.filteredBranches = this.branches;
        this.extractCities();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading branches', error);
        this.loading = false;
      }
    });
  }

  extractCities(): void {
    const citySet = new Set(this.branches.map(b => b.city));
    this.cities = Array.from(citySet).sort();
  }

  onSearch(): void {
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.branches];

    // Filter by status
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(branch => branch.status === this.selectedStatus);
    }

    // Filter by city
    if (this.selectedCity !== 'all') {
      filtered = filtered.filter(branch => branch.city === this.selectedCity);
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(branch =>
        branch.branchName.toLowerCase().includes(term) ||
        branch.branchCode.toLowerCase().includes(term) ||
        branch.ifscCode.toLowerCase().includes(term) ||
        branch.city.toLowerCase().includes(term) ||
        branch.state.toLowerCase().includes(term)
      );
    }

    this.filteredBranches = filtered;
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  onCityChange(): void {
    this.applyFilters();
  }

  viewBranch(id: number): void {
    this.router.navigate(['/branch/detail', id]);
  }

  editBranch(id: number): void {
    this.router.navigate(['/branch/edit', id]);
  }

  deleteBranch(id: number): void {
    if (confirm('Are you sure you want to delete this branch?')) {
      this.branchService.deleteBranch(id).subscribe({
        next: () => {
          this.loadBranches();
        },
        error: (error) => console.error('Error deleting branch', error)
      });
    }
  }

  createBranch(): void {
    this.router.navigate(['/branch/create']);
  }
}

